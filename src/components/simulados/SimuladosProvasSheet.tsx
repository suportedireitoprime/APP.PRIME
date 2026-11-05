import { useState, useMemo } from 'react';
import { PrimeBottomSheet } from '../vademecum/overlays/PrimeBottomSheet';
import { X, Search, FileText, PlayCircle, BarChart3, Scale } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  aberto: boolean;
  onFechar: () => void;
  simuladosList: any[];
  onIniciar: (sim: any) => void;
  onVerGabarito: (url: string, title: string) => void;
  onVerRaioX: (sim: any) => void;
}

export const SimuladosProvasSheet = ({
  aberto,
  onFechar,
  simuladosList,
  onIniciar,
  onVerGabarito,
  onVerRaioX,
}: Props) => {
  const [tabCargo, setTabCargo] = useState<'oab' | 'juiz'>('oab');
  const [busca, setBusca] = useState('');

  const filtradas = useMemo(() => {
    return simuladosList.filter((sim) => {
      const examName = (sim.exam?.name || '').toLowerCase();
      const isJuiz = examName.includes('juiz');
      if (tabCargo === 'juiz' && !isJuiz) return false;
      if (tabCargo === 'oab' && isJuiz) return false;

      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const ano = (sim.year || '').toString();
        const provaUrl = (sim.prova_url || '').toLowerCase();
        if (!ano.includes(termo) && !provaUrl.includes(termo)) return false;
      }
      return true;
    });
  }, [simuladosList, tabCargo, busca]);

  const getNomeProva = (sim: any) => {
    const isJuiz = (sim.exam?.name || '').toLowerCase().includes('juiz');
    if (isJuiz) return `Concurso Juiz Substituto (${sim.year})`;
    const raw = (sim.prova_url || '').trim();
    if (/^\d{1,2}[ºoªa]?\s+Exame/i.test(raw)) return raw;
    const match = raw.match(/(\d{1,2})[ºoªa]?\s*exame/i);
    if (match) return `${match[1]}º Exame de Ordem Unificado (${sim.year})`;
    return `Exame de Ordem (${sim.year})`;
  };

  return (
    <PrimeBottomSheet open={aberto} onClose={onFechar}>
      <div className="flex h-full flex-col bg-zinc-950 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 pb-3 pt-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-rose-500" />
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

        {/* Abas OAB vs Juiz */}
        <div className="px-5 pt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              setTabCargo('oab');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tabCargo === 'oab'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            OAB (47 Provas)
          </button>
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {}
              setTabCargo('juiz');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tabCargo === 'juiz'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
            }`}
          >
            Magistratura (6 Concursos)
          </button>
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
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
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
              const isJuiz = tabCargo === 'juiz';
              return (
                <div
                  key={sim.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 transition"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                      <span>{sim.year}</span>
                      <span>•</span>
                      <span>{isJuiz ? '100 Questões' : '80 Questões'}</span>
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
                      className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] uppercase flex items-center gap-1 transition cursor-pointer"
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
