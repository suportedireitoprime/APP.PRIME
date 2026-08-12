import { useNavigate } from 'react-router-dom';
import { BookOpenText, ScanEye, Camera, ChevronRight, Newspaper, Film, NotebookText, Clapperboard, MapPin, Radar, Layers, Monitor, Scale, FileSignature, Bot, Headphones, Video, Mic, Send, Library, BookOpen, WifiOff, Music, Podcast } from 'lucide-react';

import { motion } from 'framer-motion';
import { lazy, Suspense, useState } from 'react';
import TematicaCarrossel from '@/components/ferramentas/TematicaCarrossel';
const DicionarioJuridico = lazy(() => import('@/components/ferramentas/DicionarioJuridico'));
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useTrackArea } from "@/hooks/useTrackArea";
import { DESKTOP_TOOL_GROUPS, DESKTOP_TOOLS_FLAT } from '@/config/desktopTools';



import { Trophy, Compass } from 'lucide-react';
import { ForcaRanking } from '@/components/gamificacao/ForcaRanking';



const Ferramentas = () => {
  useTrackArea("ferramentas_aberta");
  const navigate = useNavigate();
  const [dicionarioOpen, setDicionarioOpen] = useState(false);

  const [rankingOpen, setRankingOpen] = useState(false);

  const handleToolClick = (id: string, route?: string) => {
    if (id === 'ranking') {
      setRankingOpen(true);
      return;
    }
    
    if (route && route !== '#') {
      navigate(route);
      return;
    }

    switch (id) {
      case 'desktop': navigate('/desktop'); break;
      case 'me-explique': navigate('/me-explique'); break;
      case 'vade-mecum': navigate('/vade-mecum'); break;
      case 'peticao-inicial': navigate('/ferramentas/peticao-inicial'); break;
      case 'flashcards': navigate('/flashcards'); break;
      case 'dicionario': navigate('/ferramentas/dicionario'); break;
      case 'radar360': navigate('/radares'); break;
      case 'radares': navigate('/radares'); break;
      case 'leis-cantadas': navigate('/leis-cantadas'); break;
      case 'gravar-aula': navigate('/anotacoes/audio'); break;
      case 'resumos-juridicos': navigate('/resumos-juridicos'); break;
      case 'boletins': navigate('/boletins'); break;
      case 'noticias': navigate('/noticias'); break;
      case 'newsletter': navigate('/newsletter'); break;
      case 'biblioteca': navigate('/biblioteca'); break;
      case 'aprender': navigate('/aprender'); break;
      case 'modo-offline': navigate('/modo-offline'); break;
      case 'tematica': navigate('/tematica-juridica'); break;
      case 'forca': navigate('/gamificacao/forca'); break;
    }
  };



  const mobileHeader = (
    <PageHeader
      title="Ferramentas"
      subtitle="Recursos para potencializar seus estudos"
      onBack={() => navigate('/')}
    />
  );


  const primaryTools = [
    { id: 'desktop', label: 'Modo Desktop', desc: 'Interface completa', icon: Monitor, route: '/desktop', color: '#10B981' },
    { id: 'noticias', label: 'Notícias', desc: 'Notícias e atualizações', icon: Newspaper, route: '/noticias', color: '#EC4899' },
    { id: 'boletins', label: 'Boletins Jurídicos', desc: 'Vídeo diário', icon: Podcast, route: '/boletins', color: '#EF4444' },
    { id: 'radares', label: 'Radares de Leis', desc: 'Projetos de Lei', icon: Radar, route: '/radares', color: '#0EA5E9' },
  ];

  const primaryIds = ['noticias', 'boletins', 'radares', 'desktop'];
  const secondaryTools = DESKTOP_TOOLS_FLAT.filter(t => !primaryIds.includes(t.id));

  const toolsList = (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex items-baseline gap-2 pb-1 border-b border-border/40 px-1">
          <h2 className="font-display text-lg font-bold text-foreground">Destaques</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {primaryTools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handleToolClick(tool.id, tool.route)}
                data-track="ferramenta_abrir"
                data-ferramenta-id={tool.id}
                data-ferramenta-nome={tool.label}
                className="flex flex-col items-start justify-between p-4 rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/40 active:scale-[0.99] transition-all group text-left gap-3 relative"
              >
                <div className="flex justify-between items-start w-full">
                  <Icon
                    className="w-8 h-8"
                    style={{
                      color: tool.color,
                      filter: 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                    }}
                    strokeWidth={1.15}
                  />
                  <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </div>
                <div className="flex flex-col items-start w-full mt-auto gap-0.5">
                  <span className="font-display text-[14px] font-bold leading-tight text-foreground line-clamp-1 w-full">
                    {tool.label}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground line-clamp-1 w-full text-left">
                    {tool.desc}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="mt-2 -mx-2">
        <TematicaCarrossel />
      </section>

      <section className="space-y-3 mt-4">
        <div className="flex items-baseline gap-2 pb-1 border-b border-border/40 px-1">
          <h2 className="font-display text-lg font-bold text-foreground">Explorar</h2>
        </div>
        <div className="space-y-3">
          {secondaryTools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + primaryTools.length) * 0.04 }}
                onClick={() => handleToolClick(tool.id, tool.route)}
                data-track="ferramenta_abrir"
                data-ferramenta-id={tool.id}
                data-ferramenta-nome={tool.label}
                className="flex items-center gap-3 px-4 h-[76px] rounded-2xl bg-card border border-border/60 shadow-sm hover:border-primary/40 active:scale-[0.99] transition-all group w-full"
              >
                <Icon
                  className="w-8 h-8 shrink-0"
                  style={{
                    color: tool.color,
                    filter: tool.id === 'caca-palavras' || tool.id === 'palavras-cruzadas' ? 'grayscale(1)' : 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                  }}
                  strokeWidth={1.15}
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className={`font-display text-[15.5px] font-bold leading-tight truncate ${tool.id === 'caca-palavras' || tool.id === 'palavras-cruzadas' ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {tool.label}
                  </p>
                  <p className="font-body text-muted-foreground text-[12px] leading-tight truncate mt-0.5">
                    {tool.desc}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );


  // Desktop: hub completo em grade, aproveitando toda a largura da tela.
  const desktopGrid = (
    <div className="mx-auto w-full max-w-[1600px] space-y-10">
      {DESKTOP_TOOL_GROUPS.map((group) => (
        <section key={group.id}>
          <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-2">
            <h2 className="font-display text-lg font-bold text-foreground">{group.label}</h2>
            <p className="text-xs text-muted-foreground">{group.hint}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {group.tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id, tool.route)}
                  data-track="ferramenta_abrir"
                  data-ferramenta-id={tool.id}
                  data-ferramenta-nome={tool.label}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm"
                    style={{ backgroundColor: `${tool.color}26` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: tool.color }} strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[15px] font-bold text-foreground group-hover:text-primary transition-colors">
                      {tool.label}
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">
                      {tool.desc}
                    </span>
                  </span>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title="Ferramentas"
      subtitle="Todos os recursos do Direito Prime em um só lugar"
      mobileHeader={mobileHeader}
      wide
    >
      <div className="px-4 sm:px-6 py-4 pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] lg:hidden">
        {toolsList}
      </div>
      <div className="hidden lg:block">
        {desktopGrid}
      </div>

      <Suspense fallback={null}>
        {dicionarioOpen && <DicionarioJuridico open={dicionarioOpen} onClose={() => setDicionarioOpen(false)} />}
      </Suspense>

      <ForcaRanking isOpen={rankingOpen} onClose={() => setRankingOpen(false)} />
    </DesktopPageLayout>
  );
};


export default Ferramentas;
