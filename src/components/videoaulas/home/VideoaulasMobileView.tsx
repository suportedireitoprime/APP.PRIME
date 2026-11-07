import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Scale, Landmark, Building, Building2, BookText } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { VideoaulasHero } from './VideoaulasHero';
import { VideoaulasContinuarCard } from './VideoaulasContinuarCard';
import { VideoaulasEmAltaCarousel } from './VideoaulasEmAltaCarousel';
import { VideoaulasAreaChips } from './VideoaulasAreaChips';
import { VideoaulasAreaCard, type VideoaulaAreaItem } from './VideoaulasAreaCard';
import { VideoaulasEspeciaisCard, type EspecialCardItem } from './VideoaulasEspeciaisCard';
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

const ITENS_LEI_SECA: EspecialCardItem[] = [
  {
    id: 'lei-seca-vade',
    title: 'Vade Mecum em Vídeo',
    subtitle: 'Códigos e leis com leitura e comentários em vídeo',
    badgeText: 'LEI SECA',
    route: '/videoaulas/lei-seca',
    icon: Scale,
    iconColor: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(245, 158, 11, 0.05))',
  },
  {
    id: 'lei-seca-estatutos',
    title: 'Estatutos e Legislação Especial',
    subtitle: 'Estatuto da OAB, ECA, Servidores e Microempresa',
    badgeText: 'ESTATUTOS',
    route: '/videoaulas/lei-seca/categoria/estatutos',
    icon: Landmark,
    iconColor: '#10b981',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.05))',
  },
  {
    id: 'jurisprudencia-video',
    title: 'Jurisprudência em Vídeo',
    subtitle: 'Súmulas e teses comentadas dos tribunais superiores',
    badgeText: 'JURISPRUDÊNCIA',
    route: '/jurisprudencia',
    icon: BookText,
    iconColor: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(139, 92, 246, 0.05))',
  },
];

const ITENS_TRES_PODERES: EspecialCardItem[] = [
  {
    id: 'stf',
    title: 'STF - Supremo Tribunal Federal',
    subtitle: 'Transmissões plenárias, julgamentos e repertório',
    badgeText: 'JUDICIÁRIO',
    route: '/videoaulas/canal/stf',
    icon: Landmark,
    iconColor: '#60a5fa',
    bgGradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.25), rgba(96, 165, 250, 0.05))',
  },
  {
    id: 'senado',
    title: 'Senado Federal',
    subtitle: 'Sessões deliberativas, audiências públicas e comissões',
    badgeText: 'LEGISLATIVO',
    route: '/videoaulas/canal/senado',
    icon: Building,
    iconColor: '#34d399',
    bgGradient: 'linear-gradient(135deg, rgba(52, 211, 153, 0.25), rgba(52, 211, 153, 0.05))',
  },
  {
    id: 'camara',
    title: 'Câmara dos Deputados',
    subtitle: 'Debates, votações em plenário e CCJ ao vivo',
    badgeText: 'LEGISLATIVO',
    route: '/videoaulas/canal/camara',
    icon: Building2,
    iconColor: '#fbbf24',
    bgGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(251, 191, 36, 0.05))',
  },
];

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
    } else if (activeTab !== 'Todos' && activeTab !== 'Lei Seca' && activeTab !== 'Três Poderes') {
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
        {/* Painel Hero Preservado Rigorosamente ("menos o painel") */}
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

        {/* Conteúdo Principal com Layout Minimalista e Detalhista Estilo Resumos */}
        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 space-y-6">
          {/* Card Dinâmico "Continuar Assistindo" */}
          <VideoaulasContinuarCard />

          {/* Seção "EM ALTA" (Carrossel Horizontal com Snap) */}
          {activeTab === 'Todos' && !q && (
            <VideoaulasEmAltaCarousel
              areas={areasItens}
              onSelectArea={handleAreaClick}
            />
          )}

          {/* Seção Catálogo de Videoaulas */}
          <section className="pt-2 space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-rose-400 font-bold">
                CATÁLOGO DE VIDEOAULAS
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1 h-6 rounded-full bg-rose-500" />
                <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                  {activeTab === 'Todos' ? 'Todas as Matérias' : activeTab}
                </h2>
              </div>
              <p className="text-sm text-white/60 mt-1 ml-3 leading-snug">
                Toque em qualquer matéria para abrir os módulos e videoaulas completas.
              </p>
            </div>

            {/* Campo de Busca Rápida Idêntico a Resumos e Audiobooks */}
            <div className="relative">
              <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Buscar matéria, assunto ou videoaula…"
                className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#141416] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-500/60 transition-colors shadow-sm"
              />
              {q && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Chips de Filtragem de Matérias e Categorias */}
            <VideoaulasAreaChips
              areas={areasItens}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              emAndamentoCount={state.emAndamentoCount}
            />

            {/* Conteúdo do Grid Conforme a Aba Selecionada */}
            <div className="pt-2">
              {state.loading ? (
                <div className="flex items-center justify-center py-16 text-white/50">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando videoaulas...
                </div>
              ) : activeTab === 'Lei Seca' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ITENS_LEI_SECA.map((item) => (
                    <VideoaulasEspeciaisCard key={item.id} item={item} />
                  ))}
                </div>
              ) : activeTab === 'Três Poderes' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ITENS_TRES_PODERES.map((item) => (
                    <VideoaulasEspeciaisCard key={item.id} item={item} />
                  ))}
                </div>
              ) : q.trim() && state.buscaAulas.length > 0 ? (
                <div className="space-y-4">
                  {filteredAreas.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs uppercase font-bold text-white/50 tracking-wider">
                        Disciplinas correspondentes
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredAreas.map((r) => (
                          <VideoaulasAreaCard
                            key={r.slug}
                            area={r}
                            onClick={handleAreaClick}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <p className="text-xs uppercase font-bold text-white/50 tracking-wider">
                      Videoaulas encontradas ({state.buscaAulas.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {state.buscaAulas.slice(0, 30).map((aula) => (
                        <VideoaulasAulaResultCard key={aula.videoId} aula={aula} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : filteredAreas.length === 0 ? (
                <div className="text-center py-16 text-white/50 text-sm space-y-3">
                  <p>Nenhuma videoaula encontrada para "{q}".</p>
                  {q && (
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition cursor-pointer"
                    >
                      Limpar filtro
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredAreas.map((r) => (
                    <VideoaulasAreaCard
                      key={r.slug}
                      area={r}
                      onClick={handleAreaClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <VideoaulasBottomNav />

      <VideoaulasDesempenhoSheet
        open={state.showDesempenho}
        onClose={() => state.setShowDesempenho(false)}
        horasTotais={horasAssistidas}
      />
    </div>
  );
};
