import { createClient } from 'npm:@supabase/supabase-js';
import dotenv from 'npm:dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const playlistId = 'PLippyY19Z47uVfUBc_DlZrQpnnqmnPkT0';
  
  const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
  });
  const html = await res.text();
  
  // Extract all video IDs using regex
  const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
  const matches = [...html.matchAll(regex)];
  let videoIds = matches.map(m => m[1]);
  
  // Also extract titles and thumbnails using regex if possible, or just build them
  // A naive approach: find "title":{"runs":[{"text":"TITLE"}]} near the videoId
  
  const insertData = [];
  
  // Remove duplicates
  videoIds = [...new Set(videoIds)];
  
  for (const id of videoIds) {
      // Find title in HTML roughly
      const titleRegex = new RegExp(`"videoId":"${id}".*?"title":\\{"runs":\\[\\{"text":"(.*?)"\\}\\]\\}`, 's');
      const titleMatch = html.match(titleRegex);
      const title = titleMatch ? titleMatch[1] : `Video ${id}`;
      
      insertData.push({
          youtube_video_id: id,
          title: title.replace(/\\u0026/g, '&').replace(/\\"/g, '"'),
          description: '', 
          thumbnail_url: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
          published_at: new Date().toISOString()
      });
  }

  console.log(`Encontrados ${insertData.length} videos na regex`);

  if (insertData.length > 0) {
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
  }
}

main();
