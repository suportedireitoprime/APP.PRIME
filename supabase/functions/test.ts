import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const { data, error } = await supabase.storage.from("audios").download("resumos-livros/pilulas-classicos-66-1738221805908.mp3");
console.log(error);
