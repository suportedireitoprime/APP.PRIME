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
  const jMatch = content.match(/Justificativa:?\s*([\s\S]*?$)/i);
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
  if (/gabarito[^\n]*\s*(\*\*|\b)errado/i.test(content) || /assertiva está (incorreta|errada)/i.test(content)) {
    correta = 'errado';
  } else if (/gabarito[^\n]*\s*(\*\*|\b)certo/i.test(content) || /assertiva está (correta|certa)/i.test(content)) {
    correta = 'certo';
  }

  let explicacao = '';
  const cMatch = content.match(/###\s*Comentário[^\n]*:?\s*([\s\S]*?$)/i);
  if (cMatch) {
    explicacao = cMatch[1].trim();
  }

  const opcoes = [
    { id: 'certo', texto: 'Certo' },
    { id: 'errado', texto: 'Errado' }
  ];

  return { enunciado: assertiva, opcoes, correta, explicacao };
}

function parseFlashcards(content) {
  const cards = [];
  const c1Match = content.match(/###\s*CARTÃO 1[^\n]*\s*-\s*\*\*Frente\*\*:\s*([\s\S]*?)\s*-\s*\*\*Verso\*\*:\s*([\s\S]*?)(?=---\s*|###\s*CARTÃO 2|$)/i);
  if (c1Match) {
    cards.push({ frente: c1Match[1].trim(), verso: c1Match[2].trim() });
  }
  const c2Match = content.match(/###\s*CARTÃO 2[^\n]*\s*-\s*\*\*Frente\*\*:\s*([\s\S]*?)\s*-\s*\*\*Verso\*\*:\s*([\s\S]*?$)/i);
  if (c2Match) {
    cards.push({ frente: c2Match[1].trim(), verso: c2Match[2].trim() });
  }

  return cards;
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

/**
 * IMPORTANTE: O PostgreSQL exige que bloco.tipo esteja restrito ao check constraint:
 * CHECK (tipo IN ('leitura','pergunta','flashcard','conexao','citacao','artigo_lei','tabela','mapa_mental','infografico','linha_tempo','destaque'))
 */
function getSlideConfig(headerKey, rawContent) {
  const lower = headerKey.toLowerCase();
  
  // 1. Questão Múltipla Escolha (Slide 25)
  if (lower.includes('slide_25') || lower.includes('multipla_escolha')) {
    const q = parseMultipleChoice(rawContent);
    return {
      tipo: 'pergunta',
      payload: {
        titulo: 'Questão Comentada (Múltipla Escolha)',
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

  // 2. Questão Certo ou Errado (Slide 26)
  if (lower.includes('slide_26') || lower.includes('certo_errado')) {
    const q = parseCertoErrado(rawContent);
    return {
      tipo: 'pergunta',
      payload: {
        titulo: 'Questão Comentada (Certo ou Errado)',
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

  // 3. Flashcards (Slide 24)
  if (lower.includes('slide_24') || lower.includes('flashcard')) {
    const cards = parseFlashcards(rawContent);
    return {
      tipo: 'flashcard',
      payload: {
        titulo: 'Cartões de Memorização Ativa',
        frente: cards[0]?.frente || 'Conceito Central',
        verso: cards[0]?.verso || rawContent,
        cards: cards,
        texto: rawContent
      },
      resposta_correta: null,
      markdown: rawContent
    };
  }

  // 4. Minigame Ligue os Termos (Slide 23)
  if (lower.includes('slide_23') || lower.includes('ligue_os_termos') || lower.includes('minigame')) {
    const pares = parseConexao(rawContent);
    return {
      tipo: 'conexao',
      payload: {
        titulo: 'Minigame: Ligue os Termos',
        pares: pares,
        texto: rawContent
      },
      resposta_correta: null,
      markdown: rawContent
    };
  }

  // 5. Destaques visuais pedagógicos
  if (lower.includes('pegadinha') || lower.includes('slide_19')) {
    return {
      tipo: 'destaque',
      payload: {
        titulo: 'Atenção: Pegadinha de Prova',
        tom: 'alerta',
        texto: rawContent
      },
      resposta_correta: null,
      markdown: rawContent
    };
  }

  if (lower.includes('nao_configura') || lower.includes('slide_07')) {
    return {
      tipo: 'destaque',
      payload: {
        titulo: 'Fronteiras da Lei: O Que NÃO Configura Infração',
        tom: 'alerta',
        texto: rawContent
      },
      resposta_correta: null,
      markdown: rawContent
    };
  }

  if (lower.includes('bem_juridico') || lower.includes('slide_03')) {
    return {
      tipo: 'destaque',
      payload: {
        titulo: 'Bem Jurídico Tutelado',
        tom: 'info',
        texto: rawContent
      },
      resposta_correta: null,
      markdown: rawContent
    };
  }

  if (lower.includes('dica') || lower.includes('slide_27')) {
    return {
      tipo: 'destaque',
      payload: {
        titulo: 'Dica da Professora',
        tom: 'dica',
        texto: rawContent
      },
      resposta_correta: null,
      markdown: rawContent
    };
  }

  // 6. Todos os outros slides de conteúdo (leitura, storytelling, tabelas markdown, fluxos, jurisprudência, etc.)
  let subtipo = 'leitura';
  let titulo = 'Conteúdo da Aula';
  if (lower.includes('slide_01') || lower.includes('abertura')) { subtipo = 'intro'; titulo = 'Abertura da Trilha'; }
  else if (lower.includes('slide_02') || lower.includes('contexto')) { subtipo = 'linha_tempo'; titulo = 'Origem Histórica e Contexto'; }
  else if (lower.includes('slide_04') || lower.includes('letra_da_lei')) { subtipo = 'artigo_lei'; titulo = 'Dispositivo Legal'; }
  else if (lower.includes('slide_05') || lower.includes('significado')) { subtipo = 'conceito'; titulo = 'Significado Sem Juridiquês'; }
  else if (lower.includes('slide_06') || lower.includes('nucleo')) { subtipo = 'fluxo'; titulo = 'Núcleo da Conduta'; }
  else if (lower.includes('slide_08') || lower.includes('sujeitos')) { subtipo = 'conceito'; titulo = 'Sujeitos do Delito'; }
  else if (lower.includes('slide_09') || lower.includes('consumacao')) { subtipo = 'conceito'; titulo = 'Consumação e Tentativa'; }
  else if (lower.includes('slide_10') || lower.includes('erro')) { subtipo = 'conceito'; titulo = 'Erro de Tipo ou Proibição'; }
  else if (lower.includes('slide_11') || lower.includes('exclusao')) { subtipo = 'conceito'; titulo = 'Causas de Exclusão'; }
  else if (lower.includes('slide_12') || lower.includes('pena')) { subtipo = 'artigo_lei'; titulo = 'Pena e Regime'; }
  else if (lower.includes('slide_13') || lower.includes('classificacao')) { subtipo = 'tabela'; titulo = 'Classificação Doutrinária'; }
  else if (lower.includes('slide_14') || lower.includes('fluxograma')) { subtipo = 'fluxograma'; titulo = 'Fluxograma Visual'; }
  else if (lower.includes('slide_15') || lower.includes('dicionario')) { subtipo = 'glossario'; titulo = 'Dicionário Descomplicado'; }
  else if (lower.includes('slide_16') || lower.includes('distincao')) { subtipo = 'comparativo'; titulo = 'Distinção de Figuras'; }
  else if (lower.includes('slide_17') || lower.includes('sumulas')) { subtipo = 'jurisprudencia'; titulo = 'Súmulas e Jurisprudência'; }
  else if (lower.includes('slide_18') || lower.includes('stf_stj')) { subtipo = 'jurisprudencia'; titulo = 'Posição STF e STJ'; }
  else if (lower.includes('slide_20') || lower.includes('storytelling') || lower.includes('caso_pratico')) { subtipo = 'caso_pratico'; titulo = 'Caso Prático Real'; }
  else if (lower.includes('slide_21') || lower.includes('solucao')) { subtipo = 'caso_pratico'; titulo = 'Solução do Caso Prático'; }
  else if (lower.includes('slide_22') || lower.includes('processual')) { subtipo = 'leitura'; titulo = 'Desdobramentos Processuais'; }
  else if (lower.includes('slide_28') || lower.includes('arvore') || lower.includes('proximos')) { subtipo = 'conclusao'; titulo = 'Árvore de Decisão e Próximos Passos'; }

  return {
    tipo: 'leitura',
    payload: {
      titulo: titulo,
      subtipo: subtipo,
      texto: rawContent
    },
    resposta_correta: null,
    markdown: rawContent
  };
}

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('🚀 Iniciando substituição completa das aulas de Direito Civil...');
  
  // 1. Obter Área de Direito Civil
  const { data: areas, error: areaErr } = await supabase
    .from('aprender_areas')
    .select('id, nome')
    .eq('slug', 'direito-civil');

  if (areaErr || !areas || areas.length === 0) {
    console.error('Área de Direito Civil não encontrada:', areaErr);
    return;
  }
  const areaId = areas[0].id;
  console.log(`Área selecionada: ${areas[0].nome} (${areaId})`);

  // 2. Obter Módulos de Direito Civil
  const { data: modulosAtuais, error: modErr } = await supabase
    .from('aprender_modulos')
    .select('id, titulo, ordem')
    .eq('area_id', areaId)
    .order('ordem');

  if (modErr) {
    console.error('Erro ao buscar módulos:', modErr);
    return;
  }

  // 3. Ler abas da planilha
  const wbXml = fs.readFileSync('civil_extracted/xl/workbook.xml', 'utf8');
  const sheetRegex = /<sheet[^>]*name="([^"]+)"[^>]*sheetId="([^"]+)"[^>]*r:id="([^"]+)"/g;
  let m;
  const sheets = [];
  while ((m = sheetRegex.exec(wbXml)) !== null) {
    sheets.push({ name: m[1], sheetId: m[2], rId: m[3] });
  }
  const contentSheets = sheets.slice(1);

  // 4. Sincronizar módulos (criar se não existirem)
  const modulos = [];
  for (let sIdx = 0; sIdx < contentSheets.length; sIdx++) {
    const s = contentSheets[sIdx];
    let mod = (modulosAtuais || []).find(m => m.ordem === sIdx + 1);
    if (!mod) {
      console.log(`Criando novo módulo: ${s.name}`);
      const slug = s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const { data: novoMod, error: createErr } = await supabase.from('aprender_modulos').insert({
        area_id: areaId,
        titulo: s.name,
        slug: slug,
        ordem: sIdx + 1
      }).select('id, titulo, ordem').single();
      if (createErr) console.error('Erro ao criar módulo:', createErr);
      mod = novoMod;
    } else {
      if (mod.titulo !== s.name) {
        await supabase.from('aprender_modulos').update({ titulo: s.name }).eq('id', mod.id);
        mod.titulo = s.name;
      }
    }
    if (mod) modulos.push(mod);
  }

  // 5. Apagar aulas antigas
  const moduloIds = modulos.map(m => m.id);
  if (moduloIds.length > 0) {
    console.log(`🗑️ Apagando todas as aulas existentes dos ${moduloIds.length} módulos de Civil...`);
    const { error: delErr } = await supabase
      .from('aprender_aulas')
      .delete()
      .in('modulo_id', moduloIds);
    if (delErr) console.error('Erro ao deletar aulas antigas:', delErr);
    else console.log('✅ Aulas antigas removidas com sucesso.');
  }

  let totalAulasGeral = 0;
  let totalBlocosGeral = 0;
  const startTime = Date.now();

  for (let sIdx = 0; sIdx < contentSheets.length; sIdx++) {
    const s = contentSheets[sIdx];
    const mod = modulos[sIdx];
    if (!mod) {
      console.warn(`Módulo não encontrado para aba [${sIdx + 1}] ${s.name}`);
      continue;
    }

    const sheetFile = `civil_extracted/xl/worksheets/sheet${sIdx + 2}.xml`;
    if (!fs.existsSync(sheetFile)) {
      console.warn(`Arquivo de planilha não encontrado: ${sheetFile}`);
      continue;
    }

    const xml = fs.readFileSync(sheetFile, 'utf8');
    const { headers, rows } = parseWorksheetXml(xml);

    if (rows.length === 0) {
      console.log(`[${sIdx + 1}/${contentSheets.length}] Módulo "${mod.titulo}": 0 aulas encontradas na planilha.`);
      continue;
    }

    let aulasDoModulo = 0;
    let blocosDoModulo = 0;

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

      // Inserir aula
      const { data: novaAula, error: aulaErr } = await supabase
        .from('aprender_aulas')
        .insert({
          modulo_id: mod.id,
          titulo: tituloAula,
          objetivo: objetivo,
          slug: `${slug}-${mod.id.slice(0, 6)}-${ordemAula}`,
          duracao_est_min: 15,
          ordem: ordemAula,
          status: 'published'
        })
        .select('id')
        .single();

      if (aulaErr || !novaAula) {
        console.error(`Erro ao inserir aula "${tituloAula}":`, aulaErr);
        continue;
      }
      aulasDoModulo++;
      totalAulasGeral++;

      // Inserir os blocos da aula
      const blocos = [];
      let ordemBloco = 1;

      for (const h of headers) {
        if (h && h.startsWith('Slide_')) {
          const rawContent = row[h];
          if (rawContent && rawContent.trim() !== '') {
            const cfg = getSlideConfig(h, rawContent);
            blocos.push({
              aula_id: novaAula.id,
              ordem: ordemBloco++,
              tipo: cfg.tipo,
              payload: cfg.payload,
              resposta_correta: cfg.resposta_correta,
              markdown: cfg.markdown
            });
          }
        }
      }

      if (blocos.length > 0) {
        const { error: blkErr } = await supabase.from('aprender_blocos').insert(blocos);
        if (blkErr) {
          console.error(`Erro ao inserir blocos da aula ${tituloAula}:`, blkErr);
        } else {
          blocosDoModulo += blocos.length;
          totalBlocosGeral += blocos.length;
        }
      }
    }

    console.log(`[${sIdx + 1}/${contentSheets.length}] Módulo "${mod.titulo}": ${aulasDoModulo} aulas, ${blocosDoModulo} blocos criados.`);
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n🎉 Importação concluída com sucesso em ${durationSec}s!`);
  console.log(`Total de Aulas criadas: ${totalAulasGeral}`);
  console.log(`Total de Blocos criados: ${totalBlocosGeral}`);
}

run();
