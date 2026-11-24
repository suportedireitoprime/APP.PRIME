import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, Sunset, Moon, Clock, CheckCircle2, 
  ArrowRight, Newspaper, HelpCircle, Headphones, Sparkles, BookOpen 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

type Turno = 'manha' | 'tarde' | 'noite';

export const Layout6DailyBriefing: React.FC = () => {
  const navigate = useNavigate();
  const [turno, setTurno] = useState<Turno>('manha');

  return (
    <div className="w-full min-h-full bg-[#0D0D0D] text-white p-4 sm:p-6 pb-24 space-y-5">
      {/* ── HEADER DE ROTINA CIRCADIANA ── */}
      <div className="space-y-1">
        <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest">
          ROTINA DIÁRIA INTELIGENTE
        </span>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          Seu Briefing do Dia
          <Sparkles className="w-4 h-4 text-sky-400" />
        </h2>
        <p className="text-xs text-zinc-400">
          Atividades calibradas para sua energia e absorção em cada horário.
        </p>
      </div>

      {/* ── ALTERNADOR DE TURNOS (MANHÃ, TARDE, NOITE) ── */}
      <div className="grid grid-cols-3 gap-2 bg-zinc-900/90 border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => { try { haptic.selection(); } catch {}; setTurno('manha'); }}
          className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            turno === 'manha'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Manhã</span>
        </button>

        <button
          type="button"
          onClick={() => { try { haptic.selection(); } catch {}; setTurno('tarde'); }}
          className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            turno === 'tarde'
              ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/25'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sunset className="w-3.5 h-3.5" />
          <span>Tarde</span>
        </button>

        <button
          type="button"
          onClick={() => { try { haptic.selection(); } catch {}; setTurno('noite'); }}
          className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            turno === 'noite'
              ? 'bg-indigo-500 text-zinc-950 shadow-md shadow-indigo-500/25'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Noite</span>
        </button>
      </div>

      {/* ── CONTEÚDO DINÂMICO CONFORME O TURNO ── */}
      {turno === 'manha' && (
        <div className="space-y-3.5">
          {/* Card 1: Boletim Matinal */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                06:00 - 12:00 · ABSORÇÃO MÁXIMA
              </span>
              <span className="text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 10 min
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Boletim do Diário Oficial & STF</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Resumo das publicações do DOU de hoje e decisões de repercussão geral das turmas recursais.
            </p>
            <button
              type="button"
              onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/radar-360'); }}
              className="mt-1 w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <span>Ler Boletim Matinal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 2: Artigo da Constituição */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/10 space-y-2">
            <span className="text-[10px] font-mono text-zinc-400">LEI SECA DO DIA</span>
            <h4 className="text-xs sm:text-sm font-bold text-white">CF/88 · Art. 5º, Inciso XI</h4>
            <p className="text-xs text-zinc-400">
              Inviolabilidade do domicílio e exceções constitucionais (flagrante, desastre e dia com mandado).
            </p>
          </div>
        </div>
      )}

      {turno === 'tarde' && (
        <div className="space-y-3.5">
          {/* Card Tarde: Simulado 5 Questões */}
          <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-500/20 px-2 py-0.5 rounded">
                12:00 - 18:00 · PRÁTICA ATIVA
              </span>
              <span className="text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 15 min
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Simulado Rápido: 5 Questões OAB</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Direito Civil e Processo Civil focadas nos temas mais cobrados pela FGV.
            </p>
            <button
              type="button"
              onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/questoes'); }}
              className="mt-1 w-full py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <span>Resolver Simulado Agora</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {turno === 'noite' && (
        <div className="space-y-3.5">
          {/* Card Noite: Áudio Passivo */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
                18:00 - 23:00 · REVISÃO PASSIVA
              </span>
              <span className="text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> 20 min
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">Áudioaula: Revisão Sem Esforço Visual</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Ouça os artigos comentados de Direito Penal antes de dormir para consolidar na memória de longo prazo.
            </p>
            <button
              type="button"
              onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/audioaulas'); }}
              className="mt-1 w-full py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Iniciar Áudio Relaxante</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
