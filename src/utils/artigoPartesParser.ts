/**
 * Parser de Artigos para Narração Contínua e Fatiamento Inteligente (~1 minuto por áudio).
 * 
 * Regras Centrais:
 * 1. Narração Contínua: o artigo é narrado fluido, sem micro-cortes picotados por blocos de 3 segundos.
 * 2. Introdução Contextual Obrigatória:
 *    - Enuncia a Lei (ex: "Código Penal")
 *    - Enuncia o Capítulo / Título se houver (ex: "Capítulo primeiro: Da Aplicação da Lei Penal")
 *    - Enuncia o Artigo (ex: "Artigo primeiro: ...")
 * 3. Limite Seguro de ~1 Minuto (~800 a 850 caracteres por áudio):
 *    - Se o artigo couber em até ~850 caracteres, gera 1 ÚNICO áudio contínuo.
 *    - Se ultrapassar 1 minuto (ex: Art. 5º CF/88), fatia no próximo ponto final / fim de parágrafo / inciso
 *      para preservar a cadência natural e não distorcer a voz da IA.
 */

import type { ArtigoLei } from '@/data/mockData';
import { normalizeLegalLineBreaks, isLineEpigrafe } from '@/components/vademecum/artigo/artigoTextUtils';

export type TipoParteArtigo = 'caput' | 'pena' | 'paragrafo' | 'inciso' | 'alinea' | 'epigrafe' | 'outro' | 'artigo_completo' | 'continua';

export interface ArtigoParte {
  id: string;
  ordem: number;
  tipo: TipoParteArtigo;
  rotulo: string;
  texto: string;
  textoTTS: string;
  audioUrl?: string;
  duracaoSegundos?: number;
}

export interface ArtigoEstruturado {
  artigoNumero: string;
  titulo?: string;
  capitulo?: string;
  leiNome?: string;
  partes: ArtigoParte[];
  totalCaracteres: number;
  totalPartes: number;
  possuiSubdivisoes: boolean;
}

const LETRAS_EXTENSO: Record<string, string> = {
  a: 'á', b: 'bê', c: 'cê', d: 'dê', e: 'é',
  f: 'éfe', g: 'gê', h: 'agá', i: 'í', j: 'jota',
  k: 'cá', l: 'éle', m: 'ême', n: 'êne', o: 'ó',
  p: 'pê', q: 'quê', r: 'érre', s: 'ésse', t: 'tê',
  u: 'ú', v: 'vê', w: 'dáblio', x: 'xis', y: 'ípsilon', z: 'zê',
};

const ROMANOS_ORDINAIS: Record<string, string> = {
  I: 'primeiro', II: 'segundo', III: 'terceiro', IV: 'quarto', V: 'quinto',
  VI: 'sexto', VII: 'sétimo', VIII: 'oitavo', IX: 'nono', X: 'décimo',
  XI: 'décimo primeiro', XII: 'décimo segundo', XIII: 'décimo terceiro',
  XIV: 'décimo quarto', XV: 'décimo quinto', XVI: 'décimo sexto',
  XVII: 'décimo sétimo', XVIII: 'décimo oitavo', XIX: 'décimo nono',
  XX: 'vigésimo', XXI: 'vigésimo primeiro', XXII: 'vigésimo segundo',
  XXIII: 'vigésimo terceiro', XXIV: 'vigésimo quarto', XXV: 'vigésimo quinto',
  XXVI: 'vigésimo sexto', XXVII: 'vigésimo sétimo', XXVIII: 'vigésimo oitavo',
  XXIX: 'vigésimo nono', XXX: 'trigésimo',
};

const ORDINAIS_UNIDADES = ['', 'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono'];
const ORDINAIS_DEZENAS = ['', '', 'vigésimo', 'trigésimo', 'quadragésimo', 'quinquagésimo', 'sexagésimo', 'septuagésimo', 'octogésimo', 'nonagésimo'];

/** Regex seguro que remove prefixos como "Art. 1º -", "Art. 121.", "Art. 1º-A." sem engolir a primeira letra do caput */
const REGEX_PREFIXO_ARTIGO = /^\s*(?:Artigo|Art)\.?\s*\d+[º°]?(?:\s*[-–—]\s*[A-Za-z](?![a-zA-Záéíóúãõâêîôûàèìòù]))?\s*[.\-–—:]?\s*/i;

export function numeroParaOrdinal(n: number): string {
  if (n <= 0) return String(n);
  if (n === 10) return 'décimo';
  if (n < 10) return ORDINAIS_UNIDADES[n];
  if (n < 20) return 'décimo ' + ORDINAIS_UNIDADES[n - 10];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return ORDINAIS_DEZENAS[d] + (u ? ' ' + ORDINAIS_UNIDADES[u] : '');
  }
  return String(n);
}

export function numeroParaCardinal(n: number): string {
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const dezenas10a19 = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  if (n === 0) return 'zero';
  if (n === 100) return 'cem';
  if (n < 10) return unidades[n];
  if (n < 20) return dezenas10a19[n - 10];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return dezenas[d] + (u ? ' e ' + unidades[u] : '');
  }
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const resto = n % 100;
    return resto ? centenas[c] + ' e ' + numeroParaCardinal(resto) : centenas[c];
  }
  return String(n);
}

export function numeroExtensoJuridico(n: number): string {
  if (n >= 1 && n <= 9) return numeroParaOrdinal(n);
  return numeroParaCardinal(n);
}

/** Limpa anotações editoriais do Planalto entre parênteses como (Redação dada pela...) */
export function limparAnotacoesEditoriais(texto: string): string {
  return (texto || '')
    .replace(/\(\s*(?:Reda[çc][ãa]o\s+dada|Inclu[ií]d[oa]|Acrescid[oa]|Alterad[oa]|Renumerad[oa]|Vide|Vig[êe]ncia|Regulamento|Produ[çc][ãa]o\s+de\s+efeitos|NR)[^)]*\)/gi, '')
    .replace(/\(\s*(?:Lei\s+(?:n[ºo°]?\s*)?\d|Decreto|Medida\s+Provis[oó]ria|Emenda\s+Constitucional|Lei\s+Complementar)[^)]*\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Converte o nome da lei em uma pronúncia formal limpa para início da narração.
 * Exemplo explícito: Código Penal -> "Código Penal".
 */
export function formatarNomeLeiParaTTS(leiNome?: string, tabelaNome?: string): string {
  const base = (leiNome || '').trim();
  const tab = (tabelaNome || '').trim();

  // Código Penal -> "Código Penal" (conforme solicitado explicitamente pelo usuário)
  if (/^CP_CODIGO_PENAL$/i.test(tab) || /c[oó]digo\s*penal/i.test(base) || /c[oó]digo\s*penal/i.test(tab) || /^cp$/i.test(base)) {
    return 'Código Penal';
  }
  if (/^CC_CODIGO_CIVIL$/i.test(tab) || /c[oó]digo\s*civil/i.test(base) || /^cc$/i.test(base)) {
    return 'Código Civil';
  }
  if (/^CPP_CODIGO_PROCESSO_PENAL$/i.test(tab) || /processo\s*penal/i.test(base) || /^cpp$/i.test(base)) {
    return 'Código de Processo Penal';
  }
  if (/^CPC_CODIGO_PROCESSO_CIVIL$/i.test(tab) || /processo\s*civil/i.test(base) || /^cpc$/i.test(base)) {
    return 'Código de Processo Civil';
  }
  if (/^CF88_CONSTITUICAO_FEDERAL$/i.test(tab) || /constitui[çc][ãa]o/i.test(base) || /^cf/i.test(base)) {
    return 'Constituição Federal';
  }
  if (/^CLT/i.test(tab) || /trabalho|clt/i.test(base)) {
    return 'Consolidação das Leis do Trabalho, CLT';
  }
  if (/tribut[aá]rio/i.test(base) || /tributario/i.test(tab)) {
    return 'Código Tributário Nacional';
  }
  if (/consumidor/i.test(base) || /consumidor/i.test(tab)) {
    return 'Código de Defesa do Consumidor';
  }
  return base || tab.replace(/_/g, ' ');
}

/**
 * Capitaliza títulos em caixa alta jurídica mantendo conectivos e numerais romanos.
 */
function capitalizarTituloJuridico(str: string): string {
  const s = str.trim();
  if (s === s.toUpperCase()) {
    const lowerWords = new Set(['a', 'o', 'as', 'os', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'e', 'ou', 'por', 'para', 'com', 'sem']);
    return s.toLowerCase().split(/\s+/).map((word, idx) => {
      if (/^[ivxlcdm]+$/i.test(word)) return word.toUpperCase();
      if (idx > 0 && lowerWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }
  return s;
}

/**
 * Converte capítulo / título / parte em fala fonética jurídica.
 */
export function formatarContextoEstruturalParaTTS(
  capitulo?: string,
  titulo?: string,
  parte?: string,
  livro?: string,
  secao?: string,
  subsecao?: string
): string {
  const partes: string[] = [];

  // 1. Parte (ex: "Parte Geral")
  if (parte && parte.trim()) {
    let p = limparAnotacoesEditoriais(parte).trim();
    if (/^PARTE\s+(GERAL|ESPECIAL|[IVXLCDM0-9]+)/i.test(p)) {
      p = p.replace(/^PARTE\s+([A-Za-z0-9]+)/i, (_m, sub) => {
        const subLow = sub.toLowerCase();
        if (subLow === 'geral') return 'Parte Geral';
        if (subLow === 'especial') return 'Parte Especial';
        const ord = ROMANOS_ORDINAIS[sub.toUpperCase()] || sub;
        return `Parte ${ord}`;
      });
    }
    if (p) partes.push(p);
  }

  // 2. Livro (ex: "Livro I")
  if (livro && livro.trim()) {
    let l = limparAnotacoesEditoriais(livro).trim();
    if (/^LIVRO\s+([IVXLCDM]+)/i.test(l)) {
      l = l.replace(/^LIVRO\s+([IVXLCDM]+)\s*[-–—:]?\s*(.*)$/i, (_m, rom, resto) => {
        const ord = ROMANOS_ORDINAIS[rom.toUpperCase()] || rom;
        const restoFmt = resto ? capitalizarTituloJuridico(resto) : '';
        return restoFmt ? `Livro ${ord}, ${restoFmt}` : `Livro ${ord}`;
      });
    }
    if (l) partes.push(l);
  }

  // 3. Título (ex: "Título I - Da Aplicação da Lei Penal")
  if (titulo && titulo.trim()) {
    let t = limparAnotacoesEditoriais(titulo).trim();
    // Remove repetições acidentais como "TÍTULO I - TÍTULO I"
    t = t.replace(/(T[ÍI]TULO\s+[IVXLCDM0-9]+)\s*[-–—:]*\s*\1\b/gi, '$1')
         .replace(/\s*[-–—]\s*[-–—]\s*/g, ' - ')
         .trim();

    if (/^PARTE\s+(GERAL|ESPECIAL)/i.test(t) && !parte) {
      const matchParte = t.match(/^PARTE\s+(GERAL|ESPECIAL)\s*(?:[•–—\-:]\s*)?(.*)$/i);
      if (matchParte) {
        const parteNome = matchParte[1].toLowerCase() === 'geral' ? 'Parte Geral' : 'Parte Especial';
        partes.push(parteNome);
        t = (matchParte[2] || '').trim();
      }
    }
    if (/^T[ÍI]TULO\s+([IVXLCDM]+)/i.test(t)) {
      t = t.replace(/^T[ÍI]TULO\s+([IVXLCDM]+)\s*[-–—:]?\s*(.*)$/i, (_m, rom, resto) => {
        const ord = ROMANOS_ORDINAIS[rom.toUpperCase()] || rom;
        // Limpa se o resto repetir "Título X"
        const restoLimpo = (resto || '').replace(/^T[ÍI]TULO\s+[IVXLCDM0-9]+\s*[-–—:]*\s*/i, '').trim();
        const restoFmt = restoLimpo ? capitalizarTituloJuridico(restoLimpo) : '';
        return restoFmt ? `Título ${ord}, ${restoFmt}` : `Título ${ord}`;
      });
    } else if (/^PARTE\s+(GERAL|ESPECIAL)/i.test(t)) {
      t = t.replace(/^PARTE\s+(GERAL|ESPECIAL)\s*[-–—:]?\s*/i, 'Parte $1, ');
    }
    if (t) partes.push(t);
  }

  // 4. Capítulo (ex: "Capítulo I - Da Tentativa")
  if (capitulo && capitulo.trim()) {
    let c = limparAnotacoesEditoriais(capitulo).trim();
    // Remove repetições acidentais como "CAPÍTULO I - CAPÍTULO I"
    c = c.replace(/(CAP[ÍI]TULO\s+(?:[IVXLCDM0-9]+|[ÚU]NICO))\s*[-–—:]*\s*\1\b/gi, '$1')
         .replace(/\s*[-–—]\s*[-–—]\s*/g, ' - ')
         .trim();

    if (/^CAP[ÍI]TULO\s+([IVXLCDM]+)/i.test(c)) {
      c = c.replace(/^CAP[ÍI]TULO\s+([IVXLCDM]+)\s*[-–—:]?\s*(.*)$/i, (_m, rom, resto) => {
        const ord = ROMANOS_ORDINAIS[rom.toUpperCase()] || rom;
        const restoLimpo = (resto || '').replace(/^CAP[ÍI]TULO\s+(?:[IVXLCDM0-9]+|[ÚU]NICO)\s*[-–—:]*\s*/i, '').trim();
        const restoFmt = restoLimpo ? capitalizarTituloJuridico(restoLimpo) : '';
        return restoFmt ? `Capítulo ${ord}, ${restoFmt}` : `Capítulo ${ord}`;
      });
    } else if (/^CAP[ÍI]TULO\s+[ÚU]NICO/i.test(c)) {
      c = c.replace(/^CAP[ÍI]TULO\s+[ÚU]NICO\s*[-–—:]?\s*(.*)$/i, (_m, resto) => {
        const restoLimpo = (resto || '').replace(/^CAP[ÍI]TULO\s+[ÚU]NICO\s*[-–—:]*\s*/i, '').trim();
        const restoFmt = restoLimpo ? capitalizarTituloJuridico(restoLimpo) : '';
        return restoFmt ? `Capítulo único, ${restoFmt}` : 'Capítulo único';
      });
    }
    if (c) partes.push(c);
  }

  // 5. Seção (ex: "Seção I - Das Regras Gerais")
  if (secao && secao.trim()) {
    let s = limparAnotacoesEditoriais(secao).trim();
    s = s.replace(/(SE[ÇC][ÃA]O\s+(?:[IVXLCDM0-9]+|[ÚU]NICO))\s*[-–—:]*\s*\1\b/gi, '$1')
         .replace(/\s*[-–—]\s*[-–—]\s*/g, ' - ')
         .trim();

    if (/^SE[ÇC][ÃA]O\s+([IVXLCDM]+)/i.test(s)) {
      s = s.replace(/^SE[ÇC][ÃA]O\s+([IVXLCDM]+)\s*[-–—:]?\s*(.*)$/i, (_m, rom, resto) => {
        const ord = ROMANOS_ORDINAIS[rom.toUpperCase()] || rom;
        const restoLimpo = (resto || '').replace(/^SE[ÇC][ÃA]O\s+(?:[IVXLCDM0-9]+|[ÚU]NICO)\s*[-–—:]*\s*/i, '').trim();
        const restoFmt = restoLimpo ? capitalizarTituloJuridico(restoLimpo) : '';
        return restoFmt ? `Seção ${ord}, ${restoFmt}` : `Seção ${ord}`;
      });
    } else if (/^SE[ÇC][ÃA]O\s+[ÚU]NICO/i.test(s)) {
      s = s.replace(/^SE[ÇC][ÃA]O\s+[ÚU]NICO\s*[-–—:]?\s*(.*)$/i, (_m, resto) => {
        const restoLimpo = (resto || '').replace(/^SE[ÇC][ÃA]O\s+[ÚU]NICO\s*[-–—:]*\s*/i, '').trim();
        const restoFmt = restoLimpo ? capitalizarTituloJuridico(restoLimpo) : '';
        return restoFmt ? `Seção única, ${restoFmt}` : 'Seção única';
      });
    }
    if (s) partes.push(s);
  }

  // 6. Subseção
  if (subsecao && subsecao.trim()) {
    let s = limparAnotacoesEditoriais(subsecao).trim();
    s = s.replace(/(SUBSE[ÇC][ÃA]O\s+(?:[IVXLCDM0-9]+|[ÚU]NICO))\s*[-–—:]*\s*\1\b/gi, '$1')
         .replace(/\s*[-–—]\s*[-–—]\s*/g, ' - ')
         .trim();

    if (/^SUBSE[ÇC][ÃA]O\s+([IVXLCDM]+)/i.test(s)) {
      s = s.replace(/^SUBSE[ÇC][ÃA]O\s+([IVXLCDM]+)\s*[-–—:]?\s*(.*)$/i, (_m, rom, resto) => {
        const ord = ROMANOS_ORDINAIS[rom.toUpperCase()] || rom;
        const restoLimpo = (resto || '').replace(/^SUBSE[ÇC][ÃA]O\s+(?:[IVXLCDM0-9]+|[ÚU]NICO)\s*[-–—:]*\s*/i, '').trim();
        const restoFmt = restoLimpo ? capitalizarTituloJuridico(restoLimpo) : '';
        return restoFmt ? `Subseção ${ord}, ${restoFmt}` : `Subseção ${ord}`;
      });
    } else if (/^SUBSE[ÇC][ÃA]O\s+[ÚU]NICO/i.test(s)) {
      s = s.replace(/^SUBSE[ÇC][ÃA]O\s+[ÚU]NICO\s*[-–—:]?\s*(.*)$/i, (_m, resto) => {
        const restoLimpo = (resto || '').replace(/^SUBSE[ÇC][ÃA]O\s+[ÚU]NICO\s*[-–—:]*\s*/i, '').trim();
        const restoFmt = restoLimpo ? capitalizarTituloJuridico(restoLimpo) : '';
        return restoFmt ? `Subseção única, ${restoFmt}` : 'Subseção única';
      });
    }
    if (s) partes.push(s);
  }

  if (partes.length === 0) return '';
  return partes.join(', ').replace(/,\s*,/g, ',').replace(/\.\s*\./g, '.').trim();
}

/**
 * Converte o número do artigo em fala fonética jurídica.
 * Ex: "1º" -> "Artigo primeiro", "121" -> "Artigo cento e vinte e um", "121-A" -> "Artigo cento e vinte e um, letra A"
 */
export function formatarNumeroArtigoParaTTS(numeroArtigo: string): string {
  const limpo = numeroArtigo.replace(/^[Aa]rt\.?\s*/i, '').trim();
  const match = limpo.match(/^(\d+)(?:[º°])?(?:-([A-Za-z]))?/i);
  if (match) {
    const numInt = parseInt(match[1], 10);
    const sufixo = match[2];
    const numExt = isNaN(numInt) ? match[1] : numeroExtensoJuridico(numInt);
    if (sufixo) {
      const letraExt = LETRAS_EXTENSO[sufixo.toLowerCase()] || sufixo.toUpperCase();
      return `Artigo ${numExt}, letra ${letraExt}`;
    }
    return `Artigo ${numExt}`;
  }
  return `Artigo ${limpo}`;
}

/**
 * Normaliza blocos de texto (parágrafos, incisos, penas) para leitura de áudio fluida.
 */
export function normalizarParteParaTTS(blocoTexto: string, rotulo?: string, numeroArtigo?: string): string {
  let r = limparAnotacoesEditoriais(blocoTexto);

  if (rotulo && rotulo.toLowerCase().includes('caput') && numeroArtigo) {
    const limpoSemArt = r.replace(REGEX_PREFIXO_ARTIGO, '').trim();
    const artFalado = formatarNumeroArtigoParaTTS(numeroArtigo);
    r = `${artFalado}. ${limpoSemArt}`;
  }

  // Parágrafos: § 1º -> "Parágrafo primeiro.", § 10 -> "Parágrafo dez."
  r = r.replace(/§\s*[úu]nico[.\s-]*/gi, 'Parágrafo único. ');
  r = r.replace(/§\s*(\d+)[º°]?[.\s-]*/g, (_m, num) => {
    const n = parseInt(num, 10);
    return `Parágrafo ${numeroExtensoJuridico(n)}. `;
  });

  // Incisos: I - -> "Inciso primeiro."
  r = r.replace(/\b([IVXLCDM]+)\s*[-–—.:]\s*/g, (m, rom) => {
    const ord = ROMANOS_ORDINAIS[rom.toUpperCase()];
    return ord ? `Inciso ${ord}. ` : m;
  });

  // Alíneas: a) -> "Alínea á."
  r = r.replace(/(^|\n|\s)([a-z])\)\s*/gi, (_m, prefix, letra) => {
    const lExt = LETRAS_EXTENSO[letra.toLowerCase()] || letra;
    return `${prefix}Alínea ${lExt}. `;
  });

  // Pena: Pena - -> "Pena:"
  r = r.replace(/\bPena\s*[-–—:]\s*/gi, 'Pena: ');

  // Abreviações penais comuns
  r = r.replace(/\bCP\b/g, 'Código Penal')
       .replace(/\bCC\b/g, 'Código Civil')
       .replace(/\bCF\b/g, 'Constituição Federal')
       .replace(/\bCPP\b/g, 'Código de Processo Penal');

  return r.replace(/\s{2,}/g, ' ').trim();
}

export interface OpcoesParseArtigo {
  leiNome?: string;
  tabelaNome?: string;
  /** Limite máximo de caracteres por áudio (padrão 850 chars ≈ 1 minuto de fala) */
  maxCharsPorParte?: number;
}

/**
 * Fatiador Contínuo com Introdução de Contexto e Limite de ~1 Minuto por Áudio.
 * 
 * Estrutura:
 * 1. Introdução: [Nome da Lei]. [Capítulo/Título se houver]. [Artigo X]: [Caput].
 * 2. Concatenação contínua de parágrafos, incisos e penas sem picotar.
 * 3. Se o total couber em ~850 caracteres, gera 1 parte única.
 * 4. Se passar de ~850 caracteres, divide em pontos finais / quebras naturais de parágrafo/inciso,
 *    criando Parte 1, Parte 2, etc. cada uma respeitando ~1 minuto.
 */
export function parseArtigoEmNarracaoContinua(
  artigo: ArtigoLei,
  opcoes?: OpcoesParseArtigo
): ArtigoEstruturado {
  const maxChars = opcoes?.maxCharsPorParte || 850;
  const rawCaput = artigo.caput || '';
  const numArtigoLimpo = String(artigo.numero).replace(/^[Aa]rt\.?\s*/i, '').trim();

  // 1. Monta os elementos da introdução
  const nomeLeiFalado = formatarNomeLeiParaTTS(opcoes?.leiNome, opcoes?.tabelaNome);
  const contextoEstruturalFalado = formatarContextoEstruturalParaTTS(
    artigo.capitulo,
    artigo.titulo,
    artigo.parte,
    artigo.livro,
    artigo.secao,
    artigo.subsecao
  );
  const prefixoArtigoFalado = formatarNumeroArtigoParaTTS(artigo.numero);

  let introTTS = '';
  if (nomeLeiFalado) introTTS += `${nomeLeiFalado}`;
  if (contextoEstruturalFalado) {
    introTTS += introTTS ? `, ${contextoEstruturalFalado}. ` : `${contextoEstruturalFalado}. `;
  } else if (introTTS) {
    introTTS += '. ';
  }
  
  const nomenJuris = artigo.nomen_juris || artigo.epigrafe;
  if (nomenJuris) {
    introTTS += `${nomenJuris.trim().replace(/\.+$/, '')}. `;
  }
  
  introTTS += `${prefixoArtigoFalado}: `;

  // 2. Extrai os blocos textuais ordenados do artigo
  const blocosBrutos: Array<{ textoOriginal: string; textoTTS: string; tipo: TipoParteArtigo }> = [];

  // Linhas do caput normalizadas (desmembrando epígrafes internas)
  const linhasCaput = normalizeLegalLineBreaks(rawCaput)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const hasSeparatedFields = (artigo.paragrafos && artigo.paragrafos.length > 0) ||
                             (artigo.incisos && artigo.incisos.length > 0);

  if (linhasCaput.length <= 1 && hasSeparatedFields) {
    // Caput
    const caputLimpo = limparAnotacoesEditoriais(rawCaput);
    const caputSemPrefixo = caputLimpo.replace(REGEX_PREFIXO_ARTIGO, '').trim();
    blocosBrutos.push({
      textoOriginal: caputLimpo,
      textoTTS: caputSemPrefixo,
      tipo: 'caput',
    });

    // Incisos
    if (artigo.incisos) {
      artigo.incisos.forEach((inc) => {
        const limpo = limparAnotacoesEditoriais(inc);
        blocosBrutos.push({
          textoOriginal: limpo,
          textoTTS: normalizarParteParaTTS(limpo),
          tipo: 'inciso',
        });
      });
    }

    // Parágrafos
    if (artigo.paragrafos) {
      artigo.paragrafos.forEach((par) => {
        const limpo = limparAnotacoesEditoriais(par);
        blocosBrutos.push({
          textoOriginal: limpo,
          textoTTS: normalizarParteParaTTS(limpo),
          tipo: 'paragrafo',
        });
      });
    }
  } else {
    // O texto completo está agrupado em linhas dentro de rawCaput
    const caputAcumulado: string[] = [];
    let caputFechado = false;

    for (let i = 0; i < linhasCaput.length; i++) {
      const linha = linhasCaput[i];
      const isParagrafo = /^§|^(?:Par[áa]grafo\s+[úu]nico)/i.test(linha);
      const isInciso = /^[IVXLCDM]+\s*[-–—.]/i.test(linha);
      const isAlinea = /^[a-z]\)\s*/i.test(linha);
      const isPena = /^Pena\s*[-–—:]/i.test(linha);
      const isEpigrafe = isLineEpigrafe(linha);

      if (!caputFechado && !isParagrafo && !isInciso && !isAlinea && !isPena && !isEpigrafe) {
        caputAcumulado.push(linha);
        continue;
      }

      if (!caputFechado && caputAcumulado.length > 0) {
        const caputTexto = caputAcumulado.join(' ');
        const caputLimpo = limparAnotacoesEditoriais(caputTexto);
        const caputSemPrefixo = caputLimpo.replace(REGEX_PREFIXO_ARTIGO, '').trim();
        blocosBrutos.push({
          textoOriginal: caputLimpo,
          textoTTS: caputSemPrefixo,
          tipo: 'caput',
        });
        caputFechado = true;
      }

      const limpo = limparAnotacoesEditoriais(linha);
      const tipo: TipoParteArtigo = isPena ? 'pena' : isParagrafo ? 'paragrafo' : isInciso ? 'inciso' : isAlinea ? 'alinea' : isEpigrafe ? 'epigrafe' : 'outro';
      blocosBrutos.push({
        textoOriginal: limpo,
        textoTTS: normalizarParteParaTTS(limpo),
        tipo,
      });
    }

    if (!caputFechado && caputAcumulado.length > 0) {
      const caputTexto = caputAcumulado.join(' ');
      const caputLimpo = limparAnotacoesEditoriais(caputTexto);
      const caputSemPrefixo = caputLimpo.replace(REGEX_PREFIXO_ARTIGO, '').trim();
      blocosBrutos.push({
        textoOriginal: caputLimpo,
        textoTTS: caputSemPrefixo,
        tipo: 'caput',
      });
    }
  }

  // Se por ventura nenhum bloco foi extraído
  if (blocosBrutos.length === 0) {
    const fb = limparAnotacoesEditoriais(rawCaput || `Artigo ${numArtigoLimpo}`);
    blocosBrutos.push({
      textoOriginal: fb,
      textoTTS: fb,
      tipo: 'caput',
    });
  }

  // 3. Agrupamento estrutural contínuo (Caput, Parágrafos)
  const partes: ArtigoParte[] = [];
  
  const grupos: Array<{
    tipo: TipoParteArtigo;
    blocos: typeof blocosBrutos;
  }> = [];

  let grupoAtual: { tipo: TipoParteArtigo; blocos: typeof blocosBrutos } | null = null;

  for (const bloco of blocosBrutos) {
    if (bloco.tipo === 'paragrafo') {
      if (grupoAtual && grupoAtual.blocos.length > 0) {
        grupos.push(grupoAtual);
      }
      grupoAtual = { tipo: 'paragrafo', blocos: [bloco] };
    } else if (bloco.tipo === 'caput' || bloco.tipo === 'epigrafe') {
      if (grupoAtual && grupoAtual.blocos.length > 0) {
        grupos.push(grupoAtual);
      }
      grupoAtual = { tipo: 'caput', blocos: [bloco] };
    } else {
      if (grupoAtual && (grupoAtual.tipo === 'caput' || grupoAtual.tipo === 'epigrafe')) {
        grupos.push(grupoAtual);
        grupoAtual = { tipo: 'outro', blocos: [] };
      }
      if (!grupoAtual) {
        grupoAtual = { tipo: 'outro', blocos: [] };
      }
      grupoAtual.blocos.push(bloco);
    }
  }
  if (grupoAtual && grupoAtual.blocos.length > 0) {
    grupos.push(grupoAtual);
  }

  grupos.forEach((grupo, idx) => {
    const textoOrig = grupo.blocos.map((b) => b.textoOriginal.trim()).filter(Boolean).join('\n\n');
    let textoTTS = grupo.blocos.map((b) => b.textoTTS.trim()).filter(Boolean).join(' ');

    if (idx === 0) {
      textoTTS = `${introTTS}${textoTTS}`.trim();
    }

    partes.push({
      id: `art_${numArtigoLimpo}_parte_${idx + 1}`,
      ordem: idx + 1,
      tipo: grupos.length === 1 ? 'artigo_completo' : grupo.tipo,
      rotulo: grupos.length === 1 ? 'Artigo Completo' : `Parte ${idx + 1} de ${grupos.length}`,
      texto: textoOrig,
      textoTTS: textoTTS,
    });
  });

  const totalCaracteres = partes.reduce((acc, p) => acc + p.texto.length, 0);

  return {
    artigoNumero: artigo.numero,
    titulo: artigo.titulo,
    capitulo: artigo.capitulo,
    leiNome: opcoes?.leiNome,
    partes,
    totalCaracteres,
    totalPartes: partes.length,
    possuiSubdivisoes: partes.length > 1,
  };
}

/**
 * Função retrocompatível chamada pelas telas existentes.
 * Por padrão aplica o novo modelo de narração contínua inteligente.
 */
export function parseArtigoEmPartes(
  artigo: ArtigoLei,
  leiNome?: string,
  tabelaNome?: string
): ArtigoEstruturado {
  return parseArtigoEmNarracaoContinua(artigo, { leiNome, tabelaNome });
}
