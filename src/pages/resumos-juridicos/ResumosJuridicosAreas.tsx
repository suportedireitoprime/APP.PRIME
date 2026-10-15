import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Search, X } from "lucide-react";
import ShapeGrid from "@/components/ui/ShapeGrid";
import ResumosHero from "@/components/resumos/ResumosHero";
import { useResumosAreasData } from "@/components/resumos/hooks/useResumosAreasData";
import { getAreaCover } from "@/lib/areasDireitoCovers";
import { ResumosAreaChips } from "@/components/resumos/home/ResumosAreaChips";
import { ResumosAreaCard } from "@/components/resumos/home/ResumosAreaCard";
import { ResumosTemaCard } from "@/components/resumos/home/ResumosTemaCard";
import { haptic } from "@/lib/nativeHaptics";
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

  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    resetGlobalScroll();
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white overflow-x-hidden relative flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <ShapeGrid />
      </div>

      <div className="relative z-10 flex flex-col min-h-dvh">
        <ResumosHero
          totalResumos={totalCalculatedResumos}
          totalAreas={totalCalculatedAreas}
          totalTemas={totalCalculatedTemas}
        />

        <ResumosAreaChips rows={rows} activeTab={activeTab} onSelectTab={setActiveTab} />

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(5.5rem+var(--sai-bottom))]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/50">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
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
      </div>

      {/* Floating Action Button (FAB) de Pesquisa no Canto Inferior Direito */}
      <div className="fixed bottom-[calc(1.5rem+var(--sai-bottom))] right-4 sm:right-6 z-50 flex items-center justify-end">
        {searchOpen ? (
          <div className="flex items-center gap-2 bg-[#141414]/95 backdrop-blur-xl border border-white/15 p-1.5 pl-4 rounded-full shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-200 max-w-[calc(100vw-2rem)] w-[320px] sm:w-[380px]">
            <Search className="w-4 h-4 text-primary shrink-0" strokeWidth={2.2} />
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar tema ou matéria..."
              className="flex-1 bg-transparent text-white font-body text-sm outline-none placeholder:text-white/40"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Limpar pesquisa"
                className="w-7 h-7 grid place-items-center rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setSearchOpen(false);
              }}
              aria-label="Fechar busca"
              className="w-10 h-10 shrink-0 grid place-items-center rounded-full bg-hero-panel text-white shadow-md active:scale-95 transition"
            >
              <X className="w-5 h-5" strokeWidth={2.4} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              setSearchOpen(true);
            }}
            aria-label="Abrir pesquisa de resumos"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-hero-panel text-white shadow-2xl shadow-red-950/80 border border-white/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 group cursor-pointer"
          >
            <Search className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform duration-200" strokeWidth={2.4} />
            {q && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-[#0D0D0D]" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
