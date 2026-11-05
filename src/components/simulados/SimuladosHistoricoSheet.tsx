import { PrimeBottomSheet } from '../vademecum/overlays/PrimeBottomSheet';
import { X, Clock, PlayCircle } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  aberto: boolean;
  onFechar: () => void;
  tipo: 'historico' | 'desempenho' | 'revisao';
  historicoList: any[];
  onContinuar: (simuladoId: string) => void;
}

export const SimuladosHistoricoSheet = ({
  aberto,
  onFechar,
  tipo,
  historicoList,
  onContinuar,
}: Props) => {
  const titulos = {
    historico: 'Histórico de Simulados',
    desempenho: 'Seu Desempenho Geral',
    revisao: 'Revisão de Erros',
  };

  const subtitulos = {
    historico: 'Simulados finalizados e em andamento',
    desempenho: 'Aproveitamento e taxa de acertos acumulada',
    revisao: 'Questões erradas para você reforçar e fixar',
  };

  const totalRespondidos = historicoList.length;
  const totalAcertos = historicoList.reduce((acc, h) => acc + (h.acertos || 0), 0);
  const totalQuestoes = historicoList.reduce((acc, h) => acc + (h.total_questoes || 0), 0);
  const pctGeral = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0;

  return (
    <PrimeBottomSheet open={aberto} onClose={onFechar}>
      <div className="flex h-full flex-col bg-zinc-950 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 pb-3 pt-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-[#7c3aed]" />
              <h2 className="text-base sm:text-lg font-black text-white">
                {titulos[tipo]}
              </h2>
            </div>
            <p className="ml-3 text-[11px] text-zinc-400 mt-0.5">
              {subtitulos[tipo]}
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

        {/* Resumo Rápido */}
        <div className="px-5 pt-4 pb-2">
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-center">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">Simulados</span>
              <p className="text-base font-black text-white mt-0.5">{totalRespondidos}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Acertos</span>
              <p className="text-base font-black text-emerald-300 mt-0.5">{totalAcertos}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-violet-400 uppercase">Aproveitamento</span>
              <p className="text-base font-black text-violet-300 mt-0.5">{pctGeral}%</p>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5 no-scrollbar">
          {historicoList.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs space-y-2">
              <Clock className="w-8 h-8 mx-auto text-zinc-600" />
              <p>Nenhum simulado registrado ainda.</p>
              <p className="text-[11px] text-zinc-600">Inicie um simulado para registrar seu histórico.</p>
            </div>
          ) : (
            historicoList.map((item) => {
              const aproveitamento = item.total_questoes > 0
                ? Math.round((item.acertos / item.total_questoes) * 100)
                : 0;
              const isFinalizado = item.status === 'finalizado';

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {item.simulado?.prova_url || `Simulado (${item.simulado?.year || 'Oficial'})`}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                        isFinalizado ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {isFinalizado ? 'Finalizado' : 'Em Andamento'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {item.acertos || 0} de {item.total_questoes || 80} acertos ({aproveitamento}%)
                    </p>
                  </div>

                  {!isFinalizado && (
                    <button
                      type="button"
                      onClick={() => {
                        try { haptic.impact(); } catch {}
                        onContinuar(item.simulado_id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-md shadow-[#7c3aed]/25"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Retomar</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </PrimeBottomSheet>
  );
};
export default SimuladosHistoricoSheet;
