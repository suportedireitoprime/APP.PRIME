import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Since RLS allows select to everyone, to INSERT we need service_role or disable RLS for a bit.
// Wait, RLS for tv_justica_podcasts says: "Apenas a service_role pode inserir/atualizar".
// I will use SUPABASE_SERVICE_ROLE_KEY.
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const dummyPodcasts = [
    {
      youtube_video_id: 'xVzIGMwAWxM', // Some random valid YouTube video for test
      title: 'Supremo Cast - Entrevista Exclusiva',
      description: 'Neste episódio do Supremo Cast, conversamos sobre os desafios do judiciário contemporâneo.',
      thumbnail_url: 'https://img.youtube.com/vi/xVzIGMwAWxM/mqdefault.jpg',
      published_at: new Date().toISOString()
    },
    {
      youtube_video_id: 'V1bFr2SWP1I', 
      title: 'Podfalar Justiça - Entendendo a Repercussão Geral',
      description: 'Como funciona o mecanismo da Repercussão Geral no STF e o que muda na vida do cidadão.',
      thumbnail_url: 'https://img.youtube.com/vi/V1bFr2SWP1I/mqdefault.jpg',
      published_at: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  const { error } = await supabase.from('tv_justica_podcasts').upsert(dummyPodcasts);
  if (error) {
    console.error('Error seeding podcasts', error);
  } else {
    console.log('Successfully seeded 2 dummy podcasts!');
  }
}

main();
