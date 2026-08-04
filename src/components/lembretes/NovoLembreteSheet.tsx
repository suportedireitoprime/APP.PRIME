import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { agendarAvisoLocal } from '@/lib/lembretes/agendar';
import { RECORRENCIAS, TIPOS, TIPOS_AVISO, marcarTipo, type LembreteTipo } from '@/lib/lembretes/tipos';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipoInicial?: LembreteTipo;
  travarTipo?: boolean;
  onSalvo?: () => void;
};

function hojeISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function NovoLembreteSheet({
  open,
  onOpenChange,
  tipoInicial = 'geral',
  travarTipo = false,
  onSalvo,
}: Props) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<LembreteTipo>(tipoInicial);
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [data, setData] = useState(hojeISO());
  const [hora, setHora] = useState('20:00');
  const [recorrencia, setRecorrencia] = useState<string>('unica');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) {
      setTipo(tipoInicial);
      setTitulo('');
      setMensagem('');
      setData(hojeISO());
      setHora('20:00');
      setRecorrencia('unica');
    }
  }, [open, tipoInicial]);

  const salvar = async () => {
    if (!user?.id) {
      toast.error('Entre na sua conta para criar lembretes.');
      return;
    }
    if (!titulo.trim()) {
      toast.error('Dê um nome ao lembrete.');
      return;
    }
    setSalvando(true);
    try {
      const avisar_em = new Date(`${data}T${hora}:00`).toISOString();
      const { data: criado, error } = await supabase
        .from('avisos')
        .insert({
          user_id: user.id,
          titulo: titulo.trim(),
          mensagem: marcarTipo(mensagem, tipo),
          avisar_em,
          recorrencia,
          ativo: true,
        })
        .select('*')
        .single();
      if (error) throw error;
      await agendarAvisoLocal(criado as any, mensagem.trim() || undefined);
      toast.success('Lembrete criado!');
      onOpenChange(false);
      onSalvo?.();
    } catch (e: any) {
      toast.error('Não deu para salvar: ' + (e?.message || 'tente de novo'));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92dvh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Novo lembrete</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 pb-6">
          {!travarTipo && (
            <div>
              <p className="text-[12px] font-semibold text-muted-foreground mb-2">O que é?</p>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS_AVISO.map((t) => {
                  const Icon = TIPOS[t].icon;
                  const ativo = tipo === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={cn(
                        'min-h-[72px] rounded-2xl border flex flex-col items-center justify-center gap-1.5 px-2 transition',
                        ativo ? 'border-primary bg-primary/10' : 'border-border/60 bg-card',
                      )}
                    >
                      <Icon className="w-6 h-6" style={{ color: TIPOS[t].cor }} strokeWidth={1.5} />
                      <span className="text-[11.5px] font-semibold text-foreground text-center leading-tight">
                        {t === 'geral' ? 'Livre' : TIPOS[t].label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-[12px] font-semibold text-muted-foreground">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={
                tipo === 'videoaulas'
                  ? 'Ex.: Assistir aula de Processo Civil'
                  : tipo === 'resumos'
                    ? 'Ex.: Revisar resumo de Penal'
                    : 'Ex.: Entregar trabalho de Constitucional'
              }
              className="mt-1.5 w-full h-12 px-4 rounded-xl bg-card border border-border text-foreground text-[15px]"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-muted-foreground">
              Observação (opcional)
            </label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={2}
              placeholder="Detalhes que ajudam a lembrar"
              className="mt-1.5 w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-[14px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground">Dia</label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="mt-1.5 w-full h-12 px-3 rounded-xl bg-card border border-border text-foreground text-[15px]"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground">Hora</label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="mt-1.5 w-full h-12 px-3 rounded-xl bg-card border border-border text-foreground text-[15px] tabular-nums"
              />
            </div>
          </div>

          <div>
            <p className="text-[12px] font-semibold text-muted-foreground mb-2">Repetir</p>
            <div className="grid grid-cols-4 gap-2">
              {RECORRENCIAS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRecorrencia(r.id)}
                  className={cn(
                    'h-11 rounded-xl border text-[12px] font-semibold transition',
                    recorrencia === r.id
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border/60 bg-card text-muted-foreground',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={salvar}
            disabled={salvando}
            className="w-full h-13 min-h-[52px] rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] grid place-items-center active:scale-[0.99] transition disabled:opacity-60"
          >
            {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Criar lembrete'}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
