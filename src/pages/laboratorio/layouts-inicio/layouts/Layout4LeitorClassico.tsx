import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Search, Bookmark, ChevronRight, 
  Quote, SlidersHorizontal, ArrowRight, Library, Sparkles 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export const Layout4LeitorClassico: React.FC = () => {
  const navigate = useNavigate();
  const [tamanhoFonte, setTamanhoFonte] = useState<'normal' | 'grande'>('normal');
  const [buscaArtigo, setBuscaArtigo] = useState('');

  return (
    <div className="w-full min-h-full bg-[#0a0a0c] text-stone-200 p-4 sm:p-6 pb-24 space-y-6 font-serif">
      {/* ── CABEÇALHO EDITORIAL CLÁSSICO ── */}
      <div className="border-b border-stone-800/80 pb-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-sans font-bold tracking-widest text-amber-500/90 uppercase">
            BIBLIOTECA JURÍDICA
          </span>
          <h2 className="text-xl sm:text-2xl font-normal text-stone-100 tracking-tight">
            Santuário da Lei Seca
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              try { haptic.selection(); } catch {};
              setTamanhoFonte(tamanhoFonte === 'normal' ? 'grande' : 'normal');
            }}
            className="px-2.5 py-1 rounded-lg border border-stone-800 text-[11px] font-sans text-stone-400 hover:text-stone-200 transition-colors"
          >
            {tamanhoFonte === 'normal' ? 'A+' : 'A-'}
          </button>
        </div>
      </div>

      {/* ── CITAÇÃO DO DIA (EDITORIAL DE LUXO) ── */}
      <div className="relative p-5 rounded-2xl bg-[#121216] border border-stone-800/60 space-y-2">
        <Quote className="w-6 h-6 text-amber-500/40" />
        <p className="text-sm italic text-stone-300 leading-relaxed pl-2 border-l border-amber-500/40">
          "A força do direito deve superar o direito da força. Onde não há lei justa, não há paz verdadeira."
        </p>
        <span className="block text-[11px] font-sans text-stone-500 text-right">
          — Ruy Barbosa, Oração aos Moços
        </span>
      </div>

      {/* ── LIVRO ABERTO ATIVO (LEITURA CENTRAL) ── */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-[#141418] to-[#0e0e12] border border-stone-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between font-sans text-xs text-amber-400/90 font-medium">
          <span className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            Em Leitura Atual
          </span>
          <span className="text-stone-400 font-mono">Página 142 · Art. 421</span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-stone-100 tracking-tight">
            Código Civil · Livro das Obrigações
          </h3>
          <p className="text-xs font-sans text-stone-400 mt-0.5">
            Título V: Dos Contratos em Geral · Capítulo I
          </p>
        </div>

        {/* Trecho Real do Artigo */}
        <div className={`p-4 rounded-xl bg-stone-950/60 border border-stone-800/40 text-stone-300 leading-relaxed transition-all ${
          tamanhoFonte === 'grande' ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
        }`}>
          <p>
            <strong className="text-amber-400 font-sans font-bold mr-1">Art. 421.</strong>
            A liberdade contratual será exercida nos limites da função social do contrato.
          </p>
          <p className="text-stone-400 text-xs sm:text-sm mt-2 italic">
            Parágrafo único. Nas relações contratuais privadas, prevalecerão o princípio da intervenção mínima e a excepcionalidade da revisão contratual.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { try { haptic.impact('medium'); } catch {}; navigate('/vade-mecum'); }}
          className="w-full py-2.5 rounded-xl bg-stone-200 hover:bg-white text-stone-950 font-sans font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-md"
        >
          <span>Continuar Leitura do Art. 422</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── BUSCA RÁPIDA DE ARTIGO ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900/80 border border-stone-800">
          <Search className="w-4 h-4 text-stone-500 shrink-0" />
          <input
            type="text"
            value={buscaArtigo}
            onChange={(e) => setBuscaArtigo(e.target.value)}
            placeholder="Ir direto para artigo (ex: Art. 5, Art. 121, Art. 7)..."
            className="w-full bg-transparent font-sans text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ── SUMÁRIO CLÁSSICO DE CÓDIGOS ── */}
      <div className="space-y-2 font-sans">
        <h4 className="text-xs font-bold text-stone-400 tracking-wider uppercase">
          Índice Fundamental
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { nome: 'Constituição Federal', sigla: 'CF/88', artigos: '250 Artigos' },
            { nome: 'Código Penal', sigla: 'CP', artigos: '361 Artigos' },
            { nome: 'Processo Penal', sigla: 'CPP', artigos: '811 Artigos' },
            { nome: 'Código Civil', sigla: 'CC', artigos: '2.046 Artigos' },
            { nome: 'Processo Civil', sigla: 'CPC', artigos: '1.072 Artigos' },
            { nome: 'Súmulas Vinculantes', sigla: 'STF', artigos: '58 Súmulas' },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => { try { haptic.selection(); } catch {}; navigate('/vade-mecum'); }}
              className="p-3 rounded-xl bg-stone-900/40 border border-stone-800/80 hover:border-amber-500/40 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-400/90">{item.sigla}</span>
                <span className="text-[9px] text-stone-500">{item.artigos}</span>
              </div>
              <h5 className="text-xs font-semibold text-stone-200 group-hover:text-amber-300 mt-1">
                {item.nome}
              </h5>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
