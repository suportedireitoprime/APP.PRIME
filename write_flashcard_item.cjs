const fs = require('fs');

const path = 'src/pages/FlashcardsArea.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('FlashcardDeckItem') && l.includes('key={item.key}'));
let endIndex = startIndex;
if (startIndex !== -1) {
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].includes('/>')) {
      endIndex = i;
      break;
    }
  }
} else {
  console.log("Could not find FlashcardDeckItem in FlashcardsArea.tsx! Using git checkout.");
}

const componentStr = `import React, { memo } from 'react';
import { Layers, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FlashcardDeckItem = memo(({ item, i, palette, isLast, coverUrl }: any) => {
  const isLeft = i % 2 === 0;
  return (
    <div className="w-full flex flex-col">
      {/* Linha do Card em Zigue-Zague com Card e Título no Lado Oposto Conectado por Linha Fina */}
      <div
        className={cn(
          "relative z-10 flex w-full items-center justify-between gap-2 xs:gap-3 sm:gap-6 md:gap-8 px-2 sm:px-6 md:px-10 max-w-3xl lg:max-w-4xl mx-auto group",
          isLeft ? "flex-row" : "flex-row-reverse"
        )}
      >
        {/* ── CONJUNTO DE 3 CARTAS EM FORMATO DE DECK ABERTO EM LEQUE COM ALTURA NIVELADA ── */}
        <div
          onClick={item.onClick}
          onPointerEnter={item.onPrefetch}
          onTouchStart={item.onPrefetch}
          className="relative shrink-0 w-[140px] xs:w-[155px] sm:w-[185px] md:w-[210px] h-[215px] xs:h-[235px] sm:h-[265px] md:h-[290px] cursor-pointer select-none transition-transform duration-300 active:scale-[0.97] hover:-translate-y-1.5"
        >
          {/* Medalhão de Milestone / Nó da Trilha Centralizado no Topo (Estável e Elegante) */}
          <div
            className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center rounded-full w-8 h-8 sm:w-8.5 sm:h-8.5 border-2 border-white/70 text-white font-bold text-xs shadow-xl transition-transform duration-300 group-hover:scale-110"
            style={{
              backgroundColor: palette.primary,
              boxShadow: palette.nodeBoxShadow,
            }}
          >
            <span className="font-sans font-bold text-[11px] sm:text-xs">
              {item.ordemStr}
            </span>
          </div>

          {/* ── CARTA 1 (Traseira/Fundo - Menor e mais escura) ── */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl border border-white/10 opacity-40 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
              isLeft
                ? "scale-[0.88] rotate-[6deg] translate-x-3 sm:translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:rotate-[8deg] group-hover:translate-x-5 group-hover:-translate-y-3"
                : "scale-[0.88] -rotate-[6deg] -translate-x-3 sm:-translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:-rotate-[8deg] group-hover:-translate-x-5 group-hover:-translate-y-3"
            )}
            style={{
              background: palette.cardGradient,
              boxShadow: \`0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)\`,
            }}
          >
            {/* Overlay de escurecimento para dar profundidade (Carta mais ao fundo) */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />
            
            <div className="absolute inset-1.5 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden z-[2]">
              <div
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                style={{ borderColor: palette.primary }}
              >
                <Layers className="w-4 h-4 text-white/60" />
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
            </div>
          </div>

          {/* ── CARTA 2 (Meio - Tamanho intermediário) ── */}
          <div
            className={cn(
              "absolute inset-0 rounded-2xl border border-white/15 opacity-75 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
              isLeft
                ? "scale-[0.94] rotate-[3deg] translate-x-1.5 sm:translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:rotate-[4deg] group-hover:translate-x-3 group-hover:-translate-y-2"
                : "scale-[0.94] -rotate-[3deg] -translate-x-1.5 sm:-translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:-rotate-[4deg] group-hover:-translate-x-3 group-hover:-translate-y-2"
            )}
            style={{
              background: palette.cardGradient,
              boxShadow: \`0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)\`,
            }}
          >
            {/* Overlay de escurecimento médio para dar profundidade */}
            <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />

            <div className="absolute inset-1.5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden z-[2]">
              <div
                className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                style={{ borderColor: palette.primary }}
              >
                <Layers className="w-4 h-4 text-white/60" />
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
            </div>
          </div>

          {/* ── CARTA 3 (Principal Frontal - Centro Estável) ── */}
          <div
            className={cn(
              "relative w-full h-full p-2.5 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border border-white/30 hover:border-amber-400/60 transition-all duration-300 origin-bottom",
              isLeft
                ? "group-hover:-rotate-[1deg] group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]"
                : "group-hover:rotate-[1deg] group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]"
            )}
            style={{
              background: palette.cardGradient,
              boxShadow: palette.shadow,
            }}
          >
            {/* Brilho reflexivo sutil no hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />

            {/* Moldura Interna Chanfrada de Carta de Baralho */}
            <div className="absolute inset-1 rounded-[14px] border border-white/15 pointer-events-none z-10" />

            {/* Efeito de Brilho e Acabamento Laminado da Carta */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-10" />

            {/* Imagem de Fundo (Capa da Matéria Expandida e Original) */}
            <img
              src={coverUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              className="pointer-events-none absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 select-none"
            />
            {/* Overlay para Contraste do Topo e Rodapé, mantendo o centro limpo para a ilustração */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12]/90 via-black/10 to-[#0d0f12]/50 pointer-events-none z-0" />

            {/* Cabeçalho da Carta: Tag Deck no Lado Esquerdo */}
            <div className="flex items-center justify-start z-[1] w-full pt-1">
              <span className="inline-flex items-center text-[9.5px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-md bg-black/50 text-white/95 border border-white/20 shadow-sm whitespace-nowrap">
                <span>{item.badgeLabel}</span>
              </span>
            </div>

            {/* Centro da Carta: Ícone de Player (Destaque Elegante para Iniciar o Deck) */}
            <div className="my-auto py-2 z-[1] w-full flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                {/* Pulso luminoso no hover */}
                <div
                  className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-125 pointer-events-none"
                  style={{ backgroundColor: \`\${palette.primary}50\` }}
                />

                {/* Botão de Play Minimalista e Moderno */}
                <div
                  className="relative w-10 h-10 xs:w-11 xs:h-11 sm:w-13 sm:h-13 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center text-white/90 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:border-amber-300 group-hover:bg-amber-500 group-hover:text-black group-hover:shadow-[0_0_22px_rgba(245,158,11,0.6)]"
                >
                  <Play className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 fill-current translate-x-0.5 transition-colors" />
                </div>
              </div>
            </div>

            {/* Rodapé da Carta: Progresso e Estatísticas */}
            <div className="z-[1] pt-1.5 sm:pt-2 border-t border-white/20 w-full px-0.5">
              <div>
                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-normal text-white/95 mb-1 sm:mb-1.5">
                  <span className="truncate">
                    {item.displayConcluidas > 0
                      ? \`\${item.displayConcluidas}/\${item.displayTotal} concluídos\`
                      : \`\${item.displayTotal} \${item.displayLabel}\`}
                  </span>
                  <span className="font-semibold font-sans ml-1">{item.displayPct}%</span>
                </div>
                <div className="w-full bg-black/50 h-1.5 sm:h-2 rounded-full overflow-hidden border border-white/20">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: \`\${Math.max(item.displayPct, item.displayTotal > 0 ? 8 : 0)}%\`,
                      backgroundColor: palette.primary,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── LINHA FINA CONECTORA E TÍTULO NO LADO OPOSTO ── */}
        <div
          onClick={item.onClick}
          onPointerEnter={item.onPrefetch}
          onTouchStart={item.onPrefetch}
          className={cn(
            "flex-1 min-w-0 flex items-center cursor-pointer select-none py-2 transition-all",
            isLeft
              ? "flex-row pl-1.5 xs:pl-2 sm:pl-3"
              : "flex-row-reverse pr-1.5 xs:pr-2 sm:pr-3"
          )}
        >
          {/* Linha Fina Conectora com Degradê */}
          <div
            className={cn(
              "flex items-center shrink-0 w-6 xs:w-8 sm:w-12 md:w-16",
              isLeft ? "flex-row" : "flex-row-reverse"
            )}
          >
            {/* Ponto de Ancoragem na Lateral do Card */}
            <div
              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white/70 shrink-0 transition-transform duration-300 group-hover:scale-125"
              style={{
                backgroundColor: palette.primary,
                boxShadow: \`0 0 8px \${palette.primary}\`,
              }}
            />
            {/* Linha Fina */}
            <div
              className="flex-1 h-[1px] transition-all duration-300 group-hover:h-[1.5px]"
              style={{
                background: isLeft
                  ? \`linear-gradient(to right, \${palette.primary}, rgba(255,255,255,0.3), transparent)\`
                  : \`linear-gradient(to left, \${palette.primary}, rgba(255,255,255,0.3), transparent)\`,
              }}
            />
          </div>

          {/* Nome do Card em Letras Finas (Conforme Solicitado) */}
          <div
            className={cn(
              "flex-1 min-w-0 flex flex-col justify-center px-1.5 xs:px-2.5 sm:px-4 transition-transform duration-300 group-hover:-translate-y-0.5",
              isLeft ? "items-start text-left" : "items-end text-right"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-1.5 mb-1 opacity-80",
                isLeft ? "justify-start" : "justify-end"
              )}
            >
              <span
                className="text-[9.5px] sm:text-[11px] font-normal uppercase tracking-wider"
                style={{ color: palette.primary }}
              >
                {item.badgeLabel}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/25" />
              <span className="text-[9.5px] sm:text-[11px] font-light text-zinc-400">
                {item.displayTotal} flashcards
              </span>
            </div>

            <h3 className="font-sans font-light text-[13.5px] xs:text-[15px] sm:text-[17px] md:text-[19px] lg:text-[20px] leading-snug break-words text-zinc-100 group-hover:text-amber-200 transition-colors drop-shadow-sm line-clamp-3 sm:line-clamp-4">
              {item.titulo}
            </h3>
          </div>
        </div>
      </div>

      {/* Conector Serpenteante de Trilha em Zigue-Zague Conectando Suavemente de Deck a Deck */}
      {!isLast && (
        <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto h-16 sm:h-20 -my-1.5 sm:-my-2 pointer-events-none z-[5] overflow-visible">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id={\`trail-glow-\${i}\`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Leito da Trilha (traço suave e discreto) */}
            <path
              d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="4"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {/* Linha da Trilha em Zigue-Zague Pontilhada Luminosa */}
            <path
              d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
              fill="none"
              stroke={palette.primary}
              strokeWidth="2.5"
              strokeDasharray="5 7"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter={\`url(#trail-glow-\${i})\`}
            />
          </svg>

          {/* Passos / Checkpoints Esféricos Perfeitos (Apenas a central branca) */}
          <div
            className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-white/70 bg-white shadow-lg"
            style={{
              left: '50%',
              top: '50%',
              boxShadow: \`0 0 10px \${palette.primary}\`,
            }}
          />
        </div>
      )}
    </div>
  );
});
`
fs.writeFileSync('src/components/flashcards/FlashcardDeckItem.tsx', componentStr);
console.log('Successfully wrote exact FlashcardDeckItem.tsx');
