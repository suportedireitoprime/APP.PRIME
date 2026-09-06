import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import {
  BookOpen, Layers, Scale, AlertTriangle, Sparkles, ChevronRight, BookOpenText, BookA,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AcaoTipo } from '@/hooks/useQuestaoAcao';
import { useGatedFeature } from '@/hooks/useGatedFeature';
import {
  Overlay,
  PainelAcao,
  TITULOS,
  OPCOES_RESUMOS,
  type Fonte,
  type SeletorTipo,
  ComentarioSheet,
  ComentarioInner,
} from './chunks';

export { ComentarioSheet, ComentarioInner };

type Aba = AcaoTipo | null;

/** Trilho de recursos da questão (mini-aula, flashcards, resumos, termos, pegadinhas, lei seca, revisar). */
export function QuestaoAcoesBar({
  source,
  chaveRevisao,
  layout = 'horizontal',
}: {
  source: Fonte;
  chaveRevisao: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
}) {
  const [aba, setAba] = useState<Aba>(null);
  const [seletor, setSeletor] = useState<SeletorTipo>(null);
  const gate = useGatedFeature('questao_funcoes', 'questao_funcoes');
  const isFree = !gate.isPremium && !gate.isAdmin;

  useEffect(() => {
    setAba(null);
    setSeletor(null);
  }, [chaveRevisao]);

  const RailBtn = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => {
    if (layout === 'vertical') {
      return (
        <button
          type="button"
          onClick={() => {
            if (isFree) {
              gate.openGate();
              return;
            }
            onClick();
          }}
          className="flex h-12 w-full shrink-0 items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-4 text-left transition-all hover:bg-black/30 active:scale-[0.98]"
        >
          <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
          <span className="text-[15px] font-semibold text-white/90">{label}</span>
        </button>
      );
    }
    if (layout === 'grid') {
      return (
        <button
          type="button"
          onClick={() => {
            if (isFree) {
              gate.openGate();
              return;
            }
            onClick();
          }}
          className="flex h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/5 bg-black/20 px-1 text-white/60 transition-all hover:bg-black/40 hover:text-white active:scale-95"
        >
          <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
          <span className="text-[11px] font-semibold tracking-tight">{label}</span>
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={() => {
          if (isFree) {
            gate.openGate();
            return;
          }
          onClick();
        }}
        className="flex shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground min-w-[76px]"
      >
        <Icon className="h-8 w-8" strokeWidth={1.2} />
        <span className="whitespace-nowrap text-[12px] font-medium leading-tight">{label}</span>
      </button>
    );
  };

  return (
    <>
      {gate.gateNode}

      <div
        className={cn(
          layout === 'vertical'
            ? 'flex flex-col gap-2 w-full'
            : layout === 'grid'
            ? 'grid grid-cols-3 sm:grid-cols-4 gap-2 w-full'
            : 'scrollbar-none -mx-1 flex w-full snap-x snap-mandatory items-stretch gap-1 overflow-x-auto px-1',
        )}
      >
        <RailBtn icon={BookOpen} label="Aula" onClick={() => setAba('aula')} />
        <RailBtn icon={Layers} label="Flashcards" onClick={() => setAba('flashcards')} />
        <RailBtn icon={BookOpenText} label="Resumos" onClick={() => setSeletor('resumos')} />
        <RailBtn icon={BookA} label="Termos" onClick={() => setAba('termos')} />
        <RailBtn icon={AlertTriangle} label="Pegadinhas" onClick={() => setAba('pegadinhas')} />
        <RailBtn icon={Scale} label="Lei seca" onClick={() => setAba('lei')} />
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {seletor && (
              <Overlay key="seletor" onClose={() => setSeletor(null)} titulo="Tipo de resumo" icone={Sparkles}>
                <div className="flex flex-col gap-2">
                  {OPCOES_RESUMOS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSeletor(null);
                          setAba(opt.tipo);
                        }}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-tight">{opt.label}</p>
                          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">{opt.desc}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </Overlay>
            )}

            {aba && (
              <Overlay key="painel" onClose={() => setAba(null)} titulo={TITULOS[aba]} icone={Sparkles} alto={aba === 'flashcards'}>
                <PainelAcao source={source} tipo={aba} />
              </Overlay>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
