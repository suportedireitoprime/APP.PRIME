import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springSnap, tapPress } from "@/lib/motion";
import { useGoBack } from '@/hooks/useGoBack';

interface AppHeaderProps {
  title?: ReactNode;
  /** Optional left action; defaults to a back button (goBack()). */
  left?: ReactNode;
  /** Optional right action(s). */
  right?: ReactNode;
  /** Hide the default back button (when `left` is not provided). */
  hideBack?: boolean;
  /** Called instead of goBack() when the default back button is tapped. */
  onBack?: () => void;
  /** Label next to the back chevron ("Voltar" by default; pass "" to hide). */
  backLabel?: string;
  /** Add a subtle top-only large title (iOS-style). Rendered by the page below the bar. */
  className?: string;
  /** Element that owns the scroll — defaults to window. */
  scrollTargetRef?: React.RefObject<HTMLElement>;
  /** Show a translucent blurred background (default true). */
  translucent?: boolean;
  /** Exibe barra de progresso horizontal sutil no rodapé ao rolar a página (Item 40). */
  showProgress?: boolean;
}

/**
 * iOS-style navigation bar. 44px content height + top safe-area.
 * Border-bottom fades in only after the user scrolls.
 */
export function AppHeader({
  title,
  left,
  right,
  hideBack = false,
  onBack,
  backLabel = "Voltar",
  className,
  scrollTargetRef,
  translucent = true,
  showProgress = true,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const el: any = scrollTargetRef?.current ?? window;
    const updateProgress = () => {
      const current = scrollTargetRef?.current ? scrollTargetRef.current.scrollTop : window.scrollY;
      const total = scrollTargetRef?.current
        ? scrollTargetRef.current.scrollHeight - scrollTargetRef.current.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (current / total) * 100)));
      } else {
        setScrollProgress(0);
      }
      setScrolled(current > 4);
    };
    updateProgress();
    el.addEventListener("scroll", updateProgress, { passive: true });
    return () => el.removeEventListener("scroll", updateProgress);
  }, [scrollTargetRef]);

  const handleBack = () => {
    if (onBack) onBack();
    else goBack();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        translucent
          ? "bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          : "bg-background",
        "transition-[border-color,box-shadow] duration-200",
        scrolled
          ? "border-b border-border/60"
          : "border-b border-transparent",
        className,
      )}
      style={{ paddingTop: "var(--sai-top)" }}
    >
      <div className="relative h-11 flex items-center px-2">
        {/* Left slot */}
        <div className="flex items-center min-w-[44px] h-11">
          {left ?? (!hideBack && (
            <motion.button
              type="button"
              onClick={handleBack}
              whileTap={tapPress}
              transition={springSnap}
              aria-label="Voltar"
              className="h-11 min-w-[44px] px-1.5 -ml-1 flex items-center gap-0.5 text-primary active:opacity-60"
            >
              <ChevronLeft className="w-[26px] h-[26px] -mr-1" strokeWidth={2.25} />
              {backLabel ? (
                <span className="text-[17px] leading-none font-normal">
                  {backLabel}
                </span>
              ) : null}
            </motion.button>
          ))}
        </div>

        {/* Centered title */}
        <div className="absolute left-0 right-0 flex justify-center pointer-events-none px-16">
          {typeof title === "string" ? (
            <h1 className="text-[17px] font-semibold text-foreground truncate max-w-full">
              {title}
            </h1>
          ) : (
            title
          )}
        </div>

        {/* Right slot */}
        <div className="ml-auto flex items-center min-h-11 gap-1">
          {right}
        </div>
      </div>

      {/* Indicador de progresso de leitura horizontal no rodapé do header (Item 40) */}
      {showProgress && scrollProgress > 0 && (
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-primary via-amber-400 to-primary transition-[width] duration-150 ease-out pointer-events-none"
          style={{ width: `${scrollProgress}%` }}
        />
      )}
    </header>
  );
}

export default AppHeader;
