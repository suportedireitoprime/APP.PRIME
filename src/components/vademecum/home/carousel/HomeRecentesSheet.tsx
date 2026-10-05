import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRecentes, type LeiRecente } from '@/lib/leisRecentes';
import { History, ChevronRight, X, Landmark, Gavel, Scale, FileText, ShieldAlert, Briefcase, CircleDollarSign, ShoppingCart, Baby, Car, Trees, Vote, Accessibility, HeartPulse, Building2 } from 'lucide-react';
import { getLeiColor } from '@/lib/leiTheme';

const getLawIcon = (leiId: string) => {
  switch(leiId) {
    case 'cf88': return Landmark;
    case 'cp': return Gavel;
    case 'cc': return Scale;
    case 'cpp': return ShieldAlert;
    case 'clt': return Briefcase;
    case 'ctn': return CircleDollarSign;
    case 'cdc': return ShoppingCart;
    case 'eca': return Baby;
    case 'ctb': return Car;
    case 'eleitoral': return Vote;
    case 'ambiental': return Trees;
    case 'ei': return Accessibility;
    case 'sus': return HeartPulse;
    case 'licitacoes': return Building2;
    default: return FileText;
  }
};


interface HomeRecentesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLei: (leiId: string) => void;
}

export function HomeRecentesSheet({ isOpen, onClose, onOpenLei }: HomeRecentesSheetProps) {
  const [recentes, setRecentes] = useState<LeiRecente[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecentes(getRecentes());
    }
  }, [isOpen]);

  const getRelativeTime = (ts: number) => {
    const diffInSeconds = Math.floor((Date.now() - ts) / 1000);
    if (diffInSeconds < 60) return 'Agora mesmo';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `Há ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Há ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `Há ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `Há ${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'}`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `Há ${diffInYears} ${diffInYears === 1 ? 'ano' : 'anos'}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[100dvh] p-0 flex flex-col rounded-none bg-background border-none">
        <SheetHeader className="p-6 pb-4 border-b border-white/5 relative">
          <SheetTitle className="text-xl font-display font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Acessos Recentes
          </SheetTitle>
          <button 
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-2">
          {recentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <History className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-body">
                Nenhum histórico de leis acessadas recentemente.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {recentes.map((item, idx) => {
                const Icon = getLawIcon(item.leiId);
                const color = getLeiColor(item.leiId, item.tipo || 'lei');

                return (
                  <button
                    key={`${item.leiId}-${idx}`}
                    onClick={() => {
                      onClose();
                      setTimeout(() => onOpenLei(item.leiId), 150);
                    }}
                    className="w-full text-left flex items-center gap-4 bg-secondary/30 hover:bg-secondary/50 border border-white/5 rounded-2xl p-4 transition-all active:scale-[0.98] relative overflow-hidden"
                  >
                    <Icon className="w-8 h-8 shrink-0" strokeWidth={1} style={{ color }} />
                    <div className="flex-1 min-w-0 flex flex-col justify-center pr-16">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[15px] font-bold text-foreground truncate uppercase tracking-tight">{item.nome}</span>
                      </div>
                      <span className="text-[13px] font-medium text-muted-foreground truncate">{item.descricao}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest mt-1.5 opacity-90" style={{ color }}>
                        {item.tipo === 'codigo' ? 'Código' : item.tipo === 'estatuto' ? 'Estatuto' : item.tipo === 'constituicao' ? 'Constituição' : 'Lei'}
                      </span>
                    </div>
                    
                    {/* Data num cantinho em cima */}
                    <div className="absolute top-3 right-4 flex items-center opacity-60">
                      <span className="text-[10px] font-medium text-muted-foreground tracking-wide">
                        {getRelativeTime(item.openedAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
