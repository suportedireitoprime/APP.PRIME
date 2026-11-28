/**
 * Cache stale-while-revalidate dos posts do blog em localStorage.
 * — 1ª visita: fetch normal, popula cache.
 * — Visitas seguintes (24 h): hidrata sincronamente e revalida em background.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BlogPost } from "@/data/blogPosts";
import { bundle } from "@/services/offlineBundle";
import { mapRawBlogPosts, type RawPost } from "@/lib/blog/blogCoverGenerator";
import { readCacheJson, writeCacheJson, removeCacheKey } from "@/lib/cacheStorage";

const KEY = "blog:posts:v18";
const LEGACY_KEYS = [
  "blog:posts:v1",
  "blog:posts:v2",
  "blog:posts:v3",
  "blog:posts:v4",
  "blog:posts:v5",
  "blog:posts:v6",
  "blog:posts:v7",
  "blog:posts:v8",
  "blog:posts:v9",
  "blog:posts:v10",
  "blog:posts:v11",
  "blog:posts:v12",
  "blog:posts:v13",
  "blog:posts:v14",
  "blog:posts:v15",
  "blog:posts:v16",
  "blog:posts:v17",
];

const LISTA_COLS =
  "id, titulo, resumo, imagem_url, categoria, autor, tempo_leitura_min, data_publicacao, created_at";

type Cached = { at: number; posts: BlogPost[] };

function readCache(): BlogPost[] | null {
  const parsed = readCacheJson<Cached>(KEY);
  if (!parsed?.posts || !Array.isArray(parsed.posts)) return null;
  return parsed.posts;
}

function writeCache(posts: BlogPost[]) {
  const leves = posts.map((p) => ({ ...p, conteudo_md: "" }));
  writeCacheJson(KEY, { at: Date.now(), posts: leves } satisfies Cached);
  LEGACY_KEYS.forEach((k) => removeCacheKey(k));
}

export function useBlogPostsCache() {
  const initial = useMemo(() => readCache(), []);
  const [posts, setPosts] = useState<BlogPost[]>(initial ?? []);
  const [loaded, setLoaded] = useState<boolean>(!!initial);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let rows: RawPost[] | null = null;
      try {
        const { data } = await supabase
          .from("blog_edicao_posts")
          .select(LISTA_COLS)
          .eq("publicado", true)
          .order("data_publicacao", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(800);
        rows = (data as RawPost[]) ?? null;
      } catch {}

      if (!rows || rows.length === 0) {
        const bundled = await bundle.blogPosts<RawPost>();
        if (bundled.length > 0) rows = bundled;
      }
      if (cancelled) return;
      if (rows && rows.length > 0) {
        const mapped = mapRawBlogPosts(rows);
        setPosts(mapped);
        writeCache(mapped);
      }
      setLoaded(true);

      const ids = (rows || []).map((r) => r.id).slice(0, 20);
      if (!ids.length) return;
      try {
        const { data: full } = await supabase
          .from("blog_edicao_posts")
          .select("id, conteudo_md")
          .in("id", ids);
        if (cancelled || !full) return;
        const byId = new Map(
          (full as Array<{ id: string; conteudo_md: string }>).map((r) => [r.id, r.conteudo_md]),
        );
        setPosts((prev) =>
          prev.map((p) =>
            byId.has(p.id) ? { ...p, conteudo_md: byId.get(p.id) || p.conteudo_md } : p,
          ),
        );
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { posts, loaded };
}
