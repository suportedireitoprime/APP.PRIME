import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ShapeGrid from "@/components/ui/ShapeGrid";
import ResumosHero from "@/components/resumos/ResumosHero";
import { useResumosAreasData } from "@/components/resumos/hooks/useResumosAreasData";
import { ResumosAreaChips } from "@/components/resumos/home/ResumosAreaChips";
import { ResumosAreaCard } from "@/components/resumos/home/ResumosAreaCard";
import { ResumosTemaCard } from "@/components/resumos/home/ResumosTemaCard";

export default function ResumosJuridicosAreas() {
  const navigate = useNavigate();
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

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white overflow-x-hidden relative flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <ShapeGrid />
      </div>

      <div className="relative z-10 flex flex-col min-h-dvh">
        <ResumosHero
          q={q}
          setQ={setQ}
          totalResumos={totalCalculatedResumos}
          totalAreas={totalCalculatedAreas}
          totalTemas={totalCalculatedTemas}
        />

        <ResumosAreaChips rows={rows} activeTab={activeTab} onSelectTab={setActiveTab} />

        <div className="flex-1 overflow-y-auto px-4 pb-[calc(2rem+var(--sai-bottom))]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-white/50">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : activeTab === "Todos" ? (
            filteredAreas.length === 0 ? (
              <div className="text-center py-16 text-white/50 text-sm space-y-3">
                <p>Nenhuma matéria encontrada para "{q}".</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredAreas.map((r) => (
                  <ResumosAreaCard
                    key={r.area}
                    areaRow={r}
                    onClick={(selectedArea) =>
                      navigate(`/resumos-juridicos/${encodeURIComponent(selectedArea)}`)
                    }
                  />
                ))}
              </div>
            )
          ) : filteredTemas.length === 0 ? (
            <div className="text-center py-16 text-white/50 text-sm space-y-3">
              <p>Nenhum resumo encontrado para "{q}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTemas.map((tema) => (
                <ResumosTemaCard
                  key={tema}
                  tema={tema}
                  onClick={() =>
                    navigate(
                      `/resumos-juridicos/${encodeURIComponent(activeTab)}/${encodeURIComponent(tema)}`,
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
