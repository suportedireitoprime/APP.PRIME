/**
 * Normalizador de conteúdo para Resumos Jurídicos.
 * Resolve a falta de hierarquia, quebras de linha ausentes e textos colapsados
 * herdados de extrações brutas de PDFs e sites, padronizando a estrutura para Markdown limpo.
 */

const ABREVIACOES_JURIDICAS = [
  'art',
  'arts',
  'inc',
  'par',
  'pág',
  'págs',
  'al',
  'n[oº]',
  'núm',
  'v',
  'fl',
  'fls',
  'cf',
  'ex',
  'etc',
  'dr',
  'dra',
  'min',
  'des',
  'desa',
  'prof',
  'profa',
  'sr',
  'sra',
  'stf',
  'stj',
  'tjrj',
  'tjsp',
  'trf',
  'oab',
  'a\\.c',
  'd\\.c',
  'i\\.e',
  'e\\.g',
].join('|');

const SECOES_DOUTRINA = [
  'Classificações de Meio Ambiente',
  'Classificações',
  'Classificação Doutrinária',
  'Classificação',
  'Conceito e Fundamentos',
  'Conceito e Definição',
  'Conceito',
  'Definição',
  'Natureza Jurídica',
  'Origem e Evolução Histórica',
  'Origem e Evolução',
  'Histórico',
  'Fundamento Constitucional',
  'Fundamentação Legal',
  'Requisitos e Elementos',
  'Requisitos',
  'Elementos',
  'Espécies',
  'Características Principais',
  'Características',
  'Efeitos Jurídicos',
  'Efeitos',
  'Exceções à Regra',
  'Exceções',
  'Interesses Públicos',
  'Interesse Público Primário',
  'Interesse Público Secundário',
  'Interesse Primário',
  'Interesse Secundário',
  'Eficiência em Sentido Estrito',
  'Eficiência como Efetividade',
  'Eficiência como Economicidade',
  'Princípio da Eficiência',
  'Princípio da Legalidade',
  'Princípio da Impessoalidade',
  'Princípio da Moralidade',
  'Princípio da Publicidade',
  'Princípio da Proporcionalidade',
  'Princípio da Razoabilidade',
  'Princípio da Precaução',
  'Princípio da Prevenção',
  'Publicidade Formal',
  'Publicidade Educativa',
  'Observações Importantes',
  'Observação Importante',
  'Observações',
  'Observação',
  'Nota Importante',
  'Importante',
  'Atenção',
  'Considerações Finais',
  'Conclusão',
];

export function normalizarResumo(rawText: string | null | undefined): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Desfaz escape literal de quebras de linha
  text = text.replace(/\\n/g, '\n');

  // 2. Remove marcas d'água de extração e números de página soltos (ex: www.trilhante.com.br 5)
  text = text.replace(/www\.[a-z0-9.-]+\.[a-z]{2,}(?:\.br)?\s*\d*/gi, '');
  text = text.replace(/trilhante\.com(?:\.br)?\s*\d*/gi, '');

  // 3. Normaliza quebras Windows
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Verifica se o texto já possui parágrafos ou títulos estruturados
  const contagemParagrafos = (text.match(/\n\s*\n/g) || []).length;
  const temTitulosMarkdown = /^#{1,4}\s+/m.test(text);
  const estaEstruturado = contagemParagrafos >= 3 || (temTitulosMarkdown && contagemParagrafos >= 1);

  if (estaEstruturado) {
    // Apenas limpa espaços excessivos e garante espaçamento dos títulos existentes
    text = text.replace(/[ \t]{2,}/g, ' ');
    text = text.replace(/([^\n])\n*(#{1,4}\s+[^\n]+)/g, '$1\n\n$2');
    text = text.replace(/(#{1,4}\s+[^\n]+)\n*([^\n#])/g, '$1\n\n$2');
    return text.trim();
  }

  // === ESTRUTURAÇÃO DE TEXTO CONTÍNUO (SEM QUEBRAS) ===

  // 4. Identifica seções doutrinárias comuns e insere cabeçalho ##
  for (const secao of SECOES_DOUTRINA) {
    const regex = new RegExp(`(?:^|([.:;!?]))\\s*(${secao})\\s+([A-ZÀ-Ú])`, 'g');
    text = text.replace(regex, (_match, p1, p2, p3) => {
      return (p1 ? p1 + '\n\n' : '') + '## ' + p2 + '\n\n' + p3;
    });
  }

  // 5. Tópicos numerados seguidos de dois pontos: "1) Meio ambiente natural:" ou "1. Meio ambiente cultural:"
  text = text.replace(/(?:^|([.:;!?]))\s*(\b\d{1,2}[.)]\s+[^:\n]{3,65}:)/g, (_match, p1, p2) => {
    return (p1 ? p1 + '\n\n' : '') + '### ' + p2.trim() + '\n\n';
  });

  // 6. Itens numerados em sequência (ex: "...requisitos. 1. Primeiro item... 2. Segundo item...")
  text = text.replace(/([.;!?])\s+(\b\d{1,2}[.)]\s+[A-ZÀ-Ú])/g, '$1\n\n$2');

  // 7. Marcadores de lista: '- Item...' ou '• Item...'
  text = text.replace(/([.;!?])\s+([–—-]|•)\s*([A-ZÀ-Ú])/g, '$1\n\n* $3');

  // 8. Títulos totalmente em caixa alta (ex: "CONCEITO E FUNDAMENTOS DOS PRINCÍPIOS")
  text = text.replace(/(?:^|([.:;!?]))\s*([A-ZÀ-Ú0-9\s]{8,60})(?=[.:;!?]|\s+[a-zà-ú])/g, (match, p1, p2) => {
    const trimmed = p2.trim();
    // Verifica se parece um título real (mais de 2 palavras em caps e tamanho razoável)
    const palavras = trimmed.split(/\s+/);
    if (palavras.length >= 2 && palavras.length <= 10 && trimmed.length >= 12) {
      return (p1 ? p1 + '\n\n' : '') + '## ' + trimmed + '\n\n';
    }
    return match;
  });

  // 9. Quebra o texto restante em blocos de parágrafos confortáveis
  // Divide em sentenças sem quebrar abreviações jurídicas
  const regexSeparadorSentencas = new RegExp(
    `(?<=[.!?])(?<!\\b(?:${ABREVIACOES_JURIDICAS})\\.)(?<!\\b[A-Za-z]\\.)\\s+(?=[A-ZÀ-Ú0-9])`
  );

  // Divide pelas partes que já possuem quebra de linha (títulos, listas) para preservar
  const blocosAtuais = text.split(/\n\n+/);
  const blocosFinais: string[] = [];

  for (const bloco of blocosAtuais) {
    const blocoLimpo = bloco.trim();
    if (!blocoLimpo) continue;

    // Se o bloco é um título Markdown, citação ou item de lista, mantém direto
    if (
      blocoLimpo.startsWith('#') ||
      blocoLimpo.startsWith('>') ||
      blocoLimpo.startsWith('* ') ||
      blocoLimpo.startsWith('- ') ||
      /^\d{1,2}[.)]\s/.test(blocoLimpo)
    ) {
      blocosFinais.push(blocoLimpo);
      continue;
    }

    // Se o bloco já é curto, não precisa quebrar
    if (blocoLimpo.length <= 320) {
      blocosFinais.push(blocoLimpo);
      continue;
    }

    // Bloco longo: quebra em sentenças inteligentes
    const sentencas = blocoLimpo.split(regexSeparadorSentencas);
    if (sentencas.length <= 2) {
      blocosFinais.push(blocoLimpo);
      continue;
    }

    let sentencasAcumuladas: string[] = [];
    for (const sentenca of sentencas) {
      const s = sentenca.trim();
      if (!s) continue;
      sentencasAcumuladas.push(s);

      // Agrupa 2 a 3 sentenças ou ~260-350 caracteres por parágrafo
      const comprimentoAtual = sentencasAcumuladas.join(' ').length;
      if (sentencasAcumuladas.length >= 3 || (sentencasAcumuladas.length >= 2 && comprimentoAtual >= 260)) {
        blocosFinais.push(sentencasAcumuladas.join(' '));
        sentencasAcumuladas = [];
      }
    }

    if (sentencasAcumuladas.length > 0) {
      blocosFinais.push(sentencasAcumuladas.join(' '));
    }
  }

  let resultado = blocosFinais.join('\n\n');

  // Limpa espaços duplos
  resultado = resultado.replace(/[ \t]{2,}/g, ' ');

  // Garante espaçamento limpo em volta de títulos
  resultado = resultado.replace(/([^\n])\n*(#{1,4}\s+[^\n]+)/g, '$1\n\n$2');
  resultado = resultado.replace(/(#{1,4}\s+[^\n]+)\n*([^\n#])/g, '$1\n\n$2');

  return resultado.trim();
}
