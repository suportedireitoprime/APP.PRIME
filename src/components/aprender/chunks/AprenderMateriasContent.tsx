import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import MateriaRow from '@/components/aprender/MateriaRow';
import MateriaFlashcardsDeckSection from '@/components/aprender/MateriaFlashcardsDeckSection';
import MateriaAulasDeckSection from '@/components/aprender/MateriaAulasDeckSection';
import { prefetchAprenderArea } from '@/lib/aprenderAreaLoader';
import { areaIconFor } from './aprenderConstants';
import type { AprenderArea } from '@/types/aprender';
import type { ModuloItem } from '@/hooks/useAprenderAreaModulesMap';

interface AprenderMateriasContentProps {
  loading: boolean;
  areas: AprenderArea[];
  areasOrdenadas: AprenderArea[];
  filtro: 'todas' | 'andamento';
  isAulas: boolean;
  isFlashcards: boolean;
  aulasViewMode: 'decks' | 'lista';
  flashcardsViewMode: 'decks' | 'lista';
  flashAreas: Array<{ slug: string; total_cards: number; compreendidos: number }> | undefined;
  modulesMap: Map<string, ModuloItem[]>;
  uid: string | null;
}

export const AprenderMateriasContent: React.FC<AprenderMateriasContentProps> = memo(({
  loading,
  areas,
  areasOrdenadas,
  filtro,
  isAulas,
  isFlashcards,
  aulasViewMode,
  flashcardsViewMode,
  flashAreas,
  modulesMap,
  uid,
}) => {
  const navigate = useNavigate();

  if (loading && !areas.length) {
    return <div className="h-28 rounded-2xl bg-muted animate-pulse" />;
  }

  if (areasOrdenadas.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        <Sparkles className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        {filtro === 'andamento'
          ? 'Você ainda não começou nenhuma matéria.'
          : 'Nenhuma matéria disponível ainda.'}
      </div>
    );
  }

  // Visualização em Decks de Flashcards
  if (isFlashcards && flashcardsViewMode === 'decks') {
    return (
      <div className="space-y-4 sm:space-y-5 -mx-2 sm:mx-0">
        {areasOrdenadas.map((area) => {
          let overrideTotal = 0;
          let overrideConcluidas = 0;
          let overridePct = 0;

          if (flashAreas) {
            const flashStats = flashAreas.find((f) => f.slug === area.slug);
            if (flashStats) {
              overrideTotal = flashStats.total_cards;
              overrideConcluidas = flashStats.compreendidos;
              overridePct = overrideTotal > 0 ? Math.round((overrideConcluidas / overrideTotal) * 100) : 0;
            }
          }

          const areaModulos = modulesMap.get(area.id) || [];

          return (
            <MateriaFlashcardsDeckSection
              key={area.id}
              area={area}
              modulos={areaModulos}
              overrideTotal={overrideTotal}
              overrideConcluidas={overrideConcluidas}
              overridePct={overridePct}
              onOpenArea={() => navigate(`/aprender/area/${area.slug}?tab=flashcards`)}
              onOpenModulo={(mod) => navigate(`/aprender/area/${area.slug}?tab=flashcards&moduloId=${mod.id}`)}
            />
          );
        })}
      </div>
    );
  }

  // Visualização em Decks de Aulas (Formato 4:3 com Capas Ilustradas e Botão Play Glassmorphic)
  if (isAulas && aulasViewMode === 'decks') {
    return (
      <div className="space-y-4 sm:space-y-5 -mx-2 sm:mx-0">
        {areasOrdenadas.map((area) => {
          const areaModulos = modulesMap.get(area.id) || [];
          return (
            <MateriaAulasDeckSection
              key={area.id}
              area={area}
              modulos={areaModulos}
              overrideTotal={area.totalAulas}
              overrideConcluidas={area.concluidas}
              overridePct={area.pct ?? 0}
              onOpenArea={() => navigate(`/aprender/area/${area.slug}`)}
              onOpenModulo={(mod) => navigate(`/aprender/area/${area.slug}?moduloId=${mod.id}`)}
            />
          );
        })}
      </div>
    );
  }

  // Visualização padrão em Lista / Grid
  return (
    <motion.div 
      className="space-y-3"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } }
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
        {areasOrdenadas.map((area) => {
          const icon = areaIconFor(area.slug);

          const overrideLabel = isAulas ? 'aulas' : isFlashcards ? 'flashcards' : 'questões';
          const overrideTotal = isAulas ? area.totalAulas : 0;
          const overrideConcluidas = isAulas ? area.concluidas : 0;
          const overridePct = isAulas ? (area.pct ?? 0) : 0;

          let flashOverrideTotal = overrideTotal;
          let flashOverrideConcluidas = overrideConcluidas;
          let flashOverridePct = overridePct;

          if (isFlashcards && flashAreas) {
            const flashStats = flashAreas.find((f) => f.slug === area.slug);
            if (flashStats) {
              flashOverrideTotal = flashStats.total_cards;
              flashOverrideConcluidas = flashStats.compreendidos;
              flashOverridePct = flashOverrideTotal > 0 ? Math.round((flashOverrideConcluidas / flashOverrideTotal) * 100) : 0;
            }
          }

          return (
            <MateriaRow
              key={area.id}
              area={area}
              icon={icon}
              overrideLabel={overrideLabel}
              overrideTotal={isFlashcards ? flashOverrideTotal : overrideTotal}
              overrideConcluidas={isFlashcards ? flashOverrideConcluidas : overrideConcluidas}
              overridePct={isFlashcards ? flashOverridePct : overridePct}
              onOpen={() => {
                if (isAulas) {
                  navigate(`/aprender/area/${area.slug}`);
                } else if (isFlashcards) {
                  navigate(`/aprender/area/${area.slug}?tab=flashcards`);
                } else {
                  toast.info('Questões por trilha estarão disponíveis em breve!');
                }
              }}
              onPrefetch={() => prefetchAprenderArea(area.slug, uid)}
            />
          );
        })}
      </div>
    </motion.div>
  );
});

AprenderMateriasContent.displayName = 'AprenderMateriasContent';
