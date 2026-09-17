import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Mail, Globe, User, X, ChevronRight, CheckCircle2, Shield, Layers, Building2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { haptic } from '@/lib/nativeHaptics';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

export interface Senador {
  codigo: string;
  nome: string;
  nomeCompleto: string;
  partido: string;
  uf: string;
  foto: string;
  pagina: string;
  email: string;
  titular?: string;
}

interface ComissaoSenador {
  sigla: string;
  nome: string;
  participacao: string;
}

export const SenadoresLista = () => {
  const [senadores, setSenadores] = useState<Senador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroUf, setFiltroUf] = useState<string>('TODOS');
  const [filtroPartido, setFiltroPartido] = useState<string>('TODOS');
  
  const [senadorSelecionado, setSenadorSelecionado] = useState<Senador | null>(null);
  const [comissoes, setComissoes] = useState<ComissaoSenador[]>([]);
  const [loadingComissoes, setLoadingComissoes] = useState(false);

  useBodyScrollLock(!!senadorSelecionado);

  // Fechar com Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && senadorSelecionado) {
        setSenadorSelecionado(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [senadorSelecionado]);

  // Carregar Senadores em Exercício
  useEffect(() => {
    const fetchSenadores = async () => {
      try {
        setLoading(true);
        const res = await fetch('https://legis.senado.leg.br/dadosabertos/senador/lista/atual', {
          headers: { Accept: 'application/json' }
        });
        const data = await res.json();
        const listaRaw = data?.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
        const lista = Array.isArray(listaRaw) ? listaRaw : [listaRaw];

        const formatados: Senador[] = lista.map((item: any) => {
          const s = item?.IdentificacaoParlamentar;
          return {
            codigo: s?.CodigoParlamentar || '',
            nome: s?.NomeParlamentar || '',
            nomeCompleto: s?.NomeCompletoParlamentar || s?.NomeParlamentar || '',
            partido: s?.SiglaPartidoParlamentar || 'S/P',
            uf: s?.UfParlamentar || '',
            foto: s?.UrlFotoParlamentar || '',
            pagina: s?.UrlPaginaParlamentar || '',
            email: s?.EmailParlamentar || '',
          };
        });

        // Ordenar por nome
        formatados.sort((a, b) => a.nome.localeCompare(b.nome));
        setSenadores(formatados);
      } catch (err) {
        console.error('Erro ao carregar lista de senadores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSenadores();
  }, []);

  // Carregar comissões do senador selecionado
  useEffect(() => {
    if (!senadorSelecionado) {
      setComissoes([]);
      return;
    }

    const fetchComissoes = async () => {
      try {
        setLoadingComissoes(true);
        const url = `https://legis.senado.leg.br/dadosabertos/senador/${senadorSelecionado.codigo}/comissoes`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) return;

        const data = await res.json();
        const comsRaw = data?.MembroComissaoParlamentar?.Parlamentar?.MembroComissoes?.Comissao || [];
        const coms = Array.isArray(comsRaw) ? comsRaw : [comsRaw];

        // Apenas comissões ativas (sem data de fim)
        const ativas = coms.filter((c: any) => !c.DataFim).map((c: any) => ({
          sigla: c?.IdentificacaoComissao?.SiglaComissao || '',
          nome: c?.IdentificacaoComissao?.NomeComissao || '',
          participacao: c?.DescricaoParticipacao || 'Membro'
        }));

        setComissoes(ativas);
      } catch (err) {
        console.error('Erro ao carregar comissões do senador:', err);
      } finally {
        setLoadingComissoes(false);
      }
    };

    fetchComissoes();
  }, [senadorSelecionado]);

  // Lista de UFs e Partidos disponíveis para filtros
  const ufsDisponiveis = useMemo(() => {
    const set = new Set(senadores.map(s => s.uf).filter(Boolean));
    return ['TODOS', ...Array.from(set).sort()];
  }, [senadores]);

  const partidosDisponiveis = useMemo(() => {
    const set = new Set(senadores.map(s => s.partido).filter(Boolean));
    return ['TODOS', ...Array.from(set).sort()];
  }, [senadores]);

  // Senadores filtrados
  const senadoresFiltrados = useMemo(() => {
    return senadores.filter((s) => {
      const matchBusca = !busca || 
        s.nome.toLowerCase().includes(busca.toLowerCase()) || 
        s.nomeCompleto.toLowerCase().includes(busca.toLowerCase());
      const matchUf = filtroUf === 'TODOS' || s.uf === filtroUf;
      const matchPartido = filtroPartido === 'TODOS' || s.partido === filtroPartido;
      return matchBusca && matchUf && matchPartido;
    });
  }, [senadores, busca, filtroUf, filtroPartido]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-12 w-full max-w-5xl mx-auto">
      {/* Barra de Busca e Filtros */}
      <div className="bg-[#111111] p-4 rounded-2xl border border-white/10 flex flex-col gap-3 shadow-lg">
        {/* Campo de Busca */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por nome do senador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs font-bold placeholder-white/40 focus:outline-none focus:border-sky-500 transition-colors"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-white/50 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns de Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white/70">
            <Filter className="w-3 h-3 text-sky-400" />
            <span>Estado:</span>
            <select
              value={filtroUf}
              onChange={(e) => {
                haptic.selection();
                setFiltroUf(e.target.value);
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {ufsDisponiveis.map(uf => (
                <option key={uf} value={uf} className="bg-zinc-900 text-white">{uf}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-semibold text-white/70">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Partido:</span>
            <select
              value={filtroPartido}
              onChange={(e) => {
                haptic.selection();
                setFiltroPartido(e.target.value);
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {partidosDisponiveis.map(p => (
                <option key={p} value={p} className="bg-zinc-900 text-white">{p}</option>
              ))}
            </select>
          </div>

          <span className="text-[11px] text-white/40 font-semibold ml-auto">
            {senadoresFiltrados.length} de {senadores.length} senadores
          </span>
        </div>
      </div>

      {/* Grid de Senadores */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3 animate-pulse">
              <Skeleton className="w-14 h-14 rounded-full bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-white/10" />
                <Skeleton className="h-3 w-1/2 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : senadoresFiltrados.length === 0 ? (
        <div className="text-center text-white/50 py-12 px-6 flex flex-col items-center bg-white/5 rounded-2xl border border-white/5">
          <User className="w-12 h-12 opacity-30 mb-3 text-sky-400" />
          <h4 className="text-white font-bold text-sm mb-1">Nenhum senador encontrado</h4>
          <p className="text-xs text-white/60">Tente ajustar a busca por nome ou os filtros de Estado e Partido.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {senadoresFiltrados.map((s) => (
            <div
              key={s.codigo}
              onClick={() => {
                haptic.selection();
                setSenadorSelecionado(s);
              }}
              className="bg-[#111111]/80 backdrop-blur-sm rounded-2xl border border-white/10 p-3.5 flex items-center gap-3.5 hover:border-white/20 transition-all cursor-pointer group active:scale-[0.98] shadow-md"
            >
              {/* Foto Oficial */}
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white/5 border border-white/15 shrink-0 shadow-inner">
                {s.foto ? (
                  <img
                    src={s.foto}
                    alt={s.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <User className="w-8 h-8 text-white/30 m-auto mt-3" />
                )}
              </div>

              {/* Informações */}
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-[13.5px] text-white tracking-wide truncate group-hover:text-sky-400 transition-colors">
                  {s.nome}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    {s.partido}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                    {s.uf}
                  </span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes do Senador */}
      <div className={`fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-6 transition-all duration-300 ${senadorSelecionado ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setSenadorSelecionado(null)} />

        <div
          className={`relative bg-[#0d0f12] border-t sm:border border-white/10 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl flex flex-col transition-all duration-300 shadow-2xl z-10 ${senadorSelecionado ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95'}`}
          style={{ height: '85vh', maxHeight: '85vh' }}
        >
          {/* Header do Modal com Botão de Fechar 48px */}
          <div className="flex-none p-4 pb-2 w-full pt-4 relative flex items-center justify-between">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto sm:hidden cursor-pointer" onClick={() => setSenadorSelecionado(null)} />
            <button
              type="button"
              aria-label="Fechar detalhes do senador"
              className="absolute right-4 top-3.5 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer z-30 shadow-md shadow-black/50"
              onClick={(e) => {
                e.stopPropagation();
                haptic.selection();
                setSenadorSelecionado(null);
              }}
            >
              <X className="w-6 h-6 stroke-[2.4]" />
            </button>
          </div>

          <ScrollArea className="flex-1 w-full px-6 pb-8">
            {senadorSelecionado && (
              <div className="flex flex-col gap-5 pt-2">
                {/* Perfil Header */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-white/5 border-2 border-sky-500/40 shrink-0 shadow-lg">
                    {senadorSelecionado.foto ? (
                      <img
                        src={senadorSelecionado.foto}
                        alt={senadorSelecionado.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-white/30 m-auto mt-4" />
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest block mb-0.5">
                      Senador da República
                    </span>
                    <h2 className="text-xl font-black text-white leading-tight">
                      {senadorSelecionado.nome}
                    </h2>
                    <p className="text-xs text-white/60 mt-0.5 line-clamp-1">
                      {senadorSelecionado.nomeCompleto}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        {senadorSelecionado.partido}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/90">
                        Estado: {senadorSelecionado.uf}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contato Oficial */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                  <span className="text-[10px] font-extrabold text-white/40 uppercase tracking-widest block mb-1">
                    Gabinete e Contato Oficial
                  </span>
                  {senadorSelecionado.email && (
                    <a
                      href={`mailto:${senadorSelecionado.email}`}
                      className="flex items-center gap-2 text-xs text-sky-400 hover:underline font-semibold"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {senadorSelecionado.email}
                    </a>
                  )}
                  {senadorSelecionado.pagina && (
                    <a
                      href={senadorSelecionado.pagina}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-white/80 hover:text-white font-semibold transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      Página Oficial no Portal do Senado
                    </a>
                  )}
                </div>

                {/* Comissões do Senador */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Comissões Atuantes
                    </span>
                    <span className="text-[11px] text-white/40 font-semibold">
                      {comissoes.length} ativas
                    </span>
                  </div>

                  {loadingComissoes ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-10 w-full bg-white/10 rounded-xl" />
                      ))}
                    </div>
                  ) : comissoes.length === 0 ? (
                    <p className="text-xs text-white/50 italic bg-white/5 p-3 rounded-xl">
                      Nenhuma comissão ativa registrada no momento.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {comissoes.map((com, idx) => (
                        <div
                          key={idx}
                          className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="font-extrabold text-xs text-white block truncate">
                              {com.sigla} - {com.nome}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                            com.participacao === 'Titular' 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-white/10 text-white/70'
                          }`}>
                            {com.participacao}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="pt-2">
                  <a
                    href={`https://www25.senado.leg.br/web/senadores/senador/-/perfil/${senadorSelecionado.codigo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-3 px-4 rounded-xl font-bold text-xs transition-all shadow-lg shadow-sky-600/20 active:scale-[0.99]"
                  >
                    Ver Biografia e Projetos de Lei Aprovados
                  </a>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
export default SenadoresLista;
