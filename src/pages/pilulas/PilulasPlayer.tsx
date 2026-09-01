import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, BookOpen, AlertCircle, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import { useResumoLivroPlayer } from '@/contexts/ResumoLivroPlayerContext';
import { usePilulasPlayer } from '@/contexts/PilulasPlayerContext';
import { directImg } from '@/lib/cdnImg';
import Threads from '@/components/ui/Threads';
import GrafoOverlay from '@/components/vademecum/GrafoOverlay';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Network } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { toast } from 'sonner';
import { useGatedFeature } from '@/hooks/useGatedFeature';

export default function PilulasPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

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

  const [livroVisual, setLivroVisual] = useState<LivroNormalizado | null>(globalLivro);

  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isTextOpen, setIsTextOpen] = useState(false);

  // Parar o player global de resumo livro se ele estiver tocando
  const { fechar: fecharPlayerGlobal } = useResumoLivroPlayer();
  const featurePilulas = useGatedFeature('pilulas', 'pilulas', { scope: id, refKey: id });

  useEffect(() => {
    fecharPlayerGlobal();
  }, [fecharPlayerGlobal]);

  useEffect(() => {
    async function fetchPilula() {
      if (!id) return;
      
      // Se a pílula global já for a que queremos, só atualizamos a visual e não fazemos fetch.
      // Wait, we always want to fetch or use cache if it's the first time visiting this page directly.
      try {
        const cacheKey = `pilula_data_v2_${id}`;
        const cached = await get(cacheKey);
        
        let normalizado: LivroNormalizado | null = cached || null;

        if (!normalizado) {
          const searchParams = new URLSearchParams(window.location.search);
          const type = searchParams.get('type');

          if (type === 'cp') {
             const { data, error } = await supabase
              .from('vade_mecum_artigos')
              .select('id, numero, texto, audio_pilula_url, audio_transcricao, audio_grafo')
              .eq('id', id)
              .single();
              
             if (error) throw error;
             
             normalizado = {
                id: data.id,
                titulo: `Artigo ${data.numero}`,
                autor: 'Código Penal',
                capa: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_square.jpg'),
                audioResumoUrl: data.audio_pilula_url,
                analiseDetalhada: data.texto,
                sobre: data.texto,
                numero: data.numero,
                audio_grafo: data.audio_grafo,
                transcricaoAudio: data.audio_transcricao,
                isCP: true
             } as any;
          } else {
            const classicosCol = COLECOES.find((c) => c.id === 'classicos');
            if (classicosCol) {
              const { data, error } = await supabase
                .from(classicosCol.table as any)
                .select(classicosCol.select)
                .eq('id', id)
                .single();

              if (!error && data) {
                normalizado = normalizeLivro(data, classicosCol);
              }
            }
          }
        }

        if (normalizado) {
          if (normalizado.audioResumoUrl) {
            await set(cacheKey, normalizado);
          }
          setLivroVisual(normalizado);
          
          if (!normalizado.audioResumoUrl) {
             toast.error('O áudio desta pílula ainda não está disponível.');
          } else {
             // Inicia a reprodução no contexto global
             if (globalLivro?.id !== normalizado.id) {
               tocar(normalizado);
             }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar pílula:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPilula();
  }, [id]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const livro = livroVisual || globalLivro;

  if (!livro) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center p-4 text-center">
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

  // Verifica se o livro no contexto global é o mesmo desta tela para sincronizar os controles.
  // Se for diferente (ex: usuário abriu uma pílula X, mas o player tá tocando Y), usamos isPlaying false visualmente,
  // mas o certo é que ao entrar nesta página ele dará play na pílula X (por conta do useEffect fetchPilula).
  const isThisPlaying = globalLivro?.id === livro.id && isPlaying;

  return (
    <div className="fixed inset-0 bg-[#0D0D0D] text-white overflow-hidden flex flex-col">
      {/* Background Blur */}
      {livro.capa && (
        <div className="absolute inset-0 z-0">
          <img
            src={livro.capa}
            alt=""
            className="w-full h-full object-cover opacity-[0.15] blur-3xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D]/50 via-[#0D0D0D]/80 to-[#0D0D0D]" />
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
          onClick={() => {
            navigate(-1);
          }}
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
          {/* Capa */}
          <div className="w-56 sm:w-72 rounded-2xl overflow-hidden shadow-2xl mb-8 border border-white/10 shrink-0 bg-black/40">
            {livro.capa ? (
              <img src={livro.capa} alt={livro.titulo} className="w-full h-auto block" />
            ) : (
              <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-white/20">
                <BookOpen className="w-16 h-16" />
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 leading-tight">
            {livro.titulo}
          </h1>
          {livro.autor && (
            <p className="text-base text-white/50 text-center mb-8">{livro.autor}</p>
          )}
          
          {/* Ações Extras para CP (Grafo e Lei Seca) */}
          {livro.isCP && (
            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-sm mb-8">
              {livro.audio_grafo && (
                <button
                  onClick={() => setIsGraphOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors backdrop-blur-sm text-sm font-semibold"
                >
                  <Network className="w-4 h-4 text-primary" />
                  Grafo de Conexões
                </button>
              )}
              <button
                onClick={() => setIsTextOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-colors backdrop-blur-sm text-sm font-semibold"
              >
                <BookOpen className="w-4 h-4 text-primary" />
                Lei Seca
              </button>
            </div>
          )}

          {livro.sumarioAudio && livro.sumarioAudio.length > 0 && (
            <div className="w-full max-w-2xl mb-8">
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
                         if (!isThisPlaying) togglePlay();
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

          {/* Soundwave Animation */}
          <div className="flex items-center justify-center gap-1 h-12 mb-8">
            {[
              { anim: ["20%", "80%", "40%", "90%", "20%"], paused: "20%" },
              { anim: ["40%", "100%", "30%", "70%", "40%"], paused: "40%" },
              { anim: ["60%", "30%", "100%", "50%", "60%"], paused: "60%" },
              { anim: ["30%", "90%", "20%", "100%", "30%"], paused: "30%" },
              { anim: ["80%", "20%", "90%", "40%", "80%"], paused: "80%" },
              { anim: ["40%", "100%", "30%", "70%", "40%"], paused: "40%" },
              { anim: ["100%", "40%", "80%", "30%", "100%"], paused: "100%" },
              { anim: ["20%", "80%", "40%", "90%", "20%"], paused: "20%" },
              { anim: ["60%", "30%", "100%", "50%", "60%"], paused: "60%" },
              { anim: ["30%", "90%", "20%", "100%", "30%"], paused: "30%" },
              { anim: ["50%", "20%", "80%", "30%", "50%"], paused: "50%" },
            ].map((wave, i) => (
              <motion.div
                key={i}
                className="w-1.5 bg-primary rounded-full"
                animate={{ height: isThisPlaying ? wave.anim : wave.paused }}
                transition={{
                  duration: isThisPlaying ? 0.5 + (i % 3) * 0.1 : 0.3,
                  repeat: isThisPlaying ? Infinity : 0,
                  repeatType: "mirror",
                  ease: "easeInOut",
                  delay: isThisPlaying ? i * 0.05 : 0,
                }}
              />
            ))}
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4 mb-10 w-full">
            <span className="text-[11px] font-medium text-white/50 w-10 text-right">
              {formatTime(progress)}
            </span>
            <div
              className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                handleSeek(percent * unifiedDuration);
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-primary transition-all duration-75 ease-linear group-hover:bg-primary/90"
                style={{ width: `${(progress / (unifiedDuration || 1)) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-white/50 w-10">
              {formatTime(unifiedDuration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8">
            <button
              onClick={() => handleSeek(progress - 15)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-sm font-bold">-15s</span>
            </button>

            <button
              onClick={() => {
                if (globalLivro?.id !== livro.id) {
                  tocar(livro);
                } else {
                  togglePlay();
                }
              }}
              disabled={!livro.audioResumoUrl}
              className={`w-20 h-20 flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 shadow-2xl shadow-primary/30 ${!livro.audioResumoUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isThisPlaying ? (
                <Pause className="w-10 h-10 fill-current" />
              ) : (
                <Play className="w-10 h-10 fill-current ml-1.5" />
              )}
            </button>

            <button
              onClick={() => handleSeek(progress + 15)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-sm font-bold">+15s</span>
            </button>
          </div>
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
