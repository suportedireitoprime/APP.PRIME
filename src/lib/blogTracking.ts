import { createSyncedList } from '@/lib/userSync';
import type { BlogPost } from '@/data/blogPosts';

export interface BlogFavItem {
  id: string;
  titulo: string;
  autor: string;
  imagemUrl: string;
  tema: string;
  tempoLeituraMin: number;
  ts: number;
}

export interface BlogRecenteItem {
  id: string;
  titulo: string;
  autor: string;
  imagemUrl: string;
  tema: string;
  tempoLeituraMin: number;
  ts: number;
}

export interface BlogStats {
  totalLidos: number;
  minutosTotais: number;
  temaFavorito: string;
  streakDias: number;
}

const FAV_KEY = 'blog:favorites:v2';
const REC_KEY = 'blog:recentes:v2';

export const blogFavList = createSyncedList<BlogFavItem>({
  escopo: 'blog:favoritos',
  storageKey: FAV_KEY,
  keyOf: (item) => item.id,
  atOf: (item) => item.ts,
  withAt: (item, at) => ({ ...item, ts: at }),
  max: 50,
});

export const blogRecentesList = createSyncedList<BlogRecenteItem>({
  escopo: 'blog:recentes',
  storageKey: REC_KEY,
  keyOf: (item) => item.id,
  atOf: (item) => item.ts,
  withAt: (item, at) => ({ ...item, ts: at }),
  max: 30,
});

export const blogTracking = {
  isFavorito(id: string): boolean {
    return blogFavList.read().some((item) => item.id === id);
  },

  toggleFavorito(post: BlogPost): boolean {
    const exists = this.isFavorito(post.id);
    if (exists) {
      blogFavList.remove(post.id);
      // Mantém compatibilidade com localStorage antigo
      this._syncLegacyStorage();
      window.dispatchEvent(new Event('blog:favorites-updated'));
      return false;
    } else {
      blogFavList.put({
        id: post.id,
        titulo: post.titulo,
        autor: post.autor,
        imagemUrl: post.imagem_url,
        tema: post.tema,
        tempoLeituraMin: post.tempo_leitura_min || 5,
        ts: Date.now(),
      });
      this._syncLegacyStorage();
      window.dispatchEvent(new Event('blog:favorites-updated'));
      return true;
    }
  },

  getFavoritos(): BlogFavItem[] {
    return blogFavList.read();
  },

  registrarLeitura(post: BlogPost): void {
    blogRecentesList.put({
      id: post.id,
      titulo: post.titulo,
      autor: post.autor,
      imagemUrl: post.imagem_url,
      tema: post.tema,
      tempoLeituraMin: post.tempo_leitura_min || 5,
      ts: Date.now(),
    });
    window.dispatchEvent(new Event('blog:recentes-updated'));
  },

  getRecentes(): BlogRecenteItem[] {
    return blogRecentesList.read();
  },

  getUltimoLido(): BlogRecenteItem | null {
    const recs = blogRecentesList.read();
    return recs.length > 0 ? recs[0] : null;
  },

  getEstatisticas(totalArtigosCatalogo: number = 250): BlogStats {
    const recentes = blogRecentesList.read();
    const totalLidos = recentes.length;
    const minutosTotais = recentes.reduce((acc, r) => acc + (r.tempoLeituraMin || 5), 0);

    // Identifica o tema mais lido
    const temaCounts: Record<string, number> = {};
    recentes.forEach((r) => {
      if (r.tema) temaCounts[r.tema] = (temaCounts[r.tema] || 0) + 1;
    });

    let temaFavorito = 'Geral';
    let maxCount = 0;
    Object.entries(temaCounts).forEach(([tema, count]) => {
      if (count > maxCount) {
        maxCount = count;
        temaFavorito = tema;
      }
    });

    return {
      totalLidos,
      minutosTotais,
      temaFavorito,
      streakDias: totalLidos > 0 ? Math.min(totalLidos, 7) : 1,
    };
  },

  _syncLegacyStorage(): void {
    try {
      const ids = blogFavList.read().map((f) => f.id);
      localStorage.setItem('blog:favorites', JSON.stringify(ids));
    } catch {
      /* ignore */
    }
  },
};
