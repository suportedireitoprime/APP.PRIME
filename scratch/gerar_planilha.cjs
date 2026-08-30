const fs = require('fs');

const url = 'https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/biblioteca_classicos?select=*&order=id.asc';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

async function run() {
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    
    if (!res.ok) {
      console.error('Erro na requisição:', await res.text());
      return;
    }
    
    const data = await res.json();
    
    // Usando ponto e vírgula como separador para abrir certinho no Excel PT-BR
    let csv = 'Livro;Autor;Link do PDF (Referência);Prompt\n';
    
    for (const item of data) {
      const titulo = (item.livro || '').replace(/"/g, '""');
      const autor = (item.autor || 'Autor Desconhecido').replace(/"/g, '""');
      const link = (item.download || item.link || '').replace(/"/g, '""');
      const prompt = `Você deve explicar o livro todo capítulo por capítulo passando a importância para o estudante de direito ler, explicando o que o autor quis dizer, qual a obra... bem detalhado explicando os conceitos. Livro: ${titulo} - ${autor}`.replace(/"/g, '""');
      
      csv += `"${titulo}";"${autor}";"${link}";"${prompt}"\n`;
    }
    
    // \uFEFF = BOM for UTF-8 (forces Excel to read accents correctly)
    fs.writeFileSync('public/planilha_pilulas_classicos.csv', '\uFEFF' + csv, 'utf8');
    console.log('Planilha gerada com sucesso em: public/planilha_pilulas_classicos.csv');
  } catch (err) {
    console.error(err);
  }
}

run();
