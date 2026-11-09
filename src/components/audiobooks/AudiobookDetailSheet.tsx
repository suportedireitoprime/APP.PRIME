import React, { useState } from 'react';
import {
  X,
  Play,
  Clock,
  Layers,
  Info,
  Bell,
  Heart,
  ChevronRight,
  Headphones,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { PrimeBottomSheet } from '@/components/vademecum/overlays/PrimeBottomSheet';
import { haptic } from '@/lib/nativeHaptics';
import { AudiobookLivro } from '@/data/audiobooksCatalogo';
import { getResumoForLivro, getResumoCapitulos } from '@/data/audiobooksResumosMap';
import { useIsDesktop } from '@/hooks/use-desktop';

interface AudiobookDetailSheetProps {
  open: boolean;
  livro: AudiobookLivro | null;
  onClose: () => void;
  onPlayCapitulo: (index: number, livro: AudiobookLivro) => void;
  onPlayResumo?: (livro: AudiobookLivro, capituloIndex?: number) => void;
  progressoSalvo?: { capituloIndex: number; time: number } | null;
  isNotificado?: boolean;
  onToggleNotificacao?: (livroId: string, titulo: string) => void;
}

export const AudiobookDetailSheet: React.FC<AudiobookDetailSheetProps> = ({
  open,
  livro,
  onClose,
  onPlayCapitulo,
  onPlayResumo,
  progressoSalvo,
  isNotificado = false,
  onToggleNotificacao,
}) => {
  const isDesktop = useIsDesktop();
  const resumoInfo = React.useMemo(() => getResumoForLivro(livro), [livro]);
  const resumoCapitulos = React.useMemo(() => getResumoCapitulos(livro), [livro]);
  const temResumo = !!resumoInfo;

  const [tabAtiva, setTabAtiva] = useState<'capitulos' | 'resumo' | 'sobre' | 'ficha'>('capitulos');
  const [fav, setFav] = useState(false);

  // Imagem de cena dos capítulos no R2 (prioriza a ilustração real de cena do R2 em vez de repetir a capa)
  const imagemCenario = React.useMemo(() => {
    if (!livro) return '';

    // 1. Procura nas imagens estruturadas dos capítulos alguma que não seja a capa do livro
    if (livro.capitulos && livro.capitulos.length > 0) {
      for (const cap of livro.capitulos) {
        if (cap.imagens && cap.imagens.length > 0) {
          const imgReal = cap.imagens.find(
            (img) =>
              img.url &&
              !img.url.includes('capa-do-livro') &&
              !img.url.endsWith('capa.jpg') &&
              !img.url.endsWith('capa.png')
          );
          if (imgReal?.url) return imgReal.url;
        }
      }
    }

    // 2. Mapeamento direto de cenários no R2 por slug
    const CENARIOS_R2: Record<string, string> = {
      'o-caso-dos-exploradores-de-cavernas':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capitulo-01/imagem-01-caverna.webp',
      'como-as-democracias-morrem':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/como-as-democracias-morrem/imagens-de-cena/capitulo-02.png',
      'direito-penal-do-equilibrio':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/direito-penal-do-equilibrio/imagens-de-cena/capitulo-01.png',
      'eles-os-juizes-vistos-por-nos-os-advogados':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/eles-os-juizes-vistos-por-nos-os-advogados/imagens-de-cena/capitulo-01.png',
      'etica-a-nicomaco':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/etica-a-nicomaco/imagens-de-cena/capitulo-01.png',
      'introducao-ao-estudo-do-direito':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/introducao-ao-estudo-do-direito/imagens-de-cena/capitulo-01.png',
      'justica-o-que-e-fazer-a-coisa-certa':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/justica-o-que-e-fazer-a-coisa-certa/imagens-de-cena/capitulo-01.png',
      'o-contrato-social':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-contrato-social/imagens-de-cena/capitulo-01.png',
      'o-leviata':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-leviata/imagens-de-cena/capitulo-01.png',
      'o-monge-e-o-executivo':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-monge-e-o-executivo/imagens-de-cena/capitulo-01.png',
      'o-mundo-assombrado-pelos-demonios':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-mundo-assombrado-pelos-demonios/imagens-de-cena/capitulo-01.png',
      'o-processo':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-processo/imagens-de-cena/capitulo-01.png',
      'sobre-a-liberdade':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/sobre-a-liberdade/imagens-de-cena/capitulo-00.png',
      'vigiar-e-punir':
        'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/vigiar-e-punir/imagens-de-cena/capitulo-01.png',
    };

    if (livro.id && CENARIOS_R2[livro.id]) {
      return CENARIOS_R2[livro.id];
    }

    if (livro.id) {
      return `https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/${livro.id}/imagens-de-cena/capitulo-01.png`;
    }

    return livro.capaUrl;
  }, [livro]);

  if (!livro) return null;

  const isDisponivel = livro.status === 'disponivel';
  const capitulos = livro.capitulos || [];

  const handleToggleFav = () => {
    haptic.selection();
    setFav((prev) => {
      const next = !prev;
      if (next) toast.success(`"${livro.titulo}" salvo nos seus favoritos!`);
      return next;
    });
  };

  return (
    <PrimeBottomSheet
      open={open}
      onClose={onClose}
      zIndex={1001}
      className={
        isDesktop
          ? 'left-0 right-0 mx-auto bottom-auto top-[6dvh] !h-[88dvh] max-w-[760px] rounded-3xl border border-purple-500/20 bg-[#0E0820] shadow-2xl overflow-hidden'
          : 'mt-[6dvh] !h-[94dvh] rounded-t-3xl border-t border-purple-500/20 bg-[#0E0820] shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.8)] overflow-hidden'
      }
    >
      {/* Botões Flutuantes no Topo (Padrão Biblioteca) */}
      <div className="absolute top-3 left-4 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            onClose();
          }}
          aria-label="Fechar painel"
          className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg cursor-pointer"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="absolute top-3 right-4 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleFav}
          aria-label="Favoritar"
          className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              fav ? 'fill-[#E11D48] text-[#E11D48]' : 'text-white'
            }`}
          />
        </button>
      </div>

      {/* Conteúdo com Scroll Suave */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain text-white pb-[calc(2rem+var(--sai-bottom,0px))]">
        {/* ======================================================== */}
        {/* HEADER BACKDROP CINEMATOGRÁFICO COM CENÁRIO DOS CAPÍTULOS */}
        {/* ======================================================== */}
        <div className="relative w-full h-[235px] sm:h-[275px] overflow-hidden bg-neutral-950">
          {/* Imagem do Cenário dos Capítulos da Obra em Alta Resolução */}
          <img
            src={imagemCenario}
            alt="Cenário dos Capítulos"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== livro.capaUrl) {
                target.src = livro.capaUrl;
              }
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-65 scale-105"
          />
          {/* Gradientes cinematográficos de atmosfera e fusão */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12]/50 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80" />
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-36 bg-purple-600/35 rounded-full blur-3xl pointer-events-none" />

          {/* Capa 3D Vertical em Destaque com sombra e selo */}
          <div className="relative h-full flex items-end justify-center pb-4 z-10">
            <div className="w-[110px] sm:w-[130px] aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border border-white/25 bg-black relative group shadow-black">
              <img
                src={livro.capaUrl}
                alt={livro.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest flex items-center gap-1">
                  <Headphones className="w-2.5 h-2.5 text-purple-400" />
                  {isDisponivel ? 'Áudio HD' : 'Em Breve'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* INFORMAÇÕES PRINCIPAIS & METADADOS                       */}
        {/* ======================================================== */}
        <div className="px-5 max-w-2xl mx-auto pt-2 space-y-4">
          <div className="text-center">
            <h2 className="font-serif italic text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {livro.titulo}
            </h2>

            <p className="text-white/60 text-xs sm:text-sm mt-1 font-medium">
              Por <span className="text-white font-semibold">{livro.autor}</span>{' '}
              {livro.ano && `(${livro.ano})`}
            </p>
          </div>

          {/* Ficha Técnica Compacta (Padrão Biblioteca) */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-center shadow-md">
            <div className="flex flex-col items-center justify-center p-1">
              <Layers className="w-4 h-4 text-purple-400 mb-1" />
              <span className="text-[10px] text-purple-200/60 uppercase font-bold">Capítulos</span>
              <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
                {livro.totalCapitulos || (isDisponivel ? '8' : 'Completo')}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-1 border-x border-purple-500/20">
              <Clock className="w-4 h-4 text-purple-400 mb-1" />
              <span className="text-[10px] text-purple-200/60 uppercase font-bold">Duração</span>
              <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
                {livro.duracaoTotalFormatada || (isDisponivel ? '~45 min' : 'Em gravação')}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-1">
              <Headphones className="w-4 h-4 text-purple-400 mb-1" />
              <span className="text-[10px] text-white/50 uppercase font-bold">Formato</span>
              <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
                Áudio + SRT
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* BOTÕES DE AÇÃO: AUDIOBOOK COMPLETO OU RESUMO DO LIVRO    */}
          {/* ======================================================== */}
          <div className="pt-1 space-y-2.5">
            {/* Opção 1: Audiobook Completo (se disponível) */}
            {isDisponivel ? (
              <button
                type="button"
                onClick={() => {
                  haptic.impact();
                  const targetIndex = progressoSalvo?.capituloIndex ?? 0;
                  onPlayCapitulo(targetIndex, livro);
                  onClose();
                }}
                style={{
                  background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 50%, #6D28D9 100%)',
                  boxShadow: '0 8px 25px -4px rgba(124, 58, 237, 0.65)',
                }}
                className="w-full min-h-[52px] px-5 py-3 rounded-2xl text-white font-display font-bold text-sm uppercase tracking-wider flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer border border-purple-400/40 hover:brightness-110 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-sm leading-tight">
                      {progressoSalvo
                        ? (capitulos[progressoSalvo.capituloIndex]?.numero > 0
                            ? `Continuar Capítulo ${capitulos[progressoSalvo.capituloIndex].numero}`
                            : 'Continuar Reprodução')
                        : 'Audiobook Completo'}
                    </span>
                    <span className="block text-[11px] text-white/70 font-sans normal-case font-normal">
                      Obra integral em {capitulos.length} capítulos
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
                </div>
              </button>
            ) : null}

            {/* Opção 2: Resumo Analítico em Áudio */}
            {temResumo && (
              <button
                type="button"
                onClick={() => {
                  haptic.impact();
                  if (onPlayResumo) {
                    onPlayResumo(livro);
                  } else {
                    onPlayCapitulo(0, livro);
                  }
                  onClose();
                }}
                className="w-full min-h-[54px] px-4 sm:px-5 py-3 rounded-2xl text-white font-display flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer bg-gradient-to-r from-purple-950/40 via-zinc-900/90 to-[#120F1D]/80 border border-purple-500/25 hover:border-purple-400/50 hover:bg-zinc-900 shadow-[0_8px_20px_-6px_rgba(147,51,234,0.25)] group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/10 group-hover:border-purple-400/40 group-hover:bg-purple-500/15 flex items-center justify-center shrink-0 transition-colors">
                    <BookOpen className="w-4 h-4 text-purple-300 group-hover:text-purple-200 transition-colors" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="block font-bold text-[13px] sm:text-sm uppercase tracking-wider text-white group-hover:text-purple-200 transition-colors leading-tight truncate">
                      Resumo Analítico
                    </span>
                    <span className="block text-[11px] text-white/60 font-sans normal-case font-normal mt-0.5 truncate">
                      Síntese dos pontos essenciais • {resumoInfo?.duracaoFormatada || '~35 min'}
                    </span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-purple-600 border border-white/10 group-hover:border-purple-500 flex items-center justify-center group-hover:scale-105 transition-all shrink-0">
                  <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
                </div>
              </button>
            )}

            {/* Se o audiobook completo não estiver disponível */}
            {!isDisponivel && (
              <button
                type="button"
                onClick={() => {
                  if (onToggleNotificacao) {
                    onToggleNotificacao(livro.id, livro.titulo);
                  }
                }}
                className={`w-full min-h-[46px] px-5 py-2.5 rounded-2xl font-display font-medium text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.98] ${
                  isNotificado
                    ? 'bg-amber-600/25 border border-amber-500/50 text-amber-300'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Bell className={`w-3.5 h-3.5 ${isNotificado ? 'fill-current text-amber-300' : ''}`} />
                <span>
                  {isNotificado
                    ? 'Notificação Ativada para Audiobook Completo'
                    : 'Audiobook Completo em Gravação • Me Avise'}
                </span>
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* ABAS DO PAINEL (PADRÃO LIVROTABSCONTENT DA BIBLIOTECA)    */}
          {/* ======================================================== */}
          <div className="pt-2">
            <div className="flex items-center gap-2 p-1.5 bg-purple-950/40 rounded-2xl border border-purple-500/25 mb-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full max-w-full">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setTabAtiva('capitulos');
                }}
                className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer select-none ${
                  tabAtiva === 'capitulos'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
                }`}
              >
                Capítulos ({capitulos.length > 0 ? capitulos.length : (isDisponivel ? '8' : '—')})
              </button>

              {temResumo && (
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setTabAtiva('resumo');
                  }}
                  className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                    tabAtiva === 'resumo'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-purple-300" />
                  <span>Resumo Analítico</span>
                  {resumoInfo?.duracaoFormatada && (
                    <span className="text-[10px] opacity-75 font-normal">
                      ({resumoInfo.duracaoFormatada})
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setTabAtiva('sobre');
                }}
                className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer select-none ${
                  tabAtiva === 'sobre'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
                }`}
              >
                Sobre a Obra
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setTabAtiva('ficha');
                }}
                className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer select-none ${
                  tabAtiva === 'ficha'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-purple-200/70 hover:text-white hover:bg-purple-900/30'
                }`}
              >
                Ficha Técnica
              </button>
            </div>

            {/* Conteúdo da Aba Capítulos */}
            {tabAtiva === 'capitulos' && (
              <div className="space-y-2.5 animate-in fade-in duration-200">
                {capitulos.length > 0 ? (
                  capitulos.map((cap, index) => {
                    const isCurrent = progressoSalvo?.capituloIndex === index;
                    return (
                      <button
                        key={cap.id}
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          onPlayCapitulo(index, livro);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left border transition-all active:scale-[0.99] group cursor-pointer ${
                          isCurrent
                            ? 'bg-purple-500/15 border-purple-500/40 shadow-lg'
                            : 'bg-purple-950/25 hover:bg-purple-900/40 border-purple-500/20 hover:border-purple-400/40'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-xs transition-transform group-hover:scale-105 ${
                            isCurrent
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-purple-900/50 text-purple-200 border border-purple-500/30 group-hover:bg-purple-600 group-hover:text-white'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                              {cap.numero > 0 ? `Capítulo ${cap.numero}` : 'Preliminar'}
                            </span>
                            <span className="text-[10px] text-white/40">•</span>
                            <span className="text-[10px] text-white/50 truncate">
                              {cap.autor}
                            </span>
                          </div>

                          <h4 className="font-display font-bold text-sm text-white truncate mt-0.5 group-hover:text-purple-300 transition-colors">
                            {cap.titulo}
                          </h4>
                          <p className="text-[11px] text-white/60 truncate mt-0.5">
                            {cap.descricao}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className="font-mono text-[11px] text-white/50">
                            {cap.duracaoFormatada}
                          </span>
                          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center rounded-2xl bg-purple-950/30 border border-purple-500/20 space-y-3">
                    <Clock className="w-8 h-8 text-amber-400 mx-auto opacity-80" />
                    <p className="text-sm font-bold text-white">Audiobook Completo em Produção</p>
                    <p className="text-xs text-white/60 max-w-sm mx-auto leading-relaxed">
                      A gravação integral dos capítulos deste clássico está em estúdio.
                      {temResumo && ' No entanto, o Resumo Analítico em Áudio já está disponível!'}
                    </p>
                    {temResumo && (
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          setTabAtiva('resumo');
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-purple-300" />
                        <span>Ver Resumo Analítico ({resumoInfo?.duracaoFormatada || '~35m'})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo da Aba Resumo Analítico */}
            {tabAtiva === 'resumo' && resumoInfo && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-900/25 via-zinc-900/80 to-[#120F1D] border border-purple-500/30 shadow-xl">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          Áudio HD + SRT
                        </span>
                        <span className="text-xs text-white/40">•</span>
                        <span className="text-xs text-purple-200 font-medium">
                          {resumoInfo.duracaoFormatada}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-base sm:text-lg text-white mt-1">
                        Resumo Analítico da Obra
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-purple-300" />
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-4">
                    {resumoInfo.descricao ||
                      'Síntese estruturada com os pontos centrais, teses basilares e dilemas jurídicos da obra.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs p-3 rounded-xl bg-purple-950/40 border border-purple-500/25 mb-4">
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase font-bold">Formato</span>
                      <span className="font-bold text-white mt-0.5">Áudio Integral + SRT</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase font-bold">Metodologia</span>
                      <span className="font-bold text-purple-300 mt-0.5">Análise Jurídica Estruturada</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      haptic.impact();
                      if (onPlayResumo) {
                        onPlayResumo(livro, 0);
                      } else {
                        onPlayCapitulo(0, livro);
                      }
                      onClose();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 50%, #6D28D9 100%)',
                      boxShadow: '0 8px 25px -4px rgba(124, 58, 237, 0.65)',
                    }}
                    className="w-full py-3.5 px-4 rounded-xl font-display font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-white active:scale-[0.98] transition-all cursor-pointer border border-purple-400/40 hover:brightness-110"
                  >
                    <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
                    <span>Reproduzir Resumo do Início</span>
                  </button>
                </div>

                {/* Lista de Capítulos do Resumo */}
                {resumoCapitulos.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between px-1">
                      <h5 className="font-display font-bold text-xs uppercase tracking-wider text-purple-300/90">
                        Capítulos do Resumo ({resumoCapitulos.length})
                      </h5>
                      <span className="text-[10.5px] text-white/50">Áudio Dividido</span>
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                      {resumoCapitulos.map((cap, capIdx) => (
                        <button
                          key={cap.id || capIdx}
                          type="button"
                          onClick={() => {
                            haptic.impact();
                            if (onPlayResumo) {
                              onPlayResumo(livro, capIdx);
                            } else {
                              onPlayCapitulo(capIdx, livro);
                            }
                            onClose();
                          }}
                          className="w-full p-3 rounded-2xl bg-purple-950/25 hover:bg-purple-900/40 border border-purple-500/20 hover:border-purple-400/40 transition-all flex items-center justify-between text-left group cursor-pointer active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-300 font-mono text-xs font-bold shrink-0 group-hover:scale-105 group-hover:bg-purple-500/25 transition-transform">
                              {cap.numero}
                            </div>
                            <div className="min-w-0">
                              <span className="block font-bold text-xs sm:text-sm text-white group-hover:text-purple-200 transition-colors truncate">
                                {cap.titulo}
                              </span>
                              <span className="block text-[11px] text-purple-200/60 truncate mt-0.5">
                                Resumo Analítico • {cap.duracaoFormatada || '~6 min'}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 w-7 h-7 rounded-full bg-purple-500/20 border border-purple-400/30 group-hover:bg-purple-600 flex items-center justify-center transition-colors">
                            <Play className="w-3 h-3 fill-white text-white translate-x-0.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo da Aba Sobre a Obra */}
            {tabAtiva === 'sobre' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-purple-950/25 border border-purple-500/20">
                  <h4 className="text-xs uppercase font-bold text-purple-300/80 tracking-wider mb-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    Sinopse
                  </h4>
                  <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
                    {livro.sinopse || livro.descricao}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-950/25 border border-purple-500/20">
                  <h4 className="text-xs uppercase font-bold text-purple-300/80 tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    Relevância Jurídica
                  </h4>
                  <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                    Obra referencial que discute os limites entre o Direito Positivo e o Direito Natural, abordando dilemas morais, estado de necessidade e a interpretação das leis frente à realidade fática da condição humana.
                  </p>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba Ficha Técnica */}
            {tabAtiva === 'ficha' && (
              <div className="space-y-2.5 animate-in fade-in duration-200">
                <div className="divide-y divide-purple-500/15 rounded-2xl bg-purple-950/25 border border-purple-500/20 text-xs">
                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-purple-200/60">Título Original</span>
                    <span className="text-white font-semibold text-right">{livro.titulo}</span>
                  </div>

                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-purple-200/60">Autor</span>
                    <span className="text-white font-semibold">{livro.autor}</span>
                  </div>

                  {livro.ano && (
                    <div className="flex justify-between items-center p-3.5">
                      <span className="text-purple-200/60">Ano de Publicação</span>
                      <span className="text-white font-semibold">{livro.ano}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-purple-200/60">Status da Gravação</span>
                    <span
                      className={`font-semibold ${
                        isDisponivel ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isDisponivel ? 'Disponível Completo' : 'Em Breve no Catálogo'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-purple-200/60">Idioma / Local</span>
                    <span className="text-white font-semibold">Português (Brasil)</span>
                  </div>

                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-purple-200/60">Produção</span>
                    <span className="text-purple-400 font-bold">Direito Prime Audiobooks</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PrimeBottomSheet>
  );
};
