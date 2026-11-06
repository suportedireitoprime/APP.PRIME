const fs = require('fs');
const path = require('path');
const { buildBookCatalog } = require('./build-book-catalog.cjs');

const BOOKS_META_BATCH2 = [
  {
    slug: 'o-contrato-social',
    varName: 'O_CONTRATO_SOCIAL',
    fileName: 'oContratoSocial.ts',
    tableId: 129,
    titulo: 'O Contrato Social',
    subtitulo: 'Princípios do Direito Político e da Vontade Geral',
    autor: 'Jean-Jacques Rousseau',
    ano: 1762,
    descricao: 'Marco do Iluminismo e da Teoria Política moderna, sustentando que a soberania reside no povo e que o Estado legítimo nasce da convenção entre cidadãos livres e iguais.',
    sinopse: 'Publicado em 1762, o tratado influenciou decisivamente a Revolução Francesa e a concepção democrática contemporânea ao introduzir os conceitos de Vontade Geral, Soberania Popular e Pacto Social.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_contrato_social_manual.jpg',
    tags: ['Direito Constitucional', 'Filosofia Política', 'Democracia', 'Clássicos']
  },
  {
    slug: 'o-leviata',
    varName: 'O_LEVIATA',
    fileName: 'oLeviata.ts',
    tableId: 126,
    titulo: 'O Leviatã',
    subtitulo: 'Matéria, forma e poder de um Estado eclesiástico e civil',
    autor: 'Thomas Hobbes',
    ano: 1651,
    descricao: 'Um dos pilares da ciência política mundial. Analisa a condição humana no estado de natureza, a guerra de todos contra todos e a criação do poder soberano para garantir a paz e a segurança.',
    sinopse: 'Escrito durante a Guerra Civil Inglesa, Hobbes formula a célebre metáfora do Estado como um monstro bíblico indispensável para superar o medo da morte violenta e instituir a ordem jurídica.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_leviata_manual.jpg',
    tags: ['Teoria do Estado', 'Filosofia do Direito', 'Contratualismo', 'Clássicos']
  },
  {
    slug: 'o-monge-e-o-executivo',
    varName: 'O_MONGE_E_O_EXECUTIVO',
    fileName: 'oMongeEOExecutivo.ts',
    tableId: 124,
    titulo: 'O Monge e o Executivo',
    subtitulo: 'Uma história sobre a essência da liderança e relações humanas',
    autor: 'James C. Hunter',
    ano: 1998,
    descricao: 'Clássico contemporâneo sobre liderança servidora, ética e inteligência interpessoal, ambientado em um mosteiro beneditino onde executivos aprendem a autoridade fundada no respeito e no serviço.',
    sinopse: 'A jornada de John Daily sob mentoria do lendário Leonard Hoffman revela que a verdadeira liderança não repousa no poder da coerção hierárquica, mas na capacidade de influenciar pessoas com integridade.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_monge_e_o_executivo_manual.jpg',
    tags: ['Liderança', 'Ética Profissional', 'Gestão', 'Desenvolvimento Pessoal']
  },
  {
    slug: 'o-mundo-assombrado-pelos-demonios',
    varName: 'O_MUNDO_ASSOMBRADO_PELOS_DEMONIOS',
    fileName: 'oMundoAssombradoPelosDemonios.ts',
    tableId: 136,
    titulo: 'O Mundo Assombrado pelos Demônios',
    subtitulo: 'A ciência vista como uma vela no escuro',
    autor: 'Carl Sagan',
    ano: 1995,
    descricao: 'Um manifesto apaixonado pelo pensamento crítico, pelo ceticismo metodológico e pela busca da verdade baseada em evidências, com ferramentas vitais para a análise probatória no direito.',
    sinopse: 'Carl Sagan apresenta o célebre kit de detecção de mentiras e falácias lógicas, essencial para juristas, magistrados e advogados avaliarem argumentos, laudos periciais e discursos retóricos.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_assombrado_pelos_demonios_manual.jpg',
    tags: ['Teoria da Prova', 'Pensamento Crítico', 'Lógica Jurídica', 'Ciência']
  },
  {
    slug: 'o-processo',
    varName: 'O_PROCESSO',
    fileName: 'oProcesso.ts',
    tableId: 135,
    titulo: 'O Processo',
    subtitulo: 'A engrenagem kafkiana da burocracia e do arbítrio judicial',
    autor: 'Franz Kafka',
    ano: 1925,
    descricao: 'Josef K. é detido em sua casa em uma manhã sem ter feito nada de errado. A partir daí, é arrastado por um sistema judicial opaco, inacessível e absurdo, em uma crítica atemporal ao autoritarismo.',
    sinopse: 'Romance seminal da literatura universal que inspirou o conceito de kafkaesco. O livro expõe o pesadelo da violação do devido processo legal e a alienação do cidadão diante do aparato estatal.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_processo_manual.jpg',
    tags: ['Direito Processual Penal', 'Garantismo', 'Literatura Jurídica', 'Clássicos']
  },
  {
    slug: 'o-ultimo-dia-de-um-condenado',
    varName: 'O_ULTIMO_DIA_DE_UM_CONDENADO',
    fileName: 'oUltimoDiaDeUmCondenado.ts',
    tableId: 133,
    titulo: 'O Último Dia de um Condenado',
    subtitulo: 'O grito humanista de Victor Hugo contra a pena de morte',
    autor: 'Victor Hugo',
    ano: 1829,
    descricao: 'O diário comovente de um homem anônimo que aguarda no corredor da morte a hora de subir ao cadafalso, retratando a agonia mental e a crueldade institucional da execução capital.',
    sinopse: 'Escrito antes de Os Miseráveis, este manifesto pioneiro pelos Direitos Humanos abalou a Europa do século XIX e consolidou os princípios fundamentais da abolição da pena de morte no Direito Penal moderno.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_ultimo_dia_de_um_condenado_manual.jpg',
    tags: ['Direito Penal', 'Direitos Humanos', 'Pena de Morte', 'Clássicos']
  },
  {
    slug: 'sobre-a-liberdade',
    varName: 'SOBRE_A_LIBERDADE',
    fileName: 'sobreALiberdade.ts',
    tableId: 137,
    titulo: 'Sobre a Liberdade',
    subtitulo: 'Os limites do poder da sociedade sobre o indivíduo',
    autor: 'John Stuart Mill',
    ano: 1859,
    descricao: 'A obra canônica do liberalismo político e da defesa irrestrita da liberdade de expressão, formulando o princípio do dano como critério supremo de intervenção estatal na vida privada.',
    sinopse: 'Mill argumenta vigorosamente que o único propósito legítimo para o qual o poder pode ser exercido sobre qualquer membro de uma comunidade civilizada, contra a sua vontade, é evitar dano a outrem.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.jpg',
    tags: ['Direito Constitucional', 'Liberdade de Expressão', 'Filosofia do Direito', 'Clássicos']
  },
  {
    slug: 'vigiar-e-punir',
    varName: 'VIGIAR_E_PUNIR',
    fileName: 'vigiarEPunir.ts',
    tableId: 144,
    titulo: 'Vigiar e Punir',
    subtitulo: 'O nascimento da prisão e a sociedade disciplinar',
    autor: 'Michel Foucault',
    ano: 1975,
    descricao: 'Estudo revolucionário sobre a evolução dos sistemas penais, da passagem dos suplícios públicos à disciplina minuciosa do corpo e ao panoptismo das prisões modernas.',
    sinopse: 'Foucault demonstra como a penalidade moderna deixou de atingir a carne para disciplinar a alma, criando micropoderes e mecanismos de vigilância que moldaram escolas, quartéis, fábricas e tribunais.',
    capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/vigiar_e_punir_manual.jpg',
    tags: ['Criminologia', 'Sociologia Jurídica', 'Execução Penal', 'Filosofia']
  }
];

async function main() {
  console.log(`=== GERADOR DE CATÁLOGOS MODULARES BATCH 2 (${BOOKS_META_BATCH2.length} LIVROS) ===\n`);

  for (const meta of BOOKS_META_BATCH2) {
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

  console.log('\n=== GERAÇÃO DO SEGUNDO LOTE CONCLUÍDA COM SUCESSO! ===');
}

main().catch(console.error);

