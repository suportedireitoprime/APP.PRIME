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
  Play, Check, Lock, Filter, SlidersHorizontal, Sparkles, 
  ChevronRight, ArrowLeft, BookOpen, Layers, Award, Shield, User
} from 'lucide-react';
import { useTrackArea } from "@/hooks/useTrackArea";
import { getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { CANONICAL_AREA_TOPICS } from '@/data/canonicalAreaTopics';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { getAllProgressoArea, TopicoProgresso } from '@/lib/questoesTrilhaProgress';
import QuestoesFiltroSheet, { FILTRO_KEY, FILTRO_VAZIO } from '@/components/questoes/QuestoesFiltroSheet';
import GalaxyBackground from '@/components/questoes/GalaxyBackground';

// ── CAPAS DE LIVROS CLÁSSICOS & JURÍDICOS (PADRÃO DRUNO) ──
import capaDosDelitos from '@/assets/covers/dos_delitos_e_das_penas_manual.jpg';
import capaVigiarEPunir from '@/assets/covers/vigiar_e_punir_nascimento_da_prisao_manual.jpg';
import capaCpArtigos from '@/assets/covers/cp_artigos_v2.webp';
import capaOProcesso from '@/assets/covers/o_processo_manual.jpg';
import capaTeoriaPura from '@/assets/covers/teoria_pura_do_direito_manual.jpg';
import capaVademecumJudge from '@/assets/covers/vademecum-judge.webp';
import capaAdvogadosTribunal from '@/assets/covers/hero-advogados-tribunal.webp';
import capaSocratesThemis from '@/assets/covers/socrates-themis-hero.webp';
import capaALutaPeloDireito from '@/assets/covers/a_luta_pelo_direito_manual.webp';
import capaOEspiritoDasLeis from '@/assets/covers/o_espirito_das_leis_manual.webp';
import capaHistoriaLegislacao from '@/assets/covers/historia-da-legislacao.webp';
import capaFundamentosDaLei from '@/assets/covers/fundamentos-da-lei.webp';
import capaEstruturaEstado from '@/assets/covers/estrutura-do-estado.webp';
import capaEticaNicomaco from '@/assets/covers/etica_a_nicomaco_manual.jpg';
import capaOPrincipe from '@/assets/covers/o_principe_manual.jpg';
import capaAcessoJustica from '@/assets/covers/acesso_a_justica_manual.jpg';
import capaSobreLiberdade from '@/assets/covers/sobre_a_liberdade_manual.webp';
import capaExploradoresCavernas from '@/assets/covers/o_caso_dos_exploradores_de_cavernas_manual.jpg';

const CURATED_BOOK_COVERS = [
  capaDosDelitos,
  capaVigiarEPunir,
  capaCpArtigos,
  capaOProcesso,
  capaTeoriaPura,
  capaVademecumJudge,
  capaAdvogadosTribunal,
  capaSocratesThemis,
  capaALutaPeloDireito,
  capaOEspiritoDasLeis,
  capaHistoriaLegislacao,
  capaFundamentosDaLei,
  capaEstruturaEstado,
  capaEticaNicomaco,
  capaOPrincipe,
  capaAcessoJustica,
  capaSobreLiberdade,
  capaExploradoresCavernas,
];

interface TrilhaItem {
  key: string;
  titulo: string;
  ordemStr: string;
  badgeLabel: string;
  displayTotal: number;
  displayConcluidas: number;
  displayPct: number;
  coverImage: string;
  isConcluido: boolean;
  isEmAndamento: boolean;
  isBloqueado: boolean;
  onClick: () => void;
}

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
        state: { modulo: found, area: data.area ? { ...data.area, slug: (data.area as any)?.slug ?? slug } : undefined, aulas: moduloAulas, tab: activeTab },
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

  // Posicionamento serpenteante em X na trilha (padrão Druno: esquerda, centro, direita, centro...)
  const getOffsetPercent = (index: number) => {
    const cycle = index % 4;
    switch (cycle) {
      case 0: return 28; // Esquerda
      case 1: return 45; // Centro-esquerda
      case 2: return 72; // Direita
      case 3: return 50; // Centro
      default: return 50;
    }
  };

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
        
        {/* ── Barra Superior com Botão de Filtros Rápidos ── */}
        <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-2xl bg-[#17122B]/80 border border-white/10 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={goBack}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-xs sm:text-sm font-bold uppercase tracking-wider text-white truncate">
                {effectiveAreaName || area?.nome || 'Direito'}
              </p>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">
                {totalRespondidasArea} / {totalQuestoesArea} questões ({progressoPctArea}%)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              setFiltroAberto(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#F97316] hover:bg-[#EA580C] shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all shrink-0 active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TRILHA ESPACIAL DRUNO COM LIVROS 3D SOBRE PEDESTAIS
        ════════════════════════════════════════════════════════════════ */}
        <div className="relative w-full py-6 select-none">
          
          {/* Pista Central Serpenteante (SVG Road contínua que desce conectando os nós) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="road-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {itemsToRender.map((item, idx) => {
              if (idx === itemsToRender.length - 1) return null;
              const y1 = idx * 220 + 110;
              const y2 = (idx + 1) * 220 + 110;
              const x1 = getOffsetPercent(idx);
              const x2 = getOffsetPercent(idx + 1);
              const midY = (y1 + y2) / 2;

              return (
                <g key={`road-${idx}`}>
                  {/* Pista Asfaltada Translúcida */}
                  <path
                    d={`M ${x1}% ${y1} C ${x1}% ${midY}, ${x2}% ${midY}, ${x2}% ${y2}`}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeWidth="36"
                    strokeLinecap="round"
                  />

                  {/* Linha Guia Pontilhada Central (Neon Laranja até o nó atual, depois cinza pontilhada) */}
                  <path
                    d={`M ${x1}% ${y1} C ${x1}% ${midY}, ${x2}% ${midY}, ${x2}% ${y2}`}
                    fill="none"
                    stroke={item.isConcluido || item.isEmAndamento ? "#F97316" : "rgba(255, 255, 255, 0.2)"}
                    strokeWidth="3"
                    strokeDasharray="8 8"
                    strokeLinecap="round"
                    filter={item.isConcluido || item.isEmAndamento ? "url(#road-glow)" : undefined}
                  />
                </g>
              );
            })}
          </svg>

          {/* Nós da Trilha: Livros 3D sobre Pedestais */}
          <div className="relative z-10 flex flex-col space-y-24 sm:space-y-28">
            {itemsToRender.map((item, idx) => {
              const xPercent = getOffsetPercent(idx);
              const isFirstInModule = idx === 0 || idx === 3 || idx === 7 || idx === 12;

              let moduleLabel = '';
              if (idx === 0) moduleLabel = 'MÓDULO 1: TEORIA GERAL DO CRIME';
              else if (idx === 3) moduleLabel = 'MÓDULO 2: PENAS & CONDUTA';
              else if (idx === 7) moduleLabel = 'MÓDULO 3: CRIMES EM ESPÉCIE';
              else if (idx === 12) moduleLabel = 'MÓDULO 4: LEGISLAÇÃO ESPECIAL';

              return (
                <div key={item.key} className="w-full relative flex flex-col items-center">
                  
                  {/* ── DIVISOR DE FASE / DATA (IGUAL DRUNO: 9 DE NOV. – 15 DE NOV.) ── */}
                  {isFirstInModule && (
                    <div className="w-full flex items-center justify-center gap-3 my-6 pointer-events-none">
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      <span className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-300 bg-[#161228]/90 px-3.5 py-1 rounded-full border border-white/10 shadow-sm">
                        {moduleLabel}
                      </span>
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                  )}

                  {/* Contêiner do Nó posicionado em X */}
                  <div 
                    className="relative flex flex-col items-center cursor-pointer transition-transform duration-300 active:scale-95 group"
                    style={{
                      marginLeft: `${(xPercent - 50) * 1.6}%`,
                    }}
                    onClick={() => {
                      try { haptic.impact(); } catch {}
                      setLivroSelecionado(item);
                    }}
                  >
                    {/* ── BALÃO FLUTUANTE "CONTINUAR" / "INICIAR" (PADRÃO DRUNO) ── */}
                    {item.isEmAndamento && (
                      <div className="absolute -top-12 z-30 flex flex-col items-center animate-bounce">
                        <div className="px-4 py-1.5 rounded-full bg-[#181126] border-2 border-[#F97316] text-[#F97316] font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.8)] backdrop-blur-md">
                          CONTINUAR
                        </div>
                        {/* Cauda do balão apontando para o livro */}
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#F97316]" />
                      </div>
                    )}

                    {/* ── AVATAR DO USUÁRIO AO LADO DO NÓ ATUAL (IGUAL DRUNO) ── */}
                    {item.isEmAndamento && (
                      <div className="absolute -left-16 sm:-left-20 top-6 z-30 flex flex-col items-center pointer-events-none animate-pulse">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#F97316] to-[#A855F7] shadow-[0_0_20px_rgba(249,115,22,0.7)]">
                          <div className="w-full h-full rounded-full bg-[#1C1433] flex items-center justify-center overflow-hidden border border-white/30">
                            {user?.user_metadata?.avatar_url ? (
                              <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-6 h-6 text-amber-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── LIVRO 3D EM PÉ (DIMENSÕES & PERSPECTIVA DO DRUNO) ── */}
                    <div className="relative w-[82px] xs:w-[94px] sm:w-[105px] h-[120px] xs:h-[138px] sm:h-[154px] rounded-xl z-20 transition-all duration-300 group-hover:-translate-y-2">
                      
                      {/* Efeito 3D das Páginas Físicas na Lateral Direita */}
                      <div 
                        className="absolute top-1.5 bottom-1.5 -right-2 w-2 rounded-r-[3px] bg-gradient-to-r from-amber-50 to-zinc-200 border-r border-t border-b border-black/40 shadow-sm pointer-events-none z-0"
                        style={{
                          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)'
                        }}
                      />

                      {/* Efeito 3D da Lombada à Esquerda */}
                      <div className="absolute top-0 bottom-0 left-0 w-2.5 rounded-l-xl bg-gradient-to-r from-black/60 to-transparent pointer-events-none z-20" />

                      {/* Capa Principal do Livro */}
                      <div 
                        className={cn(
                          "relative w-full h-full rounded-xl overflow-hidden border transition-all duration-300 shadow-2xl flex flex-col justify-between p-2",
                          item.isEmAndamento
                            ? "border-[#F97316] shadow-[0_0_25px_rgba(249,115,22,0.6)]"
                            : item.isConcluido
                            ? "border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                            : "border-white/20 bg-zinc-900/90 opacity-75 grayscale-[40%]"
                        )}
                        style={{ backgroundColor: '#130F24' }}
                      >
                        {/* Imagem de Capa do Livro */}
                        <img 
                          src={item.coverImage} 
                          alt={item.titulo} 
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        />

                        {/* Overlay escuro de contraste */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

                        {/* Brilho diagonal laminado */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

                        {/* Topo da Capa: Badge de Número */}
                        <div className="relative z-10 flex items-center justify-between w-full">
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-black/70 text-white border border-white/20">
                            #{item.ordemStr}
                          </span>
                        </div>

                        {/* Centro da Capa: Botão Play Branco / Cadeado / Check */}
                        <div className="relative z-10 my-auto flex items-center justify-center">
                          {item.isConcluido ? (
                            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-emerald-300">
                              <Check className="w-5 h-5 stroke-[3]" />
                            </div>
                          ) : item.isEmAndamento ? (
                            <div className="w-10 h-10 rounded-full bg-white text-[#F97316] flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.9)] transition-transform duration-300 group-hover:scale-110">
                              <Play className="w-5 h-5 fill-current translate-x-0.5" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-black/70 text-white/80 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                              <Lock className="w-4 h-4 text-purple-300" />
                            </div>
                          )}
                        </div>

                        {/* Rodapé da Capa: Questões */}
                        <div className="relative z-10 text-center">
                          <span className="text-[9px] font-extrabold text-white/95 px-1 py-0.5 rounded bg-black/60">
                            {item.displayTotal} q.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── PEDESTAL 3D ELÍPTICO SOB O LIVRO (PADRÃO DRUNO) ── */}
                    <div className="relative -mt-4 w-32 xs:w-36 sm:w-40 h-8 xs:h-9 z-10 pointer-events-none flex items-center justify-center">
                      <div 
                        className={cn(
                          "w-full h-full rounded-[50%] border transition-all duration-300",
                          item.isEmAndamento
                            ? "bg-gradient-to-b from-[#EA580C] to-[#9A3412] border-[#F97316] shadow-[0_0_30px_rgba(249,115,22,0.8)]"
                            : item.isConcluido
                            ? "bg-gradient-to-b from-emerald-600 to-emerald-950 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                            : "bg-gradient-to-b from-[#251E3D] to-[#120E22] border-white/10 shadow-lg"
                        )}
                      />
                    </div>

                    {/* ── RÓTULO ABAIXO DO PEDESTAL (IGUAL DRUNO: SEG., 9) ── */}
                    <div className="mt-1.5 text-center max-w-[140px] sm:max-w-[160px] space-y-0.5">
                      <p 
                        className={cn(
                          "font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[11px] sm:text-xs font-extrabold uppercase tracking-wider",
                          item.isEmAndamento ? "text-[#F97316]" : item.isConcluido ? "text-emerald-400" : "text-zinc-400"
                        )}
                      >
                        {item.badgeLabel}
                      </p>
                      <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[12px] sm:text-[13px] font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                        {item.titulo}
                      </p>
                      <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[10px] text-zinc-400">
                        {item.displayConcluidas}/{item.displayTotal} resolvidas
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MODAL DE DETALHES DO LIVRO AO TOCAR NA TRILHA (DRUNO SHEET)
      ════════════════════════════════════════════════════════════════ */}
      {livroSelecionado && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div 
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#161228] border border-white/15 p-6 shadow-2xl space-y-5 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              {/* Miniatura 3D do Livro */}
              <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 border-2 border-white/30 shadow-xl">
                <img src={livroSelecionado.coverImage} alt={livroSelecionado.titulo} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                <div className="absolute bottom-1 left-1.5 text-[10px] font-black text-white">
                  #{livroSelecionado.ordemStr}
                </div>
              </div>

              <div className="space-y-1.5 min-w-0 flex-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/40">
                  {livroSelecionado.badgeLabel}
                </span>
                <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-base sm:text-lg font-bold text-white leading-snug">
                  {livroSelecionado.titulo}
                </p>
                <p className="text-xs text-zinc-400">
                  {livroSelecionado.displayTotal} questões oficiais comentadas
                </p>
                <div className="flex items-center gap-2 pt-1 text-xs font-bold text-emerald-400">
                  <Check className="w-4 h-4" />
                  <span>{livroSelecionado.displayConcluidas} resolvidas ({livroSelecionado.displayPct}%)</span>
                </div>
              </div>
            </div>

            {/* Ações do Modal */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setLivroSelecionado(null);
                  livroSelecionado.onClick();
                }}
                className="w-full py-3.5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(249,115,22,0.6)] transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Começar Tema</span>
              </button>

              <button
                type="button"
                onClick={() => setLivroSelecionado(null)}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sheet de Filtro da Área */}
      <QuestoesFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        disciplinaFixa={effectiveAreaName || area?.nome || 'Direito'}
        onAplicar={() => {
          setFiltroAberto(false);
          navigate('/questoes/praticar?filtro=1');
        }}
      />
    </DesktopPageLayout>
  );
};

export default QuestoesArea;
