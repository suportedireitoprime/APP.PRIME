import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Clock, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/nativeHaptics';
import greciaFilosofosFundo from '@/assets/grecia-filosofos-fundo.webp';
import appLogo from '@/assets/logo-direitoprime-v2.webp';

interface TelaPosTrialViewProps {
  onVoltar?: () => void;
  isLabMode?: boolean;
  alunoNomeSimulado?: string;
}

export const TelaPosTrialView: React.FC<TelaPosTrialViewProps> = ({
  onVoltar,
  isLabMode = false,
  alunoNomeSimulado,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const nomeAluno = alunoNomeSimulado || 
    user?.user_metadata?.full_name?.split(' ')[0] || 
    user?.user_metadata?.name?.split(' ')[0] || 
    '';

  const handleVerPlanos = () => {
    try { haptic.impact('medium'); } catch {}
    if (onVoltar) {
      onVoltar();
    }
    navigate('/assinatura');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
      
      {/* ── FUNDO EM IMAGEM IGUAL AO DE AULAS (COM DESFOQUE E VINHETA ESCURA) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#120b08]">
        <img
          src={greciaFilosofosFundo}
          alt="Fundo Clássico"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top select-none pointer-events-none filter blur-[3.5px] brightness-[0.45] contrast-[1.08] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90 pointer-events-none" />
      </div>

      {/* ── BARRA SUPERIOR PARA MODO LABORATÓRIO ── */}
      {isLabMode && (
        <div className="fixed top-3 inset-x-4 max-w-sm mx-auto z-50 flex items-center justify-between px-3.5 py-1.5 rounded-full bg-black/80 border border-white/10 text-xs backdrop-blur-md shadow-xl">
          <span className="font-mono font-bold text-amber-300 text-[11px] uppercase tracking-wide">
            Simulador Pós-Trial
          </span>
          {onVoltar && (
            <button
              type="button"
              onClick={onVoltar}
              className="px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 font-medium cursor-pointer transition-all active:scale-95 text-[11px]"
            >
              ← Voltar
            </button>
          )}
        </div>
      )}

      {/* ── BOTÃO DE FECHAR QUANDO NÃO FOR MODO LAB ── */}
      {onVoltar && !isLabMode && (
        <button
          type="button"
          onClick={onVoltar}
          aria-label="Fechar"
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* ── CARD MINIMALISTA CENTRALIZADO POR CIMA ── */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md rounded-3xl bg-zinc-950/85 border border-white/10 p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Logo Oficial do App */}
        <div className="flex justify-center pt-1">
          <img 
            src={appLogo} 
            alt="Direito Prime" 
            className="h-10 sm:h-12 w-auto object-contain drop-shadow"
          />
        </div>

        {/* Badge Minimalista */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold tracking-wider">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>SEU TESTE DE 3 DIAS ACABOU</span>
        </div>

        {/* Título Minimalista */}
        <h2 className="font-serif font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
          Seus 3 Dias Gratuitos Chegaram ao Fim
        </h2>

        {/* Descrição Minimalista */}
        <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-sans max-w-xs sm:max-w-sm mx-auto">
          {nomeAluno ? `${nomeAluno}, sua` : 'Sua'} degustação gratuita de 3 dias no Direito Prime terminou. Mantenha seu ritmo de estudos com acesso ilimitado a todas as aulas interativas, ao Vade Mecum com áudio e às ferramentas exclusivas.
        </p>

        {/* Botão Ver Planos */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={handleVerPlanos}
            className="w-full h-13 sm:h-14 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black font-serif text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(245,158,11,0.3)] active:scale-[0.98] transition-all cursor-pointer border border-amber-300/40"
          >
            <span>VER PLANOS</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>

          {/* Micro-copy discreto */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-sans">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Garantia incondicional de 7 dias · Cancele quando quiser</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TelaPosTrialView;
