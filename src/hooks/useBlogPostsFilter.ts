import { useMemo } from 'react';
import { BLOG_POSTS, type BlogPost, type BlogTema } from '@/data/blogPosts';

type BlogFilter = 'trending' | 'todos' | BlogTema;
type BloggerTab = 'blogger' | 'categorias' | 'carreiras' | 'favoritos' | 'biografia';

export function useBlogPostsFilter(
  dbPosts: BlogPost[],
  selectedFilter: BlogFilter,
  bottomTab: BloggerTab,
  trendingIds: string[] | null,
  blogLoaded: boolean
) {
  // Concatena cache local e db
  const allPosts = useMemo(() => {
    const byId = new Map<string, BlogPost>();
    [...dbPosts, ...BLOG_POSTS].forEach((p) => byId.set(p.id, p));
    return Array.from(byId.values());
  }, [dbPosts]);

  // Aplica filtros, ordenação e contexto da Tab inferior
  const posts = useMemo(() => {
    const byDate = [...allPosts].sort(
      (a, b) => new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime(),
    );
    let base = byDate;

    if (bottomTab === 'favoritos') {
      try {
        const cur = new Set<string>(JSON.parse(localStorage.getItem('blog:favorites') || '[]'));
        base = base.filter((p) => cur.has(p.id));
      } catch { 
        // ignore 
      }
    } else if (bottomTab === 'biografia') {
      base = []; // A aba de biografia tem sua própria view.
    } else if (bottomTab === 'carreiras') {
      base = base.filter((p) => p.tema === 'Carreiras Jurídicas');
    } else if (selectedFilter === 'trending') {
      if (!trendingIds || trendingIds.length === 0) return byDate; 
      const map = new Map(allPosts.map((p) => [p.id, p]));
      const ordered = trendingIds.map((id) => map.get(id)).filter(Boolean) as BlogPost[];
      const seen = new Set(ordered.map((p) => p.id));
      byDate.forEach((p) => { if (!seen.has(p.id)) ordered.push(p); });
      base = ordered;
    } else if (selectedFilter !== 'todos') {
      base = base.filter((p) => p.tema === selectedFilter);
    }
    
    return base;
  }, [allPosts, selectedFilter, trendingIds, bottomTab]);

  const visiblePosts = useMemo(() => (blogLoaded ? posts : []), [blogLoaded, posts]);

  return { allPosts, posts, visiblePosts };
}
