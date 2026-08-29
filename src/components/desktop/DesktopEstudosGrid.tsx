import { useNavigate } from 'react-router-dom';
import {
  Library, Video, NotebookPen, Headphones, Brain, BookA, Scale, ListChecks,
  type LucideIcon, Layers
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
  { id: 'biblioteca', label: 'Biblioteca', sublabel: 'Livros, clássicos e coleções', icon: Library, color: 'hsl(var(--primary))', route: '/bibliotecas' },
  { id: 'videoaulas', label: 'Videoaulas', sublabel: 'Aulas em vídeo por área', icon: Video, color: 'hsl(var(--primary))', route: '/videoaulas' },
  { id: 'audioaulas', label: 'Audioaulas', sublabel: 'Estude ouvindo, onde estiver', icon: Headphones, color: 'hsl(var(--primary))', route: '/audioaulas' },
  { id: 'resumos', label: 'Resumos', sublabel: 'Resumos jurídicos por tema', icon: NotebookPen, color: 'hsl(var(--primary))', route: '/resumos-juridicos' },
  { id: 'mapas', label: 'Mapas Mentais', sublabel: 'Mapas, infográficos e fluxogramas', icon: Brain, color: 'hsl(var(--primary))', route: '/assistente' },
  { id: 'lei-seca', label: 'Lei Seca', sublabel: 'Treine o texto da lei por área', icon: Scale, color: 'hsl(var(--primary))', route: '/lei-seca' },
  { id: 'dicionario', label: 'Dicionário', sublabel: 'Termos jurídicos explicados', icon: BookA, color: 'hsl(var(--primary))', route: '/ferramentas/dicionario' },
];

const PRATICAR: Item[] = [
  { id: 'questoes', label: 'Questões', sublabel: 'Pratique e acompanhe o desempenho', icon: ListChecks, color: '#e4e4e7', route: '/questoes' },
  { id: 'flashcards', label: 'Flashcards', sublabel: 'Memorização ativa e repetição', icon: Layers, color: '#e4e4e7', route: '/flashcards' },
];

const DesktopEstudosGrid = (_props: Props) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-7">
      <section>
        <p className="mb-3 flex items-center gap-3 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-3.5 w-[3px] rounded-full bg-primary" />
          Estudos
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ESTUDOS.map((it) => {
            const Icon = it.icon;
            const handleClick = () => {
              if (it.id === 'mapas' && _props.onChatClick) {
                _props.onChatClick();
              } else if (it.onClick) {
                it.onClick();
              } else if (it.route) {
                navigate(it.route);
              }
            };

            return (
              <button
                key={it.id}
                onClick={handleClick}
                data-track-name={it.label}
                className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-border bg-card px-6 py-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
              >
                <Icon
                  className="relative z-10 h-11 w-11 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: it.color }}
                  strokeWidth={1.6}
                />
                <span className="relative z-10 min-w-0">
                  <span className="block truncate font-display text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {it.label}
                  </span>
                  <span className="block truncate text-[13.5px] leading-tight text-muted-foreground mt-0.5">{it.sublabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className="mb-3 flex items-center gap-3 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-3.5 w-[3px] rounded-full bg-primary" />
          Praticar
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PRATICAR.map((it) => {
            const Icon = it.icon;
            const handleClick = () => {
              if (it.onClick) {
                it.onClick();
              } else if (it.route) {
                navigate(it.route);
              }
            };

            return (
              <button
                key={it.id}
                onClick={handleClick}
                data-track-name={it.label}
                className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-primary/20 bg-primary px-6 py-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
              >
                <Icon
                  className="relative z-10 h-11 w-11 shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ color: it.color }}
                  strokeWidth={1.6}
                />
                <span className="relative z-10 min-w-0">
                  <span className="block truncate font-display text-lg font-bold tracking-tight text-white transition-colors">
                    {it.label}
                  </span>
                  <span className="block truncate text-[13.5px] leading-tight text-zinc-300 mt-0.5">{it.sublabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DesktopEstudosGrid;
