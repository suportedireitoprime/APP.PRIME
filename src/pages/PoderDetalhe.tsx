import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Rss, Globe, Headphones, PlaySquare } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useGoBack } from '@/hooks/useGoBack';

import stfImg from '@/assets/poderes/stf.jpg';
import camaraImg from '@/assets/poderes/camara.jpg';
import senadoImg from '@/assets/poderes/senado.jpg';
import { toast } from '@/hooks/use-toast';

const PODERES_DATA: Record<string, any> = {
  stf: {
    titulo: 'Supremo Tribunal Federal',
    sigla: 'STF',
    img: stfImg,
    color: 'rgba(225, 29, 72, 0.45)', // Rose-600
    solidColor: '#E11D48',
    description: 'A mais alta instância do poder judiciário brasileiro.',
  },
  senado: {
    titulo: 'Senado Federal',
    sigla: 'Senado',
    img: senadoImg,
    color: 'rgba(16, 185, 129, 0.45)', // Emerald-500
    solidColor: '#10B981',
    description: 'A câmara alta do legislativo e representante dos estados.',
  },
  camara: {
    titulo: 'Câmara dos Deputados',
    sigla: 'Câmara',
    img: camaraImg,
    color: 'rgba(14, 165, 233, 0.45)', // Sky-500
    solidColor: '#0EA5E9',
    description: 'A casa do povo e representação direta dos cidadãos.',
  },
};

const CARDS = [
  { id: 'blog', label: 'Blog', icon: Rss, color: '#FACC15' },
  { id: 'portais', label: 'Portais', icon: Globe, color: '#34D399' },
  { id: 'audio', label: 'Áudio Aulas', icon: Headphones, color: '#F87171' },
  { id: 'video', label: 'Vídeo Aulas', icon: PlaySquare, color: '#A78BFA' },
];

const PoderDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  
  const poder = id ? PODERES_DATA[id] : null;

  if (!poder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground mb-4">Poder não encontrado.</p>
        <button onClick={() => goBack()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
          Voltar
        </button>
      </div>
    );
  }


  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background pb-safe">
      {/* Hero Header (Igual ao HomeHeaderHero) */}
      <div
        className="relative overflow-hidden rounded-b-[36px] shadow-2xl shadow-black/60 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] flex flex-col z-20 pb-6"
        style={{ transform: 'translateZ(0)', backgroundColor: '#050505' }}
      >
        {/* Imagem e Degradês */}
        <img
          src={poder.img}
          alt={poder.titulo}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/95 z-0" />
        <div 
          className="absolute inset-0 mix-blend-overlay z-0"
          style={{ backgroundColor: poder.color }}
        />

        {/* Botão de Voltar */}
        <header className="relative z-20 px-3 md:px-6 pt-2 flex items-center justify-start">
          <button
             onClick={() => { haptic.selection(); goBack(); }}
             className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 backdrop-blur-md shadow-lg shadow-black/30 flex items-center justify-center active:scale-95 transition"
             aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </header>

        {/* Título Principal com a Cor Predominante */}
        <div className="relative z-10 pt-8 sm:pt-10 flex-1 flex flex-col justify-start min-h-[100px] ml-4 sm:ml-6 mb-4">
           <div className="flex items-center gap-3">
              {/* Linha vertical (substitui o fundo vermelho padrão) */}
              <div className="w-[3px] h-10 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: poder.solidColor }} />
              <div className="flex flex-col">
                 <p className="font-body text-white/90 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase drop-shadow-md mb-0.5">
                   {poder.sigla}
                 </p>
                 <h1 className="font-serif italic text-white text-[20px] sm:text-[24px] leading-none font-semibold tracking-tight drop-shadow-lg">
                   {poder.titulo}
                 </h1>
              </div>
           </div>
        </div>

        {/* Cards de Atalhos Customizados */}
        <div className="relative z-10 px-3 sm:px-5 pt-2">
           <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {CARDS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      haptic.selection();
                      toast({ title: 'Em breve', description: `O módulo de ${item.label} está em desenvolvimento.` });
                    }}
                    style={{ '--shimmer-delay': `${index * 150}ms` } as React.CSSProperties}
                    className="group relative flex flex-col items-center justify-center gap-2 py-3 px-1 min-h-[48px] rounded-2xl bg-black/75 backdrop-blur-sm border border-white/15 shadow-lg shadow-black/30 active:scale-[0.96] transition-all duration-75 touch-manipulation hover:bg-black/90"
                  >
                    <Icon
                      className="w-5 h-5 shrink-0 transition-all group-hover:scale-110"
                      style={{ color: item.color, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                      strokeWidth={2}
                    />
                    <span className="w-full text-center px-0.5 text-[9px] font-extrabold text-white/90 leading-tight uppercase tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })}
           </div>
        </div>
      </div>

      {/* Área de Conteúdo abaixo do Hero (Vazio por enquanto conforme solicitado, mas pronto para scroll) */}
      <div className="flex-1 px-4 py-8">
        <div className="flex flex-col items-center justify-center h-40 text-center opacity-60">
          <p className="text-sm font-medium">Selecione uma opção acima para carregar o conteúdo.</p>
        </div>
      </div>
    </div>
  );
};

export default PoderDetalhe;
