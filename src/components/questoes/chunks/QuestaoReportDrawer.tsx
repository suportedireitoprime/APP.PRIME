import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

export function QuestaoReportDrawer({ questaoId, trigger }: { questaoId: string; trigger?: React.ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState('');

  const submitErro = async () => {
    if (!motivo.trim()) {
      toast.error('Descreva o erro encontrado.');
      return;
    }
    
    setLoading(true);
    const text = `Reporte na Questão: ${questaoId}\n\nMotivo: ${motivo}`;
    
    // Fallback para a tabela app_feedback
    const { error } = await supabase.from('app_feedback').insert({
      user_id: user?.id,
      email: user?.email,
      comentario: text,
      tag: 'erro_questao',
    });

    setLoading(false);
    
    if (error) {
      toast.error('Erro ao enviar report. Tente novamente.');
      console.error(error);
    } else {
      toast.success('Report enviado com sucesso. Nossa equipe analisará!');
      setOpen(false);
      setMotivo('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button
            aria-label="Reportar Erro"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.12] transition-colors"
          >
            <AlertTriangle className="h-5 w-5 text-white/80" />
          </button>
        )}
      </DialogTrigger>
      
      <DialogContent className="w-[90vw] max-w-[400px] rounded-3xl p-6 border-border/50 bg-[#141414]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-white text-center">Reportar Erro</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2 text-[15px]">
            Encontrou algum erro na questão, gabarito ou comentário?
          </DialogDescription>
        </DialogHeader>
        
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Descreva o que está errado..."
          className="w-full h-32 rounded-2xl bg-white/[0.05] border border-white/10 p-4 text-[15px] text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
        />
        
        <button
          onClick={submitErro}
          disabled={loading}
          className="mt-4 h-14 w-full rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enviar Report'}
        </button>
      </DialogContent>
    </Dialog>
  );
}
