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
    <section className="w-full space-y-3">
      {/* Cabeçalho da Seção Idêntico ao Audiobooks (Recomendações / Em Alta) */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-red-600 shrink-0" />
            <h3 className="font-sans text-white text-[15px] sm:text-[16px] font-bold flex items-center gap-2 uppercase tracking-wider">
              <span>RECOMENDAÇÕES & EM ALTA</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                TOP 20
              </span>
            </h3>
          </div>
          <p className="text-white/60 text-[11.5px] sm:text-[12px] leading-snug ml-3 truncate mt-0.5">
            Artigos fundamentais e mais recomendados para a sua formação
          </p>
        </div>

        {/* Botão Ver Todos com Fundo Translúcido e Ícone Vazado */}
        <button
          onClick={() => {
            haptic.impact();
            setSheetOpen(true);
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/25 transition-all py-1.5 px-3.5 rounded-full active:scale-95 shadow-sm group cursor-pointer shrink-0"
          aria-label="Ver todos os artigos em alta"
        >
          <Flame className="w-3.5 h-3.5 text-red-500 fill-none stroke-[2.2]" />
          <span>Ver todos</span>
          <ChevronRight className="w-3.5 h-3.5 text-red-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Carrossel Horizontal com Snap e Deslize Rápido Idêntico ao Audiobooks */}
      <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
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
              className="snap-start shrink-0 w-[140px] sm:w-[155px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform active:scale-95 transition-transform duration-150"
            >
              {/* Capa com Proporção Vertical de Destaque */}
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 group-hover:border-red-500/50 transition-all shadow-md group-hover:shadow-red-950/40">
                <BlogCoverImage
                  postId={post.id}
                  remoteUrl={blogThumb(post.imagem_url, 320)}
                  alt={post.titulo}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading={index < 4 ? 'eager' : 'lazy'}
                />

                {/* Gradiente escuro sobre a imagem para contraste */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                {/* Badge de Ranking no topo esquerdo */}
                <div className="absolute top-2 left-2 z-10">
                  {isTop1 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-500 text-black shadow-lg shadow-amber-500/40">
                      <Trophy className="w-2.5 h-2.5 fill-black" />
                      #1
                    </span>
                  ) : isTop2 ? (
                    <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-300 text-slate-900 shadow-md">
                      #2
                    </span>
                  ) : isTop3 ? (
                    <span className="inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-700 text-amber-100 shadow-md">
                      #3
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-zinc-300 border border-white/10">
                      #{rank}
                    </span>
                  )}
                </div>

                {/* Badge de Tema no topo direito */}
                <div className="absolute top-2 right-2 z-10">
                  <span
                    className="text-[8.5px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-md"
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

              {/* Título e Autor do Card */}
              <p className="font-sans font-bold text-xs sm:text-[13px] text-white group-hover:text-red-300 transition-colors line-clamp-2 mt-2 leading-snug">
                {post.titulo}
              </p>
              <p className="text-[10.5px] text-white/50 truncate mt-0.5">
                {post.autor}
              </p>
            </div>
          );
        })}
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
