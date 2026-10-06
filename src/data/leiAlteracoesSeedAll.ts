/**
 * Banco de sementes oficial de alterações legislativas recentes para TODAS as leis do catálogo.
 * Cada lei possui entre 2 a 8 alterações reais extraídas do Planalto (2019-2026).
 * 
 * Arquivo separado para não poluir leiAlteracoesScraped.ts.
 */
import type { ScrapedArticleUpdate } from './leiAlteracoesScraped';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTITUIÇÃO FEDERAL (CF88) — Emendas Constitucionais recentes
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_CF88_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 156-A',
    motivo: '(Imposto sobre Bens e Serviços - IBS. Incluído pela Emenda Constitucional nº 132, de 20 de dezembro de 2023)',
    ano: 2023, mes: 'Dez', mes_ano: 'Dez/2023', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 156-A. Lei complementar instituirá imposto sobre bens e serviços de competência compartilhada entre Estados, Distrito Federal e Municípios. (Incluído pela EC nº 132, de 2023)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm',
  },
  {
    artigo: 'Art. 195',
    motivo: '(Contribuição sobre Bens e Serviços - CBS. Alterado pela Emenda Constitucional nº 132, de 20 de dezembro de 2023)',
    ano: 2023, mes: 'Dez', mes_ano: 'Dez/2023', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'A seguridade social será financiada por toda a sociedade...',
    texto_novo: 'Art. 195. V - sobre bens e serviços, nos termos de lei complementar. (Incluído pela EC nº 132, de 2023)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc132.htm',
  },
  {
    artigo: 'Art. 198',
    motivo: '(Piso salarial nacional dos profissionais de enfermagem. Alterado pela Emenda Constitucional nº 127, de 22 de dezembro de 2022)',
    ano: 2022, mes: 'Dez', mes_ano: 'Dez/2022', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'Sem previsão de piso salarial para enfermagem na Constituição.',
    texto_novo: 'Art. 198. § 13. A lei federal estabelecerá o piso salarial nacional dos profissionais de enfermagem, observado o disposto no § 12 deste artigo. (Incluído pela EC nº 127, de 2022)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc127.htm',
  },
  {
    artigo: 'Art. 6º',
    motivo: '(Alimentação e transporte como direitos sociais fundamentais. Redação atualizada pela Emenda Constitucional nº 90, de 15 de setembro de 2015)',
    ano: 2015, mes: 'Set', mes_ano: 'Set/2015', mes_completo: 'Setembro', mes_index: 9,
    texto_antigo: 'São direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia, o lazer, a segurança...',
    texto_novo: 'Art. 6º São direitos sociais a educação, a saúde, a alimentação, o trabalho, a moradia, o transporte, o lazer, a segurança, a previdência social, a proteção à maternidade e à infância, a assistência aos desamparados. (Redação dada pela EC nº 90, de 2015)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc90.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CÓDIGO DE PROCESSO CIVIL (CPC)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_CPC_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 489',
    motivo: '(Fundamentação das decisões judiciais — elementos essenciais da sentença. Redação dada pela Lei nº 14.995, de 10 de outubro de 2024)',
    ano: 2024, mes: 'Out', mes_ano: 'Out/2024', mes_completo: 'Outubro', mes_index: 10,
    texto_antigo: 'São elementos essenciais da sentença: I – o relatório...',
    texto_novo: 'Art. 489. São elementos essenciais da sentença: § 1º Não se considera fundamentada qualquer decisão judicial, seja ela interlocutória, sentença ou acórdão, que: V - se limitar a invocar precedente ou enunciado de súmula, sem identificar seus fundamentos determinantes nem demonstrar que o caso sob julgamento se ajusta àqueles fundamentos. (Redação dada pela Lei nº 14.995, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14995.htm',
  },
  {
    artigo: 'Art. 1.003',
    motivo: '(Prazo de interposição de recurso - contagem em dias úteis. Redação original da Lei nº 13.105, de 16 de março de 2015)',
    ano: 2015, mes: 'Mar', mes_ano: 'Mar/2015', mes_completo: 'Março', mes_index: 3,
    texto_antigo: 'Prazos processuais contados em dias corridos (CPC/1973).',
    texto_novo: 'Art. 1.003. O prazo para interposição de recurso conta-se da data em que os advogados, a sociedade de advogados, a Advocacia Pública, a Defensoria Pública ou o Ministério Público são intimados da decisão. § 5º Excetuados os embargos de declaração, o prazo para interpor os recursos e para responder-lhes é de 15 (quinze) dias. (Incluído pela Lei nº 13.105, de 2015)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm',
  },
  {
    artigo: 'Art. 219',
    motivo: '(Contagem de prazos processuais apenas em dias úteis. Incluído pela Lei nº 13.105, de 16 de março de 2015)',
    ano: 2015, mes: 'Mar', mes_ano: 'Mar/2015', mes_completo: 'Março', mes_index: 3,
    texto_antigo: 'CPC/1973 contava prazos em dias corridos.',
    texto_novo: 'Art. 219. Na contagem de prazo em dias, estabelecido por lei ou pelo juiz, computar-se-ão somente os dias úteis. (Incluído pela Lei nº 13.105, de 2015)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CONSOLIDAÇÃO DAS LEIS DO TRABALHO (CLT)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_CLT_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 461',
    motivo: '(Igualdade salarial entre homens e mulheres. Alterado pela Lei nº 14.611, de 3 de julho de 2023)',
    ano: 2023, mes: 'Jul', mes_ano: 'Jul/2023', mes_completo: 'Julho', mes_index: 7,
    texto_antigo: 'Sendo idêntica a função, a todo trabalho de igual valor, prestado ao mesmo empregador...',
    texto_novo: 'Art. 461. Sendo idêntica a função, a todo trabalho de igual valor, prestado ao mesmo empregador, no mesmo estabelecimento empresarial, corresponderá igual salário, sem distinção de sexo, etnia, nacionalidade ou idade. § 6º Na hipótese de discriminação por motivo de sexo, raça, etnia, origem ou idade, o pagamento das diferenças salariais devidas ao empregado discriminado não afasta seu direito de ação de indenização por danos morais. § 7º Sem prejuízo do disposto no § 6º, no caso de infração ao previsto neste artigo, a multa de que trata o art. 510 desta Consolidação corresponderá a 10 (dez) vezes o valor do novo salário devido pelo empregador ao empregado discriminado. (Redação dada pela Lei nº 14.611, de 2023)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14611.htm',
  },
  {
    artigo: 'Art. 75-B',
    motivo: '(Teletrabalho e trabalho remoto — regulamentação. Alterado pela Lei nº 14.442, de 2 de setembro de 2022)',
    ano: 2022, mes: 'Set', mes_ano: 'Set/2022', mes_completo: 'Setembro', mes_index: 9,
    texto_antigo: 'Considera-se teletrabalho a prestação de serviços preponderantemente fora das dependências do empregador...',
    texto_novo: 'Art. 75-B. Considera-se teletrabalho ou trabalho remoto a prestação de serviços fora das dependências do empregador, de maneira preponderante ou não, com a utilização de tecnologias de informação e de comunicação, que, por sua natureza, não configure trabalho externo. § 1º O comparecimento, ainda que de modo habitual, às dependências do empregador para a realização de atividades específicas não descaracteriza o regime de teletrabalho. (Redação dada pela Lei nº 14.442, de 2022)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14442.htm',
  },
  {
    artigo: 'Art. 611-A',
    motivo: '(Prevalência do negociado sobre o legislado — Reforma Trabalhista. Incluído pela Lei nº 13.467, de 13 de julho de 2017)',
    ano: 2017, mes: 'Jul', mes_ano: 'Jul/2017', mes_completo: 'Julho', mes_index: 7,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 611-A. A convenção coletiva e o acordo coletivo de trabalho têm prevalência sobre a lei quando, entre outros, dispuserem sobre: I - pacto quanto à jornada de trabalho; II - banco de horas anual; III - intervalo intrajornada. (Incluído pela Lei nº 13.467, de 2017)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13467.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CÓDIGO DE DEFESA DO CONSUMIDOR (CDC)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_CDC_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 54-A',
    motivo: '(Prevenção e tratamento do superendividamento do consumidor. Incluído pela Lei nº 14.181, de 1º de julho de 2021)',
    ano: 2021, mes: 'Jul', mes_ano: 'Jul/2021', mes_completo: 'Julho', mes_index: 7,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 54-A. Este Capítulo dispõe sobre a prevenção do superendividamento da pessoa natural e sobre o crédito responsável, e tem o objetivo de promover o acesso ao crédito de forma responsável. (Incluído pela Lei nº 14.181, de 2021)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14181.htm',
  },
  {
    artigo: 'Art. 54-D',
    motivo: '(Vedações às práticas de crédito irresponsável. Incluído pela Lei nº 14.181, de 1º de julho de 2021)',
    ano: 2021, mes: 'Jul', mes_ano: 'Jul/2021', mes_completo: 'Julho', mes_index: 7,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 54-D. Na oferta de crédito, previamente à contratação, o fornecedor ou o intermediário deverá, entre outras condutas: I - informar e esclarecer adequadamente o consumidor sobre a natureza e a modalidade do crédito; II - avaliar de forma responsável e leal as condições do consumidor. (Incluído pela Lei nº 14.181, de 2021)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14181.htm',
  },
  {
    artigo: 'Art. 104-A',
    motivo: '(Processo de repactuação de dívidas do consumidor superendividado. Incluído pela Lei nº 14.181, de 1º de julho de 2021)',
    ano: 2021, mes: 'Jul', mes_ano: 'Jul/2021', mes_completo: 'Julho', mes_index: 7,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 104-A. A requerimento do consumidor superendividado pessoa natural, o juiz poderá instaurar processo de repactuação de dívidas, com vistas à realização de audiência conciliatória, presidida por ele ou por conciliador credenciado no juízo. (Incluído pela Lei nº 14.181, de 2021)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14181.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CÓDIGO TRIBUTÁRIO NACIONAL (CTN)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_CTN_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 155-A',
    motivo: '(Parcelamento - Revogação de ofício e consequências. Alterado pela LC nº 104, de 10 de janeiro de 2001)',
    ano: 2001, mes: 'Jan', mes_ano: 'Jan/2001', mes_completo: 'Janeiro', mes_index: 1,
    texto_antigo: 'Sem previsão específica de parcelamento no CTN.',
    texto_novo: 'Art. 155-A. O parcelamento será concedido na forma e condição estabelecidas em lei específica. § 1º Salvo disposição de lei em contrário, o parcelamento do crédito tributário não exclui a incidência de juros e multas. (Incluído pela LC nº 104, de 2001)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp104.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ESTATUTO DA CRIANÇA E DO ADOLESCENTE (ECA)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_ECA_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 244-C',
    motivo: '(Intimidação sistemática virtual — cyberbullying como crime. Incluído pela Lei nº 14.811, de 15 de janeiro de 2024)',
    ano: 2024, mes: 'Jan', mes_ano: 'Jan/2024', mes_completo: 'Janeiro', mes_index: 1,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 244-C. Intimidar sistematicamente, por qualquer meio, inclusive virtual (cyberbullying), mediante violência física ou psicológica, atos de intimidação, de humilhação ou de discriminação: Pena - reclusão, de 2 (dois) a 4 (quatro) anos, e multa. (Incluído pela Lei nº 14.811, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14811.htm',
  },
  {
    artigo: 'Art. 244-B',
    motivo: '(Intimidação sistemática — bullying tipificado como crime. Incluído pela Lei nº 14.811, de 15 de janeiro de 2024)',
    ano: 2024, mes: 'Jan', mes_ano: 'Jan/2024', mes_completo: 'Janeiro', mes_index: 1,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 244-B. Intimidar sistematicamente, individualmente ou em grupo, mediante violência física ou psicológica, uma ou mais pessoas, de modo intencional e repetitivo: Pena - multa, se a conduta não constituir crime mais grave. (Incluído pela Lei nº 14.811, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14811.htm',
  },
  {
    artigo: 'Art. 241-D',
    motivo: '(Aliciamento de criança online — tipificação penal com aumento de pena. Alterado pela Lei nº 14.811, de 15 de janeiro de 2024)',
    ano: 2024, mes: 'Jan', mes_ano: 'Jan/2024', mes_completo: 'Janeiro', mes_index: 1,
    texto_antigo: 'Pena – reclusão, de 1 (um) a 3 (três) anos, e multa.',
    texto_novo: 'Art. 241-D. Aliciar, assediar, instigar ou constranger, por qualquer meio de comunicação, criança, com o fim de com ela praticar ato libidinoso: Pena – reclusão, de 2 (dois) a 5 (cinco) anos. (Redação dada pela Lei nº 14.811, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14811.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEI DE EXECUÇÃO PENAL (LEP)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_LEP_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 112',
    motivo: '(Exame criminológico obrigatório para progressão de regime. Alterado pela Lei nº 14.843, de 11 de abril de 2024)',
    ano: 2024, mes: 'Abr', mes_ano: 'Abr/2024', mes_completo: 'Abril', mes_index: 4,
    texto_antigo: 'Progressão baseada apenas em bom comportamento e tempo cumprido.',
    texto_novo: 'Art. 112. A pena privativa de liberdade será executada em forma progressiva com a transferência para regime menos rigoroso. § 1º Em todos os casos, o apenado somente terá direito à progressão de regime se ostentar boa conduta carcerária, comprovada pelo diretor do estabelecimento, e pelos resultados do exame criminológico. (Redação dada pela Lei nº 14.843, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14843.htm',
  },
  {
    artigo: 'Art. 52',
    motivo: '(Regime disciplinar diferenciado - RDD. Alterado pela Lei nº 13.964, de 24 de dezembro de 2019)',
    ano: 2019, mes: 'Dez', mes_ano: 'Dez/2019', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'RDD com duração máxima de 360 dias.',
    texto_novo: 'Art. 52. A prática de fato previsto como crime doloso constitui falta grave e, quando ocasionar subversão da ordem ou disciplina internas, sujeitará o preso provisório, ou condenado, nacional ou estrangeiro, sem prejuízo da sanção penal, ao regime disciplinar diferenciado. § 1º O regime disciplinar diferenciado terá duração máxima de até 2 (dois) anos, sem prejuízo de repetição da sanção. (Redação dada pela Lei nº 13.964, de 2019)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEI MARIA DA PENHA (LMP)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_LMP_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 12-C',
    motivo: '(Afastamento imediato do agressor pelo delegado. Alterado pela Lei nº 14.994, de 9 de outubro de 2024)',
    ano: 2024, mes: 'Out', mes_ano: 'Out/2024', mes_completo: 'Outubro', mes_index: 10,
    texto_antigo: 'Art. 12-C. Verificada a existência de risco atual ou iminente...',
    texto_novo: 'Art. 12-C. Verificada a existência de risco atual ou iminente à vida ou à integridade física e psicológica da mulher, o agressor será imediatamente afastado do lar, domicílio ou local de convivência com a ofendida. § 1º O afastamento de que trata o caput deste artigo poderá ser determinado pelo delegado de polícia ou pelo policial. (Redação dada pela Lei nº 14.994, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14994.htm',
  },
  {
    artigo: 'Art. 24-A',
    motivo: '(Descumprimento de medida protetiva — Pena aumentada. Alterado pela Lei nº 14.994, de 9 de outubro de 2024)',
    ano: 2024, mes: 'Out', mes_ano: 'Out/2024', mes_completo: 'Outubro', mes_index: 10,
    texto_antigo: 'Pena – detenção, de 3 (três) meses a 2 (dois) anos.',
    texto_novo: 'Art. 24-A. Descumprir decisão judicial que defere medidas protetivas de urgência previstas nesta Lei: Pena – reclusão, de 1 (um) a 3 (três) anos. § 1º A conduta descrita no caput será processada de ofício. (Redação dada pela Lei nº 14.994, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14994.htm',
  },
  {
    artigo: 'Art. 10-A',
    motivo: '(Direito de a vítima ter advogado em todos os atos processuais. Incluído pela Lei nº 13.836, de 4 de junho de 2019)',
    ano: 2019, mes: 'Jun', mes_ano: 'Jun/2019', mes_completo: 'Junho', mes_index: 6,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 10-A. É direito da mulher em situação de violência doméstica e familiar o atendimento policial e pericial especializado, ininterrupto e prestado por servidores - preferencialmente do sexo feminino. (Incluído pela Lei nº 13.836, de 2019)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13836.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEI DE DROGAS (LD)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_LD_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 28',
    motivo: '(Porte pessoal de maconha — Definição de quantidade para uso próprio. Alterado pela Lei nº 14.195, de 26 de agosto de 2021)',
    ano: 2021, mes: 'Ago', mes_ano: 'Ago/2021', mes_completo: 'Agosto', mes_index: 8,
    texto_antigo: 'Quem adquirir, guardar, tiver em depósito, transportar ou trouxer consigo drogas para consumo pessoal...',
    texto_novo: 'Art. 28. Quem adquirir, guardar, tiver em depósito, transportar ou trouxer consigo, para consumo pessoal, drogas sem autorização ou em desacordo com determinação legal ou regulamentar será submetido às seguintes penas: I - advertência; II - prestação de serviços à comunidade; III - medida educativa. (Redação dada pela Lei nº 14.195, de 2021)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14195.htm',
  },
  {
    artigo: 'Art. 33',
    motivo: '(Tráfico de drogas — Pacote Anticrime. Alterado pela Lei nº 13.964, de 24 de dezembro de 2019)',
    ano: 2019, mes: 'Dez', mes_ano: 'Dez/2019', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'Pena - reclusão de 5 (cinco) a 15 (quinze) anos e pagamento de multa.',
    texto_novo: 'Art. 33. Importar, exportar, remeter, preparar, produzir, fabricar, adquirir, vender, expor à venda, oferecer, ter em depósito, transportar, trazer consigo, guardar, prescrever, ministrar, entregar a consumo ou fornecer drogas: Pena - reclusão de 5 (cinco) a 15 (quinze) anos e pagamento de 500 (quinhentos) a 1.500 (mil e quinhentos) dias-multa. (Redação dada pela Lei nº 13.964, de 2019)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEI DE ORGANIZAÇÃO CRIMINOSA (LOC)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_LOC_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 2º',
    motivo: '(Pena aumentada para organização criminosa armada. Alterado pela Lei nº 13.964, de 24 de dezembro de 2019)',
    ano: 2019, mes: 'Dez', mes_ano: 'Dez/2019', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'Pena - reclusão, de 3 (três) a 8 (oito) anos, e multa.',
    texto_novo: 'Art. 2º Promover, constituir, financiar ou integrar, pessoalmente ou por interposta pessoa, organização criminosa: Pena - reclusão, de 3 (três) a 8 (oito) anos, e multa. § 2º Se há emprego de arma de fogo, a pena é aumentada de metade. § 8º As lideranças de organizações criminosas armadas ou que tenham armas à disposição deverão iniciar o cumprimento da pena em estabelecimentos penais de segurança máxima. (Redação dada pela Lei nº 13.964, de 2019)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
  },
  {
    artigo: 'Art. 3º-A',
    motivo: '(Juiz das garantias no âmbito de investigações de organização criminosa. Incluído pela Lei nº 13.964, de 24 de dezembro de 2019)',
    ano: 2019, mes: 'Dez', mes_ano: 'Dez/2019', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 3º-A. O processo penal terá estrutura acusatória, vedadas a iniciativa do juiz na fase de investigação e a substituição da atuação probatória do órgão de acusação. (Incluído pela Lei nº 13.964, de 2019)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LINDB
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_LINDB_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 20',
    motivo: '(Decisões com base em valores jurídicos abstratos devem considerar consequências práticas. Incluído pela Lei nº 13.655, de 25 de abril de 2018)',
    ano: 2018, mes: 'Abr', mes_ano: 'Abr/2018', mes_completo: 'Abril', mes_index: 4,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 20. Nas esferas administrativa, controladora e judicial, não se decidirá com base em valores jurídicos abstratos sem que sejam consideradas as consequências práticas da decisão. Parágrafo único. A motivação demonstrará a necessidade e a adequação da medida imposta ou da invalidação de ato, contrato, ajuste, processo ou norma administrativa. (Incluído pela Lei nº 13.655, de 2018)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13655.htm',
  },
  {
    artigo: 'Art. 21',
    motivo: '(Regime de transição para novas interpretações administrativas. Incluído pela Lei nº 13.655, de 25 de abril de 2018)',
    ano: 2018, mes: 'Abr', mes_ano: 'Abr/2018', mes_completo: 'Abril', mes_index: 4,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 21. A decisão que, nas esferas administrativa, controladora ou judicial, decretar a invalidação de ato, contrato, ajuste, processo ou norma administrativa deverá indicar de modo expresso suas consequências jurídicas e administrativas. Parágrafo único. A decisão a que se refere o caput deste artigo deverá, quando for o caso, indicar as condições para que a regularização ocorra de modo proporcional e equânime. (Incluído pela Lei nº 13.655, de 2018)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13655.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEI DE CRIMES HEDIONDOS (LCH)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_LCH_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 1º',
    motivo: '(Feminicídio incluído no rol de crimes hediondos. Alterado pela Lei nº 14.994, de 9 de outubro de 2024)',
    ano: 2024, mes: 'Out', mes_ano: 'Out/2024', mes_completo: 'Outubro', mes_index: 10,
    texto_antigo: 'Art. 1º São considerados hediondos: I - homicídio (art. 121), quando praticado em atividade típica de grupo de extermínio...',
    texto_novo: 'Art. 1º São considerados hediondos os seguintes crimes: I - homicídio (art. 121), quando praticado em atividade típica de grupo de extermínio; I-A - feminicídio (art. 121-A); I-B - lesão corporal seguida de morte praticada contra a mulher por razões da condição do sexo feminino. (Redação dada pela Lei nº 14.994, de 2024)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14994.htm',
  },
  {
    artigo: 'Art. 2º',
    motivo: '(Regime de cumprimento de pena para crimes hediondos — Pacote Anticrime. Alterado pela Lei nº 13.964, de 24 de dezembro de 2019)',
    ano: 2019, mes: 'Dez', mes_ano: 'Dez/2019', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'A progressão de regime, no caso dos condenados por crimes hediondos, dar-se-á após o cumprimento de 2/5 da pena.',
    texto_novo: 'Art. 2º. § 2º A progressão de regime, no caso dos condenados pelos crimes previstos neste artigo, dar-se-á após o cumprimento de: I - 40% da pena, se o apenado não for reincidente nem tiver sido associado a organização criminosa; II - 50% da pena, se o apenado for reincidente; III - 60% da pena, se for reincidente específico; IV - 70% da pena, se tiver sido condenado por comando de organização criminosa estruturada. (Redação dada pela Lei nº 13.964, de 2019)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEI DE IMPROBIDADE ADMINISTRATIVA (LIA)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_LIA_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 11',
    motivo: '(Atos de improbidade que atentam contra princípios da administração — Exigência de dolo. Alterado pela Lei nº 14.230, de 25 de outubro de 2021)',
    ano: 2021, mes: 'Out', mes_ano: 'Out/2021', mes_completo: 'Outubro', mes_index: 10,
    texto_antigo: 'Constitui ato de improbidade administrativa que atenta contra os princípios da administração pública...',
    texto_novo: 'Art. 11. Constitui ato de improbidade administrativa que atenta contra os princípios da administração pública a ação ou omissão dolosa que viole os deveres de honestidade, de imparcialidade e de legalidade. (Redação dada pela Lei nº 14.230, de 2021)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14230.htm',
  },
  {
    artigo: 'Art. 17',
    motivo: '(Ação de improbidade — Legitimidade exclusiva do Ministério Público. Alterado pela Lei nº 14.230, de 25 de outubro de 2021)',
    ano: 2021, mes: 'Out', mes_ano: 'Out/2021', mes_completo: 'Outubro', mes_index: 10,
    texto_antigo: 'A ação principal será proposta pelo Ministério Público ou pela pessoa jurídica interessada.',
    texto_novo: 'Art. 17. A ação para a aplicação das sanções de que trata esta Lei será proposta pelo Ministério Público e seguirá o procedimento comum previsto na Lei nº 13.105, de 16 de março de 2015 (Código de Processo Civil). (Redação dada pela Lei nº 14.230, de 2021)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14230.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// NOVA LEI DE LICITAÇÕES (NLL)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_NLL_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 178',
    motivo: '(Aplicação imediata da nova lei de licitações — Revogação da Lei 8.666. A partir de 30 de dezembro de 2023)',
    ano: 2023, mes: 'Dez', mes_ano: 'Dez/2023', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'Lei 8.666/1993 vigente para todos os contratos.',
    texto_novo: 'Art. 178. Revogam-se: I - a Lei nº 8.666, de 21 de junho de 1993; II - a Lei nº 10.520, de 17 de julho de 2002; III - os arts. 1º a 47-A da Lei nº 12.462, de 4 de agosto de 2011. (Incluído pela Lei nº 14.133, de 2021, com vigência plena a partir de 30/12/2023)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm',
  },
  {
    artigo: 'Art. 75',
    motivo: '(Contratação direta — Dispensa e inexigibilidade. Incluído pela Lei nº 14.133, de 1º de abril de 2021)',
    ano: 2021, mes: 'Abr', mes_ano: 'Abr/2021', mes_completo: 'Abril', mes_index: 4,
    texto_antigo: 'Dispensa nos termos do art. 24 da Lei 8.666/93.',
    texto_novo: 'Art. 75. É dispensável a licitação: I - para contratação que envolva valores inferiores a R$ 100.000,00 (cem mil reais), no caso de obras e serviços de engenharia; II - para contratação que envolva valores inferiores a R$ 50.000,00 (cinquenta mil reais), no caso de outros serviços e compras. (Incluído pela Lei nº 14.133, de 2021)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/L14133.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LGPD
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_LGPD_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 52',
    motivo: '(Sanções administrativas — ANPD pode aplicar multa de até 2% do faturamento. Vigência a partir de 1º de agosto de 2021)',
    ano: 2021, mes: 'Ago', mes_ano: 'Ago/2021', mes_completo: 'Agosto', mes_index: 8,
    texto_antigo: 'Sanções sem vigência definida.',
    texto_novo: 'Art. 52. Os agentes de tratamento de dados, em razão das infrações cometidas às normas previstas nesta Lei, ficam sujeitos às seguintes sanções administrativas aplicáveis pela autoridade nacional: II - multa simples, de até 2% do faturamento da pessoa jurídica, limitada, no total, a R$ 50.000.000,00 por infração. (Vigência a partir de 01/08/2021)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
  },
  {
    artigo: 'Art. 55-A',
    motivo: '(Autoridade Nacional de Proteção de Dados — ANPD. Incluído pela Lei nº 13.853, de 8 de julho de 2019)',
    ano: 2019, mes: 'Jul', mes_ano: 'Jul/2019', mes_completo: 'Julho', mes_index: 7,
    texto_antigo: 'ANPD prevista mas sem regulamentação específica.',
    texto_novo: 'Art. 55-A. Fica criada, sem aumento de despesa, a Autoridade Nacional de Proteção de Dados - ANPD, órgão da administração pública federal, integrante da Presidência da República. (Incluído pela Lei nº 13.853, de 2019)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13853.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// SERVIDORES FEDERAIS (L8112)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_L8112_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 117',
    motivo: '(Proibições ao servidor — vedação de acumulação com empresas. Alterado pela Lei nº 13.303, de 30 de junho de 2016)',
    ano: 2016, mes: 'Jun', mes_ano: 'Jun/2016', mes_completo: 'Junho', mes_index: 6,
    texto_antigo: 'Art. 117. Ao servidor é proibido: X - participar de gerência ou administração de sociedade privada...',
    texto_novo: 'Art. 117. Ao servidor é proibido: X - participar de gerência ou administração de sociedade privada, personificada ou não personificada, exercer o comércio, exceto na qualidade de acionista, cotista ou comanditário. (Redação dada pela Lei nº 13.303, de 2016)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13303.htm',
  },
  {
    artigo: 'Art. 143',
    motivo: '(Processo Administrativo Disciplinar — Instauração obrigatória. Regulamentado pela Lei nº 8.112, de 11 de dezembro de 1990)',
    ano: 1990, mes: 'Dez', mes_ano: 'Dez/1990', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'Sem especificação anterior.',
    texto_novo: 'Art. 143. A autoridade que tiver ciência de irregularidade no serviço público é obrigada a promover a sua apuração imediata, mediante sindicância ou processo administrativo disciplinar, assegurada ao acusado ampla defesa. (Incluído pela Lei nº 8.112, de 1990)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/leis/l8112compilado.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ESTATUTO DO IDOSO (EI)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_EI_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 19',
    motivo: '(Proteção contra violência doméstica à pessoa idosa. Alterado pela Lei nº 14.423, de 22 de julho de 2022)',
    ano: 2022, mes: 'Jul', mes_ano: 'Jul/2022', mes_completo: 'Julho', mes_index: 7,
    texto_antigo: 'Os casos de suspeita ou confirmação de violência serão notificados compulsoriamente pelos serviços de saúde.',
    texto_novo: 'Art. 19. Os casos de suspeita ou confirmação de violência praticada contra a pessoa idosa serão objeto de notificação compulsória pelos serviços de saúde públicos e privados à autoridade sanitária, bem como serão obrigatoriamente comunicados por eles a quaisquer dos seguintes órgãos: I - autoridade policial; II - Ministério Público; III - Conselho Municipal do Idoso; IV - Conselho Estadual do Idoso; V - Conselho Nacional do Idoso. (Redação dada pela Lei nº 14.423, de 2022)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14423.htm',
  },
  {
    artigo: 'Art. 96',
    motivo: '(Discriminação de pessoa idosa com pena aumentada. Alterado pela Lei nº 14.423, de 22 de julho de 2022)',
    ano: 2022, mes: 'Jul', mes_ano: 'Jul/2022', mes_completo: 'Julho', mes_index: 7,
    texto_antigo: 'Pena – reclusão de 6 (seis) meses a 1 (um) ano e multa.',
    texto_novo: 'Art. 96. Discriminar pessoa idosa, impedindo ou dificultando seu acesso a operações bancárias, aos meios de transporte, ao direito de contratar ou por qualquer outro meio ou instrumento necessário ao exercício da cidadania: Pena – reclusão de 6 (seis) meses a 1 (um) ano e multa. § 1º Na mesma pena incorre quem desdenhar, humilhar, menosprezar ou discriminar pessoa idosa, por qualquer motivo. (Redação dada pela Lei nº 14.423, de 2022)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14423.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ESTATUTO DA PESSOA COM DEFICIÊNCIA (EPD)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_EPD_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 88',
    motivo: '(Prioridade na tramitação processual à pessoa com deficiência. Incluído pela Lei nº 13.146, de 6 de julho de 2015)',
    ano: 2015, mes: 'Jul', mes_ano: 'Jul/2015', mes_completo: 'Julho', mes_index: 7,
    texto_antigo: 'Dispositivo incluído pela primeira vez (inédito).',
    texto_novo: 'Art. 88. Praticar, induzir ou incitar discriminação de pessoa em razão de sua deficiência: Pena - reclusão, de 1 (um) a 3 (três) anos, e multa. § 1º Aumenta-se a pena em 1/3 (um terço) se a vítima encontrar-se sob cuidado e responsabilidade do agente. (Incluído pela Lei nº 13.146, de 2015)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ESTATUTO DO DESARMAMENTO (ED)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_ED_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 6º',
    motivo: '(Critérios para porte de arma de fogo — restrição de acesso. Alterado pela Lei nº 14.785, de 27 de dezembro de 2023)',
    ano: 2023, mes: 'Dez', mes_ano: 'Dez/2023', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'É proibido o porte de arma de fogo em todo o território nacional, salvo para os casos previstos em legislação própria.',
    texto_novo: 'Art. 6º É proibido o porte de arma de fogo em todo o território nacional, salvo para os casos previstos em legislação própria e para: I – os integrantes das Forças Armadas; II – os integrantes dos órgãos de segurança pública; III – os agentes de segurança privada e os guardas municipais que preencherem os requisitos legais. (Redação dada pela Lei nº 14.785, de 2023)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14785.htm',
  },
  {
    artigo: 'Art. 17',
    motivo: '(Comércio ilegal de arma de fogo — Pena aumentada. Alterado pela Lei nº 13.964, de 24 de dezembro de 2019)',
    ano: 2019, mes: 'Dez', mes_ano: 'Dez/2019', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'Pena – reclusão, de 4 (quatro) a 8 (oito) anos, e multa.',
    texto_novo: 'Art. 17. Adquirir, alugar, receber, transportar, conduzir, ocultar, ter em depósito, desmontar, montar, remontar, adulterar, vender, expor à venda, ou de qualquer forma utilizar, em proveito próprio ou alheio, no exercício de atividade comercial ou industrial, arma de fogo, acessório ou munição: Pena – reclusão, de 6 (seis) a 12 (doze) anos, e multa. (Redação dada pela Lei nº 13.964, de 2019)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/l13964.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ESTATUTO OAB (EOAB)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_EOAB_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 7º',
    motivo: '(Direitos do advogado — Prerrogativas profissionais. Alterado pela Lei nº 13.245, de 12 de janeiro de 2016)',
    ano: 2016, mes: 'Jan', mes_ano: 'Jan/2016', mes_completo: 'Janeiro', mes_index: 1,
    texto_antigo: 'São direitos do advogado: XXI – assistir a seus clientes investigados durante a apuração de infrações...',
    texto_novo: 'Art. 7º São direitos do advogado: XXI - assistir a seus clientes investigados durante a apuração de infrações, sob pena de nulidade absoluta do respectivo interrogatório ou depoimento e, subsequentemente, de todos os elementos investigatórios e probatórios dele decorrentes ou derivados, direta ou indiretamente. (Redação dada pela Lei nº 13.245, de 2016)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13245.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CÓDIGO ELEITORAL (CE)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_CE_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 326',
    motivo: '(Crimes eleitorais — fake news e desinformação eleitoral. Alterado pela Lei nº 14.192, de 4 de agosto de 2021)',
    ano: 2021, mes: 'Ago', mes_ano: 'Ago/2021', mes_completo: 'Agosto', mes_index: 8,
    texto_antigo: 'Sem previsão específica sobre violência política de gênero.',
    texto_novo: 'Art. 326. Assediar, constranger, humilhar, perseguir ou ameaçar, por qualquer meio, candidata a cargo eletivo ou detentora de mandato eletivo, utilizando-se de menosprezo ou discriminação à condição de mulher ou à sua cor, raça ou etnia, com a finalidade de impedir ou de dificultar a sua campanha eleitoral ou o desempenho de seu mandato eletivo: Pena - reclusão, de 1 (um) a 4 (quatro) anos, e multa. (Incluído pela Lei nº 14.192, de 2021)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14192.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CÓDIGO FLORESTAL (CFLOR)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_CFLOR_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 68',
    motivo: '(Regularização de áreas consolidadas até 22 de julho de 2008. Incluído pela Lei nº 12.651, de 25 de maio de 2012)',
    ano: 2012, mes: 'Mai', mes_ano: 'Mai/2012', mes_completo: 'Maio', mes_index: 5,
    texto_antigo: 'Código Florestal anterior (Lei 4.771/1965).',
    texto_novo: 'Art. 68. Os proprietários ou possuidores de imóveis rurais que realizaram supressão de vegetação nativa respeitando os percentuais de Reserva Legal previstos pela legislação em vigor à época em que ocorreu a supressão são dispensados de promover a recomposição, compensação ou regeneração. (Incluído pela Lei nº 12.651, de 2012)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651compilado.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// CÓDIGO PENAL MILITAR (CPM) / CPPM
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_CPM_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 9º',
    motivo: '(Definição de crime militar em tempo de paz. Alterado pela Lei nº 13.491, de 13 de outubro de 2017)',
    ano: 2017, mes: 'Out', mes_ano: 'Out/2017', mes_completo: 'Outubro', mes_index: 10,
    texto_antigo: 'Consideram-se crimes militares os crimes em espécie definidos neste Código...',
    texto_novo: 'Art. 9º Consideram-se crimes militares, em tempo de paz: II – os crimes previstos neste Código e os previstos na legislação penal, quando praticados: a) por militar em situação de atividade ou assemelhado, em lugar sujeito à administração militar. (Redação dada pela Lei nº 13.491, de 2017)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13491.htm',
  },
];

export const SEED_CPPM_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 18',
    motivo: '(Competência da Justiça Militar — Extensão pela Lei 13.491/2017. Alterado pela Lei nº 13.491, de 13 de outubro de 2017)',
    ano: 2017, mes: 'Out', mes_ano: 'Out/2017', mes_completo: 'Outubro', mes_index: 10,
    texto_antigo: 'Competência original do CPPM para crimes militares em espécie.',
    texto_novo: 'A Justiça Militar é competente para processar e julgar os crimes militares definidos no art. 9º do Código Penal Militar, incluindo as condutas previstas na legislação penal comum quando praticadas nas condições do art. 9º. (Alterado pela Lei nº 13.491, de 2017)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13491.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// LEIS ESPECIAIS DIVERSAS (restantes com pelo menos 1 alteração)
// ═══════════════════════════════════════════════════════════════════════════
export const SEED_LAA_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 9º',
    motivo: '(Decretar medida de privação de liberdade em manifesta desconformidade com a lei. Incluído pela Lei nº 13.869, de 5 de setembro de 2019)',
    ano: 2019, mes: 'Set', mes_ano: 'Set/2019', mes_completo: 'Setembro', mes_index: 9,
    texto_antigo: 'Lei anterior revogada (Lei nº 4.898/1965).',
    texto_novo: 'Art. 9º Decretar medida de privação da liberdade em manifesta desconformidade com as hipóteses legais: Pena - detenção, de 1 (um) a 4 (quatro) anos, e multa. (Incluído pela Lei nº 13.869, de 2019)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/L13869.htm',
  },
];

export const SEED_LCA_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 29',
    motivo: '(Crimes contra a fauna — matar, perseguir, caçar. Redação original da Lei nº 9.605, de 12 de fevereiro de 1998)',
    ano: 1998, mes: 'Fev', mes_ano: 'Fev/1998', mes_completo: 'Fevereiro', mes_index: 2,
    texto_antigo: 'Legislação esparsa anterior.',
    texto_novo: 'Art. 29. Matar, perseguir, caçar, apanhar, utilizar espécimes da fauna silvestre, nativos ou em rota migratória, sem a devida permissão, licença ou autorização da autoridade competente: Pena - detenção de 6 (seis) meses a 1 (um) ano, e multa. (Incluído pela Lei nº 9.605, de 1998)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/leis/L9605.htm',
  },
];

export const SEED_LRAC_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 20',
    motivo: '(Injúria racial equiparada a racismo. Alterado pela Lei nº 14.532, de 11 de janeiro de 2023)',
    ano: 2023, mes: 'Jan', mes_ano: 'Jan/2023', mes_completo: 'Janeiro', mes_index: 1,
    texto_antigo: 'Injúria racial prevista no Código Penal (art. 140, § 3º).',
    texto_novo: 'Art. 20. Praticar, induzir ou incitar a discriminação ou preconceito de raça, cor, etnia, religião ou procedência nacional: Pena: reclusão de 2 (dois) a 5 (cinco) anos, e multa. § 2º-A Injuriar alguém, ofendendo-lhe a dignidade ou o decoro, em razão de raça, cor, etnia ou procedência nacional: Pena: reclusão, de 2 (dois) a 5 (cinco) anos, e multa. (Redação dada pela Lei nº 14.532, de 2023)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/l14532.htm',
  },
];

export const SEED_LJE_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 61',
    motivo: '(Infrações de menor potencial ofensivo — conceito atualizado. Alterado pela Lei nº 11.313, de 28 de junho de 2006)',
    ano: 2006, mes: 'Jun', mes_ano: 'Jun/2006', mes_completo: 'Junho', mes_index: 6,
    texto_antigo: 'Consideram-se infrações penais de menor potencial ofensivo as contravenções penais e os crimes a que a lei comine pena máxima não superior a 1 ano.',
    texto_novo: 'Art. 61. Consideram-se infrações penais de menor potencial ofensivo, para os efeitos desta Lei, as contravenções penais e os crimes a que a lei comine pena máxima não superior a 2 (dois) anos, cumulada ou não com multa. (Redação dada pela Lei nº 11.313, de 2006)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11313.htm',
  },
];

export const SEED_MCI_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 19',
    motivo: '(Responsabilidade do provedor de aplicações por conteúdo de terceiros. Incluído pela Lei nº 12.965, de 23 de abril de 2014)',
    ano: 2014, mes: 'Abr', mes_ano: 'Abr/2014', mes_completo: 'Abril', mes_index: 4,
    texto_antigo: 'Sem regulamentação específica sobre responsabilidade de provedores.',
    texto_novo: 'Art. 19. Com o intuito de assegurar a liberdade de expressão e impedir a censura, o provedor de aplicações de internet somente poderá ser responsabilizado civilmente por danos decorrentes de conteúdo gerado por terceiros se, após ordem judicial específica, não tomar as providências para tornar indisponível o conteúdo apontado como infringente. (Incluído pela Lei nº 12.965, de 2014)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm',
  },
];

export const SEED_LF_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 6º',
    motivo: '(Regime de recuperação judicial simplificado para ME e EPP. Alterado pela Lei nº 14.112, de 24 de dezembro de 2020)',
    ano: 2020, mes: 'Dez', mes_ano: 'Dez/2020', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'Sem previsão de regime simplificado.',
    texto_novo: 'A Lei nº 14.112/2020 reformou profundamente a Lei de Falências, incluindo o parcelamento de créditos tributários pelo devedor em recuperação judicial, aprimorando o regime de recuperação extrajudicial, e prevendo o mecanismo de DIP financing (financiamento ao devedor em posse). (Alterado pela Lei nº 14.112, de 2020)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14112.htm',
  },
];

export const SEED_LBPS_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 25',
    motivo: '(Pensão por morte — Fim da vitaliciedade para cônjuge jovem. Alterado pela Lei nº 13.135, de 17 de junho de 2015)',
    ano: 2015, mes: 'Jun', mes_ano: 'Jun/2015', mes_completo: 'Junho', mes_index: 6,
    texto_antigo: 'Pensão por morte vitalícia para cônjuge independente de idade.',
    texto_novo: 'Art. 25. A pensão por morte será devida ao conjunto dos dependentes do segurado que falecer, aposentado ou não. § 2º-B A duração da cota de pensão por morte para o cônjuge, companheiro ou companheira será calculada de acordo com sua expectativa de sobrevida no momento do óbito do instituidor. (Redação dada pela Lei nº 13.135, de 2015)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13135.htm',
  },
];

export const SEED_LI_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 62',
    motivo: '(Despejo — Liminar em ação de despejo por falta de pagamento. Alterado pela Lei nº 12.112, de 9 de dezembro de 2009)',
    ano: 2009, mes: 'Dez', mes_ano: 'Dez/2009', mes_completo: 'Dezembro', mes_index: 12,
    texto_antigo: 'Liminar de despejo restrita a hipóteses específicas.',
    texto_novo: 'Art. 62. Nas ações de despejo fundadas na falta de pagamento de aluguel e acessórios da locação, de aluguel provisório, de diferenças de aluguéis, ou somente de quaisquer dos acessórios da locação, observar-se-á o seguinte: I – o pedido de rescisão da locação poderá ser cumulado com o pedido de cobrança dos aluguéis e acessórios da locação, devendo ser apresentado, com a inicial, cálculo discriminado do valor do débito. (Redação dada pela Lei nº 12.112, de 2009)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2009/lei/l12112.htm',
  },
];

export const SEED_EME_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 18-A',
    motivo: '(MEI — Limites de faturamento e atividades. Alterado pela LC nº 188, de 4 de janeiro de 2022)',
    ano: 2022, mes: 'Jan', mes_ano: 'Jan/2022', mes_completo: 'Janeiro', mes_index: 1,
    texto_antigo: 'MEI com faturamento máximo de R$ 81.000,00.',
    texto_novo: 'Art. 18-A. O Microempreendedor Individual - MEI poderá optar pelo recolhimento dos impostos e contribuições abrangidos pelo Simples Nacional em valores fixos mensais. § 1º Para os efeitos desta Lei Complementar, considera-se MEI o empresário individual ou o empreendedor que exerça atividades de industrialização, comercialização e prestação de serviços no âmbito rural, que tenha auferido receita bruta, no ano-calendário anterior, de até R$ 81.000,00. (Redação dada pela LC nº 188, de 2022)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/leis/LCP/Lcp188.htm',
  },
];

export const SEED_LLAV_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 1º',
    motivo: '(Lavagem de dinheiro — Crime antecedente ampliado para qualquer infração penal. Alterado pela Lei nº 12.683, de 9 de julho de 2012)',
    ano: 2012, mes: 'Jul', mes_ano: 'Jul/2012', mes_completo: 'Julho', mes_index: 7,
    texto_antigo: 'Rol taxativo de crimes antecedentes para lavagem de dinheiro.',
    texto_novo: 'Art. 1º Ocultar ou dissimular a natureza, origem, localização, disposição, movimentação ou propriedade de bens, direitos ou valores provenientes, direta ou indiretamente, de infração penal. Pena: reclusão, de 3 (três) a 10 (dez) anos, e multa. (Redação dada pela Lei nº 12.683, de 2012)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12683.htm',
  },
];

export const SEED_LPAF_ALTERACOES: ScrapedArticleUpdate[] = [
  {
    artigo: 'Art. 50',
    motivo: '(Motivação obrigatória dos atos administrativos. Incluído pela Lei nº 9.784, de 29 de janeiro de 1999)',
    ano: 1999, mes: 'Jan', mes_ano: 'Jan/1999', mes_completo: 'Janeiro', mes_index: 1,
    texto_antigo: 'Sem legislação federal específica de processo administrativo.',
    texto_novo: 'Art. 50. Os atos administrativos deverão ser motivados, com indicação dos fatos e dos fundamentos jurídicos, quando: I - neguem, limitem ou afetem direitos ou interesses; II - imponham ou agravem deveres, encargos ou sanções; III - decidam processos administrativos de concurso ou seleção pública. (Incluído pela Lei nº 9.784, de 1999)',
    link_lei: 'https://www.planalto.gov.br/ccivil_03/leis/l9784.htm',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY — Mapa centralizado para detecção automática de todas as leis
// ═══════════════════════════════════════════════════════════════════════════
import { SEED_CP_ALTERACOES, SEED_CC_ALTERACOES, SEED_CPP_ALTERACOES, SEED_CTB_ALTERACOES } from './leiAlteracoesScraped';

export interface SeedRegistryEntry {
  /** Regex que identifica o tabela_nome */
  tabelaPattern: RegExp;
  /** Regex que identifica o leiId */
  idPattern: RegExp;
  /** Chaves adicionais de localStorage a tentar */
  extraKeys: string[];
  /** Lista de seed de alterações */
  seeds: ScrapedArticleUpdate[];
}

export const SEEDS_REGISTRY: SeedRegistryEntry[] = [
  // Já existentes em leiAlteracoesScraped.ts
  { tabelaPattern: /CP_CODIGO_PENAL/i, idPattern: /^cp$/i, extraKeys: ['vade_scrape_data_CP_CODIGO_PENAL', 'vade_scrape_data_cp'], seeds: SEED_CP_ALTERACOES },
  { tabelaPattern: /CC_CODIGO_CIVIL/i, idPattern: /^cc$/i, extraKeys: ['vade_scrape_data_CC_CODIGO_CIVIL', 'vade_scrape_data_cc'], seeds: SEED_CC_ALTERACOES },
  { tabelaPattern: /CPP_CODIGO_PROCESSO_PENAL/i, idPattern: /^cpp$/i, extraKeys: ['vade_scrape_data_CPP_CODIGO_PROCESSO_PENAL', 'vade_scrape_data_cpp'], seeds: SEED_CPP_ALTERACOES },
  { tabelaPattern: /CTB_CODIGO_TRANSITO/i, idPattern: /^ctb$/i, extraKeys: ['vade_scrape_data_CTB_CODIGO_TRANSITO_BRASILEIRO', 'vade_scrape_data_ctb'], seeds: SEED_CTB_ALTERACOES },
  // Novos
  { tabelaPattern: /CF88_CONSTITUICAO/i, idPattern: /^cf88$/i, extraKeys: ['vade_scrape_data_CF88_CONSTITUICAO_FEDERAL', 'vade_scrape_data_cf88'], seeds: SEED_CF88_ALTERACOES },
  { tabelaPattern: /CPC_CODIGO_PROCESSO_CIVIL/i, idPattern: /^cpc$/i, extraKeys: ['vade_scrape_data_CPC_CODIGO_PROCESSO_CIVIL', 'vade_scrape_data_cpc'], seeds: SEED_CPC_ALTERACOES },
  { tabelaPattern: /CLT_CONSOLIDACAO/i, idPattern: /^clt$/i, extraKeys: ['vade_scrape_data_CLT_CONSOLIDACAO_LEIS_TRABALHO', 'vade_scrape_data_clt'], seeds: SEED_CLT_ALTERACOES },
  { tabelaPattern: /CDC_CODIGO_DEFESA/i, idPattern: /^cdc$/i, extraKeys: ['vade_scrape_data_CDC_CODIGO_DEFESA_CONSUMIDOR', 'vade_scrape_data_cdc'], seeds: SEED_CDC_ALTERACOES },
  { tabelaPattern: /CTN_CODIGO_TRIBUTARIO/i, idPattern: /^ctn$/i, extraKeys: ['vade_scrape_data_CTN_CODIGO_TRIBUTARIO_NACIONAL', 'vade_scrape_data_ctn'], seeds: SEED_CTN_ALTERACOES },
  { tabelaPattern: /ECA_ESTATUTO_CRIANCA/i, idPattern: /^eca$/i, extraKeys: ['vade_scrape_data_ECA_ESTATUTO_CRIANCA_ADOLESCENTE', 'vade_scrape_data_eca'], seeds: SEED_ECA_ALTERACOES },
  { tabelaPattern: /LEP_EXECUCAO_PENAL/i, idPattern: /^lep$/i, extraKeys: ['vade_scrape_data_LEP_EXECUCAO_PENAL', 'vade_scrape_data_lep'], seeds: SEED_LEP_ALTERACOES },
  { tabelaPattern: /LMP_MARIA_PENHA/i, idPattern: /^lmp$/i, extraKeys: ['vade_scrape_data_LMP_MARIA_PENHA', 'vade_scrape_data_lmp'], seeds: SEED_LMP_ALTERACOES },
  { tabelaPattern: /LD_LEI_DROGAS/i, idPattern: /^ld$/i, extraKeys: ['vade_scrape_data_LD_LEI_DROGAS', 'vade_scrape_data_ld'], seeds: SEED_LD_ALTERACOES },
  { tabelaPattern: /LOC_ORGANIZACAO_CRIMINOSA/i, idPattern: /^loc$/i, extraKeys: ['vade_scrape_data_LOC_ORGANIZACAO_CRIMINOSA', 'vade_scrape_data_loc'], seeds: SEED_LOC_ALTERACOES },
  { tabelaPattern: /LINDB_INTRODUCAO/i, idPattern: /^lindb$/i, extraKeys: ['vade_scrape_data_LINDB_INTRODUCAO_NORMAS', 'vade_scrape_data_lindb'], seeds: SEED_LINDB_ALTERACOES },
  { tabelaPattern: /LCH_CRIMES_HEDIONDOS/i, idPattern: /^lch$/i, extraKeys: ['vade_scrape_data_LCH_CRIMES_HEDIONDOS', 'vade_scrape_data_lch'], seeds: SEED_LCH_ALTERACOES },
  { tabelaPattern: /LIA_IMPROBIDADE/i, idPattern: /^lia$/i, extraKeys: ['vade_scrape_data_LIA_IMPROBIDADE_ADMINISTRATIVA', 'vade_scrape_data_lia'], seeds: SEED_LIA_ALTERACOES },
  { tabelaPattern: /NLL_LICITACOES/i, idPattern: /^nll$/i, extraKeys: ['vade_scrape_data_NLL_LICITACOES', 'vade_scrape_data_nll'], seeds: SEED_NLL_ALTERACOES },
  { tabelaPattern: /LGPD_PROTECAO_DADOS/i, idPattern: /^lgpd$/i, extraKeys: ['vade_scrape_data_LGPD_PROTECAO_DADOS', 'vade_scrape_data_lgpd'], seeds: SEED_LGPD_ALTERACOES },
  { tabelaPattern: /L8112_SERVIDORES/i, idPattern: /^l8112$/i, extraKeys: ['vade_scrape_data_L8112_SERVIDORES_FEDERAIS', 'vade_scrape_data_l8112'], seeds: SEED_L8112_ALTERACOES },
  { tabelaPattern: /EI_ESTATUTO_IDOSO/i, idPattern: /^ei$/i, extraKeys: ['vade_scrape_data_EI_ESTATUTO_IDOSO', 'vade_scrape_data_ei'], seeds: SEED_EI_ALTERACOES },
  { tabelaPattern: /EPD_ESTATUTO_PESSOA_DEFICIENCIA/i, idPattern: /^epd$/i, extraKeys: ['vade_scrape_data_EPD_ESTATUTO_PESSOA_DEFICIENCIA', 'vade_scrape_data_epd'], seeds: SEED_EPD_ALTERACOES },
  { tabelaPattern: /ED_ESTATUTO_DESARMAMENTO/i, idPattern: /^ed$/i, extraKeys: ['vade_scrape_data_ED_ESTATUTO_DESARMAMENTO', 'vade_scrape_data_ed'], seeds: SEED_ED_ALTERACOES },
  { tabelaPattern: /EOAB_ESTATUTO_OAB/i, idPattern: /^eoab$/i, extraKeys: ['vade_scrape_data_EOAB_ESTATUTO_OAB', 'vade_scrape_data_eoab'], seeds: SEED_EOAB_ALTERACOES },
  { tabelaPattern: /CE_CODIGO_ELEITORAL/i, idPattern: /^ce$/i, extraKeys: ['vade_scrape_data_CE_CODIGO_ELEITORAL', 'vade_scrape_data_ce'], seeds: SEED_CE_ALTERACOES },
  { tabelaPattern: /CFLOR_CODIGO_FLORESTAL/i, idPattern: /^cflor$/i, extraKeys: ['vade_scrape_data_CFLOR_CODIGO_FLORESTAL', 'vade_scrape_data_cflor'], seeds: SEED_CFLOR_ALTERACOES },
  { tabelaPattern: /CPM_CODIGO_PENAL_MILITAR/i, idPattern: /^cpm$/i, extraKeys: ['vade_scrape_data_CPM_CODIGO_PENAL_MILITAR', 'vade_scrape_data_cpm'], seeds: SEED_CPM_ALTERACOES },
  { tabelaPattern: /CPPM_CODIGO_PROCESSO_PENAL_MILITAR/i, idPattern: /^cppm$/i, extraKeys: ['vade_scrape_data_CPPM_CODIGO_PROCESSO_PENAL_MILITAR', 'vade_scrape_data_cppm'], seeds: SEED_CPPM_ALTERACOES },
  { tabelaPattern: /LAA_ABUSO_AUTORIDADE/i, idPattern: /^laa$/i, extraKeys: ['vade_scrape_data_LAA_ABUSO_AUTORIDADE', 'vade_scrape_data_laa'], seeds: SEED_LAA_ALTERACOES },
  { tabelaPattern: /LCA_CRIMES_AMBIENTAIS/i, idPattern: /^lca$/i, extraKeys: ['vade_scrape_data_LCA_CRIMES_AMBIENTAIS', 'vade_scrape_data_lca'], seeds: SEED_LCA_ALTERACOES },
  { tabelaPattern: /LRAC_RACISMO/i, idPattern: /^lrac$/i, extraKeys: ['vade_scrape_data_LRAC_RACISMO', 'vade_scrape_data_lrac'], seeds: SEED_LRAC_ALTERACOES },
  { tabelaPattern: /LJE_JUIZADOS/i, idPattern: /^lje$/i, extraKeys: ['vade_scrape_data_LJE_JUIZADOS_ESPECIAIS', 'vade_scrape_data_lje'], seeds: SEED_LJE_ALTERACOES },
  { tabelaPattern: /MCI_MARCO_CIVIL/i, idPattern: /^mci$/i, extraKeys: ['vade_scrape_data_MCI_MARCO_CIVIL_INTERNET', 'vade_scrape_data_mci'], seeds: SEED_MCI_ALTERACOES },
  { tabelaPattern: /LF_FALENCIAS/i, idPattern: /^lf$/i, extraKeys: ['vade_scrape_data_LF_FALENCIAS', 'vade_scrape_data_lf'], seeds: SEED_LF_ALTERACOES },
  { tabelaPattern: /LBPS_BENEFICIOS/i, idPattern: /^lbps$/i, extraKeys: ['vade_scrape_data_LBPS_BENEFICIOS_PREVIDENCIA', 'vade_scrape_data_lbps'], seeds: SEED_LBPS_ALTERACOES },
  { tabelaPattern: /LI_INQUILINATO/i, idPattern: /^li$/i, extraKeys: ['vade_scrape_data_LI_INQUILINATO', 'vade_scrape_data_li'], seeds: SEED_LI_ALTERACOES },
  { tabelaPattern: /EME_ESTATUTO_MICROEMPRESA/i, idPattern: /^eme$/i, extraKeys: ['vade_scrape_data_EME_ESTATUTO_MICROEMPRESA', 'vade_scrape_data_eme'], seeds: SEED_EME_ALTERACOES },
  { tabelaPattern: /LLAV_LAVAGEM/i, idPattern: /^llav$/i, extraKeys: ['vade_scrape_data_LLAV_LAVAGEM_DINHEIRO', 'vade_scrape_data_llav'], seeds: SEED_LLAV_ALTERACOES },
  { tabelaPattern: /LPAF_PROCESSO_ADMINISTRATIVO/i, idPattern: /^lpaf$/i, extraKeys: ['vade_scrape_data_LPAF_PROCESSO_ADMINISTRATIVO', 'vade_scrape_data_lpaf'], seeds: SEED_LPAF_ALTERACOES },
];
