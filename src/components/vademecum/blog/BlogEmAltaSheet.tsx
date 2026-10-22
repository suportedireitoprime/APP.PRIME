import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Clock, Eye, Trophy, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@/data/blogPosts';
import { TEMA_COLORS } from '@/data/blogPosts';
import BlogCoverImage from '@/components/BlogCoverImage';
import { blogThumb } from '@/lib/blogImg';
import { haptic } from '@/lib/nativeHaptics';

interface BlogEmAltaSheetProps {
  open: boolean;
  onClose: () => void;
  posts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  getViewCount: (postId: string) => number;
}

export const BlogEmAltaSheet: React.FC<BlogEmAltaSheetProps> = ({
  open,
  onClose,
  posts,
  onSelectPost,
  getViewCount,
}) => {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop escuro com blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            haptic.selection();
            onClose();
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Painel que sobe de baixo para cima */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl z-10 overflow-hidden"
        >
          {/* Puxador táctil */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-zinc-700/60" />
          </div>

          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-zinc-800/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-950/40">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-white tracking-wide flex items-center gap-2">
                  EM ALTA
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    TOP 20
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-body">
                  Os artigos jurídicos mais lidos e recomendados
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista com scroll suave */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-zinc-900/60">
            {posts.map((post, index) => {
              const rank = index + 1;
              const views = getViewCount(post.id);
              const c = TEMA_COLORS[post.tema] || { chip: '#444', chipText: '#fff' };

              // Destaques de ranking
              const isTop1 = rank === 1;
              const isTop2 = rank === 2;
              const isTop3 = rank === 3;

              return (
                <div
                  key={post.id}
                  onClick={() => {
                    haptic.impact();
                    onSelectPost(post);
                    onClose();
                  }}
                  className="pt-2.5 first:pt-0 group flex items-center gap-3.5 p-2 rounded-2xl hover:bg-zinc-900/70 border border-transparent hover:border-zinc-800/80 transition-all cursor-pointer"
                >
                  {/* Badge de Ranking */}
                  <div className="w-8 shrink-0 flex flex-col items-center justify-center">
                    {isTop1 ? (
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-bold text-xs shadow-sm">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                    ) : isTop2 ? (
                      <div className="w-7 h-7 rounded-full bg-slate-400/20 border border-slate-300/50 flex items-center justify-center text-slate-200 font-bold text-xs">
                        2
                      </div>
                    ) : isTop3 ? (
                      <div className="w-7 h-7 rounded-full bg-amber-700/20 border border-amber-600/50 flex items-center justify-center text-amber-500 font-bold text-xs">
                        3
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-zinc-500">
                        #{rank}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail da Capa */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-zinc-900 border border-zinc-800">
                    <BlogCoverImage
                      postId={post.id}
                      remoteUrl={blogThumb(post.imagem_url, 160)}
                      alt={post.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Conteúdo do Artigo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                        style={{ backgroundColor: `${c.chip}25`, color: c.chip }}
                      >
                        {post.tema}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-red-400 transition-colors line-clamp-2 leading-snug font-display">
                      {post.titulo}
                    </h3>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400 font-body">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {post.tempo_leitura_min} min
                      </span>
                      <span className="flex items-center gap-1 text-amber-400/90 font-medium">
                        <Eye className="w-3 h-3" />
                        {views > 1000 ? `${(views / 1000).toFixed(1)}k` : views} leituras
                      </span>
                    </div>
                  </div>

                  {/* Ícone de Ação */}
                  <div className="shrink-0 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default BlogEmAltaSheet;
