import "https://deno.land/std@0.192.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as fs from "node:fs";

const supabase = createClient(Deno.env.get("VITE_SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
async function run() {
  const { data } = await supabase.from("stf_ministros").select("id, nome, foto_url").eq("status", "vigente").order("nome");
  console.log(data?.length);
  // Just print the array string
  const arrayString = data?.map(m => `{ image: "${m.foto_url}", text: "${m.nome.split(" ").pop()}", fullName: "${m.nome}" }`).join(",\n    ");
  console.log(arrayString);
} run();
