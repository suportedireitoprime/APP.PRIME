import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Headphones,
  Play,
  Clock,
  BookOpen,
  Sparkles,
  Share2,
  CheckCircle2,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import {
  AUDIOBOOKS_CATALOGO,
  O_CASO_DOS_EXPLORADORES_DE_CAVERNAS,
  AudiobookLivro,
  AudiobookCapitulo
} from '@/data/audiobooksCatalogo';
import { AudiobookPlayerModal } from '@/components/audiobooks/AudiobookPlayerModal';

export default function AudiobooksPage() {
  const navigate = useNavigate();
  const livro = O_CASO_DOS_EXPLORADORES_DE_CAVERNAS;

  const [playerOpen, setPlayerOpen] = useState(false);
  const [selectedCapituloIndex, setSelectedCapituloIndex] = useState(0);

  // Recupera onde o usuário parou
  const storageKey = `audiobook_prog_${livro.id}`;
  const [progressoSalvo, setProgressoSalvo] = useState<{ capituloIndex: number; time: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setProgressoSalvo(JSON.parse(raw));
      }
    } catch {}
  }, [storageKey, playerOpen]);

  const abrirCapitulo = useCallback((index: number) => {
    haptic.selection();
    setSelectedCapituloIndex(index);
    setPlayerOpen(true);
  }, []);

  const iniciarOuContinuar = useCallback(() => {
    haptic.impact();
    const idx = progressoSalvo?.capituloIndex || 0;
    setSelectedCapituloIndex(idx);
    setPlayerOpen(true);
  }, [progressoSalvo]);

  return (
    <div className="min-h-dvh bg-[#0D0D0D] text-white relative overflow-x-hidden pb-[calc(7rem+var(--sai-bottom,0px))]">
      {/* Fundo Padrão ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-[calc(1rem+var(--sai-top,0px))]">
        {/* Header Superior com Botão de Voltar Premium */}
        <header className="flex items-center justify-between pb-4 border-b border-white/5">
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              navigate(-1);
            }}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.4} />
          </button>

          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#E11D48] flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5" />
              Direito Prime Audiobooks
            </span>
            <h1 className="font-display font-bold text-lg sm:text-xl text-white">
              Audiobooks Clássicos
            </h1>
          </div>

          <div className="w-12 sm:w-[52px]" />
        </header>

        {/* Card Destaque Hero do Livro */}
        <section className="mt-6 p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-[#1C1C20] to-[#121214] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
            {/* Capa do Livro em Alta Resolução */}
            <div className="w-44 sm:w-52 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-zinc-950 aspect-[3/4] relative group">
              <img
                src={livro.capaUrl}
                alt={livro.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">
                  Harvard Law Review
                </span>
              </div>
            </div>

            {/* Metadados e Sinopse */}
            <div className="flex-1 flex flex-col justify-between text-center md:text-left">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D48]/15 border border-[#E11D48]/30 text-[#E11D48] text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles className="w-3 h-3" />
                  Obra Prima da Filosofia do Direito
                </div>

                <h2 className="font-serif italic text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  {livro.titulo}
                </h2>

                <p className="text-white/60 text-sm mt-1 font-medium">
                  Por <span className="text-white font-semibold">{livro.autor}</span> ({livro.ano})
                </p>

                <p className="text-white/80 text-xs sm:text-sm mt-3 leading-relaxed line-clamp-3 md:line-clamp-none">
                  {livro.descricao}
                </p>
              </div>

              {/* Informações de Duração e Capítulos */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-5 pt-4 border-t border-white/10 text-xs text-white/70">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#E11D48]" />
                  <span>{livro.totalCapitulos} Capítulos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#E11D48]" />
                  <span>Duração: {livro.duracaoTotalFormatada}</span>
                </div>
              </div>

              {/* Botão de Ação Primária */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={iniciarOuContinuar}
                  className="flex-1 min-h-[48px] px-6 py-3 rounded-2xl bg-[#E11D48] hover:bg-[#E11D48]/90 active:scale-95 text-white font-display font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-[#E11D48]/25 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {progressoSalvo
                      ? `Continuar Capítulo ${progressoSalvo.capituloIndex + 1}`
                      : 'Começar Audiobook'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sinopse Filosófica Curta */}
        <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
          <p className="text-xs text-white/70 leading-relaxed">
            {livro.sinopse}
          </p>
        </div>

        {/* Seção: Lista de Capítulos da Obra */}
        <section className="mt-8 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#E11D48]" />
              Capítulos da Obra ({livro.totalCapitulos})
            </h3>
            <span className="text-xs text-white/50">Toque para ouvir</span>
          </div>

          <div className="space-y-2.5">
            {livro.capitulos.map((cap, index) => {
              const isCurrent = progressoSalvo?.capituloIndex === index;
              return (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => abrirCapitulo(index)}
                  className={`w-full flex items-center gap-3.5 p-4 rounded-2xl text-left border transition-all active:scale-[0.99] group cursor-pointer ${
                    isCurrent
                      ? 'bg-[#E11D48]/15 border-[#E11D48]/35 shadow-lg'
                      : 'bg-[#18181B] hover:bg-[#202024] border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Círculo do número do capítulo */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-sm transition-transform group-hover:scale-105 ${
                      isCurrent
                        ? 'bg-[#E11D48] text-white shadow-md'
                        : 'bg-white/10 text-white/80 group-hover:bg-[#E11D48] group-hover:text-white'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  </div>

                  {/* Informações do Capítulo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#E11D48]">
                        Capítulo {cap.numero}
                      </span>
                      <span className="text-[10px] text-white/40">•</span>
                      <span className="text-[10px] text-white/50 truncate">{cap.autor}</span>
                    </div>

                    <h4 className="font-display font-bold text-[15px] sm:text-[16px] text-white truncate mt-0.5 group-hover:text-[#E11D48] transition-colors">
                      {cap.titulo}
                    </h4>

                    <p className="text-xs text-white/60 truncate mt-0.5 font-sans">
                      {cap.descricao}
                    </p>
                  </div>

                  {/* Duração formatada e seta */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="font-mono text-xs text-white/50">
                      {cap.duracaoFormatada}
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Modal Player em Tela Cheia */}
      <AudiobookPlayerModal
        livro={livro}
        capituloInicialIndex={selectedCapituloIndex}
        isOpen={playerOpen}
        onClose={() => setPlayerOpen(false)}
      />
    </div>
  );
}

