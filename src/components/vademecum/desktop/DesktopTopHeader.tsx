import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Bird, Heart } from "lucide-react";
import NotificationsSheet, {
  useUnreadNotifCount,
} from "@/components/vademecum/outros/NotificationsSheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getFavoritos } from "@/lib/leisFavoritos";
import { tipoToSlug, leiToSlug } from "@/lib/legislacaoSlugs";
import logoCoruja from "@/assets/logo-coruja.webp";

type Favorito = ReturnType<typeof getFavoritos>[number];

interface Props {
  onAssistenteClick?: () => void;
}

const DesktopTopHeader = ({ onAssistenteClick }: Props) => {
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useUnreadNotifCount();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);

  useEffect(() => {
    const carregarFavoritos = () => {
      setFavoritos(getFavoritos().slice(0, 5));
    };
    carregarFavoritos();
    window.addEventListener("LEIS_FAVORITOS_UPDATED", carregarFavoritos);
    return () => window.removeEventListener("LEIS_FAVORITOS_UPDATED", carregarFavoritos);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-zinc-950/90 backdrop-blur-md border-b border-white/10">
      <div className="h-full max-w-7xl mx-auto px-6 xl:px-10 flex items-center gap-4">
        {/* Logo + wordmark minimalista */}
        <button onClick={() => navigate("/")} className="flex items-center gap-3 shrink-0 group">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 bg-zinc-900 flex items-center justify-center p-1">
            <img
              src={logoCoruja}
              alt="Direito Prime"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="font-display text-base font-bold text-white tracking-tight">
              Direito Prime
            </span>
            <span className="font-body text-[10px] uppercase tracking-[0.2em] text-zinc-400">
              Uso Profissional
            </span>
          </div>
        </button>

        <div className="flex-1" />

        {/* Favoritos Rápidos */}
        <Popover>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative shrink-0 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors group"
                  aria-label="Favoritos"
                >
                  <Heart className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Favoritos Rápidos</TooltipContent>
          </Tooltip>
          <PopoverContent
            align="end"
            className="w-80 p-0 border-white/10 shadow-2xl overflow-hidden bg-zinc-950"
          >
            <div className="p-3 bg-card border-b border-border flex items-center justify-between">
              <h4 className="font-display font-bold text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary fill-primary" />
                Últimos Favoritos
              </h4>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 flex flex-col gap-1">
              {favoritos.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  Nenhum artigo favoritado ainda.
                </p>
              ) : (
                favoritos.map((fav) => (
                  <button
                    key={fav.leiId}
                    type="button"
                    onClick={() => navigate(`/legislacao/${tipoToSlug(fav.tipo)}/${leiToSlug({ id: fav.leiId, nome: fav.nome })}`)}
                    className="flex flex-col text-left p-3 rounded-xl hover:bg-secondary/60 transition-colors"
                  >
                    <span className="font-display font-bold text-sm text-foreground mb-1 line-clamp-1">
                      {fav.nome}
                    </span>
                    <span className="font-body text-xs text-muted-foreground line-clamp-2">
                      {fav.descricao || fav.tipo}
                    </span>
                  </button>
                ))
              )}
            </div>
            {favoritos.length > 0 && (
              <div className="p-2 bg-card border-t border-border">
                <button
                  type="button"
                  onClick={() => document.dispatchEvent(new CustomEvent("OPEN_FAVORITOS_MODAL"))}
                  className="w-full py-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  Ver todos os favoritos
                </button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Assistente Hórus */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() =>
                onAssistenteClick ? onAssistenteClick() : navigate("/assistente-horus")
              }
              className="relative shrink-0 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors group"
              aria-label="Assistente Hórus"
            >
              <Bird className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-2">
            Assistente Hórus
          </TooltipContent>
        </Tooltip>

        {/* Notificações */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="relative shrink-0 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors group"
              aria-label={unreadCount > 0 ? `Notificações (${unreadCount} novas)` : "Notificações"}
            >
              <Bell className="w-4 h-4 text-zinc-200 group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black flex items-center justify-center"
                  aria-hidden
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {unreadCount > 0 ? `Notificações (${unreadCount})` : "Notificações"}
          </TooltipContent>
        </Tooltip>
      </div>

      <NotificationsSheet open={notifOpen} onClose={() => setNotifOpen(false)} />
    </header>
  );
};

export default DesktopTopHeader;
