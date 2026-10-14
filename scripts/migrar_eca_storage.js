const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';
const url = 'https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/migrar-eca-storage';

async function migrarTudo() {
  console.log('Iniciando migracao dos audios do ECA (Google Drive -> Supabase Storage)...');
  let totalMigrados = 0;
  let rodada = 1;

  while (true) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + anonKey
        },
        body: JSON.stringify({ limit: 10 })
      });
      const data = await res.json();
      if (!data.ok) {
        console.error('Erro na resposta:', data);
        break;
      }
      totalMigrados += (data.migrados_nesta_rodada || 0);
      console.log('Lote ' + rodada + ' | Migrados: ' + data.migrados_nesta_rodada + ' | Restantes: ' + data.restantes_estimados + ' | Total migrado: ' + totalMigrados);
      
      if (data.migrados_nesta_rodada === 0 || data.restantes_estimados <= 0) {
        console.log('--- TODOS OS AUDIOS DO ECA FORAM SALVOS NO STORAGE DO SUPABASE COM SUCESSO! ---');
        break;
      }
      rodada++;
    } catch (e) {
      console.error('Falha de rede/execucao:', e);
      break;
    }
  }
}

migrarTudo();
