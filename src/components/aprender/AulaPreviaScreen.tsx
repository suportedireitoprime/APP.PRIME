import { motion, type Variants } from 'framer-motion';
import { ArrowLeft, Clock, ListChecks, Play, RotateCcw, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export type PreviaAula = {
  topicos?: string[];
  porque_importa?: string;
  ao_final?: string[];
};

interface Props {
  titulo: string;
  objetivo: string | null;
  duracaoMin: number;
  previa: PreviaAula | null;
  progressoPct: number;
  podeContinuar: boolean;
  onVoltar: () => void;
  onComecar: () => void;
  onContinuar: () => void;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

/**
 * Tela de abertura da aula: contextualiza antes de mergulhar nos blocos.
 * Visual refinado: fundo escuro, cards com bordas sutis, amarelo só como acento.
 */
export function AulaPreviaScreen({
  titulo,
  objetivo,
  duracaoMin,
  previa,
  progressoPct,
  podeContinuar,
  onVoltar,
  onComecar,
  onContinuar,
}: Props) {
  const topicos = (previa?.topicos ?? []).filter(Boolean).slice(0, 6);
  const aoFinal = (previa?.ao_final ?? []).filter(Boolean).slice(0, 4);
  const porque = previa?.porque_importa || objetivo || null;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b border-border/60 bg-background/95"
        style={{ paddingTop: 'calc(var(--sai-top, env(safe-area-inset-top, 0px)) + 0.5rem)' }}
      >
        <div className="relative mx-auto flex max-w-2xl lg:max-w-6xl items-center justify-between px-4 lg:px-10 2xl:px-16 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onVoltar}
            aria-label="Voltar"
            className="h-11 w-11 rounded-full text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <p className="absolute left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Prévia da aula
          </p>
          <div className="h-11 w-11" aria-hidden="true" />
        </div>
      </header>

      {/* Conteúdo */}
      <main className="mx-auto w-full max-w-2xl lg:max-w-6xl flex-1 px-4 lg:px-10 2xl:px-16 pb-44 lg:pb-16 pt-5 lg:pt-10">
        <motion.div variants={container} initial="hidden" animate="show" className="lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-6">
          {/* Coluna esquerda */}
          <div className="lg:col-start-1">
          {/* Hero card */}
          <motion.div variants={item}>


            <Card className="relative overflow-hidden rounded-3xl border-border/70 bg-card">
              {/* Linha de destaque no topo */}
              <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />
              <CardContent className="p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/20">
                    <Clock className="h-3.5 w-3.5" />
                    ~{duracaoMin} min
                  </span>
                </div>
                <h1 className="mt-4 font-display text-[2rem] leading-[1.05] tracking-wide text-foreground sm:text-[2.35rem]">
                  {titulo}
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  Revise os conceitos com flashcards, exercícios e leituras guiadas.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Por que isso importa */}
          {porque && (
            <motion.div variants={item} className="mt-4">
              <Card className="rounded-2xl border-border/60 bg-card">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-3 flex items-center gap-2 text-primary">
                    <Target className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-[0.12em]">
                      Por que isso importa
                    </span>
                  </div>
                  <p className="text-[17px] leading-[1.65] text-foreground">{porque}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Ações — desktop (no mobile ficam na barra fixa) */}
          <motion.div variants={item} className="mt-4 hidden gap-3 lg:flex">
            {podeContinuar && (
              <Button
                onClick={onContinuar}
                className="h-14 flex-1 gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-hazard hover:bg-primary/90"
              >
                <Play className="h-5 w-5 fill-current" />
                Continuar de onde parei
              </Button>
            )}
            <Button
              onClick={onComecar}
              variant={podeContinuar ? 'outline' : 'default'}
              className={`h-14 flex-1 gap-2 rounded-2xl text-base font-semibold ${
                podeContinuar
                  ? 'border-border text-foreground hover:bg-muted'
                  : 'bg-primary text-primary-foreground shadow-hazard hover:bg-primary/90'
              }`}
            >
              {podeContinuar ? <RotateCcw className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
              {podeContinuar ? 'Começar do início' : 'Começar aula'}
            </Button>
          </motion.div>
          </div>

          {/* Coluna direita */}
          <div className="lg:col-start-2 lg:mt-0">

          {/* O que você vai ver */}

          {topicos.length > 0 && (
            <motion.div variants={item} className="mt-4">
              <div className="mb-3 flex items-center gap-2 px-1 text-muted-foreground">
                <ListChecks className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-[0.12em]">
                  O que você vai ver
                </span>
              </div>
              <Card className="rounded-2xl border-border/60 bg-card">
                <CardContent className="p-0">
                  <ul className="divide-y divide-border/60">
                    {topicos.map((t, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 px-5 py-3.5 first:pt-5 last:pb-5"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="text-[16px] leading-snug text-foreground">{t}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Ao final você vai saber */}
          {aoFinal.length > 0 && (
            <motion.div variants={item} className="mt-4">
              <div className="mb-3 flex items-center gap-2 px-1 text-muted-foreground">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-[0.12em]">
                  Ao final você vai saber
                </span>
              </div>
              <Card className="rounded-2xl border-primary/20 bg-primary/[0.04]">
                <CardContent className="p-5 sm:p-6">
                  <ul className="space-y-2.5">
                    {aoFinal.map((t, i) => (
                      <li key={i} className="flex items-start gap-3 text-[16px] leading-snug text-foreground">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Progresso */}
          <motion.div variants={item} className="mt-6">
            <Card className="rounded-2xl border-border/60 bg-card">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">Seu progresso</span>
                  <span className="tabular-nums font-semibold text-primary">{progressoPct}%</span>
                </div>
                <Progress value={progressoPct} className="h-2.5 bg-muted" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {progressoPct === 0
                    ? 'Você ainda não começou esta aula.'
                    : progressoPct === 100
                      ? 'Aula concluída. Ótimo trabalho!'
                      : 'Continue de onde parou para avançar na trilha.'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          </div>
        </motion.div>
      </main>

      {/* Footer com ações (mobile) */}
      <div
        className="fixed inset-x-0 bottom-0 border-t border-border/60 bg-background/95 px-4 pt-3 lg:hidden"

        style={{ paddingBottom: 'calc(0.875rem + var(--sai-bottom, env(safe-area-inset-bottom, 0px)))' }}
      >
        <div className="mx-auto flex max-w-2xl lg:max-w-3xl flex-col gap-2.5">
          {podeContinuar && (
            <Button
              onClick={onContinuar}
              className="h-14 w-full gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-hazard hover:bg-primary/90 active:scale-[0.98] transition-transform"
            >
              <Play className="h-5 w-5 fill-current" />
              Continuar de onde parei
            </Button>
          )}
          <Button
            onClick={onComecar}
            variant={podeContinuar ? 'outline' : 'default'}
            className={`h-14 w-full gap-2 rounded-2xl text-base font-semibold active:scale-[0.98] transition-transform ${
              podeContinuar
                ? 'border-border text-foreground hover:bg-muted'
                : 'bg-primary text-primary-foreground shadow-hazard hover:bg-primary/90'
            }`}
          >
            {!podeContinuar && <Play className="h-5 w-5 fill-current" />}
            {podeContinuar && <RotateCcw className="h-5 w-5" />}
            {podeContinuar ? 'Começar do início' : 'Começar aula'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AulaPreviaScreen;
