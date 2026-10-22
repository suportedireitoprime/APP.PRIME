import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Clock, Bookmark, ArrowRight, Trash2 } from 'lucide-react';
import type { BlogPost } from '@/data/blogPosts';
import { TEMA_COLORS } from '@/data/blogPosts';
import BlogCoverImage from '@/components/BlogCoverImage';
import { blogThumb } from '@/lib/blogImg';
import { haptic } from '@/lib/nativeHaptics';

interface BlogFavoritesSheetProps {
  open: boolean;
  onClose: () => void;
  favoritePosts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  onRemoveFavorite: (postId: string) => void;
}

export const BlogFavoritesSheet: React.FC<BlogFavoritesSheetProps> = ({
  open,
  onClose,
  favoritePosts,
  onSelectPost,
  onRemoveFavorite,
}) => {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop */}
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

        {/* Sheet inferior */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-zinc-950 border-t border-zinc-800 rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl z-10 overflow-hidden"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-zinc-700/60" />
          </div>

          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-zinc-800/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-950/40">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-white tracking-wide flex items-center gap-2">
                  MEUS FAVORITOS
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {favoritePosts.length}
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 font-body">
                  Artigos salvos para leitura rápida
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              aria-label="Fechar favoritos"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {favoritePosts.length === 0 ? (
              <div className="py-16 text-center space-y-3 px-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                  <Bookmark className="w-7 h-7" />
                </div>
                <h3 className="font-display font-semibold text-zinc-200 text-base">
                  Nenhum artigo favoritado
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Toque no ícone de favorito em qualquer artigo do blog para salvá-lo e acessá-lo rapidamente por aqui.
                </p>
              </div>
            ) : (
              favoritePosts.map((post) => {
                const c = TEMA_COLORS[post.tema] || { chip: '#444', chipText: '#fff' };

                return (
                  <div
                    key={post.id}
                    className="group flex items-center gap-3.5 p-2.5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700/80 transition-all cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div
                      onClick={() => {
                        haptic.impact();
                        onSelectPost(post);
                        onClose();
                      }}
                      className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-zinc-900 border border-zinc-800"
                    >
                      <BlogCoverImage
                        postId={post.id}
                        remoteUrl={blogThumb(post.imagem_url, 160)}
                        alt={post.titulo}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Texto */}
                    <div
                      onClick={() => {
                        haptic.impact();
                        onSelectPost(post);
                        onClose();
                      }}
                      className="flex-1 min-w-0"
                    >
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider inline-block mb-1"
                        style={{ backgroundColor: `${c.chip}25`, color: c.chip }}
                      >
                        {post.tema}
                      </span>
                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug font-display">
                        {post.titulo}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{post.tempo_leitura_min} min de leitura</span>
                      </div>
                    </div>

                    {/* Botão de Remover Favorito */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic.selection();
                        onRemoveFavorite(post.id);
                      }}
                      className="p-2 text-zinc-500 hover:text-rose-400 transition-colors shrink-0"
                      aria-label="Remover dos favoritos"
                      title="Remover dos favoritos"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default BlogFavoritesSheet;
