require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const COLECOES = [
  { table: 'biblioteca_estudos', id: 'areas', titleField: 'tema' },
  { table: 'biblioteca_classicos', id: 'classicos', titleField: 'livro' },
  { table: 'biblioteca_oab', id: 'oab', titleField: 'tema' },
  { table: 'biblioteca_fora_da_toga', id: 'fora-da-toga', titleField: 'livro' },
  { table: 'biblioteca_oratoria', id: 'oratoria', titleField: 'livro' },
  { table: 'biblioteca_lideranca', id: 'lideranca', titleField: 'livro' },
  { table: 'biblioteca_portugues', id: 'portugues', titleField: 'livro' },
  { table: 'biblioteca_pesquisa_cientifica', id: 'pesquisa', titleField: 'livro' },
];

async function run() {
  const allPending = [];
  for (const col of COLECOES) {
    const { data: livros } = await supabase.from(col.table).select(`id, ${col.titleField}, download`);
    const { data: nativa } = await supabase.from('biblioteca_leitura_nativa').select('livro_id, status').eq('livro_tabela', col.table);
    
    // Status que indicam que NÃO devemos rodar de novo: 'pronto' e 'processando'
    // Mas o usuário pediu "quais livros faltam", então pegamos tudo que não é 'pronto'.
    const prontos = nativa.filter(n => n.status === 'pronto').map(n => String(n.livro_id));
    
    for (const l of (livros || [])) {
      const url = l.download;
      if (url && typeof url === 'string' && url.includes('http') && !prontos.includes(String(l.id))) {
        allPending.push({ 
          livro_tabela: col.table, 
          livro_id: String(l.id), 
          pdf_url: url,
          titulo: l[col.titleField] || `Livro ${l.id}`,
          tipo: 'completo'
        });
      }
    }
  }
  
  console.log(`Encontrados ${allPending.length} livros pendentes com PDF disponível.`);
  
  if (allPending.length > 0) {
    // Checar quantos já estão na fila para não duplicar
    const { data: jaNaFila } = await supabase.from('biblioteca_leitura_jobs').select('livro_id, livro_tabela').in('status', ['pendente', 'rodando', 'agendado']);
    
    const paraAdicionar = allPending.filter(p => {
      return !jaNaFila.some(j => j.livro_id === p.livro_id && j.livro_tabela === p.livro_tabela);
    });
    
    console.log(`${paraAdicionar.length} livros serão adicionados à fila (ignorando os que já estão lá).`);
    
    if (paraAdicionar.length > 0) {
        const rows = paraAdicionar.map((p, idx) => ({ ...p, scheduled_for: new Date(Date.now() + idx * 1000).toISOString() }));
        const { error } = await supabase.from('biblioteca_leitura_jobs').insert(rows);
        if (error) console.error(error);
        else console.log('Adicionados com sucesso!');
    }
    
    // Agora disparar o webhook do Edge Function para rodar a fila!
    const res = await fetch(`${process.env.VITE_SUPABASE_URL}/functions/v1/biblioteca-ocr-mistral`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ action: "worker" })
    });
    
    console.log("Worker acionado. Status:", res.status);
  }
}
run();
