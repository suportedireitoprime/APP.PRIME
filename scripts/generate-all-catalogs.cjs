const fs = require('fs');
const path = require('path');
const { buildBookCatalog } = require('./build-book-catalog.cjs');

// Metadados dos 16 livros
const BOOKS_META = [
  {
    slug: '1984',
    varName: 'LIVRO_1984',
    fileName: 'livro1984.ts',
    tableId: 1984,
    titulo: '1984',
    subtitulo: 'O clássico distópico sobre vigilância, poder e controle',
    autor: 'George Orwell',
    ano: 1949,
    descricao: 'Winston Smith vive sob a vigilância constante do Grande Irmão em um regime totalitário onde o pensamento independente é o pior dos crimes. Uma reflexão profunda sobre controle estatal, manipulação da verdade e liberdade.',
    sinopse: 'Publicado em 1949, 1984 é uma das obras mais influentes do século XX. O romance descreve uma sociedade totalitária governada pelo Partido e personificada pelo Grande Irmão, onde o Ministério da Verdade reescreve a história e a Novilíngua restringe o próprio ato de pensar.',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/1984/capa-do-livro.jpg',
    tags: ['Clássico', 'Filosofia Política', 'Distopia', 'Liberdade']
  },
  {
    slug: 'como-as-democracias-morrem',
    varName: 'COMO_AS_DEMOCRACIAS_MORREM',
    fileName: 'comoAsDemocraciasMorrem.ts',
    tableId: 134,
    titulo: 'Como as Democracias Morrem',
    subtitulo: 'Um diagnóstico lúcido sobre a erosão das instituições',
    autor: 'Steven Levitsky e Daniel Ziblatt',
    ano: 2018,
    descricao: 'Dois professores de Harvard revelam como as democracias contemporâneas deixaram de ruir por golpes militares para serem corroídas por dentro, através da eleição de líderes autoritários que subvertem as próprias leis.',
    sinopse: 'Com base em décadas de pesquisa e exemplos históricos que vão da América Latina à Europa, Levitsky e Ziblatt mostram que a sobrevivência da democracia depende de regras não escritas: tolerância mútua e autocontrole institucional.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/como_as_democracias_morrem_manual.jpg',
    tags: ['Direito Constitucional', 'Democracia', 'Instituições', 'Política']
  },
  {
    slug: 'crime-e-castigo',
    varName: 'CRIME_E_CASTIGO',
    fileName: 'crimeECastigo.ts',
    tableId: 138,
    titulo: 'Crime e Castigo',
    subtitulo: 'O ápice da psicologia criminal e da moral humana',
    autor: 'Fiódor Dostoiévski',
    ano: 1866,
    descricao: 'Em São Petersburgo, o estudante Rodion Raskólnikov assassina uma velha usurária acreditando ser um homem extraordinário acima da lei, mas é consumido pela culpa e pela perseguição implacável do juiz Porfiri Petróvitch.',
    sinopse: 'Uma das obras-primas da literatura mundial, Crime e Castigo mergulha nas profundezas da consciência, do livre-arbítrio e da redenção moral, sendo estudo obrigatório na Criminologia e na Filosofia do Direito.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/crime_e_castigo_manual.jpg',
    tags: ['Direito Penal', 'Criminologia', 'Clássicos', 'Filosofia Moral']
  },
  {
    slug: 'direito-penal-do-equilibrio',
    varName: 'DIREITO_PENAL_DO_EQUILIBRIO',
    fileName: 'direitoPenalDoEquilibrio.ts',
    tableId: 147,
    titulo: 'Direito Penal do Equilíbrio',
    subtitulo: 'Teoria e prática entre a intervenção mínima e a proteção eficaz',
    autor: 'Rogério Greco',
    ano: 2011,
    descricao: 'Um dos maiores penalistas brasileiros propõe um modelo equilibrado para o sistema penal, superando tanto o punitivismo desmedido quanto o abolicionismo ingênuo, fundamentado na dignidade da pessoa humana.',
    sinopse: 'Rogério Greco examina as correntes criminológicas modernas, o princípio da intervenção mínima e a necessidade de tutela aos bens jurídicos fundamentais, trazendo lições essenciais para operadores do direito e concurseiros.',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/direito-penal-do-equilibrio/capa-do-livro.jpg',
    tags: ['Direito Penal', 'Criminologia', 'Garantismo', 'Doutrina']
  },
  {
    slug: 'eles-os-juizes-vistos-por-nos-os-advogados',
    varName: 'ELES_OS_JUIZES_VISTOS_POR_NOS_OS_ADVOGADOS',
    fileName: 'elesOsJuizes.ts',
    tableId: 141,
    titulo: 'Eles, os Juízes, Vistos por Nós, os Advogados',
    subtitulo: 'Elogio aos magistrados escrito por um advogado',
    autor: 'Piero Calamandrei',
    ano: 1935,
    descricao: 'Obra indispensável sobre a relação ética, humana e processual entre advogados e magistrados, escrita com finíssima ironia e profunda sabedoria por um dos maiores processualistas da história.',
    sinopse: 'Piero Calamandrei traça um retrato vivo e sincero da vida nos tribunais, refletindo sobre a discrição dos julgadores, a coragem dos causídicos e a sublime arte de buscar a justiça nos pretórios.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/eles_os_juizes_vistos_por_nos_os_advogados_manual.jpg',
    tags: ['Deontologia Jurídica', 'Processo Civil', 'Advocacia', 'Magistratura']
  },
  {
    slug: 'etica-a-nicomaco',
    varName: 'ETICA_A_NICOMACO',
    fileName: 'eticaANicomaco.ts',
    tableId: 140,
    titulo: 'Ética a Nicômaco',
    subtitulo: 'O tratado clássico da virtude e da justiça como meio-termo',
    autor: 'Aristóteles',
    ano: 'séc. IV a.C.',
    descricao: 'O livro seminal de Aristóteles sobre a felicidade (eudaimonia), o justo meio e as virtudes humanas, contendo no Livro V a célebre formulação da justiça distributiva e comutativa que fundamenta todo o Direito Ocidental.',
    sinopse: 'Dedicado ao seu filho Nicômaco, o tratado examina a busca do Sumo Bem e define a virtude como uma disposição de caráter guiada pela prudência. No Livro V, Aristóteles inaugura a teoria geral da justiça.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/etica_a_nicomaco_manual.jpg',
    tags: ['Filosofia do Direito', 'Ética', 'Justiça', 'Clássicos']
  },
  {
    slug: 'introducao-ao-estudo-do-direito',
    varName: 'INTRODUCAO_AO_ESTUDO_DO_DIREITO',
    fileName: 'introducaoAoEstudoDoDireito.ts',
    tableId: 146,
    titulo: 'Introdução ao Estudo do Direito',
    subtitulo: 'Técnica, decisão e dominação no fenômeno jurídico',
    autor: 'Tercio Sampaio Ferraz Júnior',
    ano: 1988,
    descricao: 'Um dos manuais fundamentais do pensamento jurídico nacional, combinando teoria zetética e dogmática para dissecar as normas, a validade e a interpretação jurídica de forma inovadora.',
    sinopse: 'Tercio Sampaio articula a linguagem do direito, a teoria da norma e o problema da decisão jurídica com rigor conceitual e clareza didática inigualáveis na academia brasileira.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/introducao_ao_estudo_do_direito_manual.jpg',
    tags: ['Teoria Geral do Direito', 'Dogmática', 'Hermenêutica', 'Graduação']
  },
  {
    slug: 'justica-o-que-e-fazer-a-coisa-certa',
    varName: 'JUSTICA_O_QUE_E_FAZER_A_COISA_CERTA',
    fileName: 'justicaFazerACoisaCerta.ts',
    tableId: 122,
    titulo: 'Justiça: O que é fazer a coisa certa',
    subtitulo: 'Dilemas morais, utilitarismo, libertarianismo e o bem comum',
    autor: 'Michael J. Sandel',
    ano: 2009,
    descricao: 'Baseado no famoso curso de Harvard, Sandel confronta dilemas éticos contemporâneos através das teorias de Aristóteles, Kant, Bentham, Mill e Rawls para responder: o que é uma sociedade verdadeiramente justa?',
    sinopse: 'Com uma abordagem socrática e envolvente, o autor desafia o leitor a testar suas próprias convicções em debates sobre ações afirmativas, igualdade, livre mercado e moralidade cívica.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/justica_o_que_e_fazer_a_coisa_certa_manual.jpg',
    tags: ['Filosofia do Direito', 'Ética', 'Harvard', 'Teoria da Justiça']
  }
];

async function main() {
  console.log(`=== GERADOR DE CATÁLOGOS MODULARES TYPESCRIPT (${BOOKS_META.length} LIVROS) ===\n`);

  for (const meta of BOOKS_META) {
    const livroObj = await buildBookCatalog(meta.slug, meta);
    if (!livroObj) continue;

    const outPath = path.join(__dirname, '../src/data/audiobooks', meta.fileName);
    const tsCode = `// Catálogo Oficial do Audiobook: ${meta.titulo} (${meta.autor})
// Armazenado e servido a 0ms via Cloudflare R2 Global CDN
import type { AudiobookLivro } from '../audiobooksCatalogo';

export const ${meta.varName}: AudiobookLivro = ${JSON.stringify(livroObj, null, 2)};
`;

    fs.writeFileSync(outPath, tsCode, 'utf8');
    console.log(`✓ Gerado arquivo: ${meta.fileName} (${livroObj.totalCapitulos} capítulos, ${livroObj.duracaoTotalFormatada})`);
  }

  console.log('\n=== GERAÇÃO DO PRIMEIRO LOTE CONCLUÍDA COM SUCESSO! ===');
}

main().catch(console.error);

