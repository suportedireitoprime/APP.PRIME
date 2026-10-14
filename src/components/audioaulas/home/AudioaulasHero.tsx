import React from 'react';
import { ArrowLeft, Headphones } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CAPA_HUB, capaDaArea } from '@/lib/audioaulasHelper';
import { CapaOtimizada } from './CapaOtimizada';
import CassetteAnimation from './CassetteAnimation';

interface AudioaulasHeroProps {
  areaAtual: string | null;
  loading: boolean;
  totalAulas: number;
  onVoltar?: () => void;
  subtituloCustom?: string;
}

export const AudioaulasHero = React.memo(function AudioaulasHero({
  areaAtual,
  loading,
  totalAulas,
  onVoltar,
  subtituloCustom
}: AudioaulasHeroProps) {
  const navigate = useNavigate();
  const isEca = areaAtual && /eca|criança|adolescente/i.test(areaAtual);
  const heroTitulo = isEca
    ? 'ECA'
    : areaAtual
      ? areaAtual.replace(/^Direitos?\s+(do\s+)?/i, '').trim()
      : 'Audioaulas';

  const heroSub = subtituloCustom || (isEca
    ? 'Estatuto da Criança e do Adolescente • Lei nº 8.069/1990'
    : areaAtual
      ? 'Aulas em áudio para ouvir e revisar.'
      : 'Aprenda ouvindo, por área do Direito.');

  const capaImg = areaAtual ? capaDaArea(areaAtual) : CAPA_HUB;

  const handleVoltar = () => {
    if (onVoltar) {
      onVoltar();
    } else if (areaAtual) {
      navigate('/audioaulas');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="relative px-4 pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-5 overflow-visible sm:px-6 lg:px-10 lg:pt-[calc(2.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pb-8">
      <div className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1600px] relative z-10">
        <button
          onClick={handleVoltar}
          aria-label="Voltar"
          className="mb-5 w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition shrink-0 active:scale-95 z-10 relative"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>

        <div className="flex items-center justify-between gap-3 sm:gap-6 lg:gap-8">
          <div className="flex items-center gap-3.5 sm:gap-5 lg:gap-8 min-w-0 flex-1">
            <span className="relative h-20 w-20 sm:h-28 sm:w-28 lg:h-36 lg:w-36 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/70 border border-white/10 bg-[#1c1c1c]">
              {!areaAtual ? (
                <CassetteAnimation />
              ) : (
                <CapaOtimizada
                  src={capaImg}
                  alt=""
                  animacaoEntrada
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-widest uppercase leading-none text-white drop-shadow-md truncate">
                {heroTitulo}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-300 mt-2 font-medium line-clamp-2">{heroSub}</p>
            </div>
          </div>

          {/* Gráfico Redondo Interativo com Total de Aulas (conforme solicitado no áudio) */}
          {!loading && totalAulas > 0 && (
            <div className="shrink-0 flex flex-col items-center justify-center pl-1 sm:pl-2">
              <div
                className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center rounded-full bg-white/[0.03] border border-white/10 shadow-xl shadow-black/70 group hover:border-primary/50 transition-all duration-300"
                title={`${totalAulas} aulas disponíveis no total`}
              >
                {/* SVG Donut Ring com gradiente neon */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="heroGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>
                  </defs>
                  {/* Trilha de fundo */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="7"
                    fill="none"
                  />
                  {/* Arco com gradiente e glow */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#heroGaugeGrad)"
                    strokeWidth="7"
                    strokeDasharray="251.2"
                    strokeDashoffset="45"
                    strokeLinecap="round"
                    fill="none"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))'
                    }}
                  />
                </svg>

                {/* Conteúdo Central */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-1">
                  <span className="text-sm sm:text-lg lg:text-xl font-black text-white leading-none tracking-tight">
                    {totalAulas}
                  </span>
                  <span className="text-[9px] sm:text-[10px] lg:text-[11px] font-bold text-zinc-400 uppercase tracking-wider leading-none mt-0.5">
                    {totalAulas === 1 ? 'aula' : 'aulas'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
