import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Wand2, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Criacao3DPanelProps {
  onBack: () => void;
  onPlayScene?: (artigoId: number) => void;
}

export default function Criacao3DPanel({ onBack, onPlayScene }: Criacao3DPanelProps) {
  const [selectedArtigo, setSelectedArtigo] = useState<number | null>(null);

  // Array de artigos já gerados pela IA
  const generatedArticles = [1];

  // O Código Penal Brasileiro tem aproximadamente 359 artigos.
  const artigos = Array.from({ length: 359 }, (_, i) => i + 1);

  const handleGenerate = (artigo: number) => {
    // Aqui no futuro chamaremos o agente para construir o arquivo Three.js
    console.log(`Solicitação para gerar cena 3D do Artigo ${artigo}`);
    alert(`Preparando ambiente do agente para gerar a cena 3D do Artigo ${artigo}. A duração projetada será de 1 a 1,5 min.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-4 w-full relative"
    >
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-2">
            <Wand2 className="text-pink-500" />
            Criação 3D
          </h1>
          <p className="text-muted-foreground text-sm">
            Selecione o artigo do Código Penal para instruir a inteligência artificial a construir uma cena 100% Three.js.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {artigos.map((art) => {
          const isGenerated = generatedArticles.includes(art);
          return (
            <motion.button
              key={art}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => isGenerated ? onPlayScene?.(art) : setSelectedArtigo(art)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all shadow-sm group border ${
                isGenerated 
                  ? 'bg-pink-500/10 border-pink-500/50 hover:bg-pink-500/20' 
                  : 'bg-secondary/20 border-border/50 hover:border-pink-500/50'
              }`}
            >
              {isGenerated && <PlayCircle size={24} className="text-pink-400 mb-2 group-hover:scale-110 transition-transform" />}
              <span className={`font-medium transition-colors ${
                isGenerated ? 'text-pink-400' : 'text-muted-foreground group-hover:text-pink-400'
              }`}>
                Art. {art}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Modal / Overlay do Artigo Selecionado */}
      <AnimatePresence>
        {selectedArtigo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1c23] border border-border/50 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent pointer-events-none" />
              
              <button
                type="button"
                onClick={() => setSelectedArtigo(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-white bg-black/20 p-2 rounded-full transition-colors z-10"
              >
                <ArrowLeft size={18} className="rotate-180" />
              </button>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-6 shadow-inner">
                  {generatedArticles.includes(selectedArtigo) ? <PlayCircle size={32} /> : <Wand2 size={32} />}
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">
                  Artigo {selectedArtigo} do Código Penal
                </h2>
                
                {generatedArticles.includes(selectedArtigo) ? (
                  <>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                      Esta cena já foi gerada com sucesso pela inteligência artificial. Você pode reproduzi-la imediatamente no visualizador 3D.
                    </p>
                    <Button 
                      onClick={() => onPlayScene?.(selectedArtigo)}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-600/20 h-14 rounded-xl text-lg font-medium transition-all group"
                    >
                      <PlayCircle className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      Reproduzir Cena
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                      A inteligência artificial irá criar o arquivo Three.js do zero, 
                      estruturando o cel-shading, luzes volumétricas, animação de câmera e personagens, 
                      seguindo um roteiro explicativo e constante.
                    </p>

                    <div className="bg-black/30 border border-border/30 rounded-xl p-4 flex items-center gap-3 mb-8">
                      <Clock className="text-pink-400" size={20} />
                      <div className="text-sm">
                        <span className="block text-white font-medium">Duração Estimada da Cena</span>
                        <span className="text-muted-foreground">1 a 1,5 minutos</span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleGenerate(selectedArtigo)}
                      className="w-full bg-secondary hover:bg-secondary/80 text-white border border-border/50 h-14 rounded-xl text-lg font-medium transition-all group"
                    >
                      <Wand2 className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform text-pink-400" />
                      Pedir IA para gerar
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
