import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ExternalLink,
  X,
  Volume2,
  BookOpen,
  Type,
  Loader2,
} from 'lucide-react';
import type { ArtigoLei } from '@/data/mockData';
import {
  buscarArtigoTexto,
  formatarDuracao,
  type ArtigoNarradoItem,
} from '@/services/audioleisService';
import { useNarracaoFlutuante } from '@/stores/useNarracaoFlutuante';
import { leiToSlug, tipoToSlug } from '@/lib/legislacaoSlugs';
import { haptic } from '@/lib/nativeHaptics';

interface AudioleiFollowPlayerProps {
  artigo: ArtigoNarradoItem;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onClose?: () => void;
  isModal?: boolean;
}

const SPEEDS = [1, 1.25, 1.5, 2] as const;

export const AudioleiFollowPlayer: React.FC<AudioleiFollowPlayerProps> = ({
  artigo,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onClose,
  isModal = false,
}) => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(artigo.duracaoSegundos || 0);
  const [speed, setSpeed] = useState<number>(1);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');
  const [textoArtigo, setTextoArtigo] = useState<ArtigoLei | null>(null);
  const [loadingTexto, setLoadingTexto] = useState(true);

  const adoptFlutuante = useNarracaoFlutuante((s) => s.adopt);
  const reclaimFlutuante = useNarracaoFlutuante((s) => s.reclaim);

  // Carrega o texto completo do artigo para acompanhamento
  useEffect(() => {
    let active = true;
    setLoadingTexto(true);
    setTextoArtigo(null);

    buscarArtigoTexto(artigo.tabelaNome, artigo.artigoNumero).then((res) => {
      if (!active) return;
      setTextoArtigo(res);
      setLoadingTexto(false);
    });

    return () => {
      active = false;
    };
  }, [artigo.tabelaNome, artigo.artigoNumero]);

  // Configura e inicia o áudio (reaproveitando instância do player flutuante se for o mesmo artigo)
  useEffect(() => {
    const key = `${artigo.tabelaNome}_${artigo.artigoNumero}`;
    const reclaimed = reclaimFlutuante(key);
    const audio = reclaimed || new Audio(artigo.audioUrl);
    audio.playbackRate = speed;
    audioRef.current = audio;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTime = () => setCurrentTime(audio.currentTime || 0);
    const handleMeta = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (hasNext && onNext) {
        onNext();
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTime);
    audio.addEventListener('loadedmetadata', handleMeta);
    audio.addEventListener('ended', handleEnded);

    if (!reclaimed) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(!audio.paused);
      if (audio.duration) setDuration(audio.duration);
      setCurrentTime(audio.currentTime || 0);
    }

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTime);
      audio.removeEventListener('loadedmetadata', handleMeta);
      audio.removeEventListener('ended', handleEnded);

      if (!audio.paused && !audio.ended) {
        adoptFlutuante({
          audio,
          artigo: textoArtigo || {
            id: key,
            numero: artigo.artigoNumero,
            caput: `Art. ${artigo.artigoNumero} — ${artigo.leiNome}`,
          },
          tabelaNome: artigo.tabelaNome,
          leiNome: artigo.leiNome,
          returnPath: `/audioleis/${artigo.leiId}`,
        });
      } else {
        try {
          audio.pause();
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artigo.audioUrl, artigo.tabelaNome, artigo.artigoNumero]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    haptic.selection();
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const cycleSpeed = () => {
    const nextIdx = (SPEEDS.indexOf(speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length;
    const nextSpeed = SPEEDS[nextIdx];
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
    haptic.selection();
  };

  const cycleFontSize = () => {
    setFontSize((prev) => (prev === 'sm' ? 'base' : prev === 'base' ? 'lg' : 'sm'));
    haptic.selection();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const abrirNoVadeMecum = () => {
    haptic.selection();
    const slug = leiToSlug({ id: artigo.leiId, nome: artigo.leiNome });
    navigate(`/legislacao/${tipoToSlug(artigo.leiTipo)}/${slug}/${encodeURIComponent(artigo.artigoNumero)}`);
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const textSizeClass =
    fontSize === 'sm'
      ? 'text-[14px] leading-relaxed'
      : fontSize === 'lg'
        ? 'text-[18px] leading-loose'
        : 'text-[16px] leading-relaxed';

  return (
    <div
      className={`flex flex-col bg-[#0d0f12]/95 border border-white/10 backdrop-blur-xl ${
        isModal
          ? 'fixed inset-0 z-50 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]'
          : 'rounded-2xl h-[620px] overflow-hidden shadow-2xl'
      }`}
    >
      {/* Header compacto */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 shrink-0">
        <div className="min-w-0 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">
                {artigo.leiSigla}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-sm font-bold text-white truncate">
                Art. {artigo.artigoNumero}
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate">{artigo.leiNome}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={cycleFontSize}
            title="Tamanho do texto"
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={abrirNoVadeMecum}
            title="Abrir no Vade Mecum"
            className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 flex items-center gap-1.5 text-xs font-semibold text-zinc-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Vade Mecum</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar leitor"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Área de leitura acompanhada do artigo */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {loadingTexto ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
            <span className="text-xs">Carregando texto do artigo...</span>
          </div>
        ) : textoArtigo ? (
          <article className="space-y-4 max-w-2xl mx-auto">
            {(textoArtigo.epigrafe || textoArtigo.nomen_juris) && (
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-300/90">
                {textoArtigo.epigrafe || textoArtigo.nomen_juris}
              </div>
            )}

            <p className={`text-zinc-100 font-medium ${textSizeClass}`}>
              <span className="font-bold text-purple-300 mr-2">
                Art. {textoArtigo.numero}
              </span>
              {textoArtigo.caput}
            </p>

            {Array.isArray(textoArtigo.incisos) && textoArtigo.incisos.length > 0 && (
              <div className="space-y-2.5 pl-3 border-l border-white/10">
                {textoArtigo.incisos.map((inc, idx) => (
                  <p key={idx} className={`text-zinc-300 ${textSizeClass}`}>
                    {inc}
                  </p>
                ))}
              </div>
            )}

            {Array.isArray(textoArtigo.paragrafos) && textoArtigo.paragrafos.length > 0 && (
              <div className="space-y-3 pt-1">
                {textoArtigo.paragrafos.map((par, idx) => (
                  <p key={idx} className={`text-zinc-300 ${textSizeClass}`}>
                    {par}
                  </p>
                ))}
              </div>
            )}
          </article>
        ) : (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-zinc-400">
              Texto detalhado não localizado na base local desta lei.
            </p>
            <button
              type="button"
              onClick={abrirNoVadeMecum}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Abrir lei completa no Vade Mecum
            </button>
          </div>
        )}
      </div>

      {/* Controles de áudio minimalistas */}
      <div className="px-4 py-3.5 border-t border-white/10 bg-zinc-950/90 shrink-0 space-y-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
            {formatarDuracao(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              aria-label="Progresso da narração"
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/15 accent-purple-500"
              style={{
                background: `linear-gradient(to right, #a855f7 ${progressPct}%, rgba(255,255,255,0.12) ${progressPct}%)`,
              }}
            />
          </div>
          <span className="text-[11px] font-mono text-zinc-400 w-10">
            {formatarDuracao(duration)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={cycleSpeed}
            className="min-w-[48px] h-9 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-200 transition-colors"
          >
            {speed}x
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onPrev?.();
              }}
              disabled={!hasPrev}
              aria-label="Artigo anterior"
              className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar narração' : 'Reproduzir narração'}
              className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 flex items-center justify-center text-white transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onNext?.();
              }}
              disabled={!hasNext}
              aria-label="Próximo artigo"
              className="w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="min-w-[48px] text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Auto
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioleiFollowPlayer;
