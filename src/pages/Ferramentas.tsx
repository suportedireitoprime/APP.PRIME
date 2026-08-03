import { useNavigate } from 'react-router-dom';
import { BookOpenText, ScanEye, Camera, ChevronRight, Newspaper, Film, NotebookText, Clapperboard, MapPin, Radar, Layers, Monitor, Scale, FileSignature, Bot, Headphones, Video, Mic, Send, Library, BookOpen, WifiOff, Music } from 'lucide-react';

import { motion } from 'framer-motion';
import { lazy, Suspense, useState } from 'react';
const DicionarioJuridico = lazy(() => import('@/components/ferramentas/DicionarioJuridico'));
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useTrackArea } from "@/hooks/useTrackArea";
import { DESKTOP_TOOL_GROUPS } from '@/config/desktopTools';


const TOOLS = [
  { id: 'desktop', label: 'Desktop', desc: 'Versão para computador', icon: Monitor },
  { id: 'me-explique', label: 'Me Explique', desc: 'Aponte a câmera para o livro e ouça a explicação ao vivo', icon: Camera },
  { id: 'peticao-inicial', label: 'Petição Inicial', desc: 'Gere petições com IA e jurisprudência real do STF/STJ', icon: FileSignature },
  { id: 'radar360', label: 'Radar 360', desc: 'Alterações recentes e projetos de lei', icon: ScanEye },
  { id: 'radares', label: 'Radares', desc: 'Alterações de leis e projetos monitorados', icon: Radar },
  { id: 'locais', label: 'Locais Jurídicos', desc: 'Tribunais, cartórios, delegacias e museus perto de você', icon: MapPin },
  { id: 'assistente', label: 'Assistente IA', desc: 'IA jurídica para tirar dúvidas', icon: Bot },
  { id: 'audioaulas', label: 'Audioaulas', desc: 'Aulas em áudio por área do Direito', icon: Headphones },
  { id: 'leis-cantadas', label: 'Leis Cantadas', desc: 'Aprenda a lei seca com música em vários estilos', icon: Music },
  { id: 'videoaulas', label: 'Videoaulas', desc: 'Aulas em vídeo com flashcards, questões e lei seca por IA', icon: Video },
  { id: 'gravar-aula', label: 'Gravar aula', desc: 'Grave aulas longas com resumo automático por IA', icon: Mic },
  { id: 'tematica', label: 'Temática Jurídica', desc: 'Filmes, séries e documentários para juristas', icon: Film },
  { id: 'boletins', label: 'Boletins Jurídicos', desc: 'Vídeo diário com as normas quentes de hoje', icon: Clapperboard },
  { id: 'noticias', label: 'Notícias', desc: 'Notícias jurídicas e atualizações', icon: Newspaper },
  { id: 'newsletter', label: 'Newsletter', desc: 'Receba um resumo jurídico diário no e-mail', icon: Send },
];


const Ferramentas = () => {
  useTrackArea("ferramentas_aberta");
  const navigate = useNavigate();
  const [dicionarioOpen, setDicionarioOpen] = useState(false);

  const handleToolClick = (id: string) => {
    switch (id) {
      case 'desktop': navigate('/desktop'); break;
      case 'me-explique': navigate('/me-explique'); break;
      case 'vade-mecum': navigate('/vade-mecum'); break;
      case 'peticao-inicial': navigate('/ferramentas/peticao-inicial'); break;
      case 'flashcards': navigate('/flashcards'); break;
      case 'dicionario': navigate('/ferramentas/dicionario'); break;
      case 'radar360': navigate('/radar-360'); break;
      case 'radares': navigate('/radares'); break;
      case 'assistente': navigate('/assistente-horus'); break;
      case 'audioaulas': navigate('/audioaulas'); break;
      case 'leis-cantadas': navigate('/leis-cantadas'); break;
      case 'videoaulas': navigate('/videoaulas'); break;
      case 'gravar-aula': navigate('/anotacoes/audio'); break;
      case 'resumos-juridicos': navigate('/resumos-juridicos'); break;
      case 'boletins': navigate('/boletins'); break;
      case 'noticias': navigate('/noticias'); break;
      case 'newsletter': navigate('/newsletter'); break;
      case 'biblioteca': navigate('/biblioteca'); break;
      case 'aprender': navigate('/aprender'); break;
      case 'modo-offline': navigate('/modo-offline'); break;
      case 'locais': navigate('/ferramentas/locais'); break;
      case 'tematica': navigate('/tematica-juridica'); break;
    }
  };



  const mobileHeader = (
    <PageHeader
      title="Ferramentas"
      subtitle="Recursos para potencializar seus estudos"
      onBack={() => navigate('/')}
    />
  );


  const toolsList = (
    <div className="space-y-3">
      {TOOLS.map((tool, i) => {
        const Icon = tool.icon;
        return (
          <motion.button
            key={tool.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => handleToolClick(tool.id)}
            data-track="ferramenta_abrir"
            data-ferramenta-id={tool.id}
            data-ferramenta-nome={tool.label}
            className="flex items-center gap-4 p-5 min-h-[80px] rounded-xl bg-card border border-border hover:border-primary/40 transition-all group w-full"
          >
            <Icon className="w-6 h-6 text-primary stroke-[1.5] shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {tool.label}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5 leading-tight">
                {tool.desc}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </motion.button>
        );
      })}
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
                  onClick={() => navigate(tool.route)}
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
      <div className="px-4 sm:px-6 py-4 lg:hidden">
        {toolsList}
      </div>
      <div className="hidden lg:block">
        {desktopGrid}
      </div>

      <Suspense fallback={null}>
        {dicionarioOpen && <DicionarioJuridico open={dicionarioOpen} onClose={() => setDicionarioOpen(false)} />}
      </Suspense>
    </DesktopPageLayout>
  );
};


export default Ferramentas;
