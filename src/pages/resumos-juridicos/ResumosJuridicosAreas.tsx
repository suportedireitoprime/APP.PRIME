import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Search, X } from "lucide-react";
import ShapeGrid from "@/components/ui/ShapeGrid";
import ResumosHero from "@/components/resumos/ResumosHero";
import ResumosContinuarCard from "@/components/resumos/ResumosContinuarCard";
import { useResumosAreasData } from "@/components/resumos/hooks/useResumosAreasData";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { getDisciplinaVisualTheme } from "@/lib/disciplinasTheme";
import { ResumosAreaChips } from "@/components/resumos/home/ResumosAreaChips";
import { ResumosAreaCard } from "@/components/resumos/home/ResumosAreaCard";
import { ResumosTemaCard } from "@/components/resumos/home/ResumosTemaCard";
import { resetGlobalScroll } from "@/lib/scrollUtils";

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
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-7 sm:mt-8 space-y-6">
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
                Toque em uma matéria para abrir os temas e resumos completos.
              </p>
            </div>
          </div>

          {/* Campo de Busca Rápida Idêntico a Audiobooks */}
          <div className="relative">
            <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar matéria, tema ou resumo…"
              className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#141416] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-emerald-500/60 transition-colors shadow-sm"
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
                <div className="space-y-3">
                  {filteredAreas.map((r, index) => (
                    <ResumosAreaCard
                      key={r.area}
                      areaRow={r}
                      index={index}
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
              <div className="space-y-3">
                {filteredTemas.map((tema, index) => (
                  <ResumosTemaCard
                    key={tema}
                    tema={tema}
                    index={index}
                    coverUrl={activeAreaCover}
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
