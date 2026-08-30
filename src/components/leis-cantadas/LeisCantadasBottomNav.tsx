import { motion } from "framer-motion";
import { Music, ListMusic, Heart, Search, ThumbsUp } from "lucide-react";
import { haptic } from "@/lib/nativeHaptics";

export type LeisCantadasTab = "musicas" | "playlist" | "favoritos" | "buscar" | "curtidas";

const TABS: { id: LeisCantadasTab; label: string; icon: typeof Music }[] = [
  { id: "musicas", label: "Músicas", icon: Music },
  { id: "playlist", label: "Playlist", icon: ListMusic },
  { id: "favoritos", label: "Favoritas", icon: Heart },
  { id: "buscar", label: "Buscar", icon: Search },
  { id: "curtidas", label: "Curtidas", icon: ThumbsUp },
];

const LeisCantadasBottomNav = ({
  ativo,
  onSelect,
  hidden = false,
}: {
  ativo: LeisCantadasTab | null;
  onSelect: (tab: LeisCantadasTab) => void;
  hidden?: boolean;
}) => {
  return (
    <motion.nav
      aria-label="Navegação Leis Cantadas"
      initial={false}
      animate={hidden ? { y: 120, opacity: 0 } : { y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:bottom-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto"
    >
      <div className="bg-card/95 backdrop-blur-md border-t border-border rounded-t-3xl shadow-lg shadow-black/10 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] md:border md:rounded-full md:shadow-2xl md:shadow-black/30 md:pb-0">
        <div className="grid grid-cols-5 items-end px-1 pt-3.5 pb-3.5 max-w-lg mx-auto md:gap-1 md:px-3 md:py-2">
          {TABS.map((tab) => {
            const active = ativo === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic.selection();
                  onSelect(tab.id);
                }}
                className={`relative flex flex-col items-center justify-end gap-1 py-1.5 px-1 rounded-2xl transition-colors ${
                  active ? "text-white" : "text-muted-foreground hover:text-white/80"
                }`}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="leis-cantadas-nav-active-pill"
                    className="absolute inset-0 rounded-2xl bg-white/10 ring-1 ring-white/20"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <Icon className="relative w-7 h-7 sm:w-8 sm:h-8" strokeWidth={active ? 1.9 : 1.5} />
                <span className={`relative text-[10px] sm:text-[11px] leading-none ${active ? "font-bold" : "font-medium"}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
};

export default LeisCantadasBottomNav;
