import { createClient } from 'npm:@supabase/supabase-js';
import dotenv from 'npm:dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const playlistId = 'PLippyY19Z47uVfUBc_DlZrQpnnqmnPkT0';
  console.log(`Buscando ALL vídeos da playlist via web scraping (ytInitialData)...`);
  
  const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
  });
  const html = await res.text();
  
  const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
  if (!match) {
      console.log("ytInitialData not found");
      return;
  }
  
  try {
      const ytInitialData = JSON.parse(match[1]);
      
      const items = ytInitialData.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
      
      const insertData = [];
      
      for (const item of items) {
          if (item.playlistVideoRenderer) {
              const video = item.playlistVideoRenderer;
              const videoId = video.videoId;
              const title = video.title.runs[0].text;
              const thumbnail = video.thumbnail.thumbnails.pop().url;
              
              insertData.push({
                  youtube_video_id: videoId,
                  title: title,
                  description: '', // Descrição não vem completa no playlist view
                  thumbnail_url: thumbnail.split('?')[0],
                  published_at: new Date().toISOString() // Data não vem no playlist view
              });
          }
      }
      
      console.log(`Encontrados ${insertData.length} vídeos!`);
      
      console.log('Limpando tabela tv_justica_podcasts...');
      await supabase.from('tv_justica_podcasts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      let insertedCount = 0;
      for (let i = 0; i < insertData.length; i += 50) {
        const chunk = insertData.slice(i, i + 50);
        const { error } = await supabase.from('tv_justica_podcasts').upsert(chunk, { onConflict: 'youtube_video_id' });
        if (error) {
          console.error('Erro ao inserir chunk:', error);
        } else {
          insertedCount += chunk.length;
        }
      }
      
      console.log(`Sucesso! ${insertedCount} episódios inseridos.`);
      
  } catch(e) {
      console.error(e);
  }
}

main();
