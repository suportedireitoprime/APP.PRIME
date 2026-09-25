/**
 * Gerenciador de Alterações Legislativas Extraídas do Planalto.
 * Substitui definitivamente a leitura antiga por regex no caput dos artigos,
 * priorizando os dados reais de varredura oficial (ScrapedArticleUpdate) com mês abreviado / ano.
 */

export interface ScrapedArticleUpdate {
  artigo: string;          // Ex: "Art. 92" ou "Art. 121"
  motivo: string;          // Ex: "(Incluído pela Lei nº 15.358, de 2026)"
  ano: number;             // Ex: 2026
  mes?: string;            // Ex: "Jan"
  mes_ano?: string;        // Ex: "Jan/2026"
  texto_antigo: string;    // Texto revogado ou anterior
  texto_novo: string;      // Texto atualizado no Planalto
  link_lei?: string;       // Link oficial da norma modificadora
  data_completa?: string;
}

const MESES_MAP: Record<string, string> = {
  janeiro: 'Jan',
  jan: 'Jan',
  fevereiro: 'Fev',
  fev: 'Fev',
  março: 'Mar',
  marco: 'Mar',
  mar: 'Mar',
  abril: 'Abr',
  abr: 'Abr',
  maio: 'Mai',
  mai: 'Mai',
  junho: 'Jun',
  jun: 'Jun',
  julho: 'Jul',
  jul: 'Jul',
  agosto: 'Ago',
  ago: 'Ago',
  setembro: 'Set',
  set: 'Set',
  outubro: 'Out',
  out: 'Out',
  novembro: 'Nov',
  nov: 'Nov',
  dezembro: 'Dez',
  dez: 'Dez',
};

export function extractMesAno(motivo: string, anoFallback = 2026, dataCompleta?: string): { mes: string; ano: number; mesAno: string } {
  const anoFinal = anoFallback || 2026;

  if (dataCompleta) {
    const dMatch = dataCompleta.match(/(\d{4})-(\d{2})/);
    if (dMatch) {
      const mIdx = parseInt(dMatch[2], 10) - 1;
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mName = meses[mIdx] || 'Jan';
      return { mes: mName, ano: parseInt(dMatch[1], 10), mesAno: `${mName}/${dMatch[1]}` };
    }
  }

  // Tenta encontrar "de 14 de janeiro de 2026" ou "em 9 de outubro de 2024"
  const matchDataExtensa = motivo.match(/(?:em|de)\s+(\d{1,2})\s+de\s+([a-zA-Zç]+)\s+de\s+(\d{4})/i);
  if (matchDataExtensa) {
    const mStr = matchDataExtensa[2].toLowerCase();
    const aNum = parseInt(matchDataExtensa[3], 10);
    const mesAbbr = MESES_MAP[mStr] || 'Jan';
    return { mes: mesAbbr, ano: aNum, mesAno: `${mesAbbr}/${aNum}` };
  }

  // Tenta achar apenas "janeiro de 2026"
  const matchMesAno = motivo.match(/([a-zA-Zç]+)\s+de\s+(\d{4})/i);
  if (matchMesAno) {
    const mStr = matchMesAno[1].toLowerCase();
    if (MESES_MAP[mStr]) {
      const aNum = parseInt(matchMesAno[2], 10);
      return { mes: MESES_MAP[mStr], ano: aNum, mesAno: `${MESES_MAP[mStr]}/${aNum}` };
    }
  }

  // Fallback baseado no ano
  return { mes: 'Jan', ano: anoFinal, mesAno: `Jan/${anoFinal}` };
}

// Semente oficial das alterações mais recentes do Código Penal (Planalto 2026 / 2025 / 2024)
export const SEED_CP_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 92',
    motivo: '(§ 4º Na hipótese da reincidência descrita no § 3º deste artigo, o administrador, direta ou indiretamente responsável pela infração cometida, será interditado para o exercício do comércio pelo período de 5 cinco anos. Incluído pela Lei nº 15.358, de 14 de janeiro de 2026)',
    ano: 2026,
    mes: 'Jan',
    mes_ano: 'Jan/2026',
    texto_antigo: 'I - durante três anos, pelo menos, o condenado por crime a que a lei comina pena de reclusão por tempo não inferior, no mínimo, a dez anos, se na sentença...',
    texto_novo: '§ 4º Na hipótese da reincidência descrita no § 3º deste artigo, o administrador, direta ou indiretamente responsável pela infração cometida, será interditado para o exercício do comércio pelo período de 5 cinco anos. (Incluído pela Lei nº 15.358, de 2026)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15358.htm',
  },
  {
    artigo: 'Art. 103',
    motivo: '(Parágrafo único. Nos crimes praticados no âmbito de violência doméstica e familiar contra a mulher, a ofendida decai do direito de queixa... Incluído pela Lei nº 15.438, de 2026)',
    ano: 2026,
    mes: 'Jan',
    mes_ano: 'Jan/2026',
    texto_antigo: 'Dispositivo sem previsão explícita de exceção em violência doméstica e familiar.',
    texto_novo: 'Parágrafo único. Nos crimes praticados no âmbito de violência doméstica e familiar contra a mulher, a ofendida decai do direito de queixa ou de representação se não o exerce no prazo de 6 (seis) meses. (Incluído pela Lei nº 15.438, de 2026)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15438.htm',
  },
  {
    artigo: 'Art. 121-A',
    motivo: '(Matar mulher por razões da condição do sexo feminino - Feminicídio autônomo com pena de reclusão de 20 a 40 anos. Incluído pela Lei nº 14.994, de 9 de outubro de 2024)',
    ano: 2024,
    mes: 'Out',
    mes_ano: 'Out/2024',
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
    texto_antigo: 'Pena - reclusão, de 6 (seis) meses a 2 (dois) anos, e multa, se a conduta não constitui crime mais grave.',
    texto_novo: 'Pena - reclusão, de 2 (dois) a 5 (cinco) anos, e multa, se a conduta não constitui crime mais grave. (Redação dada pela Lei nº 14.994, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14994.htm',
  },
  {
    artigo: 'Art. 146',
    motivo: '(§ 1º A pena aplica-se cumulativamente e em dobro. Alterado pela Lei nº 14.811, de 15 de janeiro de 2024 - Medidas de proteção à criança e adolescente)',
    ano: 2024,
    mes: 'Jan',
    mes_ano: 'Jan/2024',
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
    texto_antigo: 'Pena - reclusão, de 2 (dois) a 8 (oito) anos, e multa.',
    texto_novo: '§ 4º-B A pena é de reclusão, de 4 (quatro) a 8 (oito) anos, e multa, se o furto mediante fraude é cometido por meio de dispositivo eletrônico ou informático.',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14811.htm',
  },
  {
    artigo: 'Art. 157',
    motivo: '(§ 2º, incisos II e VII - Roubo com arma branca ou concurso de pessoas. Lei nº 13.964, de 24 de dezembro de 2019)',
    ano: 2019,
    mes: 'Dez',
    mes_ano: 'Dez/2019',
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
    texto_antigo: 'Pena aumentada de um terço se o crime é cometido em detrimento de entidade de direito público.',
    texto_novo: '§ 4º A pena aumenta-se de 1/3 (um terço) ao dobro, se o crime é cometido contra idoso ou vulnerável, considerada a relevância do resultado gravoso.',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14155.htm',
  },
];

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
          return parsed.map((item: ScrapedArticleUpdate) => {
            if (!item.mes_ano) {
              const { mes, mesAno } = extractMesAno(item.motivo || '', item.ano, item.data_completa);
              return { ...item, mes, mes_ano: mesAno };
            }
            return item;
          }).sort((a: ScrapedArticleUpdate, b: ScrapedArticleUpdate) => (b.ano || 0) - (a.ano || 0));
        }
      }
    } catch (e) {
      console.warn(`Erro ao ler cache ${key}:`, e);
    }
  }

  // Fallback para Código Penal se nenhum cache estiver presente
  if (isCP) {
    return SEED_CP_ALTERACOES;
  }

  return [];
}
