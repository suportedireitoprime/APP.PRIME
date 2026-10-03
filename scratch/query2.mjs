import { createClient } from "@supabase/supabase-js";
const s = createClient("https://dnjrgpldcwcpoywamorr.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0");
async function run() {
  const {data: lei} = await s.from("vade_mecum_leis").select("*").ilike("nome", "%Idoso%").limit(1);
  if(lei && lei[0]) {
    const {data: art} = await s.from("vade_mecum_artigos").select("numero, texto").eq("lei_id", lei[0].id).order("ordem", {ascending:true}).limit(5);
    console.log("Lei:", lei[0].slug, "Url:", lei[0].planalto_url);
    console.log("Arts:", art);
  }
}
run();
