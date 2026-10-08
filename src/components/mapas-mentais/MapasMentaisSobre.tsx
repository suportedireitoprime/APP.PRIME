import React from 'react';
import { Brain, Layers, GitBranch, Network } from 'lucide-react';
import { motion } from 'framer-motion';

const SOBRE_TIPOS = [
  {
    tipo: 'mapa_mental',
    titulo: 'Mapas Mentais',
    descricao: 'Apresenta as informações organizadas a partir de um núcleo central, irradiando tópicos secundários. Foca na hierarquia e conexão de conceitos-chave.',
    uso: 'Use para iniciar estudos de um tema amplo, ter uma visão panorâmica e fixar as ramificações de uma matéria.',
    cor: '#a855f7',
    Icone: Brain,
  },
  {
    tipo: 'infografico',
    titulo: 'Infográficos',
    descricao: 'Combina textos curtos, dados e elementos visuais ricos (ilustrações, ícones) para explicar conceitos, prazos ou estatísticas.',
    uso: 'Use para decorar prazos, listas, princípios e conceitos complexos através da memória fotográfica.',
    cor: '#f59e0b',
    Icone: Layers,
  },
  {
    tipo: 'fluxograma',
    titulo: 'Fluxogramas',
    descricao: 'Sequências de etapas lógicas demonstradas com setas e formas geométricas, revelando o fluxo de um processo passo a passo.',
    uso: 'Use essencialmente para entender processos judiciais, procedimentos administrativos e caminhos legais (ex: rito ordinário, licitação).',
    cor: '#22c55e',
    Icone: GitBranch,
  },
  {
    tipo: 'diagrama',
    titulo: 'Diagramas',
    descricao: 'Estruturas gráficas para comparar, diferenciar ou classificar elementos (como Diagramas de Venn, árvores de classificação, tabelas esquematizadas).',
    uso: 'Use para não confundir institutos semelhantes, memorizar exceções e cruzar regras conflitantes.',
    cor: '#8b5cf6',
    Icone: Network,
  },
];

export function MapasMentaisSobre() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 pb-20 space-y-6">
      <div className="mb-8">
        <h2 className="text-xl font-display font-black text-white uppercase tracking-wider mb-2">
          Guia de Esboços Visuais
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Nossa metodologia utiliza quatro tipos de esboços visuais distintos. Cada um tem um propósito específico para hackear seu aprendizado e acelerar a fixação. Saiba quando usar cada um:
        </p>
      </div>

      <div className="space-y-4">
        {SOBRE_TIPOS.map((item, idx) => {
          const { Icone, cor } = item;
          return (
            <motion.div
              key={item.tipo}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#141416] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden group"
            >
              {/* Brilho de fundo sutil */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 blur-2xl pointer-events-none transition-opacity group-hover:opacity-20"
                style={{ backgroundColor: cor }}
              />

              <div className="flex items-start gap-4 relative z-10">
                <div 
                  className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center border"
                  style={{ backgroundColor: `${cor}15`, borderColor: `${cor}30` }}
                >
                  <Icone className="w-6 h-6" style={{ color: cor }} strokeWidth={2} />
                </div>
                
                <div className="flex-1 space-y-2 pt-0.5">
                  <h3 className="font-bold text-white text-base">
                    {item.titulo}
                  </h3>
                  
                  <div className="space-y-2.5">
                    <p className="text-[13px] text-zinc-300 leading-snug">
                      {item.descricao}
                    </p>
                    
                    <div className="bg-black/30 rounded-lg p-2.5 border border-white/5">
                      <span className="block text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1">
                        🎯 Quando usar
                      </span>
                      <p className="text-[12px] text-zinc-200 leading-snug">
                        {item.uso}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
