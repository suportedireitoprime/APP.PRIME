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
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Lightbulb className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">Tem uma ideia legal?</h3>
        <p className="text-sm text-muted-foreground px-4 mt-1">
          O Direito Prime cresce com a sua ajuda. Sugira novas funcionalidades ou melhorias que você gostaria de ver no app!
        </p>
      </div>

      <Textarea
        value={sugestao}
        onChange={e => setSugestao(e.target.value)}
        placeholder="Eu adoraria se o app tivesse..."
        rows={6}
        className="resize-none"
      />
      
      <Button onClick={handleSubmit} disabled={sending || !sugestao.trim()} className="w-full gap-2">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Enviar Sugestão
      </Button>
    </div>
  );
}
