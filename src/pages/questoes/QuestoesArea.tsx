import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import {
  AprenderAreaData,
  getCachedAprenderArea,
  hydrateAprenderAreaCache,
  fetchAprenderAreaFromNetwork,
  setCachedModuloData,
} from '@/lib/aprenderAreaLoader';
import { 
  Filter, SlidersHorizontal, Sparkles, 
  ChevronRight, ArrowLeft, BookOpen, Layers, Award, Shield
} from 'lucide-react';
import { useTrackArea } from "@/hooks/useTrackArea";
import { getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { CANONICAL_AREA_TOPICS } from '@/data/canonicalAreaTopics';
import { haptic } from '@/lib/nativeHaptics';
import { lazy, Suspense } from 'react';
import { getAllProgressoArea, TopicoProgresso } from '@/lib/questoesTrilhaProgress';
import { FILTRO_KEY, FILTRO_VAZIO } from '@/lib/questoesFiltro';
import { CURATED_BOOK_COVERS, type TrilhaItem } from '@/lib/questoesCuratedCovers';
import GalaxyBackground from '@/components/questoes/GalaxyBackground';
import QuestoesTrilhaMapa from '@/components/questoes/QuestoesTrilhaMapa';

const QuestoesFiltroSheet = lazy(() => import('@/components/questoes/QuestoesFiltroSheet'));
const QuestaoLivroModal = lazy(() => import('@/components/questoes/QuestaoLivroModal'));

const QuestoesArea = () => {
  useTrackArea("questoes_area_aberta");
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => navigate('/questoes');
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const moduloIdParam = searchParams.get('moduloId');
  const [activeTab] = useState<'questoes'>('questoes');

  const initial = slug ? getCachedAprenderArea(slug, user?.id ?? null) : undefined;
  const [data, setData] = useState<AprenderAreaData | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [filtroAberto, setFiltroAberto] = useState(false);

  // Modal para detalhe do Livro / Tópico selecionado
  const [livroSelecionado, setLivroSelecionado] = useState<TrilhaItem | null>(null);

  useEffect(() => {
    if (!data || !moduloIdParam) return;
    const found = data.modulos.find((m) => m.id === moduloIdParam);
    if (found) {
      const list = data.aulas.filter((a) => a.modulo_id === found.id);
      const moduloAulas = list.map((a) => ({
        id: a.id,
        titulo: a.titulo,
        objetivo: a.objetivo,
        duracaoMin: a.duracao_est_min || 15,
        ordem: a.ordem,
        status: a.status || 'published',
        concluida: !!data.progresso[a.id]?.concluida,
        pct: data.progresso[a.id]?.pct || 0,
      }));

      setCachedModuloData(found.id, user?.id ?? null, {
        modulo: {
          id: found.id,
          titulo: found.titulo,
          resumo: found.resumo,
          ordem: found.ordem,
          areaId: data.area?.id ?? '',
          areaNome: data.area?.nome ?? 'Direito',
          areaSlug: (data.area as any)?.slug ?? slug ?? 'geral',
        },
        aulas: moduloAulas,
      });

      navigate(`/aprender/modulo/${moduloIdParam}?tab=${activeTab}`, {
        replace: true,
        state: { modulo: found, area: data?.area ? { ...data.area, slug: (data.area as any)?.slug ?? slug } : undefined, aulas: moduloAulas, tab: activeTab },
      });
    }
  }, [data, moduloIdParam, activeTab, navigate, user?.id, slug]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const uid = user?.id ?? null;
    const hit = getCachedAprenderArea(slug, uid);
    if (hit) {
      setData(hit);
      setLoading(false);
      fetchAprenderAreaFromNetwork(slug, uid).then((d) => {
        if (!cancelled && d && (d.aulas.length > 0 || !hit.aulas.length)) {
          setData(d);
        }
      }).catch((err) => {
        console.warn(err);
      });
      return;
    }
    (async () => {
      const persisted = await hydrateAprenderAreaCache(slug, uid);
      if (cancelled) return;
      if (persisted) {
        setData(persisted);
        setLoading(false);
      } else {
        setLoading(true);
      }
      const fresh = await fetchAprenderAreaFromNetwork(slug, uid);
      if (cancelled) return;
      setData(fresh);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, user?.id]);

  const area = data?.area ?? null;
  const modulos = data?.modulos ?? [];

  const effectiveAreaName = useMemo(() => {
    if (area?.nome) return area.nome;
    if (!slug) return '';
    const map: Record<string, string> = {
      'direito-civil': 'Direito Civil',
      'direito-penal': 'Direito Penal',
      'direito-constitucional': 'Direito Constitucional',
      'direito-administrativo': 'Direito Administrativo',
      'direito-tributario': 'Direito Tributário',
      'direito-do-trabalho': 'Direito do Trabalho',
      'direito-processual-civil': 'Direito Processual Civil',
      'direito-processual-penal': 'Direito Processual Penal',
      'direito-empresarial': 'Direito Empresarial',
      'direito-ambiental': 'Direito Ambiental',
      'direitos-humanos': 'Direitos Humanos',
      'direito-previdenciario': 'Direito Previdenciário',
      'direito-financeiro': 'Direito Financeiro',
      'direito-desportivo': 'Direito Desportivo',
      'direito-processual-do-trabalho': 'Direito Processual do Trabalho',
      'direito-concorrencial': 'Direito Concorrencial',
      'direito-urbanistico': 'Direito Urbanístico',
      'direito-internacional-publico': 'Direito Internacional Público',
      'direito-internacional-privado': 'Direito Internacional Privado',
      'lei-penal-especial': 'Lei Penal Especial',
      'direito-eleitoral': 'Direito Eleitoral',
      'formacao-complementar': 'Formação Complementar',
      'politicas-publicas': 'Políticas Públicas',
      'pratica-profissional': 'Prática Profissional',
      'portugues': 'Português',
      'revisao-oab': 'Revisão OAB',
      'filosofia-do-direito': 'Filosofia do Direito',
      'teoria-e-filosofia-do-direito': 'Filosofia do Direito',
      'pesquisa-cientifica': 'Pesquisa Científica',
    };
    if (map[slug]) return map[slug];
    return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }, [area?.nome, slug]);

  const modulosOrdenados = useMemo(() => {
    return [...modulos].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }, [modulos]);

  const { data: flashcardsAreasResumo } = useFlashcardsResumoAreas();

  const officialFlashcardArea = useMemo(() => {
    if (!flashcardsAreasResumo || flashcardsAreasResumo.length === 0) {
      return effectiveAreaName;
    }
    const found =
      flashcardsAreasResumo.find((a) => a.slug === slug) ||
      flashcardsAreasResumo.find((a) => a.area.toLowerCase() === (area?.nome || effectiveAreaName).toLowerCase()) ||
      flashcardsAreasResumo.find((a) => slug && (a.slug.includes(slug) || slug.includes(a.slug))) ||
      flashcardsAreasResumo.find((a) => slug && a.area.toLowerCase().includes(slug.replace(/-/g, ' ')));
    return found ? found.area : effectiveAreaName;
  }, [flashcardsAreasResumo, slug, area?.nome, effectiveAreaName]);

  const [progressoLocal, setProgressoLocal] = useState<Record<string, TopicoProgresso>>({});

  useEffect(() => {
    if (slug) {
      setProgressoLocal(getAllProgressoArea(slug));
    }
  }, [slug, location.key]);

  const { data: temasQuestoes, isLoading: loadingQuestoesTemas } = useQuery({
    queryKey: ['area_questoes_temas', officialFlashcardArea, effectiveAreaName, slug],
    queryFn: async () => {
      const candidates = Array.from(
        new Set(
          [
            effectiveAreaName,
            officialFlashcardArea,
            area?.nome,
            slug ? slug.replace(/-/g, ' ') : null,
          ].filter(Boolean) as string[]
        )
      );

      for (const cand of candidates) {
        try {
          const { data: res, error } = await supabase.rpc('questoes_filtro_counts', {
            _disciplinas: [cand],
            _segmentos: null,
            _assuntos: null,
            _anos: null,
            _bancas: null,
          });
          if (!error && res && (res as any).assuntos) {
            const principais: Record<string, number> = {};
            Object.entries((res as any).assuntos).forEach(([raw, count]) => {
              const main = raw.split(' > ')[0].trim();
              principais[main] = (principais[main] || 0) + (Number(count) || 0);
            });
            const list = Object.entries(principais)
              .map(([tema, total]) => ({ tema, total }))
              .sort((a, b) => b.total - a.total);
            if (list.length > 0) return list;
          }
        } catch {}
      }

      if (slug && CANONICAL_AREA_TOPICS[slug]) {
        return CANONICAL_AREA_TOPICS[slug].map((t) => ({
          tema: t,
          total: 25,
        }));
      }

      return [];
    },
    enabled: !!(officialFlashcardArea || effectiveAreaName || slug),
    staleTime: 5 * 60 * 1000,
  });

  const palette = useMemo(() => getAreaThemePalette(slug || area?.nome || (area as any)?.slug || 'geral'), [slug, area]);

  const coverInfo = area ? (getAreaCover(area.nome) || getAreaCover((area as any)?.slug)) : (slug ? getAreaCover(slug) : null);
  const coverUrl = coverInfo?.cover || "/images/gamificacao/deusa_temis_vazada.webp";

  const getTopicCover = (topicTitle: string, index: number): string => {
    const directMatch = getAreaCover(topicTitle)?.cover;
    if (directMatch) return directMatch;
    return CURATED_BOOK_COVERS[index % CURATED_BOOK_COVERS.length] || coverUrl;
  };

  // Itens da Trilha Druno
  const itemsToRender: TrilhaItem[] = useMemo(() => {
    let rawTopics: { titulo: string; total: number }[] = [];

    if (temasQuestoes && temasQuestoes.length > 0) {
      rawTopics = temasQuestoes.map(t => ({ titulo: t.tema, total: t.total || 25 }));
    } else if (slug && CANONICAL_AREA_TOPICS[slug]) {
      rawTopics = CANONICAL_AREA_TOPICS[slug].map(t => ({ titulo: t, total: 25 }));
    } else {
      rawTopics = modulosOrdenados.map((m, idx) => ({
        titulo: m.titulo.replace(/^\d+\.\s*/, ''),
        total: 20
      }));
    }

    // Identifica qual é o primeiro nó ativo (o que está em andamento, ou o primeiro não concluído)
    let primeiroIncompletoIdx = -1;

    const parsed = rawTopics.map((t, idx) => {
      const prog = progressoLocal[t.titulo] || { respondidas: 0, acertos: 0 };
      const numStr = String(idx + 1).padStart(2, '0');
      const displayTotal = t.total || 25;
      const displayConcluidas = prog.respondidas || 0;
      const displayPct = displayTotal > 0 ? Math.min(100, Math.round((displayConcluidas / displayTotal) * 100)) : 0;
      const itemCover = getTopicCover(t.titulo, idx);
      const isConcluido = displayPct >= 100 || (displayConcluidas >= displayTotal && displayTotal > 0);

      if (!isConcluido && primeiroIncompletoIdx === -1) {
        primeiroIncompletoIdx = idx;
      }

      return {
        key: `tema-${t.titulo}-${idx}`,
        titulo: t.titulo,
        ordemStr: numStr,
        badgeLabel: `Tema ${numStr}`,
        displayTotal,
        displayConcluidas,
        displayPct,
        coverImage: itemCover,
        isConcluido,
        isEmAndamento: false,
        isBloqueado: false,
        onClick: () => {
          try { haptic.impact(); } catch {}
          navigate(`/questoes/praticar?area=${encodeURIComponent(effectiveAreaName || area?.nome || 'Direito')}&assunto=${encodeURIComponent(t.titulo)}&areaSlug=${slug || ''}`, {
            state: { from: `/questoes/area/${slug}`, tema: t.titulo }
          });
        },
      };
    });

    if (primeiroIncompletoIdx === -1) primeiroIncompletoIdx = 0;

    return parsed.map((item, idx) => {
      const isEmAndamento = idx === primeiroIncompletoIdx;
      // Permite navegação livre em todos os tópicos, mas marca visualmente os nós seguintes como bloqueados por progressão (estilo Druno)
      const isBloqueado = idx > primeiroIncompletoIdx + 1 && !item.isConcluido;

      return {
        ...item,
        isEmAndamento,
        isBloqueado,
      };
    });
  }, [temasQuestoes, progressoLocal, slug, effectiveAreaName, area?.nome, modulosOrdenados, navigate, coverUrl]);

  const totalQuestoesArea = useMemo(() => {
    return itemsToRender.reduce((acc, t) => acc + (t.displayTotal || 0), 0);
  }, [itemsToRender]);

  const totalRespondidasArea = useMemo(() => {
    return itemsToRender.reduce((acc, t) => acc + (t.displayConcluidas || 0), 0);
  }, [itemsToRender]);

  const progressoPctArea = totalQuestoesArea > 0 ? Math.min(100, Math.round((totalRespondidasArea / totalQuestoesArea) * 100)) : 0;

  // Nó ativo atualmente na trilha Druno
  const activeNode = useMemo(() => {
    return itemsToRender.find(item => item.isEmAndamento) || itemsToRender[0] || null;
  }, [itemsToRender]);

  const titleDisplay = (
    <span className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] font-bold uppercase tracking-wider text-[15px] sm:text-[16px] text-white">
      {officialFlashcardArea || area?.nome || effectiveAreaName}
    </span>
  );

  const mobileHeader = (
    <PageHeader 
      title={titleDisplay} 
      subtitle="Trilha de Questões" 
      onBack={goBack} 
      variant="dark"
    />
  );

  return (
    <DesktopPageLayout
      wide
      activeId="aprender"
      title={officialFlashcardArea || area?.nome || effectiveAreaName}
      subtitle="Trilha de Questões"
      mobileHeader={mobileHeader}
    >
      {/* ── Fundo Cósmico Galáxia com Cometas e Estrelas ── */}
      <GalaxyBackground />

      <div className="relative z-10 w-full max-w-[540px] md:max-w-[640px] mx-auto px-3 sm:px-6 pb-32 pt-2 min-w-0 overflow-x-hidden box-border">
        
        {/* ── Barra Superior com Indicador da Área & Barra de Progresso Oficial ── */}
        <div className="flex flex-col gap-2.5 mb-5 p-3.5 sm:p-4 rounded-2xl bg-[#17122B]/85 border border-white/10 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#E11D48]/20 text-[#FB7185] border border-[#E11D48]/30 shadow-inner shrink-0">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-xs sm:text-sm font-bold uppercase tracking-wider text-white truncate">
                  {effectiveAreaName || area?.nome || 'Direito'}
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-300">
                  {totalRespondidasArea} de {totalQuestoesArea} questões ({progressoPctArea}%)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                try { haptic.selection(); } catch {}
                setFiltroAberto(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#E11D48] to-[#BE123C] hover:from-[#BE123C] hover:to-[#9F1239] shadow-[0_0_18px_rgba(225,29,72,0.6)] transition-all shrink-0 active:scale-95"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Barra de Progresso Oficial da Área (Estilo Questões) */}
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(progressoPctArea, 1)}%`,
                background: 'linear-gradient(90deg, #E11D48, #FB7185)',
                boxShadow: '0 0 10px rgba(225, 29, 72, 0.8)',
              }}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TRILHA ESPACIAL DRUNO COM LIVROS 3D SOBRE PEDESTAIS
        ════════════════════════════════════════════════════════════════ */}
        <QuestoesTrilhaMapa
          items={itemsToRender}
          avatarUrl={user?.user_metadata?.avatar_url}
          onSelectItem={setLivroSelecionado}
        />
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MODAL DE DETALHES DO LIVRO AO TOCAR NA TRILHA (DRUNO SHEET)
      ════════════════════════════════════════════════════════════════ */}
      {livroSelecionado && (
        <Suspense fallback={null}>
          <QuestaoLivroModal
            livro={livroSelecionado}
            onClose={() => setLivroSelecionado(null)}
          />
        </Suspense>
      )}

      {/* Sheet de Filtro da Área */}
      {filtroAberto && (
        <Suspense fallback={null}>
          <QuestoesFiltroSheet
            aberto={filtroAberto}
            onFechar={() => setFiltroAberto(false)}
            disciplinaFixa={effectiveAreaName || area?.nome || 'Direito'}
            onAplicar={() => {
              setFiltroAberto(false);
              navigate('/questoes/praticar?filtro=1');
            }}
          />
        </Suspense>
      )}
    </DesktopPageLayout>
  );
};

export default QuestoesArea;
