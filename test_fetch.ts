async function test() {
  const res = await fetch("https://portal.stf.jus.br/ostf/ministros/verMinistro.asp?periodo=STF&id=33", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
  });
  const html = await res.text();
  await Deno.writeTextFile("ver_ministro_33.html", html);
  console.log("Saved ver_ministro_33.html");
}

test();
