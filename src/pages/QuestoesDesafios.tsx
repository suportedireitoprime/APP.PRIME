import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import DesafioLinha from '@/components/questoes/DesafioLinha';
import DesafiosBottomNav from '@/components/questoes/DesafiosBottomNav';
import { useDesafios, type DesafioStatus } from '@/hooks/useQuestoesExtras';
import { cn } from '@/lib/utils';
import { useGoBack } from '@/hooks/useGoBack';

const QuestoesDesafios = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [params, setParams] = useSearchParams();
  const trilhaAtiva = params.get('trilha') ?? 'pendentes';
  const { trilhas, pendentes, loading } = useDesafios();

  const abas = useMemo(
    () => [{ slug: 'pendentes', label: 'Pendentes' }, ...trilhas.map((t) => ({ slug: t.slug, label: t.label }))],
    [trilhas],
  );

  const praticar = (d: DesafioStatus) => {
    const faltam = Math.max(1, d.meta_diaria - d.respondidas_hoje);
    const qs = new URLSearchParams({ qtd: String(faltam) });
    if (d.area) qs.set('area', d.area);
    navigate(`/questoes/praticar?${qs.toString()}`);
  };

  const lista: DesafioStatus[] =
    trilhaAtiva === 'pendentes'
      ? pendentes
      : trilhas.find((t) => t.slug === trilhaAtiva)?.desafios ?? [];

  return (
    <div className="theme-questoes min-h-screen bg-background pb-28">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="Desafios" subtitle="Constância vale mais que pressa" onBack={() => goBack()} />

        {/* Menu de alternância das trilhas */}
        <div className="-mx-0 mt-1 flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {abas.map((a) => {
            const ativo = a.slug === trilhaAtiva;
            return (
              <button
                key={a.slug}
                onClick={() => setParams(a.slug === 'pendentes' ? { trilha: 'pendentes' } : { trilha: a.slug })}
                className={cn(
                  'relative shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-colors',
                  ativo ? 'text-primary-foreground' : 'border border-border bg-card text-muted-foreground',
                )}
              >
                {ativo && (
                  <motion.span
                    layoutId="desafios-trilha-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{a.label}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3 px-4 pb-6">
          {trilhaAtiva === 'pendentes' && !loading && lista.length > 0 && (
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Flame className="h-4 w-4 text-primary" /> Metas de hoje em todas as trilhas.
            </p>
          )}

          {loading && <p className="text-sm text-muted-foreground">Carregando desafios…</p>}

          {!loading && lista.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {trilhaAtiva === 'pendentes'
                ? 'Tudo em dia por aqui! Escolha uma trilha acima para começar outra.'
                : 'Nenhum desafio disponível nesta trilha.'}
            </p>
          )}

          {lista.map((d) => (
            <DesafioLinha
              key={d.desafio_id}
              d={d}
              mostrarTrilha={trilhaAtiva === 'pendentes'}
              onPraticar={() => praticar(d)}
            />
          ))}
        </div>
      </div>

      <DesafiosBottomNav />
    </div>
  );
};

export default QuestoesDesafios;
