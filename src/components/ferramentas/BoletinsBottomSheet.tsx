import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { useNavigate } from 'react-router-dom';
import { Scale, Newspaper } from 'lucide-react';
import { motion } from 'framer-motion';

interface BoletinsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BoletinsBottomSheet = ({ isOpen, onClose }: BoletinsBottomSheetProps) => {
  const navigate = useNavigate();

  const handleSelect = (route: string) => {
    onClose();
    setTimeout(() => {
      navigate(route);
    }, 150);
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-background border-border">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-xl font-display font-black text-foreground">
            Escolha o tipo de Boletim
          </DrawerTitle>
          <DrawerDescription className="text-muted-foreground">
            Qual conteúdo você deseja acessar agora?
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 flex flex-col gap-3">
          <button
            onClick={() => handleSelect('/boletins')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/40 active:scale-[0.98] transition-all text-left group"
          >
            <div className="h-12 w-12 rounded-xl bg-red-500/10 text-red-500 grid place-items-center group-hover:bg-red-500 group-hover:text-white transition-colors">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-[16px]">
                Jurídico
              </h3>
              <p className="text-muted-foreground text-[13px] mt-0.5">
                Vídeo diário com as normas quentes e atualizações
              </p>
            </div>
          </button>

          <button
            onClick={() => handleSelect('/noticias')}
            className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/40 active:scale-[0.98] transition-all text-left group"
          >
            <div className="h-12 w-12 rounded-xl bg-pink-500/10 text-pink-500 grid place-items-center group-hover:bg-pink-500 group-hover:text-white transition-colors">
              <Newspaper className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-[16px]">
                Notícia
              </h3>
              <p className="text-muted-foreground text-[13px] mt-0.5">
                Últimas notícias do mundo do direito
              </p>
            </div>
          </button>
        </div>

        <DrawerFooter className="pt-2 pb-6">
          <DrawerClose asChild>
            <button className="w-full py-3.5 rounded-xl font-bold text-muted-foreground bg-white/5 hover:bg-white/10 hover:text-foreground transition-colors active:scale-95">
              Cancelar
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
