import { memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUpRight, Share2, Copy, Star } from 'lucide-react';
import { toast } from 'sonner';
import { type BlogPost, TEMA_COLORS } from '@/data/blogPosts';
import BlogCoverImage from '@/components/BlogCoverImage';
import { blogThumb } from '@/lib/blogImg';
import { copiarTexto } from '@/lib/nativo/copiar';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface BlogPostCardProps {
  post: BlogPost;
  index: number;
  active: boolean;
  isDesktop: boolean;
  canUse: boolean;
  onOpen: (post: BlogPost) => void;
}

export const BlogPostCard = memo(function BlogPostCard({
  post,
  index,
  active,
  isDesktop,
  canUse,
  onOpen
}: BlogPostCardProps) {
  const c = TEMA_COLORS[post.tema] || { chip: '#666', chipText: '#fff' };
  
  const handleOpen = () => {
    onOpen(post);
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/blog?post=${post.id}` : '';

  const copyLink = async () => {
    try {
      await copiarTexto(shareUrl);
      toast.success('Link copiado');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const share = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: post.titulo, url: shareUrl });
      } catch {
        // dismissed
      }
    } else {
      copyLink();
    }
  };

  const favorite = () => {
    try {
      const key = 'blog:favorites';
      let list: string[] = [];
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) list = parsed;
        }
      } catch {
        /* ignore */
      }
      const cur = new Set<string>(list);
      if (cur.has(post.id)) {
        cur.delete(post.id);
        toast('Removido dos favoritos');
      } else {
        cur.add(post.id);
        toast.success('Adicionado aos favoritos');
      }
      localStorage.setItem(key, JSON.stringify([...cur]));
    } catch {
      toast.error('Erro ao favoritar');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate();
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${day} ${months[d.getMonth()]} · ${d.getFullYear()}`;
  };

  const cardNode = (
    <motion.div
      role="article"
      tabIndex={0}
      aria-label={`Ler artigo: ${post.titulo}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.35, ease: 'easeOut' }}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      style={{
        background: `linear-gradient(160deg, ${c.chip}22 0%, hsl(var(--card)) 45%, hsl(var(--card)) 100%)`,
      }}
      className={`group relative flex items-stretch gap-0 border-y md:border md:rounded-2xl transition-colors cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active ? 'border-primary ring-1 ring-primary/40' : 'border-border/40 hover:border-primary/40'
      }`}
    >
      <div className="w-28 sm:w-32 aspect-square shrink-0 relative overflow-hidden news-cover-shine bg-black/40">
        <BlogCoverImage
          postId={post.id}
          remoteUrl={blogThumb(post.imagem_url)}
          alt={post.titulo}
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading={index < 3 ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={index < 3 ? 'high' : 'auto'}
        />
        {/* Degradê à direita ligando ao card */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent to-card" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 p-4">
        <h3 className="font-display text-[15px] sm:text-base font-medium text-foreground leading-snug line-clamp-2 transition-colors">
          {post.titulo}
        </h3>
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-body text-muted-foreground">
          <span
            className="inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded"
            style={{ background: c.chip, color: c.chipText }}
          >
            {post.tema}
          </span>
          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.tempo_leitura_min} min · {formatDate(post.data_publicacao)}
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/60 ml-auto" />
        </div>
      </div>
    </motion.div>
  );

  if (!isDesktop) return cardNode;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{cardNode}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleOpen}>
          <ArrowUpRight className="w-4 h-4 mr-2" /> Abrir artigo
        </ContextMenuItem>
        <ContextMenuItem onClick={copyLink}>
          <Copy className="w-4 h-4 mr-2" /> Copiar link
        </ContextMenuItem>
        <ContextMenuItem onClick={share}>
          <Share2 className="w-4 h-4 mr-2" /> Compartilhar
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={favorite}>
          <Star className="w-4 h-4 mr-2" /> Favoritar
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});
