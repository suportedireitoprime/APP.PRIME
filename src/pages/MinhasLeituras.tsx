import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Play, Timer } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import LivroDetailSheet from '@/components/biblioteca/LivroDetailSheet';
import { useGoBack } from '@/hooks/useGoBack';
import { subscribeTracking, type LivroSnapshot } from '@/lib/bibliotecaTracking';
import { readLeituraProgress, formatDuration } from '@/lib/leituraProgress';
import { pullLeituraProgress } from '@/lib/leituraProgressSync';
import { directImg } from '@/lib/cdnImg';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';

const paraLivro = (s: LivroSnapshot): LivroNormalizado => ({
  id: s.id,
  titulo: s.titulo,
  autor: s.autor ?? null,
  sobre: s.sobre ?? null,
  capa: s.capa ?? null,
  link: s.link ?? null,
  download: s.download ?? null,
  area: s.area ?? null,
  colecaoId: s.colecaoId,
});

/** Lista de todas as leituras em andamento do usuário. */
export default function MinhasLeituras() {
  const voltar = useGoBack('/inicio');
  const [tick, setTick] = useState(0);
  const [livroAberto, setLivroAberto] = useState<LivroNormalizado | null>(null);

  useEffect(() => subscribeTracking(() => setTick((t) => t + 1)), []);
  useEffect(() => {
    void pullLeituraProgress().then(() => setTick((t) => t + 1));
  }, []);

  const itens = useMemo(() => readLeituraProgress(tick), [tick]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader
        title="Minhas leituras"
        subtitle={`${itens.length} ${itens.length === 1 ? 'livro em andamento' : 'livros em andamento'}`}
        onBack={voltar}
      />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-2.5">
        {itens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Nenhuma leitura em andamento. Abra um livro na Biblioteca para começar.
            </p>
          </div>
        ) : (
          itens.map(({ snap, index, total, percent, readTimeMs, etaMs }, i) => (
            <motion.button
              key={`${snap.colecaoId}:${snap.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.24) }}
              onClick={() => setLivroAberto(paraLivro(snap))}
              className="w-full flex gap-3 items-stretch rounded-2xl border border-border/60 bg-card p-3 text-left active:scale-[0.99] transition"
            >
              <div className="relative w-[72px] h-[100px] shrink-0 rounded-xl overflow-hidden bg-muted">
                {snap.capa ? (
                  <img
                    src={directImg(snap.capa, 240)}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <BookOpen className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p className="font-display text-foreground text-[15px] font-bold leading-tight line-clamp-2">
                    {snap.titulo}
                  </p>
                  {snap.autor && (
                    <p className="font-body text-muted-foreground text-[12px] truncate mt-0.5">
                      {snap.autor}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
                    <span>{total ? `Pág. ${index + 1} de ${total}` : `Pág. ${index + 1}`}</span>
                    {percent > 0 && <span className="text-primary font-semibold">{percent}%</span>}
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary/60 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(2, percent)}%` }} />
                  </div>
                  <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(readTimeMs)}
                    </span>
                    {etaMs != null && (
                      <span className="inline-flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />~{formatDuration(etaMs)} restantes
                      </span>
                    )}
                    <span className="ml-auto w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>

      <LivroDetailSheet livro={livroAberto} open={!!livroAberto} onClose={() => setLivroAberto(null)} />
    </div>
  );
}
