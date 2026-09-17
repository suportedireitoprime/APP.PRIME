import { createClient } from 'npm:@supabase/supabase-js';
import dotenv from 'npm:dotenv';
import { XMLParser } from 'npm:fast-xml-parser';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const playlistId = 'PLippyY19Z47uVfUBc_DlZrQpnnqmnPkT0';
  console.log(`Buscando RSS feed da playlist ${playlistId}...`);
  
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`);
  if (!res.ok) {
    throw new Error(`Erro ao buscar RSS: ${res.statusText}`);
  }
  
  const xmlText = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_"
  });
  const data = parser.parse(xmlText);
  
  const entries = data.feed?.entry || [];
  // entries can be a single object if there's only 1 item, but typically an array
  const items = Array.isArray(entries) ? entries : [entries];
  
  console.log(`Encontrados ${items.length} vídeos.`);
  
  // Limpar a tabela antes de inserir os novos para apagar os dummies
  console.log('Limpando tabela tv_justica_podcasts...');
  const { error: deleteError } = await supabase.from('tv_justica_podcasts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (deleteError) {
     console.error('Erro ao limpar tabela:', deleteError);
  }
  
  const insertData = items.map((item: any) => {
    return {
      youtube_video_id: item['yt:videoId'],
      title: item.title,
      description: item['media:group']?.['media:description'] || '',
      thumbnail_url: item['media:group']?.['media:thumbnail']?.['@_url'] || `https://img.youtube.com/vi/${item['yt:videoId']}/maxresdefault.jpg`,
      published_at: item.published
    };
  });
  
  if (insertData.length > 0) {
    const { error } = await supabase.from('tv_justica_podcasts').upsert(insertData, { onConflict: 'youtube_video_id' });
    if (error) {
      console.error('Erro ao inserir podcasts:', error);
    } else {
      console.log(`Sucesso! ${insertData.length} episódios inseridos.`);
    }
  } else {
     console.log('Nenhum episódio para inserir.');
  }
}

main();
