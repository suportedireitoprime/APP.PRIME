import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  BookOpen,
  Search,
  Sparkles,
  Clock,
  Check,
  Headphones,
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import {
  AUDIOBOOKS_CATALOGO,
  AudiobookLivro,
} from '@/data/audiobooksCatalogo';
import {
  hasResumoDisponivel,
  getResumoForLivro,
  AUDIOBOOKS_RESUMOS_MAP,
} from '@/data/audiobooksResumosMap';
import { audiobooksTracking } from '@/lib/audiobooksTracking';

interface AudiobooksTrilhaResumosProps {
  onPlayResumo: (livro: AudiobookLivro, capituloIndex?: number) => void;
  onSelectLivro?: (livro: AudiobookLivro) => void;
}

export const AudiobooksTrilhaResumos: React.FC<AudiobooksTrilhaResumosProps> = ({
  onPlayResumo,
  onSelectLivro,
}) => {
  const [busca, setBusca] = useState('');
  const [lidosManual, setLidosManual] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('audiobooks_resumos_concluidos');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleConcluido = (slug: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic.impact();
    setLidosManual((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      try {
        localStorage.setItem('audiobooks_resumos_concluidos', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Monta a lista completa de livros da trilha a partir do catálogo e mapa de resumos
  const livrosTrilha = useMemo(() => {
    const list: {
      livro: AudiobookLivro;
      slug: string;
      duracao: string;
      descricao: string;
    }[] = [];

    const handledSlugs = new Set<string>();

    // 1. Livros do catálogo oficial que têm resumo
    AUDIOBOOKS_CATALOGO.forEach((livro) => {
      if (hasResumoDisponivel(livro)) {
        const resumoInfo = getResumoForLivro(livro);
        const slug = resumoInfo?.slug || livro.id;
        if (!handledSlugs.has(slug)) {
          handledSlugs.add(slug);
          list.push({
            livro,
            slug,
            duracao: resumoInfo?.duracaoFormatada || livro.duracaoTotalFormatada || '~35 min',
            descricao: resumoInfo?.descricao || livro.descricao || 'Resumo analítico aprofundado.',
          });
        }
      }
    });

    // 2. Entradas adicionais do mapa de resumos para garantir que todas as 42 obras estejam presentes
    Object.entries(AUDIOBOOKS_RESUMOS_MAP).forEach(([slug, info]) => {
      if (!handledSlugs.has(slug)) {
        handledSlugs.add(slug);
        const virtualLivro: AudiobookLivro = {
          id: slug,
          titulo: info.titulo,
          autor: info.autor,
          capaUrl: `/covers/${slug}.webp`,
          ano: 2024,
          status: 'disponivel',
          descricao: info.descricao || 'Resumo analítico aprofundado.',
          duracaoTotalFormatada: info.duracaoFormatada || '~35 min',
          totalCapitulos: info.capitulos?.length || 1,
          capitulos: [],
          resumoAudioUrl: info.audioUrl,
          resumoSrtUrl: info.srtUrl,
          resumoDuracaoFormatada: info.duracaoFormatada || '~35 min',
        };
        list.push({
          livro: virtualLivro,
          slug,
          duracao: info.duracaoFormatada || '~35 min',
          descricao: info.descricao || 'Resumo analítico aprofundado.',
        });
      }
    });

    return list;
  }, []);

  // Filtra por busca se houver
  const livrosFiltrados = useMemo(() => {
    if (!busca.trim()) return livrosTrilha;
    const q = busca.toLowerCase().trim();
    return livrosTrilha.filter(
      (item) =>
        item.livro.titulo.toLowerCase().includes(q) ||
        item.livro.autor.toLowerCase().includes(q)
    );
  }, [livrosTrilha, busca]);

  const totalObras = livrosTrilha.length;
  const concluidosCount = useMemo(() => {
    return livrosTrilha.filter((item) => lidosManual.has(item.slug)).length;
  }, [livrosTrilha, lidosManual]);

  const progressoPct = totalObras > 0 ? Math.round((concluidosCount / totalObras) * 100) : 0;

  return (
    <div className="w-full flex flex-col pb-16">
      {/* ── CARD DE PROGRESSO GAMIFICADO DA TRILHA ── */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#7C3AED]/20 via-[#4C1D95]/15 to-zinc-950 border border-[#7C3AED]/35 shadow-xl mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#7C3AED]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 mb-2.5 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#7C3AED]/30 border border-[#8B5CF6]/40 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-[#DDD6FE]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300">
                Trilha Sequencial
              </span>
              <h3 className="text-sm font-bold text-white leading-tight">
                Resumos em Áudio
              </h3>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs font-black text-purple-200">
              {progressoPct}%
            </span>
            <span className="text-[10px] text-white/50">
              {concluidosCount} de {totalObras} concluídos
            </span>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full h-2 rounded-full bg-black/50 border border-white/10 overflow-hidden relative z-10">
          <motion.div
            className="h-full bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#C084FC]"
            initial={{ width: 0 }}
            animate={{ width: `${progressoPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ── CAMPO DE BUSCA RÁPIDA NA TRILHA ── */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar obra ou pensador na trilha..."
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-zinc-950/80 border border-white/10 text-white placeholder-white/35 text-xs sm:text-sm focus:outline-none focus:border-[#7C3AED] transition-colors"
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs px-2 py-1"
          >
            Limpar
          </button>
        )}
      </div>

      {/* ── LINHA DO TEMPO SEQUENCIAL (TRILHA ZIG-ZAG) ── */}
      <div className="relative overflow-hidden py-2 px-1">
        {/* Linha vertical central luminosa */}
        <div className="absolute left-1/2 top-6 bottom-6 w-1 bg-white/10 -translate-x-1/2 z-0 rounded-full overflow-hidden">
          <div
            className="w-full bg-gradient-to-b from-[#7C3AED] via-[#A855F7] to-[#C084FC] transition-all duration-700 ease-in-out"
            style={{
              height: `${progressoPct}%`,
              boxShadow: '0 0 12px rgba(124, 58, 237, 0.7)',
            }}
          />
        </div>

        <div className="space-y-8 sm:space-y-10">
          {livrosFiltrados.map((item, i) => {
            const isLeft = i % 2 === 0;
            const isConcluido = lidosManual.has(item.slug);
            const numeroPasso = i + 1;

            return (
              <motion.div
                key={item.slug}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                className={`relative z-10 flex w-full items-center ${
                  isLeft ? 'justify-start' : 'justify-end'
                }`}
              >
                {/* Linha pontilhada conectando o nó central ao card */}
                <div
                  className={`absolute top-1/2 w-[calc(50%-2rem)] h-[1px] border-b-2 border-dotted -translate-y-1/2 z-0 ${
                    isConcluido ? 'border-emerald-500/40' : 'border-purple-500/30'
                  } ${isLeft ? 'left-1/2' : 'right-1/2'}`}
                />

                {/* Nó Central (Bolinha Numerada / Checkmark) */}
                <button
                  type="button"
                  onClick={(e) => toggleConcluido(item.slug, e)}
                  title={isConcluido ? 'Marcar como não ouvido' : 'Marcar como concluído'}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full z-20 flex items-center justify-center transition-all duration-300 cursor-pointer ${
                    isConcluido
                      ? 'bg-emerald-500 border-4 border-[#0A0A0D] text-white shadow-[0_0_15px_rgba(16,185,129,0.7)] scale-110'
                      : 'bg-[#181824] border-4 border-[#0A0A0D] text-purple-200 hover:border-purple-500/60 shadow-lg'
                  }`}
                >
                  {isConcluido ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <span className="text-[11px] font-black">{numeroPasso}</span>
                  )}
                </button>

                {/* Card da Obra com Resumo */}
                <div
                  onClick={() => {
                    haptic.impact();
                    onPlayResumo(item.livro);
                  }}
                  className={`group w-[46%] sm:w-[45%] rounded-3xl relative z-30 transition-all duration-300 cursor-pointer p-2.5 sm:p-3 box-border flex flex-col ${
                    isLeft
                      ? 'hover:-rotate-[1deg] hover:-translate-x-0.5'
                      : 'hover:rotate-[1deg] hover:translate-x-0.5'
                  } ${
                    isConcluido
                      ? 'bg-emerald-950/20 border border-emerald-500/30 shadow-[0_10px_25px_rgba(16,185,129,0.15)]'
                      : 'bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 hover:border-purple-500/40 shadow-2xl backdrop-blur-md'
                  }`}
                >
                  {/* Capa com overlay e botão de Play */}
                  <div className="w-full aspect-[16/10] sm:aspect-[16/9] mb-2 rounded-2xl overflow-hidden relative bg-black/60 shadow-md">
                    <img
                      src={item.livro.capaUrl || `/covers/${item.slug}.webp`}
                      alt={item.livro.titulo}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge de Duração no canto inferior */}
                    <div className="absolute bottom-1.5 left-1.5 z-10 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 text-[9px] font-bold text-white flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-purple-300" />
                      {item.duracao}
                    </div>

                    {/* Botão Play Flutuante */}
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-[#7C3AED]/60 transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    {isConcluido && (
                      <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Detalhes Textuais */}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      Passo {numeroPasso}
                    </span>
                    <h4 className="font-sans font-bold text-xs sm:text-sm text-white line-clamp-1 leading-tight group-hover:text-purple-200 transition-colors">
                      {item.livro.titulo}
                    </h4>
                    <p className="text-[10px] text-white/50 truncate mt-0.5">
                      {item.livro.autor}
                    </p>

                    {/* Botão de Ouvir Direto */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic.impact();
                        onPlayResumo(item.livro);
                      }}
                      className="mt-2 w-full py-1.5 px-2 rounded-xl bg-[#7C3AED]/20 hover:bg-[#7C3AED]/35 active:scale-95 border border-[#7C3AED]/40 text-[#DDD6FE] text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Ouvir Resumo
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {livrosFiltrados.length === 0 && (
            <div className="py-12 text-center text-white/50 text-xs">
              Nenhuma obra encontrada com esse termo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

