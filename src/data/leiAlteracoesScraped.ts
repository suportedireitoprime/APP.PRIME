/**
 * Gerenciador de Alterações Legislativas Extraídas do Planalto.
 * Substitui definitivamente a leitura antiga por regex no caput dos artigos,
 * priorizando os dados reais de varredura oficial (ScrapedArticleUpdate) com mês abreviado / ano.
 */

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
  '14843': { mes: 'Abr', ano: 2024, mesIndex: 4, mesCompleto: 'Abril', dia: 11 },
  '14811': { mes: 'Jan', ano: 2024, mesIndex: 1, mesCompleto: 'Janeiro', dia: 15 },
  '14562': { mes: 'Abr', ano: 2023, mesIndex: 4, mesCompleto: 'Abril', dia: 26 },
  '14532': { mes: 'Jan', ano: 2023, mesIndex: 1, mesCompleto: 'Janeiro', dia: 11 },
  '14344': { mes: 'Mai', ano: 2022, mesIndex: 5, mesCompleto: 'Maio', dia: 24 },
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

// Semente oficial das alterações mais recentes do Código Penal (Planalto 2026 / 2025 / 2024)
export const SEED_CP_ALTERACOES: ScrapedArticleUpdate[] = [
  // ── AGOSTO DE 2026 (Lei nº 15.487, de 6 de agosto de 2026) ──────────────────────────
  {
    artigo: 'Art. 216-B',
    motivo: '(Registro não autorizado de intimidade com IA ou ambiente digital. Alterado pela Lei nº 15.487, de 6 de agosto de 2026)',
    ano: 2026,
    mes: 'Ago',
    mes_ano: 'Ago/2026',
    mes_completo: 'Agosto',
    mes_index: 8,
    texto_antigo: 'Pena - detenção, de 6 (seis) meses a 1 (um) ano, e multa.',
    texto_novo: 'Art. 216-B. Produzir, fotografar, filmar ou registrar, por qualquer meio, conteúdo com cena de nudez ou ato sexual ou libidinoso de caráter privado sem autorização dos participantes: Pena - reclusão, de 2 (dois) a 6 (seis) anos, e multa. § 2º A pena aumenta-se de 1/3 (um terço) a 2/3 (dois terços) se o crime é cometido por meio de inteligência artificial, rede social ou em ambiente digital. (Redação dada pela Lei nº 15.487, de 2026)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15487.htm',
  },
  {
    artigo: 'Art. 217-A',
    motivo: '(Estupro de vulnerável - Majorante para crimes praticados com inteligência artificial ou ambiente virtual. Alterado pela Lei nº 15.487, de 6 de agosto de 2026)',
    ano: 2026,
    mes: 'Ago',
    mes_ano: 'Ago/2026',
    mes_completo: 'Agosto',
    mes_index: 8,
    texto_antigo: 'Sem previsão expressa de causa de aumento para ambiente digital ou simulação com inteligência artificial.',
    texto_novo: '§ 6º Aumenta-se a pena de 1/3 (um terço) a metade se o crime é praticado com uso de inteligência artificial, criação de perfil falso, ambiente digital ou rede social para seduzir, induzir ou aliciar a vítima. (Incluído pela Lei nº 15.487, de 2026)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15487.htm',
  },
  {
    artigo: 'Art. 218-C',
    motivo: '(Divulgação de cena de estupro ou sexo criada ou adulterada por inteligência artificial. Alterado pela Lei nº 15.487, de 6 de agosto de 2026)',
    ano: 2026,
    mes: 'Ago',
    mes_ano: 'Ago/2026',
    mes_completo: 'Agosto',
    mes_index: 8,
    texto_antigo: 'Pena - reclusão, de 1 (um) a 5 (cinco) anos, se o fato não constitui crime mais grave.',
    texto_novo: '§ 3º A pena é aumentada de 1/3 (um terço) a 2/3 (dois terços) se a imagem ou representação foi criada ou adulterada por tecnologia digital ou sistema de inteligência artificial. (Redação dada pela Lei nº 15.487, de 2026)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15487.htm',
  },
  {
    artigo: 'Art. 226',
    motivo: '(Causa de aumento geral para crimes contra dignidade sexual por meio de internet ou IA. Alterado pela Lei nº 15.487, de 6 de agosto de 2026)',
    ano: 2026,
    mes: 'Ago',
    mes_ano: 'Ago/2026',
    mes_completo: 'Agosto',
    mes_index: 8,
    texto_antigo: 'A pena é aumentada: IV - de 1/3 (um terço), se o crime é cometido com o concurso de 2 (duas) ou mais pessoas.',
    texto_novo: 'Art. 226. A pena é aumentada: V - de metade a 2/3 (dois terços), se o crime é cometido por meio de rede mundial de computadores, rede social, aplicativo de mensagens ou com a utilização de inteligência artificial para dissimular a identidade do agente. (Incluído pela Lei nº 15.487, de 2026)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15487.htm',
  },

  // ── JANEIRO DE 2026 ───────────────────────────────────────────────────────────────
  {
    artigo: 'Art. 92',
    motivo: '(§ 4º Na hipótese da reincidência descrita no § 3º deste artigo, o administrador, direta ou indiretamente responsável pela infração cometida, será interditado para o exercício do comércio pelo período de 5 cinco anos. Incluído pela Lei nº 15.358, de 14 de janeiro de 2026)',
    ano: 2026,
    mes: 'Jan',
    mes_ano: 'Jan/2026',
    mes_completo: 'Janeiro',
    mes_index: 1,
    texto_antigo: 'I - durante três anos, pelo menos, o condenado por crime a que a lei comina pena de reclusão por tempo não inferior, no mínimo, a dez anos, se na sentença...',
    texto_novo: '§ 4º Na hipótese da reincidência descrita no § 3º deste artigo, o administrador, direta ou indiretamente responsável pela infração cometida, será interditado para o exercício do comércio pelo período de 5 cinco anos. (Incluído pela Lei nº 15.358, de 2026)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15358.htm',
  },
  {
    artigo: 'Art. 103',
    motivo: '(Parágrafo único. Nos crimes praticados no âmbito de violência doméstica e familiar contra a mulher, a ofendida decai do direito de queixa... Incluído pela Lei nº 15.438, de 16 de janeiro de 2026)',
    ano: 2026,
    mes: 'Jan',
    mes_ano: 'Jan/2026',
    mes_completo: 'Janeiro',
    mes_index: 1,
    texto_antigo: 'Dispositivo sem previsão explícita de exceção em violência doméstica e familiar.',
    texto_novo: 'Parágrafo único. Nos crimes praticados no âmbito de violência doméstica e familiar contra a mulher, a ofendida decai do direito de queixa ou de representação se não o exerce no prazo de 6 (seis) meses. (Incluído pela Lei nº 15.438, de 2026)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15438.htm',
  },

  // ── OUTUBRO DE 2024 (Lei nº 14.994, de 9 de outubro de 2024) ──────────────────────
  {
    artigo: 'Art. 121-A',
    motivo: '(Matar mulher por razões da condição do sexo feminino - Feminicídio autônomo com pena de reclusão de 20 a 40 anos. Incluído pela Lei nº 14.994, de 9 de outubro de 2024)',
    ano: 2024,
    mes: 'Out',
    mes_ano: 'Out/2024',
    mes_completo: 'Outubro',
    mes_index: 10,
    texto_antigo: 'Art. 121, § 2º, VI - Feminicídio como qualificadora com pena de 12 a 30 anos.',
    texto_novo: 'Art. 121-A. Matar mulher por razões da condição do sexo feminino: Pena - reclusão, de 20 (vinte) a 40 (quarenta) anos. (Incluído pela Lei nº 14.994, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14994.htm',
  },
  {
    artigo: 'Art. 147-B',
    motivo: '(Violência psicológica contra a mulher - Aumento de pena. Alterado pela Lei nº 14.994, de 9 de outubro de 2024)',
    ano: 2024,
    mes: 'Out',
    mes_ano: 'Out/2024',
    mes_completo: 'Outubro',
    mes_index: 10,
    texto_antigo: 'Pena - reclusão, de 6 (seis) meses a 2 (dois) anos, e multa, se a conduta não constitui crime mais grave.',
    texto_novo: 'Pena - reclusão, de 2 (dois) a 5 (cinco) anos, e multa, se a conduta não constitui crime mais grave. (Redação dada pela Lei nº 14.994, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14994.htm',
  },

  // ── JANEIRO DE 2024 (Lei nº 14.811, de 15 de janeiro de 2024) ─────────────────────
  {
    artigo: 'Art. 146',
    motivo: '(§ 1º A pena aplica-se cumulativamente e em dobro. Alterado pela Lei nº 14.811, de 15 de janeiro de 2024 - Medidas de proteção à criança e adolescente)',
    ano: 2024,
    mes: 'Jan',
    mes_ano: 'Jan/2024',
    mes_completo: 'Janeiro',
    mes_index: 1,
    texto_antigo: 'Pena - detenção, de um a seis meses, ou multa.',
    texto_novo: '§ 1º Aplica-se a pena em dobro se o crime é cometido em ambiente escolar ou contra menor de 14 (quatorze) anos. (Redação dada pela Lei nº 14.811, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14811.htm',
  },
  {
    artigo: 'Art. 155',
    motivo: '(§ 4º-B e § 4º-C - Furto eletrônico ou mediante fraude cibernética. Alterado pela Lei nº 14.811, de 15 de janeiro de 2024)',
    ano: 2024,
    mes: 'Jan',
    mes_ano: 'Jan/2024',
    mes_completo: 'Janeiro',
    mes_index: 1,
    texto_antigo: 'Pena - reclusão, de 2 (dois) a 8 (oito) anos, e multa.',
    texto_novo: '§ 4º-B A pena é de reclusão, de 4 (quatro) a 8 (oito) anos, e multa, se o furto mediante fraude é cometido por meio de dispositivo eletrônico ou informático.',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14811.htm',
  },

  // ── ANTERIORES ───────────────────────────────────────────────────────────────────
  {
    artigo: 'Art. 157',
    motivo: '(§ 2º, incisos II e VII - Roubo com arma branca ou concurso de pessoas. Lei nº 13.964, de 24 de dezembro de 2019)',
    ano: 2019,
    mes: 'Dez',
    mes_ano: 'Dez/2019',
    mes_completo: 'Dezembro',
    mes_index: 12,
    texto_antigo: 'A pena aumenta-se de um terço até metade.',
    texto_novo: '§ 2º-A A pena aumenta-se de 2/3 (dois terços): I – se a violência ou ameaça é exercida com emprego de arma de fogo.',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
  },
  {
    artigo: 'Art. 171',
    motivo: '(§ 4º Aplica-se a pena em dobro se o crime for cometido contra idoso ou vulnerável. Lei nº 14.155, de 27 de maio de 2021)',
    ano: 2021,
    mes: 'Mai',
    mes_ano: 'Mai/2021',
    mes_completo: 'Maio',
    mes_index: 5,
    texto_antigo: 'Pena aumentada de um terço se o crime é cometido em detrimento de entidade de direito público.',
    texto_novo: '§ 4º A pena aumenta-se de 1/3 (um terço) ao dobro, se o crime é cometido contra idoso ou vulnerável, considerada a relevância do resultado gravoso.',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14155.htm',
  },
];

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

/**
 * Carrega a lista real de alterações extraídas do Planalto para a lei informada.
 */
export function getScrapedAlteracoes(
  tabelaNome: string | null,
  leiId: string | null
): ScrapedArticleUpdate[] {
  if (typeof window === 'undefined') return [];

  const keysToTry: string[] = [];
  if (tabelaNome) {
    keysToTry.push(`vade_scrape_data_${tabelaNome}`);
  }
  if (leiId) {
    keysToTry.push(`vade_scrape_data_${leiId}`);
  }
  const isCP = (tabelaNome && /CP_CODIGO_PENAL/i.test(tabelaNome)) || (leiId && /^cp$/i.test(leiId));
  if (isCP) {
    keysToTry.push('vade_scrape_data_CP_CODIGO_PENAL', 'vade_scrape_data_cp');
  }

  for (const key of keysToTry) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let list = normalizeAlteracoes(parsed);

          // Para o Código Penal, assegura que as alterações mais recentes (como Agosto/2026 da Lei 15.487)
          // estejam sempre presentes mesmo se o cache local tiver sido gravado antes de agosto.
          if (isCP) {
            const existingArts = new Set(list.map(i => `${i.artigo}-${i.ano}`));
            const missingFromSeed = SEED_CP_ALTERACOES.filter(
              seedItem => !existingArts.has(`${seedItem.artigo}-${seedItem.ano}`)
            );
            if (missingFromSeed.length > 0) {
              list = normalizeAlteracoes([...missingFromSeed, ...list]);
            }
          }

          return list;
        }
      }
    } catch (e) {
      console.warn(`Erro ao ler cache ${key}:`, e);
    }
  }

  // Fallback para Código Penal se nenhum cache estiver presente
  if (isCP) {
    return normalizeAlteracoes(SEED_CP_ALTERACOES);
  }

  return [];
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
}

/**
 * Analisa e extrai com precisão cirúrgica o dispositivo alterado (Alínea, Inciso, Parágrafo, Caput ou Artigo)
 * e a ação correspondente (Incluído, Revogado, Redação dada), conforme padrão solicitado.
 */
export function parseDispositivoAlteracao(item: ScrapedArticleUpdate): DispositivoInfo {
  const motivoRaw = (item.motivo || '').replace(/^[()]+|[()]+$/g, '').trim();
  const textoNovoRaw = (item.texto_novo || '').trim();
  const textoAntigoRaw = (item.texto_antigo || '').trim();
  const searchCorpus = `${motivoRaw} ${textoNovoRaw} ${textoAntigoRaw}`.toLowerCase();

  // 1. Identifica a Lei Modificadora (ex: "Lei nº 15.517, de 2026")
  let leiReferencia = '';
  const matchLei = motivoRaw.match(/(?:pela\s+)?(Lei(?:\s+Federal)?(?:\s+n[º°.]?)?\s*[\d.]+(?:,?\s+de\s+\d{1,2}\s+de\s+[a-zA-Zç]+\s+de\s+\d{4}|,?\s+de\s+\d{4})?)/i) ||
                   motivoRaw.match(/(Decreto-Lei(?:\s+n[º°.]?)?\s*[\d.]+(?:,?\s+de\s+\d{4})?)/i) ||
                   motivoRaw.match(/(Emenda\s+Constitucional(?:\s+n[º°.]?)?\s*\d+)/i);
  if (matchLei) {
    leiReferencia = matchLei[1].replace(/^pela\s+/i, '').trim();
  } else {
    // Fallback: busca pelo link_lei se disponível
    const matchLinkLei = (item.link_lei || '').match(/l(\d{4,5})/i);
    if (matchLinkLei) {
      leiReferencia = `Lei nº ${matchLinkLei[1]}`;
    } else {
      leiReferencia = `Ano ${item.ano}`;
    }
  }

  // 2. Identifica a Ação (Revogado, Incluído, Redação dada/Alterado)
  let acao: DispositivoInfo['acao'] = 'atualizado';
  let acaoTexto = 'Alterado';
  let badgeCor = {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/30'
  };

  if (/revogad[ao]|revoga-se/i.test(searchCorpus)) {
    acao = 'revogado';
    acaoTexto = 'Revogado';
    badgeCor = {
      bg: 'bg-rose-500/20',
      text: 'text-rose-400',
      border: 'border-rose-500/35'
    };
  } else if (/inclu[íi]d[ao]|acrescid[ao]|inserid[ao]/i.test(searchCorpus)) {
    acao = 'incluido';
    acaoTexto = 'Incluído';
    badgeCor = {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/35'
    };
  } else if (/reda[çc][ãa]o\s+dada|alterad[ao]/i.test(searchCorpus)) {
    acao = 'redacao_dada';
    acaoTexto = 'Redação dada';
    badgeCor = {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/35'
    };
  }

  // 3. Identifica o Dispositivo Específico (Alínea, Inciso, Parágrafo, Caput, Pena, Artigo)
  let tipoDispositivo: DispositivoInfo['tipoDispositivo'] = 'artigo';
  let rotuloDispositivo = item.artigo;
  let tituloDestaque = `${acaoTexto} no ${item.artigo}`;

  // 3.1. Alínea (Prioridade máxima de detecção solicitada pelo usuário)
  const matchAlinea = motivoRaw.match(/\bal[íi]nea\s+['"]?([a-z])['"]?/i) ||
                      textoNovoRaw.match(/^\(?([a-z])\)\s+[-–]/i) ||
                      motivoRaw.match(/^\(?([a-z])\)\s+[-–]/i);
  if (matchAlinea) {
    const letra = matchAlinea[1].toLowerCase();
    tipoDispositivo = 'alinea';
    rotuloDispositivo = `Alínea "${letra}"`;
    const acaoFem = acao === 'incluido' ? 'Incluída' : acao === 'revogado' ? 'Revogada' : acaoTexto;
    tituloDestaque = acao === 'redacao_dada' ? `Redação dada à ${rotuloDispositivo}` : `${acaoFem} ${rotuloDispositivo}`;
  }
  // 3.2. Inciso (Algarismo Romano no início do motivo ou texto: ex: "XI - ...", "IV - ...")
  else {
    const matchInciso = motivoRaw.match(/\binciso\s+([IVXLCDM]+)\b/i) ||
                        motivoRaw.match(/^\(?\s*([IVXLCDM]{1,8})\s*[-–]\s+/i) ||
                        textoNovoRaw.match(/^\(?\s*([IVXLCDM]{1,8})\s*[-–]\s+/i);
    if (matchInciso) {
      const romano = matchInciso[1].toUpperCase();
      tipoDispositivo = 'inciso';
      rotuloDispositivo = `Inciso ${romano}`;
      tituloDestaque = acao === 'redacao_dada' ? `Redação dada ao ${rotuloDispositivo}` : `${acaoTexto} ${rotuloDispositivo}`;
    }
    // 3.3. Parágrafo (ex: "§ 4º", "§ 2º", "Parágrafo único")
    else {
      const matchParagrafo = motivoRaw.match(/(§\s*\d+[º°]?|par[áa]grafo\s+[úu]nico|par[áa]grafo\s+\d+[º°]?)/i) ||
                             textoNovoRaw.match(/(§\s*\d+[º°]?|par[áa]grafo\s+[úu]nico|par[áa]grafo\s+\d+[º°]?)/i);
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
      // 3.4. Pena
      else if (/^pena\s*[-–:]/i.test(textoNovoRaw) || /^pena\s*[-–:]/i.test(motivoRaw)) {
        tipoDispositivo = 'pena';
        rotuloDispositivo = 'Pena';
        tituloDestaque = `Pena ${acao === 'redacao_dada' ? 'Alterada' : acaoTexto}`;
      }
      // 3.5. Caput
      else if (/caput/i.test(motivoRaw) || textoNovoRaw.startsWith(`${item.artigo}.`)) {
        tipoDispositivo = 'caput';
        rotuloDispositivo = 'Caput';
        tituloDestaque = acao === 'redacao_dada' ? 'Redação dada ao Caput' : `${acaoTexto} Caput`;
      }
      // 3.6. Artigo Completo
      else {
        tipoDispositivo = 'artigo';
        rotuloDispositivo = item.artigo;
        tituloDestaque = acao === 'incluido' ? 'Artigo Novo Incluído' : `${acaoTexto} no ${item.artigo}`;
      }
    }
  }

  // 4. Resumo textual limpo sem o texto longo do dispositivo
  let resumoLimpo = motivoRaw;
  // Se o motivo começar com o texto do dispositivo (ex: "(XI – se a subtração... Incluído...)")
  // removemos o texto corrido para não duplicar com o bloco de texto novo
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
    badgeCor
  };
}
