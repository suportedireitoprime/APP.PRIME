import catalogoIniciantesRaw from './catalogoIniciantes.json';
import catalogoAreasRaw from './catalogoAreas.json';

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
  questoes: QuestaoVideoaula[];
  flashcards: FlashcardVideoaula[];
  transcricao: string;
  mapaMentalUrl: string;
  resumoCompletoUrl: string;
  resumoCornellUrl: string;
  srtUrl: string;
}

export const VIDEOAULAS_INICIANTES: VideoaulaDriveItem[] = catalogoIniciantesRaw as VideoaulaDriveItem[];
export const VIDEOAULAS_AREAS: VideoaulaDriveItem[] = catalogoAreasRaw as VideoaulaDriveItem[];

// Mapa para busca em O(1)
const videoMap = new Map<string, VideoaulaDriveItem>();
[...VIDEOAULAS_INICIANTES, ...VIDEOAULAS_AREAS].forEach((item) => {
  if (item.video_id) {
    videoMap.set(item.video_id, item);
  }
});

export function findVideoaulaByVideoId(videoId?: string | null): VideoaulaDriveItem | undefined {
  if (!videoId) return undefined;
  return videoMap.get(videoId);
}

export function isDriveVideoaula(videoId?: string | null): boolean {
  if (!videoId) return false;
  return videoMap.has(videoId);
}
