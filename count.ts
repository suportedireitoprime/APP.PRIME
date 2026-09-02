import "https://deno.land/std@0.192.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const supabase = createClient(
  Deno.env.get("VITE_SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

async function run() {
  const { data } = await supabase
    .from("stf_ministros")
    .select("nome")
    .not("dados_e_datas", "is", null);

  console.log(`Ministros COM linha do tempo: ${data?.length}`);
  
  const { data: all } = await supabase.from("stf_ministros").select("nome");
  console.log(`Total de Ministros: ${all?.length}`);
}
run();
