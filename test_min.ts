import "https://deno.land/std@0.192.0/dotenv/load.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
const supabase = createClient(Deno.env.get("VITE_SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
async function run() {
  const { data } = await supabase.from("stf_ministros").select("status").limit(5);
  console.log(data);
} run();
