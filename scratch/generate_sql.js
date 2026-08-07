import fs from 'fs';

// Lê o arquivo run_insert.js e gera os comandos SQL INSERT
const content = fs.readFileSync('scratch/run_insert.js', 'utf-8');
const match = content.match(/const posts = (\[[\s\S]*?\]);/);

if (match) {
  const posts = eval(match[1]);
  let sql = 'TRUNCATE TABLE blog_edicao_posts;\n\nINSERT INTO blog_edicao_posts (id, titulo, categoria, resumo, autor, tempo_leitura_min, data_publicacao, imagem_url, conteudo_md) VALUES\n';
  
  const values = posts.map(p => {
    const id = `'${p.id.replace(/'/g, "''")}'`;
    const titulo = `'${p.titulo.replace(/'/g, "''")}'`;
    const categoria = `'${p.categoria.replace(/'/g, "''")}'`;
    const resumo = `'${p.resumo.replace(/'/g, "''")}'`;
    const autor = `'${p.autor.replace(/'/g, "''")}'`;
    const tempo = p.tempo_leitura_min;
    const dataPub = `'${p.data_publicacao}'`;
    const imgUrl = `'${p.imagem_url}'`;
    const md = `$md$${p.conteudo_md}$md$`;
    return `(${id}, ${titulo}, ${categoria}, ${resumo}, ${autor}, ${tempo}, ${dataPub}, ${imgUrl}, ${md})`;
  });

  sql += values.join(',\n') + ';';
  fs.writeFileSync('scratch/insert_30.sql', sql);
  console.log('SQL de inserção gerado em scratch/insert_30.sql');
}
