import { motion, AnimatePresence } from 'framer-motion';
import GrafoArtigos from '@/pages/GrafoArtigos';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface GrafoOverlayProps {
  open: boolean;
  onClose: () => void;
  tabelaNome: string;
  leiNome?: string;
  artigoNumero?: string;
  artigoTexto?: string;
}

const GrafoOverlay = ({ open, onClose, tabelaNome, leiNome, artigoNumero, artigoTexto }: GrafoOverlayProps) => {
  useBodyScrollLock(open);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed inset-0 z-[10041] bg-background md:left-auto md:right-0 md:w-[min(46rem,96vw)] md:border-l md:border-border md:shadow-2xl"
        >
          <GrafoArtigos
            embedded
            tabelaNome={tabelaNome}
            leiNome={leiNome}
            artigoNumero={artigoNumero}
            artigoTexto={artigoTexto}
            onClose={onClose}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GrafoOverlay;
