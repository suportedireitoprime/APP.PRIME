import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Play, Pause, SkipBack, SkipForward, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLeisCantadasPlayer } from "@/contexts/LeisCantadasPlayerContext";
import { ImageCapa } from "@/components/leis-cantadas/VideoCapa";

/**
 * Mini player global das Leis Cantadas: fica logo acima do menu de rodapé e
 * continua tocando ao navegar pelo app.
 */
export default function GlobalLeisCantadasMiniPlayer() {
  const { atual, tocando, tocar, pular, setAberto, aberto, fechar } = useLeisCantadasPlayer();
  const navigate = useNavigate();
  const location = useLocation();

  const [navHeight, setNavHeight] = useState(0);

  useEffect(() => {
    const medir = () => {
      const nav = document.querySelector<HTMLElement>("[data-bottom-nav]");
      setNavHeight(nav ? nav.getBoundingClientRect().height : 0);
    };
    medir();

    const nav = document.querySelector<HTMLElement>("[data-bottom-nav]");
    let ro: ResizeObserver | undefined;
    if (nav && "ResizeObserver" in window) {
      ro = new ResizeObserver(medir);
      ro.observe(nav);
    }
    window.addEventListener("resize", medir);
    const t = window.setTimeout(medir, 300);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", medir);
      window.clearTimeout(t);
    };
  }, [location.pathname]);

  const onPage = location.pathname === "/leis-cantadas";
  const visivel = !!atual && !(aberto && onPage);

  const abrir = () => {
    if (location.pathname !== "/leis-cantadas") {
      navigate("/leis-cantadas");
    }
    setAberto(true);
  };

  return (
    <AnimatePresence>
      {visivel && atual && (
        <motion.div
          key="mini-player"
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "110%", opacity: 0 }}
          transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
          className="fixed left-0 right-0 z-40"
          style={{ bottom: navHeight }}
        >
          <div className="border-t border-border/40 bg-gradient-to-t from-card via-card/95 to-secondary/80 backdrop-blur-md rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
            <div className="max-w-2xl mx-auto px-2 py-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={abrir}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <ImageCapa className="h-11 w-11 shrink-0 rounded-xl sm:h-12 sm:w-12" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate text-foreground">
                      {atual.titulo || `Art. ${atual.numero_artigo}`}
                    </p>
                    <p className="text-xs text-foreground/70 truncate">{atual.lei_nome}</p>
                  </div>
                </button>
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <button
                    onClick={() => pular(-1)}
                    aria-label="Anterior"
                    className="grid h-10 w-10 place-items-center rounded-full text-foreground hover:bg-white/10"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => tocar(atual)}
                    aria-label={tocando ? "Pausar" : "Tocar"}
                    className="grid h-11 w-11 place-items-center rounded-full bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                  >
                    {tocando ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <button
                    onClick={() => pular(1)}
                    aria-label="Próxima"
                    className="grid h-10 w-10 place-items-center rounded-full text-foreground hover:bg-white/10"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                  <button
                    onClick={fechar}
                    aria-label="Fechar player"
                    title="Fechar player"
                    className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 hover:bg-white/10 hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
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