import { supabase } from '@/integrations/supabase/client';

/**
 * Serviço para integração com a API do YouTube

 * 
 * NOTA: Para funcionar na prática com playlists e vídeos "Ao Vivo" de forma
 * confiável, é necessário obter uma YouTube Data API v3 Key no Google Cloud
 * Console e adicioná-la ao seu .env como VITE_YOUTUBE_API_KEY.
 */

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

export interface YoutubeVideo {
  id: string;
  title: string;
  description?: string;
  channelTitle?: string;
  thumbnail: string;
  publishedAt: string;
}

export interface YoutubePlaylist {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  itemCount: number;
}

export interface CanalData {
  aoVivo: YoutubeVideo | null;
  ultimosVideos: YoutubeVideo[];
  playlists: YoutubePlaylist[];
}

export async function fetchCanalData(channelHandle: string): Promise<CanalData> {
  try {
    let handle = channelHandle;
    if (handle === 'camara') handle = '@camaradosdeputadosoficial';
    else if (handle === 'senado') handle = '@tvsenado';
    else if (handle === 'stf') handle = '@STF_oficial';
    
    const { data, error } = await supabase.functions.invoke('youtube-canal', {
      body: { handle }
    });

    if (error || !data || data.error) {
      console.warn("⚠️ Erro ou fallback ao invocar Edge Function youtube-canal:", error || data?.error);
      return mockFetchCanalData(channelHandle);
    }

    return {
      aoVivo: data.aoVivo,
      ultimosVideos: data.ultimosVideos,
      playlists: data.playlists,
    };
  } catch (error) {
    console.error("Erro fatal ao invocar Edge Function youtube-canal:", error);
    return mockFetchCanalData(channelHandle);
  }
}

export async function fetchAoVivo(): Promise<{ id: string; video: YoutubeVideo }[]> {
  try {
    const { data, error } = await supabase.functions.invoke('youtube-aovivo');
    
    if (error || !data || data.error) {
      console.warn("⚠️ Erro ou fallback ao invocar Edge Function youtube-aovivo:", error || data?.error);
      return [];
    }

    return data.aoVivo || [];
  } catch (error) {
    console.error("Erro fatal ao invocar Edge Function youtube-aovivo:", error);
    return [];
  }
}

async function mockFetchCanalData(handle: string): Promise<CanalData> {
  // Simula um delay de rede
  await new Promise(r => setTimeout(r, 800));

  let nome = "Câmara dos Deputados";
  if (handle.includes('stf')) nome = "STF";
  if (handle.includes('senado')) nome = "Senado Federal";

  return {
    aoVivo: {
      id: 'live123',
      title: `Sessão Plenária - ${nome}`,
      thumbnail: 'https://i.ytimg.com/vi/placeholder/mqdefault.jpg',
      publishedAt: new Date().toISOString(),
    },
    ultimosVideos: [
      {
        id: 'vid1',
        title: `Audiência Pública sobre Reforma Tributária - ${nome}`,
        thumbnail: 'https://i.ytimg.com/vi/placeholder/mqdefault.jpg',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'vid2',
        title: `Votação do Projeto de Lei Nº 123/2025 - ${nome}`,
        thumbnail: 'https://i.ytimg.com/vi/placeholder/mqdefault.jpg',
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: 'vid3',
        title: `Sessão Solene de Abertura - ${nome}`,
        thumbnail: 'https://i.ytimg.com/vi/placeholder/mqdefault.jpg',
        publishedAt: new Date(Date.now() - 259200000).toISOString(),
      }
    ],
    playlists: [
      {
        id: 'pl1',
        title: `Comissões Parlamentares - ${nome}`,
        description: 'Transmissões das reuniões e comissões',
        thumbnail: 'https://i.ytimg.com/vi/placeholder/mqdefault.jpg',
        itemCount: 42
      },
      {
        id: 'pl2',
        title: `Sessões Plenárias 2026 - ${nome}`,
        description: 'Sessões plenárias ocorridas durante 2026',
        thumbnail: 'https://i.ytimg.com/vi/placeholder/mqdefault.jpg',
        itemCount: 156
      }
    ]
  };
}
