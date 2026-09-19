import { X, Clock, MapPin } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectHorario: () => void;
};

export default function NovoLembreteMenuDialog({ open, onOpenChange, onSelectHorario }: Props) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 border-0 bg-[#161616] overflow-hidden rounded-3xl" showCloseButton={false}>
        <div className="relative p-6 pt-8 pb-7 flex flex-col gap-6">
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center space-y-1.5 mt-2">
            <h2 className="text-lg font-black uppercase tracking-wider text-white">Novo Lembrete</h2>
            <p className="text-sm text-neutral-400">Escolha o tipo de lembrete que você quer criar.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onOpenChange(false);
                onSelectHorario();
              }}
              className="w-full text-left p-4 rounded-2xl border border-primary/40 hover:bg-primary/5 hover:border-primary/60 transition active:scale-[0.98] flex items-center gap-4 group"
            >
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-primary" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px]">Por horário</h3>
                <p className="text-xs text-neutral-400 mt-0.5">"Quero ser lembrado(a) de estudar às 20h."</p>
              </div>
            </button>

            <button
              onClick={() => {
                onOpenChange(false);
                navigate('/lembretes/local');
              }}
              className="w-full text-left p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20 transition active:scale-[0.98] flex items-center gap-4 group"
            >
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-white text-[15px]">Por local</h3>
                <p className="text-xs text-neutral-400 mt-0.5">"Quero ser lembrado(a) quando chegar perto de um lugar."</p>
              </div>
            </button>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full h-12 mt-2 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 transition active:scale-[0.99]"
          >
            Cancelar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
