const API_TOKEN = "eac2ea7b-ec8f-4ed3-8e42-cb95d852a466";

async function fetchHtml(url: string) {
  const response = await fetch(`https://production-sfo.browserless.io/content?token=${API_TOKEN}`, {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      waitFor: 3000, // wait for 3s
    })
  });
  
  const html = await response.text();
  console.log(html.substring(0, 500));
  return html;
}

async function test() {
  const indexHtml = await fetchHtml("https://portal.stf.jus.br/ostf/ministros/ministro.asp?periodo=STF&consulta=ALFABETICA");
  await Deno.writeTextFile("index_stf.html", indexHtml);
  console.log("Salvo index_stf.html");
}

test();
