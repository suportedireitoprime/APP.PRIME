import React from 'react';
import { ChevronDown, Heart, RotateCcw, RotateCw, SkipBack, SkipForward, Play, Pause, Gauge } from 'lucide-react';
import { type AulaAudio, audioIdOf } from '@/contexts/AudioaulasPlayerContext';
import { BotaoDownloadAudio } from './BotaoDownloadAudio';
import { capaDaArea, fmt, VELOCIDADES } from '@/lib/audioaulasHelper';
import { CapaOtimizada } from './CapaOtimizada';

interface AudioaulasPlayerModalProps {
  aberto: boolean;
  setAberto: (v: boolean) => void;
  atual: AulaAudio | null;
  atualIdx: number;
  fila: AulaAudio[];
  tempo: number;
  dur: number;
  tocando: boolean;
  velocidade: number;
  favoritos: Set<string>;
  alternarFavorito: (a: AulaAudio) => void;
  togglePlay: () => void;
  seek: (t: number) => void;
  pular: (dir: number) => void;
  setVelocidade: (v: number) => void;
}

export const AudioaulasPlayerModal = React.memo(function AudioaulasPlayerModal({
  aberto,
  setAberto,
  atual,
  atualIdx,
  fila,
  tempo,
  dur,
  tocando,
  velocidade,
  favoritos,
  alternarFavorito,
  togglePlay,
  seek,
  pular,
  setVelocidade
}: AudioaulasPlayerModalProps) {
  if (!atual) return null;

  return (
    <>
      <div
        onClick={() => setAberto(false)}
        aria-hidden
        className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-md transition-opacity duration-300 ${
          aberto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <div
        className={`fixed inset-0 z-[55] flex flex-col transition-all duration-300 ease-out lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-full lg:max-w-xl lg:h-[88vh] lg:max-h-[720px] lg:rounded-3xl lg:border lg:border-white/15 lg:shadow-2xl lg:shadow-black/90 lg:overflow-hidden ${
          aberto
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-full lg:translate-y-[-40%] lg:scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 -z-10 bg-zinc-950">
          <img
            src={capaDaArea(atual.area || '')}
            alt=""
            aria-hidden
            className="w-full h-full object-cover opacity-25 blur-3xl scale-150"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-zinc-950/90 to-black" />
        </div>

        {/* Header do Player */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <button
            onClick={() => setAberto(false)}
            aria-label="Minimizar player"
            className="h-11 w-11 grid place-items-center rounded-full hover:bg-white/10 text-white transition active:scale-95"
          >
            <ChevronDown className="h-6 w-6" />
          </button>
          <div className="text-center min-w-0">
            <p className="text-[11px] uppercase tracking-widest font-semibold text-primary">Em Reprodução</p>
            <p className="text-sm font-bold text-white truncate max-w-[60vw]">{atual.area}</p>
          </div>
          <div className="h-11 w-11" />
        </div>

        {/* Conteúdo Principal do Player */}
        <div className="mx-auto w-full max-w-xl flex-1 min-h-0 flex flex-col justify-center px-6 pb-12">
          <div className="relative flex items-center justify-center my-auto">
            <span className="h-52 w-52 sm:h-64 sm:w-64 rounded-3xl overflow-hidden shadow-2xl shadow-black/80 border border-white/10">
              <CapaOtimizada src={capaDaArea(atual.area || '')} alt="" animacaoEntrada />
            </span>
            <button
              onClick={() => alternarFavorito(atual)}
              aria-label={favoritos.has(audioIdOf(atual)) ? 'Remover dos favoritos' : 'Favoritar'}
              className="absolute right-2 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-black/40 backdrop-blur-md transition hover:bg-white/20 active:scale-95"
            >
              <Heart
                className={`h-6 w-6 transition ${
                  favoritos.has(audioIdOf(atual)) ? 'fill-rose-500 text-rose-500' : 'text-white'
                }`}
              />
            </button>
          </div>

          <div className="mt-4 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight line-clamp-2">
              {atual.titulo}
            </h2>
            <p className="text-sm font-medium text-primary mt-1 truncate">{atual.tema || atual.area}</p>
            {atual.descricao && (
              <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{atual.descricao}</p>
            )}
          </div>

          {/* Progresso de Áudio */}
          <div className="mt-6">
            <input
              type="range"
              min={0}
              max={dur || 0}
              step={0.1}
              value={tempo}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Progresso da aula"
              className="w-full accent-primary h-2 rounded-lg bg-white/10 cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-zinc-400 mt-1.5">
              <span>{fmt(tempo)}</span>
              <span>{fmt(dur)}</span>
            </div>
          </div>

          {/* Controles de Reprodução */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              onClick={() => seek(Math.max(0, tempo - 15))}
              aria-label="Voltar 15 segundos"
              title="Voltar 15s"
              className="h-10 w-10 grid place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:scale-95"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              onClick={() => pular(-1)}
              disabled={atualIdx <= 0}
              aria-label="Aula anterior"
              className="h-12 w-12 grid place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 transition active:scale-95"
            >
              <SkipBack className="h-6 w-6" />
            </button>

            <button
              onClick={togglePlay}
              aria-label={tocando ? 'Pausar' : 'Tocar'}
              className="h-16 w-16 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 active:scale-95 transition hover:scale-105"
            >
              {tocando ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </button>

            <button
              onClick={() => pular(1)}
              disabled={atualIdx < 0 || atualIdx >= fila.length - 1}
              aria-label="Próxima aula"
              className="h-12 w-12 grid place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 transition active:scale-95"
            >
              <SkipForward className="h-6 w-6" />
            </button>

            <button
              onClick={() => seek(Math.min(dur, tempo + 15))}
              aria-label="Avançar 15 segundos"
              title="Avançar 15s"
              className="h-10 w-10 grid place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:scale-95"
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>

          {/* Opções de Velocidade e Download */}
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-primary mr-1" />
              {VELOCIDADES.map((v) => (
                <button
                  key={v}
                  onClick={() => setVelocidade(v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    velocidade === v
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  {v}x
                </button>
              ))}
            </div>

            <BotaoDownloadAudio aula={atual} grande />
          </div>
        </div>
      </div>
    </>
  );
});
