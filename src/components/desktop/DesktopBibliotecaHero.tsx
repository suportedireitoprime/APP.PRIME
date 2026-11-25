import { Search } from 'lucide-react';
import { useTotalLivrosCount } from '@/hooks/useTotalLivrosCount';

interface Props {
  typingHint?: string;
  onSearchClick?: () => void;
}

const DesktopBibliotecaHero = ({ typingHint = 'Procurar por autor, livro ou coleção...', onSearchClick }: Props) => {
  const { data: totalCount = 2000, isLoading } = useTotalLivrosCount();

  return (
    <div className="relative w-full overflow-hidden bg-[#0D0F12] border-b border-white/10">
      <div className="relative z-10 flex items-center px-12 xl:px-20 2xl:px-28 py-8">
        <div className="flex w-full items-center justify-between gap-12">
          <div className="flex-1 max-w-3xl space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="font-sans text-3xl xl:text-4xl font-semibold text-white tracking-tight">
                  Biblioteca Jurídica
                </h2>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/10 text-zinc-300 border border-white/10">
                  +{isLoading ? '...' : totalCount} livros
                </span>
              </div>
              <p className="text-zinc-400 text-sm xl:text-base leading-relaxed max-w-2xl">
                Acervo definitivo de obras, guias práticos, clássicos do Direito e coleções de desenvolvimento profissional.
              </p>
            </div>

            {/* Search bar */}
            <button
              type="button"
              onClick={onSearchClick}
              className="group relative w-full max-w-2xl flex items-center h-13 pl-4 pr-28 rounded-2xl bg-zinc-900/80 border border-white/10 hover:bg-zinc-900 hover:border-white/25 transition-colors text-left cursor-pointer"
            >
              <Search className="w-4 h-4 text-zinc-400 group-hover:text-white shrink-0 mr-3 transition-colors" />
              <span className="text-zinc-400 text-sm xl:text-base truncate">
                {typingHint}
              </span>
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl bg-white text-zinc-950 font-semibold text-xs flex items-center gap-2 group-hover:bg-zinc-200 transition-colors">
                Pesquisar
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopBibliotecaHero;
