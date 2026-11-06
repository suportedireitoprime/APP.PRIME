const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../src/data/audiobooksCatalogo.ts');
let content = fs.readFileSync(file, 'utf8');

const regex = /export const AUDIOBOOKS_CATALOGO:\s*AudiobookLivro\[\]\s*=\s*\[[\s\S]*?\];/;

const replacement = `const LIVROS_DISPONIVEIS_NOVOS: AudiobookLivro[] = [
  O_CASO_DOS_EXPLORADORES_DE_CAVERNAS,
  DOS_DELITOS_E_DAS_PENAS,
  CINQUENTA_DISCURSOS_QUE_MARCARAM_O_MUNDO_MODERNO,
  O_MUNDO_DE_SOFIA,
  LIVRO_1984,
  COMO_AS_DEMOCRACIAS_MORREM,
  CRIME_E_CASTIGO,
  DIREITO_PENAL_DO_EQUILIBRIO,
  ELES_OS_JUIZES_VISTOS_POR_NOS_OS_ADVOGADOS,
  ETICA_A_NICOMACO,
  INTRODUCAO_AO_ESTUDO_DO_DIREITO,
  JUSTICA_O_QUE_E_FAZER_A_COISA_CERTA,
  O_CONTRATO_SOCIAL,
  O_LEVIATA,
  O_MONGE_E_O_EXECUTIVO,
  O_MUNDO_ASSOMBRADO_PELOS_DEMONIOS,
  O_PROCESSO,
  O_ULTIMO_DIA_DE_UM_CONDENADO,
  SOBRE_A_LIBERDADE,
  VIGIAR_E_PUNIR,
];

const slugsJaDisponiveis = new Set(LIVROS_DISPONIVEIS_NOVOS.map(l => l.id.toLowerCase()));
const tableIdsJaDisponiveis = new Set(LIVROS_DISPONIVEIS_NOVOS.map(l => l.tableId).filter(Boolean));
const titulosNormalizados = new Set(LIVROS_DISPONIVEIS_NOVOS.map(l => l.titulo.trim().toLowerCase()));

const emBreveSemDuplicatas = AUDIOBOOKS_EM_BREVE.filter(l => {
  if (slugsJaDisponiveis.has(l.id.toLowerCase())) return false;
  if (l.tableId && tableIdsJaDisponiveis.has(l.tableId)) return false;
  const t = l.titulo.trim().toLowerCase();
  for (const ja of titulosNormalizados) {
    if (t.includes(ja) || ja.includes(t)) return false;
  }
  return true;
});

export const AUDIOBOOKS_CATALOGO: AudiobookLivro[] = [
  ...LIVROS_DISPONIVEIS_NOVOS,
  ...emBreveSemDuplicatas
];`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(file, content, 'utf8');
  console.log('✓ Substituído com sucesso via regex!');
} else {
  console.error('✗ Regex não encontrou o bloco.');
}
