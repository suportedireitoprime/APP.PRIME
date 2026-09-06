import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpenText, Sparkles } from 'lucide-react';
import type { BlogPost } from '@/data/blogPosts';
import { BlogPostCard } from '@/components/vademecum/blog/BlogPostCard';
import BlogPostSheet from '@/components/vademecum/blog/BlogPostSheet';
import { LoadingState, EmptyState } from '@/components/ui/states';
import type { BlogFilter } from './blogTypes';

interface BlogFeedViewProps {
  isDesktop: boolean;
  selectedFilter: BlogFilter;
  visiblePosts: BlogPost[];
  posts: BlogPost[];
  blogLoaded: boolean;
  selectedPost: BlogPost | null;
  canUse: boolean;
  onOpenPost: (post: BlogPost) => void;
  onCloseSelectedPost: () => void;
}

export const BlogFeedView: React.FC<BlogFeedViewProps> = ({
  isDesktop,
  selectedFilter,
  visiblePosts,
  posts,
  blogLoaded,
  selectedPost,
  canUse,
  onOpenPost,
  onCloseSelectedPost,
}) => {
  return (
    <div
      className={
        isDesktop
          ? 'mx-auto w-full max-w-7xl px-6 py-4 pb-16 flex gap-6 items-start'
          : 'max-w-3xl mx-auto px-4 py-4 space-y-3 pb-40'
      }
    >
      <div
        className={
          isDesktop
            ? 'w-[420px] shrink-0 space-y-3 max-h-[calc(100dvh-260px)] overflow-y-auto pr-2 -mr-2'
            : 'w-full space-y-3'
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedFilter}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-3 -mx-4 md:mx-0"
          >
            {visiblePosts.map((post, i) => (
              <BlogPostCard
                key={post.id}
                post={post}
                index={i}
                active={isDesktop && selectedPost?.id === post.id}
                isDesktop={isDesktop}
                canUse={canUse}
                onOpen={onOpenPost}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {!blogLoaded && (
          <LoadingState
            variant="list"
            rows={4}
            label="Carregando artigos mais recentes"
            className="-mx-4 md:mx-0"
          />
        )}

        {blogLoaded && posts.length === 0 && (
          <EmptyState
            icon={BookOpenText}
            title="Nenhum artigo encontrado"
            description="Ainda não há artigos publicados neste tema. Volte em breve."
          />
        )}
      </div>

      {isDesktop && (
        <div className="flex-1 min-w-0 sticky top-[220px] h-[calc(100dvh-260px)]">
          {selectedPost ? (
            <BlogPostSheet
              inline
              post={selectedPost}
              onClose={onCloseSelectedPost}
            />
          ) : (
            <div className="h-full w-full rounded-2xl border border-dashed border-border/60 bg-card/30 flex flex-col items-center justify-center text-center px-8">
              <Sparkles className="w-8 h-8 text-primary/70 mb-3" />
              <h3 className="font-display text-lg text-foreground mb-1">Selecione um artigo</h3>
              <p className="font-body text-sm text-muted-foreground max-w-sm">
                Escolha um post da lista à esquerda para ler aqui, sem sair da página.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
