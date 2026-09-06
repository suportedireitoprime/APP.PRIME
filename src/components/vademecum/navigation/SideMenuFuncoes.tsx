import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Layers, CheckSquare, Sparkles, Scale, Gavel, ScrollText,
  BookOpen, Library, FileText, Video, Headphones, Workflow, BookA, Bookmark,
  Presentation, Newspaper, Flame, Bot, BellRing, Compass, Music,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface SubItem {
  id: string;
  label: string;
  route: string;
  icon: React.ElementType;
}

interface FuncaoItem {
  id: string;
  label: string;
  icon: React.ElementType;
  route?: string;
  badge?: string;
  badgeColor?: string;
  isExpandable?: boolean;
  subItems?: SubItem[];
}

const FUNCOES: FuncaoItem[] = [
  { id: 'aprender', label: 'Aprender', icon: GraduationCap, route: '/aprender' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, route: '/flashcards' },
  { id: 'questoes', label: 'Questões', icon: CheckSquare, route: '/questoes' },
  { id: 'me-explique', label: 'Me Explique', icon: Sparkles, route: '/me-explique', badge: 'IA', badgeColor: 'bg-[#E11D48]/15 text-[#E11D48] border-[#E11D48]/30' },
  {
    id: 'legislacao',
    label: 'Legislação & Vade Mecum',
    icon: Scale,
    isExpandable: true,
    subItems: [
      { id: 'constituicao', label: 'Constituição Federal (CF/88)', route: '/legislacao/constituicao', icon: BookOpen },
      { id: 'vade-mecum', label: 'Vade Mecum Completo', route: '/vade-mecum', icon: Scale },
      { id: 'codigo-penal', label: 'Código Penal (CP)', route: '/legislacao/codigos/codigo-penal', icon: Gavel },
      { id: 'codigo-civil', label: 'Código Civil (CC)', route: '/legislacao/codigos/codigo-civil', icon: Gavel },
      { id: 'cpp', label: 'Processo Penal (CPP)', route: '/legislacao/codigos/codigo-de-processo-penal', icon: Gavel },
      { id: 'cpc', label: 'Processo Civil (CPC)', route: '/legislacao/codigos/codigo-de-processo-civil', icon: Gavel },
      { id: 'clt', label: 'CLT (Trabalhista)', route: '/legislacao/codigos/clt', icon: Gavel },
      { id: 'jurisprudencia', label: 'Súmulas & Jurisprudência', route: '/jurisprudencia', icon: ScrollText },
      { id: 'legislacao-estadual', label: 'Legislação Estadual', route: '/legislacao-estadual', icon: Compass },
    ],
  },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library, route: '/bibliotecas' },
  { id: 'resumos', label: 'Resumos Jurídicos', icon: FileText, route: '/resumos-juridicos' },
  { id: 'videoaulas', label: 'Videoaulas', icon: Video, route: '/videoaulas' },
  { id: 'audioaulas', label: 'Audioaulas', icon: Headphones, route: '/audioaulas' },
  { id: 'visuais', label: 'Mapas Mentais & Visuais', icon: Workflow, route: '/visuais', badge: 'Mapas', badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { id: 'dicionario', label: 'Dicionário Jurídico', icon: BookA, route: '/ferramentas/dicionario' },
  { id: 'lei-seca', label: 'Lei Seca', icon: Bookmark, route: '/lei-seca' },
  { id: 'apresentacoes', label: 'Apresentações', icon: Presentation, route: '/apresentacoes' },
  { id: 'blog', label: 'Blog Jurídico', icon: Newspaper, route: '/blog' },
  { id: 'pilulas', label: 'Pílulas do Conhecimento', icon: Flame, route: '/pilulas' },
  { id: 'assistente-horus', label: 'Assistente Hórus (Chat)', icon: Bot, route: '/assistente-horus', badge: 'IA', badgeColor: 'bg-[#E11D48]/15 text-[#E11D48] border-[#E11D48]/30' },
  { id: 'boletins', label: 'Boletins & Informativos', icon: BellRing, route: '/boletins' },
  { id: 'radar-360', label: 'Radar Legislativo 360', icon: Compass, route: '/radar-360' },
  { id: 'leis-cantadas', label: 'Leis Cantadas', icon: Music, route: '/leis-cantadas' },
];

interface SideMenuFuncoesProps {
  onNavigate: (route: string) => void;
}

export function SideMenuFuncoes({ onNavigate }: SideMenuFuncoesProps) {
  const [legislacaoAberta, setLegislacaoAberta] = useState(false);

  return (
    <div className="mb-3">
      <p className="px-3 pb-1.5 text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider">
        Funções
      </p>
      <div className="rounded-2xl bg-secondary/60 border border-border overflow-hidden divide-y divide-border/60">
        {FUNCOES.map((item) => {
          const Icon = item.icon;

          if (item.isExpandable) {
            return (
              <div key={item.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setLegislacaoAberta((prev) => !prev);
                  }}
                  aria-expanded={legislacaoAberta}
                  className="w-full flex items-center gap-3 px-4 py-[17px] text-left transition-colors hover:bg-secondary active:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  <Icon className="w-5 h-5 shrink-0 text-hero-panel" aria-hidden="true" />
                  <span className="font-body text-[15px] font-medium text-foreground/90 flex-1">{item.label}</span>
                  <motion.div
                    animate={{ rotate: legislacaoAberta ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="shrink-0"
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {legislacaoAberta && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden bg-background/50 border-t border-border/40 divide-y divide-border/30"
                    >
                      {item.subItems?.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              haptic.selection();
                              onNavigate(sub.route);
                            }}
                            className="w-full flex items-center gap-3 pl-8 pr-4 py-3 text-left transition-colors hover:bg-secondary/70 active:bg-muted/60"
                          >
                            <SubIcon className="w-4 h-4 shrink-0 text-muted-foreground" />
                            <span className="font-body text-[13.5px] text-foreground/80 flex-1">{sub.label}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                haptic.selection();
                if (item.route) onNavigate(item.route);
              }}
              className="w-full flex items-center gap-3 px-4 py-[17px] text-left transition-colors hover:bg-secondary active:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
              <Icon className="w-5 h-5 shrink-0 text-hero-panel" aria-hidden="true" />
              <span className="font-body text-[15px] font-medium text-foreground/90 flex-1">{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    item.badgeColor || 'bg-primary/10 text-primary border-primary/20'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
