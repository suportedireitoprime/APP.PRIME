import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Pause, Flame, Target, Sparkles, BookOpen, 
  ArrowUpRight, Radio, Scale, ShieldCheck, ChevronRight, Headphones 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export const Layout5BentoGrid: React.FC = () => {
  const navigate = useNavigate();
  const [tocandoAudio, setTocandoAudio] = useState(false);

  return (
    <div className="w-full min-h-full bg-[#0D0D0D] text-white p-4 sm:p-6 pb-24 space-y-4">
      {/* ── BENTO TOP HEADER ── */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">
            BENTO MODULAR · HIGH-END
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Painel Inteligente
          </h2>
        </div>

        <div className="w-9 h-9 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </div>
      </div>

      {/* ── BENTO GRID ASSIMÉTRICO (ESTILO APPLE IOS 18) ── */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Bloco 1: Radar Legislativo Hero (2x1 ou 2x2) */}
        <div 
          onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/radar-360'); }}
          className="col-span-2 p-4.5 rounded-[28px] bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-black border border-indigo-500/30 hover:border-indigo-500/50 transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30">
              RADAR LEGISLATIVO 360
            </span>
            <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
            Nova Resolução do STF & Diário Oficial
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
            3 novas súmulas e 14 decretos sincronizados com seu Vade Mecum hoje.
          </p>

          <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-indigo-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            <span>Atualizado há 14 minutos</span>
          </div>
        </div>

        {/* Bloco 2: Mini Player de Áudio Prime Integrado (2x1) */}
        <div className="col-span-2 p-4 rounded-[26px] bg-zinc-900/80 border border-white/10 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md shadow-rose-500/30">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">ÁUDIO EM REPRODUÇÃO</span>
              <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">Súmula Vinculante 11 (Uso de Algemas)</h4>
              <p className="text-[10px] text-zinc-400">Narrador Humano · 4:12 restante</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              try { haptic.impact('medium'); } catch {};
              setTocandoAudio(!tocandoAudio);
            }}
            className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            {tocandoAudio ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Bloco 3: Ofensiva & Fogo (1x1) */}
        <div 
          onClick={() => { try { haptic.selection(); } catch {}; }}
          className="p-4 rounded-[26px] bg-zinc-900/60 border border-orange-500/20 flex flex-col justify-between hover:border-orange-500/40 transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Flame className="w-5 h-5 fill-current animate-pulse" />
          </div>
          <div>
            <span className="text-2xl font-black text-white">14</span>
            <span className="text-xs text-orange-400 font-bold ml-1">Dias</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Ofensiva Implacável</p>
          </div>
        </div>

        {/* Bloco 4: Taxa de Acerto nas Questões (1x1) */}
        <div 
          onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/questoes'); }}
          className="p-4 rounded-[26px] bg-zinc-900/60 border border-emerald-500/20 flex flex-col justify-between hover:border-emerald-500/40 transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black text-white">87%</span>
            <span className="text-xs text-emerald-400 font-bold ml-1">Acertos</span>
            <p className="text-[11px] text-zinc-400 mt-0.5">120 Questões no Mês</p>
          </div>
        </div>

        {/* Bloco 5: Acesso Rápido Vade Mecum (2x1) */}
        <div 
          onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/vade-mecum'); }}
          className="col-span-2 p-4 rounded-[26px] bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/10 flex items-center justify-between cursor-pointer hover:border-white/20 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                Explorar Leis & Códigos
              </h4>
              <p className="text-[11px] text-zinc-400">CF/88, CP, CPC, CLT, Súmulas e Leis Especiais</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </div>
      </div>
    </div>
  );
};
