import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, Search, Sparkles, Send, Mic, 
  HelpCircle, ArrowRight, BookOpen, Scale, MessageSquare 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export const Layout8IATutorBusca: React.FC = () => {
  const navigate = useNavigate();
  const [pergunta, setPergunta] = useState('');
  const [respostaSimulada, setRespostaSimulada] = useState(false);

  const tesesProntas = [
    'Diferença entre dolo eventual e culpa consciente',
    'Quando cabe ADPF subsidiária?',
    'Artigo 28 da Lei de Drogas segundo o STF',
    'Teoria da Imprevisão no Código Civil',
  ];

  return (
    <div className="w-full min-h-full bg-[#0D0D0D] text-white p-4 sm:p-6 pb-24 space-y-5">
      {/* ── HEADER DA IA COGNITIVA ── */}
      <div className="text-center space-y-1.5 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-[10px] font-bold">
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span>TUTOR JURÍDICO INTELIGENTE · PRIME AI</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          O que você quer dominar hoje?
        </h2>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Pergunte sobre qualquer artigo de lei, tese jurídica, caso prático ou súmula vinculante.
        </p>
      </div>

      {/* ── CAMPO DE PERGUNTA CENTRAL (ESTILO PERPLEXITY) ── */}
      <div className="relative p-2 rounded-2xl bg-zinc-900 border border-purple-500/30 focus-within:border-purple-500 shadow-xl shadow-purple-500/10 transition-all">
        <textarea
          rows={3}
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Ex: Explique a função social do contrato e como a jurisprudência do STJ aplica no Art. 421 do CC..."
          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none resize-none px-2 pt-1"
        />

        <div className="flex items-center justify-between border-t border-white/5 pt-2 px-1">
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <span className="text-[11px] font-mono">Direito Penal, Civil & CF88</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                try { haptic.impact('heavy'); } catch {};
                if (pergunta.trim()) setRespostaSimulada(true);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>Consultar IA</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── RESPOSTA SIMULADA COGNITIVA ── */}
      {respostaSimulada && (
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-xs text-purple-300 font-bold">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Resposta do Tutor Jurídico</span>
          </div>
          <p className="text-xs text-zinc-200 leading-relaxed">
            No dolo eventual o agente assume o risco de produzir o resultado danoso (art. 18, I, in fine, do CP), ao passo que na culpa consciente ele prevê o resultado mas confia sinceramente em suas habilidades para evitá-lo.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/vade-mecum'); }}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white font-medium flex items-center gap-1 border border-white/10"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Ver Art. 18 do CP</span>
            </button>
          </div>
        </div>
      )}

      {/* ── CHIPS DE TESES RÁPIDAS ── */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
          Teses & Dúvidas Frequentes
        </span>
        <div className="space-y-2">
          {tesesProntas.map((tese, idx) => (
            <div
              key={idx}
              onClick={() => {
                try { haptic.selection(); } catch {};
                setPergunta(tese);
                setRespostaSimulada(true);
              }}
              className="p-3 rounded-xl bg-zinc-900/60 border border-white/10 hover:border-purple-500/40 hover:bg-zinc-900 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-xs text-zinc-300 group-hover:text-white transition-colors">{tese}</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-purple-400 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
