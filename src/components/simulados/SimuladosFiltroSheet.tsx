import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PrimeBottomSheet } from '../vademecum/overlays/PrimeBottomSheet';
import { Filter, X } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import { StepRow, SelecaoSheet } from '../questoes/chunks';

export interface SimuladoFiltroConfig {
  cargoId: string;
  cargoNome: string;
  simuladoId?: string;
  ano: string;
  disciplinas: string[];
  modo: 'oficial' | 'estudo';
  quantidade: number | null;
}

interface Props {
  aberto: boolean;
  onFechar: () => void;
  onIniciar: (config: SimuladoFiltroConfig) => void;
  simuladosList: any[];
}

const CARGOS_OPCOES = [
  { id: 'oab', label: 'OAB (Exame de Ordem)', desc: '47 Provas Oficiais • 3.820 Questões Digitalizadas (FGV)', disponivel: true },
  { id: 'juiz', label: 'Juiz de Direito (Magistratura)', desc: '6 Concursos Oficiais • 600 Questões (TJSP, TJGO, etc)', disponivel: true },
  { id: 'delegado', label: 'Delegado de Polícia', desc: 'Polícia Civil e Federal • Em breve novas provas', disponivel: false },
  { id: 'pf', label: 'Polícia Federal (PF)', desc: 'Agente, Escrivão e Perito • Em breve', disponivel: false },
  { id: 'prf', label: 'Polícia Rodoviária Federal (PRF)', desc: 'Policial Rodoviário Federal • Em breve', disponivel: false },
];

const DISCIPLINAS_OAB = [
  'Ética Profissional',
  'Direito Constitucional',
  'Direito Civil',
  'Direito Processual Civil',
  'Direito Penal',
  'Direito Processual Penal',
  'Direito Administrativo',
  'Direito Tributário',
  'Direito do Trabalho',
  'Direito Processual do Trabalho',
  'Direito Empresarial',
  'Direitos Humanos',
  'Direito Internacional',
  'Direito Ambiental',
  'Direito da Criança e do Adolescente',
  'Direito do Consumidor',
  'Direito Financeiro',
  'Direito Previdenciário',
  'Direito Eleitoral',
];

export const SimuladosFiltroSheet = ({
  aberto,
  onFechar,
  onIniciar,
  simuladosList,
}: Props) => {
  const [cargoId, setCargoId] = useState('oab');
  const [ano, setAno] = useState('recente');
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [modo, setModo] = useState<'oficial' | 'estudo'>('oficial');
  const [quantidade, setQuantidade] = useState<number | null>(null);

  const [passoAtivo, setPassoAtivo] = useState<null | 'cargo' | 'ano' | 'disciplinas' | 'quantidade'>(null);

  // Provas do cargo selecionado
  const provasDoCargo = useMemo(() => {
    return simuladosList.filter((s) => {
      const examName = (s.exam?.name || '').toLowerCase();
      if (cargoId === 'juiz') return examName.includes('juiz');
      return !examName.includes('juiz');
    });
  }, [simuladosList, cargoId]);

  // Lista de anos/edições disponíveis
  const opcoesAnos = useMemo(() => {
    const years = Array.from(new Set(provasDoCargo.map((s) => s.year?.toString()).filter(Boolean)));
    return ['Mais Recente (Recomendado)', ...years.sort((a, b) => Number(b) - Number(a))];
  }, [provasDoCargo]);

  const cargoAtual = CARGOS_OPCOES.find((c) => c.id === cargoId) || CARGOS_OPCOES[0];

  const handleConfirmar = () => {
    try { haptic.impact(); } catch {}
    let provaAlvo = provasDoCargo[0];
    if (ano !== 'recente' && ano !== 'Mais Recente (Recomendado)') {
      const match = provasDoCargo.find((s) => s.year?.toString() === ano);
      if (match) provaAlvo = match;
    }

    onIniciar({
      cargoId,
      cargoNome: cargoAtual.label,
      simuladoId: provaAlvo?.id,
      ano,
      disciplinas,
      modo,
      quantidade,
    });
  };

  const totalQuestoesPrevistas = quantidade || (cargoId === 'juiz' ? 100 : 80);

  return (
    <PrimeBottomSheet open={aberto} onClose={onFechar}>
      <div className="flex h-full flex-col bg-zinc-950 text-white">
        {/* Header do Sheet */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 pb-3 pt-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-[#7c3aed]" />
              <h2 className="text-base sm:text-lg font-black text-white">
                Filtro Rápido de Simulados
              </h2>
            </div>
            <p className="ml-3 text-[11px] text-zinc-400 mt-0.5">
              Escolha cargo, edição e disciplinas para começar.
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

        {/* Corpo dos Passos */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 no-scrollbar">
          {/* Passo 1: Escolher Cargo */}
          <StepRow
            step={1}
            label="Escolher Cargo"
            hint={cargoAtual.label}
            active={passoAtivo === 'cargo'}
            done={true}
            onClick={() => setPassoAtivo('cargo')}
          />

          {/* Passo 2: Ano / Edição */}
          <StepRow
            step={2}
            label="Edição / Ano da Prova"
            hint={ano === 'recente' ? 'Mais Recente (Recomendado)' : ano}
            active={passoAtivo === 'ano'}
            done={ano !== 'recente'}
            onClick={() => setPassoAtivo('ano')}
          />

          {/* Passo 3: Disciplinas */}
          <StepRow
            step={3}
            label="Disciplinas"
            hint={
              disciplinas.length === 0
                ? 'Todas as matérias oficiais'
                : `${disciplinas.length} matéria(s) selecionada(s)`
            }
            active={passoAtivo === 'disciplinas'}
            done={disciplinas.length > 0}
            badge={disciplinas.length || undefined}
            onClick={() => setPassoAtivo('disciplinas')}
          />

          {/* Passo 4: Modo do Simulado */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
                Modo de Prova
              </span>
              <p className="text-xs text-zinc-300 font-bold mt-0.5">
                {modo === 'oficial' ? 'Simulado Real (Tempo Oficial 5h)' : 'Modo Estudo (Comentários Rápidos)'}
              </p>
            </div>
            <div className="flex gap-1 rounded-xl bg-zinc-900 border border-zinc-800 p-1">
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setModo('oficial');
                }}
                className={cn(
                  'h-8 rounded-lg px-3 text-xs font-bold transition-all cursor-pointer',
                  modo === 'oficial'
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                Oficial
              </button>
              <button
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {}
                  setModo('estudo');
                }}
                className={cn(
                  'h-8 rounded-lg px-3 text-xs font-bold transition-all cursor-pointer',
                  modo === 'estudo'
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25'
                    : 'text-zinc-400 hover:text-white'
                )}
              >
                Estudo
              </button>
            </div>
          </div>

          {/* Passo 5: Quantidade */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
                Quantidade
              </span>
              <p className="text-xs text-zinc-300 font-bold mt-0.5">
                {quantidade ? `${quantidade} Questões` : 'Prova Completa'}
              </p>
            </div>
            <div className="flex gap-1 rounded-xl bg-zinc-900 border border-zinc-800 p-1">
              {[null, 40, 20, 10].map((q) => (
                <button
                  key={q ?? 'all'}
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setQuantidade(q);
                  }}
                  className={cn(
                    'h-8 rounded-lg px-2.5 text-xs font-bold transition-all cursor-pointer',
                    quantidade === q
                      ? 'bg-[#7c3aed] text-white shadow-md shadow-[#7c3aed]/25'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  {q === null ? 'Toda' : `${q}Q`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé com Botão Primário de Iniciar */}
        <div className="border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-5 py-4 pb-safe-nav">
          <button
            onClick={handleConfirmar}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] hover:from-[#8b5cf6] hover:to-[#7c3aed] text-base font-black text-white shadow-xl shadow-[#7c3aed]/30 active:scale-[0.98] transition-all cursor-pointer [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)] border border-violet-400/30"
          >
            <Filter className="h-5 w-5 drop-shadow-md" fill="currentColor" />
            <span>Iniciar Simulado</span>
            <span className="ml-1.5 rounded-full bg-black/30 px-2.5 py-0.5 text-xs font-extrabold">
              {totalQuestoesPrevistas} Qs
            </span>
          </button>
        </div>

        {/* Sub-Sheets de Seleção */}
        <AnimatePresence>
          {passoAtivo === 'cargo' && (
            <SelecaoSheet
              key="cargo"
              titulo="Escolher Cargo"
              single
              opcoes={CARGOS_OPCOES.map((c) => c.label)}
              descricoes={Object.fromEntries(CARGOS_OPCOES.map((c) => [c.label, c.desc]))}
              selecionado={[cargoAtual.label]}
              onFechar={() => setPassoAtivo(null)}
              onConfirmar={(v) => {
                const found = CARGOS_OPCOES.find((c) => c.label === v[0]);
                if (found) {
                  setCargoId(found.id);
                  setAno('recente');
                  setDisciplinas([]);
                }
              }}
            />
          )}

          {passoAtivo === 'ano' && (
            <SelecaoSheet
              key="ano"
              titulo="Edição / Ano da Prova"
              single
              opcoes={opcoesAnos}
              selecionado={[ano === 'recente' ? 'Mais Recente (Recomendado)' : ano]}
              onFechar={() => setPassoAtivo(null)}
              onConfirmar={(v) => {
                const selected = v[0];
                if (selected === 'Mais Recente (Recomendado)') {
                  setAno('recente');
                } else {
                  setAno(selected);
                }
              }}
            />
          )}

          {passoAtivo === 'disciplinas' && (
            <SelecaoSheet
              key="disciplinas"
              titulo="Disciplinas Oficiais"
              buscavel
              opcoes={DISCIPLINAS_OAB}
              selecionado={disciplinas}
              onFechar={() => setPassoAtivo(null)}
              onConfirmar={(v) => setDisciplinas(v)}
            />
          )}
        </AnimatePresence>
      </div>
    </PrimeBottomSheet>
  );
};
export default SimuladosFiltroSheet;
