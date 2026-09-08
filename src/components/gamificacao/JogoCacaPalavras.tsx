import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Info, ArrowLeft } from 'lucide-react';
import type { GamificacaoCacaPalavras } from '@/types/gamificacao';

interface JogoCacaPalavrasProps {
  nivelData: GamificacaoCacaPalavras;
  onVenceu: () => void;
  onBack: () => void;
}

type Direction = [number, number];
const DIRECTIONS: Direction[] = [
  [0, 1], [1, 0], [1, 1], [-1, 1],
  [0, -1], [-1, 0], [-1, -1], [1, -1]
];

interface Cell {
  letter: string;
  row: number;
  col: number;
  partOfWords: string[];
}

export const JogoCacaPalavras: React.FC<JogoCacaPalavrasProps> = ({ nivelData, onVenceu, onBack }) => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [wordsToFind, setWordsToFind] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectionRange, setSelectionRange] = useState<{ start: [number, number] | null, current: [number, number] | null }>({ start: null, current: null });
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set()); // Para preview
  const [permanentlyHighlighted, setPermanentlyHighlighted] = useState<Set<string>>(new Set()); // Letras que formam as palavras já encontradas
  
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGame();
  }, [nivelData]);

  const initGame = () => {
    const dimMatch = nivelData.dimensoes_grade.match(/(\d+)x(\d+)/i);
    let rows = 10;
    let cols = 10;
    if (dimMatch) {
      rows = parseInt(dimMatch[1], 10);
      cols = parseInt(dimMatch[2], 10);
    }

    const words = nivelData.palavras.map(w => w.toUpperCase().replace(/\s/g, ''));
    setWordsToFind(words);
    setFoundWords([]);
    setPermanentlyHighlighted(new Set());
    setSelectionRange({ start: null, current: null });
    setSelectedCells(new Set());

    // Generate Grid
    let emptyGrid: Cell[][] = Array(rows).fill(null).map((_, r) => 
      Array(cols).fill(null).map((_, c) => ({ letter: '', row: r, col: c, partOfWords: [] }))
    );

    // Place words
    const placeWord = (word: string, gridState: Cell[][]): boolean => {
      // Tentar colocar a palavra várias vezes
      for (let attempt = 0; attempt < 200; attempt++) {
        const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const startR = Math.floor(Math.random() * rows);
        const startC = Math.floor(Math.random() * cols);

        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          const r = startR + dir[0] * i;
          const c = startC + dir[1] * i;
          if (r < 0 || r >= rows || c < 0 || c >= cols) {
            canPlace = false;
            break;
          }
          if (gridState[r][c].letter !== '' && gridState[r][c].letter !== word[i]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            const r = startR + dir[0] * i;
            const c = startC + dir[1] * i;
            gridState[r][c].letter = word[i];
            gridState[r][c].partOfWords.push(word);
          }
          return true;
        }
      }
      return false; // Falhou em colocar
    };

    // Copiando o array para mutar
    let currentGrid = [...emptyGrid];
    
    // Sort words by length descending so longer words are placed first (easier to fit)
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    
    sortedWords.forEach(word => {
      placeWord(word, currentGrid);
    });

    // Fill the rest with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (currentGrid[r][c].letter === '') {
          currentGrid[r][c].letter = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    setGrid(currentGrid);
  };

  // Lógica de touch e drag
  const getCellFromTouch = (e: TouchEvent | React.TouchEvent | MouseEvent | React.MouseEvent): [number, number] | null => {
    if (!gridRef.current) return null;
    let clientX, clientY;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const elem = document.elementFromPoint(clientX, clientY);
    if (!elem) return null;
    const r = elem.getAttribute('data-r');
    const c = elem.getAttribute('data-c');
    
    if (r !== null && c !== null) {
      return [parseInt(r, 10), parseInt(c, 10)];
    }
    return null;
  };

  const calculateLine = (start: [number, number], end: [number, number]): [number, number][] => {
    const dr = end[0] - start[0];
    const dc = end[1] - start[1];
    
    // Deve formar uma linha reta (horizontal, vertical ou diagonal)
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
      return []; // Linha inválida (não é reta/diagonal 45 graus)
    }

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    const line: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      line.push([start[0] + stepR * i, start[1] + stepC * i]);
    }
    return line;
  };

  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent) => {
    const cell = getCellFromTouch(e);
    if (cell) {
      setSelectionRange({ start: cell, current: cell });
      updateSelectedCells(cell, cell);
    }
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!selectionRange.start) return;
    const cell = getCellFromTouch(e);
    if (cell) {
      setSelectionRange(prev => ({ ...prev, current: cell }));
      updateSelectedCells(selectionRange.start, cell);
    }
  };

  const updateSelectedCells = (start: [number, number], current: [number, number]) => {
    const line = calculateLine(start, current);
    const newSet = new Set<string>();
    line.forEach(([r, c]) => newSet.add(`${r},${c}`));
    setSelectedCells(newSet);
  };

  const handlePointerUp = () => {
    if (selectionRange.start && selectionRange.current) {
      // Checar se a seleção forma uma palavra válida
      const line = calculateLine(selectionRange.start, selectionRange.current);
      if (line.length > 0) {
        let formedWord = '';
        let formedWordReverse = '';
        line.forEach(([r, c]) => {
          formedWord += grid[r][c].letter;
        });
        formedWordReverse = formedWord.split('').reverse().join('');

        let matchedWord = null;
        if (wordsToFind.includes(formedWord) && !foundWords.includes(formedWord)) {
          matchedWord = formedWord;
        } else if (wordsToFind.includes(formedWordReverse) && !foundWords.includes(formedWordReverse)) {
          matchedWord = formedWordReverse;
        }

        if (matchedWord) {
          // Palavra encontrada!
          const newFound = [...foundWords, matchedWord];
          setFoundWords(newFound);
          
          const newPermanent = new Set(permanentlyHighlighted);
          line.forEach(([r, c]) => newPermanent.add(`${r},${c}`));
          setPermanentlyHighlighted(newPermanent);

          // Verificar vitória
          if (newFound.length === wordsToFind.length) {
            setTimeout(() => {
              onVenceu();
            }, 800);
          }
        }
      }
    }
    
    setSelectionRange({ start: null, current: null });
    setSelectedCells(new Set());
  };

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto p-4 select-none touch-none">
      {/* Botão de Voltar */}
      <div className="w-full flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-zinc-400" />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">{nivelData.materia}</h2>
          <span className="text-sm text-zinc-400 uppercase tracking-widest">{nivelData.nivel} - {nivelData.titulo_nivel}</span>
        </div>
        <div className="w-12 h-12" /> {/* Spacer */}
      </div>

      <div className="flex flex-col gap-6 w-full items-center">
        
        {/* Palavras a encontrar (Tags) */}
        <div className="w-full bg-zinc-900/40 border border-zinc-800 p-4 md:p-6 rounded-3xl">
          <h3 className="text-white font-bold mb-4 flex items-center justify-center gap-2 uppercase tracking-wide text-sm md:text-base">
            <Info className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            Palavras ({foundWords.length}/{wordsToFind.length})
          </h3>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {wordsToFind.map((word, i) => {
              const found = foundWords.includes(word);
              return (
                <div 
                  key={i} 
                  className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl border text-xs md:text-sm font-black tracking-widest transition-all duration-300 ${
                    found 
                      ? 'bg-primary/20 border-primary/40 text-primary line-through' 
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-300'
                  }`}
                >
                  {word}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid do Caça-Palavras */}
        <div className="w-full max-w-[95vw] md:max-w-3xl flex justify-center bg-zinc-900/50 p-2 sm:p-4 md:p-8 rounded-3xl border border-zinc-800 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div 
            ref={gridRef}
            className="grid gap-[2px] sm:gap-1 md:gap-2 w-full aspect-square max-w-[100%] mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${grid.length > 0 ? grid[0].length : 10}, minmax(0, 1fr))`
            }}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            onMouseDown={handlePointerDown}
            onMouseMove={selectionRange.start ? handlePointerMove : undefined}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
          >
            {grid.map((row, r) => 
              row.map((cell, c) => {
                const key = `${r},${c}`;
                const isSelected = selectedCells.has(key);
                const isPermanent = permanentlyHighlighted.has(key);
                
                return (
                  <div 
                    key={key}
                    data-r={r}
                    data-c={c}
                    className={`
                      w-full h-full flex items-center justify-center 
                      text-[min(4vw,14px)] sm:text-base md:text-xl font-black rounded cursor-pointer transition-colors duration-150 select-none
                      ${isSelected ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/40 z-10 rounded-md' : 
                        isPermanent ? 'bg-primary/30 text-white border border-primary/50' : 
                        'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'}
                    `}
                  >
                    {cell.letter}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
