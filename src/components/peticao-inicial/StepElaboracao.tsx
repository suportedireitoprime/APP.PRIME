import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Juris, Peticao, SECOES } from '@/types/peticao';
import horusOwl from '@/assets/horus/horus-owl.webp';

function extractFontes(peca: string, juris: Juris[]): Array<{ label: string; url?: string }> {
  const out: Array<{ label: string; url?: string }> = [];
  const seen = new Set<string>();
  // Links markdown
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(peca)) !== null) {
    const url = m[2];
    if (url.startsWith('lei://') || url.startsWith('sumula://') || seen.has(url)) {
      if (!seen.has(url)) {
        seen.add(url);
        out.push({ label: m[1], url: url.startsWith('http') ? url : undefined });
      }
      continue;
    }
    seen.add(url);
    out.push({ label: m[1], url });
  }
  // Adiciona jurisprudências não citadas mas incluídas
  juris?.forEach((j) => {
    if (j.link && !seen.has(j.link)) {
      seen.add(j.link);
      out.push({
        label: `${j.tribunal} — ${j.titulo || j.tese?.slice(0, 60) || 'Jurisprudência'}`,
        url: j.link,
      });
    }
  });
  return out;
}

interface StepElaboracaoProps {
  pet: Peticao;
  onNext: (v: Partial<Peticao>) => void;
  onBack: () => void;
}

export function StepElaboracao({ pet, onNext, onBack }: StepElaboracaoProps) {
  const [current, setCurrent] = useState(0);
  const [, setFeitos] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [subFase, setSubFase] = useState<'redator' | 'revisor' | 'refinador' | 'ok'>('redator');
  const runningRef = useRef(false);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    let cancel = false;

    (async () => {
      let anteriores = '';
      const acc: Record<string, string> = {};
      for (let i = 0; i < SECOES.length; i++) {
        if (cancel) return;
        setCurrent(i);
        // Animação das 3 fases (cosmética — o backend roda os 3 agentes em série).
        setSubFase('redator');
        const fase2 = window.setTimeout(() => !cancel && setSubFase('revisor'), 4500);
        const fase3 = window.setTimeout(() => !cancel && setSubFase('refinador'), 9000);
        try {
          const { withOnlineGuard } = await import('@/lib/onlineGuard');
          const { data, error } = await withOnlineGuard(
            () => supabase.functions.invoke('peticao', {
              body: { fn: 'elaborar',
                secao_id: SECOES[i].id,
                fatos: pet.fatos_texto,
                resumo: pet.resumo,
                area_direito: pet.area_direito,
                sub_area: (pet.partes as any)?.sub_area,
                pedidos: pet.pedidos,
                partes: pet.partes,
                jurisprudencias: pet.jurisprudencias,
                anteriores,
              },
            }),
            { message: 'Sem internet — a elaboração da petição precisa de conexão.' },
          );
          window.clearTimeout(fase2);
          window.clearTimeout(fase3);
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          const texto = (data?.texto ?? '') as string;
          acc[SECOES[i].id] = texto;
          anteriores += '\n\n' + texto;
          setFeitos({ ...acc });
          setSubFase('ok');
        } catch (e: any) {
          window.clearTimeout(fase2);
          window.clearTimeout(fase3);
          if (!cancel) setError(e.message ?? 'Erro ao gerar seção');
          return;
        }
      }
      if (cancel) return;
      setCurrent(SECOES.length);
      const peca = SECOES.map((s) => acc[s.id]).filter(Boolean).join('\n\n');
      const fontes = extractFontes(peca, pet.jurisprudencias as Juris[]);
      setTimeout(() => {
        if (!cancel) onNext({ peca_markdown: peca, fontes });
      }, 500);
    })();

    return () => {
      cancel = true;
    };
  }, []);

  const faseLabel =
    subFase === 'redator'
      ? '✍️ Redator escrevendo o rascunho…'
      : subFase === 'revisor'
        ? '🔍 Revisor apontando falhas…'
        : subFase === 'refinador'
          ? '✨ Refinador polindo a versão final…'
          : '';

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-5">
      <motion.img
        src={horusOwl}
        alt="Horus redigindo"
        className="w-28 h-28 object-contain"
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
      <div>
        <h2 className="font-display text-xl font-bold">Redigindo sua petição…</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Três agentes trabalhando em cada seção: <strong>redator</strong>, <strong>revisor</strong> e <strong>refinador</strong>.
        </p>
        {current < SECOES.length && faseLabel && (
          <p className="text-xs text-[hsl(0_70%_40%)] mt-2 font-medium">{faseLabel}</p>
        )}
      </div>

      <div className="w-full max-w-sm space-y-2 text-left">
        {SECOES.map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition ${
              i < current
                ? 'bg-green-500/5 border-green-500/30'
                : i === current
                  ? 'bg-[hsl(0_72%_52%)]/10 border-[hsl(0_72%_52%)]'
                  : 'bg-card border-border opacity-60'
            }`}
          >
            {i < current ? (
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            ) : i === current ? (
              <Loader2 className="w-5 h-5 animate-spin text-[hsl(0_70%_40%)] shrink-0" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
            )}
            <span className="text-sm">{s.label}</span>
          </div>
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
