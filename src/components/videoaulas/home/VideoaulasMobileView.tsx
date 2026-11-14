import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { VideoaulasHero } from './VideoaulasHero';
import { VideoaulasContinuarCard } from './VideoaulasContinuarCard';
import { VideoaulasEmAltaCarousel } from './VideoaulasEmAltaCarousel';
import { VideoaulasAreaChips } from './VideoaulasAreaChips';
import { VideoaulasAreaCard, type VideoaulaAreaItem } from './VideoaulasAreaCard';
import { VideoaulasAulaResultCard } from './VideoaulasAulaResultCard';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import VideoaulasDesempenhoSheet from '@/components/videoaulas/VideoaulasDesempenhoSheet';
import { normalizeTexto, type useVideoaulas } from '@/hooks/useVideoaulas';
import { haptic } from '@/lib/nativeHaptics';

interface VideoaulasMobileViewProps {
  state: ReturnType<typeof useVideoaulas>;
  c: number;
  dash: number;
  horasAssistidas: number;
}

export const VideoaulasMobileView: React.FC<VideoaulasMobileViewProps> = ({
  state,
  c,
  dash,
  horasAssistidas,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Todos');
  const [q, setQ] = useState('');

  const handleSearchChange = (val: string) => {
    setQ(val);
    state.setBusca(val);
  };

  const handleClearSearch = () => {
    setQ('');
    state.setBusca('');
  };

  const areasItens: VideoaulaAreaItem[] = useMemo(() => {
    return state.areasDireito.map((a) => ({
      area: a.area,
      slug: a.slug,
      total: a.total,
      concluidas: a.concluidas,
      pct: a.pct,
    }));
  }, [state.areasDireito]);

  // Filtragem de áreas por texto e aba ativa
  const filteredAreas = useMemo(() => {
    let list = areasItens;

    if (activeTab === 'Em Andamento') {
      list = list.filter((a) => a.pct > 0);
    } else if (activeTab !== 'Todos') {
      list = list.filter((a) => a.area.toLowerCase() === activeTab.toLowerCase());
    }

    if (q.trim()) {
      const termos = normalizeTexto(q).split(/\s+/).filter(Boolean);
      list = list.filter((a) => {
        const areaNorm = normalizeTexto(a.area);
        return termos.every((t) => areaNorm.includes(t));
      });
    }

    return list;
  }, [areasItens, activeTab, q]);

  const handleAreaClick = useCallback(
    (slug: string) => {
      haptic.selection();
      navigate(`/videoaulas/areas/${slug}`);
    },
    [navigate]
  );

  return (
    <div className="relative z-10">
      <PageHeader title="Videoaulas" onBack={() => navigate('/')} />

      <div className="mx-auto w-full max-w-4xl pb-32">
        {/* Painel Hero Minimalista e Monocromático (Sem ser colorido) */}
        <VideoaulasHero
          data={state.data}
          heroIdx={state.heroIdx}
          emAndamentoCount={state.emAndamentoCount}
          areasDireitoLength={state.areasDireito.length}
          setShowDesempenho={state.setShowDesempenho}
          horasAssistidas={horasAssistidas}
          c={c}
          dash={dash}
        />

        {/* Conteúdo Principal com Layout Enxuto e Minimalista */}
        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-5 space-y-5">
          {/* Card Dinâmico "Continuar Assistindo" Sem Abreviar */}
          <VideoaulasContinuarCard />

          {/* Seção "EM ALTA" (Carrossel Horizontal Fluido com Capas de Aulas Interativas) */}
          {activeTab === 'Todos' && !q && (
            <VideoaulasEmAltaCarousel
              areas={areasItens}
              onSelectArea={handleAreaClick}
            />
          )}

          {/* Seção Catálogo de Videoaulas */}
          <section className="pt-1 space-y-3.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-zinc-400" />
                <h2 className="font-sans text-lg sm:text-xl font-bold text-white tracking-tight leading-tight">
                  {activeTab === 'Todos' ? 'Todas as Matérias' : activeTab}
                </h2>
              </div>
              <p className="text-xs sm:text-[13px] text-zinc-400 mt-1 ml-3.5 leading-snug">
                Toque em qualquer matéria para abrir os módulos e aulas completas.
              </p>
            </div>

            {/* Campo de Busca Rápida Ergonômico */}
            <div className="relative">
              <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar matéria, assunto ou videoaula…"
                className="w-full pl-11 pr-11 h-12 sm:h-13 text-sm sm:text-base rounded-2xl bg-zinc-900/90 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors shadow-sm font-sans"
              />
              {q && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer active:scale-95"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Chips Enxutos: Apenas Todas e Em Andamento (Sem Lei Seca nem Três Poderes) */}
            <VideoaulasAreaChips
              areas={areasItens}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              emAndamentoCount={state.emAndamentoCount}
            />

            {/* Listagem de Matérias ou Resultados */}
            {q.trim() && state.buscando ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                <p className="text-xs">Buscando aulas e matérias…</p>
              </div>
            ) : q.trim() && state.resultadosAulas.length > 0 ? (
              <div className="space-y-3 pt-1">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {state.resultadosAulas.length} {state.resultadosAulas.length === 1 ? 'aula encontrada' : 'aulas encontradas'}
                </p>
                <div className="space-y-2">
                  {state.resultadosAulas.map((aula) => (
                    <VideoaulasAulaResultCard key={aula.id} aula={aula} />
                  ))}
                </div>
              </div>
            ) : filteredAreas.length > 0 ? (
              <div className="space-y-3 pt-1">
                {filteredAreas.map((area) => (
                  <VideoaulasAreaCard
                    key={area.slug}
                    area={area}
                    onClick={handleAreaClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-2xl bg-zinc-900/40 border border-white/5 p-6">
                <p className="text-sm font-semibold text-white">Nenhuma matéria encontrada</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Tente buscar por outro termo ou limpe o filtro.
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Navegação Inferior de Videoaulas */}
      <VideoaulasBottomNav
        activeTab="home"
        onOpenBusca={() => {}}
        onOpenDesempenho={() => state.setShowDesempenho(true)}
      />

      {/* Sheet de Desempenho */}
      <VideoaulasDesempenhoSheet
        open={state.showDesempenho}
        onOpenChange={state.setShowDesempenho}
        data={state.data}
        horasAssistidas={horasAssistidas}
        c={c}
        dash={dash}
      />
    </div>
  );
};
