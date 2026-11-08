import { useState, useMemo, useEffect } from 'react';
import { PrimeBottomSheet } from '../vademecum/overlays/PrimeBottomSheet';
import {
  X, Search, FileText, PlayCircle, BarChart3,
  SlidersHorizontal, Check, RotateCcw, Filter,
  Layers, BookOpen, Calendar, Building2, Tag
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface Props {
  aberto: boolean;
  onFechar: () => void;
  simuladosList: any[];
  onIniciar: (sim: any, filtroMaterias?: string[]) => void;
  onVerGabarito: (url: string, title: string) => void;
  onVerRaioX: (sim: any) => void;
  filtroInicialCargo?: string;
}

const DISCIPLINAS_SUGERIDAS = [
  'Direito Constitucional',
  'Direito Penal',
  'Direito Administrativo',
  'Direito Processual Penal',
  'Direito Civil',
  'Direito Processual Civil',
  'Direito Tributário',
  'Direito do Trabalho',
  'Direito Processual do Trabalho',
  'Direito Empresarial',
  'Ética Profissional',
  'Direitos Humanos',
  'Direito Ambiental',
  'Direito do Consumidor',
  'Direito Previdenciário',
  'Direito Eleitoral',
  'Legislação Especial',
  'Língua Portuguesa',
  'Raciocínio Lógico',
  'Informática',
  'Legislação de Trânsito',
];

const TEMAS_SUGERIDOS = [
  'Princípios Fundamentais',
  'Direitos e Garantias',
  'Controle de Constitucionalidade',
  'Teoria do Crime',
  'Crimes contra a Pessoa',
  'Crimes contra o Patrimônio',
  'Atos Administrativos',
  'Licitações e Contratos',
  'Responsabilidade Civil',
  'Inquérito e Ação Penal',
  'Prisões e Liberdade Provisória',
  'Recursos em Espécie',
];

const ANOS_OPCOES = [
  { id: 'todos', label: 'Todos os Anos' },
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' },
  { id: '2022', label: '2022' },
  { id: '2021', label: '2021' },
  { id: 'anteriores', label: '2020 e anteriores' },
];

const BANCAS_OPCOES = [
  { id: 'todas', label: 'Todas as Bancas' },
  { id: 'fgv', label: 'FGV' },
  { id: 'cebraspe', label: 'Cebraspe / Cespe' },
  { id: 'vunesp', label: 'Vunesp' },
  { id: 'fcc', label: 'FCC' },
  { id: 'mpe', label: 'MPE / Própria' },
];

export const SimuladosProvasSheet = ({
  aberto,
  onFechar,
  simuladosList,
  onIniciar,
  onVerGabarito,
  onVerRaioX,
  filtroInicialCargo,
}: Props) => {
  const [busca, setBusca] = useState('');
  const [filtroModalAberto, setFiltroModalAberto] = useState(false);

  // Estados dos filtros avançados
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([]);
  const [selectedTema, setSelectedTema] = useState<string>('');
  const [selectedAno, setSelectedAno] = useState<string>('todos');
  const [selectedBanca, setSelectedBanca] = useState<string>('todas');

  // Lista dinâmica de provas/exames para seleção múltipla
  const examsOpcoes = useMemo(() => {
    const map = new Map<string, { id: string; label: string; count: number }>();
    for (const sim of simuladosList) {
      const examName = sim.exam?.name || 'Geral';
      const examId = sim.exam_id || sim.exam?.id || examName;
      if (!map.has(examId)) {
        map.set(examId, { id: examId, label: examName, count: 0 });
      }
      map.get(examId)!.count += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [simuladosList]);

  // Se vier com filtro inicial de cargo ao abrir
  useEffect(() => {
    if (aberto && filtroInicialCargo) {
      const match = examsOpcoes.find(
        (c) =>
          c.id === filtroInicialCargo ||
          c.label.toLowerCase().includes(filtroInicialCargo.toLowerCase())
      );
      if (match) {
        setSelectedExams([match.id]);
      } else {
        setSelectedExams([filtroInicialCargo]);
      }
    } else if (aberto && !filtroInicialCargo && selectedExams.length === 0) {
      // mantem limpo
    }
  }, [aberto, filtroInicialCargo, examsOpcoes]);

  // Alternar exame na multi-seleção
  const toggleExam = (id: string) => {
    try { haptic.selection(); } catch {}
    setSelectedExams((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Alternar matéria na multi-seleção
  const toggleMateria = (materia: string) => {
    try { haptic.selection(); } catch {}
    setSelectedMaterias((prev) =>
      prev.includes(materia) ? prev.filter((m) => m !== materia) : [...prev, materia]
    );
  };

  // Limpar todos os filtros
  const limparTodosFiltros = () => {
    try { haptic.selection(); } catch {}
    setSelectedExams([]);
    setSelectedMaterias([]);
    setSelectedTema('');
    setSelectedAno('todos');
    setSelectedBanca('todas');
    setBusca('');
  };

  // Total de filtros ativos
  const totalFiltrosAtivos =
    selectedExams.length +
    selectedMaterias.length +
    (selectedTema ? 1 : 0) +
    (selectedAno !== 'todos' ? 1 : 0) +
    (selectedBanca !== 'todas' ? 1 : 0);

  const getNomeProva = (sim: any) => {
    const raw = (sim.prova_url || '').trim();
    if (raw && !raw.startsWith('http')) return raw;
    const examName = sim.exam?.name || 'Exame Oficial';
    return `${examName} • ${sim.year}`;
  };

  const getExamQCount = (sim: any) => {
    const examName = (sim.exam?.name || '').toLowerCase();
    if (examName.includes('prf') || examName.includes('rodovi')) return 120;
    if (examName.includes('oab')) return 80;
    if (examName.includes('escrevente') || examName.includes('tjsp')) return 100;
    if (examName.includes('juiz') || examName.includes('magistratura')) return 100;
    if (examName.includes('promotor') || examName.includes('mpe')) return 100;
    if (examName.includes('delegado')) return 100;
    if (examName.includes('analista')) return 70;
    return sim.simulado_questions?.[0]?.count || 80;
  };

  // Filtragem dinâmica
  const filtradas = useMemo(() => {
    return simuladosList.filter((sim) => {
      const examId = (sim.exam_id || sim.exam?.id || '').toLowerCase();
      const examName = (sim.exam?.name || '').toLowerCase();
      const provaUrl = (sim.prova_url || '').toLowerCase();
      const ano = (sim.year || '').toString();
      const titulo = getNomeProva(sim).toLowerCase();

      // 1. Filtro de Várias Provas / Exames (Multi-seleção)
      if (selectedExams.length > 0) {
        const matchesAnyExam = selectedExams.some((exId) => {
          const exClean = exId.toLowerCase();
          return examId === exClean || examName.includes(exClean) || provaUrl.includes(exClean);
        });
        if (!matchesAnyExam) return false;
      }

      // 2. Filtro de Ano
      if (selectedAno && selectedAno !== 'todos') {
        if (selectedAno === 'anteriores') {
          if (Number(ano) >= 2021) return false;
        } else if (ano !== selectedAno) {
          return false;
        }
      }

      // 3. Filtro de Banca
      if (selectedBanca && selectedBanca !== 'todas') {
        const bancaClean = selectedBanca.toLowerCase();
        if (!provaUrl.includes(bancaClean) && !examName.includes(bancaClean)) return false;
      }

      // 4. Filtro de Tema / Matéria
      if (selectedTema.trim()) {
        const temaClean = selectedTema.toLowerCase();
        if (
          !provaUrl.includes(temaClean) &&
          !examName.includes(temaClean) &&
          !titulo.includes(temaClean)
        ) {
          return false;
        }
      }

      // 5. Busca por texto livre
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        if (
          !ano.includes(termo) &&
          !provaUrl.includes(termo) &&
          !examName.includes(termo) &&
          !titulo.includes(termo)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [simuladosList, selectedExams, selectedAno, selectedBanca, selectedTema, busca]);

  return (
    <>
      <PrimeBottomSheet open={aberto} onClose={onFechar}>
        <div className="flex h-full flex-col bg-zinc-950 text-white font-sans">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 pb-3 pt-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-[#7c3aed]" />
                <div
                  className="text-base sm:text-lg font-bold text-white tracking-tight"
                  style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                >
                  Provas Oficiais Digitalizadas
                </div>
              </div>
              <p className="ml-3 text-[11px] text-zinc-400 mt-0.5 font-sans">
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

          {/* Barra Superior: Busca + Botão de Filtro Avançado (sem o menu de alternância antigo) */}
          <div className="px-5 pt-3.5 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por número, órgão, banca ou ano..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#7c3aed] font-sans"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Botão de Filtro (abre modal com Provas, Matérias, Temas, etc.) */}
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setFiltroModalAberto(true);
                }}
                className={`h-11 px-3.5 sm:px-4 rounded-xl flex items-center gap-2 font-bold text-xs transition-all cursor-pointer shrink-0 ${
                  totalFiltrosAtivos > 0
                    ? 'bg-[#7c3aed] text-white shadow-lg shadow-[#7c3aed]/30 border border-violet-400/40'
                    : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4 text-violet-400" />
                <span className="hidden sm:inline">Filtros</span>
                {totalFiltrosAtivos > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-white text-zinc-950 font-black text-[10px] grid place-items-center">
                    {totalFiltrosAtivos}
                  </span>
                ) : (
                  <span className="sm:hidden text-xs">Filtros</span>
                )}
              </button>
            </div>

            {/* Chips de Filtros Ativos (quando selecionados) */}
            {totalFiltrosAtivos > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0 mr-1">
                  Ativos ({totalFiltrosAtivos}):
                </span>

                {selectedExams.map((exId) => {
                  const label = examsOpcoes.find((e) => e.id === exId)?.label || exId;
                  return (
                    <button
                      key={exId}
                      onClick={() => toggleExam(exId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-950/70 border border-violet-700/60 text-violet-200 text-[11px] font-medium shrink-0 hover:bg-violet-900/60"
                    >
                      <span className="truncate max-w-[120px]">{label}</span>
                      <X className="w-3 h-3 text-violet-400" />
                    </button>
                  );
                })}

                {selectedMaterias.map((mat) => (
                  <button
                    key={mat}
                    onClick={() => toggleMateria(mat)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/70 border border-blue-700/60 text-blue-200 text-[11px] font-medium shrink-0 hover:bg-blue-900/60"
                  >
                    <span className="truncate max-w-[120px]">{mat}</span>
                    <X className="w-3 h-3 text-blue-400" />
                  </button>
                ))}

                {selectedTema && (
                  <button
                    onClick={() => setSelectedTema('')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 text-[11px] font-medium shrink-0 hover:bg-emerald-900/60"
                  >
                    <span className="truncate max-w-[120px]">Tema: {selectedTema}</span>
                    <X className="w-3 h-3 text-emerald-400" />
                  </button>
                )}

                {selectedAno !== 'todos' && (
                  <button
                    onClick={() => setSelectedAno('todos')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-700/60 text-amber-200 text-[11px] font-medium shrink-0 hover:bg-amber-900/60"
                  >
                    <span>Ano: {selectedAno}</span>
                    <X className="w-3 h-3 text-amber-400" />
                  </button>
                )}

                {selectedBanca !== 'todas' && (
                  <button
                    onClick={() => setSelectedBanca('todas')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-700/60 text-rose-200 text-[11px] font-medium shrink-0 hover:bg-rose-900/60"
                  >
                    <span>Banca: {selectedBanca.toUpperCase()}</span>
                    <X className="w-3 h-3 text-rose-400" />
                  </button>
                )}

                <button
                  onClick={limparTodosFiltros}
                  className="text-[11px] text-zinc-400 hover:text-white underline shrink-0 px-2 cursor-pointer font-medium"
                >
                  Limpar tudo
                </button>
              </div>
            )}
          </div>

          {/* Contador de resultados */}
          <div className="px-5 pt-2 flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              Mostrando <strong className="text-white font-bold">{filtradas.length}</strong> de {simuladosList.length} provas oficiais
            </span>
            {selectedMaterias.length > 0 && (
              <span className="text-violet-400 font-medium">
                {selectedMaterias.length} matéria(s) vinculada(s)
              </span>
            )}
          </div>

          {/* Lista de Provas Oficiais */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 no-scrollbar">
            {filtradas.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Filter className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-zinc-400 text-xs font-medium">
                  Nenhuma prova encontrada com os filtros selecionados.
                </p>
                <button
                  onClick={limparTodosFiltros}
                  className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-violet-400 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              filtradas.map((sim) => {
                const titulo = getNomeProva(sim);
                const qCount = getExamQCount(sim);
                const examName = sim.exam?.name || 'Oficial';
                return (
                  <div
                    key={sim.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 transition"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-violet-400 font-sans">
                        <span>{sim.year}</span>
                        <span>•</span>
                        <span className="font-bold text-violet-300">{qCount} Questões</span>
                        <span>•</span>
                        <span className="text-zinc-400 font-normal truncate max-w-[150px]">{examName}</span>
                      </div>
                      {/* Título com Tipografia legível Plus Jakarta Sans */}
                      <div
                        className="text-xs sm:text-sm font-semibold text-zinc-100 font-sans tracking-normal leading-snug truncate mt-0.5"
                        style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
                      >
                        {titulo}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          try { haptic.selection(); } catch {}
                          onVerRaioX(sim);
                        }}
                        className="w-8 h-8 rounded-lg bg-zinc-800 text-amber-400 flex items-center justify-center hover:bg-zinc-700 transition cursor-pointer"
                        title="Raio-X de Disciplinas"
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
                          onIniciar(sim, selectedMaterias.length > 0 ? selectedMaterias : undefined);
                        }}
                        className="h-8 px-3 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-md shadow-[#7c3aed]/25"
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

      {/* ── MODAL / BOTTOM SHEET DE FILTROS AVANÇADOS ── */}
      <PrimeBottomSheet open={filtroModalAberto} onClose={() => setFiltroModalAberto(false)}>
        <div className="flex h-full flex-col bg-zinc-950 text-white font-sans max-h-[90vh]">
          {/* Header do Filtro */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 pb-3 pt-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-violet-400" />
              <div
                className="text-base sm:text-lg font-bold text-white tracking-tight"
                style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif' }}
              >
                Filtrar Provas e Simulados
              </div>
            </div>
            <button
              onClick={() => setFiltroModalAberto(false)}
              className="grid h-9 w-9 place-items-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conteúdo de Filtros com Scroll */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 no-scrollbar">
            {/* 1. Provas e Carreiras (Multi-seleção) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400">
                  <Layers className="w-4 h-4" />
                  <span>Provas Oficiais (Escolha uma ou várias)</span>
                </div>
                {selectedExams.length > 0 && (
                  <button
                    onClick={() => setSelectedExams([])}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Marcar todas
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {examsOpcoes.map((ex) => {
                  const isChecked = selectedExams.includes(ex.id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => toggleExam(ex.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isChecked
                          ? 'bg-violet-950/70 border-violet-500 text-white shadow-sm'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold leading-tight truncate">{ex.label}</p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{ex.count} edições digitalizadas</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition ${
                          isChecked
                            ? 'bg-[#7c3aed] border-violet-400 text-white'
                            : 'border-zinc-700 bg-zinc-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Matérias / Disciplinas (Multi-seleção) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Matérias Jurídicas</span>
                </div>
                {selectedMaterias.length > 0 && (
                  <button
                    onClick={() => setSelectedMaterias([])}
                    className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
                  >
                    Limpar matérias
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DISCIPLINAS_SUGERIDAS.map((mat) => {
                  const isChecked = selectedMaterias.includes(mat);
                  return (
                    <button
                      key={mat}
                      type="button"
                      onClick={() => toggleMateria(mat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                      <span>{mat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Tema / Assunto Específico */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Tag className="w-4 h-4" />
                <span>Tema ou Assunto</span>
              </div>
              <input
                type="text"
                value={selectedTema}
                onChange={(e) => setSelectedTema(e.target.value)}
                placeholder="Ex: Controle de Constitucionalidade, Inquérito, Teoria da Pena..."
                className="w-full h-10 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {TEMAS_SUGERIDOS.map((tema) => (
                  <button
                    key={tema}
                    type="button"
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setSelectedTema(selectedTema === tema ? '' : tema);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                      selectedTema === tema
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tema}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Ano da Prova */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Calendar className="w-4 h-4" />
                <span>Ano da Prova</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {ANOS_OPCOES.map((ano) => (
                  <button
                    key={ano.id}
                    type="button"
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setSelectedAno(ano.id);
                    }}
                    className={`px-2 py-1.5 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                      selectedAno === ano.id
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {ano.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Banca Examinadora */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                <Building2 className="w-4 h-4" />
                <span>Banca Examinadora</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BANCAS_OPCOES.map((banca) => (
                  <button
                    key={banca.id}
                    type="button"
                    onClick={() => {
                      try { haptic.selection(); } catch {}
                      setSelectedBanca(banca.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedBanca === banca.id
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {banca.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer do Modal com Ações */}
          <div className="flex items-center justify-between border-t border-zinc-800/80 px-5 py-3.5 bg-zinc-900/90 gap-3">
            <button
              type="button"
              onClick={limparTodosFiltros}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>

            <button
              type="button"
              onClick={() => {
                try { haptic.impact(); } catch {}
                setFiltroModalAberto(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs shadow-lg shadow-[#7c3aed]/30 transition cursor-pointer"
            >
              Aplicar Filtros ({filtradas.length} provas)
            </button>
          </div>
        </div>
      </PrimeBottomSheet>
    </>
  );
};

export default SimuladosProvasSheet;
