import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, Award, Zap, AlertTriangle, ArrowRight, 
  CheckCircle, BarChart3, Clock, ShieldCheck, Flame 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export const Layout7QuestoesHub: React.FC = () => {
  const navigate = useNavigate();
  const [bancaSelecionada, setBancaSelecionada] = useState('FGV');

  return (
    <div className="w-full min-h-full bg-[#0D0D0D] text-white p-4 sm:p-6 pb-24 space-y-5">
      {/* ── HEADER REGRESSIVA OAB / CONCURSO ── */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-black border border-amber-500/30 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
            CONTAGEM REGRESSIVA
          </span>
          <h3 className="text-base font-extrabold text-white">Exame de Ordem OAB XLII</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Meta: 60+ pontos na 1ª Fase</p>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black text-amber-400 font-mono">48</span>
          <span className="block text-[10px] text-zinc-400 uppercase">Dias Restantes</span>
        </div>
      </div>

      {/* ── PAINEL DE DESEMPENHO POR MATÉRIA ── */}
      <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            Rendimento por Disciplina (Últimos 30 Dias)
          </h4>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">Média: 78%</span>
        </div>

        {/* Barras de Disciplinas */}
        <div className="space-y-2.5">
          {/* Constitucional */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">Direito Constitucional</span>
              <span className="text-emerald-400 font-bold">92% (Excelente)</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
            </div>
          </div>

          {/* Penal */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-300">Direito Penal</span>
              <span className="text-emerald-400 font-bold">85% (Seguro)</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-[85%]" />
            </div>
          </div>

          {/* Tributário (Alerta Vermelho) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-amber-400 flex items-center gap-1 font-bold">
                <AlertTriangle className="w-3 h-3 text-red-400" />
                Direito Tributário
              </span>
              <span className="text-red-400 font-bold">54% (Abaixo da Meta)</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full w-[54%]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTÃO DE AÇÃO PRIMÁRIA: RESOLVER FRAQUEZAS ── */}
      <button
        type="button"
        onClick={() => { try { haptic.impact('heavy'); } catch {}; navigate('/questoes'); }}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-98 transition-all cursor-pointer"
      >
        <Target className="w-4 h-4 fill-current" />
        <span>Resolver 5 Questões das Fraquezas (Tributário)</span>
      </button>

      {/* ── BANCO POR BANCAS EXAMINADORAS ── */}
      <div className="space-y-2.5">
        <h5 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Simulados Rápidos por Banca
        </h5>

        <div className="grid grid-cols-4 gap-2">
          {['FGV', 'Cebraspe', 'Vunesp', 'FCC'].map((banca) => (
            <button
              key={banca}
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; setBancaSelecionada(banca); }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                bancaSelecionada === banca
                  ? 'bg-white text-zinc-950 shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {banca}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
