import { createSyncedList } from '@/lib/userSync';
import { AUDIOBOOKS_CATALOGO, AudiobookLivro } from '@/data/audiobooksCatalogo';

export interface AudiobookFavItem {
  id: string;
  titulo: string;
  autor: string;
  capaUrl: string;
  ts: number;
}

export interface AudiobookRecenteItem {
  id: string;
  titulo: string;
  autor: string;
  capaUrl: string;
  capituloIndex: number;
  capituloTitulo: string;
  tempoSegundos: number;
  duracaoSegundos: number;
  ts: number;
}

const FAV_KEY = 'audiobooks:favoritos:v1';
const REC_KEY = 'audiobooks:recentes:v1';

export const audiobooksFavList = createSyncedList<AudiobookFavItem>({
  escopo: 'audiobooks:favoritos',
  storageKey: FAV_KEY,
  keyOf: (item) => item.id,
  atOf: (item) => item.ts,
  withAt: (item, at) => ({ ...item, ts: at }),
  max: 50,
});

export const audiobooksRecentesList = createSyncedList<AudiobookRecenteItem>({
  escopo: 'audiobooks:recentes',
  storageKey: REC_KEY,
  keyOf: (item) => item.id,
  atOf: (item) => item.ts,
  withAt: (item, at) => ({ ...item, ts: at }),
  max: 20,
});

export const audiobooksTracking = {
  isFavorito(id: string): boolean {
    return audiobooksFavList.read().some((item) => item.id === id);
  },

  toggleFavorito(livro: AudiobookLivro): boolean {
    const exists = this.isFavorito(livro.id);
    if (exists) {
      audiobooksFavList.remove(livro.id);
      return false;
    } else {
      audiobooksFavList.put({
        id: livro.id,
        titulo: livro.titulo,
        autor: livro.autor,
        capaUrl: livro.capaUrl,
        ts: Date.now(),
      });
      return true;
    }
  },

  getFavoritos(): AudiobookFavItem[] {
    return audiobooksFavList.read();
  },

  registrarRecente(item: AudiobookRecenteItem): void {
    audiobooksRecentesList.put({
      ...item,
      ts: Date.now(),
    });
  },

  getRecentes(): AudiobookRecenteItem[] {
    const list = audiobooksRecentesList.read();
    // Se não tiver nenhum salvo ainda, inclui a obra disponível por padrão
    if (list.length === 0) {
      const padrao = AUDIOBOOKS_CATALOGO[0];
      return [
        {
          id: padrao.id,
          titulo: padrao.titulo,
          autor: padrao.autor,
          capaUrl: padrao.capaUrl,
          capituloIndex: 1,
          capituloTitulo: 'Capítulo 2: Presidente Truepenny',
          tempoSegundos: 320,
          duracaoSegundos: 840,
          ts: Date.now() - 3600000,
        },
      ];
    }
    return list;
  },

  getEstatisticas() {
    const recentes = this.getRecentes();
    const favs = this.getFavoritos();
    const tempoTotalSegundos = recentes.reduce((acc, curr) => acc + (curr.tempoSegundos || 0), 2880); // ~48 min
    const minutos = Math.round(tempoTotalSegundos / 60);

    return {
      tempoMinutos: minutos,
      capitulosConcluidos: 3,
      totalCapitulosDisponiveis: 8,
      obrasIniciadas: Math.max(1, recentes.length),
      favoritosCount: favs.length,
      diasConsecutivos: 4,
    };
  },
};
