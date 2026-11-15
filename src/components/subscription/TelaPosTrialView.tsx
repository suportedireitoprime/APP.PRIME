import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, X } from 'lucide-react';
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
      
      {/* ── FUNDO EM IMAGEM IGUAL AO DE AULAS (GRÉCIA ANTIGA NÍTIDA E ILUMINADA) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#120b08]">
        <img
          src={greciaFilosofosFundo}
          alt="Grécia Antiga e Filósofos"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="w-full h-full object-cover object-top select-none pointer-events-none filter blur-[1.5px] brightness-[0.92] contrast-[1.08] scale-105"
        />
        {/* Vinheta atmosférica suave preservando os detalhes dos templos e filósofos */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/85 pointer-events-none" />
      </div>

      {/* ── BARRA SUPERIOR PARA MODO LABORATÓRIO ── */}
      {isLabMode && (
        <div className="fixed top-3 inset-x-4 max-w-sm mx-auto z-50 flex items-center justify-between px-3.5 py-1.5 rounded-full bg-black/80 border border-white/15 text-xs backdrop-blur-md shadow-xl">
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
          className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white/90 hover:text-white transition-all cursor-pointer active:scale-95 backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* ── CARD ELEGANTE, IMPACTANTE E LEVEMENTE TRANSPARENTE ── */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md rounded-3xl bg-black/70 border border-amber-500/35 p-6 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.95),0_0_50px_rgba(245,158,11,0.12)] backdrop-blur-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
        
        {/* Logo Oficial do App e Nome Idêntico ao Painel do Início */}
        <div className="flex flex-col items-center justify-center pt-1 space-y-1.5">
          <img 
            src={appLogo} 
            alt="Estudos Jurídicos" 
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_8px_24px_rgba(245,158,11,0.25)]"
          />
          <div className="space-y-0.5 text-center">
            <h1 className="tracking-tight leading-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)]">
              <span className="font-serif text-xl sm:text-2xl font-medium text-white">
                Estudos{' '}
              </span>
              <span className="font-serif italic text-2xl sm:text-[26px] font-bold text-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]">
                Jurídicos
              </span>
            </h1>
            <p className="font-serif italic text-white/90 text-xs sm:text-[13px] leading-tight drop-shadow">
              Conteúdo de qualidade para sua jornada no Direito.
            </p>
          </div>
        </div>

        {/* Badge Minimalista */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[11px] font-mono font-bold tracking-wider">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>SEU TESTE DE 3 DIAS ACABOU</span>
        </div>

        {/* Descrição Direta e Persuasiva */}
        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans max-w-xs sm:max-w-sm mx-auto pt-1">
          {nomeAluno ? `${nomeAluno}, sua` : 'Sua'} degustação gratuita de 3 dias terminou. Para <strong className="text-amber-300 font-bold">continuar os seus estudos</strong> com acesso ilimitado, <strong className="text-white font-bold">escolha um plano</strong>.
        </p>

        {/* Botão Ver Planos com Animação de Reflexo Contínuo */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleVerPlanos}
            className="btn-shine-loop relative overflow-hidden w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black font-serif text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(245,158,11,0.35)] active:scale-[0.98] transition-all cursor-pointer border border-amber-300/40"
          >
            <span className="relative z-10">VER PLANOS</span>
            <ArrowRight className="w-5 h-5 stroke-[2.8] relative z-10" />
            
            {/* Feixe dinâmico de reflexo contínuo */}
            <span 
              className="absolute inset-0 pointer-events-none z-10 mix-blend-screen opacity-70"
              style={{
                background: 'linear-gradient(105deg, transparent 30%, rgba(255, 255, 255, 0.4) 45%, rgba(255, 255, 255, 0.85) 50%, rgba(255, 255, 255, 0.4) 55%, transparent 70%)',
                animation: 'shimmer-reflect-loop 2.4s ease-out infinite'
              }}
            />
          </button>
        </div>

      </div>

    </div>
  );
};

export default TelaPosTrialView;
