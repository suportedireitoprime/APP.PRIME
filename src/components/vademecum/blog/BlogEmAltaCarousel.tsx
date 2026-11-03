import React, { useState } from 'react';
import type { BlogPost } from '@/data/blogPosts';
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
    <section className="w-full space-y-3.5">
      {/* Cabeçalho da Seção: Somente "EM ALTA", sem TOP 20, botão "Ver todos" sem ícone */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-red-600 shrink-0" />
          <h2 className="font-sans text-white text-base sm:text-lg font-bold uppercase tracking-wider">
            EM ALTA
          </h2>
        </div>

        {/* Botão Ver todos: Fundo translúcido sem ícones internos */}
        <button
          type="button"
          onClick={() => {
            haptic.impact();
            setSheetOpen(true);
          }}
          className="text-xs font-semibold text-zinc-200 hover:text-white bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/25 transition-all py-1.5 px-3.5 rounded-full active:scale-95 shadow-sm cursor-pointer select-none"
          aria-label="Ver todos os artigos em alta"
        >
          Ver todos
        </button>
      </div>

      {/* Carrossel Horizontal: Títulos DENTRO da capa sobre o degradê, sem abreviação, sem descrição */}
      <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
        {posts.slice(0, 20).map((post, index) => {
          return (
            <div
              key={post.id}
              onClick={() => {
                haptic.impact();
                onRegisterClick(post.id);
                onSelectPost(post);
              }}
              className="snap-start shrink-0 w-[155px] sm:w-[175px] h-[215px] sm:h-[235px] rounded-2xl overflow-hidden relative group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform active:scale-95 transition-all duration-200 border border-white/10 hover:border-red-500/50 shadow-md hover:shadow-xl bg-zinc-950 flex flex-col justify-end p-3.5"
            >
              {/* Imagem de Fundo Completa do Card */}
              <BlogCoverImage
                postId={post.id}
                remoteUrl={blogThumb(post.imagem_url, 360)}
                alt={post.titulo}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading={index < 4 ? 'eager' : 'lazy'}
              />

              {/* Degradê escuro sobre a imagem: suave no topo e denso na base */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

              {/* Título DENTRO da capa, sobre o degradê, em texto integral sem abreviação e sem descrição */}
              <h3 className="relative z-10 font-sans font-bold text-xs sm:text-[13px] text-white leading-snug drop-shadow-md group-hover:text-red-300 transition-colors">
                {post.titulo}
              </h3>
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
