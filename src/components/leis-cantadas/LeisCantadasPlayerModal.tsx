import React from 'react';
import {
  ChevronDown,
  Heart,
  Mic2,
  FileText,
  Minus,
  Plus,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Check,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { VideoCapa, VIDEO_URL, POSTER_URL } from '@/components/leis-cantadas/VideoCapa';
import { LeiCantada } from '@/lib/leisCantadasApi';
import { baixarBlob } from '@/lib/nativo';
import { suportaAudioOffline } from '@/lib/nativo/audioOffline';
import { fmt } from './leisCantadasUtils';

interface LeisCantadasPlayerModalProps {
  atual: LeiCantada | null;
  aberto: boolean;
  setAberto: (aberto: boolean) => void;
  favoritos: Set<string>;
  alternarFavorito: (id: string) => void;
  aba: 'karaoke' | 'letra';
  setAba: (aba: 'karaoke' | 'letra') => void;
  linhas: Array<{ texto: string; secao?: boolean }>;
  linhaAtiva: number;
  linhaRef: React.RefObject<HTMLParagraphElement>;
  resumoFontSize: number;
  setResumoFontSize: React.Dispatch<React.SetStateAction<number>>;
  artigoFontSize: number;
  setArtigoFontSize: React.Dispatch<React.SetStateAction<number>>;
  temRedacao: boolean;
  revelarRedacao: boolean;
  setRevelarRedacao: React.Dispatch<React.SetStateAction<boolean>>;
  planaltoUrl: string | null;
  carregandoArtigo: boolean;
  artigoTexto: string | null;
  dur: number;
  tempo: number;
  seek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pular: (delta: number) => void;
  tocar: (f?: LeiCantada) => void;
  tocando: boolean;
  curtir: () => void;
  curtidas: Set<string>;
  naoCurtidas: Set<string>;
  setNaoCurtidas: React.Dispatch<React.SetStateAction<Set<string>>>;
  likes: (id: string) => number;
  compartilhar: () => void;
  alternarDownload: () => Promise<void>;
  baixando: boolean;
  baixado: boolean;
}

export function LeisCantadasPlayerModal({
  atual,
  aberto,
  setAberto,
  favoritos,
  alternarFavorito,
  aba,
  setAba,
  linhas,
  linhaAtiva,
  linhaRef,
  resumoFontSize,
  setResumoFontSize,
  artigoFontSize,
  setArtigoFontSize,
  temRedacao,
  revelarRedacao,
  setRevelarRedacao,
  planaltoUrl,
  carregandoArtigo,
  artigoTexto,
  dur,
  tempo,
  seek,
  pular,
  tocar,
  tocando,
  curtir,
  curtidas,
  naoCurtidas,
  setNaoCurtidas,
  likes,
  compartilhar,
  alternarDownload,
  baixando,
  baixado,
}: LeisCantadasPlayerModalProps) {
  if (!atual) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-transform duration-300 ease-out ${
        aberto ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 -z-10 bg-zinc-950">
        <video
          src={VIDEO_URL}
          poster={POSTER_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          className="w-full h-full object-cover opacity-30 blur-2xl scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-900/30 via-zinc-950/90 to-black" />
        <div className="absolute inset-0 bg-zinc-950/70" />
      </div>

      {/* topo */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button
          onClick={() => setAberto(false)}
          className="h-10 w-10 grid place-items-center rounded-full hover:bg-white/10"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
        <div className="text-center min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Tocando</p>
          <p className="text-sm font-semibold truncate max-w-[60vw]">{atual.lei_nome}</p>
        </div>
        <div className="h-10 w-10" />
      </div>

      {/* capa + conteúdo */}
      <div className="flex-1 min-h-0 flex flex-col px-5">
        <div className="relative shrink-0 flex items-center justify-center">
          <VideoCapa overlay className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl shadow-2xl shadow-black/60" />
          <button
            onClick={() => alternarFavorito(atual.id)}
            aria-label={favoritos.has(atual.id) ? 'Remover dos favoritos' : 'Favoritar'}
            title={favoritos.has(atual.id) ? 'Remover dos favoritos' : 'Favoritar'}
            className="absolute right-0 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/10 backdrop-blur transition hover:bg-white/20 active:scale-95"
          >
            <Heart
              className={`h-5 w-5 transition ${
                favoritos.has(atual.id) ? 'fill-rose-400 text-rose-400' : 'text-white/80'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 shrink-0">
          <h2 className="text-2xl font-black tracking-tight truncate">
            {atual.titulo || `Art. ${atual.numero_artigo}`}
          </h2>
          <p className="text-sm text-muted-foreground truncate">{atual.lei_nome}</p>
        </div>

        {/* abas */}
        <div className="mt-4 shrink-0 grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setAba('karaoke')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
              aba === 'karaoke' ? 'bg-sky-500 text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mic2 className="h-4 w-4" /> Karaokê
          </button>
          <button
            onClick={() => setAba('letra')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
              aba === 'letra' ? 'bg-sky-500 text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" /> {atual.slug === 'resumo' ? 'Resumo' : 'Artigo'}
          </button>
        </div>

        {/* área rolável */}
        <div className="relative flex-1 min-h-0 overflow-y-auto py-4">
          {aba === 'karaoke' ? (
            linhas.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">
                Letra ainda não cadastrada para esta música.
              </p>
            ) : (
              <div className="space-y-4 py-6 text-center px-10">
                {linhas.map((l, i) => {
                  const ativa = i === linhaAtiva;
                  const vizinha = i === linhaAtiva - 1 || i === linhaAtiva + 1;
                  const EASE = 'cubic-bezier(0.33, 1, 0.68, 1)';
                  if (l.secao) {
                    return (
                      <p
                        key={i}
                        ref={ativa ? linhaRef : undefined}
                        style={{ transitionTimingFunction: EASE }}
                        className={`pt-3 pb-1 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-[900ms] ${
                          ativa ? 'text-sky-300 opacity-100' : 'text-sky-300/40 opacity-60'
                        }`}
                      >
                        {l.texto}
                      </p>
                    );
                  }
                  return (
                    <p
                      key={i}
                      ref={ativa ? linhaRef : undefined}
                      style={{
                        transitionTimingFunction: EASE,
                        opacity: ativa ? 1 : vizinha ? 0.75 : i < linhaAtiva ? 0.32 : 0.45,
                        filter: ativa ? 'blur(0px)' : vizinha ? 'blur(0.4px)' : 'blur(1.4px)',
                        transform: ativa
                          ? 'translateY(0) scale(1.05)'
                          : i === linhaAtiva - 1
                          ? 'translateY(-2px) scale(0.98)'
                          : i === linhaAtiva + 1
                          ? 'translateY(2px) scale(0.98)'
                          : 'translateY(0) scale(0.94)',
                      }}
                      className={`transition-[transform,opacity,filter,color,text-shadow] duration-[900ms] leading-relaxed will-change-[transform,opacity,filter] ${
                        ativa
                          ? 'text-2xl font-extrabold text-white [text-shadow:0_0_24px_rgba(125,211,252,0.5)]'
                          : vizinha
                          ? 'text-base text-white/70'
                          : 'text-sm text-white/45'
                      }`}
                    >
                      {l.texto}
                    </p>
                  );
                })}
              </div>
            )
          ) : atual.slug === 'resumo' ? (
            <div className="w-full max-w-full">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-sky-300 break-words">Resumo</p>
                  <p className="mt-0.5 text-[13px] text-white/70 truncate">{atual.titulo}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => setResumoFontSize((s) => Math.max(13, s - 1))}
                    aria-label="Diminuir fonte"
                    title="Diminuir fonte"
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] tabular-nums text-muted-foreground w-6 text-center">
                    {resumoFontSize}
                  </span>
                  <button
                    onClick={() => setResumoFontSize((s) => Math.min(28, s + 1))}
                    aria-label="Aumentar fonte"
                    title="Aumentar fonte"
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  {atual.resumo_texto && (
                    <button
                      onClick={() => {
                        const nome = `${
                          (atual.titulo || 'resumo').replace(/[^a-z0-9À-ÿ\- ]/gi, '').trim() || 'resumo'
                        }.md`;
                        const blob = new Blob([atual.resumo_texto || ''], {
                          type: 'text/markdown;charset=utf-8',
                        });
                        void baixarBlob(blob, nome, { titulo: atual.titulo || 'Resumo' });
                      }}
                      aria-label="Baixar resumo"
                      title="Baixar resumo"
                      className="grid h-9 w-9 place-items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              {atual.resumo_texto ? (
                <div
                  className="resumo-markdown text-white/90 [overflow-wrap:anywhere]"
                  style={{ fontSize: `${resumoFontSize}px`, lineHeight: 1.7 }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      h1: ({ node, ...p }) => (
                        <h1 className="mt-2 mb-3 text-2xl font-black tracking-tight text-white" {...p} />
                      ),
                      h2: ({ node, ...p }) => (
                        <h2 className="mt-5 mb-2 text-xl font-extrabold text-sky-300" {...p} />
                      ),
                      h3: ({ node, ...p }) => (
                        <h3 className="mt-4 mb-2 text-lg font-bold text-fuchsia-300" {...p} />
                      ),
                      h4: ({ node, ...p }) => (
                        <h4 className="mt-3 mb-1.5 text-base font-bold text-white/90" {...p} />
                      ),
                      p: ({ node, ...p }) => <p className="my-2.5 leading-relaxed text-white/90" {...p} />,
                      ul: ({ node, ...p }) => (
                        <ul className="my-2.5 ml-5 list-disc space-y-1 marker:text-sky-400" {...p} />
                      ),
                      ol: ({ node, ...p }) => (
                        <ol className="my-2.5 ml-5 list-decimal space-y-1 marker:text-sky-400" {...p} />
                      ),
                      li: ({ node, ...p }) => <li className="pl-1" {...p} />,
                      strong: ({ node, ...p }) => <strong className="font-bold text-white" {...p} />,
                      em: ({ node, ...p }) => <em className="italic text-white/85" {...p} />,
                      blockquote: ({ node, ...p }) => (
                        <blockquote
                          className="my-3 border-l-2 border-sky-400/60 bg-white/5 px-3 py-1.5 italic text-white/85"
                          {...p}
                        />
                      ),
                      code: ({ node, className, ...p }) => (
                        <code
                          className={`rounded bg-white/10 px-1.5 py-0.5 text-[0.9em] text-fuchsia-200 ${
                            className ?? ''
                          }`}
                          {...p}
                        />
                      ),
                      hr: () => <hr className="my-4 border-white/10" />,
                      table: ({ node, ...p }) => (
                        <div className="my-3 overflow-x-auto rounded-lg border border-white/10">
                          <table className="w-full text-sm" {...p} />
                        </div>
                      ),
                      th: ({ node, ...p }) => (
                        <th className="bg-white/5 px-3 py-2 text-left font-semibold text-white" {...p} />
                      ),
                      td: ({ node, ...p }) => (
                        <td className="border-t border-white/10 px-3 py-2 align-top text-white/85" {...p} />
                      ),
                      a: ({ node, ...p }) => (
                        <a
                          className="text-sky-300 underline decoration-sky-400/50 underline-offset-2 hover:text-sky-200"
                          target="_blank"
                          rel="noopener noreferrer"
                          {...p}
                        />
                      ),
                    }}
                  >
                    {atual.resumo_texto}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                  <FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    O resumo escrito ainda não foi cadastrado para este tema.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full max-w-full">
              <div className="mb-3 flex items-start justify-between gap-3">
                <p className="min-w-0 text-xs font-bold uppercase tracking-widest text-sky-300 break-words">
                  Artigo {atual.numero_artigo ?? ''}
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => setArtigoFontSize((s) => Math.max(13, s - 1))}
                    aria-label="Diminuir fonte"
                    title="Diminuir fonte"
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] tabular-nums text-muted-foreground w-6 text-center">
                    {artigoFontSize}
                  </span>
                  <button
                    onClick={() => setArtigoFontSize((s) => Math.min(28, s + 1))}
                    aria-label="Aumentar fonte"
                    title="Aumentar fonte"
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  {temRedacao && (
                    <button
                      onClick={() => setRevelarRedacao((v) => !v)}
                      aria-label={revelarRedacao ? 'Ocultar redação dada' : 'Revelar redação dada'}
                      title={revelarRedacao ? 'Ocultar redação dada' : 'Revelar redação dada'}
                      className={`grid h-9 w-9 place-items-center rounded-full border transition ${
                        revelarRedacao
                          ? 'border-sky-400/40 bg-sky-500/20 text-sky-300'
                          : 'border-white/10 bg-white/5 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {revelarRedacao ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  )}
                  {planaltoUrl && (
                    <a
                      href={planaltoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Ver no Planalto"
                      title="Ver no Planalto"
                      className="grid h-9 w-9 place-items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
              {carregandoArtigo ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando artigo...
                </div>
              ) : artigoTexto ? (
                <div
                  className="[overflow-wrap:anywhere]"
                  style={{ fontSize: `${artigoFontSize}px`, lineHeight: 1.75 }}
                >
                  <span className="block text-white/90 whitespace-pre-line leading-relaxed">
                    {artigoTexto}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Texto do artigo indisponível.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* controles (somente no Karaokê) */}
      {aba === 'karaoke' && (
        <div className="shrink-0 px-5 pb-8 pt-2">
          <input
            type="range"
            min={0}
            max={dur || 0}
            value={tempo}
            onChange={seek}
            className="w-full accent-sky-500 h-1.5 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
            <span>{fmt(tempo)}</span>
            <span>{fmt(dur)}</span>
          </div>
          <div className="flex items-center justify-center gap-8 mt-3">
            <button
              onClick={() => pular(-1)}
              className="h-12 w-12 grid place-items-center rounded-full hover:bg-white/10"
            >
              <SkipBack className="h-6 w-6" />
            </button>
            <button
              onClick={() => tocar(atual)}
              className="h-16 w-16 grid place-items-center rounded-full bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-900/50"
            >
              {tocando ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
            </button>
            <button
              onClick={() => pular(1)}
              className="h-12 w-12 grid place-items-center rounded-full hover:bg-white/10"
            >
              <SkipForward className="h-6 w-6" />
            </button>
          </div>

          {/* ações: curtir, não curtir, compartilhar */}
          <div className="flex items-center justify-center gap-10 mt-5">
            <button
              onClick={curtir}
              className={`flex flex-col items-center gap-1 text-[11px] transition ${
                curtidas.has(atual.id) ? 'text-sky-400' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ThumbsUp className={`h-6 w-6 ${curtidas.has(atual.id) ? 'fill-sky-400' : ''}`} />
              {likes(atual.id) > 0 ? likes(atual.id) : 'Curtir'}
            </button>
            <button
              onClick={() =>
                setNaoCurtidas((s) => {
                  const n = new Set(s);
                  n.has(atual.id) ? n.delete(atual.id) : n.add(atual.id);
                  return n;
                })
              }
              className={`flex flex-col items-center gap-1 text-[11px] transition ${
                naoCurtidas.has(atual.id) ? 'text-sky-400' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ThumbsDown className={`h-6 w-6 ${naoCurtidas.has(atual.id) ? 'fill-sky-400' : ''}`} />
              Não curtir
            </button>
            <button
              onClick={compartilhar}
              className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition"
            >
              <Share2 className="h-6 w-6" />
              Compartilhar
            </button>
            {suportaAudioOffline() && (
              <button
                onClick={() => void alternarDownload()}
                disabled={baixando}
                className={`flex flex-col items-center gap-1 text-[11px] transition disabled:opacity-60 ${
                  baixado ? 'text-emerald-400' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {baixando ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : baixado ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Download className="h-6 w-6" />
                )}
                {baixado ? 'Baixado' : 'Baixar'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
