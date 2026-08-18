import { memo } from 'react';
import {
  Play, BookOpen, Newspaper, FileText, Film, PenLine,
  BookMarked, Scale, Gavel, ListChecks, Stamp, Search,
} from 'lucide-react';
import type { ConteudoResultado, ConteudoTipo } from '@/hooks/useBuscaConteudo';

const ICONS: Record<ConteudoTipo, React.ComponentType<{ className?: string }>> = {
  videoaula: Play,
  livro: BookOpen,
  blog: PenLine,
  resumo: FileText,
  noticia: Newspaper,
  obra: Film,
  dicionario: BookMarked,
  artigo: Scale,
  sumula: Stamp,
  tese: ListChecks,
  informativo: Gavel,
  pesquisa: Search,
};

const COLORS: Record<ConteudoTipo, string> = {
  videoaula: '#3B82F6', // blue-500
  livro: '#F59E0B', // amber-500
  blog: '#10B981', // emerald-500
  resumo: '#8B5CF6', // violet-500
  noticia: '#06B6D4', // cyan-500
  obra: '#F43F5E', // rose-500
  dicionario: '#EAB308', // yellow-500
  artigo: '#EF4444', // red-500
  sumula: '#A855F7', // purple-500
  tese: '#D946EF', // fuchsia-500
  informativo: '#6366F1', // indigo-500
  pesquisa: '#14B8A6', // teal-500
};

const LABELS: Record<ConteudoTipo, string> = {
  videoaula: 'Videoaula',
  livro: 'Livro',
  blog: 'Blog',
  resumo: 'Resumo',
  noticia: 'Notícia',
  obra: 'Obra',
  dicionario: 'Dicionário',
  artigo: 'Artigo de lei',
  sumula: 'Súmula',
  tese: 'Tese',
  informativo: 'Informativo',
  pesquisa: 'Pesquisa pronta',
};

function highlight(text: string, termo: string) {
  if (!text || !termo) return text;
  try {
    const esc = termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${esc})`, 'ig'));
    return parts.map((p, i) =>
      p.toLowerCase() === termo.toLowerCase()
        ? <mark key={i} className="bg-primary/25 text-foreground rounded px-0.5">{p}</mark>
        : <span key={i}>{p}</span>
    );
  } catch {
    return text;
  }
}

/**
 * Card de resultado de busca — animação 100% CSS (GPU-only).
 * Usa `@keyframes` com `transform` + `opacity` para evitar layout thrashing.
 * `memo` previne re-renders desnecessários durante scroll virtualizado.
 */
const ResultadoConteudoCard = memo(function ResultadoConteudoCard({
  item, termo, onClick, index = 0,
}: { item: ConteudoResultado; termo: string; onClick: () => void; index?: number }) {
  const Icon = ICONS[item.entity_type] || FileText;
  const color = COLORS[item.entity_type] || '#EF4444'; // fallback red
  
  return (
    <button
      onClick={onClick}
      className="resultado-card-enter w-full flex items-stretch gap-4 p-3.5 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors text-left will-change-transform"
      style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
    >
      <div className="w-12 flex items-center justify-center shrink-0">
        {item.thumb_url ? (
          <img src={item.thumb_url} alt="" className="w-10 h-10 object-cover rounded-md" loading="lazy" />
        ) : (
          <Icon className="w-6 h-6" style={{ color }} />
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-2 mb-1">
          <span 
            className="text-[10px] uppercase tracking-wider font-bold" 
            style={{ color }}
          >
            {LABELS[item.entity_type] || item.entity_type}
          </span>
          {item.subtitle && (
            <span className="text-[10px] text-muted-foreground truncate">· {item.subtitle}</span>
          )}
        </div>
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
          {highlight(item.title || '', termo)}
        </p>
        {item.snippet && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
            {highlight(item.snippet, termo)}
          </p>
        )}
      </div>
    </button>
  );
});

export default ResultadoConteudoCard;
