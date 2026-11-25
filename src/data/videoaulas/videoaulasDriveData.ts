import catalogoIniciantesRaw from './catalogoIniciantesMeta.json';
import catalogoAreasRaw from './catalogoAreasMeta.json';

export interface QuestaoVideoaula {
  numero: number;
  timestamp: number;
  timestamp_formatado: string;
  enunciado: string;
  opcoes: string[];
  correta: string;
  correta_indice: number;
  explicacao: string;
}

export interface FlashcardVideoaula {
  frente: string;
  verso: string;
}

export interface VideoaulaDriveItem {
  id: string;
  categoria: 'iniciantes' | 'areas';
  numero: number;
  nomePasta: string;
  slug: string;
  titulo: string;
  video_id: string;
  canal: string;
  duracao: string;
  duracao_seg: number;
  link: string;
  thumb: string;
  questoes?: QuestaoVideoaula[];
  flashcards?: FlashcardVideoaula[];
  transcricao?: string;
  mapaMentalUrl?: string;
  resumoCompletoUrl?: string;
  resumoCornellUrl?: string;
  srtUrl?: string;
}

export const VIDEOAULAS_INICIANTES: VideoaulaDriveItem[] = catalogoIniciantesRaw as VideoaulaDriveItem[];
export const VIDEOAULAS_AREAS: VideoaulaDriveItem[] = catalogoAreasRaw as VideoaulaDriveItem[];

// Mapa para busca em O(1) dos metadados leves
const videoMap = new Map<string, VideoaulaDriveItem>();
[...VIDEOAULAS_INICIANTES, ...VIDEOAULAS_AREAS].forEach((item) => {
  if (item.video_id) {
    videoMap.set(item.video_id, item);
  }
});

const detailCache = new Map<string, VideoaulaDriveItem>();

export function findVideoaulaByVideoId(videoId?: string | null): VideoaulaDriveItem | undefined {
  if (!videoId) return undefined;
  return detailCache.get(videoId) || videoMap.get(videoId);
}

export function isDriveVideoaula(videoId?: string | null): boolean {
  if (!videoId) return false;
  return videoMap.has(videoId);
}

/** Carrega sob demanda transcrição, questões, flashcards e mapas mentais da videoaula selecionada */
export async function loadVideoaulaDriveDetail(videoId?: string | null): Promise<VideoaulaDriveItem | undefined> {
  if (!videoId) return undefined;
  const cached = detailCache.get(videoId);
  if (cached) return cached;
  if (!videoMap.has(videoId)) return undefined;

  try {
    const res = await fetch(`/data/videoaulas/${encodeURIComponent(videoId)}.json`);
    if (res.ok) {
      const full = (await res.json()) as VideoaulaDriveItem;
      detailCache.set(videoId, full);
      return full;
    }
  } catch {
    /* fallback retorna metadados */
  }
  return videoMap.get(videoId);
}
