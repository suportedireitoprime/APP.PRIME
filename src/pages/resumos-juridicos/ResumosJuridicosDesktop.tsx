import ShapeGrid from "@/components/ui/ShapeGrid";
import { useResumosDesktopData } from "@/components/resumos/hooks/useResumosDesktopData";
import { ResumosDesktopColAreas } from "@/components/resumos/desktop/ResumosDesktopColAreas";
import { ResumosDesktopColTemas } from "@/components/resumos/desktop/ResumosDesktopColTemas";
import { ResumosDesktopColSubtemas } from "@/components/resumos/desktop/ResumosDesktopColSubtemas";
import { ResumosDesktopReaderView } from "@/components/resumos/desktop/ResumosDesktopReaderView";
import { ResumosDesktopEmptyState } from "@/components/resumos/desktop/ResumosDesktopEmptyState";

export default function ResumosJuridicosDesktop() {
  const {
    decodedArea,
    decodedTema,
    loadingAreas,
    qArea,
    setQArea,
    filteredAreas,
    loadingTemas,
    qTema,
    setQTema,
    ordemTema,
    setOrdemTema,
    filteredTemas,
    placeholderTextTemas,
    subtemas,
    loadingSubtemas,
    qSubtema,
    setQSubtema,
    ordemSubtema,
    setOrdemSubtema,
    subtemasOrdenados,
    selectedSubtema,
    setSelectedSubtema,
    favoritosGlobais,
    toggleFavorito,
    navigateToArea,
    navigateToTema,
    navigateToHome,
  } = useResumosDesktopData();

  return (
    <div className="flex h-dvh bg-[#0D0D0D] text-white overflow-hidden relative">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.15]">
        <ShapeGrid />
      </div>

      <div className="relative z-10 flex w-full h-full">
        {/* COL 1: Áreas */}
        <ResumosDesktopColAreas
          areas={filteredAreas}
          loadingAreas={loadingAreas}
          qArea={qArea}
          setQArea={setQArea}
          decodedArea={decodedArea}
          onSelectArea={navigateToArea}
          onBackHome={navigateToHome}
        />

        {/* COL 2: Temas */}
        {decodedArea && (
          <ResumosDesktopColTemas
            decodedArea={decodedArea}
            decodedTema={decodedTema}
            temas={filteredTemas}
            loadingTemas={loadingTemas}
            qTema={qTema}
            setQTema={setQTema}
            ordemTema={ordemTema}
            setOrdemTema={setOrdemTema}
            placeholderTextTemas={placeholderTextTemas}
            onSelectTema={navigateToTema}
          />
        )}

        {/* COL 3: Subtemas e Leitor */}
        {decodedTema ? (
          <div className="flex-1 flex flex-col h-full bg-[#0D0D0D]/60 backdrop-blur-sm z-0 relative">
            {!selectedSubtema ? (
              <ResumosDesktopColSubtemas
                decodedTema={decodedTema}
                subtemas={subtemas}
                subtemasOrdenados={subtemasOrdenados}
                loadingSubtemas={loadingSubtemas}
                qSubtema={qSubtema}
                setQSubtema={setQSubtema}
                ordemSubtema={ordemSubtema}
                setOrdemSubtema={setOrdemSubtema}
                favoritosGlobais={favoritosGlobais}
                onSelectSubtema={setSelectedSubtema}
              />
            ) : (
              <ResumosDesktopReaderView
                selectedSubtema={selectedSubtema}
                favoritosGlobais={favoritosGlobais}
                onBack={() => setSelectedSubtema(null)}
                onToggleFavorito={toggleFavorito}
              />
            )}
          </div>
        ) : (
          <ResumosDesktopEmptyState />
        )}
      </div>
    </div>
  );
}
