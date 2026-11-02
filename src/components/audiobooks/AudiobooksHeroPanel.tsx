import React, { memo } from 'react';
import {
  Headphones,
  Play,
  Clock,
  BookOpen,
  Bell,
  Sparkles,
  ChevronRight,
  Layers
} from 'lucide-react';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { haptic } from '@/lib/nativeHaptics';
import audiobooksHeroImg from '@/assets/covers/resumos-philosophers-hero.webp';
import { O_CASO_DOS_EXPLORADORES_DE_CAVERNAS, AudiobookLivro } from '@/data/audiobooksCatalogo';

interface AudiobooksHeroPanelProps {
  onOpenLivro: (livro: AudiobookLivro) => void;
  onPlayDisponivel: () => void;
  onFiltrarStatus: (status: 'todos' | 'disponivel' | 'em_breve') => void;
  filtroStatus: 'todos' | 'disponivel' | 'em_breve';
  totalCount: number;
  emBreveCount: number;
}

export const AudiobooksHeroPanel: React.FC<AudiobooksHeroPanelProps> = ({
  onOpenLivro,
  onPlayDisponivel,
  onFiltrarStatus,
  filtroStatus,
  totalCount,
  emBreveCount,
}) => {
  return (
    <div
      className="relative overflow-hidden rounded-3xl sm:rounded-[36px] shadow-2xl shadow-black/80 flex flex-col z-20 border border-purple-500/20"
      style={{
        backgroundColor: '#07060A',
        transform: 'translateZ(0)',
      }}
    >
      {/* ── Imagem de Fundo (Filósofos / Clássicos) ── */}
      <img
        src={audiobooksHeroImg}
        alt=""
        aria-hidden="true"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover object-right sm:object-center z-0 opacity-40 mix-blend-luminosity scale-105"
      />

      {/* ── Overlay Roxo com corte diagonal idêntico ao Vade Mecum ── */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          filter:
            'drop-shadow(25px 0 25px rgba(0,0,0,0.85)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))',
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: 'polygon(0 0, 56% 0, 38% 100%, 0% 100%)' }}
        >
          {/* Degradê Roxo / Violeta Oficial */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95]" />
          {/* Fundo Padrão ShapeGrid animado embutido */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay">
            <ShapeGrid />
          </div>
        </div>
      </div>

      {/* Glow Roxo de Atmosfera */}
      <div className="absolute -top-16 -left-16 w-72 h-72 bg-[#7C3AED]/35 rounded-full blur-3xl pointer-events-none z-[2]" />

      {/* ── Conteúdo Central do Painel ── */}
      <div className="relative z-10 px-4 sm:px-6 pt-6 sm:pt-8 pb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5">
        {/* Marca à Esquerda (dentro da área roxa) */}
        <div className="flex flex-col items-start text-left z-10 w-full md:w-[48%] max-w-[280px]">
          {/* Ícone com Glow */}
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg shadow-purple-950/60 mb-2.5">
            <Headphones className="w-6 h-6 text-white drop-shadow-md" strokeWidth={2.2} />
          </div>

          <h2 className="font-serif italic text-white text-2xl sm:text-3xl leading-[1.05] font-black tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            Audiobooks
          </h2>

          <p className="font-body text-white/95 text-[9.5px] sm:text-[10.5px] font-bold tracking-[0.25em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
            CLÁSSICOS DO DIREITO
          </p>

          <div className="mt-3 flex items-center gap-2.5">
            <div className="w-[2.5px] h-8 bg-white/50 rounded-full" />
            <p className="font-serif italic text-white/90 text-xs sm:text-[13px] leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              A voz dos grandes pensadores,
              <br />
              narrados para o seu estudo.
            </p>
          </div>
        </div>

        {/* Card Destaque Flutuante à Direita (Sobre a imagem de fundo) */}
        <div className="w-full md:w-[50%] flex justify-end z-10">
          <button
            type="button"
            onClick={() => {
              haptic.impact();
              onOpenLivro(O_CASO_DOS_EXPLORADORES_DE_CAVERNAS);
            }}
            className="w-full sm:max-w-[340px] p-3 sm:p-3.5 rounded-2xl bg-black/75 hover:bg-black/85 backdrop-blur-xl border border-white/15 hover:border-purple-400/50 active:scale-[0.98] transition-all text-left group shadow-2xl flex items-center gap-3.5 cursor-pointer"
          >
            {/* Capa em Miniatura */}
            <div className="w-14 sm:w-16 h-20 sm:h-22 rounded-xl overflow-hidden border border-white/25 bg-black shrink-0 relative shadow-md">
              <img
                src={O_CASO_DOS_EXPLORADORES_DE_CAVERNAS.capaUrl}
                alt="Exploradores de Cavernas"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute bottom-0 inset-x-0 bg-[#7C3AED] text-[8px] font-black uppercase text-center text-white py-0.5 tracking-wider">
                ÁUDIO
              </span>
            </div>

            {/* Informações da Obra Disponível */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  Disponível Agora
                </span>
              </div>

              <h4 className="font-display font-bold text-sm sm:text-base text-white group-hover:text-purple-300 transition-colors truncate">
                {O_CASO_DOS_EXPLORADORES_DE_CAVERNAS.titulo}
              </h4>

              <p className="text-[11px] text-white/60 truncate mt-0.5">
                Por {O_CASO_DOS_EXPLORADORES_DE_CAVERNAS.autor}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-current" />
                  8 Capítulos Gravados
                </span>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        </div>
      </div>

      {/* ── 4 Botões de Ação Rápida no Padrão Vade Mecum (com detalhes roxos) ── */}
      <div className="relative z-10 px-3 sm:px-5 pb-3 pt-1">
        <div className="flex items-center justify-between gap-2 bg-black/55 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl">
          {/* Botão 1: Ouvir Agora */}
          <button
            type="button"
            onClick={() => {
              haptic.impact();
              onPlayDisponivel();
            }}
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            aria-label="Começar a ouvir"
          >
            <Play className="w-5 h-5 text-purple-400 fill-purple-400 drop-shadow-md group-hover:scale-110 transition-transform" />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight tracking-wide drop-shadow-sm">
              Ouvir Agora
            </span>
          </button>

          {/* Botão 2: Todos os Livros */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onFiltrarStatus('todos');
            }}
            className={`flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all active:scale-95 gap-1 text-center cursor-pointer select-none ${
              filtroStatus === 'todos'
                ? 'bg-purple-600/30 border border-purple-500/40 text-purple-200'
                : 'hover:bg-white/10 text-white'
            }`}
            aria-label="Ver todos os livros"
          >
            <BookOpen className="w-5 h-5 text-purple-300 drop-shadow-md group-hover:scale-110 transition-transform" />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight tracking-wide drop-shadow-sm">
              Todos ({totalCount})
            </span>
          </button>

          {/* Botão 3: Em Breve */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onFiltrarStatus('em_breve');
            }}
            className={`flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all active:scale-95 gap-1 text-center cursor-pointer select-none ${
              filtroStatus === 'em_breve'
                ? 'bg-purple-600/30 border border-purple-500/40 text-purple-200'
                : 'hover:bg-white/10 text-white'
            }`}
            aria-label="Ver livros em breve"
          >
            <Clock className="w-5 h-5 text-amber-400 drop-shadow-md group-hover:scale-110 transition-transform" />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight tracking-wide drop-shadow-sm">
              Em Breve ({emBreveCount})
            </span>
          </button>

          {/* Botão 4: Informações da Produção */}
          <button
            type="button"
            onClick={() => {
              haptic.selection();
              onOpenLivro(O_CASO_DOS_EXPLORADORES_DE_CAVERNAS);
            }}
            className="flex-1 group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl hover:bg-white/10 active:bg-white/15 transition-all active:scale-95 gap-1 text-center cursor-pointer select-none"
            aria-label="Abrir painel da obra"
          >
            <Sparkles className="w-5 h-5 text-purple-300 drop-shadow-md group-hover:scale-110 transition-transform" />
            <span className="font-body text-white text-[11px] sm:text-[12px] font-semibold leading-tight tracking-wide drop-shadow-sm">
              Detalhes
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(AudiobooksHeroPanel);

