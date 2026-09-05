import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import AreaHeroPanel from '@/components/aprender/AreaHeroPanel';
import TemaRow from '@/components/aprender/TemaRow';
import TemaAulasSheet from '@/components/aprender/TemaAulasSheet';
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
import { Sparkles, Lock } from 'lucide-react';
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
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const initial = slug ? getCachedAprenderArea(slug, user?.id ?? null) : undefined;
  const [data, setData] = useState<AprenderAreaData | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);
  const [temaAberto, setTemaAberto] = useState<{ modulo: ModuloRow; numero: number } | null>(null);

  const [searchParams] = useSearchParams();
  const moduloIdParam = searchParams.get('moduloId');

  useEffect(() => {
    if (!data || !moduloIdParam) return;
    const idx = data.modulos.findIndex((m) => m.id === moduloIdParam);
    if (idx >= 0) {
      setTemaAberto({ modulo: data.modulos[idx], numero: idx + 1 });
    }
  }, [data, moduloIdParam]);

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



  const mobileHeader = <PageHeader title={area?.nome ?? 'Aprender'} onBack={() => navigate('/aprender')} />;
  const temaAulas = temaAberto ? aulas.filter((a) => a.modulo_id === temaAberto.modulo.id) : [];

  return (
    <DesktopPageLayout
      wide
      activeId="aprender"
      title={area?.nome ?? 'Aprender'}
      subtitle={area?.descricao ?? 'Trilhas de estudo'}
      mobileHeader={mobileHeader}
    >
      {/* Fundo ShapeGrid (padrão oficial do app / igual Pílulas) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShapeGrid
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.05)"
          hoverFillColor="rgba(255, 255, 255, 0.1)"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10 w-full 2xl:max-w-[1750px] mx-auto px-3 sm:px-6 lg:px-8 pb-[calc(8.5rem+var(--sai-bottom))]">
        {loading && !data ? (
          <div className="space-y-4 px-4 py-5 sm:px-6">
            <div className="h-44 rounded-2xl bg-muted animate-pulse" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : !area ? (
          <div className="mx-4 my-6 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
            Área não encontrada.
          </div>
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
                        onClick={() => setTemaAberto({ modulo: m, numero: i + 1 })}
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

      {temaAberto && (
        <TemaAulasSheet
          open={!!temaAberto}
          onOpenChange={(v) => !v && setTemaAberto(null)}
          numero={temaAberto.numero}
          titulo={temaAberto.modulo.titulo}
          aulas={temaAulas}
          progresso={progresso}
        />
      )}
    </DesktopPageLayout>
  );
};

export default AprenderArea;
