import { createClient } from 'npm:@supabase/supabase-js';
import dotenv from 'npm:dotenv';
import fs from 'node:fs';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function extractVideos(obj: any, results: any[] = []) {
  if (Array.isArray(obj)) {
    obj.forEach(item => extractVideos(item, results));
  } else if (obj !== null && typeof obj === 'object') {
    if (obj.playlistVideoRenderer) {
      results.push(obj.playlistVideoRenderer);
    } else {
      for (const key in obj) {
        extractVideos(obj[key], results);
      }
    }
  }
  return results;
}

async function main() {
  const data = JSON.parse(fs.readFileSync('scratch/yt_data.json', 'utf8'));
  const videos = extractVideos(data);
  
  console.log(`Found ${videos.length} videos`);
  
  const insertData = [];
  
  for (const video of videos) {
    // Only parse if it's playable (has length/thumbnails)
    if (video.thumbnail && video.thumbnail.thumbnails && video.thumbnail.thumbnails.length > 0) {
      const videoId = video.videoId;
      const title = video.title?.runs?.[0]?.text;
      if (!title) continue;
      
      const thumbnail = video.thumbnail.thumbnails[video.thumbnail.thumbnails.length - 1].url.split('?')[0];
      
      // We don't get exact date from playlist UI, use a default fallback
      insertData.push({
          youtube_video_id: videoId,
          title: title,
          description: '', 
          thumbnail_url: thumbnail,
          published_at: new Date().toISOString()
      });
    }
  }

  // Deduplicate
  const uniqueVideos = Array.from(new Map(insertData.map(v => [v.youtube_video_id, v])).values());
  console.log(`Unique playable videos: ${uniqueVideos.length}`);

  if (uniqueVideos.length === 0) return;

  console.log('Clearing old podcasts...');
  await supabase.from('tv_justica_podcasts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  let insertedCount = 0;
  for (let i = 0; i < uniqueVideos.length; i += 50) {
    const chunk = uniqueVideos.slice(i, i + 50);
    const { error } = await supabase.from('tv_justica_podcasts').upsert(chunk, { onConflict: 'youtube_video_id' });
    if (error) {
      console.error('Error inserting chunk:', error);
    } else {
      insertedCount += chunk.length;
    }
  }
  
  console.log(`Successfully inserted ${insertedCount} episodes.`);
}

main();
