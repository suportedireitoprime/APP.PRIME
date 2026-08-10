const jwt = process.env.SUPABASE_ANON_KEY;

async function run() {
  const body = {
    tipo: 'questoes',
    videoId: 'zI_kiwJ2S2Y',
    titulo: 'O Papel do INTÉRPRETE no Direito',
    tabela: 'videoaulas_iniciante',
    area: 'Iniciantes'
  };

  const res = await fetch('https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/videoaula-acao-ia', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + jwt,
    },
    body: JSON.stringify(body)
  });
  
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Body:', text);
}
run();
