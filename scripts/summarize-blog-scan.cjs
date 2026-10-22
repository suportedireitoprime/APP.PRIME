const fs = require('fs');

const raw = fs.readFileSync('scripts/blog_drive_scan.json', 'utf8');
const data = JSON.parse(raw);

console.log('================================================================');
console.log('        RELATÓRIO DE ANÁLISE DE ARTIGOS NO GOOGLE DRIVE        ');
console.log('================================================================\n');

let totalGeralDocx = 0;
let totalGeralOutros = 0;
const resumoFinal = [];

for (const entry of data) {
  const root = entry.scan;
  const pastaNome = root.title.replace(' - Google Drive', '') || entry.folderMeta.name;
  console.log(`📁 PASTA PRINCIPAL: ${pastaNome}`);
  console.log(`🔗 ID: ${root.folderId}`);
  console.log(`----------------------------------------------------------------`);

  let totalPastaDocx = 0;
  const categorias = [];

  // Arquivos na raiz da pasta, se houver
  const docxNaRaiz = root.files.filter(f => f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc'));
  if (docxNaRaiz.length > 0) {
    console.log(`  📄 Raiz: ${docxNaRaiz.length} arquivos docx`);
    totalPastaDocx += docxNaRaiz.length;
  }

  // Subpastas / Categorias
  for (const sub of root.subfolders) {
    const subNome = sub.path || sub.title.replace(' - Google Drive', '');
    const docxFiles = sub.files.filter(f => f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc'));
    const imgFiles = sub.files.filter(f => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(f.name));
    const outros = sub.files.filter(f => !docxFiles.includes(f) && !imgFiles.includes(f));

    totalPastaDocx += docxFiles.length;
    totalGeralOutros += outros.length;

    // Verificar se há sub-subpastas
    let subSubDocx = 0;
    for (const subsub of sub.subfolders || []) {
      const c = subsub.files.filter(f => f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc')).length;
      subSubDocx += c;
    }
    totalPastaDocx += subSubDocx;

    categorias.push({
      categoria: subNome,
      folderId: sub.folderId,
      totalDocx: docxFiles.length + subSubDocx,
      totalImgs: imgFiles.length,
      outros: outros.length,
      amostraArquivos: docxFiles.slice(0, 3).map(f => f.name),
      status: (docxFiles.length + subSubDocx) > 0 ? 'PRONTO / COM ARTIGOS' : 'PENDENTE / VAZIO'
    });
  }

  totalGeralDocx += totalPastaDocx;

  console.log(`\n📋 CATEGORIAS / ÁREAS ENCONTRADAS (${categorias.length} categorias):`);
  for (const cat of categorias) {
    const badge = cat.totalDocx > 0 ? `✅ ${cat.totalDocx} artigos (.docx)` : `⏳ 0 artigos (vazio)`;
    console.log(`  • ${cat.categoria.padEnd(45)} -> ${badge}`);
    if (cat.amostraArquivos.length > 0) {
      console.log(`    Exemplos: ${cat.amostraArquivos.join(' | ')}`);
    }
  }

  console.log(`\n📊 SUBTOTAL DA PASTA "${pastaNome}": ${totalPastaDocx} artigos .docx\n\n`);
  resumoFinal.push({
    pasta: pastaNome,
    id: root.folderId,
    totalDocx: totalPastaDocx,
    categorias
  });
}

console.log('================================================================');
console.log(`🎯 SOMATÓRIO TOTAL GERAL DE ARTIGOS .DOCX: ${totalGeralDocx} ARTIGOS`);
console.log('================================================================\n');

fs.writeFileSync('scripts/resumo_artigos_blog.json', JSON.stringify({ totalGeralDocx, pastas: resumoFinal }, null, 2), 'utf8');
