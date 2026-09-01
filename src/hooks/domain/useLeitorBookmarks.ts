import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export type BookmarkEntry = {
  ocrPage: number;
  chapterTitulo: string;
  criadoEm: number;
};

export const LOCAL_KEY = (t: string, i: string) => `leitura-nativa:${t}:${i}`;

export function useLeitorBookmarks(livroTabela: string, livroId: string) {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY(livroTabela, livroId));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.bookmarks)) setBookmarks(parsed.bookmarks);
        else if (parsed.bookmark && typeof parsed.bookmarkIndex === 'number') {
          setBookmarks([{ ocrPage: parsed.bookmarkOcrPage ?? 0, chapterTitulo: 'Marcador', criadoEm: Date.now() }]);
        }
      } catch {}
    }
  }, [livroTabela, livroId]);

  const toggleBookmark = (ocrPage: number, chapterTitulo: string) => {
    setBookmarks((prev) => {
      const exists = prev.find((b) => b.ocrPage === ocrPage);
      if (exists) {
        toast.success('Marcador removido');
        return prev.filter((b) => b.ocrPage !== ocrPage);
      }
      toast.success('Página marcada');
      return [
        ...prev,
        { ocrPage, chapterTitulo, criadoEm: Date.now() },
      ].sort((a, b) => a.ocrPage - b.ocrPage);
    });
  };

  const removeBookmark = (ocrPage: number) => {
    setBookmarks((prev) => prev.filter((b) => b.ocrPage !== ocrPage));
  };

  return { bookmarks, toggleBookmark, removeBookmark };
}
