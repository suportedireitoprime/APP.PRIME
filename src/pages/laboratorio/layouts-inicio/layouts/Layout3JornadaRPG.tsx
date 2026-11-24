import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Flame, Zap, Shield, Star, Lock, 
  CheckCircle2, Gift, Swords, Sparkles, ChevronRight 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export const Layout3JornadaRPG: React.FC = () => {
  const navigate = useNavigate();
  const [xpGanho, setXpGanho] = useState(false);

  return (
    <div className="w-full min-h-full bg-[#0D0D0D] text-white p-4 sm:p-6 pb-24 space-y-6">
      {/* ── STATUS RPG BAR (VIDAS, STREAK, XP) ── */}
      <div className="flex items-center justify-between bg-zinc-900/80 border border-white/10 rounded-2xl p-3 backdrop-blur-md shadow-lg shadow-black/50">
        <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
          <Heart className="w-4 h-4 fill-current animate-pulse" />
          <span>5 / 5</span>
        </div>

        <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs">
          <Flame className="w-4 h-4 fill-current" />
          <span>14 Dias</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs">
          <Zap className="w-4 h-4 fill-current" />
          <span>{xpGanho ? '3.520' : '3.420'} XP</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
          <Shield className="w-3 h-3" />
          <span>NÍVEL 7</span>
        </div>
      </div>

      {/* ── CARD DA MISSÃO ATIVA ── */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-black border border-emerald-500/30 space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-400">
            JORNADA DE DIREITO PENAL
          </span>
          <span className="text-xs text-zinc-400 font-semibold">Módulo 3 de 12</span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Teoria da Conduta & Tipicidade
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
            Avance pelos nós para desbloquear o Baú do Exame de Ordem e dominar os 5 artigos-chave.
          </p>
        </div>

        {/* Barra de Progresso do Nível */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
            <span>Progresso da Trilha</span>
            <span className="text-emerald-400 font-bold">60%</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[60%]" />
          </div>
        </div>
      </div>

      {/* ── TRILHA DE NÓS DE PROGRESSÃO (ESTILO DUOLINGO) ── */}
      <div className="relative py-4 flex flex-col items-center gap-8">
        {/* Linha Conectora Central */}
        <div className="absolute top-8 bottom-8 w-1 bg-gradient-to-b from-emerald-500 via-emerald-500/40 to-zinc-800 rounded-full" />

        {/* Nó 1: Concluído */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/40 border-4 border-zinc-950 cursor-pointer active:scale-95 transition-all">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <span className="mt-2 text-xs font-bold text-emerald-400 bg-zinc-900/90 px-3 py-1 rounded-full border border-emerald-500/30">
            1. Princípio da Legalidade
          </span>
          <div className="flex gap-0.5 mt-1">
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <Star className="w-3 h-3 text-amber-400 fill-current" />
          </div>
        </div>

        {/* Nó 2: Nó Ativo Atual (com pulso) */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="absolute -inset-2 bg-emerald-500/30 rounded-full animate-ping pointer-events-none" />
            <button
              type="button"
              onClick={() => { try { haptic.impact('heavy'); } catch {}; navigate('/questoes'); }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-300 text-zinc-950 flex flex-col items-center justify-center font-extrabold shadow-xl shadow-emerald-500/50 border-4 border-zinc-950 active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-7 h-7 fill-current mb-0.5" />
              <span className="text-[10px] font-mono tracking-tighter">JOGAR</span>
            </button>
          </div>
          <span className="mt-2 text-xs font-bold text-white bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/50">
            2. Tipicidade Conglobante
          </span>
        </div>

        {/* Nó 3: Baú de Recompensa */}
        <div className="relative z-10 flex flex-col items-center">
          <button
            type="button"
            onClick={() => {
              try { haptic.impact('medium'); } catch {};
              setXpGanho(true);
            }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 border-amber-500/50 transition-all cursor-pointer ${
              xpGanho 
                ? 'bg-zinc-900 text-zinc-500 border-zinc-700' 
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-zinc-950 shadow-amber-500/30 animate-bounce'
            }`}
          >
            <Gift className="w-7 h-7 stroke-[2]" />
          </button>
          <span className="mt-1.5 text-[11px] font-semibold text-amber-400">
            {xpGanho ? 'Baú Aberto (+100 XP)' : 'Abrir Baú (+100 XP)'}
          </span>
        </div>

        {/* Nó 4: Bloqueado */}
        <div className="relative z-10 flex flex-col items-center opacity-60">
          <div className="w-14 h-14 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center border-4 border-zinc-950 shadow-md">
            <Lock className="w-5 h-5" />
          </div>
          <span className="mt-2 text-xs font-semibold text-zinc-500">
            3. Ilicitude & Legítima Defesa
          </span>
        </div>
      </div>

      {/* ── BOTÃO DE DUELO RÁPIDO ── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => { try { haptic.impact('heavy'); } catch {}; navigate('/questoes'); }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer"
        >
          <Swords className="w-4 h-4" />
          <span>Duelo de 1 Minuto (Quiz Relâmpago)</span>
        </button>
      </div>
    </div>
  );
};
