import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";

async function run() {
  const key = Deno.env.get("BROWSERLESS_API_KEY");
  if (!key) {
    console.error("No BROWSERLESS_API_KEY");
    return;
  }
  
  const url = "https://www1.folha.uol.com.br/poder/stf/";
  console.log("Fetching", url);
  
  const resp = await fetch(`https://production-sfo.browserless.io/content?token=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, waitForTimeout: 10000 })
  });
  
  if (!resp.ok) {
    console.error("Error", resp.status, await resp.text());
    return;
  }
  
  const html = await resp.text();
  console.log("HTML Length:", html.length);
  Deno.writeTextFileSync("folha_sample.html", html);
  console.log("Saved to folha_sample.html");
}

run();
