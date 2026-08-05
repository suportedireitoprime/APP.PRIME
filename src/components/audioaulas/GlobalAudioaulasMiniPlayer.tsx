import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, X, Headphones } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAudioaulasPlayer } from '@/contexts/AudioaulasPlayerContext';
import { srcOf } from '@/lib/assetUrl';
import capaAudioaulas from '@/assets/atalho-audioaulas.webp.asset.json';
import capaPenal from '@/assets/direito-penal.webp.asset.json';
import capaCivil from '@/assets/direito-civil.webp.asset.json';
import capaConstituicao from '@/assets/direito-constituicao.webp.asset.json';
import capaClt from '@/assets/direito-clt.webp.asset.json';

const CAPA_HUB = srcOf(capaAudioaulas);
const CAPAS: { re: RegExp; url: string }[] = [
  { re: /penal|processo penal/i, url: srcOf(capaPenal) },
  { re: /civil/i, url: srcOf(capaCivil) },
  { re: /constitu/i, url: srcOf(capaConstituicao) },
  { re: /trabalh|clt/i, url: srcOf(capaClt) },
];
const capaDaArea = (area: string) => CAPAS.find((c) => c.re.test(area))?.url || CAPA_HUB;

/**
 * Mini Player Flutuante Global de Áudio Aulas:
 * Posiciona-se perfeitamente acima do menu de rodapé (`[data-bottom-nav]`) e
 * continua reproduzindo o áudio de forma ininterrupta ao navegar pelo aplicativo.
 */
export default function GlobalAudioaulasMiniPlayer() {
  const { atual, tocando, togglePlay, pular, setAberto, aberto, fechar, tempo, dur } = useAudioaulasPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [navHeight, setNavHeight] = useState(0);

  useEffect(() => {
    const medir = () => {
      const nav = document.querySelector<HTMLElement>('[data-bottom-nav]');
      setNavHeight(nav ? nav.getBoundingClientRect().height : 0);
    };
    medir();

    const nav = document.querySelector<HTMLElement>('[data-bottom-nav]');
    let ro: ResizeObserver | undefined;
    if (nav && 'ResizeObserver' in window) {
      ro = new ResizeObserver(medir);
      ro.observe(nav);
    }
    window.addEventListener('resize', medir);
    const t = window.setTimeout(medir, 300);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', medir);
      window.clearTimeout(t);
    };
  }, [location.pathname]);

  const onPage = location.pathname.startsWith('/audioaulas');
  // Se o player completo estiver aberto, esconde o mini player
  const visivel = !!atual && !(aberto && onPage);

  const abrir = () => {
    if (!location.pathname.startsWith('/audioaulas')) {
      navigate('/audioaulas');
    }
    setAberto(true);
  };

  const progresso = dur > 0 ? (tempo / dur) * 100 : 0;

  return (
    <AnimatePresence>
      {visivel && atual && (
        <motion.div
          key="audioaulas-mini-player"
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '110%', opacity: 0 }}
          transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.35 }}
          className="fixed left-0 right-0 z-40"
          style={{ bottom: navHeight }}
        >
          <div className="relative border-t border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900/95 to-zinc-950 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
            {/* Barra discreta de progresso no topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progresso}%` }}
              />
            </div>

            <div className="max-w-4xl mx-auto px-3 py-2 sm:px-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={abrir}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left group"
                >
                  <span className="relative h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-xl overflow-hidden shadow-md bg-zinc-800">
                    <img
                      src={capaDaArea(atual.area || '')}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-black/20 grid place-items-center">
                      <Headphones className="h-4 w-4 text-white/80" />
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider truncate">
                      {atual.area}
                    </p>
                    <p className="text-sm font-bold truncate text-white leading-tight">
                      {atual.titulo}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {atual.tema || 'Áudio Aula'}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => pular(-1)}
                    aria-label="Aula Anterior"
                    className="grid h-10 w-10 place-items-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    onClick={togglePlay}
                    aria-label={tocando ? 'Pausar' : 'Tocar'}
                    className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition"
                  >
                    {tocando ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </button>

                  <button
                    onClick={() => pular(1)}
                    aria-label="Próxima Aula"
                    className="grid h-10 w-10 place-items-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white transition"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>

                  <button
                    onClick={fechar}
                    aria-label="Fechar player"
                    title="Fechar player"
                    className="grid h-10 w-10 place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
