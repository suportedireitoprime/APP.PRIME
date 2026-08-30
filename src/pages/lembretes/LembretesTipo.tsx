import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff, Loader2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import LembretesBottomNav from '@/components/lembretes/LembretesBottomNav';
import LembreteCard from '@/components/lembretes/LembreteCard';
import NovoLembreteSheet from '@/components/lembretes/NovoLembreteSheet';
import { useLembretes } from '@/hooks/useLembretes';
import { TIPOS, type LembreteTipo } from '@/lib/lembretes/tipos';

type Props = { tipo: LembreteTipo };

export default function LembretesTipo({ tipo }: Props) {
  const navigate = useNavigate();
  const { itens, loading, recarregar, alternar, remover } = useLembretes();
  const [criar, setCriar] = useState(false);
  const meta = TIPOS[tipo];
  const Icon = meta.icon;

  const lista = useMemo(() => itens.filter((i) => i.tipo === tipo), [itens, tipo]);
  const ativos = lista.filter((i) => i.ativo).length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={meta.label}
        subtitle={loading ? 'Carregando…' : `${ativos} ativo${ativos === 1 ? '' : 's'} de ${lista.length}`}
        onBack={() => navigate('/lembretes')}
      />

      <div className="max-w-3xl mx-auto px-4 py-5 pb-40">
        {loading ? (
          <div className="py-20 grid place-items-center text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : lista.length === 0 ? (
          <div className="py-14 text-center">
            <span
              className="mx-auto mb-4 h-16 w-16 rounded-2xl grid place-items-center"
              style={{ background: `${meta.cor}1f` }}
            >
              <Icon className="h-8 w-8" style={{ color: meta.cor }} strokeWidth={1.4} />
            </span>
            <p className="font-body text-foreground font-semibold">Nenhum lembrete de {meta.label.toLowerCase()}</p>
            <p className="text-[13px] text-muted-foreground mt-1">{meta.desc}</p>
            <button
              onClick={() => setCriar(true)}
              className="mt-6 h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-semibold text-[14px] active:scale-[0.99] transition"
            >
              Criar lembrete
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {lista.map((i) => (
              <LembreteCard
                key={i.id}
                item={i}
                onAbrir={() => (i.editavel ? alternar(i) : navigate(i.rota))}
                onAlternar={() => alternar(i)}
                onRemover={() => remover(i)}
              />
            ))}
          </div>
        )}

        {!loading && lista.length === 0 && (
          <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
            <BellOff className="h-4 w-4" />
            <span className="text-[12px]">Você recebe o alerta na hora marcada.</span>
          </div>
        )}
      </div>

      <button
        onClick={() => setCriar(true)}
        aria-label="Novo lembrete"
        className="fixed right-5 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 grid place-items-center active:scale-95 transition"
        style={{ bottom: 'calc(6.25rem + var(--sai-bottom))' }}
      >
        <Plus className="h-7 w-7" />
      </button>

      <NovoLembreteSheet
        open={criar}
        onOpenChange={setCriar}
        tipoInicial={tipo}
        travarTipo
        onSalvo={recarregar}
      />

      <LembretesBottomNav />
    </div>
  );
}
