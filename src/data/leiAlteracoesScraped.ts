/**
 * Gerenciador de Alterações Legislativas Extraídas do Planalto.
 * Substitui definitivamente a leitura antiga por regex no caput dos artigos,
 * priorizando os dados reais de varredura oficial (ScrapedArticleUpdate) com mês abreviado / ano.
 */
// O getSeedsRegistry foi depreciado pois as sementes estão no banco Supabase

export interface ScrapedArticleUpdate {
  artigo: string;          // Ex: "Art. 92" ou "Art. 121"
  motivo: string;          // Ex: "(Incluído pela Lei nº 15.358, de 2026)"
  ano: number;             // Ex: 2026
  mes?: string;            // Ex: "Jan" ou "Ago"
  mes_ano?: string;        // Ex: "Ago/2026"
  mes_completo?: string;   // Ex: "Agosto"
  mes_index?: number;      // 1 a 12 (para ordenação)
  texto_antigo: string;    // Texto revogado ou anterior
  texto_novo: string;      // Texto atualizado no Planalto
  link_lei?: string;       // Link oficial da norma modificadora
  data_completa?: string;
}

const MESES_MAP: Record<string, { abbr: string; full: string; idx: number }> = {
  janeiro: { abbr: 'Jan', full: 'Janeiro', idx: 1 },
  jan: { abbr: 'Jan', full: 'Janeiro', idx: 1 },
  fevereiro: { abbr: 'Fev', full: 'Fevereiro', idx: 2 },
  fev: { abbr: 'Fev', full: 'Fevereiro', idx: 2 },
  março: { abbr: 'Mar', full: 'Março', idx: 3 },
  marco: { abbr: 'Mar', full: 'Março', idx: 3 },
  mar: { abbr: 'Mar', full: 'Março', idx: 3 },
  abril: { abbr: 'Abr', full: 'Abril', idx: 4 },
  abr: { abbr: 'Abr', full: 'Abril', idx: 4 },
  maio: { abbr: 'Mai', full: 'Maio', idx: 5 },
  mai: { abbr: 'Mai', full: 'Maio', idx: 5 },
  junho: { abbr: 'Jun', full: 'Junho', idx: 6 },
  jun: { abbr: 'Jun', full: 'Junho', idx: 6 },
  julho: { abbr: 'Jul', full: 'Julho', idx: 7 },
  jul: { abbr: 'Jul', full: 'Julho', idx: 7 },
  agosto: { abbr: 'Ago', full: 'Agosto', idx: 8 },
  ago: { abbr: 'Ago', full: 'Agosto', idx: 8 },
  setembro: { abbr: 'Set', full: 'Setembro', idx: 9 },
  set: { abbr: 'Set', full: 'Setembro', idx: 9 },
  outubro: { abbr: 'Out', full: 'Outubro', idx: 10 },
  out: { abbr: 'Out', full: 'Outubro', idx: 10 },
  novembro: { abbr: 'Nov', full: 'Novembro', idx: 11 },
  nov: { abbr: 'Nov', full: 'Novembro', idx: 11 },
  dezembro: { abbr: 'Dez', full: 'Dezembro', idx: 12 },
  dez: { abbr: 'Dez', full: 'Dezembro', idx: 12 },
};

/**
 * Base de conhecimento das leis modificadoras oficiais do Código Penal e Vade Mecum,
 * garantindo datação precisa mesmo quando o texto compilado do Planalto omite o dia e mês.
 */
export const KNOWN_LEIS_DATAS: Record<string, { mes: string; ano: number; mesIndex: number; mesCompleto: string; dia: number }> = {
  '15487': { mes: 'Ago', ano: 2026, mesIndex: 8, mesCompleto: 'Agosto', dia: 6 },
  '15438': { mes: 'Jan', ano: 2026, mesIndex: 1, mesCompleto: 'Janeiro', dia: 16 },
  '15358': { mes: 'Jan', ano: 2026, mesIndex: 1, mesCompleto: 'Janeiro', dia: 14 },
  '15397': { mes: 'Abr', ano: 2026, mesIndex: 4, mesCompleto: 'Abril', dia: 30 },
  '15280': { mes: 'Dez', ano: 2025, mesIndex: 12, mesCompleto: 'Dezembro', dia: 5 },
  '15229': { mes: 'Nov', ano: 2025, mesIndex: 11, mesCompleto: 'Novembro', dia: 12 },
  '15181': { mes: 'Jul', ano: 2025, mesIndex: 7, mesCompleto: 'Julho', dia: 28 },
  '15159': { mes: 'Jul', ano: 2025, mesIndex: 7, mesCompleto: 'Julho', dia: 3 },
  '15123': { mes: 'Abr', ano: 2025, mesIndex: 4, mesCompleto: 'Abril', dia: 23 },
  '14994': { mes: 'Out', ano: 2024, mesIndex: 10, mesCompleto: 'Outubro', dia: 9 },
  '14904': { mes: 'Jun', ano: 2024, mesIndex: 6, mesCompleto: 'Junho', dia: 27 },
  '14843': { mes: 'Abr', ano: 2024, mesIndex: 4, mesCompleto: 'Abril', dia: 11 },
  '14836': { mes: 'Abr', ano: 2024, mesIndex: 4, mesCompleto: 'Abril', dia: 8 },
  '14811': { mes: 'Jan', ano: 2024, mesIndex: 1, mesCompleto: 'Janeiro', dia: 15 },
  '14711': { mes: 'Out', ano: 2023, mesIndex: 10, mesCompleto: 'Outubro', dia: 30 },
  '14620': { mes: 'Jul', ano: 2023, mesIndex: 7, mesCompleto: 'Julho', dia: 13 },
  '14562': { mes: 'Abr', ano: 2023, mesIndex: 4, mesCompleto: 'Abril', dia: 26 },
  '14532': { mes: 'Jan', ano: 2023, mesIndex: 1, mesCompleto: 'Janeiro', dia: 11 },
  '14382': { mes: 'Jun', ano: 2022, mesIndex: 6, mesCompleto: 'Junho', dia: 27 },
  '14344': { mes: 'Mai', ano: 2022, mesIndex: 5, mesCompleto: 'Maio', dia: 24 },
  '14195': { mes: 'Ago', ano: 2021, mesIndex: 8, mesCompleto: 'Agosto', dia: 26 },
  '14155': { mes: 'Mai', ano: 2021, mesIndex: 5, mesCompleto: 'Maio', dia: 27 },
  '14132': { mes: 'Mar', ano: 2021, mesIndex: 3, mesCompleto: 'Março', dia: 31 },
  '13964': { mes: 'Dez', ano: 2019, mesIndex: 12, mesCompleto: 'Dezembro', dia: 24 },
  '13869': { mes: 'Set', ano: 2019, mesIndex: 9, mesCompleto: 'Setembro', dia: 5 },
  '13718': { mes: 'Set', ano: 2018, mesIndex: 9, mesCompleto: 'Setembro', dia: 24 },
  '13654': { mes: 'Abr', ano: 2018, mesIndex: 4, mesCompleto: 'Abril', dia: 23 },
  '13344': { mes: 'Out', ano: 2016, mesIndex: 10, mesCompleto: 'Outubro', dia: 6 },
  '13104': { mes: 'Mar', ano: 2015, mesIndex: 3, mesCompleto: 'Março', dia: 9 },
  '12850': { mes: 'Ago', ano: 2013, mesIndex: 8, mesCompleto: 'Agosto', dia: 2 },
  '12737': { mes: 'Nov', ano: 2012, mesIndex: 11, mesCompleto: 'Novembro', dia: 30 },
  '12015': { mes: 'Ago', ano: 2009, mesIndex: 8, mesCompleto: 'Agosto', dia: 7 },
};

export function extractMesAno(
  motivo: string,
  anoFallback = 2026,
  dataCompleta?: string,
  linkLei?: string
): { mes: string; ano: number; mesAno: string; mesCompleto: string; mesIndex: number } {
  const anoFinal = anoFallback || 2026;

  // 1. Prioridade: Reconhecimento por número da Lei no motivo ou no link oficial
  const strSearch = `${motivo || ''} ${linkLei || ''}`;
  const matchLeiNum = strSearch.match(/lei(?:\s+n[º°.]?)?\s*(\d{1,2})[.\s]?(\d{3})/i) || strSearch.match(/l(\d{5})/i);
  if (matchLeiNum) {
    const rawNum = matchLeiNum[2] ? `${matchLeiNum[1]}${matchLeiNum[2]}` : matchLeiNum[1];
    if (KNOWN_LEIS_DATAS[rawNum]) {
      const k = KNOWN_LEIS_DATAS[rawNum];
      return {
        mes: k.mes,
        ano: k.ano,
        mesAno: `${k.mes}/${k.ano}`,
        mesCompleto: k.mesCompleto,
        mesIndex: k.mesIndex,
      };
    }
  }

  // 2. Data completa do deep scrape (ex: "6 DE AGOSTO DE 2026" ou "2026-08-06")
  if (dataCompleta) {
    const matchExtenso = dataCompleta.match(/(?:em|de)?\s*(\d{1,2})\s+de\s+([a-zA-Zç]+)\s+de\s+(\d{4})/i);
    if (matchExtenso) {
      const mStr = matchExtenso[2].toLowerCase();
      const aNum = parseInt(matchExtenso[3], 10);
      const mesInfo = MESES_MAP[mStr];
      if (mesInfo) {
        return {
          mes: mesInfo.abbr,
          ano: aNum,
          mesAno: `${mesInfo.abbr}/${aNum}`,
          mesCompleto: mesInfo.full,
          mesIndex: mesInfo.idx,
        };
      }
    }

    const dMatch = dataCompleta.match(/(\d{4})-(\d{2})/);
    if (dMatch) {
      const mIdx = parseInt(dMatch[2], 10);
      const meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesesCompletos = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const mName = meses[mIdx] || 'Jan';
      const mFull = mesesCompletos[mIdx] || 'Janeiro';
      return {
        mes: mName,
        ano: parseInt(dMatch[1], 10),
        mesAno: `${mName}/${dMatch[1]}`,
        mesCompleto: mFull,
        mesIndex: mIdx,
      };
    }
  }

  // 3. Data por extenso no motivo (ex: "de 6 de agosto de 2026")
  const matchDataExtensa = motivo.match(/(?:em|de)\s+(\d{1,2})\s+de\s+([a-zA-Zç]+)\s+de\s+(\d{4})/i);
  if (matchDataExtensa) {
    const mStr = matchDataExtensa[2].toLowerCase();
    const aNum = parseInt(matchDataExtensa[3], 10);
    const mesInfo = MESES_MAP[mStr];
    if (mesInfo) {
      return {
        mes: mesInfo.abbr,
        ano: aNum,
        mesAno: `${mesInfo.abbr}/${aNum}`,
        mesCompleto: mesInfo.full,
        mesIndex: mesInfo.idx,
      };
    }
  }

  // 4. Mês e ano no motivo (ex: "agosto de 2026")
  const matchMesAno = motivo.match(/([a-zA-Zç]+)\s+de\s+(\d{4})/i);
  if (matchMesAno) {
    const mStr = matchMesAno[1].toLowerCase();
    const mesInfo = MESES_MAP[mStr];
    if (mesInfo) {
      const aNum = parseInt(matchMesAno[2], 10);
      return {
        mes: mesInfo.abbr,
        ano: aNum,
        mesAno: `${mesInfo.abbr}/${aNum}`,
        mesCompleto: mesInfo.full,
        mesIndex: mesInfo.idx,
      };
    }
  }

  // Fallback baseado no ano
  return {
    mes: 'Jan',
    ano: anoFinal,
    mesAno: `Jan/${anoFinal}`,
    mesCompleto: 'Janeiro',
    mesIndex: 1,
  };
}

/**
 * Normaliza e enriquece qualquer lista de alterações com mês, ano e ordenação cronológica decrescente.
 */
export function normalizeAlteracoes(items: ScrapedArticleUpdate[]): ScrapedArticleUpdate[] {
  return items.map(item => {
    const { mes, ano, mesAno, mesCompleto, mesIndex } = extractMesAno(
      item.motivo || '',
      item.ano,
      item.data_completa,
      item.link_lei
    );
    return {
      ...item,
      ano: item.ano || ano,
      mes: item.mes || mes,
      mes_ano: mesAno,
      mes_completo: mesCompleto,
      mes_index: mesIndex,
    };
  }).sort((a, b) => {
    const scoreA = (a.ano || 0) * 100 + (a.mes_index || 0);
    const scoreB = (b.ano || 0) * 100 + (b.mes_index || 0);
    return scoreB - scoreA;
  });
}

export interface DispositivoInfo {
  acao: 'incluido' | 'revogado' | 'redacao_dada' | 'atualizado';
  acaoTexto: string;
  tipoDispositivo: 'alinea' | 'inciso' | 'paragrafo' | 'caput' | 'artigo' | 'pena';
  rotuloDispositivo: string;
  tituloDestaque: string;
  leiReferencia: string;
  resumoLimpo: string;
  badgeCor: {
    bg: string;
    text: string;
    border: string;
  };
  artigoBase: string;              // Ex: "Art. 156" (sem hífen ou pontuação residual)
  artigoDisplayCompleto: string;   // Ex: "Art. 156, Inciso XI", "Art. 216-B, § 2º"
  acaoDescritiva: string;          // Ex: "Foi incluído o Inciso XI", "Foi revogado o Inciso IV"
  descricaoCompleta: string;       // Ex: "Foi incluído o Inciso XI: se a subtração for de petróleo..."
  corpoTexto: string;              // Trecho limpo do dispositivo sem duplicações
}

export type ParseDispositivoInput = {
  artigo?: string;
  artigo_numero?: string;
  motivo?: string;
  texto_novo?: string | null;
  texto_atual?: string | null;
  texto_antigo?: string | null;
  texto_anterior?: string | null;
  tipo_alteracao?: string | null;
  ano?: number;
  link_lei?: string;
};

/**
 * Analisa e extrai com precisão cirúrgica o dispositivo alterado (Alínea, Inciso, Parágrafo, Caput ou Artigo)
 * e a ação correspondente (Incluído, Revogado, Redação dada), formatando títulos completos e frases descritivas.
 */
export function parseDispositivoAlteracao(item: ScrapedArticleUpdate | ParseDispositivoInput): DispositivoInfo {
  const rawArtigo = (item.artigo || (item as any).artigo_numero || '').trim();
  const motivoRaw = (item.motivo || '').replace(/^[()]+|[()]+$/g, '').trim();
  const textoNovoRaw = ((item.texto_novo || (item as any).texto_atual || '') as string).trim();
  const textoAntigoRaw = ((item.texto_antigo || (item as any).texto_anterior || '') as string).trim();
  const tipoAlteracaoRaw = (((item as any).tipo_alteracao || '') as string).toLowerCase();
  const searchCorpus = `${rawArtigo} ${motivoRaw} ${textoNovoRaw} ${textoAntigoRaw}`.toLowerCase();

  // 1. Limpeza rigorosa do número base do artigo (ex: "Art. 156 -" -> "Art. 156", "Art. 216-B." -> "Art. 216-B")
  let artigoBase = rawArtigo.replace(/[\s\-–—:.]*$/, '').trim();
  // Se o número tiver um subdispositivo já embutido (ex: "Art. 156 - XI")
  const matchArtigoSeparado = artigoBase.match(/^Art\.?\s*(\d+[A-Za-z-–—\d]*)\s*[-–,]\s*(.+)$/i);
  if (matchArtigoSeparado) {
    artigoBase = `Art. ${matchArtigoSeparado[1].replace(/[\s\-–—:.]*$/, '').trim()}`;
  } else if (!/^art/i.test(artigoBase) && artigoBase) {
    artigoBase = `Art. ${artigoBase}`;
  }
  if (!artigoBase) {
    artigoBase = 'Artigo';
  }

  // 2. Identifica a Lei Modificadora (ex: "Lei nº 15.517, de 2026")
  let leiReferencia = '';
  const matchLei = motivoRaw.match(/(?:pela\s+)?(Lei(?:\s+Federal)?(?:\s+n[º°.]?)?\s*[\d.]+(?:,?\s+de\s+\d{1,2}\s+de\s+[a-zA-Zç]+\s+de\s+\d{4}|,?\s+de\s+\d{4})?)/i) ||
                   motivoRaw.match(/(Decreto-Lei(?:\s+n[º°.]?)?\s*[\d.]+(?:,?\s+de\s+\d{4})?)/i) ||
                   motivoRaw.match(/(Emenda\s+Constitucional(?:\s+n[º°.]?)?\s*\d+)/i);
  if (matchLei) {
    leiReferencia = matchLei[1].replace(/^pela\s+/i, '').trim();
  } else {
    const matchLinkLei = (item.link_lei || '').match(/l(\d{4,5})/i);
    if (matchLinkLei) {
      leiReferencia = `Lei nº ${matchLinkLei[1]}`;
    } else {
      leiReferencia = item.ano ? `Ano ${item.ano}` : 'Legislação Oficial';
    }
  }

  // 3. Identifica a Ação (Revogado, Incluído, Redação dada / Alterado)
  let acao: DispositivoInfo['acao'] = 'atualizado';
  let acaoTexto = 'Alterado';
  let badgeCor = {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30'
  };

  if (tipoAlteracaoRaw === 'artigo_revogado' || /revogad[ao]|revoga-se|suprimid[ao]|vetad[ao]/i.test(searchCorpus)) {
    acao = 'revogado';
    acaoTexto = 'Revogado';
    badgeCor = {
      bg: 'bg-rose-500/20',
      text: 'text-rose-400',
      border: 'border-rose-500/35'
    };
  } else if (tipoAlteracaoRaw === 'artigo_novo' || /inclu[íi]d[ao]|acrescid[ao]|inserid[ao]/i.test(searchCorpus)) {
    acao = 'incluido';
    acaoTexto = 'Incluído';
    badgeCor = {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/35'
    };
  } else if (tipoAlteracaoRaw === 'texto_alterado' || /reda[çc][ãa]o\s+dada|alterad[ao]/i.test(searchCorpus)) {
    acao = 'redacao_dada';
    acaoTexto = 'Alterado';
    badgeCor = {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/35'
    };
  }

  // 3.1 Overrides lógicos para casos que o scraper classificou como alterado ou não identificou a ação,
  // mas na prática não existe texto antigo (sendo portanto uma inclusão inédita).
  const isTextoAntigoInvalido = !textoAntigoRaw || textoAntigoRaw.toLowerCase() === 'redação anterior.' || textoAntigoRaw.toLowerCase() === 'dispositivo inédito (incluído pela primeira vez)';
  if ((acao === 'redacao_dada' || acao === 'atualizado') && isTextoAntigoInvalido && textoNovoRaw) {
    if (!/reda[çc][ãa]o\s+dada|alterad[ao]/i.test(motivoRaw)) {
      acao = 'incluido';
      acaoTexto = 'Incluído';
      badgeCor = {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-400',
        border: 'border-emerald-500/35'
      };
    }
  }

  // 4. Identifica o Dispositivo Específico (Alínea, Inciso, Parágrafo, Caput, Pena, Artigo)
  let tipoDispositivo: DispositivoInfo['tipoDispositivo'] = 'artigo';
  let rotuloDispositivo = artigoBase;
  let tituloDestaque = `${acaoTexto} no ${artigoBase}`;

  // 4.1. Alínea (ex: 'Alínea "a"', 'Alínea "b"')
  const matchAlinea = motivoRaw.match(/\bal[íi]nea\s+['"]?([a-z])['"]?/i) ||
                      textoNovoRaw.match(/^\(?\s*([a-z])\)\s*[-–]/i) ||
                      motivoRaw.match(/^\(?\s*([a-z])\)\s*[-–]/i) ||
                      textoAntigoRaw.match(/^\(?\s*([a-z])\)\s*[-–]/i);
  if (matchAlinea) {
    const letra = matchAlinea[1].toLowerCase();
    tipoDispositivo = 'alinea';
    rotuloDispositivo = `Alínea "${letra}"`;
    const acaoFem = acao === 'incluido' ? 'Incluída' : acao === 'revogado' ? 'Revogada' : acaoTexto;
    tituloDestaque = acao === 'redacao_dada' ? `Redação dada à ${rotuloDispositivo}` : `${acaoFem} ${rotuloDispositivo}`;
  }
  // 4.2. Inciso (Algarismo Romano no início do texto ou motivo: ex: "XI - ...", "IV - ...")
  else {
    const matchInciso = motivoRaw.match(/\binciso\s+([IVXLCDM]+)\b/i) ||
                        motivoRaw.match(/^\(?\s*([IVXLCDM]{1,8})\s*[-–]\s+/i) ||
                        textoNovoRaw.match(/^\(?\s*([IVXLCDM]{1,8})\s*[-–]\s+/i) ||
                        textoNovoRaw.match(/\binciso\s+([IVXLCDM]+)\b/i) ||
                        textoAntigoRaw.match(/^\(?\s*([IVXLCDM]{1,8})\s*[-–]\s+/i) ||
                        rawArtigo.match(/[-–,\s]+([IVXLCDM]{1,8})\s*$/i);
    if (matchInciso) {
      const romano = matchInciso[1].toUpperCase();
      tipoDispositivo = 'inciso';
      rotuloDispositivo = `Inciso ${romano}`;
      tituloDestaque = acao === 'redacao_dada' ? `Redação dada ao ${rotuloDispositivo}` : `${acaoTexto} ${rotuloDispositivo}`;
    }
    // 4.3. Parágrafo (ex: "§ 4º", "§ 2º", "§ 4º-B", "Parágrafo único")
    else {
      const matchParagrafo = motivoRaw.match(/(§\s*\d+[º°]?(?:[-–]\w+)?|par[áa]grafo\s+[úu]nico|par[áa]grafo\s+\d+[º°]?(?:[-–]\w+)?)/i) ||
                             textoNovoRaw.match(/(§\s*\d+[º°]?(?:[-–]\w+)?|par[áa]grafo\s+[úu]nico|par[áa]grafo\s+\d+[º°]?(?:[-–]\w+)?)/i) ||
                             textoAntigoRaw.match(/(§\s*\d+[º°]?(?:[-–]\w+)?|par[áa]grafo\s+[úu]nico|par[áa]grafo\s+\d+[º°]?(?:[-–]\w+)?)/i);
      if (matchParagrafo) {
        let pTxt = matchParagrafo[1].replace(/\s+/g, ' ').trim();
        if (/par[áa]grafo\s+[úu]nico/i.test(pTxt)) {
          pTxt = 'Parágrafo Único';
        } else if (/par[áa]grafo\s+(\d+)/i.test(pTxt)) {
          pTxt = `§ ${RegExp.$1}º`;
        }
        tipoDispositivo = 'paragrafo';
        rotuloDispositivo = pTxt;
        tituloDestaque = acao === 'redacao_dada' ? `Redação dada ao ${rotuloDispositivo}` : `${acaoTexto} ${rotuloDispositivo}`;
      }
      // 4.4. Pena
      else if (/^pena\s*[-–:]/i.test(textoNovoRaw) || /^pena\s*[-–:]/i.test(motivoRaw)) {
        tipoDispositivo = 'pena';
        rotuloDispositivo = 'Pena';
        tituloDestaque = `Pena ${acao === 'redacao_dada' ? 'Alterada' : acaoTexto}`;
      }
      // 4.5. Caput
      else if (/caput/i.test(motivoRaw) || /caput/i.test(textoNovoRaw)) {
        tipoDispositivo = 'caput';
        rotuloDispositivo = 'Caput';
        tituloDestaque = acao === 'redacao_dada' ? 'Redação dada ao Caput' : `${acaoTexto} Caput`;
      }
      // 4.6. Artigo Completo
      else {
        tipoDispositivo = 'artigo';
        rotuloDispositivo = artigoBase;
        tituloDestaque = acao === 'incluido' ? 'Artigo Novo Incluído' : `${acaoTexto} no ${artigoBase}`;
      }
    }
  }

  // 5. Montagem do Título Enriquecido (ex: "Art. 156, Inciso XI" ou "Art. 216-B, § 2º")
  let artigoDisplayCompleto = artigoBase;
  if (tipoDispositivo === 'inciso' || tipoDispositivo === 'alinea' || tipoDispositivo === 'paragrafo') {
    artigoDisplayCompleto = `${artigoBase}, ${rotuloDispositivo}`;
  } else if (tipoDispositivo === 'caput') {
    artigoDisplayCompleto = `${artigoBase} (Caput)`;
  } else if (tipoDispositivo === 'pena') {
    artigoDisplayCompleto = `${artigoBase} (Pena)`;
  }

  // 6. Montagem da Frase de Ação Descritiva (ex: "Foi incluído o Inciso XI", "Alterada a redação do § 2º")
  let acaoDescritiva = '';
  if (acao === 'incluido') {
    if (tipoDispositivo === 'alinea') acaoDescritiva = `Foi incluída a ${rotuloDispositivo}`;
    else if (tipoDispositivo === 'inciso') acaoDescritiva = `Foi incluído o ${rotuloDispositivo}`;
    else if (tipoDispositivo === 'paragrafo') acaoDescritiva = `Foi incluído o ${rotuloDispositivo}`;
    else if (tipoDispositivo === 'caput') acaoDescritiva = `Foi incluído o Caput`;
    else if (tipoDispositivo === 'pena') acaoDescritiva = `Foi cominada nova Pena`;
    else acaoDescritiva = `Foi incluído novo dispositivo`;
  } else if (acao === 'revogado') {
    if (tipoDispositivo === 'alinea') acaoDescritiva = `Foi revogada a ${rotuloDispositivo}`;
    else if (tipoDispositivo === 'inciso') acaoDescritiva = `Foi revogado o ${rotuloDispositivo}`;
    else if (tipoDispositivo === 'paragrafo') acaoDescritiva = `Foi revogado o ${rotuloDispositivo}`;
    else if (tipoDispositivo === 'caput') acaoDescritiva = `Foi revogado o Caput`;
    else if (tipoDispositivo === 'pena') acaoDescritiva = `Foi revogada a Pena`;
    else acaoDescritiva = `Foi revogado o dispositivo`;
  } else {
    if (tipoDispositivo === 'alinea') acaoDescritiva = `Alterada a redação da ${rotuloDispositivo}`;
    else if (tipoDispositivo === 'inciso') acaoDescritiva = `Alterada a redação do ${rotuloDispositivo}`;
    else if (tipoDispositivo === 'paragrafo') acaoDescritiva = `Alterada a redação do ${rotuloDispositivo}`;
    else if (tipoDispositivo === 'caput') acaoDescritiva = `Alterada a redação do Caput`;
    else if (tipoDispositivo === 'pena') acaoDescritiva = `Alterada a pena`;
    else acaoDescritiva = `Alterada a redação do dispositivo`;
  }

  // 7. Extração do corpo textual limpo (sem duplicações de "Art. 216-B" e sem o numeral repetido do inciso)
  let rawCorpo = textoNovoRaw || textoAntigoRaw || motivoRaw;
  rawCorpo = rawCorpo.replace(/\s*\([^)]*(?:lei|decreto|redação|incluíd|revogad)[^)]*\)\s*$/i, '').trim();
  rawCorpo = rawCorpo.replace(/^Art\.\s*[\w-]+[º°]?\s*[-–.:]?\s*/i, '').trim();

  let corpoTexto = rawCorpo;
  if (tipoDispositivo === 'inciso') {
    corpoTexto = corpoTexto.replace(/^\(?\s*[IVXLCDM]{1,8}\s*[-–]\s*/i, '').trim();
  } else if (tipoDispositivo === 'alinea') {
    corpoTexto = corpoTexto.replace(/^\(?\s*[a-z]\)\s*[-–]\s*/i, '').trim();
  } else if (tipoDispositivo === 'paragrafo') {
    corpoTexto = corpoTexto.replace(/^(?:§\s*\d+[º°]?\s*[-–\w]*|par[áa]grafo\s+[úu]nico)\s*[-–.]?\s*/i, '').trim();
  }

  const descricaoCompleta = corpoTexto ? `${acaoDescritiva}: ${corpoTexto}` : acaoDescritiva;

  // 8. Resumo textual limpo
  let resumoLimpo = motivoRaw;
  if (resumoLimpo.length > 80 && leiReferencia) {
    resumoLimpo = `${acaoTexto} pela ${leiReferencia}`;
  }

  return {
    acao,
    acaoTexto,
    tipoDispositivo,
    rotuloDispositivo,
    tituloDestaque,
    leiReferencia,
    resumoLimpo,
    badgeCor,
    artigoBase,
    artigoDisplayCompleto,
    acaoDescritiva,
    descricaoCompleta,
    corpoTexto: corpoTexto || resumoLimpo,
  };
}
