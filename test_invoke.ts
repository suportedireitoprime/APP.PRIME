import "https://deno.land/std@0.192.0/dotenv/load.ts";
async function run() {
  const url = "https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/extract-stf-date";
  const res = await fetch(url, {
    method: "POST",
    headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
    },
    body: JSON.stringify({ pdf_url: "http://www.stf.jus.br/arquivo/biblioteca/PastasMinistros/AndreMendonca/DadosDatas/001.pdf" })
  });
  console.log(res.status, await res.text());
} run();
