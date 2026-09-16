import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, Globe, Headphones, PlaySquare, CalendarDays, ScanEye } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useGoBack } from '@/hooks/useGoBack';
import ShapeGrid from '@/components/ui/ShapeGrid';
import HomeCard from '@/components/vademecum/home/HomeCard';

import stfImg from '@/assets/poderes/stf.webp';
import camaraImg from '@/assets/poderes/camara.webp';
import senadoImg from '@/assets/poderes/senado.webp';
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
  { id: 'blog', label: 'BLOG', icon: Rss, color: '#FACC15' },
  { id: 'portais', label: 'PORTAIS', icon: Globe, color: '#34D399' },
  { id: 'audio', label: 'ÁUDIO AULAS', icon: Headphones, color: '#F87171' },
  { id: 'video', label: 'VÍDEO AULAS', icon: PlaySquare, color: '#A78BFA' },
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

        {/* Removido os 4 cards originais quadrados do header */}
      </div>

      {/* Área de Conteúdo abaixo do Hero (Grid Animado + Cards) */}
      <div className="flex-1 relative flex flex-col bg-[#050505] min-h-[50vh]">
        {/* Fundo Animado com Quadradinhos */}
        <ShapeGrid 
           active={true} 
           className="absolute inset-0 z-0 opacity-40 pointer-events-none" 
           hoverFillColor={poder.solidColor} 
        />
        
        <div className="relative z-10 px-4 py-8">
           <div className="mb-4">
              <h3 className="font-display text-white text-[16px] font-bold mb-1 flex items-center gap-2 uppercase tracking-widest">
                <span className="w-1 h-5 rounded-full" style={{ backgroundColor: poder.solidColor }} />
                Conteúdos
              </h3>
              <p className="font-body text-white/50 text-[12.5px] leading-snug ml-3">
                Explore os recursos disponíveis
              </p>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
              <HomeCard
                icon={CalendarDays}
                label="PAUTA DO DIA"
                sublabel="Sessões"
                color="#FFFFFF"
                iconStrokeWidth={1.5}
                onClick={() => navigate(`/tres-poderes/${id}/agenda`)}
                className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm"
              />
              <HomeCard
                icon={ScanEye}
                label="RADAR LEGISLATIVO"
                sublabel="Projetos de Lei"
                color="#FFFFFF"
                iconStrokeWidth={1.5}
                onClick={() => navigate(`/radar-360`)}
                className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm"
              />
              {CARDS.map((item, index) => (
                <HomeCard
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  sublabel="Em breve"
                  color="#FFFFFF"
                  iconStrokeWidth={1.5}
                  delay={(index + 1) * 0.05}
                  onClick={() => {
                    haptic.selection();
                    toast({ title: 'Em breve', description: `O módulo de ${item.label} está em desenvolvimento.` });
                  }}
                  className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm"
                />
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default PoderDetalhe;
