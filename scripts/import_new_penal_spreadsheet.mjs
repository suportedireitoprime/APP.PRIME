import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

function colToIndex(col) {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx - 1;
}

function decodeXml(str) {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function parseWorksheetXml(xmlContent) {
  const rowRegex = /<row\b[^>]*?\br="(\d+)"[^>]*?>(.*?)<\/row>/gs;
  let rowMatch;
  const rows = [];
  
  while ((rowMatch = rowRegex.exec(xmlContent)) !== null) {
    const rowNum = parseInt(rowMatch[1], 10);
    const rowContent = rowMatch[2];
    const rowData = {};
    
    const cellRegex = /<c\b[^>]*?\br="([A-Z]+)\d+"[^>]*?>(.*?)<\/c>/gs;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const colLetter = cellMatch[1];
      const colIdx = colToIndex(colLetter);
      const cellBody = cellMatch[2];
      
      let val = '';
      const tMatch = cellBody.match(/<t\b[^>]*?>(.*?)<\/t>/s);
      if (tMatch) {
        val = decodeXml(tMatch[1]);
      } else {
        const vMatch = cellBody.match(/<v\b[^>]*?>(.*?)<\/v>/s);
        if (vMatch) {
          val = vMatch[1];
        }
      }
      rowData[colIdx] = val;
    }
    rows.push({ rowNum, data: rowData });
  }
  
  if (rows.length === 0) return { headers: [], rows: [] };
  
  const headerRow = rows.find(r => r.rowNum === 1)?.data || {};
  const maxCol = Math.max(...Object.keys(headerRow).map(Number), 0);
  const headers = [];
  for (let c = 0; c <= maxCol; c++) {
    headers.push(headerRow[c] || `Col_${c}`);
  }
  
  const dataRows = [];
  for (const r of rows) {
    if (r.rowNum === 1) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r.data[idx] || '';
    });
    if (obj['Aula'] || obj['Titulo_da_Aula']) {
      dataRows.push(obj);
    }
  }
  
  return { headers, rows: dataRows };
}

function parseMultipleChoice(content) {
  let enunciado = '';
  const eMatch = content.match(/###\s*Enunciado da Questão:?\s*([\s\S]*?)(?=- \*\*\([A-D]\)\*\*|$)/i);
  if (eMatch) {
    enunciado = eMatch[1].trim();
  } else {
    enunciado = content.split('\n').filter(l => !l.startsWith('#') && !l.startsWith('[') && !l.startsWith('-')).join('\n').trim();
  }

  const opcoes = [];
  const optRegex = /-\s*\*\*\(([A-D])\)\*\*\s*([\s\S]*?)(?=-\s*\*\*\([A-D]\)\*\*|###\s*Gabarito|$)/gi;
  let oMatch;
  while ((oMatch = optRegex.exec(content)) !== null) {
    opcoes.push({
      id: oMatch[1].toLowerCase(),
      texto: oMatch[2].replace(/;$/, '').replace(/[*_]/g, '').trim()
    });
  }

  let correta = 'a';
  const gMatch = content.match(/Gabarito Oficial:?\s*Letra\s*\(([A-D])\)/i) || content.match(/Letra\s*\(([A-D])\)/i);
  if (gMatch) {
    correta = gMatch[1].toLowerCase();
  }

  let explicacao = '';
  const jMatch = content.match(/Comentário:?\s*([\s\S]*?$)/i) || content.match(/Justificativa:?\s*([\s\S]*?$)/i);
  if (jMatch) {
    explicacao = jMatch[1].replace(/^[>\s]+/, '').trim();
  }

  return { enunciado, opcoes, correta, explicacao };
}

function parseCertoErrado(content) {
  let assertiva = '';
  const aMatch = content.match(/###\s*Julgue a assertiva[^\n]*\s*([\s\S]*?)(?=---\s*|###\s*Gabarito|$)/i);
  if (aMatch) {
    assertiva = aMatch[1].replace(/^[>\s*"]+|[>\s*"]+$/gm, '').trim();
  } else {
    assertiva = content.trim();
  }

  let correta = 'certo';
  if (/gabarito[^\n]*\s*(\*\*|\b)errado/i.test(content) || /assertiva está (incorreta|errada)/i.test(content) || /\bERRADO\b/i.test(content.match(/###\s*Gabarito Oficial:[^\n]*\s*([^\n]+)/i)?.[1] || '')) {
    correta = 'errado';
  } else if (/gabarito[^\n]*\s*(\*\*|\b)certo/i.test(content) || /assertiva está (correta|certa)/i.test(content) || /\bCERTO\b/i.test(content.match(/###\s*Gabarito Oficial:[^\n]*\s*([^\n]+)/i)?.[1] || '')) {
    correta = 'certo';
  }

  let explicacao = '';
  const cMatch = content.match(/###\s*Comentário[^\n]*:?\s*([\s\S]*?$)/i);
  if (cMatch) {
    explicacao = cMatch[1].replace(/^[>\s]+/, '').trim();
  }

  const opcoes = [
    { id: 'certo', texto: 'Certo' },
    { id: 'errado', texto: 'Errado' }
  ];

  return { enunciado: assertiva, opcoes, correta, explicacao };
}

export function limparTextoInstrucoes(raw) {
  if (!raw) return '';
  let t = String(raw).trim();
  t = t.replace(/^#{1,3}\s*(?:\d+[-.)]\s*)?[^\n]+\n*/i, '').trim();
  const tagRegex = /\[\s*(?:ATO\b|CHECKPOINT\b|FLASHCARD\b|Animação\b|Transição\b|Efeito\b|Áudio\b|Locução\b|Destaque\b|Visual\b|Ação\b|Interatividade\b|Fluxo\s+Visual\b|Voltada\s+a\b)[^\]]*\]\s*/gi;
  t = t.replace(tagRegex, '').trim();
  return t;
}

export function limparMarkdownInline(s) {
  if (!s) return '';
  return String(s).replace(/^[*_#\s]+|[*_#\s]+$/g, '').trim();
}

function parseSingleFlashcard(content) {
  let frente = '';
  let verso = '';

  const fMatch = content.match(/###\s*FRENTE DO CARTÃO[^\n]*\s*([\s\S]*?)(?=---\s*|###\s*VERSO DO CARTÃO|$)/i);
  if (fMatch) {
    frente = fMatch[1].replace(/^[>\s*"]+|[>\s*"]+$/gm, '').trim();
  }

  const vMatch = content.match(/###\s*VERSO DO CARTÃO[^\n]*\s*([\s\S]*?$)/i);
  if (vMatch) {
    verso = vMatch[1].replace(/^[>\s*"]+|[>\s*"]+$/gm, '').replace(/^>*\s*\*{0,2}Resposta\*{0,2}:?\s*/i, '').trim();
  }

  // Se não encontrar o padrão FRENTE/VERSO (ex: Dilema)
  if (!frente && content.includes('O Dilema em Debate:')) {
    const dMatch = content.match(/###\s*O Dilema em Debate:?\s*([\s\S]*?)(?=###\s*A Solução|$)/i);
    const sMatch = content.match(/###\s*A Solução[^\n]*:?\s*([\s\S]*?$)/i);
    if (dMatch) frente = dMatch[1].trim();
    if (sMatch) verso = sMatch[1].trim();
  }

  if (!frente && content.includes('Pergunta Rápida')) {
    const qMatch = content.match(/\[Interatividade:[^\]]*\]\s*([\s\S]*?)(?=---\s*|###\s*Resposta|$)/i);
    const rMatch = content.match(/###\s*Resposta Comentada:?\s*([\s\S]*?$)/i);
    if (qMatch) frente = qMatch[1].replace(/^[>\s*"]+|[>\s*"]+$/gm, '').trim();
    if (rMatch) verso = rMatch[1].trim();
  }

  if (!frente) {
    frente = 'Conceito Prático';
    verso = content;
  }

  frente = limparTextoInstrucoes(frente).replace(/^>*\s*\*{0,2}Pergunta[^\n:]*\*{0,2}:?\s*/i, '').trim();
  verso = limparTextoInstrucoes(verso).replace(/^>*\s*\*{0,2}Resposta\*{0,2}:?\s*/i, '').trim();

  return { frente, verso };
}

function parseConexao(content) {
  try {
    const tableRows = [];
    const lines = content.split('\n');
    for (const l of lines) {
      const pipeMatch = l.match(/^\|\s*([^|]+)\|\s*([^|]+)\|/);
      if (pipeMatch && !l.includes('---') && !l.includes('Coluna A') && !l.includes('Situação')) {
        const a = pipeMatch[1].replace(/^\s*[*_]*(\[\d+\])?\s*/, '').replace(/[*_]/g, '').trim();
        const b = pipeMatch[2].replace(/^\s*[*_]*\([A-E]\)[*_]*\s*/i, '').replace(/[*_]/g, '').trim();
        if (a && b) {
          tableRows.push({ a, b, rawA: pipeMatch[1].trim(), rawB: pipeMatch[2].trim() });
        }
      }
    }

    const gabaritoMap = {};
    const gabRegex = /`\s*(?:\[?(\d+)\]?)?\s*->\s*\(([A-E])\)\s*`:\s*([^\n]+)/gi;
    let gm;
    let autoIdx = 0;
    while ((gm = gabRegex.exec(content)) !== null) {
      const idxA = gm[1] ? parseInt(gm[1], 10) - 1 : autoIdx;
      const letterB = gm[2].toUpperCase();
      const explicacao = gm[3].trim();
      gabaritoMap[idxA] = { letterB, explicacao };
      autoIdx++;
    }

    const bMap = {};
    for (const r of tableRows) {
      const lMatch = r.rawB.match(/\(([A-E])\)\s*([^*]+)/i);
      if (lMatch) {
        bMap[lMatch[1].toUpperCase()] = lMatch[2].replace(/[*_]/g, '').trim();
      }
    }

    const pares = [];
    for (let i = 0; i < tableRows.length; i++) {
      const r = tableRows[i];
      const gab = gabaritoMap[i];
      const defText = (gab && bMap[gab.letterB]) ? bMap[gab.letterB] : r.b;
      pares.push({
        termo: r.a,
        definicao: defText,
        explicacao: gab?.explicacao || ''
      });
    }

    if (pares.length >= 2) return pares.slice(0, 5);
  } catch (err) {
    console.warn('Erro ao parsear conexao:', err);
  }

  return [
    { termo: 'Fato Típico', definicao: 'Conduta prevista em lei como crime' },
    { termo: 'Erro Inevitável', definicao: 'Exclui o dolo e a culpa' }
  ];
}

function parseMarkdownTable(content) {
  const lines = content.split('\n');
  const tableLines = lines.filter(l => l.trim().startsWith('|') && l.trim().endsWith('|'));
  if (tableLines.length >= 2) {
    const colunas = tableLines[0].split('|').slice(1, -1).map(c => limparMarkdownInline(c));
    const dataLines = tableLines.slice(1).filter(l => !l.includes('---'));
    const linhas = dataLines.map(l => l.split('|').slice(1, -1).map((c, i) => i === 0 ? limparMarkdownInline(c) : c.trim()));
    return { colunas, linhas };
  }
  return { colunas: [], linhas: [] };
}

/**
 * IMPORTANTE: O PostgreSQL exige que bloco.tipo esteja restrito ao check constraint:
 * CHECK (tipo IN ('leitura','pergunta','flashcard','conexao','citacao','artigo_lei','tabela','mapa_mental','infografico','linha_tempo','destaque'))
 */
export function getSlideConfig(headerKey, rawContent) {
  const lower = headerKey.toLowerCase();

  // Slide 27: Múltipla Escolha
  if (lower.includes('slide_27') || lower.includes('multipla_escolha')) {
    const q = parseMultipleChoice(rawContent);
    return {
      tipo: 'pergunta',
      payload: {
        titulo: 'Questão Comentada 1 (Múltipla Escolha)',
        subtipo: 'multipla_escolha',
        enunciado: q.enunciado,
        opcoes: q.opcoes,
        explicacao: q.explicacao
      },
      resposta_correta: {
        id_correto: q.correta,
        explicacao: q.explicacao
      },
      markdown: rawContent
    };
  }

  // Slide 28: Certo ou Errado
  if (lower.includes('slide_28') || lower.includes('certo_errado')) {
    const q = parseCertoErrado(rawContent);
    return {
      tipo: 'pergunta',
      payload: {
        titulo: 'Questão Comentada 2 (Certo ou Errado)',
        subtipo: 'certo_errado',
        enunciado: q.enunciado,
        opcoes: q.opcoes,
        explicacao: q.explicacao
      },
      resposta_correta: {
        id_correto: q.correta,
        explicacao: q.explicacao
      },
      markdown: rawContent
    };
  }

  // Slide 26: Minigame Ligue os Termos
  if (lower.includes('slide_26') || lower.includes('ligue_os_termos') || lower.includes('minigame')) {
    const pares = parseConexao(rawContent);
    return {
      tipo: 'conexao',
      payload: {
        titulo: 'Minigame Interativo: Ligue os Termos',
        pares: pares,
        texto: rawContent
      },
      resposta_correta: null,
      markdown: rawContent
    };
  }

  // Slide 08, 17, 24, 25, 07, 16: Flashcards / Checkpoints
  if (
    lower.includes('slide_08') || lower.includes('flashcard_1') ||
    lower.includes('slide_17') || lower.includes('flashcard_2') ||
    lower.includes('slide_24') || lower.includes('flashcard_3') || lower.includes('checkpoint_ato_iii') ||
    lower.includes('slide_25') || lower.includes('flashcard_4') ||
    lower.includes('slide_07') || lower.includes('checkpoint_ato_i_') || lower.endsWith('checkpoint_ato_i') ||
    lower.includes('slide_16') || lower.includes('checkpoint_ato_ii')
  ) {
    const fc = parseSingleFlashcard(rawContent);
    let titulo = 'Cartão de Memorização Ativa';
    if (lower.includes('slide_16') || lower.includes('checkpoint_ato_ii')) titulo = 'Checkpoint Ato II: Dilema Prático';
    else if (lower.includes('slide_24') || lower.includes('flashcard_3') || lower.includes('checkpoint_ato_iii')) titulo = 'Flashcard 3: Prática Forense e Pegadinhas';
    else if (lower.includes('slide_07') || lower.includes('checkpoint_ato_i_') || lower.endsWith('checkpoint_ato_i')) titulo = 'Checkpoint Ato I: Fixação da Base';
    else if (lower.includes('slide_08') || lower.includes('flashcard_1')) titulo = 'Flashcard 1: Fundamentos';
    else if (lower.includes('slide_17') || lower.includes('flashcard_2')) titulo = 'Flashcard 2: Aprofundamento Dogmático';
    else if (lower.includes('slide_25') || lower.includes('flashcard_4')) titulo = 'Flashcard 4: Jurisprudência dos Tribunais';

    return {
      tipo: 'flashcard',
      payload: {
        titulo,
        frente: fc.frente,
        verso: fc.verso,
        cards: [fc],
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  // Destaques pedagógicos (Slide 03, 14, 18, 19, 23, 29)
  if (lower.includes('slide_03') || lower.includes('bem_juridico')) {
    return {
      tipo: 'destaque',
      payload: {
        titulo: 'Bem Jurídico Tutelado e Princípios',
        tom: 'info',
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  if (lower.includes('slide_14') || lower.includes('nao_configura')) {
    return {
      tipo: 'destaque',
      payload: {
        titulo: 'Fronteiras da Lei: O Que NÃO Configura Crime',
        tom: 'alerta',
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  if (lower.includes('slide_18') || lower.includes('excecoes') || lower.includes('qualificadoras')) {
    return {
      tipo: 'destaque',
      payload: {
        titulo: 'Circunstâncias Agravantes, Qualificadoras e Majorantes',
        tom: 'alerta',
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  if (lower.includes('slide_19') || lower.includes('privilegios') || lower.includes('diminuicao')) {
    return {
      tipo: 'destaque',
      payload: {
        titulo: 'Causas de Diminuição de Pena e Privilégios',
        tom: 'info',
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  if (lower.includes('slide_23') || lower.includes('pegadinhas')) {
    return {
      tipo: 'destaque',
      payload: {
        titulo: 'As Pegadinhas Mais Ardilosas em Provas e Concursos',
        tom: 'alerta',
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  if (lower.includes('slide_29') || lower.includes('dica_da_professora') || lower.includes('audio')) {
    return {
      tipo: 'destaque',
      payload: {
        titulo: 'A Dica da Professora (Áudio-Guia)',
        tom: 'dica',
        subtipo: 'audio_dica',
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  // Slide 04: Artigo de Lei
  if (lower.includes('slide_04') || lower.includes('letra_da_lei')) {
    return {
      tipo: 'artigo_lei',
      payload: {
        titulo: 'Dispositivo Legal ou Tese Jurídica',
        subtipo: 'artigo_lei',
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  // Slide 02: Linha do Tempo / Origem
  if (lower.includes('slide_02') || lower.includes('contexto')) {
    return {
      tipo: 'linha_tempo',
      payload: {
        titulo: 'Origem Histórica e Contexto',
        subtipo: 'linha_tempo',
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  // Slide 15: Tabela Doutrinária
  if (lower.includes('slide_15') || lower.includes('classificacao')) {
    const tableData = parseMarkdownTable(rawContent);
    return {
      tipo: 'tabela',
      payload: {
        titulo: 'Classificação Doutrinária Analítica',
        colunas: tableData.colunas,
        linhas: tableData.linhas,
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  // Slide 30: Grafo de Conexão e Árvore de Decisão
  if (lower.includes('slide_30') || lower.includes('grafo') || lower.includes('arvore')) {
    return {
      tipo: 'leitura',
      payload: {
        titulo: 'Grafo de Conexão e Árvore de Decisão Completa',
        subtipo: 'grafo_decisao',
        texto: limparTextoInstrucoes(rawContent)
      },
      resposta_correta: null,
      markdown: limparTextoInstrucoes(rawContent)
    };
  }

  // Outros slides de leitura
  let subtipo = 'leitura';
  let titulo = 'Conteúdo Dogmático';
  if (lower.includes('slide_01') || lower.includes('abertura')) { subtipo = 'intro'; titulo = 'Abertura da Trilha'; }
  else if (lower.includes('slide_05') || lower.includes('significado')) { subtipo = 'conceito'; titulo = 'Significado Sem Juridiquês'; }
  else if (lower.includes('slide_06') || lower.includes('nucleo')) { subtipo = 'fluxo'; titulo = 'Núcleo da Conduta'; }
  else if (lower.includes('slide_09') || lower.includes('sujeitos')) { subtipo = 'conceito'; titulo = 'Sujeitos e Personagens do Crime'; }
  else if (lower.includes('slide_10') || lower.includes('dolo')) { subtipo = 'conceito'; titulo = 'Elemento Subjetivo e Dolo'; }
  else if (lower.includes('slide_11') || lower.includes('erro')) { subtipo = 'conceito'; titulo = 'Hipóteses de Erro e Decisão'; }
  else if (lower.includes('slide_12') || lower.includes('consumacao')) { subtipo = 'conceito'; titulo = 'Momento Exato da Consumação'; }
  else if (lower.includes('slide_13') || lower.includes('tentativa')) { subtipo = 'conceito'; titulo = 'A Tentativa e os Atos Executórios'; }
  else if (lower.includes('slide_20') || lower.includes('processo') || lower.includes('acao_penal')) { subtipo = 'processual'; titulo = 'Procedimento e Ação Penal'; }
  else if (lower.includes('slide_21') || lower.includes('caso_pratico') || lower.includes('storytelling')) { subtipo = 'caso_pratico'; titulo = 'Caso Prático Real: Cotidiano'; }
  else if (lower.includes('slide_22') || lower.includes('tribunais') || lower.includes('jurisprudencia')) { subtipo = 'jurisprudencia'; titulo = 'Jurisprudência dos Tribunais Superiores (STF/STJ)'; }

  return {
    tipo: 'leitura',
    payload: {
      titulo,
      subtipo,
      texto: limparTextoInstrucoes(rawContent)
    },
    resposta_correta: null,
    markdown: limparTextoInstrucoes(rawContent)
  };
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('🚀 Iniciando importação completa das 378 Aulas e ~11.340 Blocos de Direito Penal...');
  const startTime = Date.now();

  // 1. Obter Área de Direito Penal
  const { data: areas, error: areaErr } = await supabase
    .from('aprender_areas')
    .select('id, nome')
    .eq('slug', 'direito-penal');

  if (areaErr || !areas || areas.length === 0) {
    console.error('Área de Direito Penal não encontrada:', areaErr);
    process.exit(1);
  }
  const areaId = areas[0].id;
  console.log(`Área selecionada: ${areas[0].nome} (${areaId})`);

  // 2. Obter Módulos de Direito Penal
  const { data: modulos, error: modErr } = await supabase
    .from('aprender_modulos')
    .select('id, titulo, ordem, slug')
    .eq('area_id', areaId)
    .order('ordem');

  if (modErr || !modulos || modulos.length === 0) {
    console.error('Módulos não encontrados:', modErr);
    process.exit(1);
  }
  console.log(`Encontrados ${modulos.length} módulos no banco.`);

  // 3. Garantir que todas as aulas antigas de Direito Penal estão removidas
  const moduloIds = modulos.map(m => m.id);
  console.log(`🗑️ Verificando e limpando aulas antigas dos ${moduloIds.length} módulos...`);
  const { error: delErr } = await supabase
    .from('aprender_aulas')
    .delete()
    .in('modulo_id', moduloIds);

  if (delErr) {
    console.error('Erro ao limpar aulas antigas:', delErr);
    process.exit(1);
  }
  console.log('✅ Aulas antigas limpas com sucesso.');

  // 4. Ler abas da planilha
  const wbXml = fs.readFileSync('new_penal_extracted/xl/workbook.xml', 'utf8');
  const sheetRegex = /<sheet[^>]*name="([^"]+)"[^>]*sheetId="([^"]+)"[^>]*r:id="([^"]+)"/g;
  let sm;
  const sheets = [];
  while ((sm = sheetRegex.exec(wbXml)) !== null) {
    sheets.push({ name: sm[1], sheetId: sm[2], rId: sm[3] });
  }
  const contentSheets = sheets.slice(1);

  let totalAulasGeral = 0;
  let totalBlocosGeral = 0;

  for (let sIdx = 0; sIdx < contentSheets.length; sIdx++) {
    const s = contentSheets[sIdx];
    const mod = modulos[sIdx];
    if (!mod) {
      console.warn(`Módulo não encontrado para aba [${sIdx + 1}] ${s.name}`);
      continue;
    }

    const sheetFile = `new_penal_extracted/xl/worksheets/sheet${sIdx + 2}.xml`;
    if (!fs.existsSync(sheetFile)) {
      console.warn(`Arquivo não encontrado: ${sheetFile}`);
      continue;
    }

    const xml = fs.readFileSync(sheetFile, 'utf8');
    const { headers, rows } = parseWorksheetXml(xml);

    if (rows.length === 0) {
      console.log(`[${sIdx + 1}/${contentSheets.length}] Módulo "${mod.titulo}": 0 aulas.`);
      continue;
    }

    // Preparar as aulas para inserção em lote
    const aulasToInsert = [];
    const rowsMeta = [];

    for (let aIdx = 0; aIdx < rows.length; aIdx++) {
      const row = rows[aIdx];
      const aulaStr = row['Aula'] || `Aula ${aIdx + 1}`;
      const numMatch = aulaStr.match(/\d+/);
      const ordemAula = numMatch ? parseInt(numMatch[0], 10) : (aIdx + 1);

      const tituloAula = row['Titulo_da_Aula'] || `${mod.titulo} - Aula ${ordemAula}`;
      const objetivo = row['Conteudo_Original'] || null;
      const slug = tituloAula
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `aula-${ordemAula}`;

      aulasToInsert.push({
        modulo_id: mod.id,
        titulo: tituloAula,
        objetivo: objetivo,
        slug: `${slug}-${mod.id.slice(0, 6)}-${ordemAula}`,
        duracao_est_min: 15,
        ordem: ordemAula,
        status: 'published'
      });
      rowsMeta.push({ row, ordemAula });
    }

    // Inserir todas as aulas do módulo
    const { data: insertedAulas, error: aulasErr } = await supabase
      .from('aprender_aulas')
      .insert(aulasToInsert)
      .select('id, ordem');

    if (aulasErr || !insertedAulas) {
      console.error(`Erro ao inserir aulas do módulo "${mod.titulo}":`, aulasErr);
      continue;
    }

    // Mapear id da aula por ordem
    const aulaIdByOrdem = {};
    insertedAulas.forEach(a => {
      aulaIdByOrdem[a.ordem] = a.id;
    });

    // Preparar blocos de todas as aulas deste módulo
    const blocosDoModulo = [];

    for (let rIdx = 0; rIdx < rowsMeta.length; rIdx++) {
      const { row, ordemAula } = rowsMeta[rIdx];
      const aulaId = aulaIdByOrdem[ordemAula];
      if (!aulaId) continue;

      let ordemBloco = 1;
      for (const h of headers) {
        if (h && h.startsWith('Slide_')) {
          const rawContent = row[h];
          if (rawContent && rawContent.trim() !== '') {
            const cfg = getSlideConfig(h, rawContent);
            blocosDoModulo.push({
              aula_id: aulaId,
              ordem: ordemBloco++,
              tipo: cfg.tipo,
              payload: cfg.payload,
              resposta_correta: cfg.resposta_correta,
              markdown: cfg.markdown
            });
          }
        }
      }
    }

    // Inserir blocos em chunks de 500 para evitar payload limits
    const CHUNK_SIZE = 500;
    for (let c = 0; c < blocosDoModulo.length; c += CHUNK_SIZE) {
      const chunk = blocosDoModulo.slice(c, c + CHUNK_SIZE);
      const { error: blkErr } = await supabase.from('aprender_blocos').insert(chunk);
      if (blkErr) {
        console.error(`Erro ao inserir bloco chunk [${c} - ${c + chunk.length}] no módulo "${mod.titulo}":`, blkErr);
      }
    }

    totalAulasGeral += insertedAulas.length;
    totalBlocosGeral += blocosDoModulo.length;
    console.log(`[${sIdx + 1}/${contentSheets.length}] Módulo "${mod.titulo}": ${insertedAulas.length} aulas, ${blocosDoModulo.length} blocos criados.`);
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n🎉 Importação finalizada com sucesso em ${durationSec}s!`);
  console.log(`Total de Aulas criadas: ${totalAulasGeral}`);
  console.log(`Total de Blocos criados: ${totalBlocosGeral}`);
}

main();
