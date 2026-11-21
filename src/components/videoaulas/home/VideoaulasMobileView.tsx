import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ChevronRight, Play } from 'lucide-react';
import { VideoaulasHero } from './VideoaulasHero';
import { type VideoaulasHeroTab } from './VideoaulasActionShortcuts';
import { VideoaulasContinuarCard } from './VideoaulasContinuarCard';
import { VideoaulasIniciantesCarousel } from './VideoaulasIniciantesCarousel';
import { VideoaulasAreaChips } from './VideoaulasAreaChips';
import { VideoaulasAreaCard, type VideoaulaAreaItem } from './VideoaulasAreaCard';
import { VideoaulasAulaResultCard } from './VideoaulasAulaResultCard';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import VideoaulasDesempenhoSheet from '@/components/videoaulas/VideoaulasDesempenhoSheet';
import { normalizeTexto, type useVideoaulas } from '@/hooks/useVideoaulas';
import { simplificarNomeArea, getCapaDaArea } from '@/lib/videoaulasCatalogos';
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
      return {
        area: a.area,
        slug: a.slug || '',
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
      const matched = areasItens.find((a) => a.slug === slug || a.area.toLowerCase() === slug.toLowerCase());
      if (matched) {
        setActiveChipTab(matched.area);
      } else {
        setActiveChipTab(slug);
      }
    },
    [areasItens]
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
          <section className="pt-3 sm:pt-4 space-y-4">
            <div className="flex items-start justify-between px-1 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-red-500" />
                  <h2 className="font-sans text-lg sm:text-xl font-black text-white uppercase tracking-wider leading-tight">
                    {heroTab === 'favoritos'
                      ? 'Matérias Favoritas'
                      : heroTab === 'emalta'
                      ? 'Matérias em Alta'
                      : heroTab === 'recentes'
                      ? 'Matérias Recentes'
                      : heroTab === 'playlist'
                      ? 'Playlists de Aulas'
                      : activeChipTab !== 'Todos' && activeChipTab !== 'Em Andamento'
                      ? `Matéria: ${activeChipTab}`
                      : 'Todas as Matérias'}
                  </h2>
                </div>
                <p className="text-xs sm:text-[13px] text-zinc-400 mt-1 ml-3.5 leading-snug">
                  {heroTab === 'favoritos'
                    ? 'Suas áreas jurídicas salvas para estudo contínuo.'
                    : activeChipTab !== 'Todos' && activeChipTab !== 'Em Andamento'
                    ? 'Toque na matéria para abrir os módulos e aulas completas.'
                    : 'Toque em qualquer matéria para abrir os módulos e aulas completas.'}
                </p>
              </div>

              {(heroTab !== 'todos' || activeChipTab !== 'Todos') && (
                <button
                  onClick={() => {
                    haptic.selection();
                    setHeroTab('todos');
                    setActiveChipTab('Todos');
                  }}
                  className="shrink-0 flex items-center justify-center gap-1.5 h-[34px] px-3.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold whitespace-nowrap shadow-md shadow-red-600/30 transition-all active:scale-95"
                >
                  <span>Ver todas</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.6]" />
                </button>
              )}
            </div>

            {/* Campo de Busca Rápida Ergonômico */}
            <div className="relative">
              <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="busca-videoaulas-input"
                type="text"
                value={q}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar matéria, assunto ou videoaula…"
                className="w-full pl-11 pr-11 h-12 sm:h-13 text-sm sm:text-base rounded-2xl bg-zinc-900/90 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/50 transition-colors shadow-sm font-sans"
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

            {/* Menu de Alternância de Áreas & Matérias */}
            <VideoaulasAreaChips
              areas={areasItens}
              activeTab={activeChipTab}
              onSelectTab={setActiveChipTab}
              onOpenArea={handleAreaClick}
              emAndamentoCount={state.emAndamentoCount}
            />

            {/* Listagem de Matérias ou Resultados */}
            {q.trim() && state.loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-zinc-400">
                <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                <p className="text-xs font-sans">Buscando aulas e matérias…</p>
              </div>
            ) : q.trim() && state.aulasFiltradas.length > 0 ? (
              <div className="space-y-3 pt-1">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">
                  {state.aulasFiltradas.length} {state.aulasFiltradas.length === 1 ? 'aula encontrada' : 'aulas encontradas'}
                </p>
                <div className="space-y-2">
                  {state.aulasFiltradas.map((aula) => (
                    <VideoaulasAulaResultCard key={aula.videoId} aula={aula} />
                  ))}
                </div>
              </div>
            ) : selectedArea ? (
              <div className="space-y-3.5 pt-1">
                {/* Cabeçalho da Matéria com Capa Oficial das Aulas Interativas */}
                <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-zinc-900/95 border border-rose-500/30 text-rose-200 shadow-lg">
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <div className="w-12 h-16 sm:w-14 sm:h-18 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md bg-black relative">
                      <img
                        src={getCapaDaArea(selectedArea.area)}
                        alt={selectedArea.displayArea}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-sans font-bold text-base sm:text-lg text-white truncate">
                        {selectedArea.displayArea}
                      </h3>
                      <p className="font-sans text-xs sm:text-[13px] text-zinc-400 mt-0.5">
                        {loadingAulasMateria
                          ? 'Carregando videoaulas...'
                          : `${aulasDaMateria.length || selectedArea.total} videoaulas disponíveis`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAreaClick(selectedArea.slug)}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-950/50 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <span>Ver Módulos</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Lista Completa de Aulas da Matéria */}
                {loadingAulasMateria ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-zinc-400">
                    <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                    <p className="text-xs font-sans">Carregando aulas de {selectedArea.displayArea}...</p>
                  </div>
                ) : aulasDaMateria.length > 0 ? (
                  <div className="space-y-2.5">
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
                  <div className="text-center py-8 rounded-2xl bg-zinc-900/40 border border-white/5 p-6 text-zinc-400 text-xs">
                    Nenhuma aula encontrada para esta matéria.
                  </div>
                )}
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
