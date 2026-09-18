import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { handle } = await req.json();

    if (!handle) {
      return new Response(JSON.stringify({ error: 'O parâmetro "handle" é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    
    if (!YOUTUBE_API_KEY) {
      return new Response(JSON.stringify({ error: 'YOUTUBE_API_KEY não configurada no servidor' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const channelHandle = handle.startsWith('@') ? handle : `@${handle}`;
    
    // 1. Obter channelId
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,contentDetails&forHandle=${encodeURIComponent(channelHandle)}&key=${YOUTUBE_API_KEY}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json();

    if (!channelData.items || channelData.items.length === 0) {
      return new Response(JSON.stringify({ error: `Canal não encontrado para: ${channelHandle}` }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const channelId = channelData.items[0].id;
    const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;

    // 2. Buscar live stream atual
    const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
    const liveRes = await fetch(liveUrl);
    const liveData = await liveRes.json();

    let aoVivo = null;
    if (liveData.items && liveData.items.length > 0) {
      const liveItem = liveData.items[0];
      aoVivo = {
        id: liveItem.id.videoId,
        title: liveItem.snippet.title,
        description: liveItem.snippet.description || '',
        thumbnail: liveItem.snippet.thumbnails?.high?.url || liveItem.snippet.thumbnails?.default?.url,
        publishedAt: liveItem.snippet.publishedAt,
      };
    }

    // 3. Buscar últimos vídeos (Apenas transmissões ao vivo passadas)
    let ultimosVideos = [];
    const pastLivesUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=completed&type=video&order=date&maxResults=10&key=${YOUTUBE_API_KEY}`;
    const pastLivesRes = await fetch(pastLivesUrl);
    const pastLivesData = await pastLivesRes.json();

    if (pastLivesData.items) {
      ultimosVideos = pastLivesData.items
        .filter((item: any) => !aoVivo || item.id.videoId !== aoVivo.id)
        .slice(0, 5)
        .map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description || '',
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          publishedAt: item.snippet.publishedAt,
        }));
    }

    // 4. Buscar playlists do canal
    let playlists = [];
    const playlistsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=5&key=${YOUTUBE_API_KEY}`;
    const playlistsRes = await fetch(playlistsUrl);
    const playlistsData = await playlistsRes.json();

    if (playlistsData.items) {
      playlists = playlistsData.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
        itemCount: item.contentDetails?.itemCount || 0,
      }));
    }

    const payload = {
      aoVivo,
      ultimosVideos,
      playlists,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error("Erro no youtube-canal:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
