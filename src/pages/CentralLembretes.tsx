import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, BellOff, Clock, Loader2, Plus, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import LembreteCard from '@/components/lembretes/LembreteCard';
import NovoLembreteSheet from '@/components/lembretes/NovoLembreteSheet';
import NovoLembreteMenuDialog from '@/components/lembretes/NovoLembreteMenuDialog';
import { useLembretes } from '@/hooks/useLembretes';

export default function CentralLembretes() {
  const navigate = useNavigate();
  const { itens, loading, totais, proximo, recarregar, alternar, remover } = useLembretes();
  const [menuCriar, setMenuCriar] = useState(false);
  const [sheetHorario, setSheetHorario] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Meus lembretes"
        onBack={() => navigate('/', { replace: true })}
      />

      <div className="max-w-3xl mx-auto px-4 py-4 pb-40">
        <button
          onClick={() => setMenuCriar(true)}
          className="w-full min-h-[52px] h-13 mb-6 rounded-2xl border-2 border-dashed border-primary/40 flex items-center justify-center gap-2 text-primary font-bold active:scale-[0.99] transition hover:bg-primary/5"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Novo lembrete
        </button>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card border border-border/60 px-4 py-3.5">
            <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
              Ativos
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
              {loading ? '—' : totais.ativos}
            </p>
          </div>
          <div className="rounded-2xl bg-card border border-border/60 px-4 py-3.5">
            <p className="text-[11.5px] font-semibold text-muted-foreground uppercase tracking-wide">
              No total
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums mt-0.5">
              {loading ? '—' : totais.total}
            </p>
          </div>
        </div>

        {/* Próximo lembrete */}
        {!loading && proximo && (
          <div className="mt-3 mb-6 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3.5 flex items-center gap-3">
            <span className="h-11 w-11 shrink-0 rounded-xl bg-primary/20 grid place-items-center">
              <BellRing className="w-6 h-6 text-primary" strokeWidth={1.7} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-primary">
                Próximo lembrete
              </p>
              <p className="text-[15px] font-semibold text-foreground truncate">{proximo.titulo}</p>
              <p className="text-[12px] text-muted-foreground truncate">{proximo.detalhe}</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1 text-[14px] font-bold text-foreground tabular-nums">
              <Clock className="w-4 h-4 text-muted-foreground" />
              {proximo.quando || proximo.horario}
            </span>
          </div>
        )}

        <div className="mt-6">
          {loading ? (
            <div className="py-16 grid place-items-center text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
          ) : itens.length === 0 ? (
            <div className="py-12 text-center">
              <Sparkles className="h-10 w-10 mx-auto text-primary/60 mb-3" />
              <p className="font-body text-foreground font-semibold">Ainda sem lembretes</p>
              <p className="text-[13px] text-muted-foreground mt-1 mb-5">
                Comece criando uma rotina tocando em "Novo lembrete" ali em cima.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {itens.map((i) => (
                <LembreteCard
                  key={i.id}
                  item={i}
                  onAbrir={() => navigate(i.rota)}
                  onAlternar={() => alternar(i)}
                  onRemover={() => remover(i)}
                  mostrarTipo={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <NovoLembreteMenuDialog 
        open={menuCriar} 
        onOpenChange={setMenuCriar} 
        onSelectHorario={() => setSheetHorario(true)} 
      />

      <NovoLembreteSheet 
        open={sheetHorario} 
        onOpenChange={setSheetHorario} 
        travarTipo={true}
        tipoInicial="geral"
        onSalvo={recarregar} 
      />
    </div>
  );
}
