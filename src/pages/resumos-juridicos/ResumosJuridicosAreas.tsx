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
import { ResumosSearchSheet } from "@/components/resumos/ResumosSearchSheet";
import { resetGlobalScroll } from "@/lib/scrollUtils";

export default function ResumosJuridicosAreas() {
  const navigate = useNavigate();
  const location = useLocation();
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

      {/* Painel de Busca Dedicado de 90% da tela que surge de baixo para cima com Caminho e Prévia */}
      <ResumosSearchSheet
        open={searchSheetOpen}
        onClose={() => setSearchSheetOpen(false)}
        onSelectAreaTab={(area) => setActiveTab(area)}
      />
    </div>
  );
}
