import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import {
  FlipFlashcards,
  QuestoesRunner,
  MapaMentalCanvas,
  TermosViewer,
  ShareSheet,
  type Flashcard,
  type Questao,
  type MapaNode,
  type Termo,
} from '@/components/chat/ChatArtifacts';
import PremiumGate, { type PremiumFeatureKey } from '@/components/PremiumGate';
import { Artifact } from './assistenteTypes';

interface AssistenteArtifactModalsProps {
  genOverlay: null | {
    kind: 'pdf' | 'flashcards' | 'questoes' | 'mapa' | 'termos';
    label: string;
  };
  activeArtifact: Artifact | null;
  setActiveArtifact: (art: Artifact | null) => void;
  shareText: string | null;
  setShareText: (txt: string | null) => void;
  gateFeature: PremiumFeatureKey | null;
  setGateFeature: (f: PremiumFeatureKey | null) => void;
}

export const AssistenteArtifactModals: React.FC<AssistenteArtifactModalsProps> = ({
  genOverlay,
  activeArtifact,
  setActiveArtifact,
  shareText,
  setShareText,
  gateFeature,
  setGateFeature,
}) => {
  return (
    <>
      {/* Generation card overlay */}
      <AnimatePresence>
        {genOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ rotateY: 0, scale: 0.85, opacity: 0 }}
              animate={{ rotateY: 360, scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut', repeat: Infinity }}
              className="w-40 h-56 rounded-3xl bg-gradient-to-br from-accent via-primary to-accent shadow-2xl flex items-center justify-center"
            >
              <Sparkles className="w-12 h-12 text-accent-foreground" />
            </motion.div>
            <p className="absolute bottom-[35%] font-display text-lg font-bold text-white">
              {genOverlay.label}…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Artifact viewers */}
      <AnimatePresence>
        {activeArtifact?.kind === 'flashcards' && (
          <FlipFlashcards
            cards={(activeArtifact.data.cards || []) as Flashcard[]}
            onClose={() => setActiveArtifact(null)}
          />
        )}
        {activeArtifact?.kind === 'questoes' && (
          <QuestoesRunner
            questoes={(activeArtifact.data.questoes || []) as Questao[]}
            onClose={() => setActiveArtifact(null)}
          />
        )}
        {activeArtifact?.kind === 'mapa' && (
          <MapaMentalCanvas
            data={activeArtifact.data as MapaNode}
            onClose={() => setActiveArtifact(null)}
          />
        )}
        {activeArtifact?.kind === 'termos' && (
          <TermosViewer
            termos={(activeArtifact.data.termos || []) as Termo[]}
            onClose={() => setActiveArtifact(null)}
          />
        )}
        {shareText && <ShareSheet text={shareText} onClose={() => setShareText(null)} />}
      </AnimatePresence>

      <PremiumGate
        open={!!gateFeature}
        onClose={() => setGateFeature(null)}
        feature={gateFeature ?? 'chat_juridico'}
        usageLabel={
          gateFeature === 'chat_juridico'
            ? 'Você já usou sua interação gratuita de hoje'
            : undefined
        }
      />
    </>
  );
};
