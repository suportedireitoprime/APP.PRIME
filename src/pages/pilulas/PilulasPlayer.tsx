import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, List } from 'lucide-react';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { usePilulasPlayer } from '@/contexts/PilulasPlayerContext';
import Threads from '@/components/ui/Threads';
import GrafoOverlay from '@/components/vademecum/GrafoOverlay';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import { usePilulaData } from './hooks/usePilulaData';
import { PilulaArtwork } from './components/PilulaArtwork';
import { PilulaControls } from './components/PilulaControls';
import { PilulaExtraActions } from './components/PilulaExtraActions';
import { motion } from 'framer-motion';

export default function PilulasPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { 
    livro: globalLivro, 
    tocar, 
    isPlaying, 
    togglePlay, 
    progress, 
    unifiedDuration, 
    introOverlap, 
    mainDuration, 
    handleSeek,
    phase 
  } = usePilulasPlayer();

  const { loading, livroVisual } = usePilulaData(id, globalLivro, tocar);

  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);

  const { fechar: fecharPlayerGlobal } = useResumoLivroPlayer();
  const featurePilulas = useGatedFeature('pilulas', 'pilulas', { scope: id, refKey: id });

  useEffect(() => {
    fecharPlayerGlobal();
  }, [fecharPlayerGlobal]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const livro = livroVisual || globalLivro;

  if (!livro) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-white/20 mb-4" />
        <h2 className="text-xl font-bold mb-2">Pílula não encontrada</h2>
        <p className="text-white/50 mb-6">O conteúdo solicitado não existe ou foi removido.</p>
        <button
          onClick={() => navigate('/pilulas')}
          className="px-6 py-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          Voltar para Acervo
        </button>
      </div>
    );
  }

  const isThisPlaying = globalLivro?.id === livro.id && isPlaying;

  const handleTogglePlay = () => {
    if (globalLivro?.id !== livro.id) {
      tocar(livro);
    } else {
      togglePlay();
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white overflow-hidden flex flex-col">
      {/* Background Blur */}
      {livro.capa && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={livro.capa}
            alt=""
            className="w-full h-full object-cover opacity-[0.15] blur-3xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-zinc-950/80 to-zinc-950" />
        </div>
      )}

      {/* Threads Animation */}
      <div 
         className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isThisPlaying ? 'opacity-40' : 'opacity-0'}`} 
         style={{ pointerEvents: 'none' }}
      >
        <Threads 
           amplitude={1.2}
           distance={0}
           enableMouseInteraction={false}
           color={[0.8, 0.6, 0.2]} // golden-ish primary color
        />
      </div>

      {/* Header Fixo */}
      <div className="relative z-10 pt-[calc(1.25rem+var(--sai-top))] px-4 pb-4 shrink-0 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white/70" strokeWidth={2.4} />
        </button>
        <div className="flex-1 text-center pr-10">
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
            Pílulas de Áudio
          </span>
        </div>
      </div>

      {/* Main Content (Artwork + Controls) */}
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 pt-4 pb-[calc(2rem+var(--sai-bottom))] no-scrollbar overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center w-full max-w-md mt-4 sm:mt-12 mb-8"
        >
          <PilulaArtwork livro={livro} />
          
          <PilulaExtraActions 
            livro={livro} 
            onOpenGraph={() => setIsGraphOpen(true)} 
            onOpenText={() => setIsTextOpen(true)} 
          />

          {livro.sumarioAudio && livro.sumarioAudio.length > 0 && (
            <div className="w-full max-w-2xl mb-8 relative z-10">
              <div className="flex items-center gap-2 mb-3 px-2">
                <List className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/70">Capítulos</h4>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-2 snap-x">
                {livro.sumarioAudio.map((cap, i) => {
                  const currentPercent = progress / (unifiedDuration || 1);
                  const isActive = currentPercent >= cap.percentage && 
                                   (i === livro.sumarioAudio!.length - 1 || currentPercent < livro.sumarioAudio![i + 1].percentage);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                         const targetMainTime = cap.percentage * (mainDuration || 0);
                         handleSeek(introOverlap + targetMainTime);
                         if (!isThisPlaying) handleTogglePlay();
                      }}
                      className={`shrink-0 snap-start px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                        isActive && phase === 'main'
                          ? 'bg-primary/20 border-primary text-primary' 
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {cap.titulo}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <PilulaControls 
            livro={livro}
            isThisPlaying={isThisPlaying}
            progress={progress}
            unifiedDuration={unifiedDuration}
            handleSeek={handleSeek}
            onTogglePlay={handleTogglePlay}
          />
        </motion.div>
      </div>

      {featurePilulas.gateNode}
      
      {/* Grafo Overlay */}
      {livro?.isCP && (
        <GrafoOverlay 
          open={isGraphOpen} 
          onClose={() => setIsGraphOpen(false)} 
          tabelaNome="vade_mecum_artigos"
          leiNome="Código Penal"
          artigoNumero={livro.numero}
          artigoTexto={livro.sobre}
          preloadedGraphData={livro.audio_grafo}
        />
      )}

      {/* Sheet Lei Seca */}
      <Sheet open={isTextOpen} onOpenChange={setIsTextOpen}>
        <SheetContent side="bottom" className="rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto bg-card border-t border-white/10 pb-[calc(var(--sai-bottom,env(safe-area-inset-bottom,0px))+1.5rem)]">
          <div className="max-w-xl mx-auto space-y-6 pt-2 pb-6">
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-2xl font-bold text-foreground">
                {livro?.titulo}
              </SheetTitle>
              <p className="text-muted-foreground font-medium">{livro?.autor}</p>
            </SheetHeader>
            <div className="pt-4">
              <div className="prose prose-sm prose-invert w-full max-w-none prose-p:leading-relaxed text-foreground/90">
                {livro?.sobre?.split('\n').map((paragrafo: string, index: number) => (
                  <p key={index} className="mb-4 text-lg">
                    {paragrafo}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
