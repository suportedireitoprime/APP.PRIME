import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.1";

const STF_CHANNEL_ID = "UCcX36Z_48N1-X4Dtd2sP20Q"; // ID oficial do @STF_oficial
const KEYWORDS = ["plenário", "plenario", "extraordinária", "extraordinaria", "audiência pública", "audiencia publica"];

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");

    if (!youtubeApiKey) {
      throw new Error("YOUTUBE_API_KEY não está configurada no Supabase Secrets.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let allStreams = [];

    // Busca nas três categorias: upcoming, live, completed
    const eventTypes = ["upcoming", "live", "completed"];

    for (const type of eventTypes) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${STF_CHANNEL_ID}&eventType=${type}&type=video&maxResults=25&order=date&key=${youtubeApiKey}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.text();
        console.error(`Erro ao buscar streams do tipo ${type}:`, err);
        continue;
      }
      
      const data = await res.json();
      if (!data.items) continue;

      for (const item of data.items) {
        const titleLower = item.snippet.title.toLowerCase();
        
        // Verifica se contém alguma das palavras-chave
        const hasKeyword = KEYWORDS.some(keyword => titleLower.includes(keyword));
        
        if (hasKeyword) {
          allStreams.push({
            youtube_video_id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            status: type,
            // Na API de Search não vem os horários exatos de scheduling, mas vem o publishedAt (que pode servir de base)
            // Para obter horários precisos precisaríamos chamar a API de videos?id=...
            published_at_fallback: item.snippet.publishedAt
          });
        }
      }
    }

    if (allStreams.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum stream encontrado." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Como precisamos do horário exato (scheduledStartTime) para ordenar corretamente, faremos uma chamada para `videos` API para os vídeos filtrados
    const videoIds = allStreams.map(s => s.youtube_video_id).join(',');
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoIds}&key=${youtubeApiKey}`;
    
    const videosRes = await fetch(videosUrl);
    let videoDetailsMap = new Map();
    if (videosRes.ok) {
        const vData = await videosRes.json();
        for (const v of vData.items || []) {
            videoDetailsMap.set(v.id, v.liveStreamingDetails);
        }
    }

    const insertData = allStreams.map(stream => {
      const details = videoDetailsMap.get(stream.youtube_video_id);
      return {
        youtube_video_id: stream.youtube_video_id,
        title: stream.title,
        description: stream.description,
        thumbnail_url: stream.thumbnail_url,
        status: stream.status,
        scheduled_start_time: details?.scheduledStartTime || stream.published_at_fallback,
        actual_start_time: details?.actualStartTime || null
      };
    });

    const { error } = await supabase
      .from('stf_live_sessions')
      .upsert(insertData, { onConflict: 'youtube_video_id' });

    if (error) {
      throw new Error(`Erro ao salvar no banco: ${error.message}`);
    }

    return new Response(JSON.stringify({ message: `Sincronizados ${insertData.length} streams com sucesso.`, items: insertData.length }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
