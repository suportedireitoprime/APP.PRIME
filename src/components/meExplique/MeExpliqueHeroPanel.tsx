import React, { memo } from 'react';
import { ArrowLeft, Clock, Sparkles, Settings } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import HeroMotifs from '@/components/vademecum/home/HeroMotifs';
import { useMeExpliqueCota } from '@/hooks/useMeExpliqueCota';

interface Props {
  onVoltar: () => void;
  onOpenConfig?: () => void;
}

const MeExpliqueHeroPanel: React.FC<Props> = ({ onVoltar, onOpenConfig }) => {
  const cota = useMeExpliqueCota();

  return (
    <div className="relative w-full overflow-hidden border-b border-border/80 shadow-2xl min-h-[260px] sm:min-h-[290px] bg-black">
      {/* Imagem de Fundo à Direita (Deusa Têmis e STF/Planalto) */}
      <picture>
        <source srcSet="/images/me_explique_hero_temis.webp" type="image/webp" />
        <img
          src="/images/me_explique_hero_temis.jpg"
          alt="Deusa Têmis no STF"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute right-0 top-0 h-full w-[65%] sm:w-[68%] object-cover object-center pointer-events-none select-none"
        />
      </picture>

      {/* Gradientes de Fusão e Escurecimento */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

      {/* Overlay Vermelho com Divisória Diagonal Estilo Vade Mecum */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ filter: 'drop-shadow(25px 0 25px rgba(0,0,0,0.85)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))' }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 52% 0, 38% 100%, 0% 100%)' }}
        >
          <div className="absolute inset-0 bg-hero-panel" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,180,180,0.25),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.6),transparent_65%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

          {/* Motivos clássicos do Direito (Balança, Martelo, Livros) */}
          <HeroMotifs />

          {/* Grid Pattern Sutil */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>
      </div>

      {/* Botões do Topo: Voltar + Contador de Cota (5 min/dia) + Config */}
      <header className="absolute top-0 right-0 left-0 z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 flex items-center justify-between pointer-events-none">
        {/* Botão de Voltar Padronizado */}
        <button
          type="button"
          onClick={() => {
            haptic.light();
            onVoltar();
          }}
          aria-label="Voltar"
          className="pointer-events-auto grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/15 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:scale-95 shadow-xl cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>

        {/* Configurações (se fornecido) */}
        {onOpenConfig ? (
          <div className="pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                haptic.light();
                onOpenConfig();
              }}
              aria-label="Configurações"
              className="grid w-10 h-10 shrink-0 place-items-center rounded-2xl bg-black/50 border border-white/15 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:scale-95 cursor-pointer shadow-lg"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div />
        )}
      </header>

      {/* Conteúdo Persuasivo à Esquerda (Sem Barra de Busca) */}
      <div className="relative z-10 pt-20 sm:pt-24 pb-6 px-4 sm:px-6 flex flex-col justify-center max-w-[48%] sm:max-w-[44%] min-h-[260px] sm:min-h-[290px]">
        {/* Logo do Direito Prime */}
        <div className="relative h-[65px] sm:h-[72px] mb-2">
          <picture>
            <source srcSet="/logo-prime.webp" type="image/webp" />
            <img
              src="/logo-prime.webp"
              alt="Direito Prime"
              loading="eager"
              decoding="async"
              width={70}
              height={70}
              fetchPriority="high"
              className="w-auto h-[65px] sm:h-[72px] object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
            />
          </picture>
        </div>

        <h1 className="font-serif italic text-white text-[20px] sm:text-[24px] leading-[1.05] font-semibold tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] whitespace-nowrap">
          Me Explique
        </h1>
        <p className="font-body text-white/95 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-0.5">
          DIDÁTICA PARA 6 ANOS
        </p>

        {/* Mensagem Persuasiva Elegante */}
        <div className="mt-3 flex items-center text-left gap-2 w-full">
          <div className="w-[2px] h-9 bg-amber-400/80 rounded-full shrink-0" />
          <p className="font-serif italic text-white/90 text-[11px] sm:text-[12.5px] leading-snug drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            Aprenda qualquer lei,<br />
            como se tivesse 6 anos.
          </p>
        </div>
      </div>

      {/* Mini Barra de Progresso da Cota (5 min diários) no rodapé do painel */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-black/40 z-20">
        <div
          className={`h-full transition-all duration-500 ${
            cota.limiteAtingido
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm shadow-amber-500/50'
          }`}
          style={{ width: `${cota.porcentagemRestante}%` }}
        />
      </div>
    </div>
  );
};

export default memo(MeExpliqueHeroPanel);
