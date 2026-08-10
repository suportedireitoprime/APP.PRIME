import { useNavigate } from 'react-router-dom';
import {
  Library, Video, NotebookPen, Headphones, Brain, BookA, Scale, ListChecks,
  type LucideIcon,
} from 'lucide-react';

interface Item {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  color: string;
  route?: string;
  onClick?: () => void;
}

interface Props {
  onChatClick?: () => void;
  onFerramentasClick?: () => void;
}

const ESTUDOS: Item[] = [
  { id: 'biblioteca', label: 'Biblioteca', sublabel: 'Livros, clássicos e coleções', icon: Library, color: '#E3262F', route: '/bibliotecas' },
  { id: 'videoaulas', label: 'Videoaulas', sublabel: 'Aulas em vídeo por área', icon: Video, color: '#E3262F', route: '/videoaulas' },
  { id: 'audioaulas', label: 'Audioaulas', sublabel: 'Estude ouvindo, onde estiver', icon: Headphones, color: '#E3262F', route: '/audioaulas' },
  { id: 'resumos', label: 'Resumos', sublabel: 'Resumos jurídicos por tema', icon: NotebookPen, color: '#E3262F', route: '/resumos-juridicos' },
  { id: 'mapas', label: 'Mapas Mentais', sublabel: 'Mapas, infográficos e fluxogramas', icon: Brain, color: '#E3262F', route: '/assistente' },
  { id: 'questoes', label: 'Questões', sublabel: 'Pratique e acompanhe o desempenho', icon: ListChecks, color: '#E3262F', route: '/questoes' },
  { id: 'lei-seca', label: 'Lei Seca', sublabel: 'Treine o texto da lei por área', icon: Scale, color: '#E3262F', route: '/lei-seca' },
  { id: 'dicionario', label: 'Dicionário', sublabel: 'Termos jurídicos explicados', icon: BookA, color: '#E3262F', route: '/ferramentas/dicionario' },
];

const DesktopEstudosGrid = (_props: Props) => {
  const navigate = useNavigate();

  const Card = ({ it }: { it: Item }) => {
    const Icon = it.icon;
    return (
      <button
        onClick={() => (it.onClick ? it.onClick() : it.route && navigate(it.route))}
        data-track-name={it.label}
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-border bg-card px-5 py-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
      >
        <Icon
          className="relative z-10 h-9 w-9 shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ color: it.color }}
          strokeWidth={1.6}
        />
        <span className="relative z-10 min-w-0">
          <span className="block truncate font-display text-[15px] font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {it.label}
          </span>
          <span className="block truncate text-[12.5px] leading-tight text-muted-foreground">{it.sublabel}</span>
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-7">
      <section>
        <p className="mb-3 flex items-center gap-3 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-3.5 w-[3px] rounded-full bg-primary" />
          Estudos
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ESTUDOS.map((it) => <Card key={it.id} it={it} />)}
        </div>
      </section>
    </div>
  );
};

export default DesktopEstudosGrid;
