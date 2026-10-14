import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Heart, RotateCcw, RotateCw, SkipBack, SkipForward, Play, Pause, Gauge, X, BookOpen, Scale } from 'lucide-react';
import { type AulaAudio, audioIdOf } from '@/contexts/AudioaulasPlayerContext';
import { BotaoDownloadAudio } from './BotaoDownloadAudio';
import { capaDaArea, fmt, VELOCIDADES } from '@/lib/audioaulasHelper';
import { CapaOtimizada } from './CapaOtimizada';
import { haptic } from '@/lib/nativeHaptics';
import { buscarTextoOficialArtigo } from '@/lib/audioaulasArtigoFetcher';

function extrairArtigoInfo(aula: AulaAudio) {
  const rawTitulo = (aula.titulo || '').trim();
  const area = (aula.area || '').trim();

  // 1. Identificação da Lei
  const isEca = /eca|criança|adolescente/i.test(area) || /eca/i.test(rawTitulo);
  const isOab = /oab|advocacia|eoab/i.test(area) || /oab|eoab/i.test(rawTitulo);

  let sigla = 'Legislação';
  let nomeLei = area || 'Legislação';
  let slugLei = 'eca';

  if (isEca) {
    sigla = 'ECA';
    nomeLei = 'ECA • Lei nº 8.069/1990';
    slugLei = 'eca';
  } else if (isOab) {
    sigla = 'EOAB';
    nomeLei = 'EOAB • Lei nº 8.906/1994';
    slugLei = 'estatuto-oab';
  } else if (area) {
    sigla = area;
    nomeLei = area;
    slugLei = area.toLowerCase();
  }

  // 2. Limpar prefixos indesejados (ex: "1. ECA — ", "ECA — ", "ECA - ", "EOAB - ")
  let textoBase = rawTitulo
    .replace(/^[0-9]+[. \t\-–—]+/i, '') // remove número inicial ex: "1. "
    .trim();

  // Remove qualquer prefixo de código/sigla ex: "ECA — ", "ECA - ", "CF/88 — "
  textoBase = textoBase
    .replace(/^(?:ECA|CF\/?88|CP|CPP|CC|CPC|CLT|CTN|CDC|CTB|OAB|EOAB)\s*[-–—:]\s*/i, '')
    .trim();

  // Se ainda sobrar outro prefixo duplicado (ex: "ECA - ECA"), remove novamente
  textoBase = textoBase.replace(/^(?:(?:ECA|OAB|EOAB)\s*[-–—:]\s*)+/i, '').trim();

  // 3. Extrair número do artigo e tema para formar "Art. 1: Proteção Integral"
  let numeroArtigo: string | null = null;
  let temaArtigo: string = '';

  const matchRegex = textoBase.match(/^art(?:igo|\.)?\s*([0-9]+(?:\s*[-–—]\s*[A-Za-z]+|[A-Za-z]+)?)[º°ª]?(?:\s*[-–—:]\s*(.*))?$/i);
  if (matchRegex) {
    numeroArtigo = matchRegex[1].replace(/\s+/g, '').trim();
    const resto = (matchRegex[2] || '').trim();
    if (resto) {
      temaArtigo = resto.charAt(0).toUpperCase() + resto.slice(1);
    }
  } else {
    const matchNum = rawTitulo.match(/art(?:igo|\.)?\s*([0-9]+(?:\s*[-–—]\s*[A-Za-z]+|[A-Za-z]+)?)[º°ª]?/i);
    if (matchNum) {
      numeroArtigo = matchNum[1].replace(/\s+/g, '').trim();
    }
    temaArtigo = textoBase;
  }

  // Título formatado limpo: "Art. 1: Proteção Integral"
  const tituloLimpo = numeroArtigo
    ? (temaArtigo ? `Art. ${numeroArtigo}: ${temaArtigo}` : `Art. ${numeroArtigo}`)
    : (textoBase || rawTitulo);

  // Capítulo limpo (remover Liv. I, Tít. I — e (arts. 1 a 6))
  let capituloLimpo = (aula.tema || '').trim();
  capituloLimpo = capituloLimpo.replace(/\s*\((?:arts?\.?|artigos?)\s*[^)]+\)$/i, '').trim();
  const partesTrav = capituloLimpo.split(/\s+[—–-]\s+/);
  if (partesTrav.length > 1 && /^(?:liv|t[íi]t|cap|se[çc]|parte)/i.test(partesTrav[0].trim())) {
    capituloLimpo = partesTrav.slice(1).join(' — ').trim();
  }

  return {
    numeroArtigo,
    temaArtigo,
    tituloLimpo,
    sigla,
    nomeLei,
    slugLei,
    capituloLimpo
  };
}

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
  tocandoIntro?: boolean;
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
  setVelocidade,
  tocandoIntro = false,
}: AudioaulasPlayerModalProps) {
  const [abrirArtigo, setAbrirArtigo] = useState(false);
  const [artigoCarregando, setArtigoCarregando] = useState(false);
  const [artigoTexto, setArtigoTexto] = useState<string | null>(null);
  const [artigoTituloOficial, setArtigoTituloOficial] = useState<string | null>(null);

  const artigoInfo = useMemo(() => {
    return atual ? extrairArtigoInfo(atual) : null;
  }, [atual]);

  // Resetar o estado do artigo quando mudar a aula ou fechar o modal
  useEffect(() => {
    if (!aberto) setAbrirArtigo(false);
  }, [aberto, atual]);

  // Carregar o texto oficial da lei seca do artigo quando abrir o modal de artigo
  useEffect(() => {
    if (!abrirArtigo || !atual || !artigoInfo) return;

    if (!artigoInfo.numeroArtigo) {
      setArtigoTexto(atual.descricao || 'Consulte o artigo completo no Vade Mecum.');
      setArtigoTituloOficial(artigoInfo.tituloLimpo);
      return;
    }

    let cancel = false;
    setArtigoCarregando(true);

    (async () => {
      try {
        const termoLei = artigoInfo.slugLei || artigoInfo.sigla || atual.area || 'eca';
        const resOficial = await buscarTextoOficialArtigo(termoLei, artigoInfo.numeroArtigo);

        if (!cancel) {
          if (resOficial?.texto) {
            setArtigoTexto(resOficial.texto);
            setArtigoTituloOficial(`Art. ${resOficial.numero}º`);
          } else {
            setArtigoTexto(atual.descricao || 'Consulte o artigo completo no Vade Mecum.');
            setArtigoTituloOficial(artigoInfo.tituloLimpo);
          }
          setArtigoCarregando(false);
        }
      } catch (err) {
        if (!cancel) {
          console.warn('Erro ao buscar artigo oficial:', err);
          setArtigoTexto(atual.descricao || 'Consulte o artigo completo no Vade Mecum.');
          setArtigoTituloOficial(artigoInfo.tituloLimpo);
          setArtigoCarregando(false);
        }
      }
    })();

    return () => { cancel = true; };
  }, [abrirArtigo, atual, artigoInfo]);

  if (!atual) return null;

  return (
    <>
      <div
        onClick={() => setAberto(false)}
        aria-hidden
        className={`fixed inset-0 z-50 bg-black/85 transition-opacity duration-300 ${
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

        {/* Header do Player — z-30 fixo para nunca ser sobreposto */}
        <div className="relative z-30 flex items-center justify-between px-4 pt-[calc(var(--sai-top,env(safe-area-inset-top,0px))+0.75rem)] pb-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setAberto(false);
            }}
            aria-label="Minimizar player"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-lg grid place-items-center transition active:scale-95 cursor-pointer z-30 shrink-0"
          >
            <ChevronDown className="w-6 h-6" strokeWidth={2.5} />
          </button>
          
          <div className="text-center min-w-0 px-2 flex-1">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-widest font-black text-primary leading-tight">
              Em Reprodução
            </p>
            <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs mx-auto mt-0.5">
              {atual.area}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              alternarFavorito(atual);
            }}
            aria-label={favoritos.has(audioIdOf(atual)) ? 'Remover dos favoritos' : 'Favoritar'}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/20 text-white shadow-lg grid place-items-center transition active:scale-95 cursor-pointer z-30 shrink-0"
          >
            <Heart
              className={`w-5 h-5 transition ${
                favoritos.has(audioIdOf(atual)) ? 'fill-rose-500 text-rose-500' : 'text-white'
              }`}
            />
          </button>
        </div>

        {/* Conteúdo Principal do Player — Scroll suave se viewport for baixa */}
        <div className="mx-auto w-full max-w-xl flex-1 min-h-0 flex flex-col justify-between overflow-y-auto px-6 py-2 pb-[calc(var(--sai-bottom,env(safe-area-inset-bottom,0px))+2rem)] lg:pb-8">
          {/* Capa Compacta e Centralizada — Sem my-auto excessivo para não sobrepor topo */}
          <div className="flex items-center justify-center shrink-0 my-2 sm:my-3">
            <span className="w-40 h-40 xs:w-44 xs:h-44 sm:w-52 sm:h-52 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/90 border border-white/15 relative">
              <CapaOtimizada src={capaDaArea(atual.area || '')} alt="" animacaoEntrada />
            </span>
          </div>

          {/* Título e Metadados da Aula — Design Despoluído e Focado (conforme solicitado pelo usuário) */}
          <div className="text-center shrink-0 space-y-2 max-w-lg mx-auto">
            {tocandoIntro && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-wider mb-1 animate-pulse">
                <span>Vinheta de Abertura</span>
              </div>
            )}

            {/* Tag da Lei (ex: ECA • Lei nº 8.069/1990) */}
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 shadow-sm">
                <Scale className="w-3.5 h-3.5 text-primary" />
                <span>{artigoInfo?.nomeLei || atual.area}</span>
              </span>
            </div>

            {/* Título do Artigo em Destaque — Tipografia Elegante (Plus Jakarta Sans) */}
            <h2 
              className="text-xl sm:text-2xl md:text-[26px] font-bold text-white tracking-tight leading-snug line-clamp-2"
              style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
            >
              {artigoInfo?.tituloLimpo || atual.titulo}
            </h2>

            {/* Capítulo Limpo */}
            {artigoInfo?.capituloLimpo && (
              <p className="text-xs sm:text-[13px] text-zinc-400 font-medium truncate max-w-sm mx-auto">
                {artigoInfo.capituloLimpo}
              </p>
            )}

            {/* Botão VER ARTIGO (conforme áudio do usuário) */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  setAbrirArtigo(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Ver Artigo</span>
              </button>
            </div>
          </div>

          {/* Progresso de Áudio */}
          <div className="shrink-0 mt-3 sm:mt-4">
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
          <div className="shrink-0 mt-3 sm:mt-4 flex items-center justify-center gap-5 sm:gap-7">
            <button
              type="button"
              onClick={() => seek(Math.max(0, tempo - 15))}
              aria-label="Voltar 15 segundos"
              title="Voltar 15s"
              className="h-10 w-10 grid place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:opacity-70"
            >
              <RotateCcw className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => pular(-1)}
              disabled={atualIdx <= 0}
              aria-label="Aula anterior"
              className="h-12 w-12 grid place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 transition active:opacity-70"
            >
              <SkipBack className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              aria-label={tocando ? 'Pausar' : 'Tocar'}
              className="h-16 w-16 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 active:opacity-70 transition hover:scale-105"
            >
              {tocando ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
            </button>

            <button
              type="button"
              onClick={() => pular(1)}
              disabled={atualIdx < 0 || atualIdx >= fila.length - 1}
              aria-label="Próxima aula"
              className="h-12 w-12 grid place-items-center rounded-full text-white hover:bg-white/10 disabled:opacity-30 transition active:opacity-70"
            >
              <SkipForward className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={() => seek(Math.min(dur, tempo + 15))}
              aria-label="Avançar 15 segundos"
              title="Avançar 15s"
              className="h-10 w-10 grid place-items-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white transition active:opacity-70"
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>

          {/* Opções de Velocidade e Download */}
          <div className="shrink-0 mt-3 sm:mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            <div className="flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-primary mr-1" />
              {VELOCIDADES.map((v) => (
                <button
                  type="button"
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

        {/* Bottom Sheet do Artigo (desliza de baixo para cima ao clicar em VER ARTIGO) */}
        <div 
          className={`absolute inset-x-0 bottom-0 z-50 bg-zinc-950/98 backdrop-blur-2xl border-t border-white/10 p-5 sm:p-6 shadow-[0_-25px_60px_rgba(0,0,0,0.9)] rounded-t-3xl transition-transform duration-300 ease-out flex flex-col ${
            abrirArtigo ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
          }`}
          style={{ maxHeight: '82%', height: '82%' }}
        >
          {/* Barra de arrasto visual */}
          <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-3 shrink-0" />

          {/* Cabeçalho do Bottom Sheet */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="min-w-0 pr-3">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                {artigoInfo?.nomeLei || atual.area}
              </span>
              <h3 
                className="text-base sm:text-lg font-bold text-white leading-tight mt-0.5 truncate"
                style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
              >
                {artigoTituloOficial && artigoInfo?.temaArtigo
                  ? `${artigoTituloOficial}: ${artigoInfo.temaArtigo}`
                  : artigoInfo?.tituloLimpo || atual.titulo}
              </h3>
            </div>
            <button 
              onClick={() => {
                haptic.selection();
                setAbrirArtigo(false);
              }}
              aria-label="Fechar artigo"
              className="h-9 w-9 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition shrink-0 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Conteúdo do Artigo com tipografia jurídica e scroll suave */}
          <div className="overflow-y-auto flex-1 py-4 custom-scrollbar space-y-4">
            {artigoCarregando ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold">Carregando texto oficial do artigo...</p>
              </div>
            ) : (
              <div className="p-4 sm:p-6 rounded-2xl bg-white/[0.04] border border-white/10 space-y-4">
                <p 
                  className="text-sm sm:text-base text-zinc-100 leading-relaxed sm:leading-loose whitespace-pre-line text-justify selection:bg-primary/30"
                  style={{ fontFamily: "'Literata', Georgia, serif" }}
                >
                  {artigoTexto}
                </p>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span>✓</span> Texto compilado oficial da Lei Seca
                  </span>
                  <span className="text-primary font-semibold">{artigoInfo?.sigla || 'Legislação'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
});
