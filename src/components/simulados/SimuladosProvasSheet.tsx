import { useState, useMemo, useEffect } from 'react';
import { PrimeBottomSheet } from '../vademecum/overlays/PrimeBottomSheet';
import { X, Search, FileText, PlayCircle, BarChart3 } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  aberto: boolean;
  onFechar: () => void;
  simuladosList: any[];
  onIniciar: (sim: any) => void;
  onVerGabarito: (url: string, title: string) => void;
  onVerRaioX: (sim: any) => void;
  filtroInicialCargo?: string;
}

export const SimuladosProvasSheet = ({
  aberto,
  onFechar,
  simuladosList,
  onIniciar,
  onVerGabarito,
  onVerRaioX,
  filtroInicialCargo,
}: Props) => {
  const [tabCargo, setTabCargo] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  // Categorias dinâmicas baseadas em simuladosList
  const examsCategorias = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    for (const sim of simuladosList) {
      const examName = sim.exam?.name || 'Geral';
      const examId = sim.exam_id || sim.exam?.id || examName;
      if (!map.has(examId)) {
        map.set(examId, { id: examId, label: examName, count: 0 });
      }
      map.get(examId)!.count += 1;
    }
    const sorted = Array.from(map.values()).sort((a, b) => b.count - a.count);
    return [{ id: 'todos', label: 'Todas as Provas', count: simuladosList.length }, ...sorted];
  }, [simuladosList]);

  useEffect(() => {
    if (aberto && filtroInicialCargo) {
      const match = examsCategorias.find(c => 
        c.id === filtroInicialCargo || 
        c.label.toLowerCase().includes(filtroInicialCargo.toLowerCase())
      );
      if (match) {
        setTabCargo(match.id);
      } else {
        setTabCargo(filtroInicialCargo);
      }
    } else if (aberto && !filtroInicialCargo) {
      setTabCargo('todos');
    }
  }, [aberto, filtroInicialCargo, examsCategorias]);

  const filtradas = useMemo(() => {
    return simuladosList.filter((sim) => {
      const examId = sim.exam_id || sim.exam?.id;
      const examName = (sim.exam?.name || '').toLowerCase();
      if (tabCargo !== 'todos') {
        if (examId !== tabCargo && !examName.includes(tabCargo.toLowerCase())) {
          return false;
        }
      }

      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const ano = (sim.year || '').toString();
        const provaUrl = (sim.prova_url || '').toLowerCase();
        const exName = (sim.exam?.name || '').toLowerCase();
        if (!ano.includes(termo) && !provaUrl.includes(termo) && !exName.includes(termo)) return false;
      }
      return true;
    });
  }, [simuladosList, tabCargo, busca]);

  const getNomeProva = (sim: any) => {
    const raw = (sim.prova_url || '').trim();
    if (raw && !raw.startsWith('http')) return raw;
    const examName = sim.exam?.name || 'Exame Oficial';
    return `${examName} (${sim.year})`;
  };

  return (
    <PrimeBottomSheet open={aberto} onClose={onFechar}>
      <div className="flex h-full flex-col bg-zinc-950 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 pb-3 pt-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-[#7c3aed]" />
              <h2 className="text-base sm:text-lg font-black text-white">
                Provas Oficiais Digitalizadas
              </h2>
            </div>
            <p className="ml-3 text-[11px] text-zinc-400 mt-0.5">
              Escolha uma edição oficial para resolver no app ou ver gabarito.
            </p>
          </div>
          <button
            onClick={() => {
              try { haptic.selection(); } catch {}
              onFechar();
            }}
            className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Abas dinâmicas de Exames e Carreiras */}
        <div className="px-5 pt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {examsCategorias.map((cat) => {
            const active = tabCargo === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setTabCargo(cat.id);
                }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Busca */}
        <div className="px-5 pt-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por número do exame ou ano..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#7c3aed]"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 no-scrollbar">
          {filtradas.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Nenhuma prova encontrada.
            </div>
          ) : (
            filtradas.map((sim) => {
              const titulo = getNomeProva(sim);
              const qCount = sim.simulado_questions?.[0]?.count || 80;
              const examName = sim.exam?.name || 'Oficial';
              return (
                <div
                  key={sim.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 transition"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                      <span>{sim.year}</span>
                      <span>•</span>
                      <span>{qCount} Questões</span>
                      <span>•</span>
                      <span className="text-zinc-400 font-semibold truncate max-w-[140px]">{examName}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-0.5">
                      {titulo}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.selection(); } catch {}
                        onVerRaioX(sim);
                      }}
                      className="w-8 h-8 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center hover:bg-zinc-700 transition cursor-pointer"
                      title="Raio-X"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>

                    {sim.gabarito_url && (
                      <button
                        type="button"
                        onClick={() => {
                          try { haptic.selection(); } catch {}
                          onVerGabarito(sim.gabarito_url, `Gabarito - ${titulo}`);
                        }}
                        className="w-8 h-8 rounded-lg bg-zinc-800 text-emerald-400 flex items-center justify-center hover:bg-zinc-700 transition cursor-pointer"
                        title="Gabarito PDF"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact(); } catch {}
                        onIniciar(sim);
                      }}
                      className="h-8 px-3 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-extrabold text-[11px] uppercase flex items-center gap-1 transition cursor-pointer shadow-md shadow-[#7c3aed]/25"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Iniciar</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PrimeBottomSheet>
  );
};
export default SimuladosProvasSheet;
