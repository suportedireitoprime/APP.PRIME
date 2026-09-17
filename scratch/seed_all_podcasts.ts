import { createClient } from 'npm:@supabase/supabase-js';
import dotenv from 'npm:dotenv';
import ytpl from 'npm:ytpl';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const playlistId = 'PLippyY19Z47uVfUBc_DlZrQpnnqmnPkT0';
  console.log(`Buscando ALL vídeos da playlist ${playlistId} via ytpl...`);
  
  try {
    const playlist = await ytpl(playlistId, { limit: Infinity });
    console.log(`Encontrados ${playlist.items.length} vídeos no ytpl!`);

    console.log('Limpando tabela tv_justica_podcasts...');
    await supabase.from('tv_justica_podcasts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const insertData = playlist.items.map((item: any) => ({
      youtube_video_id: item.id,
      title: item.title,
      description: item.description || '',
      thumbnail_url: item.bestThumbnail?.url || `https://img.youtube.com/vi/${item.id}/maxresdefault.jpg`,
      published_at: item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString()
    }));

    // Inserir em chunks de 50
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
    console.error('Failed', e);
  }
}

main();
