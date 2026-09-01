const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const browserlessKey = process.env.BROWSERLESS_API_KEY;
const STF_PAUTAS_URL = 'https://portal.stf.jus.br/pautas/';

(async () => {
  console.log('Scraping pautas via Browserless...');
  const endpoint = `https://production-sfo.browserless.io/content?token=${browserlessKey}`;
  
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: STF_PAUTAS_URL,
      waitFor: 3000
    })
  });
  
  if (!res.ok) {
    console.error('Erro no Browserless:', await res.text());
    return;
  }
  
  const html = await res.text();
  fs.writeFileSync('browserless_stf_pautas.html', html);
  console.log('Salvo com sucesso em browserless_stf_pautas.html');
})();
