import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Scale,
  GraduationCap,
  ListChecks,
  Layers,
  Library,
  NotebookPen,
  Headphones,
  Video,
  Clapperboard,
  Radar,
  Newspaper,
  Gavel,
  BookA,
  Bird,
  User,
  CreditCard,
  ArrowRight,
  Home,
  CornerDownLeft,
  type LucideIcon,
} from 'lucide-react';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { pushRecente } from '@/lib/leisRecentes';

interface CommandItem {
  id: string;
  label: string;
  subtitle?: string;
  category: 'Navegação' | 'Legislação';
  icon: LucideIcon;
  route: string;
  keywords?: string;
  onSelect?: () => void;
}

const NAV_COMMANDS: CommandItem[] = [
  { id: 'nav-home', label: 'Início', subtitle: 'Visão geral e atalhos', category: 'Navegação', icon: Home, route: '/' },
  { id: 'nav-vademecum', label: 'Vade Mecum', subtitle: 'Constituição, Códigos, Estatutos e Leis', category: 'Navegação', icon: Scale, route: '/vade-mecum' },
  { id: 'nav-aulas', label: 'Aulas em Trilha', subtitle: 'Trilhas e lições interativas', category: 'Navegação', icon: GraduationCap, route: '/aulas' },
  { id: 'nav-questoes', label: 'Questões Comentadas', subtitle: 'Praticar por matéria e banca', category: 'Navegação', icon: ListChecks, route: '/questoes' },
  { id: 'nav-flashcards', label: 'Flashcards', subtitle: 'Memorização ativa e revisão', category: 'Navegação', icon: Layers, route: '/flashcards' },
  { id: 'nav-lei-seca', label: 'Lei Seca', subtitle: 'Treino de texto legal', category: 'Navegação', icon: Scale, route: '/lei-seca' },
  { id: 'nav-biblioteca', label: 'Biblioteca', subtitle: 'Livros, clássicos e coleções', category: 'Navegação', icon: Library, route: '/bibliotecas' },
  { id: 'nav-resumos', label: 'Resumos Jurídicos', subtitle: 'Resumos por área e tema', category: 'Navegação', icon: NotebookPen, route: '/resumos-juridicos' },
  { id: 'nav-audioleis', label: 'Ouça a Lei', subtitle: 'Artigos narrados em áudio', category: 'Navegação', icon: Headphones, route: '/audioleis' },
  { id: 'nav-videoaulas', label: 'Videoaulas', subtitle: 'Aulas em vídeo por área', category: 'Navegação', icon: Video, route: '/videoaulas' },
  { id: 'nav-animacoes', label: 'Animações Jurídicas', subtitle: 'Casos práticos animados', category: 'Navegação', icon: Clapperboard, route: '/animacoes' },
  { id: 'nav-radar', label: 'Radar Legislativo', subtitle: 'Novidades e proposições', category: 'Navegação', icon: Radar, route: '/radar-360' },
  { id: 'nav-blog', label: 'Blog Jurídico', subtitle: 'Artigos e análises', category: 'Navegação', icon: Newspaper, route: '/blog' },
  { id: 'nav-ferramentas', label: 'Ferramentas', subtitle: 'Todos os recursos do Direito Prime', category: 'Navegação', icon: Gavel, route: '/ferramentas' },
  { id: 'nav-dicionario', label: 'Dicionário Jurídico', subtitle: 'Termos e expressões em latim', category: 'Navegação', icon: BookA, route: '/ferramentas/dicionario' },
  { id: 'nav-horus', label: 'Assistente Hórus (IA)', subtitle: 'Tutor jurídico inteligente', category: 'Navegação', icon: Bird, route: '/assistente-horus' },
  { id: 'nav-perfil', label: 'Meu Perfil', subtitle: 'Dados e preferências da conta', category: 'Navegação', icon: User, route: '/perfil' },
  { id: 'nav-assinatura', label: 'Assinatura', subtitle: 'Plano e faturamento', category: 'Navegação', icon: CreditCard, route: '/assinatura' },
];

interface DesktopCommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onOpenDeepSearch?: () => void;
}

export function DesktopCommandPalette({ open, onClose, onOpenDeepSearch }: DesktopCommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo<CommandItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return NAV_COMMANDS.slice(0, 8);
    }

    const navMatches = NAV_COMMANDS.filter((item) =>
      `${item.label} ${item.subtitle ?? ''} ${item.keywords ?? ''}`.toLowerCase().includes(q)
    );

    const leiMatches: CommandItem[] = LEIS_CATALOG
      .filter((lei) =>
        `${lei.nome} ${lei.descricao ?? ''} ${lei.sigla ?? ''}`.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map((lei) => {
        const slug = leiToSlug({ id: lei.id, nome: lei.nome });
        const route = `/legislacao/${tipoToSlug(lei.tipo)}/${slug}`;
        return {
          id: `lei-${lei.id}`,
          label: lei.nome,
          subtitle: lei.descricao || lei.tipo,
          category: 'Legislação' as const,
          icon: Scale,
          route,
          onSelect: () => {
            pushRecente({
              tipo: lei.tipo,
              leiId: lei.id,
              nome: lei.nome,
              descricao: lei.descricao,
              tabela_nome: lei.tabela_nome,
            });
          },
        };
      });

    return [...leiMatches, ...navMatches].slice(0, 10);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length, query]);

  const executeItem = useCallback(
    (item: CommandItem) => {
      item.onSelect?.();
      onClose();
      navigate(item.route);
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        executeItem(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, results, selectedIndex, executeItem, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Busca rápida"
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-[#111114] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.75)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 h-13 border-b border-white/[0.07]">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ir para página, buscar código, lei ou ferramenta..."
            className="w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/[0.05] border border-white/10 rounded">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-0.5">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-zinc-500">
              Nenhum atalho ou lei encontrada para "{query}".
            </div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => executeItem(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-white/[0.08] text-white'
                      : 'text-zinc-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                        : 'bg-white/[0.04] border-white/[0.06] text-zinc-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{item.label}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-400 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{item.subtitle}</p>
                    )}
                  </div>
                  {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        {onOpenDeepSearch && (
          <div className="px-3 py-2.5 border-t border-white/[0.07] bg-white/[0.02] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDeepSearch();
              }}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-rose-400" />
              <span>Busca completa em artigos, livros e aulas</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-500">
              <span>↑↓ navegar</span>
              <span>·</span>
              <span>↵ abrir</span>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
