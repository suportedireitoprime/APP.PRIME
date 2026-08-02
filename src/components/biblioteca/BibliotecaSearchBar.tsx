import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import BibliotecaBuscaOverlay from './BibliotecaBuscaOverlay';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';

const PLACEHOLDERS = [
  'Procure um livro…',
  'Procure um autor…',
  'Procure uma área do direito…',
  'Ex.: Constituição, Kelsen, Penal…',
  'Descubra um clássico do direito…',
];

function useTypingPlaceholder(active: boolean) {
  const [text, setText] = useState('');
  const idxRef = useRef(0);
  const charRef = useRef(0);
  const deletingRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = PLACEHOLDERS[idxRef.current];
      if (!deletingRef.current) {
        charRef.current += 1;
        setText(current.slice(0, charRef.current));
        if (charRef.current >= current.length) {
          deletingRef.current = true;
          timeout = setTimeout(tick, 1600);
          return;
        }
        timeout = setTimeout(tick, 55);
      } else {
        charRef.current -= 1;
        setText(current.slice(0, charRef.current));
        if (charRef.current <= 0) {
          deletingRef.current = false;
          idxRef.current = (idxRef.current + 1) % PLACEHOLDERS.length;
          timeout = setTimeout(tick, 400);
          return;
        }
        timeout = setTimeout(tick, 25);
      }
    };
    timeout = setTimeout(tick, 400);
    return () => clearTimeout(timeout);
  }, [active]);

  return text;
}

interface Props {
  onAbrirLivro: (livro: LivroNormalizado) => void;
}

/**
 * Barra de busca da Biblioteca — mesmo padrão do Vade Mecum:
 * é um botão que abre o overlay de pesquisa (com voz e abas).
 */
export default function BibliotecaSearchBar({ onAbrirLivro }: Props) {
  const [open, setOpen] = useState(false);
  const typing = useTypingPlaceholder(!open);

  return (
    <div className="px-4 mb-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Pesquisar na biblioteca"
        className="relative w-full flex items-center h-16 pl-14 pr-[112px] rounded-2xl bg-black/45 backdrop-blur-md border border-primary/40 shadow-lg shadow-black/30 active:scale-[0.99] transition search-bar-shine"
      >
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white shrink-0"
          strokeWidth={2.2}
        />
        <span className="relative z-[2] font-body text-white/70 text-[15px] font-medium truncate text-left">
          {typing || 'Procure um livro…'}
        </span>
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-hero-panel text-white font-display text-[13px] font-bold tracking-wider flex items-center justify-center shadow-md">
          PESQUISAR
        </div>
      </button>

      <BibliotecaBuscaOverlay
        open={open}
        onClose={() => setOpen(false)}
        onAbrirLivro={onAbrirLivro}
      />
    </div>
  );
}
