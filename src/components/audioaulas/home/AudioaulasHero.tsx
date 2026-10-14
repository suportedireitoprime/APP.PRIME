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
  const isEca = areaAtual && /eca|criança|adolescente/i.test(areaAtual);
  const heroTitulo = isEca
    ? 'ECA'
    : areaAtual
      ? areaAtual.replace(/^Direitos?\s+(do\s+)?/i, '').trim()
      : 'Audioaulas';

  const heroSub = isEca
    ? 'Estatuto da Criança e do Adolescente • Lei nº 8.069/1990'
    : areaAtual
      ? 'Aulas em áudio para ouvir e revisar.'
      : 'Aprenda ouvindo, por área do Direito.';

  const capaImg = areaAtual ? capaDaArea(areaAtual) : CAPA_HUB;

  return (
    <div className="relative px-4 pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-5 overflow-visible sm:px-6 lg:px-10 lg:pt-[calc(2.5rem+var(--sai-top,env(safe-area-inset-top,0px)))] lg:pb-8">
      <div className="mx-auto w-full max-w-[1400px] 2xl:max-w-[1600px] relative z-10">
        <button
          onClick={() => (areaAtual ? navigate('/audioaulas') : navigate('/'))}
          aria-label="Voltar"
          className="mb-5 w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition shrink-0 active:scale-95 z-10 relative"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>

        <div className="flex items-center gap-4 lg:gap-8">
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
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1.5 border border-primary/30">
              <Headphones className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {areaAtual ? (isEca ? 'Estatuto' : 'Área') : 'Acervo'}
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-widest uppercase leading-none text-white drop-shadow-md truncate">
              {heroTitulo}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 mt-2 font-medium line-clamp-2">{heroSub}</p>
            {!loading && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 backdrop-blur shadow-sm">
                  <Headphones className="w-3.5 h-3.5 text-primary" />
                  <span>{totalAulas} aula(s) disponível(is)</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
