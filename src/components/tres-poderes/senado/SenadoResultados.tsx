import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Calendar as CalendarIcon, ExternalLink, FileText, ChevronRight, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { haptic } from '@/lib/nativeHaptics';

interface ItemResultado {
  codigoItem: string;
  codigoMateria?: string;
  identificacao: string;
  DescricaoIdentificacaoMateria?: string;
  ementaPapeleta?: string;
  autorMateria?: string;
  parecer?: string;
  textoResultado?: string;
  descricaoDeliberacao?: string;
}

interface SessaoResultado {
  codigoSessao: string;
  numeroSessao: string;
  dataSessao: string;
  horaSessao: string;
  descricaoTipoSessao: string;
  Itens?: {
    Item: ItemResultado | ItemResultado[];
  };
}

export const SenadoResultados = () => {
  const [dataBusca, setDataBusca] = useState(() => {
    const d = new Date();
    // Default para ontem ou hoje em formato YYYY-MM-DD
    return d.toISOString().split('T')[0];
  });

  const [sessoes, setSessoes] = useState<SessaoResultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fetchResultados = async (dataISO: string) => {
    try {
      setLoading(true);
      setErro(null);

      const cleanData = dataISO.replace(/-/g, '');
      const url = `https://legis.senado.leg.br/dadosabertos/plenario/resultado/${cleanData}`;
      
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) {
        setSessoes([]);
        return;
      }

      const json = await res.json();
      const sessoesRaw = json?.ResultadoPlenario?.Sessoes?.Sessao;
      
      if (!sessoesRaw) {
        setSessoes([]);
      } else {
        const arr = Array.isArray(sessoesRaw) ? sessoesRaw : [sessoesRaw];
        setSessoes(arr.filter(s => s && (s.numeroSessao || s.descricaoTipoSessao || s.Itens)));
      }
    } catch (err: unknown) {
      console.error('Erro ao buscar resultados de sessões:', err);
      setErro('Não foi possível carregar os resultados desta data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResultados(dataBusca);
  }, [dataBusca]);

  const getCorResultado = (texto?: string) => {
    if (!texto) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    const t = texto.toLowerCase();
    if (t.includes('aprovad')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (t.includes('rejeitad')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (t.includes('adiad') || t.includes('vista')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
  };

  return (
    <div className="flex flex-col gap-5 px-4 pb-12 w-full max-w-4xl mx-auto">
      {/* Barra de Filtro de Data */}
      <div className="bg-[#111111] p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-white font-bold text-sm">Data das Deliberações</h3>
            <p className="text-white/50 text-xs">Consulte o que foi votado e decidido pelo Plenário</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dataBusca}
            onChange={(e) => {
              haptic.selection();
              setDataBusca(e.target.value);
            }}
            className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3 animate-pulse">
              <Skeleton className="h-5 w-2/3 bg-white/10" />
              <Skeleton className="h-4 w-1/3 bg-white/10" />
              <Skeleton className="h-20 w-full bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : erro ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <p className="text-red-400 text-sm mb-3">{erro}</p>
          <button
            onClick={() => fetchResultados(dataBusca)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      ) : sessoes.length === 0 ? (
        <div className="text-center text-white/50 py-12 px-6 flex flex-col items-center bg-white/5 rounded-2xl border border-white/5">
          <Info className="w-12 h-12 opacity-30 mb-3 text-sky-400" />
          <h4 className="text-white font-bold text-sm mb-1">Nenhuma deliberação registrada nesta data</h4>
          <p className="text-xs text-white/60 max-w-sm mb-4">
            Em datas sem sessões deliberativas (como fins de semana, segundas, sextas ou recesso), não há votações nominais para exibição.
          </p>
          <button
            onClick={() => {
              haptic.selection();
              setDataBusca('2026-02-25'); // Exemplo real com várias votações
            }}
            className="text-xs text-sky-400 hover:underline font-bold"
          >
            Ver exemplo de sessão deliberativa (25/02/2026)
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sessoes.map((sessao, sIdx) => {
            const rawItens = sessao.Itens?.Item || [];
            const itens: ItemResultado[] = Array.isArray(rawItens) ? rawItens : [rawItens];

            return (
              <div key={sIdx} className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                {/* Header da Sessão */}
                <div className="bg-[#18181b] p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest block mb-0.5">
                      Sessão nº {sessao.numeroSessao}
                    </span>
                    <h3 className="text-white font-black text-sm uppercase">
                      {sessao.descricaoTipoSessao}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-white/60 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{sessao.horaSessao}</span>
                    <span>•</span>
                    <span>{sessao.dataSessao}</span>
                  </div>
                </div>

                {/* Lista de Matérias Deliberadas */}
                <div className="p-4 space-y-4">
                  {itens.length === 0 ? (
                    <p className="text-xs text-white/50 italic">Nenhum item deliberado nesta sessão.</p>
                  ) : (
                    itens.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3 hover:border-white/15 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-bold text-white text-[13px] leading-snug">
                            {item.DescricaoIdentificacaoMateria || item.identificacao}
                          </h4>
                          {item.descricaoDeliberacao && (
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-white/10 text-white/90 whitespace-nowrap">
                              {item.descricaoDeliberacao}
                            </span>
                          )}
                        </div>

                        {item.ementaPapeleta && (
                          <p className="text-xs text-white/70 leading-relaxed text-justify">
                            {item.ementaPapeleta}
                          </p>
                        )}

                        {item.autorMateria && (
                          <p className="text-[11px] text-white/50">
                            <strong className="text-white/70">Autoria:</strong> {item.autorMateria}
                          </p>
                        )}

                        {item.textoResultado && (
                          <div className={`p-3 rounded-lg border text-xs leading-relaxed ${getCorResultado(item.textoResultado)}`}>
                            <span className="font-extrabold uppercase tracking-wider block mb-1">
                              Resultado Oficial:
                            </span>
                            <p className="whitespace-pre-line font-medium text-white/90">
                              {item.textoResultado.trim()}
                            </p>
                          </div>
                        )}

                        {item.codigoMateria && (
                          <div className="pt-1 flex justify-end">
                            <a
                              href={`https://www25.senado.leg.br/web/atividade/materias/-/materia/${item.codigoMateria}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Ver Tramitação Completa
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default SenadoResultados;
