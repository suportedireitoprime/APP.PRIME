import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!YOUTUBE_API_KEY) {
      return new Response(JSON.stringify({ error: 'YOUTUBE_API_KEY não configurada no servidor' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Canais oficiais (STF, Senado, Câmara)
    const canais = [
      { id: 'stf', handle: '@STF_oficial' },
      { id: 'senado', handle: '@tvsenado' },
      { id: 'camara', handle: '@camaradosdeputadosoficial' }
    ];

    // Passo 1: Obter os IDs dos canais de forma paralela
    const canaisPromises = canais.map(async (c) => {
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(c.handle)}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(channelUrl);
      const data = await res.json();
      return { ...c, channelId: data.items?.[0]?.id };
    });

    const canaisComId = await Promise.all(canaisPromises);

    // Passo 2: Buscar live stream para cada canal
    const livePromises = canaisComId.map(async (c) => {
      if (!c.channelId) return null;
      const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${c.channelId}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(liveUrl);
      const data = await res.json();
      const liveId = data.items?.[0]?.id?.videoId;
      if (!liveId) return null;

      const snippet = data.items[0].snippet;
      return {
        id: c.id, 
        video: {
          id: liveId,
          title: snippet.title,
          description: snippet.description || '',
          channelTitle: snippet.channelTitle || '',
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
          publishedAt: snippet.publishedAt,
        }
      };
    });

    const liveResults = (await Promise.all(livePromises)).filter(Boolean);

    return new Response(JSON.stringify({ aoVivo: liveResults }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Erro no youtube-aovivo:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
