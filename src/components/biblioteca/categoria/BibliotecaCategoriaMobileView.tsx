import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Mic, MicOff, BookOpen, Bookmark, Library } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Input } from '@/components/ui/input';
import { haptic } from '@/lib/nativeHaptics';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import BibliotecaAtalhosBar from '@/components/biblioteca/BibliotecaAtalhosBar';
import { BibliotecaCategoriaLivroCard } from './BibliotecaCategoriaLivroCard';
import { BibliotecaCategoriaAreaCard, type AreaItem } from './BibliotecaCategoriaAreaCard';
import ShapeGrid from '@/components/ui/ShapeGrid';
import type { ColecaoConfig, LivroNormalizado } from '@/lib/bibliotecaColecoes';

interface BibliotecaCategoriaMobileViewProps {
  colecao: ColecaoConfig;
  areaAtiva: string | null;
  livros: LivroNormalizado[];
  livrosVisiveis: LivroNormalizado[];
  areas: AreaItem[];
  mostrarAreas: boolean;
  isLoading: boolean;
  query: string;
  setQuery: (q: string) => void;
  voice: { listening: boolean; partial?: string; toggle: () => void };
  livroAberto: LivroNormalizado | null;
  setLivroAberto: (l: LivroNormalizado | null) => void;
  handleCloseLivro: () => void;
  badges: any;
  norm: (s: string) => string;
}

export const BibliotecaCategoriaMobileView: React.FC<BibliotecaCategoriaMobileViewProps> = ({
  colecao,
  areaAtiva,
  livros,
  livrosVisiveis,
  areas,
  mostrarAreas,
  isLoading,
  query,
  setQuery,
  voice,
  livroAberto,
  setLivroAberto,
  handleCloseLivro,
  badges,
  norm,
}) => {
  const navigate = useNavigate();

  // Menu de Alternância Minimalista: 'todos' | 'lendo' | 'favoritos'
  const [filtroAba, setFiltroAba] = useState<'todos' | 'lendo' | 'favoritos'>('todos');

  // Helper para verificar se um livro começou a ser lido (Supabase + localStorage)
  const isLivroLendo = useCallback((l: LivroNormalizado) => {
    const b = badges.getBadge(colecao.id, colecao.table, l.id);
    if (typeof b?.progresso === 'number' && b.progresso > 0) return true;
    if (typeof window === 'undefined') return false;
    try {
      const keys = [
        `leitura-nativa:${colecao.id}:${l.id}`,
        `leitura-nativa:${colecao.table}:${l.id}`,
        `leitura-nativa:${l.id}`,
      ];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const p = JSON.parse(raw);
          if (p?.percent > 0 || p?.index > 0) return true;
        }
      }
      if (l.download) {
        const saved = Number(localStorage.getItem(`pdf-reader:page:${l.download}`) || '0');
        if (saved > 0) return true;
      }
    } catch {}
    return false;
  }, [badges, colecao]);

  // Helper para verificar se o livro foi favoritado
  const isLivroFavorito = useCallback((l: LivroNormalizado) => {
    const b = badges.getBadge(colecao.id, colecao.table, l.id);
    return !!b?.favorito;
  }, [badges, colecao]);

  // Contadores para o menu de alternância
  const countTodos = livrosVisiveis.length;
  const countLendo = useMemo(() => livrosVisiveis.filter(isLivroLendo).length, [livrosVisiveis, isLivroLendo]);
  const countFavoritos = useMemo(() => livrosVisiveis.filter(isLivroFavorito).length, [livrosVisiveis, isLivroFavorito]);

  // Livros filtrados pela aba ativa
  const livrosFiltradosPorAba = useMemo(() => {
    if (filtroAba === 'lendo') return livrosVisiveis.filter(isLivroLendo);
    if (filtroAba === 'favoritos') return livrosVisiveis.filter(isLivroFavorito);
    return livrosVisiveis;
  }, [livrosVisiveis, filtroAba, isLivroLendo, isLivroFavorito]);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] pb-[calc(24px+var(--sai-bottom,0px))] relative overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShapeGrid />
      </div>
      <div className="relative z-10">
        {/* Topo Minimalista Sem Capa */}
        <PageHeader
        title={areaAtiva || colecao.label}
        subtitle={areaAtiva ? colecao.label : `${livros.length} obras disponíveis`}
        onBack={() => {
          if (areaAtiva) navigate(`/bibliotecas/${colecao.id}`);
          else navigate('/bibliotecas');
        }}
      />

      <div className="max-w-3xl mx-auto w-full px-4 pt-3 sm:pt-4">
        {/* Barra de Busca Minimalista */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              value={voice.listening && voice.partial ? voice.partial : query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={mostrarAreas ? 'Buscar área ou livro…' : 'Buscar livro ou autor…'}
              className="pl-11 pr-3 h-12 text-sm sm:text-base rounded-2xl bg-card border border-border/60"
            />
          </div>
          <button
            type="button"
            onClick={voice.toggle}
            aria-label={voice.listening ? 'Parar gravação' : 'Buscar por voz'}
            className={`relative overflow-hidden shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-[0.95] transition ${
              voice.listening
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                : 'bg-primary text-primary-foreground shadow-primary/30'
            }`}
          >
            {voice.listening && (
              <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
            )}
            {voice.listening ? (
              <MicOff className="w-5 h-5 relative z-[2]" strokeWidth={2.5} />
            ) : (
              <Mic className="w-5 h-5 relative z-[2]" strokeWidth={2.5} />
            )}
          </button>
        </div>

        {/* Atalhos Rápidos Flutuantes */}
        <div className="-mx-4 mb-3">
          <BibliotecaAtalhosBar
            onAbrirLivro={setLivroAberto}
            filtroArea={areaAtiva ?? null}
          />
        </div>

        {/* Menu de Alternância Minimalista: TODOS, LENDO, FAVORITOS */}
        {!mostrarAreas && (
          <div className="flex items-center gap-1.5 p-1 mb-4 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroAba('todos');
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                filtroAba === 'todos' ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {filtroAba === 'todos' && (
                <motion.div
                  layoutId="activeCategoriaFilterPill"
                  className="absolute inset-0 rounded-xl bg-white/15 border border-white/20 shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">TODOS</span>
              <span className="relative z-10 text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
                {countTodos}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroAba('lendo');
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                filtroAba === 'lendo' ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {filtroAba === 'lendo' && (
                <motion.div
                  layoutId="activeCategoriaFilterPill"
                  className="absolute inset-0 rounded-xl bg-purple-500/25 border border-purple-400/40 shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                LENDO
              </span>
              <span className="relative z-10 text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-200 font-mono">
                {countLendo}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setFiltroAba('favoritos');
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all relative flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                filtroAba === 'favoritos' ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              {filtroAba === 'favoritos' && (
                <motion.div
                  layoutId="activeCategoriaFilterPill"
                  className="absolute inset-0 rounded-xl bg-amber-500/25 border border-amber-400/40 shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                FAVORITOS
              </span>
              <span className="relative z-10 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-200 font-mono">
                {countFavoritos}
              </span>
            </button>
          </div>
        )}

        {/* Título da seção do acervo minimalista */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {mostrarAreas
                ? 'Áreas do Direito'
                : filtroAba === 'lendo'
                ? 'Leituras em Andamento'
                : filtroAba === 'favoritos'
                ? 'Obras Favoritas'
                : areaAtiva || colecao.label}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 ml-3">
            {mostrarAreas
              ? 'Selecione uma matéria para acessar as obras.'
              : filtroAba === 'lendo'
              ? 'Obras iniciadas com progresso de leitura registrado.'
              : filtroAba === 'favoritos'
              ? 'Títulos salvos na sua lista de preferências.'
              : 'Toque para ler ou consultar detalhes de cada obra.'}
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[104px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : livros.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum livro ainda nesta coleção.
            </p>
          </div>
        ) : mostrarAreas ? (
          <div className="flex flex-col gap-2">
            {areas
              .filter((a) => !query || norm(a.name).includes(norm(query)))
              .map((a, index) => (
                <BibliotecaCategoriaAreaCard
                  key={a.name}
                  area={a}
                  index={index}
                  variant="mobile"
                  onClick={() =>
                    navigate(`/bibliotecas/${colecao.id}/${encodeURIComponent(a.name)}`)
                  }
                />
              ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {livrosFiltradosPorAba.map((l, i) => (
              <BibliotecaCategoriaLivroCard
                key={`${colecao.id}-${l.id}`}
                livro={l}
                index={i}
                priority={i < 12}
                badge={badges.getBadge(colecao.id, colecao.table, l.id)}
                onClick={() => setLivroAberto(l)}
              />
            ))}
            {livrosFiltradosPorAba.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                {filtroAba === 'lendo' ? (
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="w-8 h-8 text-purple-400/60" />
                    <p className="text-sm font-semibold text-white/80">Nenhuma leitura em andamento nesta coleção.</p>
                    <p className="text-xs text-white/50 max-w-xs">Abra qualquer livro para começar e acompanhar sua porcentagem lida aqui.</p>
                  </div>
                ) : filtroAba === 'favoritos' ? (
                  <div className="flex flex-col items-center gap-2">
                    <Bookmark className="w-8 h-8 text-amber-400/60" />
                    <p className="text-sm font-semibold text-white/80">Nenhum livro favoritado ainda.</p>
                    <p className="text-xs text-white/50 max-w-xs">Toque em salvar em qualquer obra para fixá-la nesta lista.</p>
                  </div>
                ) : (
                  <p className="text-sm">Nenhum livro encontrado.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <LivroDetailSheet
        livro={livroAberto}
        open={!!livroAberto}
        onClose={handleCloseLivro}
      />
      </div>
    </div>
  );
};

export default BibliotecaCategoriaMobileView;
