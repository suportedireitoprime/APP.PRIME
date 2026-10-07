import { useState, useEffect, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronRight, Gavel, Landmark, Map, ScrollText, Search, PocketKnife } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useKeyboardHeight } from '@/hooks/useKeyboardListeners';

const MAIS_MENU = [
  { id: 'especiais', label: 'Legislação Especial', to: '/vade-mecum/especiais', icon: PocketKnife, desc: 'Leis penais extravagantes e especiais', color: '#F97316' },
  { id: 'estadual', label: 'Legislação Estadual', to: '/legislacao-estadual', icon: Map, desc: 'Normas das 27 unidades federativas', color: '#38BDF8' },
];

const VadeMecumBottomNav = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [maisOpen, setMaisOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const keyboardHeight = useKeyboardHeight();
  const actuallyHidden = hidden || keyboardHeight > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePesquisar = () => {
    haptic.selection();
    // Dispara evento para o VadeMecum.tsx abrir a busca
    window.dispatchEvent(new CustomEvent('vademecum:abrir-busca'));
  };

  const navContent = (
    <>
      <nav
        aria-label="Navegação Vade Mecum"
        className={`fixed z-50 transition-all duration-300 ease-out 
          bottom-0 left-0 right-0 bg-[#1C1C1E] backdrop-blur-md border-t border-white/10 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.6),0_-2px_10px_rgba(0,0,0,0.4)]
          md:top-0 md:bottom-0 md:right-auto md:w-[90px] md:border-t-0 md:rounded-none md:bg-black/95 md:shadow-none md:border-r md:border-white/10
          ${actuallyHidden ? 'translate-y-[140%] md:-translate-x-[140%] md:translate-y-0 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
      >
        <div
          aria-hidden="true"
          className="absolute bottom-full left-0 right-0 h-20 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none md:hidden"
        />
        <div className="relative z-10 pb-[var(--sai-bottom,env(safe-area-inset-bottom,0px))] md:pb-0 md:h-full">
          <div className="max-w-lg mx-auto px-1 pt-3.5 pb-3.5 md:max-w-2xl md:px-2 md:py-8 md:h-full md:flex md:flex-col md:justify-center md:gap-6">
            <div className="grid grid-cols-5 items-end md:grid-cols-1 md:items-stretch md:gap-6">
              
              {/* Slot 1: Códigos */}
              <button
                onClick={() => { haptic.selection(); setMaisOpen(false); startTransition(() => navigate('/vade-mecum/codigos')); }}
                className={`flex flex-col items-center justify-end gap-1.5 py-1.5 md:py-3 md:justify-center md:rounded-xl transition-all active:opacity-70 duration-100 cursor-pointer relative ${
                  pathname.startsWith('/vade-mecum/codigos') ? 'text-white md:bg-white/15 md:ring-1 md:ring-white/25 md:shadow-sm' : 'text-white/80 hover:text-white md:hover:bg-white/10'
                }`}
              >
                <Gavel className={`w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 transition-transform drop-shadow-md ${pathname.startsWith('/vade-mecum/codigos') ? 'scale-110' : 'drop-shadow-sm'}`} strokeWidth={1.5} />
                <span className="font-body text-[11px] sm:text-[12px] md:text-[12px] font-medium leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5">Códigos</span>
              </button>

              {/* Slot 2: Estatutos */}
              <button
                onClick={() => { haptic.selection(); setMaisOpen(false); startTransition(() => navigate('/vade-mecum/estatutos')); }}
                className={`flex flex-col items-center justify-end gap-1.5 py-1.5 md:py-3 md:justify-center md:rounded-xl transition-all active:opacity-70 duration-100 cursor-pointer relative ${
                  pathname.startsWith('/vade-mecum/estatutos') ? 'text-white md:bg-white/15 md:ring-1 md:ring-white/25 md:shadow-sm' : 'text-white/80 hover:text-white md:hover:bg-white/10'
                }`}
              >
                <Landmark className={`w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 transition-transform drop-shadow-md ${pathname.startsWith('/vade-mecum/estatutos') ? 'scale-110' : 'drop-shadow-sm'}`} strokeWidth={1.5} />
                <span className="font-body text-[11px] sm:text-[12px] md:text-[12px] font-medium leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5">Estatutos</span>
              </button>

              {/* Slot 3: Pesquisar (destaque flutuante central no mobile) */}
              <button
                onClick={handlePesquisar}
                className="relative flex flex-col items-center justify-end gap-1.5 py-1.5 md:py-3 md:justify-center md:rounded-xl md:hover:bg-white/10 active:opacity-70 transition-transform duration-100 cursor-pointer text-white/80 hover:text-white"
              >
                <span
                  className={`absolute -top-11 left-1/2 -translate-x-1/2 w-[76px] h-[76px] xs:w-[80px] xs:h-[80px] md:relative md:top-0 md:left-0 md:translate-x-0 md:w-auto md:h-auto md:bg-transparent md:shadow-none rounded-full flex items-center justify-center overflow-hidden bg-primary shadow-[0_10px_26px_rgba(0,0,0,0.6)] transition-transform`}
                >
                  <Search className="relative w-10 h-10 xs:w-11 xs:h-11 md:w-9 md:h-9 text-white md:text-white/90 drop-shadow-lg -scale-x-100" aria-hidden="true" strokeWidth={1.2} />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/45 to-transparent motion-safe:animate-[vade-mecum-shine_3.4s_ease-in-out_infinite] md:hidden"
                  />
                </span>
                <span aria-hidden className="w-7 h-7 sm:w-8 sm:h-8 md:hidden" />
                <span className="font-body text-[11px] sm:text-[12px] md:text-[12px] font-medium leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5">Pesquisar</span>
              </button>

              {/* Slot 4: Jurisprudência */}
              <button
                onClick={() => { haptic.selection(); setMaisOpen(false); startTransition(() => navigate('/jurisprudencia')); }}
                className={`flex flex-col items-center justify-end gap-1.5 py-1.5 md:py-3 md:justify-center md:rounded-xl transition-all active:opacity-70 duration-100 cursor-pointer relative ${
                  pathname.startsWith('/jurisprudencia') || pathname.startsWith('/vade-mecum/sumulas') ? 'text-white md:bg-white/15 md:ring-1 md:ring-white/25 md:shadow-sm' : 'text-white/80 hover:text-white md:hover:bg-white/10'
                }`}
              >
                <ScrollText className={`w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 transition-transform drop-shadow-md ${pathname.startsWith('/jurisprudencia') || pathname.startsWith('/vade-mecum/sumulas') ? 'scale-110' : 'drop-shadow-sm'}`} strokeWidth={1.5} />
                <span className="font-body text-[11px] sm:text-[12px] md:text-[12px] font-medium leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5">Súmulas</span>
              </button>

              {/* Slot 5: Mais Leis */}
              <button
                onClick={() => { haptic.selection(); setMaisOpen(!maisOpen); }}
                className={`flex flex-col items-center justify-end gap-1.5 py-1.5 md:py-3 md:justify-center md:rounded-xl transition-all active:opacity-70 duration-100 cursor-pointer relative ${
                  maisOpen ? 'text-white md:bg-white/15 md:ring-1 md:ring-white/25 md:shadow-sm' : 'text-white/80 hover:text-white md:hover:bg-white/10'
                }`}
              >
                <Menu className={`w-7 h-7 sm:w-8 sm:h-8 md:w-8 md:h-8 transition-transform drop-shadow-md ${maisOpen ? 'scale-110' : 'drop-shadow-sm'}`} strokeWidth={1.5} />
                <span className="font-body text-[11px] sm:text-[12px] md:text-[12px] font-medium leading-tight text-center drop-shadow-sm truncate max-w-full px-0.5">Mais Leis</span>
              </button>

            </div>
          </div>
        </div>
      </nav>

      {/* Sheet do menu "Mais" */}
      {maisOpen && (
        <>
          <div
            onClick={() => setMaisOpen(false)}
            className="fixed inset-0 bg-black/80 z-[60] transition-opacity duration-200"
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-[70] bg-background border-t border-border rounded-t-3xl pb-[calc(2.5rem+var(--sai-bottom))] pt-6 px-4 shadow-2xl max-h-[85vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-transform duration-200"
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full" />
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold text-foreground">Mais Categorias</h2>
              <button
                onClick={() => setMaisOpen(false)}
                className="p-2 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {MAIS_MENU.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      haptic.selection();
                      setMaisOpen(false);
                      navigate(item.to);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-card border border-border/60 hover:bg-secondary/80 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <Icon className="w-7 h-7" style={{ color: item.color }} strokeWidth={1.5} />
                      <div className="text-left">
                        <h3 className="font-display font-bold text-[16px] text-foreground">{item.label}</h3>
                        <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(navContent, document.body);
};

export default VadeMecumBottomNav;
