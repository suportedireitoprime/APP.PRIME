/**
 * Parser de Artigos em Partes Estruturadas (Caput, Pena, Parágrafos, Incisos, Alíneas).
 * 
 * Permite que a narração seja gerada e reproduzida em partes modulares,
 * possibilitando o destaque visual (grifo) de cada bloco estrutural correspondente.
 */

import type { ArtigoLei } from '@/data/mockData';

export type TipoParteArtigo = 'caput' | 'pena' | 'paragrafo' | 'inciso' | 'alinea' | 'outro';

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

function numeroParaOrdinal(n: number): string {
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

function numeroParaCardinal(n: number): string {
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

function numeroExtensoJuridico(n: number): string {
  if (n >= 1 && n <= 9) return numeroParaOrdinal(n);
  return numeroParaCardinal(n);
}

/** Limpa anotações editoriais do Planalto entre parênteses como (Redação dada pela...) */
export function limparAnotacoesEditoriais(texto: string): string {
  return texto
    .replace(/\(\s*(?:Reda[çc][ãa]o\s+dada|Inclu[ií]d[oa]|Acrescid[oa]|Alterad[oa]|Renumerad[oa]|Vide|Vig[êe]ncia|Regulamento|Produ[çc][ãa]o\s+de\s+efeitos|NR)[^)]*\)/gi, '')
    .replace(/\(\s*(?:Lei\s+(?:n[ºo°]?\s*)?\d|Decreto|Medida\s+Provis[oó]ria|Emenda\s+Constitucional|Lei\s+Complementar)[^)]*\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Normaliza o texto de um bloco específico para áudio TTS em português do Brasil
 */
export function normalizarParteParaTTS(blocoTexto: string, rotulo: string, numeroArtigo?: string): string {
  let r = limparAnotacoesEditoriais(blocoTexto);

  // Se for o Caput e ainda não tiver o prefixo formal, ajusta
  if (rotulo.toLowerCase().includes('caput') && numeroArtigo) {
    const limpoSemArt = r.replace(/^\s*(?:Artigo|Art)\.?\s*\d+[º°]?(?:\s*[-–—]\s*[A-Za-z])?\s*[.\-–—:]?\s*/i, '').trim();
    const numInt = parseInt(numeroArtigo.replace(/\D/g, ''), 10);
    const numExt = isNaN(numInt) ? numeroArtigo : numeroExtensoJuridico(numInt);
    r = `Artigo ${numExt}. ${limpoSemArt}`;
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
       .replace(/\breclus[ãa]o\b/gi, 'reclusão')
       .replace(/\bdeten[çc][ãa]o\b/gi, 'detenção');

  return r.trim();
}

/**
 * Fatiador inteligente de artigo em partes (Caput, Pena, Parágrafos, Incisos, Alíneas).
 */
export function parseArtigoEmPartes(artigo: ArtigoLei): ArtigoEstruturado {
  const partes: ArtigoParte[] = [];
  const rawCaput = artigo.caput || '';
  let ordem = 1;

  // Quebra por linhas preservando parágrafos e incisos
  const linhas = rawCaput
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  // Se não tiver quebras mas tiver os arrays separados de paragrafos/incisos
  const hasSeparatedFields = (artigo.paragrafos && artigo.paragrafos.length > 0) ||
                             (artigo.incisos && artigo.incisos.length > 0);

  if (linhas.length <= 1 && hasSeparatedFields) {
    // 1. Caput
    const caputLimpo = limparAnotacoesEditoriais(rawCaput);
    partes.push({
      id: `art_${artigo.numero}_caput`,
      ordem: ordem++,
      tipo: 'caput',
      rotulo: 'Caput',
      texto: caputLimpo,
      textoTTS: normalizarParteParaTTS(caputLimpo, 'Caput', artigo.numero),
    });

    // 2. Incisos se houver
    if (artigo.incisos) {
      artigo.incisos.forEach((inc, idx) => {
        const limpo = limparAnotacoesEditoriais(inc);
        const matchRom = limpo.match(/^([IVXLCDM]+)/i);
        const rotuloInc = matchRom ? `Inciso ${matchRom[1]}` : `Inciso ${idx + 1}`;
        partes.push({
          id: `art_${artigo.numero}_inc_${idx + 1}`,
          ordem: ordem++,
          tipo: 'inciso',
          rotulo: rotuloInc,
          texto: limpo,
          textoTTS: normalizarParteParaTTS(limpo, rotuloInc),
        });
      });
    }

    // 3. Parágrafos se houver
    if (artigo.paragrafos) {
      artigo.paragrafos.forEach((par, idx) => {
        const limpo = limparAnotacoesEditoriais(par);
        const isUnico = /único/i.test(limpo);
        const matchNum = limpo.match(/§\s*(\d+)/i);
        const rotuloPar = isUnico ? 'Parágrafo único' : matchNum ? `§ ${matchNum[1]}º` : `Parágrafo ${idx + 1}`;
        partes.push({
          id: `art_${artigo.numero}_p_${idx + 1}`,
          ordem: ordem++,
          tipo: 'paragrafo',
          rotulo: rotuloPar,
          texto: limpo,
          textoTTS: normalizarParteParaTTS(limpo, rotuloPar),
        });
      });
    }
  } else {
    // O texto completo está agrupado em linhas ou blocos dentro de rawCaput
    let caputAcumulado: string[] = [];
    let caputFechado = false;

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const isParagrafo = /^§|^(?:Par[áa]grafo\s+[úu]nico)/i.test(linha);
      const isInciso = /^[IVXLCDM]+\s*[-–—.]/i.test(linha);
      const isAlinea = /^[a-z]\)\s*/i.test(linha);
      const isPena = /^Pena\s*[-–—:]/i.test(linha);

      if (!caputFechado && !isParagrafo && !isInciso && !isAlinea && !isPena) {
        caputAcumulado.push(linha);
        continue;
      }

      // Fecha o caput se ainda estiver aberto
      if (!caputFechado && caputAcumulado.length > 0) {
        const textoCaput = caputAcumulado.join(' ');
        const caputLimpo = limparAnotacoesEditoriais(textoCaput);
        partes.push({
          id: `art_${artigo.numero}_caput`,
          ordem: ordem++,
          tipo: 'caput',
          rotulo: 'Caput',
          texto: caputLimpo,
          textoTTS: normalizarParteParaTTS(caputLimpo, 'Caput', artigo.numero),
        });
        caputFechado = true;
      }

      const limpo = limparAnotacoesEditoriais(linha);

      if (isPena) {
        partes.push({
          id: `art_${artigo.numero}_pena_${ordem}`,
          ordem: ordem++,
          tipo: 'pena',
          rotulo: 'Pena',
          texto: limpo,
          textoTTS: normalizarParteParaTTS(limpo, 'Pena'),
        });
      } else if (isParagrafo) {
        const isUnico = /único/i.test(limpo);
        const matchNum = limpo.match(/§\s*(\d+[º°]?(?:-[A-Za-z])?)/i);
        const rotulo = isUnico ? 'Parágrafo único' : matchNum ? `§ ${matchNum[1]}` : 'Parágrafo';
        partes.push({
          id: `art_${artigo.numero}_p_${ordem}`,
          ordem: ordem++,
          tipo: 'paragrafo',
          rotulo,
          texto: limpo,
          textoTTS: normalizarParteParaTTS(limpo, rotulo),
        });
      } else if (isInciso) {
        const matchRom = limpo.match(/^([IVXLCDM]+)/i);
        const rotulo = matchRom ? `Inciso ${matchRom[1]}` : 'Inciso';
        partes.push({
          id: `art_${artigo.numero}_inc_${ordem}`,
          ordem: ordem++,
          tipo: 'inciso',
          rotulo,
          texto: limpo,
          textoTTS: normalizarParteParaTTS(limpo, rotulo),
        });
      } else if (isAlinea) {
        const matchLetra = limpo.match(/^([a-z])\)/i);
        const rotulo = matchLetra ? `Alínea ${matchLetra[1]}` : 'Alínea';
        partes.push({
          id: `art_${artigo.numero}_al_${ordem}`,
          ordem: ordem++,
          tipo: 'alinea',
          rotulo,
          texto: limpo,
          textoTTS: normalizarParteParaTTS(limpo, rotulo),
        });
      } else {
        partes.push({
          id: `art_${artigo.numero}_bloco_${ordem}`,
          ordem: ordem++,
          tipo: 'outro',
          rotulo: `Item ${ordem - 1}`,
          texto: limpo,
          textoTTS: normalizarParteParaTTS(limpo, `Item ${ordem - 1}`),
        });
      }
    }

    // Se só tinha caput
    if (!caputFechado && caputAcumulado.length > 0) {
      const textoCaput = caputAcumulado.join(' ');
      const caputLimpo = limparAnotacoesEditoriais(textoCaput);
      partes.push({
        id: `art_${artigo.numero}_caput`,
        ordem: ordem++,
        tipo: 'caput',
        rotulo: 'Caput',
        texto: caputLimpo,
        textoTTS: normalizarParteParaTTS(caputLimpo, 'Caput', artigo.numero),
      });
    }
  }

  // Se por algum motivo o artigo for vazio
  if (partes.length === 0) {
    const textoFallback = limparAnotacoesEditoriais(rawCaput || `Artigo ${artigo.numero}`);
    partes.push({
      id: `art_${artigo.numero}_caput`,
      ordem: 1,
      tipo: 'caput',
      rotulo: 'Caput',
      texto: textoFallback,
      textoTTS: normalizarParteParaTTS(textoFallback, 'Caput', artigo.numero),
    });
  }

  const totalCaracteres = partes.reduce((acc, p) => acc + p.texto.length, 0);

  return {
    artigoNumero: artigo.numero,
    titulo: artigo.titulo,
    partes,
    totalCaracteres,
    totalPartes: partes.length,
    possuiSubdivisoes: partes.length > 1,
  };
}
