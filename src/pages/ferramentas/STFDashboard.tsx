import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Scale, BookOpen, Calendar, Newspaper, Library, ArrowLeft } from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';

// Assets
import heroBannerAsset from '@/assets/desktop-hero-banner.webp';
const heroBanner = heroBannerAsset;

export default function STFDashboard() {
  const navigate = useNavigate();
  const [typingHint] = useState('Pesquisar no STF...');

  const handleBack = () => {
    haptic.selection();
    navigate(-1);
  };

  const stfFunctions = [
    { id: 'blog', label: 'Blog', icon: Newspaper, path: '/ferramentas/stf/blog' },
    { id: 'biografias', label: 'Biografias', icon: Library, path: '/ferramentas/stf/biografias' },
    { id: 'agendas', label: 'Agendas', icon: Calendar, path: '/ferramentas/stf/agendas' },
    { id: 'jurisprudencia', label: 'Jurisprudência', icon: BookOpen, path: '/ferramentas/stf/jurisprudencia' },
  ];

  const stfCards = [
    {
      id: 'sessoes',
      title: 'Sessões do STF',
      description: 'Acompanhe as pautas e transmissões do Plenário.',
      icon: Scale,
      path: '/ferramentas/stf/sessoes',
      color: '#8B5CF6'
    },
    {
      id: 'informativos',
      title: 'Informativos',
      description: 'Resumos dos principais julgamentos do STF.',
      icon: BookOpen,
      path: '/ferramentas/stf/informativos',
      color: '#0EA5E9'
    },
    {
      id: 'biografias',
      title: 'Biografias',
      description: 'História e currículo dos Ministros que passaram pelo STF.',
      icon: Library,
      path: '/ferramentas/stf/biografias',
      color: '#EC4899'
    },
    {
      id: 'noticias',
      title: 'Últimas Notícias',
      description: 'Decisões e acontecimentos recentes do Tribunal.',
      icon: Newspaper,
      path: '/ferramentas/stf/noticias',
      color: '#F59E0B'
    }
  ];

  return (
    <div className="min-h-dvh bg-zinc-950 pb-20 relative overflow-hidden">
      {/* Botão de Voltar Premium */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-50 flex items-center justify-center w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors focus-visible:outline-none"
      >
        <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
      </button>

      <div className="absolute inset-0 z-0 opacity-40">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(168, 85, 247, 0.15)'
          hoverFillColor='rgba(168, 85, 247, 0.2)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10 w-full overflow-hidden rounded-b-[2rem] border-b border-purple-900/50 shadow-2xl mb-8" style={{ minHeight: '360px' }}>
        <img
          src={heroBanner}
          alt="STF Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
        />
        {/* Roxos/Purple overlays */}
        <div className="absolute inset-0 bg-purple-950/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950 via-purple-900/90 to-purple-800/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[360px] px-6 py-12 text-center space-y-8 mt-4">
          <div className="space-y-3 max-w-2xl">
            <h2 className="font-serif italic text-4xl xl:text-5xl font-bold text-white leading-[1.05] tracking-tight drop-shadow-lg">
              Supremo Tribunal Federal
            </h2>
            <p className="text-purple-200 text-base xl:text-lg font-body leading-relaxed max-w-xl mx-auto">
              Acompanhe sessões, pesquise jurisprudência e acesse o acervo completo.
            </p>
          </div>

          <button
            className="group relative w-full max-w-2xl flex items-center h-14 pl-6 pr-24 rounded-2xl bg-zinc-950/60 backdrop-blur-md border-2 border-purple-500/40 shadow-2xl shadow-purple-900/40 hover:border-purple-500/70 transition-colors text-left"
          >
            <Search className="w-5 h-5 text-purple-400 shrink-0 mr-3" />
            <span className="text-white/80 text-base font-body truncate">
              {typingHint}
              <span className="animate-pulse text-purple-400">|</span>
            </span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-5 rounded-xl bg-purple-600 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/40 group-hover:bg-purple-500 transition-colors">
              Pesquisar
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            {stfFunctions.map((func) => (
              <button
                key={func.id}
                onClick={() => {
                  haptic.selection();
                  navigate(func.path);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors text-purple-50 text-sm font-medium"
              >
                <func.icon className="w-4 h-4 text-purple-300" />
                {func.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6 md:px-12 pb-12 mx-auto w-full max-w-[1000px]">
        <h3 className="font-display text-xl font-bold text-white mb-6">Recursos e Serviços</h3>
        <div className="grid grid-cols-2 gap-4">
          {stfCards.map((card) => (
            <motion.div
              key={card.id}
              whileHover={{ y: -4 }}
              onClick={() => {
                haptic.selection();
                navigate(card.path);
              }}
              className="group cursor-pointer flex flex-col p-6 rounded-3xl bg-zinc-900/50 backdrop-blur-sm border border-white/5 hover:border-purple-500/30 hover:bg-zinc-800/80 transition-all shadow-xl"
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: `${card.color}15`, color: card.color }}
              >
                <card.icon className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-lg mb-2 text-white group-hover:text-purple-400 transition-colors">
                {card.title}
              </h4>
              <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
