import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, Zap, BookOpen, Scale, Search, ShieldCheck, 
  ArrowRight, Radio, Bell, ChevronRight, Bookmark, 
  HelpCircle, Sparkles, Trophy, CheckCircle2 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export const Layout1Comando: React.FC = () => {
  const navigate = useNavigate();
  const [metaConcluida, setMetaConcluida] = useState(false);

  return (
    <div className="w-full min-h-full bg-[#0D0D0D] text-white p-4 sm:p-6 space-y-5 pb-24">
      {/* ── TOP STATUS BAR ULTRA-COMPACTO ── */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-700 p-0.5 shadow-md shadow-amber-500/20">
            <div className="w-full h-full rounded-full bg-zinc-950 flex items-center justify-center font-bold text-sm text-amber-400">
              DP
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight">Comando Jurídico</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-zinc-400">Bem-vindo ao seu radar diário</p>
          </div>
        </div>

        {/* Gamificação Rápida */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-950/40 border border-orange-500/30 text-orange-400 text-xs font-bold">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>14d</span>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>3.420</span>
          </div>
        </div>
      </div>

      {/* ── TICKER DE NOTÍCIAS AO VIVO (DOU / STF) ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/30 border border-red-500/30 text-xs">
        <div className="flex items-center gap-1 text-red-400 font-bold shrink-0">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[10px] font-mono tracking-wider">RADAR DOU</span>
        </div>
        <div className="text-zinc-300 truncate text-[11px]">
          STF fixa nova tese sobre Art. 28 da Lei de Drogas · Vigência imediata
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0 ml-auto" />
      </div>

      {/* ── BENTO GRID 2x2 DE ACESSO CRÍTICO COM 1 TOQUE ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Bloco 1: CF88 */}
        <div 
          onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/vade-mecum'); }}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900/60 to-zinc-950 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
            <Scale className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">CF / 1988</h4>
          <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">250 Artigos + ADCT com áudios</p>
        </div>

        {/* Bloco 2: Códigos Principais */}
        <div 
          onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/vade-mecum'); }}
          className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-zinc-900/60 to-zinc-950 border border-sky-500/20 hover:border-sky-500/40 cursor-pointer active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">Vade Mecum</h4>
          <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">Penal, Civil, CLT, Tributário</p>
        </div>

        {/* Bloco 3: Questões OAB / FGV */}
        <div 
          onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/questoes'); }}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-900/60 to-zinc-950 border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">Questões OAB</h4>
          <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">15.000+ com gabarito comentado</p>
        </div>

        {/* Bloco 4: Radar Legislativo */}
        <div 
          onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/radar-360'); }}
          className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-zinc-900/60 to-zinc-950 border border-purple-500/20 hover:border-purple-500/40 cursor-pointer active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Radar 360</h4>
          <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">Votações no Congresso ao vivo</p>
        </div>
      </div>

      {/* ── CARD "CONTINUAR DE ONDE PAROU" ── */}
      <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            Último Artigo Aberto
          </span>
          <span className="text-amber-400 font-mono font-semibold">68% lido</span>
        </div>

        <div>
          <h4 className="text-base font-bold text-white">Código Penal · Art. 121</h4>
          <p className="text-xs text-zinc-400">Dos Crimes Contra a Vida: Homicídio simples e qualificado</p>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-[68%]" />
        </div>

        <button
          type="button"
          onClick={() => { try { haptic.impact('heavy'); } catch {}; navigate('/vade-mecum'); }}
          className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <span>Retomar Leitura Imediata</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── DESAFIO RELÂMPAGO DO DIA ── */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-zinc-900/60 border border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white">Meta Diária: 3 Questões</h5>
            <p className="text-[11px] text-zinc-400">Ganhe +50 XP e mantenha a ofensiva</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            try { haptic.impact('medium'); } catch {};
            setMetaConcluida(!metaConcluida);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            metaConcluida 
              ? 'bg-emerald-500 text-zinc-950 font-bold' 
              : 'bg-white/10 text-white hover:bg-white/15'
          }`}
        >
          {metaConcluida ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluída!</span>
            </>
          ) : (
            <span>Resolver</span>
          )}
        </button>
      </div>
    </div>
  );
};
