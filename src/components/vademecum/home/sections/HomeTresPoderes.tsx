import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { haptic } from '@/lib/nativeHaptics';

import stfImg from '@/assets/poderes/stf.jpg';
import camaraImg from '@/assets/poderes/camara.jpg';
import senadoImg from '@/assets/poderes/senado.jpg';

const PODERES = [
  {
    id: 'stf',
    titulo: 'Supremo Tribunal Federal',
    sigla: 'STF',
    img: stfImg,
    color: 'rgba(225, 29, 72, 0.45)', // Rose-600 / Red brand
  },
  {
    id: 'camara',
    titulo: 'Câmara dos Deputados',
    sigla: 'Câmara',
    img: camaraImg,
    color: 'rgba(14, 165, 233, 0.45)', // Sky-500
  },
  {
    id: 'senado',
    titulo: 'Senado Federal',
    sigla: 'Senado',
    img: senadoImg,
    color: 'rgba(16, 185, 129, 0.45)', // Emerald-500
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

      <div className="w-full overflow-x-auto scrollbar-hide px-4">
        <div className="flex items-center gap-2.5 pb-4">
          {PODERES.map((poder) => (
            <button
              key={poder.id}
              onClick={() => {
                haptic.selection();
                navigate(`/tres-poderes/${poder.id}`);
              }}
              className="group relative flex-shrink-0 w-[140px] sm:w-[160px] h-[180px] rounded-2xl overflow-hidden shadow-lg transition-all active:scale-[0.97]"
            >
              <img
                src={poder.img}
                alt={poder.titulo}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div 
                className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" 
              />
              <div 
                className="absolute inset-0 mix-blend-overlay transition-opacity"
                style={{ backgroundColor: poder.color }}
              />
              
              <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end text-left">
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-0.5 drop-shadow-md">
                  {poder.sigla}
                </span>
                <h4 className="text-white font-bold text-[13px] leading-tight drop-shadow-lg">
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
