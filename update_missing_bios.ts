import "https://deno.land/std@0.192.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const supabase = createClient(
  Deno.env.get("VITE_SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

async function run() {
  const { data: missing, error } = await supabase
    .from("stf_ministros")
    .select("id, nome")
    .ilike("biografia", "%Aguardando%");

  if (error) { console.error(error); return; }
  if (!missing) return;
  console.log("Found:", missing.length);
  for (const min of missing) {
    let nomeWiki = min.nome.replace(/ /g, "_");
    // handle specific cases if needed
    try {
      const res = await fetch(`https://pt.wikipedia.org/api/rest_v1/page/summary/${nomeWiki}`);
      if (res.ok) {
        const json = await res.json();
        const extract = json.extract;
        if (extract) {
          console.log(`Update ${min.nome} -> OK`);
          await supabase
            .from("stf_ministros")
            .update({ biografia: extract })
            .eq("id", min.id);
        }
      } else {
        console.log(`Failed for ${min.nome}`);
      }
    } catch (e) {
      console.log(`Error for ${min.nome}: ${e.message}`);
    }
  }
}
run();
