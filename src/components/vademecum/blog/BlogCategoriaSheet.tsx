import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Layers } from 'lucide-react';
import type { BlogPost, BlogTema } from '@/data/blogPosts';
import { TEMA_COLORS } from '@/data/blogPosts';
import { BlogPostCard } from './BlogPostCard';
import { haptic } from '@/lib/nativeHaptics';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface BlogCategoriaSheetProps {
  open: boolean;
  onClose: () => void;
  categoria: BlogTema | string | null;
  posts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  canUse: boolean;
  isDesktop: boolean;
}

export const BlogCategoriaSheet = memo(function BlogCategoriaSheet({
  open,
  onClose,
  categoria,
  posts,
  onSelectPost,
  canUse,
  isDesktop,
}: BlogCategoriaSheetProps) {
  useBodyScrollLock(open);
  useEscapeKey(open, onClose);

  if (!open || !categoria) return null;

  const colorConfig = categoria && typeof categoria === 'string' && TEMA_COLORS[categoria as BlogTema]
    ? TEMA_COLORS[categoria as BlogTema]
    : { chip: '#e11d48', chipText: '#ffffff' };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* Painel Fullscreen que sobe de baixo para cima até em cima */}
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Artigos da categoria ${categoria}`}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden"
        >
          {/* Top Bar com Botão de Voltar do lado esquerdo no Padrão Ouro */}
          <header className="shrink-0 flex items-center justify-between px-4 py-3 sm:py-3.5 border-b border-border/40 bg-background/95 backdrop-blur-md pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] z-10">
            <div className="flex items-center gap-3 min-w-0">
              {/* Botão de voltar padrão premium: w-12 h-12 / ArrowLeft w-6 h-6 strokeWidth={2.4} */}
              <button
                type="button"
                onClick={() => {
                  try {
                    haptic.selection();
                  } catch {
                    // ignore
                  }
                  onClose();
                }}
                className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-secondary/80 hover:bg-secondary active:scale-95 transition-all text-foreground shrink-0 shadow-sm border border-border/30"
                aria-label="Voltar para todas as categorias"
              >
                <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
              </button>

              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold font-display uppercase tracking-widest text-foreground truncate">
                  {categoria}
                </h1>
                <p className="text-xs text-muted-foreground font-body truncate">
                  {posts.length} {posts.length === 1 ? 'artigo disponível' : 'artigos disponíveis'}
                </p>
              </div>
            </div>

            {/* Badge da Categoria */}
            <div className="shrink-0 pl-2">
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs border border-white/10"
                style={{
                  backgroundColor: `${colorConfig.chip}25`,
                  color: colorConfig.chip,
                }}
              >
                {posts.length} {posts.length === 1 ? 'Artigo' : 'Artigos'}
              </span>
            </div>
          </header>

          {/* Conteúdo com os Artigos da Categoria */}
          <main className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl w-full mx-auto space-y-3 pb-[calc(4rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-secondary/60 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Nenhum artigo encontrado</h3>
                <p className="text-sm max-w-xs">
                  Os artigos desta categoria estão sendo preparados pela nossa redação.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post, idx) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    index={idx}
                    active={false}
                    isDesktop={isDesktop}
                    canUse={canUse}
                    onOpen={onSelectPost}
                  />
                ))}
              </div>
            )}
          </main>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

export default BlogCategoriaSheet;
