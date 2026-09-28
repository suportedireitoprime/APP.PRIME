const fs = require('fs');
const file = 'C:/Users/ext_wpereira/OneDrive - Vitamina Work Life S.A/Documentos/APP.PRIME/src/components/resumos/ResumosHero.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace lucide-react import
content = content.replace(
  "import { ArrowLeft, Search, NotebookText, ChevronRight, Brain } from 'lucide-react';",
  "import { ArrowLeft, Search, NotebookText, ChevronRight, Brain, Scale, PenTool, BookText } from 'lucide-react';"
);

// Replace the image object-center to shifted right, and insert the orbiting elements
const oldImageBlock = `      {/* Imagem de Fundo */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img 
          src="/resumos-philosopher.jpg" 
          alt=""
          className="w-full h-full object-cover opacity-90 object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>`;

const newImageBlock = `      {/* Imagem de Fundo */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img 
          src="/resumos-philosopher.jpg" 
          alt=""
          className="w-full h-full object-cover opacity-90 object-[75%_center] sm:object-[70%_center] md:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>

      {/* 3 Icones Vazados Orbitando à Direita */}
      <div className="absolute right-[-10px] sm:right-10 top-[40%] sm:top-[45%] -translate-y-1/2 w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] pointer-events-none z-[2]">
        {[
          { Icon: Scale, color: '#facc15', glow: 'rgba(250,204,21,0.6)' },
          { Icon: PenTool, color: '#38bdf8', glow: 'rgba(56,189,248,0.6)' },
          { Icon: BookText, color: '#a78bfa', glow: 'rgba(167,139,250,0.6)' }
        ].map((item, i) => {
          const delay = i * 4.6;
          const { Icon } = item;
          return (
            <motion.div
              key={i}
              className="absolute w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center"
              animate={{
                x: [
                  100 * Math.cos(0),
                  100 * Math.cos((2 * Math.PI) / 3),
                  100 * Math.cos((4 * Math.PI) / 3),
                  100 * Math.cos(2 * Math.PI),
                ],
                y: [
                  42 * Math.sin(0),
                  42 * Math.sin((2 * Math.PI) / 3),
                  42 * Math.sin((4 * Math.PI) / 3),
                  42 * Math.sin(2 * Math.PI),
                ],
                scale: [1, 0.72, 1.15, 1],
                opacity: [0.92, 0.5, 1, 0.92],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: 'linear',
                delay: -delay,
              }}
              style={{
                left: '50%',
                top: '50%',
                marginLeft: -24,
                marginTop: -24,
              }}
            >
              <Icon 
                className="w-full h-full drop-shadow-xl" 
                style={{ color: item.color, filter: \`drop-shadow(0 0 10px \${item.glow})\` }} 
                strokeWidth={1.5}
              />
            </motion.div>
          );
        })}
      </div>`;

content = content.replace(oldImageBlock, newImageBlock);

fs.writeFileSync(file, content);
console.log('Script executed');
