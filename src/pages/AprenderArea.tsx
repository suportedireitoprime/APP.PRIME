import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useGoBack } from '@/hooks/useGoBack';
import AreaHeroPanel from '@/components/aprender/AreaHeroPanel';
import TemaRow from '@/components/aprender/TemaRow';
import {
  AprenderAreaData,
  ModuloRow,
  getCachedAprenderArea,
  hydrateAprenderAreaCache,
  invalidateAprenderArea,
  loadAprenderArea,
} from '@/lib/aprenderAreaLoader';
import GeracaoAnimacaoOverlay from '@/components/vademecum/overlays/GeracaoAnimacaoOverlay';
import {
  PASSOS_GERACAO,
  RANGES_GERACAO,
  useGerarAulaDemanda,
} from '@/hooks/useGerarAulaDemanda';
import { Sparkles, Lock, BookOpenText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTrackArea } from "@/hooks/useTrackArea";


type Flashcard = {
  id: string;
  frente: string;
  verso: string;
  explicacao?: string;
  exemplo?: string;
  dica?: string;
};

const AprenderArea = () => {
  useTrackArea("aprender_area_aberta");
  const navigate = useNavigate();
  const goBack = useGoBack('/aprender');
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const initial = slug ? getCachedAprenderArea(slug, user?.id ?? null) : undefined;
  const [data, setData] = useState<AprenderAreaData | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);

  const [searchParams] = useSearchParams();
  const moduloIdParam = searchParams.get('moduloId');

  useEffect(() => {
    if (!data || !moduloIdParam) return;
    const found = data.modulos.find((m) => m.id === moduloIdParam);
    if (found) {
      navigate(`/aprender/modulo/${moduloIdParam}`, {
        replace: true,
        state: { modulo: found, area: data.area },
      });
    }
  }, [data, moduloIdParam, navigate]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    const uid = user?.id ?? null;
    const hit = getCachedAprenderArea(slug, uid);
    if (hit) {
      setData(hit);
      setLoading(false);
      // Ainda dispara loadAprenderArea para revalidação em background
      loadAprenderArea(slug, uid).then((d) => {
        if (!cancelled) setData(d);
      });
      return;
    }
    // Sem cache em memória: tenta IndexedDB antes de mostrar loading
    (async () => {
      const persisted = await hydrateAprenderAreaCache(slug, uid);
      if (cancelled) return;
      if (persisted) {
        setData(persisted);
        setLoading(false);
      } else {
        setLoading(true);
      }
      const fresh = await loadAprenderArea(slug, uid);
      if (cancelled) return;
      setData(fresh);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, user?.id]);

  const area = data?.area ?? null;
  const modulos = data?.modulos ?? [];
  const aulas = data?.aulas ?? [];
  const aulasPreparo = data?.aulasPreparo ?? {};
  const progresso = data?.progresso ?? {};
  const pendentes = data?.pendentes ?? [];

  const aulaIds = useMemo(() => aulas.map((a) => a.id), [aulas]);

  const stats = useMemo(() => {
    const totalAulas = aulas.length;
    const concluidas = aulas.filter((a) => progresso[a.id]?.concluida).length;
    const emPreparoTotal =
      Object.values(aulasPreparo).reduce((s, n) => s + n, 0) + (data?.pendentes?.length ?? 0);
    const disponiveis = Math.max(0, totalAulas - concluidas);
    const somaPct = aulas.reduce((s, a) => s + (progresso[a.id]?.concluida ? 100 : progresso[a.id]?.pct || 0), 0);
    const progressoPct = totalAulas ? somaPct / totalAulas : 0;
    return { totalAulas, concluidas, disponiveis, emPreparo: emPreparoTotal, progressoPct };
  }, [aulas, progresso, aulasPreparo, data?.pendentes]);

  const modulosVisiveis = useMemo(
    () => modulos.filter((m) => aulas.some((a) => a.modulo_id === m.id) || (aulasPreparo[m.id] ?? 0) > 0),
    [modulos, aulas, aulasPreparo],
  );

  const isDireitoPenal = slug === 'direito-penal';

  const modulosOrdenados = useMemo(() => {
    const list = isDireitoPenal ? modulos : modulosVisiveis;
    return [...list].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }, [modulos, modulosVisiveis, isDireitoPenal]);

  const { gerar, gerando, passo, titulo: tituloGerando } = useGerarAulaDemanda();


  const recarregarArea = async () => {
    if (!slug) return;
    invalidateAprenderArea(slug, user?.id ?? null);
    const fresh = await loadAprenderArea(slug, user?.id ?? null);
    setData(fresh);
  };

  const gerarAula = async (sumarioId: string, tituloAula: string) => {
    if (!area) return;
    const res = await gerar(sumarioId, area.id, tituloAula);
    if (!res) return;
    await recarregarArea();
    navigate(`/aprender/aula/${res.aulaId}`);
  };

  // Geração 100% sob demanda: nada é gerado sem o aluno tocar na aula.



  const mobileHeader = (
    <PageHeader 
      title={area?.nome ?? 'Aprender'} 
      subtitle={isDireitoPenal ? "Trilha de Aprendizado" : (area?.descricao ?? 'Trilhas de estudo')} 
      onBack={goBack} 
    />
  );

  return (
    <DesktopPageLayout
      wide
      activeId="aprender"
      title={area?.nome ?? 'Aprender'}
      subtitle={area?.descricao ?? 'Trilhas de estudo'}
      mobileHeader={mobileHeader}
    >
      {/* Fundo ShapeGrid (padrão oficial do app / início do aplicativo) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0D0D0D]">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.04)"
          hoverFillColor="rgba(255, 255, 255, 0.08)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className={isDireitoPenal ? "relative z-10 w-full max-w-[700px] mx-auto px-3.5 sm:px-6 pb-20 pt-4 min-w-0 overflow-x-hidden box-border" : "relative z-10 w-full 2xl:max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8 pb-[calc(8.5rem+var(--sai-bottom))]"}>
        {loading && !data ? (
          <div className="space-y-4 px-4 py-5 sm:px-6">
            <div className="h-44 rounded-2xl bg-muted animate-pulse" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : !area ? (
          <div className="mx-4 my-6 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Área não encontrada.
          </div>
        ) : isDireitoPenal ? (
          <>
            {/* Top Bar Selecione o Módulo (Padrão Caça-Palavras) */}
            <div className="flex items-center justify-between mb-4 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpenText className="w-5 h-5 text-primary shrink-0" />
                <h2 className="text-xs sm:text-sm font-normal font-sans uppercase tracking-widest text-white truncate">Selecione o Módulo</h2>
              </div>
              <span className="text-[10px] sm:text-xs font-normal font-sans text-zinc-400 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 shrink-0">
                Direito Penal
              </span>
            </div>

            {/* Trilha em Linha do Tempo Elegante (Alternando Esquerda/Direita - Padrão Caça-Palavras) */}
            <div className="relative py-6 w-full min-w-0 max-w-full overflow-hidden">
              {/* Linha vertical central luminosa */}
              <div className="absolute left-1/2 top-6 bottom-6 w-[2px] -translate-x-1/2 bg-gradient-to-b from-primary via-primary/40 to-zinc-800/80 rounded-full z-0 pointer-events-none" />

              <div className="space-y-6 sm:space-y-8 w-full min-w-0">
                {modulosOrdenados.map((m, i) => {
                  const isLeft = i % 2 === 0;
                  const list = aulas.filter((a) => a.modulo_id === m.id);
                  const total = list.length;
                  const concluidas = list.filter((a) => progresso[a.id]?.concluida).length;
                  const somaPct = list.reduce(
                    (s, a) => s + (progresso[a.id]?.concluida ? 100 : progresso[a.id]?.pct || 0),
                    0,
                  );
                  const pct = total ? Math.round(somaPct / total) : 0;
                  const numStr = String(m.ordem || i + 1).padStart(2, '0');

                  return (
                    <div
                      key={m.id}
                      className={`relative z-10 flex w-full items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
                    >
                      {/* Linha conectando o nó central ao card */}
                      <div 
                        className={`absolute top-1/2 w-[calc(50%-1.25rem)] h-[1.5px] border-b-2 border-dashed -translate-y-1/2 z-0 pointer-events-none border-primary/60 ${
                          isLeft ? 'left-1/2' : 'right-1/2'
                        }`} 
                      />

                      {/* Nó Central (Milestone da Linha do Tempo) */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-transform w-8 h-8 sm:w-9 sm:h-9 bg-primary border-4 border-[#0D0D0D] text-white shadow-[0_0_16px_rgba(225,29,72,0.85)] scale-105">
                        <span className="text-[11px] sm:text-xs font-semibold font-sans">
                          {numStr}
                        </span>
                        <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping -z-10 pointer-events-none" />
                      </div>

                      {/* Card no formato de Capa de Livro (Padrão Caça-Palavras) */}
                      <div
                        onClick={() => {
                          navigate(`/aprender/modulo/${m.id}`, { state: { modulo: m, area: data?.area } });
                        }}
                        className="relative w-[46%] sm:w-[45%] max-w-[225px] min-h-[175px] sm:min-h-[195px] h-auto p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden select-none box-border transition-all duration-300 z-10 bg-brand-gradient border border-white/25 shadow-[0_12px_28px_-6px_rgba(225,29,72,0.4)] hover:shadow-[0_16px_32px_-6px_rgba(225,29,72,0.55)] cursor-pointer active:scale-[0.97] group"
                      >
                        {/* Imagem vazada de Direito Penal (marca d'água de alta definição alinhada à direita) */}
                        <img
                          src="/images/gamificacao/direito_penal_prisao_vazado.webp"
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          decoding="async"
                          className="pointer-events-none absolute -right-3 -bottom-2 w-[115px] sm:w-[130px] h-[115px] sm:h-[130px] object-contain opacity-25 group-hover:opacity-35 transition-opacity duration-300 z-0 select-none"
                        />

                        {/* Cabeçalho da Capa: Módulo */}
                        <div className="flex items-center justify-between gap-1 z-[1] w-full">
                          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-normal px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-md bg-black/40 text-white border border-white/15">
                            Módulo {numStr}
                          </span>
                        </div>

                        {/* Centro da Capa: Título do Tema Sem Negrito e Sem Abreviações */}
                        <div className="my-auto py-2 z-[1] w-full">
                          <h3 className="font-sans font-normal text-[12.5px] sm:text-[14px] leading-snug break-words text-white drop-shadow-sm">
                            {m.titulo}
                          </h3>
                        </div>

                        {/* Rodapé da Capa: Progresso */}
                        <div className="z-[1] pt-1.5 border-t border-white/15 w-full">
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-normal text-white/90 mb-1">
                              <span>{concluidas > 0 ? `${concluidas}/${total} concluídas` : `${total} ${total === 1 ? 'aula' : 'aulas'}`}</span>
                              <span className="font-normal font-sans">{pct}%</span>
                            </div>
                            <div className="w-full bg-black/35 h-1.5 rounded-full overflow-hidden border border-white/20">
                              <div 
                                className="h-full bg-white rounded-full transition-all duration-500 shadow-sm"
                                style={{ width: `${Math.max(pct, total > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <>
            <AreaHeroPanel
              slug={slug}
              nome={area.nome}
              totalTemas={modulosVisiveis.length}
              totalAulas={stats.totalAulas}
              concluidas={stats.concluidas}
              disponiveis={stats.disponiveis}
              emPreparo={stats.emPreparo}
              progressoPct={stats.progressoPct}
            />

            <h2 className="mb-3 mt-6 px-1 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground sm:px-0">
              Temas
            </h2>

            {modulosVisiveis.length === 0 ? (
              <div className="mx-0 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                Nenhum tema publicado ainda nesta área.
              </div>
            ) : (
              <motion.ul 
                className="space-y-3 px-0 pb-6"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
                }}
              >
                {modulosVisiveis.map((m, i) => {
                  const list = aulas.filter((a) => a.modulo_id === m.id);
                  const total = list.length;
                  const somaPct = list.reduce(
                    (s, a) => s + (progresso[a.id]?.concluida ? 100 : progresso[a.id]?.pct || 0),
                    0,
                  );
                  const pct = total ? somaPct / total : 0;
                  return (
                    <motion.li key={m.id}>
                      <TemaRow
                        numero={i + 1}
                        titulo={m.titulo}
                        totalAulas={total}
                        emPreparo={aulasPreparo[m.id] ?? 0}
                        pct={pct}
                        onClick={() => navigate(`/aprender/modulo/${m.id}`, { state: { modulo: m, area: data?.area } })}
                      />
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}

            {pendentes.length > 0 && (
              <div className="px-0 pb-8">
                <h2 className="mb-1 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Aulas a gerar
                </h2>
                <p className="mb-3 text-[12px] text-muted-foreground">
                  Toque para gerar na hora — a aula fica salva com flashcards e questões.
                </p>
                <ul className="space-y-2.5">
                  {pendentes.map((p, i) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        disabled={gerando}
                        onClick={() => gerarAula(p.id, p.titulo)}
                        className="flex w-full items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-4 text-left transition-colors hover:bg-accent/40 disabled:opacity-60"
                      >
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          {gerando ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Aula {String(aulas.length + i + 1).padStart(2, '0')}
                          </span>
                          <span className="mt-1 block line-clamp-2 text-[15px] leading-snug text-foreground">
                            {p.titulo}
                          </span>
                        </span>
                        <span className="shrink-0 self-center rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                          Gerar
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>


      <GeracaoAnimacaoOverlay
        open={gerando}
        titulo={tituloGerando || 'Gerando sua aula'}
        steps={PASSOS_GERACAO}
        stepIdx={passo}
        stepRanges={RANGES_GERACAO}
        estTotalSec={120}
      />
    </DesktopPageLayout>
  );
};

export default AprenderArea;
