import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings2, CheckCircle2, Lightbulb, PlayCircle } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { limparTitulo } from '@/lib/videoaulasCatalogos';
import { useAreaTrilhaStore } from '@/lib/areaTrilhasStore';
import { Drawer, DrawerContent, DrawerPortal, DrawerOverlay } from '@/components/ui/drawer';
import type { Aula } from './areaTypes';

interface AreaTrilhaMapProps {
  areaSlug: string;
  catalogoId: string;
  aulas: Aula[];
}

export const AreaTrilhaMap = ({ areaSlug, catalogoId, aulas }: AreaTrilhaMapProps) => {
  const navigate = useNavigate();
  const { trilhasAtivas, limparAreaTrilha, marcarDiaConcluido, desmarcarDiaConcluido } = useAreaTrilhaStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const trilhaAtiva = trilhasAtivas[areaSlug];

  const nodos = useMemo(() => {
    if (!trilhaAtiva || !aulas.length) return [];
    const diasList = [];

    // Distribui as aulas pelo número de dias selecionado
    const aulasPorDia = Math.ceil(aulas.length / trilhaAtiva.diasMeta);
    let aulaIndex = 0;

    for (let i = 0; i < trilhaAtiva.diasMeta; i++) {
      const selecionadas = [];
      for (let a = 0; a < aulasPorDia; a++) {
        if (aulaIndex < aulas.length) {
          selecionadas.push(aulas[aulaIndex]);
          aulaIndex++;
        }
      }
      diasList.push({ dia: i + 1, aulas: selecionadas });
    }
    return diasList;
  }, [aulas, trilhaAtiva]);

  if (!trilhaAtiva) return null;

  const totalConcluido = trilhaAtiva.diasConcluidos.length;
  const progressoPct = Math.round((totalConcluido / trilhaAtiva.diasMeta) * 100);

  return (
    <div className="w-full pb-32">
      <div className="sticky top-[58px] z-40 bg-background/95 border-b border-white/5 px-4 py-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[10px] uppercase font-black text-primary tracking-widest mb-0.5">Missão Local</p>
          <p className="text-sm font-bold text-foreground truncate max-w-[200px]">{trilhaAtiva.diasMeta} Dias</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-primary">{progressoPct}%</span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressoPct}%` }} />
            </div>
          </div>
          <button
            onClick={() => {
              haptic.selection();
              setDrawerOpen(true);
            }}
            aria-label="Ajustes da Missão"
            className="p-2 rounded-full bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-10 relative overflow-hidden">
        <div className="absolute left-1/2 top-10 bottom-10 w-1.5 bg-white/5 -translate-x-1/2 z-0 rounded-full overflow-hidden">
          <div
            className="w-full bg-primary/80 transition-all duration-700 ease-in-out"
            style={{ height: `${(totalConcluido / trilhaAtiva.diasMeta) * 100}%`, boxShadow: '0 0 10px rgba(var(--primary), 0.5)' }}
          />
        </div>

        <div className="space-y-10">
          {nodos.map((nodo, i) => {
            const concluido = trilhaAtiva.diasConcluidos.includes(nodo.dia);
            const isLeft = i % 2 === 0;

            return (
              <motion.div
                key={nodo.dia}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ type: 'spring', stiffness: 110, damping: 15, delay: i * 0.05 }}
                className={`relative z-10 flex w-full items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`absolute top-1/2 w-[calc(50%-2.5rem)] h-[2px] border-b-2 border-dotted -translate-y-1/2 z-0 ${concluido ? 'border-primary/40' : 'border-white/10'} ${isLeft ? 'left-1/2' : 'right-1/2'}`} />

                <button
                  onClick={() => {
                    haptic.selection();
                    if (concluido) {
                      desmarcarDiaConcluido(areaSlug, nodo.dia);
                    } else {
                      marcarDiaConcluido(areaSlug, nodo.dia);
                    }
                  }}
                  aria-label={`Dia ${nodo.dia} - ${concluido ? 'Concluído' : 'Pendente'}`}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-20 flex items-center justify-center transition-all duration-300 ${
                    concluido
                      ? 'bg-primary border-4 border-background shadow-[0_0_15px_rgba(var(--primary),0.6)] scale-110'
                      : 'bg-[#1A1A1A] border-4 border-background text-muted-foreground'
                  }`}
                >
                  {concluido ? (
                    <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <span className="text-[11px] font-black">{nodo.dia}</span>
                  )}
                </button>

                <div
                  className={`w-[45%] rounded-3xl p-4 relative z-30 transition-all duration-300 border ${
                    concluido
                      ? 'bg-primary/5 border-primary/20 shadow-sm opacity-80'
                      : 'bg-card/40 border-white/10 shadow-lg hover:border-white/20 hover:-translate-y-1'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${concluido ? 'text-primary/70' : 'text-muted-foreground'}`}>
                      Dia {nodo.dia}
                    </p>
                    {(nodo.dia === 1 || nodo.dia === trilhaAtiva.diasMeta) && !concluido && (
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-500/70 animate-pulse" />
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {nodo.aulas.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic">Revisão livre</p>
                    ) : (
                      nodo.aulas.map((aula) => (
                        <button
                          key={String(aula.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            haptic.light();
                            navigate(`/videoaulas/${catalogoId}/${areaSlug}/${aula.video_id}`);
                          }}
                          className="flex flex-col gap-1 w-full text-left group"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${concluido ? 'bg-primary/20' : 'bg-white/5 group-hover:bg-primary/20'}`}>
                              <PlayCircle className={`w-3 h-3 ${concluido ? 'text-primary' : 'text-foreground/70 group-hover:text-primary'}`} />
                            </div>
                            <p className={`text-[11px] font-semibold line-clamp-3 leading-tight ${concluido ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary transition-colors'}`}>
                              {limparTitulo(aula.titulo)
                                .replace(new RegExp(`^${aula.area} - `, 'i'), '')
                                .replace(new RegExp(`^${aula.area} `, 'i'), '')}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/60 z-50" onClick={() => setDrawerOpen(false)} />
          <DrawerContent className="bg-card border-t border-white/10 flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-50 pb-[calc(1.25rem+var(--sai-bottom))]">
            <div className="p-6">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />
              <h3 className="text-xl font-black mb-2">Ajustes da Missão</h3>
              <p className="text-sm text-muted-foreground mb-8">
                Você definiu o prazo de <strong className="text-foreground">{trilhaAtiva.diasMeta} dias</strong> para finalizar esta disciplina.
              </p>
              <button
                onClick={() => {
                  haptic.medium();
                  limparAreaTrilha(areaSlug);
                  setDrawerOpen(false);
                }}
                className="w-full bg-destructive/10 text-destructive font-bold py-4 rounded-2xl hover:bg-destructive/20 transition-colors active:scale-[0.98]"
              >
                Abortar Missão
              </button>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </div>
  );
};
