const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const crypto = require('crypto');

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4NjEzMywiZXhwIjoyMDk4MjYyMTMzfQ.M4cllbXRDvqgCt5T7_yFjnT4seIYU-Va7Bs6PhRDu-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const OAB_CARGO_ID = '63fbd266-3c2d-4b91-85b7-25402ff2ac1f';
const OAB_EXAM_ID = 'd89054c2-4514-43de-9695-a71934512270';

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

const romanNumerals = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
  'XXXI', 'XXXII', 'XXXIII', 'XXXIV', 'XXXV', 'XXXVI', 'XXXVII', 'XXXVIII', 'XXXIX', 'XL',
  'XLI', 'XLII', 'XLIII', 'XLIV', 'XLV', 'XLVI', 'XLVII', 'XLVIII', 'XLIX', 'L'
];

async function main() {
  console.log('--- INICIANDO IMPORTAÇÃO COMPLETA DA PLANILHA OAB V2 (47 EXAMES UNIFICADOS) ---');
  const filePath = path.join(__dirname, 'planilha-questoes-OAB-todas-v2.xlsx');
  const wb = xlsx.readFile(filePath);

  // 1. Obter simulados existentes da OAB
  const { data: dbSimulados, error: simErr } = await supabase
    .from('simulados')
    .select('id, year, prova_url')
    .eq('exam_id', OAB_EXAM_ID)
    .order('year', { ascending: false });

  if (simErr) {
    throw new Error('Erro ao listar simulados: ' + simErr.message);
  }

  console.log(`Carregados ${dbSimulados.length} simulados da OAB do banco de dados.`);

  // 2. Mapeamento 1:1 rigoroso dos 47 exames
  const examMap = new Map(); // exameNum -> simuladoId
  const usedSimuladoIds = new Set();

  for (let i = 1; i <= 47; i++) {
    const roman = romanNumerals[i];
    const regexRoman = new RegExp('(?:^|\\s|-)' + roman + '\\s+(?:Exame|da Ordem)', 'i');
    const regexNum = new RegExp('(?:^|\\s|-)' + i + 'º\\s+Exame', 'i');

    const matches = dbSimulados.filter(s => {
      const p = s.prova_url || '';
      return (regexRoman.test(p) || regexNum.test(p)) && p.includes('Unificado');
    });

    let chosen = null;
    if (matches.length > 0) {
      chosen = matches.find(m => m.prova_url.startsWith('OAB - ')) || matches[0];
    } else {
      // Fallback sem exigir a palavra 'Unificado'
      const fallbackMatches = dbSimulados.filter(s => {
        const p = s.prova_url || '';
        return regexRoman.test(p) || regexNum.test(p);
      });
      chosen = fallbackMatches.find(m => m.prova_url.startsWith('OAB - ')) || fallbackMatches[0];
    }

    if (chosen) {
      examMap.set(i, chosen.id);
      usedSimuladoIds.add(chosen.id);
      console.log(`Mapeado OAB ${i} (${roman}) -> Simulado ${chosen.id} (${chosen.prova_url})`);
    } else {
      console.error(`ERRO: Simulado para OAB ${i} (${roman}) não encontrado!`);
    }
  }

  console.log(`\nMapeamento concluído: ${examMap.size}/47 exames mapeados para ${usedSimuladoIds.size} simulados únicos.`);
  if (examMap.size !== 47 || usedSimuladoIds.size !== 47) {
    throw new Error('Mapeamento não é estritamente 1:1 (47 exames únicos). Abortando.');
  }

  // 3. Limpar questões antigas da OAB em simulado_questions e questoes
  console.log('\nLimpando questões OAB anteriores...');
  const simIds = [...usedSimuladoIds];
  
  for (let i = 0; i < simIds.length; i += 20) {
    const chunk = simIds.slice(i, i + 20);
    const { error: delSqErr } = await supabase
      .from('simulado_questions')
      .delete()
      .in('simulado_id', chunk);
    if (delSqErr) console.warn('Aviso delete simulado_questions:', delSqErr.message);
  }

  const { error: delQErr } = await supabase
    .from('questoes')
    .delete()
    .eq('cargo_id', OAB_CARGO_ID);
  if (delQErr) console.warn('Aviso delete questoes:', delQErr.message);

  console.log('Limpeza concluída com sucesso.');

  // 4. Inserir as questões das 47 folhas
  let totalSimuladoQuestionsInserted = 0;
  let totalQuestoesInserted = 0;

  for (let exameNum = 1; exameNum <= 47; exameNum++) {
    const sheetName = `OAB ${exameNum}`;
    const sheet = wb.Sheets[sheetName];
    if (!sheet) {
      console.warn(`Folha ${sheetName} não encontrada no arquivo.`);
      continue;
    }

    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    if (rows.length === 0) {
      console.warn(`Folha ${sheetName} está vazia.`);
      continue;
    }

    const simuladoId = examMap.get(exameNum);
    const sqBatch = [];
    const qBatch = [];

    for (const r of rows) {
      const idUnico = (r['ID único'] || '').trim();
      const enunciado = (r['Enunciado'] || '').trim();
      const gabarito = (r['Alternativa correta'] || 'A').toString().trim().toUpperCase();
      const materia = (r['Matéria'] || '').trim();
      const tema = (r['Tema'] || '').trim();
      const questaoNum = Number(r['Questão']) || null;
      const ano = Number(r['Ano']) || 2024;
      const banca = (r['Banca'] || 'FGV').trim();
      const prova = (r['Prova'] || '').trim();
      const baseLegal = (r['Base legal'] || '').trim();
      const codQconcursos = (r['Código Qconcursos'] || '').trim();
      const dificuldade = (r['Dificuldade (Qconcursos)'] || 'Médio').trim();
      const status = (r['Status'] || 'Válida').trim();
      const fonte = (r['Fonte'] || '').trim();
      const observacao = (r['Observação'] || '').trim();
      const comCorreta = (r['Comentário (alternativa correta)'] || '').trim();
      const comIncorretas = (r['Comentário (alternativas incorretas)'] || '').trim();

      const options = {
        A: (r['Alternativa A'] || '').toString().trim(),
        B: (r['Alternativa B'] || '').toString().trim(),
        C: (r['Alternativa C'] || '').toString().trim(),
        D: (r['Alternativa D'] || '').toString().trim(),
      };
      if (r['Alternativa E']) {
        options.E = r['Alternativa E'].toString().trim();
      }

      sqBatch.push({
        simulado_id: simuladoId,
        text: enunciado,
        options,
        correct_comment: comCorreta || null,
        incorrect_comment: comIncorretas || null,
        disciplina: materia || 'Direito Geral',
        assunto: tema || 'Geral',
        gabarito: gabarito,
        numero_questao: questaoNum,
        base_legal: baseLegal || null,
        id_externo: idUnico || null,
        codigo_externo: codQconcursos || null,
        dificuldade: dificuldade || null,
        status: status || null,
        fonte: fonte || null,
        observacao: observacao || null,
      });

      const fullComentario = [
        comCorreta ? `Gabarito Comentado:\n${comCorreta}` : '',
        comIncorretas ? `Análise das Demais Alternativas:\n${comIncorretas}` : '',
        baseLegal ? `Base Legal:\n${baseLegal}` : '',
      ].filter(Boolean).join('\n\n') || null;

      const hashDedup = sha256(`${idUnico || prova}_${questaoNum}_${enunciado.substring(0, 50)}`);

      qBatch.push({
        cargo: 'Advogado (Exame de Ordem)',
        cargo_id: OAB_CARGO_ID,
        origem: 'oab_v2',
        nivel: dificuldade || 'Médio',
        disciplina: materia || 'Direito Geral',
        assunto: tema || 'Geral',
        tema: tema || 'Geral',
        ano: ano,
        banca: banca,
        orgao: 'OAB',
        prova: prova,
        numero_questao: questaoNum ? String(questaoNum) : null,
        enunciado: enunciado,
        alt_a: options.A || null,
        alt_b: options.B || null,
        alt_c: options.C || null,
        alt_d: options.D || null,
        alt_e: options.E || null,
        gabarito_oficial: gabarito,
        gabarito_comentado: fullComentario,
        id_externo: idUnico || null,
        base_legal: baseLegal || null,
        fonte: fonte || null,
        observacao: observacao || null,
        status_questao: status || null,
        hash_dedup: hashDedup,
        ativo: true,
      });
    }

    // Inserir simulado_questions
    const { error: insSqErr } = await supabase
      .from('simulado_questions')
      .insert(sqBatch);

    if (insSqErr) {
      console.error(`Erro inserindo simulado_questions ${sheetName}:`, insSqErr.message);
    } else {
      totalSimuladoQuestionsInserted += sqBatch.length;
    }

    // Inserir questoes
    const { error: insQErr } = await supabase
      .from('questoes')
      .insert(qBatch);

    if (insQErr) {
      console.error(`Erro inserindo questoes ${sheetName}:`, insQErr.message);
    } else {
      totalQuestoesInserted += qBatch.length;
    }

    console.log(`[${exameNum}/47] ${sheetName} -> ${rows.length} questões inseridas (Simulado: ${simuladoId})`);
  }

  // 5. Atualizar métricas no cargo OAB
  console.log('\nAtualizando métricas em questoes_cargos...');
  const { error: updErr } = await supabase
    .from('questoes_cargos')
    .update({
      total_questoes: totalQuestoesInserted,
      updated_at: new Date().toISOString()
    })
    .eq('id', OAB_CARGO_ID);

  if (updErr) {
    console.warn('Erro ao atualizar questoes_cargos:', updErr.message);
  }

  console.log('\n--- SUCESSO TOTAL ---');
  console.log(`Total de simulado_questions inseridas: ${totalSimuladoQuestionsInserted}`);
  console.log(`Total de questoes inseridas: ${totalQuestoesInserted}`);
}

main().catch(console.error);
