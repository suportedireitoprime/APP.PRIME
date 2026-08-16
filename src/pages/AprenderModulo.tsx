import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, Play, Sparkles } from 'lucide-react';
import { shortenAreaName } from '@/lib/areaNameShortener';
import { prefetchAprenderAula } from '@/lib/aprenderAulaPrefetch';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  const { moduloId } = useParams<{ moduloId: string }>();
  const { user } = useAuth();
  const uid = user?.id ?? null;

  const [modulo, setModulo] = useState<ModuloDetalhe | null>(null);
  const [aulas, setAulas] = useState<AulaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moduloId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        // 1. Fetch modulo + area info
        const { data: rawMod, error: errMod } = await supabase
          .from('aprender_modulos')
          .select('id, titulo, resumo, ordem, area_id, aprender_areas(id, nome, slug)')
          .eq('id', moduloId)
          .single();

        if (cancelled || errMod || !rawMod) {
          if (!cancelled) setLoading(false);
          return;
        }

        const areaData = (rawMod as any).aprender_areas;
        const modInfo: ModuloDetalhe = {
          id: rawMod.id,
          titulo: rawMod.titulo,
          resumo: rawMod.resumo,
          ordem: rawMod.ordem,
          areaId: rawMod.area_id,
          areaNome: areaData?.nome ?? 'Direito',
          areaSlug: areaData?.slug ?? 'geral',
        };

        if (!cancelled) setModulo(modInfo);

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

  const mobileHeader = (
    <PageHeader
      title={modulo?.titulo ?? 'Trilha do Tópico'}
      onBack={() => (modulo?.areaSlug ? navigate(`/aprender/area/${modulo.areaSlug}`) : navigate('/aprender'))}
    />
  );

  return (
    <DesktopPageLayout activeId="aprender" mobileHeader={mobileHeader} title={modulo?.titulo ?? 'Trilha do Tópico'}>
      <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 pt-2 px-3 sm:px-6">
        {/* Botão de Voltar Desktop */}
        <button
          onClick={() => (modulo?.areaSlug ? navigate(`/aprender/area/${modulo.areaSlug}`) : navigate('/aprender'))}
          className="hidden sm:inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para {areaCurta}</span>
        </button>

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
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/35 via-primary/15 to-background border border-primary/30 p-6 sm:p-8 text-white shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-extrabold uppercase tracking-wider">
                  {areaCurta}
                </span>
                <span className="text-xs font-extrabold bg-black/30 px-3 py-1 rounded-full border border-white/10">
                  {totalAulas} {totalAulas === 1 ? 'aula' : 'aulas'} na trilha
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white leading-tight">
                  {modulo.titulo}
                </h1>
                {modulo.resumo && (
                  <p className="text-xs sm:text-sm text-white/80 mt-1.5 line-clamp-2 max-w-2xl font-medium">
                    {modulo.resumo}
                  </p>
                )}
              </div>

              {/* Barra de Progresso do Tópico */}
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white/90">Progresso no Tópico</span>
                  <span className="text-white">{pctConcluido}% concluído</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-500 shadow-sm"
                    style={{ width: `${pctConcluido}%` }}
                  />
                </div>
              </div>
            </motion.div>

            {/* 📍 Trilha em Linha do Tempo (Timeline Trail) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Trilha de Aprendizado ({totalAulas} Aulas)</span>
                </h2>
              </div>

              {aulas.length === 0 ? (
                <div className="p-6 rounded-2xl border border-border bg-card/60 text-center text-muted-foreground text-xs">
                  Aulas deste tópico em breve!
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 space-y-4 border-l-2 border-primary/30 ml-3 sm:ml-4">
                  {aulas.map((aula, idx) => {
                    const isNext = !aula.concluida && (idx === 0 || aulas[idx - 1]?.concluida);

                    return (
                      <motion.div
                        key={aula.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative"
                      >
                        {/* Indicador de Nó na Linha do Tempo */}
                        <div
                          className={cn(
                            'absolute -left-[31px] sm:-left-[39px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs font-extrabold transition-all shadow-md',
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

                        {/* Card da Aula na Trilha */}
                        <button
                          onClick={() => navigate(`/aprender/aula/${aula.id}`)}
                          onPointerEnter={() => prefetchAprenderAula(aula.id)}
                          className={cn(
                            'w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all text-left group shadow-sm active:scale-[0.99]',
                            isNext
                              ? 'border-primary/60 bg-card hover:border-primary shadow-primary/5'
                              : aula.concluida
                              ? 'border-border/60 bg-card/70 hover:border-primary/40'
                              : 'border-border/50 bg-card/40 hover:border-primary/30'
                          )}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                                isNext
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                              )}
                            >
                              <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="text-sm sm:text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {aula.titulo}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {aula.objetivo || `${aula.duracaoMin} min de aula interativa`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {aula.concluida ? (
                              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                                Concluída
                              </span>
                            ) : isNext ? (
                              <span className="text-[11px] font-bold text-primary-foreground bg-primary px-2.5 py-1 rounded-full shadow-sm">
                                Iniciar agora
                              </span>
                            ) : null}
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
