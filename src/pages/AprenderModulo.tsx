import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Footprints, Home } from 'lucide-react';
import { shortenAreaName } from '@/lib/areaNameShortener';
import { prefetchAprenderAula } from '@/lib/aprenderAulaPrefetch';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';

export type ModuloDetalhe = {
  id: string;
  titulo: string;
  resumo: string | null;
  ordem: number;
  areaId: string;
  areaNome: string;
  areaSlug: string;
};

export type AulaItem = {
  id: string;
  titulo: string;
  objetivo: string | null;
  duracaoMin: number;
  ordem: number;
  status: string;
  concluida?: boolean;
  pct?: number;
};

const AprenderModulo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { moduloId } = useParams<{ moduloId: string }>();
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const routeState = location.state as {
    modulo?: { id: string; titulo: string; resumo: string | null; ordem: number; area_id?: string };
    area?: { id: string; nome: string; slug: string };
  } | undefined;

  const [modulo, setModulo] = useState<ModuloDetalhe | null>(() => {
    if (routeState?.modulo) {
      return {
        id: routeState.modulo.id,
        titulo: routeState.modulo.titulo,
        resumo: routeState.modulo.resumo,
        ordem: routeState.modulo.ordem,
        areaId: routeState.area?.id ?? routeState.modulo.area_id ?? '',
        areaNome: routeState.area?.nome ?? 'Direito',
        areaSlug: routeState.area?.slug ?? 'geral',
      };
    }
    return null;
  });
  const [aulas, setAulas] = useState<AulaItem[]>([]);
  const [loading, setLoading] = useState(!routeState?.modulo);

  useEffect(() => {
    if (!moduloId) return;
    let cancelled = false;

    (async () => {
      try {
        if (!modulo) setLoading(true);

        // 1. Fetch modulo + area info com fallback robusto
        let rawMod: any = null;
        let areaData: any = null;

        const { data: joinData } = await supabase
          .from('aprender_modulos')
          .select('id, titulo, resumo, ordem, area_id, aprender_areas(id, nome, slug)')
          .eq('id', moduloId)
          .maybeSingle();

        if (joinData) {
          rawMod = joinData;
          const relArea = (joinData as any).aprender_areas;
          areaData = Array.isArray(relArea) ? relArea[0] : relArea;
        } else {
          const { data: simpleMod } = await supabase
            .from('aprender_modulos')
            .select('id, titulo, resumo, ordem, area_id')
            .eq('id', moduloId)
            .maybeSingle();
          if (simpleMod) rawMod = simpleMod;
        }

        if (!areaData && rawMod?.area_id) {
          const { data: a } = await supabase
            .from('aprender_areas')
            .select('id, nome, slug')
            .eq('id', rawMod.area_id)
            .maybeSingle();
          if (a) areaData = a;
        }

        if (cancelled) return;

        if (rawMod) {
          const modInfo: ModuloDetalhe = {
            id: rawMod.id,
            titulo: rawMod.titulo,
            resumo: rawMod.resumo,
            ordem: rawMod.ordem,
            areaId: rawMod.area_id,
            areaNome: areaData?.nome ?? routeState?.area?.nome ?? 'Direito',
            areaSlug: areaData?.slug ?? routeState?.area?.slug ?? 'geral',
          };
          setModulo(modInfo);
        }

        // 2. Fetch aulas for this modulo
        const { data: rawAulas } = await supabase
          .from('aprender_aulas')
          .select('id, titulo, objetivo, duracao_est_min, ordem, status')
          .eq('modulo_id', moduloId)
          .eq('status', 'published')
          .order('ordem');

        // 3. Fetch progress for current user if logged in
        const concluidasSet = new Set<string>();
        if (uid && rawAulas?.length) {
          const aulaIds = rawAulas.map((a) => a.id);
          const { data: progData } = await supabase
            .from('aprender_progresso_aula')
            .select('aula_id, concluida_em')
            .eq('user_id', uid)
            .in('aula_id', aulaIds);

          ((progData as any[]) ?? []).forEach((p) => {
            if (p.concluida_em) concluidasSet.add(p.aula_id);
          });
        }

        const aulasMapeadas: AulaItem[] = (rawAulas ?? []).map((a) => ({
          id: a.id,
          titulo: a.titulo,
          objetivo: a.objetivo,
          duracaoMin: a.duracao_est_min || 15,
          ordem: a.ordem,
          status: a.status,
          concluida: concluidasSet.has(a.id),
        }));

        if (!cancelled) {
          setAulas(aulasMapeadas);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [moduloId, uid]);

  const totalAulas = aulas.length;
  const concluidasCount = aulas.filter((a) => a.concluida).length;
  const pctConcluido = totalAulas > 0 ? Math.round((concluidasCount / totalAulas) * 100) : 0;
  const areaCurta = modulo ? shortenAreaName(modulo.areaNome) : 'Matéria';

  const handleVoltar = () => {
    haptic.light();
    if (modulo?.areaSlug) {
      navigate(`/aprender/area/${modulo.areaSlug}`);
    } else {
      navigate('/aprender');
    }
  };

  const homeButton = (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        haptic.light();
        navigate('/aprender');
      }}
      aria-label="Ir para o início do Aprender"
      className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-muted flex items-center justify-center shrink-0 active:scale-95 transition-transform touch-manipulation select-none cursor-pointer"
    >
      <Home className="w-6 h-6 sm:w-7 sm:h-7 text-foreground" strokeWidth={2.2} />
    </button>
  );

  const mobileHeader = (
    <PageHeader
      title={modulo?.titulo ?? 'Trilha do Tópico'}
      onBack={handleVoltar}
      rightAction={homeButton}
    />
  );

  return (
    <DesktopPageLayout activeId="aprender" mobileHeader={mobileHeader} title={modulo?.titulo ?? 'Trilha do Tópico'}>
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

      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-6 pb-20 pt-2 px-3 sm:px-6">
        {/* Botão de Voltar Desktop */}
        <div className="hidden sm:flex items-center justify-between">
          <button
            type="button"
            onClick={handleVoltar}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para {areaCurta}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              haptic.light();
              navigate('/aprender');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Início Aprender</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-44 rounded-3xl bg-muted animate-pulse" />
            <div className="h-20 rounded-2xl bg-muted animate-pulse" />
            <div className="h-20 rounded-2xl bg-muted animate-pulse" />
          </div>
        ) : !modulo ? (
          <div className="text-center p-8 rounded-2xl border border-border bg-card">
            <p className="text-sm font-semibold text-muted-foreground">Tópico não encontrado.</p>
          </div>
        ) : (
          <>
            {/* 🔴 Painel Vermelho Hero com Progresso */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-brand-gradient border border-white/25 shadow-[0_12px_28px_-6px_rgba(225,29,72,0.4)] p-6 sm:p-8 text-white space-y-4"
            >
              {modulo.areaSlug === 'direito-penal' && (
                <img
                  src="/images/gamificacao/direito_penal_prisao_vazado.webp"
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                  className="pointer-events-none absolute -right-4 -bottom-4 w-[160px] sm:w-[200px] h-[160px] sm:h-[200px] object-contain opacity-25 select-none z-0"
                />
              )}

              <div className="flex items-center justify-between gap-3 relative z-10">
                <span className="px-3 py-1 rounded-full bg-black/40 border border-white/20 text-xs font-normal uppercase tracking-wider">
                  {areaCurta}
                </span>
                <span className="text-xs font-normal bg-black/40 px-3 py-1 rounded-full border border-white/10">
                  {totalAulas} {totalAulas === 1 ? 'aula' : 'aulas'} na trilha
                </span>
              </div>

              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-normal font-sans tracking-tight text-white leading-tight">
                  {modulo.titulo}
                </h1>
                {modulo.resumo && (
                  <p className="text-xs sm:text-sm text-white/80 mt-1.5 line-clamp-2 max-w-2xl font-normal">
                    {modulo.resumo}
                  </p>
                )}
              </div>

              {/* Barra de Progresso do Tópico */}
              <div className="space-y-1.5 pt-2 relative z-10">
                <div className="flex items-center justify-between text-xs font-normal">
                  <span className="text-white/90">Progresso no Tópico</span>
                  <span className="text-white">{concluidasCount} de {totalAulas} concluídas ({pctConcluido}%)</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(pctConcluido, totalAulas > 0 ? 6 : 0)}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* 📍 Trilha em Linha do Tempo (Timeline Trail) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-primary" />
                  <span>Aulas em Trilha ({totalAulas})</span>
                </h2>
              </div>

              {aulas.length === 0 ? (
                <div className="p-6 rounded-2xl border border-border bg-card/60 text-center text-muted-foreground text-xs">
                  Aulas deste tópico em breve!
                </div>
              ) : (
                <div className="relative space-y-4 ml-3 sm:ml-4">
                  {aulas.map((aula, idx) => {
                    const isNext = !aula.concluida && (idx === 0 || aulas[idx - 1]?.concluida);

                    return (
                      <motion.div
                        key={aula.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 sm:gap-4"
                      >
                        {/* Nó da Linha do Tempo — alinhado com flex */}
                        <div
                          className={cn(
                            'w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center text-xs font-extrabold shrink-0 transition-all shadow-md',
                            aula.concluida
                              ? 'bg-primary text-primary-foreground border-primary'
                              : isNext
                              ? 'bg-primary/20 text-primary border-primary animate-pulse'
                              : 'bg-card text-muted-foreground border-border/80'
                          )}
                        >
                          {aula.concluida ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        {/* Card da Aula */}
                        <button
                          type="button"
                          onClick={() => {
                            try { haptic.light(); } catch {}
                            navigate(`/aprender/aula/${aula.id}`, {
                              state: {
                                aulaTitulo: aula.titulo,
                                moduloTitulo: modulo?.titulo,
                                areaSlug: modulo?.areaSlug,
                              },
                            });
                          }}
                          onPointerEnter={() => prefetchAprenderAula(aula.id)}
                          className={cn(
                            'flex-1 min-w-0 flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border transition-all text-left group shadow-sm active:scale-[0.99] cursor-pointer select-none',
                            isNext
                              ? 'border-primary/60 bg-card hover:border-primary shadow-primary/5'
                              : aula.concluida
                              ? 'border-border/60 bg-card/70 hover:border-primary/40'
                              : 'border-border/50 bg-card/40 hover:border-primary/30'
                          )}
                        >
                          {/* Ícone vazado — circular e maior */}
                          {modulo?.areaSlug === 'direito-penal' && (
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 bg-white/5 border border-white/10 overflow-hidden">
                              <img
                                src="/images/gamificacao/direito_penal_prisao_vazado.webp"
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                className="w-11 h-11 sm:w-12 sm:h-12 object-contain opacity-75 group-hover:opacity-90 transition-opacity select-none pointer-events-none"
                              />
                            </div>
                          )}

                          <div className="min-w-0 flex-1 py-0.5">
                            <h3 className="text-sm sm:text-base font-normal font-sans text-foreground break-words leading-snug group-hover:text-primary transition-colors">
                              {aula.titulo}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-1">
                            {aula.concluida && (
                              <span className="text-[10px] sm:text-[11px] font-normal text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                                Concluída
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DesktopPageLayout>
  );
};

export default AprenderModulo;
