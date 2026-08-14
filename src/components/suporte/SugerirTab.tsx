import { useState } from 'react';
import { Loader2, Lightbulb, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function SugerirTab() {
  const { user } = useAuth();
  const [sugestao, setSugestao] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!sugestao.trim()) return toast.error('Digite sua sugestão');
    
    setSending(true);
    try {
      const { error } = await supabase.from('app_feedback').insert({
        user_id: user!.id,
        email: user?.email,
        comentario: sugestao.trim(),
        tag: 'Sugestão',
        platform: 'Web/App',
        is_premium: false
      });
      
      if (error) throw error;
      
      toast.success('Sugestão enviada com sucesso! Muito obrigado.');
      setSugestao('');
    } catch (e) {
      toast.error('Erro ao enviar sugestão');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1A1D21] p-6 rounded-3xl border border-border/40 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-display font-bold text-xl text-foreground mb-2">Tem uma ideia legal?</h3>
        <p className="text-sm text-muted-foreground/90 font-body">
          O Direito Prime cresce com a sua ajuda. Sugira novas funcionalidades ou melhorias que você gostaria de ver no app!
        </p>
      </div>

      <div className="bg-[#1A1D21] p-5 rounded-3xl border border-border/40 shadow-sm space-y-4">
        <Textarea
          value={sugestao}
          onChange={e => setSugestao(e.target.value)}
          placeholder="Eu adoraria se o app tivesse..."
          rows={6}
          className="resize-none rounded-2xl bg-black/20 border-border/50 p-4"
        />
        
        <Button onClick={handleSubmit} disabled={sending || !sugestao.trim()} className="w-full gap-2 rounded-2xl h-12 font-semibold text-base shadow-lg shadow-primary/20">
          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-[-4px] mt-[2px]" />}
          Enviar Sugestão
        </Button>
      </div>
    </div>
  );
}
