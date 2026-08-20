import React from 'react';
import { CheckCircle2, Heart, Send, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';

interface VideoaulaControlesAcaoProps {
  concluida: boolean;
  favorito: boolean;
  marcarConcluida: () => void;
  toggleFavorito: () => void;
  user: any;
  area: string;
  videoId: string | undefined;
}

export const VideoaulaControlesAcao = React.memo(function VideoaulaControlesAcao({
  concluida,
  favorito,
  marcarConcluida,
  toggleFavorito,
  user,
  area,
  videoId
}: VideoaulaControlesAcaoProps) {

  const shareWhatsApp = () => {
    const nome = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'Alguém';
    const text = encodeURIComponent(`${nome} tá recomendando esse vídeo pra você, que trata de ${area}.\n\nAcesse a aula aqui:\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareTelegram = () => {
    const nome = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'Alguém';
    const text = encodeURIComponent(`${nome} tá recomendando esse vídeo pra você, que trata de ${area}.`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 lg:px-0 mt-2 w-full overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <button
        onClick={marcarConcluida}
        className={cn(
          'inline-flex flex-1 justify-center items-center gap-1.5 rounded-full border px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-[13px] font-medium transition-colors bg-transparent whitespace-nowrap',
          concluida
            ? 'border-green-500 text-green-500'
            : 'border-green-500/40 text-muted-foreground hover:border-green-500 hover:text-foreground',
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {concluida ? 'Visto' : 'Marcar como visto'}
      </button>

      <button
        onClick={toggleFavorito}
        className={cn(
          'inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-[13px] font-medium transition-colors bg-transparent whitespace-nowrap',
          favorito
            ? 'border-red-500 text-red-500'
            : 'border-red-500/40 text-muted-foreground hover:border-red-500 hover:text-foreground',
        )}
      >
        <Heart className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', favorito && 'fill-current text-red-500')} /> Favoritar
      </button>

      <Drawer>
        <DrawerTrigger asChild>
          <button
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-blue-500/40 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-[13px] font-medium text-muted-foreground bg-transparent hover:border-blue-500 hover:text-foreground transition-colors whitespace-nowrap"
          >
            <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4 -mt-0.5" /> Enviar
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Compartilhar Aula</DrawerTitle>
              <DrawerDescription>Envie esta aula para seus amigos de estudo.</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-8 space-y-3">
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-5 w-5" /> Compartilhar no WhatsApp
              </button>
              
              <button
                onClick={shareTelegram}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0088cc] px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Send className="h-5 w-5" /> Compartilhar no Telegram
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
});
