import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import DynamicSceneLoader from '@/components/laboratorio/DynamicSceneLoader';
import CenaArtigo37 from '@/components/laboratorio/cenas/CenaArtigo37';
import CenaArtigo4 from '@/components/laboratorio/cenas/CenaArtigo4';

function resolveCenaCurada(codigo_nome: string, artigo_numero: number | string) {
   // Normaliza o número do artigo caso venha como string
   const artNum = typeof artigo_numero === 'string' ? parseInt(artigo_numero.replace(/\D/g, ''), 10) : artigo_numero;

   if (codigo_nome === 'CP_CODIGO_PENAL' || codigo_nome === 'CP') {
      if (artNum === 37) return <CenaArtigo37 />;
      if (artNum === 4) return <CenaArtigo4 />; 
   }
   return null;
}

interface Cena3dFullscreenProps {
  open: boolean;
  codigo_nome: string;
  artigo_numero: number | string;
  onClose: () => void;
}

export default function Cena3dFullscreen({ open, codigo_nome, artigo_numero, onClose }: Cena3dFullscreenProps) {
  if (!open) return null;

  const curada = resolveCenaCurada(codigo_nome, artigo_numero);
  // Normaliza o número para passar para a Edge Function
  const artNum = typeof artigo_numero === 'string' ? parseInt(artigo_numero.replace(/\D/g, ''), 10) : artigo_numero;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[100000] bg-black"
      >
         <button onClick={onClose} className="absolute top-safe-mt-4 right-4 z-50 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 backdrop-blur-md border border-white/10" style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}>
            <X className="w-5 h-5" />
         </button>
         
         <div className="w-full h-full relative">
            {curada ? curada : (
                <DynamicSceneLoader codigo_nome={codigo_nome} artigo_numero={artNum} />
            )}
         </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
