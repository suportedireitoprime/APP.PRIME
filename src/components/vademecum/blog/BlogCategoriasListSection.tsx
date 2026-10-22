import React from 'react';
import {
  Scale,
  BookOpen,
  Landmark,
  Gavel,
  Briefcase,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { TEMAS, TEMA_COLORS, type BlogTema, type BlogPost } from '@/data/blogPosts';
import { haptic } from '@/lib/nativeHaptics';

interface BlogCategoriasListSectionProps {
  posts: BlogPost[];
  selectedCategory: string | null;
  onSelectCategory: (tema: BlogTema) => void;
}

// Mapeamento de ícones por categoria temática
function getCategoryIcon(tema: string) {
  const t = tema.toLowerCase();
  if (t.includes('stf') || t.includes('suprem')) return Landmark;
  if (t.includes('penal') || t.includes('crime')) return ShieldAlert;
  if (t.includes('trabalho') || t.includes('carreira')) return Briefcase;
  if (t.includes('filosofia') || t.includes('clássico')) return GraduationCap;
  if (t.includes('curiosidade')) return Sparkles;
  if (t.includes('processual') || t.includes('constitucional')) return Scale;
  if (t.includes('lei') || t.includes('norma')) return Gavel;
  return BookOpen;
}

export const BlogCategoriasListSection: React.FC<BlogCategoriasListSectionProps> = ({
  posts,
  selectedCategory,
  onSelectCategory,
}) => {
  const sortedTemas = [...TEMAS].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  return (
    <section className="w-full py-4 max-w-7xl mx-auto px-4">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary to-amber-600 flex items-center justify-center text-white shadow-md shadow-primary/20">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold font-display uppercase tracking-widest text-foreground">
              CATEGORIAS
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {sortedTemas.length} ÁREAS
            </span>
          </div>
        </div>
      </div>

      {/* Lista Vertical de Categorias */}
      <div className="flex flex-col gap-2">
        {sortedTemas.map((tema) => {
          const Icon = getCategoryIcon(tema);
          const c = TEMA_COLORS[tema] || { chip: '#444', chipText: '#fff' };
          const count = posts ? posts.filter((p) => p.tema === tema).length : 0;
          const isSelected = selectedCategory === tema;

          return (
            <button
              key={tema}
              onClick={() => {
                haptic.selection();
                onSelectCategory(tema);
              }}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group active:scale-[0.99] cursor-pointer ${
                isSelected
                  ? 'bg-primary/15 border-primary ring-1 ring-primary/40 shadow-sm'
                  : 'bg-card/70 hover:bg-card border-border/50 hover:border-border shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Ícone com a cor temática */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm"
                  style={{
                    backgroundColor: `${c.chip}20`,
                    color: c.chip,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-display font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
                    {tema}
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-body">
                    {count > 0
                      ? `${count} ${count === 1 ? 'artigo disponível' : 'artigos disponíveis'}`
                      : 'Artigos em produção'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {count > 0 && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      backgroundColor: `${c.chip}25`,
                      color: c.chip,
                    }}
                  >
                    {count}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
export default BlogCategoriasListSection;
