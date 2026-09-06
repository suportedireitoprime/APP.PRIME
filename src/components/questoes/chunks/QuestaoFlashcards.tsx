import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, RotateCw, Check, Lightbulb, ChevronLeft, ChevronRight, Shuffle,
} from 'lucide-react';
import flipSoundAsset from '@/assets/flipcard.mp3.asset.json';
import { srcOf } from '@/lib/assetUrl';

export type CardIA = {
  frente: string;
  verso: string;
  explicacao?: string;
  exemplo?: string;
  dica?: string;
};

const embaralharArr = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Realça *ênfase* / **negrito** sem exibir os asteriscos crus. */
export const renderEnfase = (texto: string) =>
  String(texto ?? '')
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .map((parte, i) => {
      const m = parte.match(/^\*\*?([^*]+)\*\*?$/);
      if (m) return <strong key={i} className="font-bold">{m[1]}</strong>;
      return <span key={i}>{parte}</span>;
    });

/** Flashcards no mesmo padrão do Aprender: flip 3D, som e navegação. */
export function Flashcards({ cards }: { cards: CardIA[] }) {
  const [ordem, setOrdem] = useState<CardIA[]>([]);
  const [i, setI] = useState(0);
  const [virado, setVirado] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || audioRef.current) return;
    audioRef.current = new Audio(srcOf(flipSoundAsset));
    audioRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    setOrdem(embaralharArr(cards));
    setI(0);
    setVirado(false);
  }, [cards]);

  const total = ordem.length;
  const card = ordem[i];

  const flip = () => {
    setVirado((v) => !v);
    try {
      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        void a.play();
      }
    } catch {
      /* noop */
    }
  };

  const ir = (d: number) => {
    setVirado(false);
    setI((v) => Math.max(0, Math.min(total - 1, v + d)));
  };

  if (!total || !card) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nenhum flashcard gerado.</p>;
  }

  const versoTexto = card.explicacao || card.verso || '';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
          {i + 1} / {total}
        </span>
        <button
          onClick={() => {
            setOrdem(embaralharArr(ordem));
            setI(0);
            setVirado(false);
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-accent/50"
        >
          <Shuffle className="h-3.5 w-3.5" /> Embaralhar
        </button>
      </div>

      <div className="w-full min-h-0 flex-1" style={{ perspective: '1200px' }}>
        <motion.div
          className="relative h-full min-h-[360px] w-full cursor-pointer"
          animate={{ rotateY: virado ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
          onClick={flip}
        >
          <div
            className="absolute inset-0 flex flex-col rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-card via-card to-secondary p-6 shadow-2xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Frente</span>
              <Sparkles className="h-4 w-4 text-primary/60" />
            </div>
            <div className="flex flex-1 items-center justify-center overflow-y-auto text-center">
              <p className="text-[22px] font-semibold leading-relaxed text-foreground sm:text-[24px]">
                {renderEnfase(card.frente)}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 border-t border-border/40 pt-3 text-[13px] text-muted-foreground">
              <RotateCw className="h-4 w-4" /> Toque para virar
            </div>
          </div>

          <div
            className="absolute inset-0 flex flex-col rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-5 shadow-2xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary-foreground/80">
                Verso · Resposta
              </span>
              <Check className="h-4 w-4 text-primary-foreground/80" />
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-1 text-left">
              <p className="text-[19px] font-medium leading-relaxed text-primary-foreground sm:text-[20px]">
                {renderEnfase(versoTexto)}
              </p>
              {card.exemplo && (
                <div className="rounded-xl border border-black/15 bg-black/10 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-widest text-primary-foreground/90">
                    <Lightbulb className="h-4 w-4" /> Exemplo prático
                  </p>
                  <p className="text-[17px] font-medium leading-relaxed text-primary-foreground sm:text-[18px]">
                    {renderEnfase(card.exemplo)}
                  </p>
                </div>
              )}
              {card.dica && (
                <div className="rounded-xl border border-black/10 bg-black/5 p-4">
                  <p className="mb-2 text-[12px] font-extrabold uppercase tracking-widest text-primary-foreground/80">
                    Dica
                  </p>
                  <p className="text-[17px] font-medium leading-relaxed text-primary-foreground sm:text-[18px]">
                    {renderEnfase(card.dica)}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 border-t border-white/20 pt-3 text-[13px] text-primary-foreground/70">
              <RotateCw className="h-4 w-4" /> Toque para voltar
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-4 flex shrink-0 items-center justify-between gap-3">
        <button
          onClick={() => ir(-1)}
          disabled={i === 0}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-[14px] font-semibold text-foreground transition-colors hover:bg-accent/50 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <button
          onClick={() => ir(1)}
          disabled={i >= total - 1}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-[14px] font-bold text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-40"
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
