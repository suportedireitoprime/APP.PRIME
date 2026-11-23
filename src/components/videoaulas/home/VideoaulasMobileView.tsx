import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ChevronRight, Play, ArrowLeft } from 'lucide-react';
import { VideoaulasHero } from './VideoaulasHero';
import { type VideoaulasHeroTab } from './VideoaulasActionShortcuts';
import { VideoaulasContinuarCard } from './VideoaulasContinuarCard';
import { VideoaulasIniciantesCarousel } from './VideoaulasIniciantesCarousel';
import { VideoaulasAreaCard, type VideoaulaAreaItem } from './VideoaulasAreaCard';
import { VideoaulasAulaResultCard } from './VideoaulasAulaResultCard';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import VideoaulasDesempenhoSheet from '@/components/videoaulas/VideoaulasDesempenhoSheet';
import { normalizeTexto, type useVideoaulas } from '@/hooks/useVideoaulas';
import { simplificarNomeArea, getCapaDaArea, slugify } from '@/lib/videoaulasCatalogos';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { getCachedAulasDaArea, loadAulasDaArea, type AulaCache } from '@/lib/videoaulasStore';
import type { AulaHit } from '@/types/videoaula';
import { haptic } from '@/lib/nativeHaptics';

interface VideoaulasMobileViewProps {
  state: ReturnType<typeof useVideoaulas>;
  c: number;
  dash: number;
  horasAssistidas: number;
}

const STORAGE_FAV_KEY = 'videoaulas_fav_areas_v1';
const STORAGE_RECENTES_KEY = 'videoaulas_recentes_v1';

export const VideoaulasMobileView: React.FC<VideoaulasMobileViewProps> = ({
  state,
  c,
  dash,
  horasAssistidas,
}) => {
  const navigate = useNavigate();
  const [heroTab, setHeroTab] = useState<VideoaulasHeroTab>('todos');
  const [activeChipTab, setActiveChipTab] = useState('Todos');
  const [q, setQ] = useState('');

  // Favoritos
  const [favoritosSet, setFavoritosSet] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FAV_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set(['Direito Penal', 'Direito Constitucional']);
    } catch {
      return new Set(['Direito Penal', 'Direito Constitucional']);
    }
  });

  const handleSearchChange = (val: string) => {
    setQ(val);
    state.setBusca(val);
  };

  const handleClearSearch = () => {
    setQ('');
    state.setBusca('');
  };

  const areasItens: VideoaulaAreaItem[] = useMemo(() => {
    return (state.areasDireito || []).filter((a): a is typeof a & { area: string } => Boolean(a && a.area)).map((a) => {
      const display = simplificarNomeArea(a.area).replace(/^DIREITO\s+(DO\s+|DA\s+|DE\s+)?/i, '');
      const s = a.slug ? slugify(a.slug) : slugify(a.area);
      return {
        area: a.area,
        slug: s,
        total: a.total || 0,
        concluidas: a.concluidas || 0,
        pct: a.pct || 0,
        displayArea: display || a.area,
      };
    });
  }, [state.areasDireito]);

  // Filtragem combinada por Aba do Hero (Favoritos, Em Alta, Recentes, Playlist) e Chips
  const filteredAreas = useMemo(() => {
    let list = areasItens;

    // Filtros do Hero (4 Funções)
    if (heroTab === 'favoritos') {
      list = list.filter((a) => a?.area && (favoritosSet.has(a.area) || favoritosSet.has(a.slug)));
    } else if (heroTab === 'emalta') {
      // Prioridade das matérias mais acessadas
      list = [...list].sort((a, b) => (b?.total || 0) - (a?.total || 0));
    } else if (heroTab === 'recentes') {
      // Itens em andamento ou iniciados
      list = list.filter((a) => (a?.pct || 0) > 0);
      if (list.length === 0) list = areasItens.slice(0, 5);
    } else if (heroTab === 'playlist') {
      // Matérias fundamentais para trilha contínua
      list = list.filter((a) => (a?.total || 0) > 20);
    }

    // Filtros de chips
    if (activeChipTab === 'Em Andamento') {
      list = list.filter((a) => (a?.pct || 0) > 0);
    } else if (activeChipTab !== 'Todos') {
      const tabLower = activeChipTab.toLowerCase();
      list = list.filter(
        (a) =>
          (a?.area && a.area.toLowerCase() === tabLower) ||
          (a?.slug && a.slug.toLowerCase() === tabLower) ||
          (a?.displayArea && a.displayArea.toLowerCase() === tabLower)
      );
    }

    // Filtro de busca textual
    if (q.trim()) {
      const termos = normalizeTexto(q).split(/\s+/).filter(Boolean);
      list = list.filter((a) => {
        const areaNorm = normalizeTexto(a?.area || '');
        return termos.every((t) => areaNorm.includes(t));
      });
    }

    return list;
  }, [areasItens, heroTab, activeChipTab, q, favoritosSet]);

  // Identifica a área selecionada pelo chip individual
  const selectedArea = useMemo(() => {
    if (activeChipTab === 'Todos' || activeChipTab === 'Em Andamento') return null;
    const tabLower = activeChipTab.toLowerCase();
    return (
      areasItens.find(
        (a) =>
          a.area.toLowerCase() === tabLower ||
          a.slug.toLowerCase() === tabLower ||
          a.displayArea.toLowerCase() === tabLower
      ) || null
    );
  }, [activeChipTab, areasItens]);

  // Carrega as aulas da matéria selecionada em tempo real
  const [aulasDaMateria, setAulasDaMateria] = useState<AulaCache[]>([]);
  const [loadingAulasMateria, setLoadingAulasMateria] = useState(false);

  useEffect(() => {
    if (!selectedArea) {
      setAulasDaMateria([]);
      setLoadingAulasMateria(false);
      return;
    }
    const cached = getCachedAulasDaArea('areas', selectedArea.slug);
    if (cached && cached.length > 0) {
      setAulasDaMateria(cached);
    } else {
      setLoadingAulasMateria(true);
    }
    let alive = true;
    void loadAulasDaArea('areas', selectedArea.slug).then((rows) => {
      if (alive) {
        setAulasDaMateria(rows || []);
        setLoadingAulasMateria(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [selectedArea]);

  const handleAreaClick = useCallback(
    (slug: string) => {
      haptic.selection();
      const s = slugify(slug);
      navigate(`/videoaulas/areas/${s}`);
    },
    [navigate]
  );

  return (
    <div className="relative z-10">
      <div className="mx-auto w-full max-w-4xl pb-32">
        {/* Painel Hero Idêntico ao de Pílulas com 4 Atalhos: Favoritos, Em Alta, Recentes e Playlist */}
        <VideoaulasHero
          data={state.data}
          heroIdx={state.heroIdx}
          emAndamentoCount={state.emAndamentoCount}
          areasDireitoLength={state.areasDireito.length}
          setShowDesempenho={state.setShowDesempenho}
          horasAssistidas={horasAssistidas}
          c={c}
          dash={dash}
          activeHeroTab={heroTab}
          onSelectHeroTab={setHeroTab}
          onOpenSearch={() => {
            const input = document.getElementById('busca-videoaulas-input');
            input?.focus();
          }}
          favoritosCount={favoritosSet.size}
        />

        {/* Conteúdo Principal com Generoso Respiro Visual */}
        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8 space-y-7 sm:space-y-8">
          {/* Card Dinâmico "Continuar Assistindo" Sem Abreviar */}
          <VideoaulasContinuarCard />

          {/* Seção "PARA INICIANTES" (Carrossel Horizontal Fluido com as 50 Aulas Completas) */}
          {heroTab === 'todos' && activeChipTab === 'Todos' && !q && (
            <VideoaulasIniciantesCarousel />
          )}

          {/* Seção Catálogo de Videoaulas */}
          <section className="pt-3 sm:pt-4 space-y-3.5">
            <div className="flex items-start justify-between px-1 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-red-500/80 shrink-0" />
                  <h2 className="font-sans text-[15px] sm:text-[17px] font-normal text-white/95 uppercase tracking-widest leading-tight">
                    {heroTab === 'favoritos'
                      ? 'Matérias Favoritas'
                      : heroTab === 'emalta'
                      ? 'Matérias em Alta'
                      : heroTab === 'recentes'
                      ? 'Matérias Recentes'
                      : heroTab === 'playlist'
                      ? 'Playlists de Aulas'
                      : selectedArea
                      ? selectedArea.displayArea
                      : 'Todas as Matérias'}
                  </h2>
                </div>
                <p className="text-[11.5px] sm:text-xs text-zinc-400/80 font-light mt-1 ml-3 leading-snug">
                  {selectedArea
                    ? `${selectedArea.displayArea} · Videoaulas completas`
                    : heroTab === 'favoritos'
                    ? 'Suas áreas jurídicas salvas para estudo contínuo.'
                    : 'Toque em qualquer matéria para abrir as videoaulas.'}
                </p>
              </div>

              {(heroTab !== 'todos' || selectedArea) && (
                <button
                  onClick={() => {
                    haptic.selection();
                    setHeroTab('todos');
                    setActiveChipTab('Todos');
                  }}
                  className="shrink-0 flex items-center justify-center gap-1 h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-white/70 hover:text-white text-[11px] sm:text-xs font-light transition-all active:scale-95 border border-white/[0.08]"
                >
                  <span>Ver todas</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[1.6]" />
                </button>
              )}
            </div>

            {/* Campo de Busca Rápida Ergonômico e Minimalista */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.6]" />
              <input
                id="busca-videoaulas-input"
                type="text"
                value={q}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar matéria, assunto ou videoaula…"
                className="w-full pl-10 pr-10 h-10 sm:h-11 text-xs sm:text-[13px] rounded-xl bg-zinc-950/60 border border-white/[0.07] text-white/90 placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors shadow-inner font-sans font-light"
              />
              {q && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer active:scale-95"
                  aria-label="Limpar busca"
                >
                  <X className="w-3.5 h-3.5 stroke-[1.6]" />
                </button>
              )}
            </div>

            {/* Listagem de Matérias ou Resultados */}
            {q.trim() && state.loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                <p className="text-xs font-sans font-light text-white/40">Buscando aulas e matérias…</p>
              </div>
            ) : q.trim() && state.aulasFiltradas.length > 0 ? (
              <div className="space-y-2.5 pt-0.5">
                <p className="text-[11px] font-light uppercase tracking-wider text-zinc-400 font-sans">
                  {state.aulasFiltradas.length} {state.aulasFiltradas.length === 1 ? 'aula encontrada' : 'aulas encontradas'}
                </p>
                <div className="space-y-2">
                  {state.aulasFiltradas.map((aula) => (
                    <VideoaulasAulaResultCard key={aula.videoId} aula={aula} />
                  ))}
                </div>
              </div>
            ) : selectedArea ? (
              <div className="space-y-2.5 pt-0.5">
                {(() => {
                  const { Icon: AreaIcon, color: areaColor } = areaIconFor(selectedArea.slug || selectedArea.area);
                  return (
                    <div
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-white/5 bg-[#252528] hover:bg-[#2F2F33] transition-all shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setActiveChipTab('Todos');
                        }}
                        className="inline-flex items-center gap-1.5 py-1 px-2.5 -ml-1 rounded-lg text-white/85 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all text-xs font-light cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 stroke-[1.8]" style={{ color: areaColor }} />
                        <span>Todas as matérias</span>
                      </button>
                      <div className="flex items-center gap-1.5 text-[11.5px] font-light truncate text-zinc-300">
                        <AreaIcon className="w-3.5 h-3.5" style={{ color: areaColor }} />
                        <span>{loadingAulasMateria ? 'Carregando...' : `${aulasDaMateria.length || selectedArea.total} videoaulas`}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Lista Completa de Aulas da Matéria */}
                {loadingAulasMateria ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                    <p className="text-xs font-light font-sans text-white/40">Carregando aulas de {selectedArea.displayArea}...</p>
                  </div>
                ) : aulasDaMateria.length > 0 ? (
                  <div className="space-y-2">
                    {aulasDaMateria.map((aula) => {
                      const hit: AulaHit = {
                        videoId: aula.video_id,
                        titulo: aula.titulo,
                        area: aula.area || selectedArea.area,
                        catalogoId: 'areas',
                        slugArea: selectedArea.slug,
                      };
                      return <VideoaulasAulaResultCard key={aula.video_id} aula={hit} />;
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-xl bg-zinc-950/40 border border-white/[0.05] p-6 text-zinc-400 text-xs font-light">
                    Nenhuma aula encontrada para esta matéria.
                  </div>
                )}
              </div>
            ) : filteredAreas.length > 0 ? (
              <div className="space-y-2 pt-0.5">
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
                <p className="text-sm font-semibold text-white font-sans">
                  {heroTab === 'favoritos' ? 'Nenhuma matéria favoritada' : 'Nenhuma matéria encontrada'}
                </p>
                <p className="text-xs text-zinc-400 mt-1 font-sans">
                  {heroTab === 'favoritos'
                    ? 'Toque no coração de qualquer matéria para salvá-la aqui.'
                    : 'Tente buscar por outro termo ou limpe o filtro.'}
                </p>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Navegação Inferior de Videoaulas */}
      <VideoaulasBottomNav
        activeTab="home"
        onOpenBusca={() => {
          const input = document.getElementById('busca-videoaulas-input');
          input?.focus();
        }}
        onOpenDesempenho={() => state.setShowDesempenho(true)}
      />

      {/* Sheet de Desempenho */}
      <VideoaulasDesempenhoSheet
        open={state.showDesempenho}
        onClose={() => state.setShowDesempenho(false)}
        horasTotais={horasAssistidas}
      />
    </div>
  );
};
