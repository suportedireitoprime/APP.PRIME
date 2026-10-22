import React, { useState } from 'react';
import { Flame, Clock, Eye, ChevronRight, Trophy } from 'lucide-react';
import type { BlogPost } from '@/data/blogPosts';
import { TEMA_COLORS } from '@/data/blogPosts';
import BlogCoverImage from '@/components/BlogCoverImage';
import { blogThumb } from '@/lib/blogImg';
import { haptic } from '@/lib/nativeHaptics';
import BlogEmAltaSheet from './BlogEmAltaSheet';

interface BlogEmAltaCarouselProps {
  posts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  getViewCount: (postId: string) => number;
  onRegisterClick: (postId: string) => void;
}

export const BlogEmAltaCarousel: React.FC<BlogEmAltaCarouselProps> = ({
  posts,
  onSelectPost,
  getViewCount,
  onRegisterClick,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="w-full pt-4 pb-2">
      {/* Cabeçalho da Seção com Título e Botão Ver Todos */}
      <div className="flex items-center justify-between px-4 mb-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-red-500/20">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold font-display uppercase tracking-widest text-foreground">
              EM ALTA
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
              TOP 20
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            haptic.impact();
            setSheetOpen(true);
          }}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1 px-2.5 rounded-full hover:bg-primary/10 active:scale-95"
          aria-label="Ver todos os artigos em alta"
        >
          <span>Ver todos</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Carrossel Horizontal com Snap e Deslize Infinito/Fluido */}
      <div className="w-full overflow-x-auto no-scrollbar scroll-smooth px-4 pb-2">
        <div className="flex gap-3.5 w-max">
          {posts.slice(0, 20).map((post, index) => {
            const rank = index + 1;
            const views = getViewCount(post.id);
            const c = TEMA_COLORS[post.tema] || { chip: '#444', chipText: '#fff' };

            const isTop1 = rank === 1;
            const isTop2 = rank === 2;
            const isTop3 = rank === 3;

            return (
              <div
                key={post.id}
                onClick={() => {
                  haptic.impact();
                  onRegisterClick(post.id);
                  onSelectPost(post);
                }}
                className="group relative w-[170px] sm:w-[195px] flex-shrink-0 flex flex-col rounded-2xl overflow-hidden bg-card/80 border border-border/60 hover:border-primary/50 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer select-none"
              >
                {/* Capa com Proporção Vertical de Destaque */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-zinc-950">
                  <BlogCoverImage
                    postId={post.id}
                    remoteUrl={blogThumb(post.imagem_url, 320)}
                    alt={post.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading={index < 4 ? 'eager' : 'lazy'}
                  />

                  {/* Gradiente escuro sobre a imagem para contraste */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                  {/* Badge de Ranking no topo esquerdo */}
                  <div className="absolute top-2 left-2 z-10">
                    {isTop1 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-amber-500 text-black shadow-lg shadow-amber-500/40">
                        <Trophy className="w-3 h-3 fill-black" />
                        #1
                      </span>
                    ) : isTop2 ? (
                      <span className="inline-flex items-center text-[11px] font-black px-2 py-0.5 rounded-lg bg-slate-300 text-slate-900 shadow-md">
                        #2
                      </span>
                    ) : isTop3 ? (
                      <span className="inline-flex items-center text-[11px] font-black px-2 py-0.5 rounded-lg bg-amber-700 text-amber-100 shadow-md">
                        #3
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10">
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Badge de Tema no topo direito */}
                  <div className="absolute top-2 right-2 z-10">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md"
                      style={{
                        backgroundColor: `${c.chip}dd`,
                        color: c.chipText,
                      }}
                    >
                      {post.tema}
                    </span>
                  </div>

                  {/* Métrica de Leituras sobre a base da capa */}
                  <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between text-[11px] text-white/90">
                    <span className="flex items-center gap-1 font-semibold text-amber-300 drop-shadow">
                      <Eye className="w-3 h-3" />
                      {views > 1000 ? `${(views / 1000).toFixed(1)}k` : views}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-300 text-[10px]">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {post.tempo_leitura_min}m
                    </span>
                  </div>
                </div>

                {/* Título e Rodapé do Card */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
                  <h3 className="font-display text-xs sm:text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {post.titulo}
                  </h3>
                  <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground border-t border-border/30">
                    <span className="truncate">{post.autor}</span>
                    <span className="text-primary font-bold">Ler →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sheet "Ver Todos" de baixo para cima */}
      <BlogEmAltaSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        posts={posts}
        onSelectPost={onSelectPost}
        getViewCount={getViewCount}
      />
    </section>
  );
};
export default BlogEmAltaCarousel;
