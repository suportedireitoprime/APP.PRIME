import { useNavigate } from 'react-router-dom';
import {
  Library, Scale, FileUp, Gauge,
  type LucideIcon, BookA
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
  onScrollToAcervo?: () => void;
  onUploadPdf?: () => void;
}

const DesktopBibliotecaGrid = ({ onScrollToAcervo, onUploadPdf }: Props) => {
  const navigate = useNavigate();

  const ITEMS: Item[] = [
    { 
      id: 'colecoes', 
      label: 'Coleções', 
      sublabel: 'Explore todo o acervo jurídico', 
      icon: Library, 
      color: 'hsl(var(--primary))', 
      onClick: onScrollToAcervo 
    },
    { 
      id: 'classicos', 
      label: 'Clássicos do Direito', 
      sublabel: 'Obras fundamentais', 
      icon: Scale, 
      color: 'hsl(var(--primary))', 
      route: '/bibliotecas/classicos-do-direito' 
    },
    { 
      id: 'pdfs', 
      label: 'PDFs Personalizados', 
      sublabel: 'Seus próprios materiais', 
      icon: FileUp, 
      color: 'hsl(var(--primary))', 
      onClick: onUploadPdf 
    },
    { 
      id: 'performance', 
      label: 'Performance', 
      sublabel: 'Oratória, liderança e mais', 
      icon: Gauge, 
      color: '#e4e4e7', // Cinza para contrastar
      route: '/bibliotecas?aba=performance' 
    },
  ];

  return (
    <section>
      <p className="mb-3 flex items-center gap-3 font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span className="h-3.5 w-[3px] rounded-full bg-primary" />
        Atalhos da Biblioteca
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {ITEMS.map((it) => {
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
              data-track-name={`biblioteca_${it.id}`}
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
  );
};

export default DesktopBibliotecaGrid;
