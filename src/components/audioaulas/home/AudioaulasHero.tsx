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
}

export const AudioaulasHero = React.memo(function AudioaulasHero({
  areaAtual,
  loading,
  totalAulas
}: AudioaulasHeroProps) {
  const navigate = useNavigate();
  const heroTitulo = areaAtual ?? 'Audioaulas';
  const heroSub = areaAtual ? 'Aulas em áudio para ouvir e revisar.' : 'Aprenda ouvindo, por área do Direito.';
  const capaImg = areaAtual ? capaDaArea(areaAtual) : CAPA_HUB;

  return (
    <div className="relative px-4 pt-[calc(2rem+var(--sai-top))] pb-6 overflow-hidden sm:px-6 lg:px-10 lg:pt-[calc(3rem+var(--sai-top))] lg:pb-10">
      <div className="absolute inset-0 -z-10">
        <img
          src={capaImg}
          alt=""
          aria-hidden
          className="w-full h-full object-cover opacity-35 scale-110 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background/80 to-background" />
      </div>

      <div className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1600px]">
        <button
          onClick={() => (areaAtual ? navigate('/audioaulas') : navigate('/'))}
          aria-label="Voltar"
          className="mb-4 h-9 w-9 md:h-10 md:w-10 rounded-full bg-white/5 border border-white/10 grid place-items-center text-zinc-400 hover:text-white hover:bg-white/10 transition shrink-0 active:scale-95 z-10 relative"
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
        </button>

        <div className="flex items-center gap-4 lg:gap-8">
          <span className="relative h-24 w-24 sm:h-32 sm:w-32 lg:h-44 lg:w-44 shrink-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/70 border border-white/10 bg-[#1c1c1c]">
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
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-[11px] font-semibold uppercase tracking-widest mb-2 border border-primary/30">
              <Headphones className="h-3.5 w-3.5" /> {areaAtual ? 'Área' : 'Acervo'}
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight leading-none text-white">
              {heroTitulo}
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-zinc-300 mt-1.5">{heroSub}</p>
            {!loading && (
              <p className="text-xs text-zinc-400 mt-1 font-medium">
                {totalAulas} aula(s) disponível(is)
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
