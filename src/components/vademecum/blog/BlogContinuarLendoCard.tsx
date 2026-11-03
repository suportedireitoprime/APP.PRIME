import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import type { BlogPost } from '@/data/blogPosts';
import BlogCoverImage from '@/components/BlogCoverImage';
import { blogThumb } from '@/lib/blogImg';

interface BlogContinuarLendoCardProps {
  post: BlogPost;
  onOpen: (post: BlogPost) => void;
}

export const BlogContinuarLendoCard: React.FC<BlogContinuarLendoCardProps> = ({
  post,
  onOpen,
}) => {
  const handleClick = () => {
    haptic.impact();
    onOpen(post);
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      style={{
        background: 'linear-gradient(to right, rgba(200, 16, 46, 0.22), rgba(200, 16, 46, 0.06))',
        borderColor: 'rgba(239, 68, 68, 0.35)',
      }}
      className="w-full flex items-center gap-3.5 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl border text-left active:scale-[0.98] transition-all overflow-hidden relative shadow-lg group cursor-pointer"
    >
      {/* Capa do Artigo à esquerda (idêntica à capa do Audiobook) */}
      <div className="w-12 h-16 sm:w-14 sm:h-18 rounded-xl overflow-hidden border border-white/20 bg-black shrink-0 relative shadow-md group-hover:scale-105 transition-transform">
        <BlogCoverImage
          postId={post.id}
          remoteUrl={blogThumb(post.imagem_url, 320)}
          alt={post.titulo}
          className="w-full h-full object-cover"
        />
        <span className="absolute bottom-0 inset-x-0 bg-red-600 text-[8px] font-black uppercase text-center text-white py-0.5 tracking-wider">
          LEITURA
        </span>
      </div>

      {/* Textos informativos centrais */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-1.5 mb-0.5">
          <BookOpen className="w-2.5 h-2.5 fill-red-400 text-red-400" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-300">
            CONTINUAR LENDO
          </p>
        </div>

        <p className="font-serif italic text-[15px] sm:text-[16px] font-semibold tracking-tight text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug">
          {post.titulo}
        </p>

        <p className="text-[11px] font-semibold truncate flex items-center gap-1.5 text-red-200/80 mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400 shrink-0" />
          <span>
            {post.tema} • {post.tempo_leitura_min || 5} min de leitura · Toque para ler
          </span>
        </p>
      </div>

      {/* Seta indicativa à direita */}
      <ArrowRight
        className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 z-10 text-red-400 group-hover:translate-x-1 transition-transform"
        strokeWidth={2.4}
      />

      {/* Decoração de fundo — Ícone translúcido com glow vermelho no canto direito */}
      <div
        className="absolute -right-3 -bottom-3 pointer-events-none select-none z-0 overflow-visible flex items-center justify-center opacity-20"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 10px rgba(220, 38, 38, 0.4))',
        }}
      >
        <BookOpen className="w-24 h-24 text-red-500" strokeWidth={1.2} />
      </div>
    </motion.button>
  );
};

export default memo(BlogContinuarLendoCard);
