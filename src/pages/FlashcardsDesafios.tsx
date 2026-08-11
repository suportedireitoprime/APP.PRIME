import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Flame, Lock, Trophy, Crown, Layers } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useFlashcardsDesafios, type FlashcardDesafio } from '@/hooks/useFlashcardsDesafios';
import { useSubscription } from '@/hooks/useSubscription';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';

const NIVEL_LABEL: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
  expert: 'Expert',
};

const DesafioCard = ({
  d,
  isPremium,
  onPraticar,
}: {
  d: FlashcardDesafio;
  isPremium: boolean;
  onPraticar: () => void;
}) => {
  const concluido = d.status === 'concluido';
  const travadoPremium = d.premium && !isPremium;
  const bloqueado = !d.desbloqueado || travadoPremium;
  const faltam = Math.max(0, d.meta_diaria - d.respondidas_hoje);
  const barras = Math.min(d.dias, 30);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4',
        bloqueado ? 'border-border bg-card/50' : 'border-border bg-card',
      )}
      style={!bloqueado ? { borderColor: `${d.cor}55` } : undefined}
    >
      <Trophy
        className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 opacity-[0.07]"
        style={{ color: d.cor }}
        strokeWidth={1}
      />

      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl"
          style={{ background: `${d.cor}1f`, color: d.cor }}
        >
          {concluido ? <Check className="h-6 w-6" strokeWidth={2.6} />
            : travadoPremium ? <Crown className="h-5 w-5" />
            : !d.desbloqueado ? <Lock className="h-5 w-5" />
            : <Flame className="h-6 w-6" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[16px] font-bold text-foreground">Desafio {d.numero}</p>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
              style={{ background: `${d.cor}22`, color: d.cor }}
            >
              {NIVEL_LABEL[d.nivel] ?? d.nivel}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">{d.descricao}</p>

          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: barras }).map((_, i) => (
              <span
                key={i}
                className="h-2 flex-1 rounded-full"
                style={{
                  background:
                    i < Math.round((d.dias_concluidos / d.dias) * barras) ? d.cor : 'hsl(var(--muted))',
                }}
              />
            ))}
          </div>

          <p className="mt-2 text-[12px] text-muted-foreground">
            {concluido
              ? 'Concluído 🎉'
              : travadoPremium
              ? 'Disponível no Premium'
              : !d.desbloqueado
              ? `Conclua o desafio ${d.numero - 1} para liberar`
              : faltam > 0
              ? `Faltam ${faltam} card${faltam > 1 ? 's' : ''} hoje · dia ${Math.min(d.dias_concluidos + 1, d.dias)} de ${d.dias}`
              : `Meta de hoje batida! Dia ${d.dias_concluidos} de ${d.dias}`}
          </p>

          {!concluido && (travadoPremium || d.desbloqueado) && (
            <button
              onClick={onPraticar}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-xl text-[14px] font-bold text-white transition-all active:scale-[0.99]"
              style={{ background: travadoPremium ? 'hsl(var(--primary))' : d.cor }}
            >
              {travadoPremium ? 'Liberar com Premium' : 'Praticar agora'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const FlashcardsDesafios = () => {
  const navigate = useNavigate();
  const { ativo, concluidos, desafios, loading, indisponivel } = useFlashcardsDesafios();
  const { isPremium } = useSubscription();

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Desafios & Conquistas | Vade Mecum PRIME';
  }, []);

  const praticar = (d: FlashcardDesafio) => {
    haptic.selection();
    if (d.premium && !isPremium) { navigate('/assinatura'); return; }
    const params = new URLSearchParams();
    if (d.area) params.set('area', d.area);
    else params.set('modo', 'todos');
    if (d.tema) params.set('temas', d.tema);
    navigate(`/flashcards/estudar?${params.toString()}`);
  };

  const categoriasMap = desafios.reduce((acc, d) => {
    const cat = d.trilha_label || 'Outros Desafios';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(d);
    return acc;
  }, {} as Record<string, FlashcardDesafio[]>);

  const categorias = Object.keys(categoriasMap);

  return (
    <div className="min-h-dvh bg-background pb-12 pt-[calc(0.5rem+var(--sai-top,env(safe-area-inset-top,0px)))]">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        <PageHeader title="Desafios" onBack={() => navigate('/flashcards')} />

        <div className="mt-3">
          {/* Resumo do desafio ativo */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500">Seu desafio atual</p>
            {ativo ? (
              <>
                <p className="mt-1 text-[17px] font-bold text-foreground">Desafio {ativo.numero}</p>
                <p className="text-[13px] text-muted-foreground">
                  {ativo.descricao}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {ativo.respondidas_hoje}/{ativo.meta_diaria} cards hoje · dia{' '}
                  {Math.min(ativo.dias_concluidos + 1, ativo.dias)} de {ativo.dias}
                </p>
                <button
                  onClick={() => praticar(ativo)}
                  className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 text-[14px] font-bold text-white active:scale-[0.99]"
                >
                  Continuar desafio
                </button>
              </>
            ) : (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {loading ? 'Carregando…' : 'Nenhum desafio ativo agora.'}
              </p>
            )}
            {!loading && desafios.length > 0 && (
              <p className="mt-2 text-[12px] text-muted-foreground">
                {concluidos} de {desafios.length} desafios concluídos
              </p>
            )}
          </div>

          {indisponivel && (
            <p className="mt-4 rounded-xl border border-border bg-card p-4 text-[13px] text-muted-foreground">
              Os desafios ainda não estão ativos neste ambiente. Assim que a estrutura do banco for aplicada,
              eles aparecem aqui automaticamente.
            </p>
          )}

          {/* Categorias de desafios */}
          <div className="mt-6">
            <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">
              Categorias de Desafios
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {categorias.map((cat, idx) => {
                const des = categoriasMap[cat];
                const total = des.length;
                const concl = des.filter(d => d.status === 'concluido').length;
                
                return (
                  <AccordionItem key={cat} value={`cat-${idx}`} className="rounded-2xl border border-border bg-card overflow-hidden">
                    <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 text-left">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-foreground">{cat}</p>
                          <p className="text-[12px] text-muted-foreground">{concl}/{total} desafios concluídos</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="pt-2 space-y-3">
                        {des.map((d) => (
                          <DesafioCard key={d.desafio_id} d={d} isPremium={isPremium} onPraticar={() => praticar(d)} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardsDesafios;
