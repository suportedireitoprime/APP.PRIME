const https = require('https');

const data = JSON.stringify({
  codigo_nome: "CP_CODIGO_PENAL",
  artigo_numero: 8,
  artigo_texto: "",
  force_regenerate: "SHOW_MODELS"
});

const options = {
  hostname: 'dnjrgpldcwcpoywamorr.supabase.co',
  port: 443,
  path: '/functions/v1/laboratorio-gerar-cena',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0'
  }
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      if (parsed.models) {
        console.log("Modelos suportados:", parsed.models.map(m => m.name).join(', '));
      } else {
        console.log("Output:", body);
      }
    } catch(e) {
      console.log("Raw output:", body);
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
