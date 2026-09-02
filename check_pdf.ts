const res = await fetch('https://portal.stf.jus.br/ostf/ministros/verMinistro.asp?periodo=STF&id=50', { headers: { 'User-Agent': 'Mozilla/5.0' } });
const html = await res.text();
console.log(html.match(/href=[\"']([^\"']*\.pdf)[\"']/ig));
