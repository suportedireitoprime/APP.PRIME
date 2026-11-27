import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Loader2, Search, ChevronRight } from "lucide-react";
import ResumosHero from "@/components/resumos/ResumosHero";
import ResumosContinuarCard from "@/components/resumos/ResumosContinuarCard";
import { useResumosAreasData } from "@/components/resumos/hooks/useResumosAreasData";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { getDisciplinaVisualTheme } from "@/lib/disciplinasTheme";
import { ResumosAreaChips } from "@/components/resumos/home/ResumosAreaChips";
import { ResumosSearchSheet } from "@/components/resumos/ResumosSearchSheet";
import ResumosBreadcrumbTimeline, { getMetodoLabel } from "@/components/resumos/ResumosBreadcrumbTimeline";
import { resetGlobalScroll } from "@/lib/scrollUtils";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/nativeHaptics";

export default function ResumosJuridicosAreas() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const metodo = searchParams.get("metodo") || "";
  const metodoQuery = metodo ? `?metodo=${encodeURIComponent(metodo)}` : "";
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
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

  const activeAreaCover = useMemo(() => {
    if (activeTab === "Todos") return undefined;
    const visualTheme = getDisciplinaVisualTheme(activeTab);
    const coverObj = getAreaCover(activeTab);
    return visualTheme?.fundoAssetUrl || coverObj?.cover;
  }, [activeTab]);

  useEffect(() => {
    resetGlobalScroll();
  }, []);

  return (
    <div className="min-h-dvh bg-[#09090B] text-white relative overflow-x-hidden pb-[calc(7rem+var(--sai-bottom,0px))]">
      {/* Painel Hero Minimalista estilo Questões */}
      <ResumosHero
        totalResumos={totalCalculatedResumos}
        totalAreas={totalCalculatedAreas}
        totalTemas={totalCalculatedTemas}
      />

      {/* Conteúdo Principal com Margens Laterais e Layout Fluido */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-5 sm:mt-6 space-y-5">
        {/* Linha do tempo com setas */}
        <ResumosBreadcrumbTimeline
          steps={[
            { label: getMetodoLabel(metodo) },
            { label: activeTab === "Todos" ? "Matérias" : activeTab },
          ]}
        />

        {/* Banner Continuar Estudando Dinâmico */}
        <ResumosContinuarCard />

        {/* ======================================================== */}
        {/* SEÇÃO DO ACERVO NO FORMATO LISTA DE AUDIOAULAS (SEM CARROSSEL) */}
        {/* ======================================================== */}
        <section className="pt-2 space-y-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="min-w-0 flex-1">
              <h2 className="font-sans text-white text-[17px] sm:text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1.5 h-5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.65)] shrink-0" />
                <span className="truncate">
                  {activeTab === "Todos" ? "Matérias de Resumos" : activeTab}
                </span>
              </h2>
              <p className="font-sans text-white/60 text-[12px] sm:text-[12.5px] leading-snug ml-3">
                Acervo completo de temas e tópicos organizados.
              </p>
            </div>
          </div>

          {/* Campo de Busca Rápida: estilo verde idêntico ao padrão de Audioaulas */}
          <div
            onClick={() => setSearchSheetOpen(true)}
            className="relative cursor-pointer group"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            <input
              type="text"
              readOnly
              placeholder="Buscar matéria, tema ou tópico"
              className="w-full rounded-2xl border border-emerald-500/35 bg-emerald-500/10 hover:border-emerald-500/55 hover:bg-emerald-500/15 py-3.5 pl-11 pr-11 text-sm sm:text-base text-white placeholder:text-zinc-400 outline-none transition-all focus:border-emerald-400 focus:bg-emerald-500/20 focus:ring-2 focus:ring-emerald-500/25 shadow-sm cursor-pointer"
            />
          </div>

          {/* Abas e Chips de Filtragem de Matérias */}
          <ResumosAreaChips rows={rows} activeTab={activeTab} onSelectTab={setActiveTab} />

          {/* Conteúdo da Lista de Matérias (idêntico à lista de Audioaulas: vertical, sem progresso) */}
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
                <div className="space-y-2.5 py-2">
                  {filteredAreas.map((r, index) => {
                    const basePath = location.pathname.startsWith('/mapas-mentais') ? '/mapas-mentais' : '/resumos-juridicos';
                    return (
                      <button
                        key={r.area}
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          navigate(`${basePath}/${encodeURIComponent(r.area)}${metodoQuery}`);
                        }}
                        className="w-full group flex items-center gap-3.5 p-4 rounded-2xl bg-zinc-900/75 border border-white/10 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all text-left cursor-pointer active:scale-[0.98]"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-[15px] font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                            {r.area}
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {r.total} {r.total === 1 ? 'resumo' : 'resumos'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    );
                  })}
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
              <div className="space-y-2.5 py-2">
                {filteredTemas.map((tema, index) => {
                  const basePath = location.pathname.startsWith('/mapas-mentais') ? '/mapas-mentais' : '/resumos-juridicos';
                  return (
                    <button
                      key={tema}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        navigate(`${basePath}/${encodeURIComponent(activeTab)}/${encodeURIComponent(tema)}${metodoQuery}`);
                      }}
                      className="w-full group flex items-center gap-3.5 p-4 rounded-2xl bg-zinc-900/75 border border-white/10 hover:border-emerald-500/40 hover:bg-zinc-900 transition-all text-left cursor-pointer active:scale-[0.98]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-[15px] font-bold text-white leading-snug line-clamp-2 group-hover:text-emerald-300 transition-colors">
                          {tema}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Painel de Busca Dedicado de 90% da tela que surge de baixo para cima com Caminho e Prévia */}
      <ResumosSearchSheet
        open={searchSheetOpen}
        onClose={() => setSearchSheetOpen(false)}
        onSelectAreaTab={(area) => setActiveTab(area)}
      />
    </div>
  );
}
