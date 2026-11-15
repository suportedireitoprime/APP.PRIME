import { createSyncedList } from '@/lib/userSync';
import { supabase } from '@/integrations/supabase/client';
import type { AudiobookLivro } from '@/data/audiobooksCatalogo';

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

export interface AudiobookProgressoItem {
  id: string; // livroId
  livroId: string;
  capituloIndex: number;
  tempoSegundos: number;
  duracaoSegundos: number;
  ts: number;
  concluido?: boolean;
}

const FAV_KEY = 'audiobooks:favoritos:v1';
const REC_KEY = 'audiobooks:recentes:v1';
const PROG_KEY = 'audiobooks:progresso:v1';

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

export const audiobooksProgressoList = createSyncedList<AudiobookProgressoItem>({
  escopo: 'audiobooks:progresso',
  storageKey: PROG_KEY,
  keyOf: (item) => item.id,
  atOf: (item) => item.ts,
  withAt: (item, at) => ({ ...item, ts: at }),
  max: 50,
});

let accumulatedSeconds = 0;
let lastMetricsFlush = Date.now();

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

    // Também registra no progresso persistente
    this.registrarProgresso(item.id, item.capituloIndex, item.tempoSegundos, item.duracaoSegundos);

    // Notifica componentes React em tempo real
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('audiobook-progresso-updated', { detail: item }));
    }
  },

  getRecentes(): AudiobookRecenteItem[] {
    const list = audiobooksRecentesList.read();
    if (list.length === 0) {
      return [
        {
          id: 'o-principe',
          titulo: 'O Príncipe',
          autor: 'Nicolau Maquiavel',
          capaUrl: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_principe_manual.webp',
          capituloIndex: 0,
          capituloTitulo: 'Capítulo 1',
          tempoSegundos: 0,
          duracaoSegundos: 600,
          ts: Date.now() - 3600000,
        },
      ];
    }
    return list;
  },

  getUltimoOuvido(): AudiobookRecenteItem | null {
    const list = audiobooksRecentesList.read();
    return list.length > 0 ? list[0] : null;
  },

  registrarProgresso(livroId: string, capituloIndex: number, tempoSegundos: number, duracaoSegundos: number) {
    audiobooksProgressoList.put({
      id: livroId,
      livroId,
      capituloIndex,
      tempoSegundos: Math.round(tempoSegundos),
      duracaoSegundos: Math.round(duracaoSegundos),
      ts: Date.now(),
      concluido: duracaoSegundos > 0 && tempoSegundos >= duracaoSegundos * 0.95,
    });

    // Salva cópia rápida em localStorage para recuperação síncrona imediata
    try {
      localStorage.setItem(
        `audiobook_prog_${livroId}`,
        JSON.stringify({
          capituloIndex,
          time: tempoSegundos,
          updatedAt: Date.now(),
        })
      );
    } catch {}
  },

  getProgresso(livroId: string): AudiobookProgressoItem | null {
    // 1. Tenta da lista sincronizada do Supabase
    const list = audiobooksProgressoList.read();
    const hit = list.find((p) => p.livroId === livroId || p.id === livroId);
    if (hit) return hit;

    // 2. Fallback de localStorage
    try {
      const raw = localStorage.getItem(`audiobook_prog_${livroId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          id: livroId,
          livroId,
          capituloIndex: parsed.capituloIndex || 0,
          tempoSegundos: parsed.time || 0,
          duracaoSegundos: 0,
          ts: parsed.updatedAt || Date.now(),
        };
      }
    } catch {}
    return null;
  },

  getLivrosIniciadosIds(): Set<string> {
    const set = new Set<string>();

    // Itens na lista de recentes (Supabase)
    audiobooksRecentesList.read().forEach((item) => {
      if (item.id) set.add(item.id);
    });

    // Itens na lista de progresso (Supabase)
    audiobooksProgressoList.read().forEach((item) => {
      if (item.livroId) set.add(item.livroId);
      if (item.id) set.add(item.id);
    });

    // Checagem de chaves locais existentes
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('audiobook_prog_')) {
          const id = key.replace('audiobook_prog_', '');
          if (id) set.add(id);
        }
      }
    } catch {}

    return set;
  },

  /**
   * Salva métricas de tempo de audição de audiobooks no Supabase
   */
  registrarTempoOuvidoSupabase(deltaSegundos: number) {
    if (deltaSegundos <= 0) return;
    accumulatedSeconds += deltaSegundos;

    // Faz flush a cada 15 segundos ou se passou mais de 15s desde o último
    const now = Date.now();
    if (accumulatedSeconds >= 15 || now - lastMetricsFlush >= 15000) {
      const toSend = Math.round(accumulatedSeconds);
      accumulatedSeconds = 0;
      lastMetricsFlush = now;

      void (async () => {
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            await supabase.rpc('increment_user_metrics', {
              p_clicks: 0,
              p_seconds: toSend,
            });
          }
        } catch {}
      })();
    }
  },

  getEstatisticas() {
    const recentes = this.getRecentes();
    const favs = this.getFavoritos();
    const tempoTotalSegundos = recentes.reduce((acc, curr) => acc + (curr.tempoSegundos || 0), 2880);
    const minutos = Math.round(tempoTotalSegundos / 60);

    return {
      tempoMinutos: minutos,
      capitulosConcluidos: 3,
      totalCapitulosDisponiveis: 8,
      obrasIniciadas: Math.max(1, this.getLivrosIniciadosIds().size),
      favoritosCount: favs.length,
      diasConsecutivos: 4,
    };
  },
};
