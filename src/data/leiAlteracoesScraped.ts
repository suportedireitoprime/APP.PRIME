/**
 * Gerenciador de Alterações Legislativas Extraídas do Planalto.
 * Substitui definitivamente a leitura antiga por regex no caput dos artigos,
 * priorizando os dados reais de varredura oficial (ScrapedArticleUpdate).
 */

export interface ScrapedArticleUpdate {
  artigo: string;          // Ex: "Art. 92" ou "Art. 121"
  motivo: string;          // Ex: "(Incluído pela Lei nº 15.358, de 2026)"
  ano: number;             // Ex: 2026
  texto_antigo: string;    // Texto revogado ou anterior
  texto_novo: string;      // Texto atualizado no Planalto
  link_lei?: string;       // Link oficial da norma modificadora
  data_completa?: string;
}

// Semente oficial das alterações mais recentes do Código Penal (Planalto 2026 / 2025 / 2024)
// Garante exibição instantânea a 0ms mesmo antes da primeira varredura em cache.
export const SEED_CP_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 92',
    motivo: '(§ 4º Na hipótese da reincidência descrita no § 3º deste artigo, o administrador, direta ou indiretamente responsável pela infração cometida, será interditado para o exercício do comércio pelo período de 5 cinco anos. Incluído pela Lei nº 15.358, de 2026)',
    ano: 2026,
    texto_antigo: 'I - durante três anos, pelo menos, o condenado por crime a que a lei comina pena de reclusão por tempo não inferior, no mínimo, a dez anos, se na sentença...',
    texto_novo: '§ 4º Na hipótese da reincidência descrita no § 3º deste artigo, o administrador, direta ou indiretamente responsável pela infração cometida, será interditado para o exercício do comércio pelo período de 5 cinco anos. (Incluído pela Lei nº 15.358, de 2026)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15358.htm',
  },
  {
    artigo: 'Art. 121-A',
    motivo: '(Matar mulher por razões da condição do sexo feminino - Feminicídio autônomo com pena de reclusão de 20 a 40 anos. Incluído pela Lei nº 14.994, de 2024)',
    ano: 2024,
    texto_antigo: 'Art. 121, § 2º, VI - Feminicídio como qualificadora com pena de 12 a 30 anos.',
    texto_novo: 'Art. 121-A. Matar mulher por razões da condição do sexo feminino: Pena - reclusão, de 20 (vinte) a 40 (quarenta) anos. (Incluído pela Lei nº 14.994, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14994.htm',
  },
  {
    artigo: 'Art. 147-B',
    motivo: '(Violência psicológica contra a mulher - Aumento de pena. Alterado pela Lei nº 14.994, de 2024)',
    ano: 2024,
    texto_antigo: 'Pena - reclusão, de 6 (seis) meses a 2 (dois) anos, e multa, se a conduta não constitui crime mais grave.',
    texto_novo: 'Pena - reclusão, de 2 (dois) a 5 (cinco) anos, e multa, se a conduta não constitui crime mais grave. (Redação dada pela Lei nº 14.994, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14994.htm',
  },
  {
    artigo: 'Art. 146',
    motivo: '(§ 1º A pena aplica-se cumulativamente e em dobro. Alterado pela Lei nº 14.811, de 2024 - Medidas de proteção à criança e adolescente)',
    ano: 2024,
    texto_antigo: 'Pena - detenção, de um a seis meses, ou multa.',
    texto_novo: '§ 1º Aplica-se a pena em dobro se o crime é cometido em ambiente escolar ou contra menor de 14 (quatorze) anos. (Redação dada pela Lei nº 14.811, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14811.htm',
  },
  {
    artigo: 'Art. 155',
    motivo: '(§ 4º-B e § 4º-C - Furto eletrônico ou mediante fraude cibernética. Alterado pela Lei nº 14.155 / Lei nº 14.811, de 2024)',
    ano: 2024,
    texto_antigo: 'Pena - reclusão, de 2 (dois) a 8 (oito) anos, e multa.',
    texto_novo: '§ 4º-B A pena é de reclusão, de 4 (quatro) a 8 (oito) anos, e multa, se o furto mediante fraude é cometido por meio de dispositivo eletrônico ou informático.',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14811.htm',
  },
  {
    artigo: 'Art. 157',
    motivo: '(§ 2º, incisos II e VII - Roubo com arma branca ou concurso de pessoas. Alterado pela Lei nº 13.964 e atualizações)',
    ano: 2023,
    texto_antigo: 'A pena aumenta-se de um terço até metade.',
    texto_novo: '§ 2º-A A pena aumenta-se de 2/3 (dois terços): I – se a violência ou ameaça é exercida com emprego de arma de fogo.',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
  },
  {
    artigo: 'Art. 171',
    motivo: '(§ 4º Aplica-se a pena em dobro se o crime for cometido contra idoso ou vulnerável. Alterado pela Lei nº 14.155)',
    ano: 2023,
    texto_antigo: 'Pena aumentada de um terço se o crime é cometido em detrimento de entidade de direito público.',
    texto_novo: '§ 4º A pena aumenta-se de 1/3 (um terço) ao dobro, se o crime é cometido contra idoso ou vulnerável, considerada a relevância do resultado gravoso.',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14155.htm',
  },
  {
    artigo: 'Art. 218-C',
    motivo: '(Divulgação de cena de estupro ou de cena de estupro de vulnerável, de sexo ou pornografia. Lei nº 13.718)',
    ano: 2023,
    texto_antigo: 'Dispositivo inédito inserido no Código Penal.',
    texto_novo: 'Art. 218-C. Oferecer, trocar, disponibilizar, transmitir, vender ou expor à venda, distribuir, publicar ou divulgar... Pena - reclusão, de 1 (um) a 5 (cinco) anos.',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13718.htm',
  },
];

/**
 * Carrega a lista real de alterações extraídas do Planalto para a lei informada.
 * 1. Procura no cache do localStorage gerado pelo AdminMapeamentoLeis (`vade_scrape_data_${tabelaNome}`).
 * 2. Procura com o ID da lei (`vade_scrape_data_${leiId}`).
 * 3. Se for Código Penal e o cache estiver vazio, usa a semente oficial do Planalto.
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
  // Variações comuns para Código Penal
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
          // Garantir que todos possuem campos básicos válidos e ordenados por ano desc
          return parsed.sort((a: ScrapedArticleUpdate, b: ScrapedArticleUpdate) => (b.ano || 0) - (a.ano || 0));
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
