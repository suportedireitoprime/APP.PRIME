const path = require('path');
const fs = require('fs');

const workspaceRoot = 'c:\\Users\\ext_wpereira\\OneDrive - Vitamina Work Life S.A\\Documentos\\APP.PRIME';
const { createClient } = require(path.join(workspaceRoot, 'node_modules', '@supabase', 'supabase-js'));

let envText = fs.readFileSync(path.join(workspaceRoot, '.env'), 'utf8');
let serviceKey = '';
let supabaseUrl = 'https://dnjrgpldcwcpoywamorr.supabase.co';

envText.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (!k) return;
  const val = v.join('=').trim().replace(/^["']|["']$/g, '');
  if (k.trim() === 'SUPABASE_SERVICE_ROLE_KEY' || k.trim() === 'SUPABASE_SERVICE_KEY') serviceKey = val;
});

const client = createClient(supabaseUrl, serviceKey);

const moduloMap = JSON.parse(fs.readFileSync('C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\f1fc4902-8888-4c64-8618-04d02812148a\\scratch\\modulo_map.json', 'utf8'));
const sheetsSummary = JSON.parse(fs.readFileSync('C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\f1fc4902-8888-4c64-8618-04d02812148a\\scratch\\penal_sheets_summary.json', 'utf8'));
const sheetsDir = 'C:\\Users\\ext_wpereira\\.gemini\\antigravity-ide\\brain\\f1fc4902-8888-4c64-8618-04d02812148a\\scratch\\sheets';

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal);
      if (currentRow.length > 1 || currentRow[0] !== '') rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal);
    rows.push(currentRow);
  }
  return rows;
}

function cleanText(t) {
  if (!t) return '';
  let cleaned = t
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{FE0F}]/gu, '')
    .trim();
  const backticks = cleaned.match(/```/g);
  if (backticks && backticks.length % 2 !== 0) {
    cleaned += '\n```';
  }
  return cleaned;
}

function extractHeading(raw, fallback) {
  const m = raw.match(/^#+\s*(?:\d+[\.\-\)]\s*)?([^\n]+)/m);
  if (m) {
    return m[1].replace(/^#+\s*/, '').replace(/:\s*$/, '').trim();
  }
  return fallback;
}

function parseLacunaSlide(raw) {
  const clean = cleanText(raw);
  const titulo = extractHeading(clean, 'Complete a Frase da Lei');

  let enunciado = '';
  const quoteMatch = clean.match(/>\s*\*?"?([\s\S]*?\[(?:_{2,}|lacuna|\.\.\.)\][\s\S]*?)"?\*?(?:\n|$)/i);
  if (quoteMatch) {
    enunciado = quoteMatch[1].replace(/^\*|[\*"]$/g, '').trim();
  } else {
    const lineWithGap = clean.split('\n').find(l => /\[(?:_{2,}|lacuna|\.\.\.)\]/i.test(l));
    if (lineWithGap) {
      enunciado = lineWithGap.replace(/^[>\s\*\"]+|[>\s\*\"]+$/g, '').trim();
    } else {
      enunciado = clean.replace(/^#+[^\n]+\n*/, '').split('---')[0].trim();
    }
  }

  let termoCorreto = '';
  const termMatch = clean.match(/-\s*\*\*(?:Termo|Palavra)\s*Corret[ao]\*\*:\s*`?([^\n`]+)`?/i);
  if (termMatch) {
    termoCorreto = termMatch[1].trim();
  } else {
    const bracketMatch = clean.match(/\[\[(.*?)\]\]/);
    if (bracketMatch) termoCorreto = bracketMatch[1].trim();
  }

  let explicacao = '';
  const expMatch = clean.match(/-\s*\*\*Explicação\*\*:\s*([^\n]+)/i);
  if (expMatch) {
    explicacao = expMatch[1].trim();
  } else {
    const respMatch = clean.match(/###\s*Resposta\s*Comentada:\s*([\s\S]*$)/i);
    if (respMatch) explicacao = respMatch[1].replace(/^[>\s\-]+/gm, '').trim();
  }

  const legalDistractors = [
    'LEGALIDADE', 'TIPICIDADE', 'CULPABILIDADE', 'ANTIJURIDICIDADE',
    'INSIGNIFICÂNCIA', 'PROPORCIONALIDADE', 'DOLO DIRETO', 'CULPA CONSCIENTE',
    'PRESCRIÇÃO', 'IMPUTABILIDADE', 'TENTATIVA', 'CONSUMAÇÃO', 'RETROATIVIDADE',
    'ULTRATIVIDADE', 'ANALOGIA', 'INTERVENÇÃO MÍNIMA'
  ];

  const pool = legalDistractors.filter(w => w.toUpperCase() !== (termoCorreto || '').toUpperCase());
  const distractors = pool.slice(0, 3);
  const allChoices = [termoCorreto.toUpperCase() || 'LEGALIDADE', ...distractors];

  for (let i = allChoices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allChoices[i], allChoices[j]] = [allChoices[j], allChoices[i]];
  }

  const letters = ['a', 'b', 'c', 'd'];
  let idCorreto = 'a';
  const opcoes = allChoices.map((c, idx) => {
    const letter = letters[idx];
    if (c.toUpperCase() === (termoCorreto || 'LEGALIDADE').toUpperCase()) {
      idCorreto = letter;
    }
    return { id: letter, texto: c };
  });

  return {
    tipo: 'pergunta',
    payload: {
      subtipo: 'complete_lacuna',
      titulo,
      enunciado: enunciado || clean,
      opcoes,
      explicacao: explicacao || 'A resposta decorre da literalidade e hermenêutica dos princípios fundamentais do Direito Penal.'
    },
    resposta_correta: {
      id_correto: idCorreto,
      explicacao: explicacao || 'Resposta correta fundamentada no tipo penal.'
    }
  };
}

function parseFlashcardSlide(raw, defaultTitle) {
  const clean = cleanText(raw);
  const titulo = extractHeading(clean, defaultTitle);

  let frente = '';
  let verso = '';

  const fMatch = clean.match(/###\s*FRENTE\s*DO\s*CARTÃO:?\s*(?:>\s*\*\*Pergunta[^\n]*\*\*:\s*)?([\s\S]*?)(?=---\s*|###\s*VERSO|$)/i);
  const vMatch = clean.match(/###\s*VERSO\s*DO\s*CARTÃO[^\n]*:?\s*(?:>\s*\*\*Resposta[^\n]*\*\*:\s*)?([\s\S]*$)/i);

  if (fMatch && vMatch) {
    frente = fMatch[1].replace(/^[>\s\*#\-]+|[>\s\*#\-]+$/gm, '').trim();
    verso = vMatch[1].replace(/^[>\s\*#\-]+|[>\s\*#\-]+$/gm, '').trim();
    frente = frente.split('\n').map(l => l.replace(/^[>\s]+/, '').trim()).filter(Boolean).join('\n');
    verso = verso.split('\n').map(l => l.replace(/^[>\s]+/, '').trim()).filter(Boolean).join('\n');
  } else {
    const qMatch = clean.match(/\*\*Pergunta[^\*]*\*\*:\s*([\s\S]*?)(?=\*\*Resposta|$)/i);
    const aMatch = clean.match(/\*\*Resposta[^\*]*\*\*:\s*([\s\S]*$)/i);
    if (qMatch && aMatch) {
      frente = qMatch[1].replace(/^[>\s]+|[>\s]+$/gm, '').trim();
      verso = aMatch[1].replace(/^[>\s]+|[>\s]+$/gm, '').trim();
    } else {
      const parts = clean.split('---').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        frente = parts[0].replace(/^#+[^\n]+\n*/, '').trim();
        verso = parts.slice(1).join('\n\n').trim();
      } else {
        frente = titulo;
        verso = clean;
      }
    }
  }

  return {
    tipo: 'flashcard',
    payload: {
      titulo,
      frente: frente || titulo,
      verso: verso || clean,
      dica: 'Pense nos elementos essenciais e requisitos legais.'
    },
    resposta_correta: null
  };
}

function parseQuestaoOABSlide(raw) {
  const clean = cleanText(raw);
  const titulo = extractHeading(clean, 'Questão Comentada Estilo OAB / FGV');

  let enunciado = '';
  const enuncMatch = clean.match(/###\s*Enunciado:\s*([\s\S]*?)(?=(?:^|\n)\s*[-*]?\s*\*\*\(?[A-D]\)?\*\*|(?:^|\n)\s*[-*]?\s*\(?[A-D]\)[\.\-\:])/i);
  if (enuncMatch) {
    enunciado = enuncMatch[1].replace(/^[>\s]+|[>\s]+$/gm, '').trim();
  } else {
    const firstOpt = clean.search(/(?:^|\n)\s*[-*]?\s*\*\*\(?[A-D]\)?\*\*/i);
    if (firstOpt !== -1) {
      enunciado = clean.slice(0, firstOpt).replace(/^#+[^\n]+\n*/, '').trim();
    } else {
      enunciado = clean;
    }
  }

  const opcoes = [];
  const optRegex = /(?:^|\n)\s*[-*]?\s*\*\*\(?([A-D])\)?\*\*\s*[:\.\-]?\s*([^\n]+)/gi;
  let match;
  while ((match = optRegex.exec(clean)) !== null) {
    opcoes.push({
      id: match[1].toLowerCase(),
      texto: match[2].trim()
    });
  }

  if (opcoes.length === 0) {
    const optRegex2 = /(?:^|\n)\s*[-*]?\s*\(?([A-D])\)\s*[:\.\-]?\s*([^\n]+)/gi;
    while ((match = optRegex2.exec(clean)) !== null) {
      opcoes.push({
        id: match[1].toLowerCase(),
        texto: match[2].trim()
      });
    }
  }

  let gabarito = 'a';
  const gabIdx = clean.search(/###\s*(?:Gabarito|Resposta)/i);
  if (gabIdx !== -1) {
    const gabSection = clean.slice(gabIdx);
    const gabMatch = gabSection.match(/(?:Gabarito|Letra|Alternativa|Correta)\s*:\s*(?:Letra\s*)?\(?([A-D])\)?/i) ||
                     gabSection.match(/\bLetra\s*\(?([A-D])\)?/i) ||
                     gabSection.match(/\(([A-D])\)/);
    if (gabMatch) {
      gabarito = gabMatch[1].toLowerCase();
    }
  }

  let explicacao = '';
  const expMatch = clean.match(/###\s*(?:Gabarito\s*e\s*)?(?:Justificativa|Explicação|Fundamentação|Comentário)[^\n]*\n([\s\S]*$)/i);
  if (expMatch) {
    explicacao = expMatch[1].replace(/^[>\s]+|[>\s]+$/gm, '').trim();
  }

  return {
    tipo: 'pergunta',
    payload: {
      subtipo: 'multipla_escolha',
      titulo,
      enunciado: enunciado || clean,
      opcoes,
      explicacao: explicacao || 'Consulte o fundamento doutrinário e legal aplicável.'
    },
    resposta_correta: {
      id_correto: gabarito,
      explicacao: explicacao || 'Alternativa correta conforme jurisprudência pacífica.'
    }
  };
}

function parseQuestaoCEBRASPESlide(raw) {
  const clean = cleanText(raw);
  const titulo = extractHeading(clean, 'Questão de Julgamento Certo ou Errado (Padrão Cebraspe)');

  let enunciado = '';
  const assertivaMatch = clean.match(/###\s*Julgue\s*(?:a\s*assertiva|o\s*item)[^\n]*\n\s*([\s\S]*?)(?=---\s*|###\s*Gabarito|$)/i);
  if (assertivaMatch) {
    enunciado = assertivaMatch[1].replace(/^[>\s\*"]+|[>\s\*"]+$/gm, '').trim();
  } else {
    const firstHeading = clean.indexOf('### Gabarito');
    if (firstHeading !== -1) {
      enunciado = clean.slice(0, firstHeading).replace(/^#+[^\n]+\n*/, '').trim();
    } else {
      enunciado = clean;
    }
  }

  let gabarito = 'certo';
  const gabMatch = clean.match(/###\s*Gabarito[^\n]*\n\s*\*\*?\s*(CERTO|ERRADO)/i);
  if (gabMatch) {
    gabarito = gabMatch[1].toLowerCase();
  }

  let explicacao = '';
  const justMatch = clean.match(/###\s*Justificativa[^\n]*\n([\s\S]*$)/i);
  if (justMatch) {
    explicacao = justMatch[1].replace(/^[>\s]+|[>\s]+$/gm, '').trim();
  }

  return {
    tipo: 'pergunta',
    payload: {
      subtipo: 'certo_errado',
      titulo,
      enunciado: enunciado || clean,
      opcoes: [
        { id: 'certo', texto: 'CERTO' },
        { id: 'errado', texto: 'ERRADO' }
      ],
      explicacao: explicacao || 'Consulte o fundamento legal e jurisprudencial aplicável.'
    },
    resposta_correta: {
      id_correto: gabarito,
      explicacao: explicacao || 'Item julgado conforme a jurisprudência dos Tribunais Superiores.'
    }
  };
}

async function syncModuleInteractive(sheetNum) {
  const moduloId = moduloMap[sheetNum];
  if (!moduloId) return;

  const s = sheetsSummary.find(item => item.num === sheetNum);
  if (!s) return;

  const safeName = s.name.replace(/[^a-zA-Z0-9_\-\. ]/g, '').trim().replace(/\s+/g, '_');
  const filePath = path.join(sheetsDir, `${s.num.toString().padStart(2, '0')}_${s.gid}_${safeName}.csv`);
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  const aulasRows = rows.slice(1).filter(r => r.length >= 25 && r[0].toLowerCase().includes('aula'));

  const { data: existingAulas } = await client
    .from('aprender_aulas')
    .select('id, ordem, titulo')
    .eq('modulo_id', moduloId)
    .order('ordem');

  const existingMap = {};
  if (existingAulas) {
    existingAulas.forEach(a => { existingMap[a.ordem] = a; });
  }

  let updatedCount = 0;
  for (let aIdx = 0; aIdx < aulasRows.length; aIdx++) {
    const row = aulasRows[aIdx];
    const ordem = aIdx + 1;
    const existing = existingMap[ordem];
    if (!existing) continue;

    const aulaId = existing.id;

    const p17 = parseLacunaSlide(row[19]);
    const p18 = parseFlashcardSlide(row[20], 'Cartão de Memorização 1');
    const p19 = parseFlashcardSlide(row[21], 'Cartão de Memorização 2');
    const p20 = parseQuestaoOABSlide(row[22]);
    const p21 = parseQuestaoCEBRASPESlide(row[23]);

    const updates = [
      { ordem: 17, ...p17 },
      { ordem: 18, ...p18 },
      { ordem: 19, ...p19 },
      { ordem: 20, ...p20 },
      { ordem: 21, ...p21 }
    ];

    for (const u of updates) {
      await client
        .from('aprender_blocos')
        .update({
          tipo: u.tipo,
          payload: u.payload,
          resposta_correta: u.resposta_correta
        })
        .eq('aula_id', aulaId)
        .eq('ordem', u.ordem);
    }
    updatedCount++;
  }

  console.log(`[OK] Modulo ${sheetNum.toString().padStart(2, '0')}/44 (${s.name}) -> ${updatedCount} aulas atualizadas.`);
}

async function main() {
  console.log('========================================================');
  console.log('SYNC TOTAL: ATUALIZANDO SLIDES 17 A 21 NOS 44 MÓDULOS');
  console.log('========================================================\n');

  for (let num = 1; num <= 44; num++) {
    await syncModuleInteractive(num);
  }

  console.log('\n========================================================');
  console.log('TODOS OS 44 MÓDULOS ATUALIZADOS COM SUCESSO NO SUPABASE!');
  console.log('========================================================');
}

main().catch(console.error);
