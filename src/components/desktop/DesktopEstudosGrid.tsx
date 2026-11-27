import { useNavigate } from 'react-router-dom';
import {
  Library,
  Video,
  NotebookPen,
  Headphones,
  Brain,
  BookA,
  Scale,
  ListChecks,
  Layers,
  Clapperboard,
  Newspaper,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';

interface Item {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  route: string;
}

interface Props {
  onChatClick?: () => void;
  onFerramentasClick?: () => void;
}

const ESTUDOS: Item[] = [
  { id: 'aulas', label: 'Aulas', sublabel: 'Trilhas e lições interativas', icon: GraduationCap, route: '/aulas' },
  { id: 'biblioteca', label: 'Biblioteca', sublabel: 'Livros, clássicos e coleções', icon: Library, route: '/bibliotecas' },
  { id: 'resumos', label: 'Resumos', sublabel: 'Resumos jurídicos por tema', icon: NotebookPen, route: '/resumos-juridicos' },
  { id: 'audioleis', label: 'Ouça a Lei', sublabel: 'Artigos narrados com texto', icon: Headphones, route: '/audioleis' },
  { id: 'animacoes', label: 'Animações', sublabel: 'Casos penais e OAB em 2D', icon: Clapperboard, route: '/animacoes' },
  { id: 'videoaulas', label: 'Videoaulas', sublabel: 'Aulas em vídeo por área', icon: Video, route: '/videoaulas' },
  { id: 'mapas', label: 'Mapas Mentais', sublabel: 'Mapas, infográficos e fluxogramas', icon: Brain, route: '/mapas-mentais' },
  { id: 'blog', label: 'Blog', sublabel: 'Artigos e análises jurídicas', icon: Newspaper, route: '/blog' },
  { id: 'dicionario', label: 'Dicionário', sublabel: 'Termos jurídicos explicados', icon: BookA, route: '/ferramentas/dicionario' },
];

const PRATICAR: Item[] = [
  { id: 'questoes', label: 'Questões', sublabel: 'Pratique e acompanhe o desempenho', icon: ListChecks, route: '/questoes' },
  { id: 'flashcards', label: 'Flashcards', sublabel: 'Memorização ativa e repetição', icon: Layers, route: '/flashcards' },
  { id: 'lei-seca', label: 'Lei Seca', sublabel: 'Treine o texto da lei por área', icon: Scale, route: '/lei-seca' },
];

const DesktopEstudosGrid = (_props: Props) => {
  const navigate = useNavigate();

  const renderGrid = (titulo: string, items: Item[]) => (
    <section>
      <p className="mb-3 flex items-center gap-2 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
        <span className="h-3 w-[2px] rounded-full bg-rose-500" />
        {titulo}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => navigate(it.route)}
              data-track-name={it.label}
              className="group flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-[#111114] hover:bg-[#151519] hover:border-white/[0.16] px-4 py-3.5 text-left transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:border-rose-500/30 group-hover:bg-rose-500/10 flex items-center justify-center shrink-0 transition-colors">
                <Icon className="h-4 w-4 text-zinc-300 group-hover:text-rose-400 transition-colors" strokeWidth={1.8} />
              </div>
              <span className="min-w-0">
                <span className="block truncate font-display text-sm font-semibold text-white transition-colors">
                  {it.label}
                </span>
                <span className="block truncate text-xs text-zinc-500 mt-0.5">
                  {it.sublabel}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="space-y-7">
      {renderGrid('Estudos', ESTUDOS)}
      {renderGrid('Praticar', PRATICAR)}
    </div>
  );
};

export default DesktopEstudosGrid;
