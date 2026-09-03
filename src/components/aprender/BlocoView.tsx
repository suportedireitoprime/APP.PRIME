import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Scale, Sparkles, Check, XCircle, RotateCw, CheckCircle2, ArrowRight, Lightbulb, Flag } from 'lucide-react';
import { Bloco, iconePorTipo, isBlocoTexto, rotuloPorTipo } from '@/lib/aprenderUtils';
import { LeituraBlock } from '@/components/aprender/blocos/LeituraBlock';
import { CheckpointBlock } from '@/components/aprender/blocos/CheckpointBlock';
import { RecapBlock } from '@/components/aprender/blocos/RecapBlock';
import { MapaConceitualBlock } from '@/components/aprender/blocos/MapaConceitualBlock';
import { OrdenacaoBlock } from '@/components/aprender/blocos/OrdenacaoBlock';
import { CenaAnimadaBlock } from '@/components/aprender/blocos/CenaAnimadaBlock';
import { ConexaoBlock } from '@/components/aprender/blocos/ConexaoBlock';
import { type NivelFlashcard } from '@/lib/spacedRepetition';

export interface BlocoViewProps {
  bloco: Bloco;
  resposta?: { correta: boolean; escolha?: string };
  onResponder: (escolha: string) => void;
  flipped: boolean;
  onFlip: () => void;
  onAvaliarFlash: (nivel: NivelFlashcard) => void;
  onAvancar?: () => void;
  conexao?: Record<number, number | null>;
  onConexao: (map: Record<number, number | null>, done: boolean) => void;
}

export function BlocoView({
  bloco, resposta, onResponder, flipped, onFlip, onAvaliarFlash, onAvancar, conexao, onConexao,
}: BlocoViewProps) {
  const [selectedOpcao, setSelectedOpcao] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOpcao(null);
  }, [bloco.id]);

  if (isBlocoTexto(bloco.tipo)) {
    return <LeituraBlock payload={bloco.payload || {}} />;
  }

  if (bloco.tipo === 'checkpoint') return <CheckpointBlock payload={bloco.payload || {}} />;
  if (bloco.tipo === 'recapitulacao') return <RecapBlock payload={bloco.payload || {}} />;

  if (bloco.tipo === 'citacao') {
    const { texto, autor, fonte_url } = bloco.payload || {};
    return (
      <article className="max-w-[70ch] mx-auto py-4">
        <p className="mb-4 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/80">
          <Quote className="h-3.5 w-3.5" /> Citação Especial
        </p>
        <blockquote className="relative pl-6 py-2">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-primary via-primary/50 to-transparent" />
          <p className="font-sans text-[20px] md:text-[22px] leading-[1.7] italic text-neutral-300">"{texto}"</p>
          {autor && <footer className="mt-4 text-[15px] font-medium text-neutral-500">— {autor}</footer>}
          {fonte_url && (
            <a href={fonte_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[13px] font-semibold text-primary hover:text-primary-light underline underline-offset-4 decoration-primary/30 hover:decoration-primary/80 transition-all">
              Acessar fonte original
            </a>
          )}
        </blockquote>
      </article>
    );
  }

  if (bloco.tipo === 'artigo_lei') {
    const { lei, numero, texto } = bloco.payload || {};
    return (
      <article className="max-w-[70ch] mx-auto py-4">
        <p className="mb-4 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/80">
          <Scale className="h-3.5 w-3.5" /> Texto da Lei
        </p>
        <div className="relative rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent p-6 shadow-xl before:absolute before:inset-0 before:bg-[url('https://www.transparenttextures.com/patterns/stardust.webp')] before:opacity-10 before:mix-blend-overlay">
          <p className="mb-4 text-sm font-bold text-white uppercase tracking-wide">
            {lei} {numero ? <span className="text-primary font-black">— Art. {numero}</span> : ''}
          </p>
          <p className="whitespace-pre-line text-[17px] md:text-[18px] leading-[1.8] text-neutral-300 relative z-10">{texto}</p>
        </div>
      </article>
    );
  }

  if (bloco.tipo === 'tabela') {
    const { titulo, colunas = [], linhas = [] } = bloco.payload || {};
    return (
      <article className="max-w-[70ch] lg:max-w-none mx-auto py-4">
        {titulo && <h3 className="mb-6 font-sans text-[20px] font-bold leading-snug text-white">{titulo}</h3>}
        <div className="space-y-4 sm:hidden">
          {linhas.map((row: string[], ri: number) => (
            <div key={ri} className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] shadow-lg">
              <div className="bg-white/5 px-4 py-3 font-sans text-[15px] font-bold text-white border-b border-white/5">
                {row[0]}
              </div>
              <dl className="divide-y divide-white/5">
                {row.slice(1).map((cell, ci) => (
                  <div key={ci} className="px-4 py-3">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      {colunas[ci + 1]}
                    </dt>
                    <dd className="text-[15px] leading-relaxed text-neutral-300">{cell}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-2xl border border-white/5 shadow-xl sm:block bg-white/[0.02]">
          <table className="w-full text-[15px]">
            <thead className="bg-white/5">
              <tr>
                {colunas.map((c: string, i: number) => (
                  <th key={i} className="px-4 py-4 text-left text-[14px] font-bold text-white uppercase tracking-wider">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((row: string[], ri: number) => (
                <tr key={ri} className="border-t border-white/5 odd:bg-white/[0.01]">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-4 align-top leading-relaxed text-neutral-300">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    );
  }

  if (bloco.tipo === 'mapa_mental') {
    const { raiz, definicao_raiz, ramos = [] } = bloco.payload || {};
    return (
      <article>
        <p className="mb-3 text-xs font-semibold uppercase text-primary">Mapa mental</p>
        <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 p-5 text-center">
          <p className="font-display text-2xl font-bold text-foreground leading-tight">{raiz}</p>
          {definicao_raiz && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{definicao_raiz}</p>
          )}
        </div>
        {ramos.length > 0 && (
          <div className="flex justify-center" aria-hidden>
            <span className="block w-0.5 h-6 bg-primary/50" />
          </div>
        )}
        <div className="relative pl-8">
          {ramos.length > 0 && (
            <span
              aria-hidden
              className="absolute left-3 top-0 bottom-6 w-0.5 bg-gradient-to-b from-primary/60 via-primary/40 to-transparent"
            />
          )}
          <div className="space-y-4">
            {ramos.map((r: any, i: number) => (
              <div key={i} className="relative">
                <span aria-hidden className="absolute -left-5 top-6 h-0.5 w-5 bg-primary/50" />
                <span
                  aria-hidden
                  className="absolute -left-[26px] top-[19px] h-3 w-3 rounded-full border-2 border-primary bg-background"
                />
                <div className="rounded-xl border-2 border-border bg-card p-4 shadow-sm">
                  <p className="font-display text-base font-bold text-foreground">{r.titulo}</p>
                  {r.definicao && (
                    <p className="mt-1 mb-3 text-xs text-muted-foreground italic leading-relaxed">{r.definicao}</p>
                  )}
                  <ul className="relative space-y-2 text-[14px] pl-4">
                    <span aria-hidden className="absolute left-1 top-1 bottom-1 w-px bg-border" />
                    {(r.itens || []).map((it: any, j: number) => {
                      const isObj = it && typeof it === 'object';
                      const termo = isObj ? it.termo : String(it);
                      const definicao = isObj ? it.definicao : '';
                      return (
                        <li key={j} className="relative flex gap-2 items-start">
                          <span aria-hidden className="absolute -left-3 top-[9px] h-px w-3 bg-border" />
                          <span className="mt-1.5 inline-block w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                          <span className="flex-1 leading-snug">
                            <span className="font-semibold text-foreground">{termo}</span>
                            {definicao && (
                              <span className="text-muted-foreground"> — {definicao}</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>
    );
  }

  if (bloco.tipo === 'fluxograma') {
    const { titulo, etapas = [] } = bloco.payload || {};
    const stepStyle = (t?: string) => {
      switch (t) {
        case 'inicio': return { border: 'border-emerald-500/50', bg: 'bg-emerald-500/5', badge: 'bg-emerald-500 text-white', label: 'Início' };
        case 'fim': return { border: 'border-primary/50', bg: 'bg-primary/5', badge: 'bg-primary text-primary-foreground', label: 'Fim' };
        case 'decisao': return { border: 'border-yellow-500/60', bg: 'bg-yellow-500/10', badge: 'bg-yellow-500 text-black', label: 'Decisão' };
        default: return { border: 'border-border/60 hover:border-primary/40 transition-colors', bg: 'bg-card/60 backdrop-blur-sm', badge: 'bg-primary/10 text-primary font-bold', label: 'Etapa' };
      }
    };
    return (
      <article>
        <p className="mb-3 text-xs font-semibold uppercase text-primary">Fluxograma</p>
        {titulo && <h3 className="mb-4 font-display text-lg font-bold text-foreground">{titulo}</h3>}
        <ol className="space-y-2">
          {etapas.map((et: any, i: number) => {
            const s = stepStyle(et.tipo);
            const isDecisao = et.tipo === 'decisao';
            return (
              <li key={i}>
                <div className={`rounded-2xl border-2 ${s.border} ${s.bg} p-4 shadow-sm ${isDecisao ? 'transform-gpu' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full ${s.badge} flex items-center justify-center font-bold text-sm`}>
                      {et.n ?? i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${s.badge}`}>{s.label}</span>
                      </div>
                      <p className="font-display text-base font-bold text-foreground leading-tight">{et.titulo}</p>
                      {et.descricao && (
                        <p className="mt-1 text-[14px] text-muted-foreground leading-relaxed">{et.descricao}</p>
                      )}
                    </div>
                  </div>
                </div>
                {i < etapas.length - 1 && (
                  <div className="flex justify-center py-1" aria-hidden="true">
                    <div className="w-0.5 h-4 bg-primary/30" />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </article>
    );
  }

  if (bloco.tipo === 'linha_tempo') {
    const { titulo, eventos = [] } = bloco.payload || {};
    return (
      <article>
        {titulo && <h3 className="mb-3 font-display text-lg font-bold text-foreground">{titulo}</h3>}
        <ol className="relative border-l-2 border-primary/40 pl-4 space-y-4">
          {eventos.map((ev: any, i: number) => (
            <li key={i} className="relative">
              <span className="absolute -left-[22px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary" />
              <p className="text-xs font-bold uppercase text-primary">{ev.marco}</p>
              <p className="font-semibold text-foreground">{ev.titulo}</p>
              {ev.descricao && <p className="text-sm text-muted-foreground">{ev.descricao}</p>}
            </li>
          ))}
        </ol>
      </article>
    );
  }

  if (bloco.tipo === 'destaque') {
    const { tom = 'info', titulo, texto } = bloco.payload || {};
    let style = { bg: 'bg-blue-500/10', br: 'border-blue-500/40', tx: 'text-blue-700 dark:text-blue-300', Icon: Sparkles };
    if (tom === 'alerta') style = { bg: 'bg-red-500/10', br: 'border-red-500/40', tx: 'text-red-700 dark:text-red-300', Icon: Sparkles };
    if (tom === 'dica') style = { bg: 'bg-yellow-500/10', br: 'border-yellow-500/40', tx: 'text-yellow-700 dark:text-yellow-300', Icon: Lightbulb };
    return (
      <article>
        <div className={`rounded-xl border ${style.br} ${style.bg} p-4`}>
          <div className={`mb-2 flex items-center gap-2 text-xs font-bold uppercase ${style.tx}`}>
            <style.Icon className="h-4 w-4" />
            {titulo || (tom === 'alerta' ? 'Atenção' : tom === 'dica' ? 'Dica' : 'Importante')}
          </div>
          <p className="text-[15px] leading-relaxed text-foreground">{texto}</p>
        </div>
      </article>
    );
  }

  if (bloco.tipo === 'mapa_conceitual') return <MapaConceitualBlock payload={bloco.payload} />;
  if (bloco.tipo === 'ordenacao') return <OrdenacaoBlock payload={bloco.payload} />;
  if (bloco.tipo === 'cena_animada') return <CenaAnimadaBlock payload={bloco.payload} />;

  if (bloco.tipo === 'infografico') {
    const { titulo, itens = [] } = bloco.payload || {};
    return (
      <article>
        {titulo && <h3 className="mb-3 font-display text-lg font-bold text-foreground">{titulo}</h3>}
        <div className="grid gap-3 sm:grid-cols-2">
          {itens.map((it: any, i: number) => (
            <div key={i} className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4">
              {it.numero && <p className="font-display text-3xl font-bold text-primary">{it.numero}</p>}
              <p className="mt-1 font-semibold text-foreground">{it.titulo}</p>
              {it.descricao && <p className="mt-1 text-sm text-muted-foreground">{it.descricao}</p>}
            </div>
          ))}
        </div>
      </article>
    );
  }

  if (bloco.tipo === 'pergunta') {
    const { enunciado, opcoes } = bloco.payload || {};
    const correta = String(bloco.resposta_correta?.id_correto || '').toLowerCase();
    return (
      <article className="max-w-[70ch] mx-auto py-2">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Desafio de Fixação</span>
        </div>
        <h2 className="mb-6 font-display text-[19px] md:text-[22px] font-bold leading-relaxed text-foreground tracking-tight">
          {enunciado}
        </h2>
        <div className="space-y-3 pb-24">
          {(opcoes || []).map((op: any) => {
            const id = String(op.id).toLowerCase();
            const escolhida = resposta ? (resposta.escolha?.toLowerCase() === id) : (selectedOpcao === id);
            const acertou = resposta?.correta && (resposta.escolha?.toLowerCase() === id);
            const errou = resposta && (resposta.escolha?.toLowerCase() === id) && !resposta.correta;
            const revelaCerta = resposta && id === correta;

            let cardClass = 'border-white/[0.08] bg-card/60 hover:bg-card hover:border-white/20 text-neutral-200 shadow-sm backdrop-blur-sm';
            let badgeClass = 'border-white/15 bg-white/5 text-neutral-400 group-hover:text-white group-hover:border-white/30';

            if (acertou || revelaCerta) {
              cardClass = 'border-emerald-500/60 bg-emerald-500/[0.12] text-white ring-1 ring-emerald-500/40 shadow-lg shadow-emerald-500/10';
              badgeClass = 'border-emerald-500/60 bg-emerald-500/25 text-emerald-400 font-bold';
            } else if (errou) {
              cardClass = 'border-rose-500/60 bg-rose-500/[0.12] text-white ring-1 ring-rose-500/40 shadow-lg shadow-rose-500/10';
              badgeClass = 'border-rose-500/60 bg-rose-500/25 text-rose-400 font-bold';
            } else if (escolhida) {
              cardClass = 'border-primary bg-primary/15 text-white ring-2 ring-primary/40 shadow-lg shadow-primary/15';
              badgeClass = 'border-primary bg-primary text-white font-bold';
            }

            return (
              <button
                key={op.id}
                disabled={!!resposta}
                onClick={() => { if (!resposta) setSelectedOpcao(id); }}
                className={`group relative flex w-full items-center gap-4 rounded-2xl border p-4 md:p-5 text-left text-[15px] md:text-[16px] leading-relaxed transition-all duration-200 min-h-[4rem] active:scale-[0.99] ${cardClass}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold uppercase transition-colors ${badgeClass}`}>
                  {op.id}
                </span>
                <span className="flex-1 font-medium">{op.texto}</span>
                {(acertou || revelaCerta) && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}
                {errou && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                    <XCircle className="h-4 w-4" strokeWidth={2.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {!resposta && selectedOpcao && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-background/90 backdrop-blur-xl px-4 py-3.5 pb-[calc(1rem+var(--sai-bottom))] shadow-2xl"
            >
              <div className="mx-auto max-w-3xl lg:max-w-[74ch] xl:max-w-[80ch] flex items-center justify-between gap-4">
                <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Alternativa {selectedOpcao.toUpperCase()} selecionada
                </div>
                <button
                  onClick={() => onResponder(selectedOpcao)}
                  className="w-full sm:w-auto sm:min-w-[200px] ml-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-light active:scale-[0.98] transition-all"
                >
                  Confirmar Resposta <ArrowRight className="h-4 w-4 text-white" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    );
  }

  if (bloco.tipo === 'flashcard') {
    const { frente, verso, explicacao, exemplo, aplicando, dica } = bloco.payload || {};
    const versoTexto: string = explicacao || verso || '';
    const exemploTexto: string = exemplo || '';
    const aplicandoTexto: string = aplicando || '';
    const dicaTexto: string = dica || '';

    const Divider = ({ label, Icon }: { label: string; Icon?: any }) => (
      <div className="flex items-center gap-4 my-6" aria-hidden="true">
        <div className="flex-1 h-px bg-white/10" />
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-white/50">
          {Icon && <Icon className="w-3.5 h-3.5" />} {label}
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
    );

    return (
      <article className="max-w-[70ch] mx-auto py-4">
        <p className="mb-4 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/80">
          Flashcard de Retenção
        </p>
        <div className="w-full" style={{ perspective: '1200px' }}>
          <motion.div
            className="relative w-full min-h-[460px] cursor-pointer"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={onFlip}
          >
            {/* Frente */}
            <div
              className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-white/10 p-8 md:p-10 flex flex-col shadow-2xl"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="flex items-center justify-between mb-4 opacity-50">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-white">Frente</span>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 flex items-center justify-center text-center px-4">
                <p className="font-sans text-2xl md:text-3xl font-bold leading-[1.4] text-white/90">{frente}</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-white/30 pt-6 border-t border-white/5">
                <RotateCw className="w-4 h-4" /> Toque para virar
              </div>
            </div>

            {/* Verso */}
            <div
              className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-8 md:p-10 flex flex-col shadow-2xl backdrop-blur-xl"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-primary">Verso · Resposta</span>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 overflow-y-auto text-left pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <p className="font-sans text-xl font-bold leading-relaxed text-white/95">{versoTexto}</p>
                {exemploTexto && (
                  <>
                    <Divider label="Exemplo prático" Icon={Lightbulb} />
                    <p className="font-sans text-[16px] leading-relaxed text-white/80 italic">{exemploTexto}</p>
                  </>
                )}
                {aplicandoTexto && (
                  <>
                    <Divider label="Aplicando" Icon={Flag} />
                    <p className="font-sans text-[16px] leading-relaxed text-white/80">{aplicandoTexto}</p>
                  </>
                )}
                {dicaTexto && (
                  <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 px-5 py-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">Dica de Ouro</p>
                    <p className="font-sans text-[15px] leading-relaxed text-white/90">{dicaTexto}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-white/30 pt-6 mt-4 border-t border-white/5">
                <RotateCw className="w-4 h-4" /> Toque para voltar
              </div>
            </div>
          </motion.div>
        </div>

        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onAvaliarFlash('nao_sabia'); onAvancar?.(); }}
              className="w-full sm:w-auto flex-1 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3.5 text-sm font-bold text-rose-400 hover:bg-rose-500/20 active:scale-95 transition-all"
            >
              Não lembrei
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAvaliarFlash('duvida'); onAvancar?.(); }}
              className="w-full sm:w-auto flex-1 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3.5 text-sm font-bold text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all"
            >
              Mais ou menos
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAvaliarFlash('sabia'); onAvancar?.(); }}
              className="w-full sm:w-auto flex-1 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all"
            >
              Lembrei fácil
            </button>
          </motion.div>
        )}
      </article>
    );
  }

  if (bloco.tipo === 'conexao') {
    const pares = Array.isArray(bloco.payload?.pares) ? bloco.payload.pares : [];
    return (
      <ConexaoBlock
        key={bloco.id}
        pares={pares}
        onCompleto={() => onConexao({}, true)}
      />
    );
  }

  return null;
}
