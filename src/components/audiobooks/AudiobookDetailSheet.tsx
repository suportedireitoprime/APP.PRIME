import React, { useState } from 'react';
import {
  X,
  Play,
  Clock,
  Layers,
  Sparkles,
  Info,
  Bell,
  Heart,
  ChevronRight,
  Headphones,
  BookOpen,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PrimeBottomSheet } from '@/components/vademecum/overlays/PrimeBottomSheet';
import { haptic } from '@/lib/nativeHaptics';
import { AudiobookLivro } from '@/data/audiobooksCatalogo';
import { useIsDesktop } from '@/hooks/use-desktop';

interface AudiobookDetailSheetProps {
  open: boolean;
  livro: AudiobookLivro | null;
  onClose: () => void;
  onPlayCapitulo: (index: number) => void;
  progressoSalvo?: { capituloIndex: number; time: number } | null;
  isNotificado?: boolean;
  onToggleNotificacao?: (livroId: string, titulo: string) => void;
}

export const AudiobookDetailSheet: React.FC<AudiobookDetailSheetProps> = ({
  open,
  livro,
  onClose,
  onPlayCapitulo,
  progressoSalvo,
  isNotificado = false,
  onToggleNotificacao,
}) => {
  const isDesktop = useIsDesktop();
  const [tabAtiva, setTabAtiva] = useState<'capitulos' | 'sobre' | 'ficha'>('capitulos');
  const [fav, setFav] = useState(false);

  if (!livro) return null;

  const isDisponivel = livro.status === 'disponivel';
  const capitulos = livro.capitulos || [];

  // Imagem oficial do cenário dos capítulos (da pasta criada para os capítulos)
  const imagemCenario =
    livro.capitulos?.[0]?.imagens?.[0]?.url ||
    livro.capaUrl;

  const handleToggleFav = () => {
    haptic.selection();
    setFav((prev) => {
      const next = !prev;
      if (next) toast.success(`"${livro.titulo}" salvo nos seus favoritos!`);
      return next;
    });
  };

  const handleShare = async () => {
    haptic.selection();
    const shareData = {
      title: `${livro.titulo} · Audiobook`,
      text: `Ouça o audiobook de "${livro.titulo}" de ${livro.autor} no Direito Prime!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title} - ${shareData.text}`);
        toast.success('Link copiado para a área de transferência!');
      }
    } catch {}
  };

  return (
    <PrimeBottomSheet
      open={open}
      onClose={onClose}
      zIndex={1001}
      className={
        isDesktop
          ? 'left-0 right-0 mx-auto bottom-auto top-[6dvh] !h-[88dvh] max-w-[760px] rounded-3xl border border-white/10 bg-[#0F0F12] shadow-2xl overflow-hidden'
          : 'mt-[6dvh] !h-[94dvh] rounded-t-3xl border-t border-white/10 bg-[#0F0F12] shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.8)] overflow-hidden'
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
          onClick={handleShare}
          aria-label="Compartilhar"
          className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-transform active:scale-95 shadow-lg cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-white" />
        </button>

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
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
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
            {/* Tag Categoria */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              {livro.tags?.[0] || 'FILOSOFIA DO DIREITO'}
            </div>

            <h2 className="font-serif italic text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {livro.titulo}
            </h2>

            <p className="text-white/60 text-xs sm:text-sm mt-1 font-medium">
              Por <span className="text-white font-semibold">{livro.autor}</span>{' '}
              {livro.ano && `(${livro.ano})`}
            </p>
          </div>

          {/* Ficha Técnica Compacta (Padrão Biblioteca) */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
            <div className="flex flex-col items-center justify-center p-1">
              <Layers className="w-4 h-4 text-purple-400 mb-1" />
              <span className="text-[10px] text-white/50 uppercase font-bold">Capítulos</span>
              <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
                {livro.totalCapitulos || (isDisponivel ? '8' : 'Completo')}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-1 border-x border-white/10">
              <Clock className="w-4 h-4 text-purple-400 mb-1" />
              <span className="text-[10px] text-white/50 uppercase font-bold">Duração</span>
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
          {/* BOTÃO PRIMÁRIO DE AÇÃO COLORIDO & VIBRANTE               */}
          {/* ======================================================== */}
          <div className="pt-1">
            {isDisponivel ? (
              <button
                type="button"
                onClick={() => {
                  haptic.impact();
                  const targetIndex = progressoSalvo?.capituloIndex ?? 0;
                  onClose();
                  onPlayCapitulo(targetIndex);
                }}
                style={{
                  background: 'linear-gradient(135deg, #9333EA 0%, #7C3AED 50%, #6D28D9 100%)',
                  boxShadow: '0 8px 25px -4px rgba(124, 58, 237, 0.65)',
                }}
                className="w-full min-h-[52px] px-6 py-3.5 rounded-2xl text-white font-display font-bold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer border border-purple-400/40 hover:brightness-110"
              >
                <Play className="w-4 h-4 fill-white text-white drop-shadow-md" />
                <span className="drop-shadow-md">
                  {progressoSalvo
                    ? `Continuar Capítulo ${progressoSalvo.capituloIndex + 1}`
                    : 'Começar Audiobook'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onToggleNotificacao) {
                    onToggleNotificacao(livro.id, livro.titulo);
                  }
                }}
                className={`w-full min-h-[52px] px-6 py-3.5 rounded-2xl font-display font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg active:scale-[0.98] ${
                  isNotificado
                    ? 'bg-amber-600/25 border border-amber-500/50 text-amber-300'
                    : 'bg-white/10 hover:bg-white/15 border border-white/15 text-white'
                }`}
              >
                <Bell className={`w-4 h-4 ${isNotificado ? 'fill-current text-amber-300' : ''}`} />
                <span>
                  {isNotificado ? 'Notificação Ativada (Você será avisado)' : 'Me Avise no Lançamento'}
                </span>
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* ABAS DO PAINEL (PADRÃO LIVROTABSCONTENT DA BIBLIOTECA)    */}
          {/* ======================================================== */}
          <div className="pt-2">
            <div className="flex items-center gap-1 p-1 bg-white/[0.04] rounded-2xl border border-white/10 mb-4">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setTabAtiva('capitulos');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  tabAtiva === 'capitulos'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Capítulos ({capitulos.length > 0 ? capitulos.length : (isDisponivel ? '8' : '—')})
              </button>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setTabAtiva('sobre');
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  tabAtiva === 'sobre'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
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
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  tabAtiva === 'ficha'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-white/60 hover:text-white'
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
                          onClose();
                          onPlayCapitulo(index);
                        }}
                        className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left border transition-all active:scale-[0.99] group cursor-pointer ${
                          isCurrent
                            ? 'bg-purple-500/15 border-purple-500/40 shadow-lg'
                            : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-display font-bold text-xs transition-transform group-hover:scale-105 ${
                            isCurrent
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-white/10 text-white/80 group-hover:bg-purple-600 group-hover:text-white'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                              Capítulo {cap.numero}
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
                  <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/5">
                    <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-bold text-white">Gravação em Produção</p>
                    <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto">
                      Os capítulos deste audiobook estão em fase de narração profissional e legendagem. Você pode ativar a notificação para ser avisado no lançamento.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo da Aba Sobre a Obra */}
            {tabAtiva === 'sobre' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <h4 className="text-xs uppercase font-bold text-white/50 tracking-wider mb-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-purple-400" />
                    Sinopse
                  </h4>
                  <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                    {livro.sinopse || livro.descricao}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <h4 className="text-xs uppercase font-bold text-white/50 tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    Relevância Jurídica
                  </h4>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                    Obra referencial que discute os limites entre o Direito Positivo e o Direito Natural, abordando dilemas morais, estado de necessidade e a interpretação das leis frente à realidade fática da condição humana.
                  </p>
                </div>
              </div>
            )}

            {/* Conteúdo da Aba Ficha Técnica */}
            {tabAtiva === 'ficha' && (
              <div className="space-y-2.5 animate-in fade-in duration-200">
                <div className="divide-y divide-white/10 rounded-2xl bg-white/[0.03] border border-white/5 text-xs">
                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-white/50">Título Original</span>
                    <span className="text-white font-semibold text-right">{livro.titulo}</span>
                  </div>

                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-white/50">Autor</span>
                    <span className="text-white font-semibold">{livro.autor}</span>
                  </div>

                  {livro.ano && (
                    <div className="flex justify-between items-center p-3.5">
                      <span className="text-white/50">Ano de Publicação</span>
                      <span className="text-white font-semibold">{livro.ano}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-white/50">Status da Gravação</span>
                    <span
                      className={`font-semibold ${
                        isDisponivel ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isDisponivel ? 'Disponível Completo' : 'Em Breve no Catálogo'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-white/50">Idioma / Local</span>
                    <span className="text-white font-semibold">Português (Brasil)</span>
                  </div>

                  <div className="flex justify-between items-center p-3.5">
                    <span className="text-white/50">Produção</span>
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
