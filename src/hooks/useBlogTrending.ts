import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const TRENDING_CACHE_KEY = 'blog_trending_v1';
const TRENDING_CACHE_TTL_MS = 5 * 60 * 1000;

export function useBlogTrending(selectedFilter: string) {
  const [trendingIds, setTrendingIds] = useState<string[] | null>(null);

  useEffect(() => {
    if (selectedFilter !== 'trending' || trendingIds !== null) return;
    
    let cancelled = false;
    
    try {
      const raw = sessionStorage.getItem(TRENDING_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { at: number; ids: string[] };
        if (Date.now() - parsed.at < TRENDING_CACHE_TTL_MS) {
          setTrendingIds(parsed.ids);
          return;
        }
      }
    } catch {
      // Ignora erro de JSON parse
    }

    supabase
      .rpc('blog_posts_trending', { _limit: 50, _dias: 14 })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) { 
          setTrendingIds([]); 
          return; 
        }
        
        const ids = (data as Array<{ post_id: string }>).map((r) => r.post_id);
        setTrendingIds(ids);
        
        try { 
          sessionStorage.setItem(TRENDING_CACHE_KEY, JSON.stringify({ at: Date.now(), ids })); 
        } catch {
          // Ignora erro no setItem (limite de quota)
        }
      })
      .catch(() => {
        if (!cancelled) setTrendingIds([]);
      });

    return () => { 
      cancelled = true; 
    };
  }, [selectedFilter, trendingIds]);

  return { trendingIds };
}
