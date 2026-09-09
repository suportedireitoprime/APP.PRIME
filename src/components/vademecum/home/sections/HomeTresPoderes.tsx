import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';

import stfImg from '@/assets/poderes/stf.webp';
import camaraImg from '@/assets/poderes/camara.webp';
import senadoImg from '@/assets/poderes/senado.webp';

const PODERES = [
  {
    id: 'stf',
    titulo: 'Supremo Tribunal Federal',
    sigla: 'STF',
    img: stfImg,
    color: 'rgba(225, 29, 72, 0.45)', // Rose-600 / Red brand
  },
  {
    id: 'senado',
    titulo: 'Senado Federal',
    sigla: 'Senado',
    img: senadoImg,
    color: 'rgba(16, 185, 129, 0.45)', // Emerald-500
  },
  {
    id: 'camara',
    titulo: 'Câmara dos Deputados',
    sigla: 'Câmara',
    img: camaraImg,
    color: 'rgba(14, 165, 233, 0.45)', // Sky-500
  },
];

const HomeTresPoderes = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 pt-6 pb-2">
      <div className="px-4 mb-1 relative z-10 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
            Três Poderes
          </h3>
          <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3">
            Acompanhe o Judiciário e o Legislativo
          </p>
        </div>
      </div>

      <div className="w-full px-4">
        <div className="flex flex-col rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-black">
          {PODERES.map((poder, i) => (
            <button
              key={poder.id}
              onClick={() => {
                haptic.selection();
                navigate(`/tres-poderes/${poder.id}`);
              }}
              className="group relative w-full h-[120px] flex items-center justify-between px-5 transition-all active:scale-[0.98]"
            >
              {/* Divisória brilhante (exceto no último) */}
              {i !== PODERES.length - 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/60 z-30 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              )}
              
              {/* Imagem de Fundo Completa */}
              <img
                src={poder.img}
                alt={poder.titulo}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {/* Degradê muito sutil apenas na base/esquerda para leitura do texto, sem escurecer a imagem inteira */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" 
              />
              <div 
                className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" 
              />
              <div 
                className="absolute inset-0 mix-blend-overlay transition-opacity"
                style={{ backgroundColor: poder.color }}
              />
              
              {/* Conteúdo Textual (Esquerda) */}
              <div className="relative z-10 flex flex-col text-left max-w-[80%]">
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest mb-1 drop-shadow-md">
                  {poder.sigla}
                </span>
                <h4 className="text-white font-extrabold text-[15px] sm:text-[16px] uppercase tracking-wider leading-snug drop-shadow-lg">
                  {poder.titulo}
                </h4>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(HomeTresPoderes);
