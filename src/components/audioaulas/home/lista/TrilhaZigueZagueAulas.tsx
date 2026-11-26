import React from 'react';
import { Check, CheckCircle2, Clock, Headphones, Heart, Pause, Play, Zap } from 'lucide-react';
import { BotaoDownloadAudio } from '../BotaoDownloadAudio';
import { type AulaAudio, audioIdOf } from '@/contexts/AudioaulasPlayerContext';
import type { ProgressoAulaItem } from '@/lib/audioaulaProgresso';
import { getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';
import {
  EqualizadorAnimado,
  formatarTempoSegundos,
  formatarTituloAula,
} from './audioaulasListaUtils';

export interface TrilhaZigueZagueAulasProps {
  aulas: AulaAudio[];
  atualId: number | null;
  tocando: boolean;
  tempoAtual: number;
  duracaoAtual: number;
  velocidade: number;
  setVelocidade: (rate: number) => void;
  coverUrl: string;
  palette: ReturnType<typeof getAreaThemePalette>;
  favoritos: Set<string>;
  mapaProgresso: Record<number, ProgressoAulaItem>;
  alternarFavorito: (a: AulaAudio) => void;
  handleTocarAula: (a: AulaAudio) => void;
  alternarConcluida: (id: number) => void;
}

export const TrilhaZigueZagueAulas = React.memo(function TrilhaZigueZagueAulas({
  aulas,
  atualId,
  tocando,
  tempoAtual,
  duracaoAtual,
  velocidade,
  setVelocidade,
  coverUrl,
  palette,
  favoritos,
  mapaProgresso,
  alternarFavorito,
  handleTocarAula,
  alternarConcluida,
}: TrilhaZigueZagueAulasProps) {
  return (
    <div className="relative py-4 sm:py-8 w-full min-w-0 max-w-full overflow-hidden">
      <div className="w-full min-w-0 relative z-[2] flex flex-col">
        {aulas.map((a, i) => {
          const isLeft = i % 2 === 0;
          const ativo = a.id === atualId;
          const estaTocando = ativo && tocando;
          const fav = favoritos.has(audioIdOf(a));
          const numStr = (i + 1).toString().padStart(2, '0');
          const tituloFormatado = formatarTituloAula(a.titulo);

          const prog = mapaProgresso[a.id];
          const concluida = prog?.concluida ?? false;
          const duracaoTotal =
            estaTocando && duracaoAtual > 0 ? duracaoAtual : (prog?.duracao ?? 0);
          const tempoOuvido = estaTocando ? tempoAtual : (prog?.tempo ?? 0);
          const pct =
            estaTocando && duracaoTotal > 0
              ? Math.min(100, Math.round((tempoOuvido / duracaoTotal) * 100))
              : (prog?.pct ?? 0);
          const duracaoEstimadaMin = Math.max(5, Math.round((duracaoTotal || 600) / 60));

          return (
            <div key={a.id} className="w-full flex flex-col">
              <div
                className={cn(
                  'relative z-10 flex w-full items-center justify-between gap-2 xs:gap-3 sm:gap-6 md:gap-8 px-2 sm:px-6 md:px-10 max-w-3xl lg:max-w-4xl mx-auto group',
                  isLeft ? 'flex-row' : 'flex-row-reverse',
                )}
              >
                {/* Deck aberto em leque */}
                <div
                  onClick={() => {
                    haptic.selection();
                    handleTocarAula(a);
                  }}
                  className="relative shrink-0 w-[140px] xs:w-[155px] sm:w-[185px] md:w-[210px] h-[195px] xs:h-[215px] sm:h-[240px] md:h-[265px] cursor-pointer select-none transition-transform duration-300 active:scale-[0.97] hover:-translate-y-1.5"
                >
                  <div
                    className={cn(
                      'absolute inset-0 rounded-2xl border border-white/10 opacity-40 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden',
                      isLeft
                        ? 'scale-[0.88] rotate-[6deg] translate-x-3 sm:translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:rotate-[8deg] group-hover:translate-x-5 group-hover:-translate-y-3'
                        : 'scale-[0.88] -rotate-[6deg] -translate-x-3 sm:-translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:-rotate-[8deg] group-hover:-translate-x-5 group-hover:-translate-y-3',
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: '0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />
                    <div className="absolute inset-1.5 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden z-[2]">
                      <div
                        className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                        style={{ borderColor: palette.primary }}
                      >
                        <Headphones className="w-4 h-4 text-white/60" />
                      </div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                    </div>
                  </div>

                  <div
                    className={cn(
                      'absolute inset-0 rounded-2xl border border-white/15 opacity-75 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden',
                      isLeft
                        ? 'scale-[0.94] rotate-[3deg] translate-x-1.5 sm:translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:rotate-[4deg] group-hover:translate-x-3 group-hover:-translate-y-2'
                        : 'scale-[0.94] -rotate-[3deg] -translate-x-1.5 sm:-translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:-rotate-[4deg] group-hover:-translate-x-3 group-hover:-translate-y-2',
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: '0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />
                    <div className="absolute inset-1.5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden z-[2]">
                      <div
                        className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center opacity-30"
                        style={{ borderColor: palette.primary }}
                      >
                        <Headphones className="w-4 h-4 text-white/60" />
                      </div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:8px_8px] pointer-events-none" />
                    </div>
                  </div>

                  <div
                    className={cn(
                      'relative w-full h-full p-2.5 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border transition-all duration-300 origin-bottom',
                      isLeft
                        ? 'group-hover:-rotate-[1deg] group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]'
                        : 'group-hover:rotate-[1deg] group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)] group-hover:shadow-[0_22px_45px_rgba(0,0,0,0.85)]',
                      ativo
                        ? 'border-primary ring-2 ring-primary/40 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                        : 'border-white/30 hover:border-primary/60',
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: ativo ? `0 0 25px ${palette.primary}` : palette.shadow,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />
                    <div className="absolute inset-1 rounded-[14px] border border-white/15 pointer-events-none z-10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-10" />

                    <img
                      src={coverUrl}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="pointer-events-none absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 select-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12]/95 via-black/25 to-[#0d0f12]/60 pointer-events-none z-0" />

                    <div className="my-auto py-2 z-[1] w-full flex items-center justify-center">
                      <div className="relative flex items-center justify-center">
                        <div
                          className={cn(
                            'absolute inset-0 rounded-full blur-md transition-opacity duration-300 scale-125 pointer-events-none',
                            estaTocando ? 'opacity-100 animate-pulse' : 'opacity-0 group-hover:opacity-100',
                          )}
                          style={{ backgroundColor: `${palette.primary}60` }}
                        />
                        <div
                          className={cn(
                            'relative w-11 h-11 sm:w-13 sm:h-13 rounded-full backdrop-blur-md border flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110',
                            estaTocando
                              ? 'bg-gradient-to-tr from-[#ff6b4a] to-[#ffa285] border-[#ffa285] text-white shadow-[0_0_24px_rgba(255,107,74,0.7)]'
                              : 'bg-black/60 border-white/30 text-white group-hover:border-[#ffa285] group-hover:bg-[#ff6b4a] group-hover:text-white group-hover:shadow-[0_0_22px_rgba(255,107,74,0.6)]',
                          )}
                        >
                          {estaTocando ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current translate-x-0.5 transition-colors" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="z-[1] pt-1.5 sm:pt-2 border-t border-white/20 w-full px-0.5">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-normal text-white/95 mb-1 sm:mb-1.5">
                        <span className="truncate flex items-center gap-1.5">
                          {estaTocando ? (
                            <EqualizadorAnimado cor={concluida ? '#10b981' : palette.primary} />
                          ) : (
                            <Headphones className="w-3 h-3 text-primary" />
                          )}
                          <span>
                            {concluida
                              ? 'Concluída'
                              : estaTocando
                                ? 'Em reprodução'
                                : pct > 0
                                  ? `Ouvido ${pct}%`
                                  : 'Áudio aula'}
                          </span>
                        </span>
                        <span
                          className={cn(
                            'font-semibold font-sans ml-1',
                            concluida ? 'text-emerald-400' : 'text-white',
                          )}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-black/50 h-1.5 sm:h-2 rounded-full overflow-hidden border border-white/20">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500 shadow-sm',
                            concluida ? 'bg-emerald-400' : '',
                          )}
                          style={{
                            width: `${Math.max(pct, estaTocando || pct > 0 ? 8 : 0)}%`,
                            backgroundColor: concluida ? undefined : palette.primary,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conector e Título / Métricas no lado oposto */}
                <div
                  className={cn(
                    'flex-1 min-w-0 flex items-center select-none py-2 transition-all',
                    isLeft
                      ? 'flex-row pl-1.5 xs:pl-2 sm:pl-3'
                      : 'flex-row-reverse pr-1.5 xs:pr-2 sm:pr-3',
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center shrink-0 w-6 xs:w-8 sm:w-12 md:w-16',
                      isLeft ? 'flex-row' : 'flex-row-reverse',
                    )}
                  >
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white/70 shrink-0 transition-transform duration-300 group-hover:scale-125"
                      style={{
                        backgroundColor: palette.primary,
                        boxShadow: `0 0 8px ${palette.primary}`,
                      }}
                    />
                    <div
                      className="flex-1 h-[1px] transition-all duration-300 group-hover:h-[1.5px]"
                      style={{
                        background: isLeft
                          ? `linear-gradient(to right, ${palette.primary}, rgba(255,255,255,0.3), transparent)`
                          : `linear-gradient(to left, ${palette.primary}, rgba(255,255,255,0.3), transparent)`,
                      }}
                    />
                  </div>

                  <div
                    className={cn(
                      'flex-1 min-w-0 flex flex-col justify-center px-1.5 xs:px-2.5 sm:px-4 transition-transform duration-300 group-hover:-translate-y-0.5',
                      isLeft ? 'items-start text-left' : 'items-end text-right',
                    )}
                  >
                    <div
                      className={cn(
                        'flex flex-wrap items-center gap-1.5 mb-1 opacity-95',
                        isLeft ? 'justify-start' : 'justify-end',
                      )}
                    >
                      <span
                        className="text-[11px] sm:text-[13px] font-extrabold uppercase tracking-wider"
                        style={{ color: palette.primary }}
                      >
                        AULA {numStr}
                      </span>

                      <span className="w-1 h-1 rounded-full bg-white/25" />

                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                        <Clock className="w-2.5 h-2.5 text-zinc-400" />
                        <span>~{duracaoEstimadaMin} min</span>
                      </span>

                      {concluida ? (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Ouvida</span>
                        </span>
                      ) : estaTocando ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-primary bg-primary/20 border border-primary/30 px-2.5 py-0.5 rounded-full shadow-sm">
                          <EqualizadorAnimado cor={palette.primary} />
                          <span>Tocando agora</span>
                        </span>
                      ) : pct > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>{pct}% ouvido</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          <span>Pendente</span>
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => {
                        haptic.selection();
                        handleTocarAula(a);
                      }}
                      className={cn(
                        'font-sans font-normal text-[16px] xs:text-[18px] sm:text-[20px] md:text-[22px] lg:text-[23px] leading-[1.3] break-words transition-colors drop-shadow-md cursor-pointer',
                        ativo ? 'text-primary' : 'text-zinc-100 group-hover:text-amber-200',
                      )}
                    >
                      {tituloFormatado}
                    </h3>

                    <div
                      className={cn(
                        'w-full max-w-65 mt-2 space-y-1',
                        isLeft ? 'text-left' : 'text-right ml-auto',
                      )}
                    >
                      <div
                        className={cn(
                          'flex items-center gap-2 text-[11px] text-zinc-400',
                          isLeft ? 'justify-start' : 'justify-end',
                        )}
                      >
                        {estaTocando && duracaoTotal > 0 ? (
                          <span className="text-primary font-mono font-medium">
                            {formatarTempoSegundos(tempoOuvido)} /{' '}
                            {formatarTempoSegundos(duracaoTotal)} ({pct}%)
                          </span>
                        ) : concluida ? (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Áudio 100% concluído
                          </span>
                        ) : pct > 0 ? (
                          <span className="text-amber-300 font-medium">
                            {formatarTempoSegundos(tempoOuvido)} ouvido ({pct}%)
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-light">
                            Não iniciada • Toque para reproduzir
                          </span>
                        )}
                      </div>

                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            concluida ? 'bg-emerald-400' : '',
                          )}
                          style={{
                            width: `${Math.max(pct, estaTocando || pct > 0 ? 5 : 0)}%`,
                            backgroundColor: concluida ? undefined : palette.primary,
                          }}
                        />
                      </div>
                    </div>

                    <div
                      className={cn(
                        'flex items-center gap-2 mt-3 pt-1 flex-wrap',
                        isLeft ? 'justify-start' : 'justify-end',
                      )}
                    >
                      <button
                        onClick={() => {
                          haptic.impact('light');
                          handleTocarAula(a);
                        }}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm',
                          estaTocando
                            ? 'bg-primary text-primary-foreground shadow-primary/30'
                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20',
                        )}
                      >
                        {estaTocando ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pausar</span>
                          </>
                        ) : pct > 0 && !concluida ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            <span>Continuar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                            <span>Ouvir</span>
                          </>
                        )}
                      </button>

                      {ativo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            haptic.impact('light');
                            const next =
                              velocidade === 1
                                ? 1.25
                                : velocidade === 1.25
                                  ? 1.5
                                  : velocidade === 1.5
                                    ? 2
                                    : 1;
                            setVelocidade(next);
                          }}
                          className="h-8 px-2.5 rounded-xl flex items-center gap-1 text-xs font-bold transition active:scale-95 bg-white/5 hover:bg-white/10 text-amber-300 border border-white/10"
                          title="Alterar velocidade de reprodução (1x, 1.25x, 1.5x, 2x)"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>{velocidade}x</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic.selection();
                          alternarConcluida(a.id);
                        }}
                        title={concluida ? 'Marcar como não ouvida' : 'Marcar como ouvida'}
                        className={cn(
                          'h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition active:scale-95 border',
                          concluida
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10',
                        )}
                      >
                        <CheckCircle2
                          className={cn('w-3.5 h-3.5', concluida ? 'text-emerald-400' : 'text-zinc-500')}
                        />
                        <span className="hidden xs:inline">
                          {concluida ? 'Concluída' : 'Concluir'}
                        </span>
                      </button>

                      <BotaoDownloadAudio aula={a} />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alternarFavorito(a);
                        }}
                        aria-label={fav ? 'Remover dos favoritos' : 'Favoritar'}
                        className="h-8 w-8 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10 active:scale-90 transition text-zinc-400 hover:text-white border border-white/10"
                      >
                        <Heart className={`h-4 w-4 ${fav ? 'fill-rose-400 text-rose-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {i < aulas.length - 1 && (
                <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto h-16 sm:h-20 -my-1.5 sm:-my-2 pointer-events-none z-5 overflow-visible">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <filter id={`trail-glow-aula-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <path
                      d={isLeft ? 'M 30 0 C 30 65, 70 35, 70 100' : 'M 70 0 C 70 65, 30 35, 30 100'}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      d={isLeft ? 'M 30 0 C 30 65, 70 35, 70 100' : 'M 70 0 C 70 65, 30 35, 30 100'}
                      fill="none"
                      stroke={palette.primary}
                      strokeWidth="2.5"
                      strokeDasharray="5 7"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      filter={`url(#trail-glow-aula-${i})`}
                    />
                  </svg>

                  <div
                    className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-white/70 bg-white shadow-lg"
                    style={{
                      left: '50%',
                      top: '50%',
                      boxShadow: `0 0 10px ${palette.primary}`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
