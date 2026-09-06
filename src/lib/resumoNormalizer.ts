/**
 * Normalizador de conteúdo para Resumos Jurídicos.
 * Resolve a falta de hierarquia, quebras de linha ausentes e textos colapsados
 * herdados de extrações brutas de PDFs e sites, padronizando a estrutura para Markdown limpo.
 */

const SIGLAS_CONHECIDAS = new Set([
  'STF', 'STJ', 'TST', 'TSE', 'TRF', 'TJ', 'TJRJ', 'TJSP', 'TJMG', 'TJRS',
  'OAB', 'CF', 'CLT', 'CP', 'CC', 'CPC', 'CPP', 'CTN', 'CDC', 'MP', 'CNJ',
  'ECA', 'SUS', 'ADI', 'ADC', 'ADPF', 'RE', 'HC', 'MS', 'AI', 'RESP', 'RO'
]);

const PALAVRAS_MINUSCULAS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'em', 'com', 'a', 'o', 'as', 'os',
  'para', 'por', 'e', 'ou', 'sob', 'sobre', 'na', 'no', 'nas', 'nos',
  'ao', 'aos', 'à', 'às', 'um', 'uma', 'uns', 'umas', 'que', 'se'
]);

/**
 * Converte títulos em CAIXA ALTA para Title Case elegante e editorial.
 */
export function toTitleCasePt(titulo: string): string {
  const palavras = titulo.trim().split(/\s+/);
  return palavras
    .map((palavra, index) => {
      const limpaPura = palavra.replace(/[^a-zA-ZÀ-Ú0-9]/g, '');
      if (SIGLAS_CONHECIDAS.has(limpaPura.toUpperCase())) {
        return palavra;
      }
      const limpa = palavra.toLowerCase();
      if (index > 0 && PALAVRAS_MINUSCULAS.has(limpa.replace(/[^a-zà-ú]/g, ''))) {
        return limpa;
      }
      return limpa.charAt(0).toUpperCase() + limpa.slice(1);
    })
    .join(' ');
}

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
  'Aspectos Relevantes',
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

const REGEX_TRANSICAO = /^(?:Incluem-se|Destacam-se|São exemplos|Exemplos?:|Por exemplo|Assim,|Dessa forma,|Desse modo,|Portanto,|Nesse contexto,|Nesse sentido,|Contudo,|Todavia,|Entretanto,|No entanto,|Por outro lado,|A atuação|O controle|Vale ressaltar|Importa notar|Ressalte-se|Cumpre destacar|Nessa linha|Ademais|Outrossim)/i;

// Regex seguro para quebrar sentenças em português sem quebrar palavras acentuadas (ex: administração.) nem abreviações
const REGEX_SEPARADOR_SENTENCAS = new RegExp(
  `(?<=[.!?])(?<!\\b(?:${ABREVIACOES_JURIDICAS})\\.)(?<!(?:\\s|^)[a-zA-Z]\\.)\\s+(?=[A-ZÀ-Ú0-9"“])`,
  'i'
);

export function normalizarResumo(rawText: string | null | undefined): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Desfaz escape literal de quebras de linha
  text = text.replace(/\\n/g, '\n');

  // 2. Remove marcas d'água de extração e números de página soltos
  text = text.replace(/www\.[a-z0-9.-]+\.[a-z]{2,}(?:\.br)?\s*\d*/gi, '');
  text = text.replace(/trilhante\.com(?:\.br)?\s*\d*/gi, '');

  // 3. Normaliza quebras Windows
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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

  // 6. Itens numerados em sequência
  text = text.replace(/([.;!?])\s+(\b\d{1,2}[.)]\s+[A-ZÀ-Ú])/g, '$1\n\n$2');

  // 7. Marcadores de lista
  text = text.replace(/([.;!?])\s+([–—-]|•)\s*([A-ZÀ-Ú])/g, '$1\n\n* $3');

  // 8. Títulos totalmente em caixa alta
  text = text.replace(/(?:^|([.:;!?]))\s*([A-ZÀ-Ú0-9\s]{8,60})(?=[.:;!?]|\s+[a-zà-ú])/g, (match, p1, p2) => {
    const trimmed = p2.trim();
    const palavras = trimmed.split(/\s+/);
    if (palavras.length >= 2 && palavras.length <= 10 && trimmed.length >= 12) {
      return (p1 ? p1 + '\n\n' : '') + '## ' + toTitleCasePt(trimmed) + '\n\n';
    }
    return match;
  });

  // 9. Garante que títulos existentes fiquem isolados com quebras duplas
  text = text.replace(/([^\n])\n*(#{1,4}\s+[^\n]+)/g, '$1\n\n$2');
  text = text.replace(/(#{1,4}\s+[^\n]+)\n*([^\n#])/g, '$1\n\n$2');

  // 10. Processa cada bloco preservando markdown e quebrando parágrafos longos
  const blocosAtuais = text.split(/\n\s*\n+/);
  const blocosFinais: string[] = [];

  for (const bloco of blocosAtuais) {
    const blocoLimpo = bloco.trim();
    if (!blocoLimpo) continue;

    // Se for título Markdown
    if (blocoLimpo.startsWith('#')) {
      const match = blocoLimpo.match(/^(#{1,4}\s+)(.+)$/);
      if (match) {
        const hashes = match[1];
        const conteudoTitulo = match[2].trim();
        // Se estiver em caixa alta (sem minúsculas e com letras)
        if (!/[a-zà-ú]/.test(conteudoTitulo) && /[A-ZÀ-Ú]/.test(conteudoTitulo)) {
          blocosFinais.push(hashes + toTitleCasePt(conteudoTitulo));
          continue;
        }
      }
      blocosFinais.push(blocoLimpo);
      continue;
    }

    // Se for citação de artigo constitucional ou legal
    if (/^["“']?(?:Art\.\s*\d+|CF\/88|Constituição Federal|Código Penal|Código Civil|Súmula)/i.test(blocoLimpo)) {
      const citacao = blocoLimpo.startsWith('>') ? blocoLimpo : `> ${blocoLimpo}`;
      blocosFinais.push(citacao);
      continue;
    }

    // Se for citação existente, tabela ou item de lista
    if (
      blocoLimpo.startsWith('>') ||
      blocoLimpo.startsWith('* ') ||
      blocoLimpo.startsWith('- ') ||
      /^\d{1,2}[.)]\s/.test(blocoLimpo) ||
      blocoLimpo.startsWith('|')
    ) {
      blocosFinais.push(blocoLimpo);
      continue;
    }

    // Para parágrafos comuns: segmenta sentenças e evita blocos longos
    const sentencas = blocoLimpo.split(REGEX_SEPARADOR_SENTENCAS);
    if (sentencas.length <= 1) {
      blocosFinais.push(blocoLimpo);
      continue;
    }

    let sentencasAcumuladas: string[] = [];
    for (const sentenca of sentencas) {
      const s = sentenca.trim();
      if (!s) continue;

      const eTransicao = REGEX_TRANSICAO.test(s);
      if (eTransicao && sentencasAcumuladas.length > 0) {
        blocosFinais.push(sentencasAcumuladas.join(' '));
        sentencasAcumuladas = [];
      }

      sentencasAcumuladas.push(s);
      const comprimentoAtual = sentencasAcumuladas.join(' ').length;
      if (sentencasAcumuladas.length >= 2 || comprimentoAtual >= 180) {
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
