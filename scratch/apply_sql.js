import fs from 'fs';

const sql = fs.readFileSync('scratch/insert_30.sql', 'utf-8');

// Separa os valores individuais do SQL
const valuesMatch = sql.match(/VALUES\s+([\s\S]+);$/);

if (valuesMatch) {
  const rawValues = valuesMatch[1];
  // Separa por cada tupla (id, ...)
  const tuples = [];
  const regex = /\('art-[^']+'[\s\S]*?\$md\$\)/g;
  let m;
  while ((m = regex.exec(rawValues)) !== null) {
    tuples.push(m[0]);
  }
  
  console.log(`Encontradas ${tuples.length} tuplas.`);
  
  // Escreve os arquivos sql em lotes de 5 para envio no execute_sql
  for (let i = 0; i < tuples.length; i += 5) {
    const chunk = tuples.slice(i, i + 5);
    const chunkSql = `INSERT INTO blog_edicao_posts (id, titulo, categoria, resumo, autor, tempo_leitura_min, data_publicacao, imagem_url, conteudo_md) VALUES\n` + chunk.join(',\n') + ';';
    fs.writeFileSync(`scratch/insert_chunk_${i / 5 + 1}.sql`, chunkSql);
    console.log(`Gerado scratch/insert_chunk_${i / 5 + 1}.sql com 5 artigos`);
  }
}
