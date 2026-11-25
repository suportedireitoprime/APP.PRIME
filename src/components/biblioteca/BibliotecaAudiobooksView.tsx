import React, { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Headphones, Clock, ChevronRight } from 'lucide-react';
import { AUDIOBOOKS_CATALOGO_META } from '@/data/audiobooksMeta';
import { directImg } from '@/lib/cdnImg';
import { haptic } from '@/lib/nativeHaptics';
import bibliotecaCoverImg from '@/assets/biblioteca-cover.webp';

export const BibliotecaAudiobooksView: React.FC = memo(() => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return AUDIOBOOKS_CATALOGO_META;
    return AUDIOBOOKS_CATALOGO_META.filter((item) => {
      const hay = `${item.titulo} ${item.autor} ${item.subtitulo || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [search]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-sans text-zinc-400 text-xs font-semibold uppercase tracking-widest truncate">
          Audiobooks Jurídicos
        </h2>
        <span className="text-xs text-zinc-500 font-mono">
          {filtered.length} {filtered.length === 1 ? 'obra' : 'obras'}
        </span>
      </div>

      {/* Campo de Busca Minimalista */}
      <div className="relative group">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-white" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar audiobook por título ou autor…"
          className="w-full pl-10 pr-10 h-12 text-sm rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lista Minimalista de Audiobooks */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="py-14 text-center text-zinc-400 text-sm bg-zinc-900/50 border border-white/10 rounded-2xl px-4">
            <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <Headphones className="w-5 h-5" />
            </div>
            <p className="font-medium text-white">Nenhum audiobook encontrado para "{search}".</p>
          </div>
        ) : (
          filtered.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => {
                haptic.selection();
                navigate(`/audiobooks?livro=${encodeURIComponent(item.id)}`);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  haptic.selection();
                  navigate(`/audiobooks?livro=${encodeURIComponent(item.id)}`);
                }
              }}
              aria-label={`Ouvir audiobook ${item.titulo} de ${item.autor}`}
              className="group flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/75 hover:bg-zinc-800/80 border border-white/10 hover:border-white/20 transition-all cursor-pointer select-none text-left w-full active:scale-[0.99]"
            >
              <div className="relative w-[68px] sm:w-[76px] aspect-[3/4.2] rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shrink-0">
                <img
                  src={item.capaUrl ? directImg(item.capaUrl, 240) : bibliotecaCoverImg}
                  alt={item.titulo}
                  loading={idx < 6 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = bibliotecaCoverImg;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-rose-300">
                      Audiobook
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 inline-flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {item.duracaoTotalFormatada || `${item.totalCapitulos} caps`}
                    </span>
                  </div>

                  <p className="font-sans text-white text-sm sm:text-[15px] font-semibold leading-snug line-clamp-2">
                    {item.titulo}
                  </p>

                  {item.autor && (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {item.autor}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-200 group-hover:text-zinc-950 px-3 py-1 rounded-full bg-white/10 group-hover:bg-white transition-colors">
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Ouvir</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
});

BibliotecaAudiobooksView.displayName = 'BibliotecaAudiobooksView';
