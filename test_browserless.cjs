const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const browserlessKey = "0c1d61b71e8e0502a8b24665bf79a99f38d950ecf49992765cbfcfe8fde3db9f";
const STF_PAUTAS_URL = 'https://portal.stf.jus.br/ostf/ministros/ministro.asp?periodo=STF&consulta=ALFABETICA';

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
