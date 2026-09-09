import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import {
  AprenderAreaData,
  getCachedAprenderArea,
  hydrateAprenderAreaCache,
  loadAprenderArea,
} from '@/lib/aprenderAreaLoader';
import { BookOpenText } from 'lucide-react';
import { useTrackArea } from "@/hooks/useTrackArea";
import { areaIconFor, getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { haptic } from '@/lib/nativeHaptics';

const AprenderArea = () => {
  useTrackArea("aprender_area_aberta");
  const navigate = useNavigate();
  const goBack = () => navigate('/aprender');
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
      loadAprenderArea(slug, uid).then((d) => {
        if (!cancelled) setData(d);
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
  const progresso = data?.progresso ?? {};

  const modulosOrdenados = useMemo(() => {
    return [...modulos].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  }, [modulos]);

  const areaVisual = useMemo(() => areaIconFor(slug || area?.slug || area?.nome), [slug, area]);
  const AreaIconComp = areaVisual?.Icon;
  const palette = useMemo(() => getAreaThemePalette(slug || area?.slug || area?.nome), [slug, area]);

  const mobileHeader = (
    <PageHeader 
      title={area?.nome ?? 'Aprender'} 
      subtitle="Trilha de Aprendizado" 
      onBack={goBack} 
    />
  );

  return (
    <DesktopPageLayout
      wide
      activeId="aprender"
      title={area?.nome ?? 'Aprender'}
      subtitle="Trilha de Aprendizado"
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

      <div className="relative z-10 w-full max-w-[700px] mx-auto px-3.5 sm:px-6 pb-20 pt-4 min-w-0 overflow-x-hidden box-border">
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
            {/* Top Bar Selecione o Módulo */}
            <div className="flex items-center justify-between mb-4 w-full min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpenText className="w-5 h-5 shrink-0" style={{ color: palette.primary }} />
                <h2 className="text-xs sm:text-sm font-normal font-sans uppercase tracking-widest text-white truncate">Selecione o Módulo</h2>
              </div>
              <span 
                className="text-[10px] sm:text-xs font-normal font-sans uppercase tracking-wider px-2.5 py-0.5 rounded-full border shrink-0"
                style={{
                  backgroundColor: palette.badgeBg,
                  borderColor: palette.badgeBorder,
                  color: palette.primary,
                }}
              >
                {area.nome}
              </span>
            </div>

            {modulosOrdenados.length === 0 ? (
              <div className="mx-auto max-w-md my-12 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                <BookOpenText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
                <p className="text-sm font-semibold text-foreground mb-1">Nenhum módulo publicado ainda</p>
                <p className="text-xs text-muted-foreground">Os módulos de {area.nome} estarão disponíveis em breve.</p>
              </div>
            ) : (
              /* Trilha em Linha do Tempo Elegante (Alternando Esquerda/Direita) */
              <div className="relative py-6 w-full min-w-0 max-w-full overflow-hidden">
                {/* Linha vertical central luminosa */}
                <div 
                  className="absolute left-1/2 top-6 bottom-6 w-[2px] -translate-x-1/2 rounded-full z-0 pointer-events-none"
                  style={{ background: palette.lineGradient }}
                />

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
                          className={`absolute top-1/2 w-[calc(50%-1.25rem)] h-[1.5px] border-b-2 border-dashed -translate-y-1/2 z-0 pointer-events-none ${
                            isLeft ? 'left-1/2' : 'right-1/2'
                          }`} 
                          style={{ borderColor: palette.dashedBorder }}
                        />

                        {/* Nó Central (Milestone da Linha do Tempo) */}
                        <div 
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full transition-transform w-8 h-8 sm:w-9 sm:h-9 border-4 border-[#0D0D0D] text-white scale-105"
                          style={{
                            backgroundColor: palette.primary,
                            boxShadow: palette.nodeBoxShadow,
                          }}
                        >
                          <span className="text-[11px] sm:text-xs font-semibold font-sans">
                            {numStr}
                          </span>
                          <span 
                            className="absolute inset-0 rounded-full animate-ping -z-10 pointer-events-none"
                            style={{ backgroundColor: palette.pingBg }}
                          />
                        </div>

                        {/* Card no formato de Capa de Livro */}
                        <div
                          onClick={() => {
                            try { haptic.light(); } catch {}
                            navigate(`/aprender/modulo/${m.id}`, { state: { modulo: m, area: data?.area } });
                          }}
                          className="relative w-[46%] sm:w-[45%] max-w-[225px] min-h-[175px] sm:min-h-[195px] h-auto p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden select-none box-border transition-all duration-300 z-10 border border-white/25 cursor-pointer active:scale-[0.97] group"
                          style={{
                            background: palette.cardGradient,
                            boxShadow: palette.shadow,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = palette.hoverShadow;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = palette.shadow;
                          }}
                        >
                          {/* Marca d'água de fundo */}
                          {slug === 'direito-penal' ? (
                            <img
                              src="/images/gamificacao/direito_penal_prisao_vazado.webp"
                              alt=""
                              aria-hidden="true"
                              loading="lazy"
                              decoding="async"
                              className="pointer-events-none absolute -right-3 -bottom-2 w-[115px] sm:w-[130px] h-[115px] sm:h-[130px] object-contain opacity-25 group-hover:opacity-35 transition-opacity duration-300 z-0 select-none"
                            />
                          ) : AreaIconComp ? (
                            <AreaIconComp
                              className="pointer-events-none absolute -right-3 -bottom-2 w-[115px] sm:w-[130px] h-[115px] sm:h-[130px] opacity-15 group-hover:opacity-25 transition-opacity duration-300 z-0 select-none text-white"
                              strokeWidth={1.2}
                              aria-hidden="true"
                            />
                          ) : null}

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
            )}
          </>
        )}
      </div>
    </DesktopPageLayout>
  );
};

export default AprenderArea;
