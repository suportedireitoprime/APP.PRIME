import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Search, X, Heart } from "lucide-react";
import { toast } from "sonner";
import ShapeGrid from "@/components/ui/ShapeGrid";
import ResumosHero from "@/components/resumos/ResumosHero";
import ResumosContinuarCard from "@/components/resumos/ResumosContinuarCard";
import { useResumosAreasData } from "@/components/resumos/hooks/useResumosAreasData";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { ResumosAreaChips } from "@/components/resumos/home/ResumosAreaChips";
import { ResumosAreaCard } from "@/components/resumos/home/ResumosAreaCard";
import { ResumosTemaCard } from "@/components/resumos/home/ResumosTemaCard";
import { resumosLocal } from "@/lib/resumosLocal";
import { haptic } from "@/lib/nativeHaptics";
import { resetGlobalScroll } from "@/lib/scrollUtils";
import constCover from "@/assets/biblioteca/areas/direito-constitucional.webp";

export default function ResumosJuridicosAreas() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    rows,
    loading,
    q,
    setQ,
    activeTab,
    setActiveTab,
    filteredAreas,
    filteredTemas,
    totalCalculatedResumos,
    totalCalculatedAreas,
    totalCalculatedTemas,
  } = useResumosAreasData();

  const [favAreas, setFavAreas] = useState<Set<string>>(() => {
    return new Set(resumosLocal.favoritos().map((f) => f.area));
  });

  useEffect(() => {
    resetGlobalScroll();
  }, []);

  const toggleFavArea = useCallback((area: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic.impact();
    const isFav = resumosLocal.isFavorito(area);
    if (isFav) {
      resumosLocal.toggleFavorito({ id: area, area, tema: area, subtema: null });
      setFavAreas((prev) => {
        const next = new Set(prev);
        next.delete(area);
        return next;
      });
      toast.info(`"${area}" removido dos favoritos.`);
    } else {
      resumosLocal.toggleFavorito({ id: area, area, tema: area, subtema: null });
      setFavAreas((prev) => {
        const next = new Set(prev);
        next.add(area);
        return next;
      });
      toast.success(`"${area}" adicionado aos favoritos!`);
    }
  }, []);

  // Matérias e áreas com maior demanda jurídica organizadas para a seção "Em Alta"
  const areasEmAlta = useMemo(() => {
    const prioridade = [
      'Direito Constitucional',
      'Direito Penal',
      'Direito Processual Penal',
      'Direito Civil',
      'Direito Processual Civil',
      'Direito Administrativo',
      'Direito do Trabalho',
      'Direito Processual do Trabalho',
      'Direito Tributário',
      'Direitos Humanos',
      'Direito Empresarial',
      'Direito Previdenciário',
      'Direito Ambiental',
      'Direito Eleitoral',
    ];

    if (!rows || rows.length === 0) return [];

    const ordenadas = [...rows].sort((a, b) => {
      const idxA = prioridade.indexOf(a.area);
      const idxB = prioridade.indexOf(b.area);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return b.total - a.total;
    });

    return ordenadas.slice(0, 12);
  }, [rows]);

  // 4 cópias para permitir rolagem contínua infinita sem margem morta na esquerda (padrão Audiobooks e Leis em Alta)
  const loopedAreas = useMemo(() => {
    if (areasEmAlta.length === 0) return [];
    return [
      ...areasEmAlta,
      ...areasEmAlta,
      ...areasEmAlta,
      ...areasEmAlta,
    ];
  }, [areasEmAlta]);

  const carouselScrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Pré-carrega capas das áreas em memória para exibição instantânea a 0ms
  useEffect(() => {
    areasEmAlta.forEach((item) => {
      const coverData = getAreaCover(item.area);
      const url = coverData?.cover || constCover;
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [areasEmAlta]);

  // Centraliza o card específico do carrossel suavemente ou instantaneamente
  const scrollCarouselToIndex = useCallback(
    (idx: number, behavior: ScrollBehavior = "smooth") => {
      const el = carouselScrollerRef.current;
      if (!el) return;
      const child = el.children[idx] as HTMLElement | undefined;
      if (!child) return;
      const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
      el.scrollTo({ left: target, behavior });
      setActiveCarouselIndex(idx);
    },
    [],
  );

  // Inicializa o carrossel centralizado no segundo bloco (sem margem morta na esquerda, padrão Leis em Alta)
  useEffect(() => {
    if (areasEmAlta.length > 0 && !isReady) {
      const initialIndex = areasEmAlta.length;
      setActiveCarouselIndex(initialIndex);
      const timer = setTimeout(() => {
        scrollCarouselToIndex(initialIndex, "instant" as ScrollBehavior);
        setIsReady(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [areasEmAlta.length, isReady, scrollCarouselToIndex]);

  // Escuta a rolagem e realiza o teleporte silencioso de 0ms nas bordas para loop infinito contínuo
  const handleCarouselScroll = useCallback(() => {
    const el = carouselScrollerRef.current;
    if (!el) return;

    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const mid = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(mid - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }

    const N = areasEmAlta.length;
    if (N > 0) {
      if (best <= 1) {
        const jumpTo = best + N * 2;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({
            left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2,
            behavior: "auto",
          });
          setActiveCarouselIndex(jumpTo);
          return;
        }
      } else if (best >= loopedAreas.length - 2) {
        const jumpTo = best - N * 2;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({
            left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2,
            behavior: "auto",
          });
          setActiveCarouselIndex(jumpTo);
          return;
        }
      }
    }

    setActiveCarouselIndex(best);
  }, [areasEmAlta.length, loopedAreas.length]);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white relative overflow-x-hidden pb-[calc(7rem+var(--sai-bottom,0px))]">
      {/* Fundo Padrão ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
        <ShapeGrid />
      </div>

      {/* Painel Hero Estilo Audiobooks / Vade Mecum */}
      <ResumosHero
        totalResumos={totalCalculatedResumos}
        totalAreas={totalCalculatedAreas}
        totalTemas={totalCalculatedTemas}
      />

      {/* Conteúdo Principal com Margens Laterais e Layout Fluido */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 space-y-6">
        {/* Banner Continuar Estudando Dinâmico */}
        <ResumosContinuarCard />

        {/* ======================================================== */}
        {/* SEÇÃO EM ALTA (NO LUGAR DE RECOMENDAÇÕES)                */}
        {/* ======================================================== */}
        {areasEmAlta.length > 0 && activeTab === "Todos" && !q && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="min-w-0 flex-1">
                <h3 className="font-sans text-white text-[15px] sm:text-[16px] font-bold flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-1 h-5 rounded-full bg-rose-500 shrink-0" />
                  <span className="truncate">EM ALTA</span>
                </h3>
                <p className="text-white/60 text-[11.5px] sm:text-[12px] leading-snug ml-3 truncate">
                  Matérias e resumos fundamentais para sua formação e concursos
                </p>
              </div>
            </div>

            {/* Carrossel Centralizado e Infinito sem margem morta na esquerda */}
            <div
              ref={carouselScrollerRef}
              onScroll={handleCarouselScroll}
              style={{
                paddingLeft: "calc(50% - 68px)",
                paddingRight: "calc(50% - 68px)",
              }}
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pb-3 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
            >
              {loopedAreas.map((item, idx) => {
                const coverData = getAreaCover(item.area);
                const coverUrl = coverData?.cover || constCover;
                const isFav = favAreas.has(item.area);
                const isActive = activeCarouselIndex === idx;

                return (
                  <div
                    key={`em-alta-${item.area}-${idx}`}
                    onClick={() => {
                      haptic.selection();
                      const basePath = location.pathname.startsWith('/mapas-mentais') ? '/mapas-mentais' : '/resumos-juridicos';
                      navigate(`${basePath}/${encodeURIComponent(item.area)}`);
                    }}
                    className={`snap-center shrink-0 w-[136px] sm:w-[148px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transition-all duration-300 ${
                      isActive
                        ? "opacity-100 z-10"
                        : "opacity-75 z-0 hover:opacity-90"
                    }`}
                  >
                    <div
                      className={`relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 border transform-gpu transition-all duration-300 ${
                        isActive
                          ? "scale-100 border-rose-500/80 shadow-2xl shadow-rose-950/50 ring-2 ring-rose-500/50"
                          : "scale-[0.94] border-white/10 shadow-md group-hover:border-rose-500/40"
                      }`}
                    >
                      {isActive && (
                        <>
                          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500/35 via-rose-600/25 to-rose-500/35 blur-md pointer-events-none animate-pulse" />
                          <div className="absolute inset-0 rounded-2xl ring-2 ring-rose-500/80 pointer-events-none animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                        </>
                      )}

                      <img
                        src={coverUrl}
                        alt={item.area}
                        loading={idx < 6 ? "eager" : "lazy"}
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

                      {/* Botão de Favorito no topo direito */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavArea(item.area, e)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/70 hover:text-rose-400 hover:scale-110 active:scale-90 transition-all z-10 cursor-pointer"
                        aria-label="Favoritar"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${isFav ? "fill-rose-500 text-rose-500" : ""}`}
                        />
                      </button>
                    </div>

                    <p
                      className={`font-sans font-bold text-xs sm:text-[13px] line-clamp-2 mt-2 leading-snug transition-colors ${
                        isActive
                          ? "text-rose-200"
                          : "text-white group-hover:text-rose-300"
                      }`}
                    >
                      {item.area}
                    </p>
                    <p className="text-[10.5px] text-white/50 truncate mt-0.5">
                      {item.total} {item.total === 1 ? "resumo disponível" : "resumos disponíveis"}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Indicador de Bolinhas Minimalista */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {areasEmAlta.map((_, i) => {
                const N = areasEmAlta.length;
                const currentNorm = ((activeCarouselIndex % N) + N) % N;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      const N = areasEmAlta.length;
                      const targetIdx = N + i;
                      scrollCarouselToIndex(targetIdx);
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      currentNorm === i
                        ? "w-5 bg-rose-500 shadow-sm shadow-rose-500/50"
                        : "w-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`Ir para item ${i + 1}`}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* SEÇÃO DO ACERVO NO FORMATO PADRÃO AUDIOBOOKS / BIBLIOTECA*/}
        {/* ======================================================== */}
        <section className="pt-2 space-y-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-rose-400 font-bold">
              ACERVO DE RESUMOS
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1 h-6 rounded-full bg-rose-500" />
              <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                {activeTab === "Todos" ? "Todas as Matérias" : activeTab}
              </h2>
            </div>
            <p className="text-sm text-white/60 mt-1 ml-3 leading-snug">
              Toque em qualquer matéria para abrir os temas e resumos completos.
            </p>
          </div>

          {/* Campo de Busca Rápida Idêntico a Audiobooks */}
          <div className="relative">
            <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar matéria, tema ou resumo…"
              className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#141416] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-500/60 transition-colors shadow-sm"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Abas e Chips de Filtragem de Matérias */}
          <ResumosAreaChips rows={rows} activeTab={activeTab} onSelectTab={setActiveTab} />

          {/* Conteúdo do Grid de Matérias ou Temas */}
          <div className="pt-2">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-white/50">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando resumos...
              </div>
            ) : activeTab === "Todos" ? (
              filteredAreas.length === 0 ? (
                <div className="text-center py-16 text-white/50 text-sm space-y-3">
                  <p>Nenhuma matéria encontrada para "{q}".</p>
                  {q && (
                    <button
                      onClick={() => setQ("")}
                      className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
                    >
                      Limpar filtro
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredAreas.map((r) => (
                    <ResumosAreaCard
                      key={r.area}
                      areaRow={r}
                      onClick={(selectedArea) => {
                        const basePath = location.pathname.startsWith('/mapas-mentais') ? '/mapas-mentais' : '/resumos-juridicos';
                        navigate(`${basePath}/${encodeURIComponent(selectedArea)}`);
                      }}
                    />
                  ))}
                </div>
              )
            ) : filteredTemas.length === 0 ? (
              <div className="text-center py-16 text-white/50 text-sm space-y-3">
                <p>Nenhum resumo encontrado para "{q}".</p>
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTemas.map((tema) => (
                  <ResumosTemaCard
                    key={tema}
                    tema={tema}
                    coverUrl={getAreaCover(activeTab)?.cover}
                    onClick={() => {
                      const basePath = location.pathname.startsWith('/mapas-mentais') ? '/mapas-mentais' : '/resumos-juridicos';
                      navigate(`${basePath}/${encodeURIComponent(activeTab)}/${encodeURIComponent(tema)}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
