import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Peticao } from '@/types/peticao';
import horusOwl from '@/assets/horus/horus-owl.webp';

interface StepTriagemProps {
  pet: Peticao;
  onNext: (v: Partial<Peticao>) => void;
  onBack: () => void;
}

export function StepTriagem({ pet, onNext, onBack }: StepTriagemProps) {
  const CHECKS = [
    'Ouvindo os fatos com atenção',
    'Identificando as partes envolvidas',
    'Classificando a área do direito',
    'Levantando os pedidos',
    'Estruturando a triagem',
  ];
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancel = false;
    const interval = setInterval(() => {
      setStep((s) => (s < CHECKS.length - 1 ? s + 1 : s));
    }, 900);

    (async () => {
      try {
        const { withOnlineGuard } = await import('@/lib/onlineGuard');
        const { data, error } = await withOnlineGuard(
          () => supabase.functions.invoke('peticao', {
            body: { fn: 'triagem', fatos: pet.fatos_texto },
          }),
          { message: 'Sem internet — a triagem da petição precisa de conexão.' },
        );
        clearInterval(interval);
        if (cancel) return;
        if (error) throw error;
        if (!data || data.error) throw new Error(data?.error ?? 'Erro na triagem');
        setStep(CHECKS.length);
        setTimeout(() => {
          if (!cancel) {
            onNext({
              area_direito: data.area_direito ?? null,
              tags: Array.isArray(data.tags) ? data.tags : [],
              resumo: data.resumo ?? null,
              pedidos: Array.isArray(data.pedidos) ? data.pedidos : [],
              partes: {
                autor: data.partes_sugeridas?.autor ?? '',
                reu: data.partes_sugeridas?.reu ?? '',
                sub_area: data.sub_area ?? '',
              },
            });
          }
        }, 700);
      } catch (e: any) {
        clearInterval(interval);
        if (!cancel) setError(e.message ?? 'Erro na triagem');
      }
    })();

    return () => {
      cancel = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-5">
      <motion.img
        src={horusOwl}
        alt="Horus analisando"
        className="w-28 h-28 object-contain"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      <h2 className="font-display text-xl font-bold">Horus está analisando seu caso…</h2>

      <div className="w-full max-w-sm space-y-2 text-left">
        {CHECKS.map((c, i) => (
          <motion.div
            key={c}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: i <= step ? 1 : 0.4, x: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
          >
            {i < step ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            ) : i === step ? (
              <Loader2 className="w-5 h-5 animate-spin text-[hsl(0_70%_40%)] shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
            )}
            <span className="text-sm">{c}</span>
          </motion.div>
        ))}
      </div>

      {error && (
        <div className="space-y-3 w-full max-w-sm">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={onBack} className="w-full">
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
}
