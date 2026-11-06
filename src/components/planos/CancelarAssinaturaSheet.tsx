import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, CheckCircle2, ShieldCheck, Loader2, Calendar, CreditCard,
} from 'lucide-react';
import { format } from "@/lib/dateUtils";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { abrirLink } from '@/lib/nativo';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expiresAt: string | null;
  startedAt?: string | null;
  isAdminOverride?: boolean;
  source?: 'play' | 'apple' | 'asaas' | null;
  onCancelled?: (newExpiresAt: string | null) => void;
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  try {
    return format(new Date(iso), "dd 'de' MMMM 'de' yyyy");
  } catch {
    return iso;
  }
}

export default function CancelarAssinaturaSheet({
  open,
  onOpenChange,
  expiresAt,
  source = 'asaas',
  onCancelled,
}: Props) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);

  const formattedDate = fmt(expiresAt);

  const handleCancelAsaas = async () => {
    if (!user) return;
    setConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancelar-assinatura-asaas');

      if (error) {
        throw new Error(error.message || 'Erro ao comunicar com o servidor');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Renovação automática cancelada com sucesso!', {
        description: `Seu cartão não será cobrado novamente. Acesso Premium ativo até ${formattedDate}.`,
        duration: 7000,
      });

      onCancelled?.(data?.expires_at || expiresAt);
      onOpenChange(false);
    } catch (e: any) {
      toast.error('Não foi possível cancelar a cobrança automática', {
        description: e.message || 'Tente novamente em instantes ou contate o suporte.',
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleExternalStore = () => {
    if (source === 'apple') {
      void abrirLink('https://apps.apple.com/account/subscriptions');
    } else {
      void abrirLink('https://play.google.com/store/account/subscriptions');
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto p-0 border-t border-border/80 bg-background rounded-t-3xl shadow-2xl mx-auto max-w-xl pb-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]"
      >
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/60 px-5 py-4">
          <SheetHeader className="text-left space-y-0">
            <SheetTitle className="font-display flex items-center gap-2 text-base text-foreground">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Cancelar renovação automática
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-5 pt-5 pb-4 space-y-5">
          {/* Card explicativo */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-display text-sm font-bold text-foreground">
                  Nenhuma nova cobrança será feita
                </p>
                <p className="font-body text-xs sm:text-sm text-foreground/80 mt-1 leading-relaxed">
                  Ao confirmar o cancelamento, a cobrança automática no seu cartão de crédito é suspensa imediatamente.
                </p>
              </div>
            </div>
          </div>

          {/* Destaque da data em que mantém o acesso */}
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-display text-sm font-bold text-foreground">
                  Seu acesso continua liberado até:
                </p>
                <p className="font-display text-base sm:text-lg font-extrabold text-primary mt-0.5">
                  {formattedDate}
                </p>
                <p className="font-body text-xs text-muted-foreground mt-1 leading-relaxed">
                  Você comprou e pagou por este período, portanto aproveitará todas as funções Premium normalmente até a data final de validade.
                </p>
              </div>
            </div>
          </div>

          {/* Preservação de dados */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                Suas <strong>anotações, grifos, favoritos e histórico</strong> ficam salvos permanentemente na sua conta, mesmo quando o plano expirar.
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-2.5 pt-1">
            {source === 'apple' || source === 'play' ? (
              <Button
                onClick={handleExternalStore}
                className="w-full h-12 font-display font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Gerenciar na {source === 'apple' ? 'App Store' : 'Google Play'}
              </Button>
            ) : (
              <Button
                onClick={handleCancelAsaas}
                disabled={confirming}
                variant="destructive"
                className="w-full h-12 font-display font-semibold text-sm"
              >
                {confirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelando renovação…
                  </>
                ) : (
                  'Confirmar cancelamento da renovação'
                )}
              </Button>
            )}

            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full h-11 font-display font-medium text-sm"
              disabled={confirming}
            >
              Manter assinatura ativa
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
