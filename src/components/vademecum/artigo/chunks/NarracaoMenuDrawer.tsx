import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Volume2, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NarracaoMenuDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: Array<{ rotulo: string; playFn: () => void; duracao?: number }>;
  artigoNumero?: string;
}

export function NarracaoMenuDrawer({ open, onOpenChange, options, artigoNumero }: NarracaoMenuDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-xl flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Ouvir Artigo {artigoNumero?.replace(/\D/g, '')}
          </DrawerTitle>
          <DrawerDescription>
            Escolha qual parte do artigo você deseja ouvir.
          </DrawerDescription>
        </DrawerHeader>
        <ScrollArea className="px-4 py-2 flex flex-col gap-2 max-h-[50vh]">
          {options.map((opt, i) => (
            <Button
              key={i}
              variant={i === 0 ? "default" : "secondary"}
              className="w-full justify-start h-14 mb-2 text-left shrink-0"
              onClick={() => {
                onOpenChange(false);
                opt.playFn();
              }}
            >
              <div className="flex items-center w-full">
                <Play className="w-4 h-4 mr-3 shrink-0" />
                <span className="flex-1 truncate">{opt.rotulo}</span>
                {opt.duracao ? (
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">
                    {Math.floor(opt.duracao / 60)}:{(Math.round(opt.duracao) % 60).toString().padStart(2, '0')}
                  </span>
                ) : null}
              </div>
            </Button>
          ))}
        </ScrollArea>
        <DrawerFooter className="pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
