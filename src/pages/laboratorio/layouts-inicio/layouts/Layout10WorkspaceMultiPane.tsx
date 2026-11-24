import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Columns, BookOpen, Edit3, Sparkles, Scale, 
  ChevronRight, Bookmark, Search, Share2, Volume2, Bot 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export const Layout10WorkspaceMultiPane: React.FC = () => {
  const navigate = useNavigate();
  const [colunaAtivaMobile, setColunaAtivaMobile] = useState<'nav' | 'leitura' | 'notas'>('leitura');
  const [anotacoes, setAnotacoes] = useState('Anotações de estudo:\n- Requisitos da legítima defesa (Art. 25 CP)\n- Moderação dos meios necessários\n- Repulsa à injusta agressão');

  return (
    <div className="w-full min-h-full bg-[#0D0D0D] text-white p-3 sm:p-5 pb-24 space-y-4">
      {/* ── HEADER WIDESCREEN ── */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center border border-fuchsia-500/30">
            <Columns className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Workspace Tri-Pane</h3>
            <p className="text-[11px] text-zinc-400">Ambiente de trabalho completo para telas médias e grandes</p>
          </div>
        </div>

        {/* Alternador Mobile (Apenas em telas pequenas) */}
        <div className="flex sm:hidden items-center gap-1 bg-zinc-900 rounded-xl p-1 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setColunaAtivaMobile('nav')}
            className={`px-2 py-1 rounded-lg ${colunaAtivaMobile === 'nav' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400'}`}
          >
            Leis
          </button>
          <button
            type="button"
            onClick={() => setColunaAtivaMobile('leitura')}
            className={`px-2 py-1 rounded-lg ${colunaAtivaMobile === 'leitura' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400'}`}
          >
            Leitura
          </button>
          <button
            type="button"
            onClick={() => setColunaAtivaMobile('notas')}
            className={`px-2 py-1 rounded-lg ${colunaAtivaMobile === 'notas' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400'}`}
          >
            Notas
          </button>
        </div>
      </div>

      {/* ── GRID DAS 3 COLUNAS SIMULTÂNEAS ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* COLUNA 1: SUMÁRIO & LEIS (Esquerda - 3 colunas) */}
        <div className={`md:col-span-3 rounded-2xl bg-zinc-900/60 border border-white/10 p-3 space-y-2.5 ${
          colunaAtivaMobile === 'nav' ? 'block' : 'hidden md:block'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <span>Legislação</span>
            <Search className="w-3.5 h-3.5 text-zinc-500" />
          </div>

          <div className="space-y-1.5 text-xs">
            {[
              { nome: 'CF / 1988', ativa: true, artigos: '250 arts' },
              { nome: 'Código Penal', ativa: false, artigos: '361 arts' },
              { nome: 'Código Civil', ativa: false, artigos: '2.046 arts' },
              { nome: 'Processo Civil', ativa: false, artigos: '1.072 arts' },
              { nome: 'CLT', ativa: false, artigos: '922 arts' },
            ].map((lei, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                  lei.ativa
                    ? 'bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300 font-bold'
                    : 'hover:bg-white/5 text-zinc-300'
                }`}
              >
                <span>{lei.nome}</span>
                <span className="text-[10px] text-zinc-500">{lei.artigos}</span>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA 2: TEXTO EM LEITURA ATIVA (Centro - 5 colunas) */}
        <div className={`md:col-span-5 rounded-2xl bg-zinc-900/80 border border-white/10 p-4 space-y-3 ${
          colunaAtivaMobile === 'leitura' ? 'block' : 'hidden md:block'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-fuchsia-400 uppercase">
              CF/88 · TÍTULO II · DOS DIREITOS
            </span>
            <Volume2 className="w-4 h-4 text-zinc-400 hover:text-white cursor-pointer" />
          </div>

          <h4 className="text-base font-bold text-white">Artigo 5º · Caput</h4>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-200 leading-relaxed font-serif space-y-2">
            <p>
              Todos são iguais perante a lei, sem distinção de qualquer natureza, garantindo-se aos brasileiros e aos estrangeiros residentes no País a inviolabilidade do direito à vida, à liberdade, à igualdade, à segurança e à propriedade.
            </p>
            <p className="text-zinc-400 text-[11px] font-sans">
              Inciso I - homens e mulheres são iguais em direitos e obrigações, nos termos desta Constituição.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => { try { haptic.selection(); } catch {}; }}
              className="px-3 py-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-300 font-bold text-xs border border-fuchsia-500/30 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Me Explique (IA)</span>
            </button>
          </div>
        </div>

        {/* COLUNA 3: NOTAS RÁPIDAS & JURISPRUDÊNCIA (Direita - 4 colunas) */}
        <div className={`md:col-span-4 rounded-2xl bg-zinc-900/60 border border-white/10 p-3 space-y-3 ${
          colunaAtivaMobile === 'notas' ? 'block' : 'hidden md:block'
        }`}>
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-fuchsia-400" />
              Bloco de Notas Síncrono
            </span>
            <span className="text-[9px] font-mono text-emerald-400">Salvo</span>
          </div>

          <textarea
            rows={5}
            value={anotacoes}
            onChange={(e) => setAnotacoes(e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-xl p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-fuchsia-500/40 font-mono resize-none"
          />

          {/* Jurisprudência STF Rápida */}
          <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
              Súmula Vinculante Relacionada
            </span>
            <p className="text-[11px] text-zinc-300 leading-tight">
              SV 14: É direito do defensor ter acesso amplo aos elementos de prova já documentados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
