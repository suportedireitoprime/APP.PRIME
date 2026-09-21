import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // O administrador pode ir no dashboard do Supabase em Edge Functions -> Secrets
  // e adicionar as variáveis MIN_ANDROID_VERSION e MIN_IOS_VERSION
  const minAndroid = Deno.env.get("MIN_ANDROID_VERSION") || "1.0.0";
  const minIos = Deno.env.get("MIN_IOS_VERSION") || "1.0.0";

  return new Response(
    JSON.stringify({ 
      minAndroid, 
      minIos 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
