import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Flame, Heart } from 'lucide-react';
import { LeiCantada } from '@/lib/leisCantadasApi';
import { LeisCantadasRankRow } from './LeisCantadasRankRow';

interface LeisCantadasRankingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rankAba: 'ouvidas' | 'curtidas';
  rankingCompleto: LeiCantada[];
  plays: (id: string) => number;
  likes: (id: string) => number;
  onSelectFaixa: (f: LeiCantada) => void;
}

export function LeisCantadasRankingDrawer({
  open,
  onOpenChange,
  rankAba,
  rankingCompleto,
  plays,
  likes,
  onSelectFaixa,
}: LeisCantadasRankingDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="flex items-center gap-2">
            <span
              className={`h-8 w-8 grid place-items-center rounded-lg text-white ${
                rankAba === 'ouvidas' ? 'bg-orange-500/90' : 'bg-rose-500/90'
              }`}
            >
              {rankAba === 'ouvidas' ? <Flame className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
            </span>
            {rankAba === 'ouvidas' ? 'Mais ouvidas' : 'Mais curtidas'}
          </DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 space-y-1">
          {rankingCompleto.map((f, i) => (
            <LeisCantadasRankRow
              key={f.id}
              f={f}
              pos={i + 1}
              valor={rankAba === 'ouvidas' ? plays(f.id) : likes(f.id)}
              unidade={rankAba === 'ouvidas' ? 'plays' : 'curtidas'}
              onClick={() => {
                onOpenChange(false);
                onSelectFaixa(f);
              }}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
