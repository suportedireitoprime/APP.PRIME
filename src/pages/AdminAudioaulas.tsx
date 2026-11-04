import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Headphones,
  Loader2,
  Copy,
  ChevronRight,
  ChevronDown,
  Play,
  Pause,
  Search,
  CheckCircle2,
  Volume2,
  FolderTree,
  FileAudio,
  Layers,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AudioaulaRow {
  id: number;
  area: string | null;
  tema: string | null;
  sequencia: number | null;
  titulo: string | null;
  descricao: string | null;
  url_audio: string | null;
}

export default function AdminAudioaulas() {
  const navigate = useNavigate();
  const [aulas, setAulas] = useState<AudioaulaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [areaSelecionada, setAreaSelecionada] = useState<string>('todas');
  const [temaSelecionado, setTemaSelecionado] = useState<string>('todos');
  const [aulaTocandoId, setAulaTocandoId] = useState<number | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  const carregarAulas = useCallback(async () => {
    setLoading(true);
    try {
      const todas: AudioaulaRow[] = [];
      const batchSize = 1000;
      for (let from = 0; ; from += batchSize) {
        const { data, error } = await supabase
          .from('audioaulas_acervo')
          .select('id, area, tema, sequencia, titulo, descricao, url_audio')
          .order('area', { ascending: true })
          .order('tema', { ascending: true })
          .order('sequencia', { ascending: true })
          .range(from, from + batchSize - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          todas.push(...(data as AudioaulaRow[]));
        }
        if (!data || data.length < batchSize) break;
      }
      setAulas(todas);
    } catch (e: any) {
      toast.error('Erro ao carregar acervo de audioaulas: ' + e?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarAulas();
    return () => {
      if (audioEl) {
        audioEl.pause();
      }
    };
  }, [carregarAulas]);

  const areas = useMemo(() => {
    const set = new Set<string>();
    aulas.forEach((a) => {
      if (a.area) set.add(a.area);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [aulas]);

  const temasDaArea = useMemo(() => {
    const set = new Set<string>();
    aulas.forEach((a) => {
      if ((areaSelecionada === 'todas' || a.area === areaSelecionada) && a.tema) {
        set.add(a.tema);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [aulas, areaSelecionada]);

  const aulasFiltradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return aulas.filter((a) => {
      if (areaSelecionada !== 'todas' && a.area !== areaSelecionada) return false;
      if (temaSelecionado !== 'todos' && a.tema !== temaSelecionado) return false;
      if (!q) return true;
      const haystack = `${a.titulo ?? ''} ${a.tema ?? ''} ${a.area ?? ''} ${a.descricao ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [aulas, areaSelecionada, temaSelecionado, busca]);

  const toggleTocar = (aula: AudioaulaRow) => {
    if (!aula.url_audio) {
      toast.error('Essa aula não possui URL de áudio cadastrada');
      return;
    }

    if (aulaTocandoId === aula.id) {
      if (audioEl) {
        audioEl.pause();
      }
      setAulaTocandoId(null);
      return;
    }

    if (audioEl) {
      audioEl.pause();
    }

    const novoAudio = new Audio(aula.url_audio);
    novoAudio.play().catch((err) => {
      toast.error('Erro ao reproduzir áudio: ' + err?.message);
    });
    novoAudio.onended = () => setAulaTocandoId(null);
    setAudioEl(novoAudio);
    setAulaTocandoId(aula.id);
  };

  const copiar = async (texto: string, label: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(`${label} copiado`);
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <PageHeader
        title="Gestão de Audioaulas"
        subtitle="Acervo Real de Produção"
        onBack={() => navigate('/admin-funcoes')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Cards de Métricas Reais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileAudio className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Total de Aulas</p>
              <p className="text-2xl font-black text-white">{loading ? '...' : aulas.length.toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Áreas do Direito</p>
              <p className="text-2xl font-black text-white">{loading ? '...' : areas.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">Módulos / Temas</p>
              <p className="text-2xl font-black text-white">
                {loading ? '...' : new Set(aulas.map((a) => `${a.area}::${a.tema}`).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Campo de Busca */}
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por título, tema ou palavra-chave..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-white/40 rounded-xl"
              />
            </div>

            {/* Seletor de Área */}
            <div>
              <select
                value={areaSelecionada}
                onChange={(e) => {
                  setAreaSelecionada(e.target.value);
                  setTemaSelecionado('todos');
                }}
                className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="todas">Todas as Áreas ({areas.length})</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Tema */}
            <div>
              <select
                value={temaSelecionado}
                onChange={(e) => setTemaSelecionado(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
              >
                <option value="todos">Todos os Temas ({temasDaArea.length})</option>
                {temasDaArea.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50 pt-2 border-t border-white/5">
            <span>
              Exibindo <strong>{aulasFiltradas.length}</strong> de {aulas.length} audioaulas
            </span>
            {(areaSelecionada !== 'todas' || temaSelecionado !== 'todos' || busca) && (
              <button
                onClick={() => {
                  setAreaSelecionada('todas');
                  setTemaSelecionado('todos');
                  setBusca('');
                }}
                className="text-purple-400 hover:text-purple-300 font-semibold"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Lista de Audioaulas */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-white/50 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <p className="text-sm">Carregando acervo de audioaulas...</p>
          </div>
        ) : aulasFiltradas.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-white/5 bg-white/[0.01]">
            <p className="text-white/40 text-sm">Nenhuma audioaula encontrada com os filtros aplicados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {aulasFiltradas.slice(0, 100).map((aula) => {
              const tocando = aulaTocandoId === aula.id;
              return (
                <div
                  key={aula.id}
                  className={cn(
                    'p-4 rounded-2xl border transition-all flex items-center justify-between gap-4',
                    tocando
                      ? 'border-purple-500/50 bg-purple-500/[0.08]'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]',
                  )}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <button
                      onClick={() => toggleTocar(aula)}
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95',
                        tocando ? 'bg-purple-600 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20',
                      )}
                      title={tocando ? 'Pausar' : 'Ouvir prévia'}
                    >
                      {tocando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                          {aula.area ?? 'Geral'}
                        </span>
                        {aula.tema && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 truncate max-w-[200px]">
                            {aula.tema}
                          </span>
                        )}
                        {aula.sequencia && (
                          <span className="text-[10px] text-white/40">Aula {aula.sequencia}</span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1 truncate">{aula.titulo}</h4>
                      {aula.descricao && (
                        <p className="text-xs text-white/50 truncate mt-0.5">{aula.descricao}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {aula.url_audio ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copiar(aula.url_audio!, 'Link do Áudio')}
                        className="h-8 px-2.5 text-xs text-white/60 hover:text-white"
                        title="Copiar URL do arquivo de áudio"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copiar URL
                      </Button>
                    ) : (
                      <span className="text-[11px] text-amber-400/80 bg-amber-400/10 px-2 py-1 rounded-md">
                        Sem áudio
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {aulasFiltradas.length > 100 && (
              <p className="text-center text-xs text-white/40 pt-4">
                Mostrando as primeiras 100 de {aulasFiltradas.length} aulas. Use os filtros acima para refinar.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
