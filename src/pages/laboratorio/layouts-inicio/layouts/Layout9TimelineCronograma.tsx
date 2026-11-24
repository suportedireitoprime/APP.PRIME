import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, Square, Play, Pause, RotateCcw, 
  Clock, Calendar, Flame, Trophy, Sparkles, ChevronRight 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export const Layout9TimelineCronograma: React.FC = () => {
  const navigate = useNavigate();
  const [pomodoroSegundos, setPomodoroSegundos] = useState(25 * 60);
  const [pomodoroRodando, setPomodoroRodando] = useState(false);

  // Tarefas da Timeline
  const [tarefas, setTarefas] = useState([
    { id: 1, texto: 'Leitura de 5 artigos da CF/88 (Art. 5º)', feita: true, tempo: '15 min' },
    { id: 2, texto: '10 Questões de Direito Penal (FGV)', feita: false, tempo: '25 min' },
    { id: 3, texto: 'Revisão de Flashcards de Direito do Trabalho', feita: false, tempo: '10 min' },
    { id: 4, texto: 'Áudioaula sobre Nova Lei de Licitações', feita: false, tempo: '20 min' },
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (pomodoroRodando && pomodoroSegundos > 0) {
      interval = setInterval(() => {
        setPomodoroSegundos((prev) => prev - 1);
      }, 1000);
    } else if (pomodoroSegundos === 0) {
      setPomodoroRodando(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pomodoroRodando, pomodoroSegundos]);

  const toggleTarefa = (id: number) => {
    try { haptic.selection(); } catch {};
    setTarefas(tarefas.map(t => t.id === id ? { ...t, feita: !t.feita } : t));
  };

  const minutos = Math.floor(pomodoroSegundos / 60);
  const segundos = pomodoroSegundos % 60;
  const tempoFormatado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

  const tarefasConcluidas = tarefas.filter(t => t.feita).length;
  const porcentagem = Math.round((tarefasConcluidas / tarefas.length) * 100);

  return (
    <div className="w-full min-h-full bg-[#0D0D0D] text-white p-4 sm:p-6 pb-24 space-y-5">
      {/* ── HEADER PLANNER & PROCESSO ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
            PLANNER DE ESTUDO ATIVO
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Metas de Hoje
          </h2>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold">
          <span>{tarefasConcluidas}/{tarefas.length} Feitas</span>
        </div>
      </div>

      {/* ── WIDGET POMODORO INTEGRADO ── */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-950/30 via-zinc-900 to-black border border-cyan-500/30 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
            BLOCO DE FOCO (POMODORO)
          </span>
          <div className="text-3xl font-black text-white font-mono mt-0.5 tracking-tight">
            {tempoFormatado}
          </div>
          <span className="text-[11px] text-zinc-400">Ciclo 1 de 4 · Foco Total</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              try { haptic.impact('medium'); } catch {};
              setPomodoroRodando(!pomodoroRodando);
            }}
            className="w-11 h-11 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer"
          >
            {pomodoroRodando ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {};
              setPomodoroRodando(false);
              setPomodoroSegundos(25 * 60);
            }}
            className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── BARRA DE PROGRESSO DO DIA ── */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Progresso do Cronograma</span>
          <span className="text-cyan-400 font-bold font-mono">{porcentagem}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500" 
            style={{ width: `${porcentagem}%` }}
          />
        </div>
      </div>

      {/* ── CHECKLIST DA LINHA DO TEMPO ── */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Linha do Tempo de Atividades
        </h4>

        <div className="space-y-2">
          {tarefas.map((tarefa, idx) => (
            <div
              key={tarefa.id}
              onClick={() => toggleTarefa(tarefa.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                tarefa.feita
                  ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-500 line-through'
                  : 'bg-zinc-900/60 border-white/10 text-white hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-center gap-3">
                {tarefa.feita ? (
                  <CheckSquare className="w-5 h-5 text-cyan-400 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-500 shrink-0" />
                )}
                <div>
                  <h5 className="text-xs font-semibold">{tarefa.texto}</h5>
                  <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {tarefa.tempo}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
