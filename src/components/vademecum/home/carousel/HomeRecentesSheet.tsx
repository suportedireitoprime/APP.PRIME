import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getRecentes, type LeiRecente } from '@/lib/leisRecentes';
import { History, ChevronRight } from 'lucide-react';


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

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    
    if (isToday) {
      return `Hoje, ${hours}:${minutes}`;
    }
    
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col rounded-t-[32px] bg-background border-t border-white/10">
        <SheetHeader className="p-6 pb-4 border-b border-white/5">
          <SheetTitle className="text-xl font-display font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Acessos Recentes
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          {recentes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <History className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-body">
                Nenhum histórico de leis acessadas recentemente.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-8">
              {recentes.map((item, idx) => (
                <button
                  key={`${item.leiId}-${idx}`}
                  onClick={() => {
                    onClose();
                    setTimeout(() => onOpenLei(item.leiId), 150);
                  }}
                  className="w-full text-left flex items-center gap-4 bg-secondary/30 hover:bg-secondary/50 border border-white/5 rounded-2xl p-4 transition-all active:scale-[0.98]"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[14px] font-bold text-foreground truncate uppercase">{item.nome}</span>
                    </div>
                    <span className="text-[12px] font-medium text-muted-foreground truncate">{item.descricao}</span>
                    <span className="text-[10px] font-medium text-primary/80 mt-1 uppercase tracking-wider">
                      {formatDate(item.openedAt)}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
