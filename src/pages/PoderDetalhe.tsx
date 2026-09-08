import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, ScrollText, Library, FileText, ExternalLink } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

import stfImg from '@/assets/poderes/stf.jpg';
import camaraImg from '@/assets/poderes/camara.jpg';
import senadoImg from '@/assets/poderes/senado.jpg';

const PODERES_DATA: Record<string, any> = {
  stf: {
    titulo: 'Supremo Tribunal Federal',
    sigla: 'STF',
    img: stfImg,
    color: 'rgba(225, 29, 72, 0.45)', // Rose-600
    theme: 'rose',
    description: 'A mais alta instância do poder judiciário brasileiro.',
  },
  camara: {
    titulo: 'Câmara dos Deputados',
    sigla: 'Câmara',
    img: camaraImg,
    color: 'rgba(14, 165, 233, 0.45)', // Sky-500
    theme: 'sky',
    description: 'A casa do povo e representação direta dos cidadãos.',
  },
  senado: {
    titulo: 'Senado Federal',
    sigla: 'Senado',
    img: senadoImg,
    color: 'rgba(16, 185, 129, 0.45)', // Emerald-500
    theme: 'emerald',
    description: 'A câmara alta do legislativo e representante dos estados.',
  },
};

const PoderDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const poder = id ? PODERES_DATA[id] : null;

  if (!poder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground mb-4">Poder não encontrado.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background pb-safe">
      {/* Hero Header */}
      <div className="relative h-[240px] md:h-[300px] w-full shrink-0">
        <img
          src={poder.img}
          alt={poder.titulo}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-background" />
        <div 
          className="absolute inset-0 mix-blend-overlay"
          style={{ backgroundColor: poder.color }}
        />
        
        {/* Navigation Bar */}
        <div className="absolute top-0 inset-x-0 p-4 pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))] flex items-center justify-between z-10">
          <button
            onClick={() => { haptic.selection(); navigate(-1); }}
            className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Hero Title */}
        <div className="absolute bottom-6 px-5 z-10">
          <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1 block drop-shadow-md">
            {poder.sigla}
          </span>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white drop-shadow-lg leading-tight">
            {poder.titulo}
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-sm drop-shadow-md">
            {poder.description}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6">
        
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            Biografia e Membros
          </h2>
          <div className="bg-card border border-border rounded-xl p-5 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[120px]">
            <BookOpen className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Área em desenvolvimento.</p>
            <p className="text-xs mt-1">As biografias e informações detalhadas serão adicionadas em breve.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Notícias & Blog
          </h2>
          <div className="bg-card border border-border rounded-xl p-5 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[120px]">
            <Library className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Feeds e notícias relacionadas a este poder serão exibidos aqui.</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-primary" />
            Portais
          </h2>
          <div className="bg-card border border-border rounded-xl p-5 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[80px]">
            <p className="text-sm">Links externos serão organizados nesta seção.</p>
          </div>
        </section>

      </div>
    </div>
  );
};

export default PoderDetalhe;
