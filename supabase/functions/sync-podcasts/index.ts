import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.1";

// ID da Playlist de Podcast (Se não fornecida no ENV, busca da TV Justiça)
// Vamos permitir que isso seja injetado via Variaveis de Ambiente do Supabase.
const DEFAULT_PLAYLIST_ID = 'PLippyY19Z47uVfUBc_DlZrQpnnqmnPkT0';

console.log("Hello from sync-podcasts!");

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY");
    const playlistId = Deno.env.get("TV_JUSTICA_PLAYLIST_ID") || DEFAULT_PLAYLIST_ID;

    if (!youtubeApiKey) {
      throw new Error("YOUTUBE_API_KEY não está configurada no Supabase Secrets.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Playlist Items from YouTube
    const ytResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${youtubeApiKey}`
    );

    if (!ytResponse.ok) {
      const err = await ytResponse.text();
      throw new Error(`Erro na API do YouTube: ${err}`);
    }

    const ytData = await ytResponse.json();
    const items = ytData.items || [];

    console.log(`Encontrados ${items.length} itens na playlist ${playlistId}.`);

    let insertedCount = 0;

    for (const item of items) {
      const snippet = item.snippet;
      const contentDetails = item.contentDetails;
      
      const videoId = contentDetails.videoId;
      const title = snippet.title;
      const description = snippet.description;
      // Pegar a melhor thumbnail disponível
      const thumbnails = snippet.thumbnails;
      const thumbnailUrl = thumbnails?.maxres?.url || thumbnails?.high?.url || thumbnails?.default?.url;
      const publishedAt = snippet.publishedAt;

      // Upsert no banco de dados
      const { error } = await supabase
        .from('tv_justica_podcasts')
        .upsert(
          {
            youtube_video_id: videoId,
            title,
            description,
            thumbnail_url: thumbnailUrl,
            published_at: publishedAt,
          },
          { onConflict: 'youtube_video_id' }
        );

      if (error) {
        console.error(`Erro ao salvar episódio ${videoId}:`, error);
      } else {
        insertedCount++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Sincronização concluída com sucesso.", 
        items_processed: insertedCount 
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Erro no sync-podcasts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});
