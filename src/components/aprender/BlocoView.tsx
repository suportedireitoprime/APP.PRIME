import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Scale, Check, X, XCircle, RotateCw, CheckCircle2, ArrowRight, Lightbulb, Flag, ChevronDown, AlertTriangle, BookMarked, HelpCircle, Puzzle, Brain } from 'lucide-react';
import { Bloco, iconePorTipo, isBlocoTexto, rotuloPorTipo, isPerguntaBloco } from '@/lib/aprenderUtils';
import { LeituraBlock } from '@/components/aprender/blocos/LeituraBlock';
import { LacunasInterativasBlock } from '@/components/aprender/blocos/LacunasInterativasBlock';
import { CheckpointBlock } from '@/components/aprender/blocos/CheckpointBlock';
import { RecapBlock } from '@/components/aprender/blocos/RecapBlock';
import { MapaConceitualBlock } from '@/components/aprender/blocos/MapaConceitualBlock';
import { OrdenacaoBlock } from '@/components/aprender/blocos/OrdenacaoBlock';
import { CenaAnimadaBlock } from '@/components/aprender/blocos/CenaAnimadaBlock';
import { ConexaoBlock } from '@/components/aprender/blocos/ConexaoBlock';
import { type NivelFlashcard } from '@/lib/spacedRepetition';
import { haptic } from '@/lib/nativeHaptics';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { normalizarMarkdown, limparTextoInstrucoes, limparMarkdownInline, formatarDicaProfessora } from '@/lib/markdown';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export interface BlocoViewProps {
  bloco: Bloco;
  resposta?: { correta: boolean; escolha?: string };
  selectedOpcao?: string | null;
  onSelectOpcao?: (opcao: string) => void;
  onResponder: (escolha: string) => void;
  flipped: boolean;
  onFlip: () => void;
  onAvaliarFlash: (nivel: NivelFlashcard) => void;
  onAvancar?: () => void;
  conexao?: Record<number, number | null>;
  onConexao: (map: Record<number, number | null>, done: boolean) => void;
}

export function BlocoView({
  bloco: blocoProps, resposta, selectedOpcao: externalSelectedOpcao, onSelectOpcao, onResponder, flipped, onFlip, onAvaliarFlash, onAvancar, conexao, onConexao,
}: BlocoViewProps) {
  const bloco = { ...blocoProps };
  
  if (isPerguntaBloco(bloco)) {
    bloco.tipo = 'pergunta';
  }

  const [internalSelectedOpcao, setInternalSelectedOpcao] = useState<string | null>(null);
  const selectedOpcao = externalSelectedOpcao !== undefined ? externalSelectedOpcao : internalSelectedOpcao;
  const setSelectedOpcao = (id: string | null) => {
    if (onSelectOpcao && id !== null) {
      onSelectOpcao(id);
    } else {
      setInternalSelectedOpcao(id);
    }
  };
  const [collapsedRamos, setCollapsedRamos] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setInternalSelectedOpcao(null);
  }, [bloco.id]);

  if (bloco.tipo === 'leitura' && bloco.payload?.isMenuSuspenso) {
    const items = bloco.payload?.items || [];
    return (
      <div className="w-full flex flex-col items-center">
        <Accordion type="single" collapsible className="w-full max-w-2xl space-y-3">
          {items.map((item: any, i: number) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-b-0 group">
              <AccordionTrigger className="bg-primary/5 hover:bg-primary/10 px-4 py-3.5 sm:px-5 sm:py-4 rounded-xl text-left transition-all hover:no-underline border border-primary/20 hover:border-primary/40 font-display font-black text-[15px] sm:text-[16px] text-white uppercase tracking-widest shadow-sm">
                {limparMarkdownInline(item.titulo || '')}
              </AccordionTrigger>
              <AccordionContent className="p-4 sm:p-5 bg-card/40 backdrop-blur-sm mt-1.5 rounded-xl border border-white/10 text-neutral-300 leading-relaxed shadow-inner">
                <div className="prose prose-invert prose-p:text-[15px] sm:prose-p:text-[16px] prose-p:leading-[1.7] prose-p:text-neutral-200 prose-ul:pl-4 prose-li:mb-1 max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <span className="block mb-3 last:mb-0">{children}</span>,
                      em: ({ children }) => {
                        const txt = String(children).trim();
                        const lower = txt.toLowerCase();
                        let Icon = null;
                        let colorClass = "text-primary";
                        let bgClass = "bg-primary/10 border-primary/20";
                        
                        if (lower.includes('atenção') || lower.includes('importante') || lower.includes('cuidado') || lower.includes('alerta')) {
                          Icon = AlertTriangle;
                          colorClass = "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]";
                          bgClass = "bg-amber-500/15 border-amber-500/20";
                        } else if (lower.includes('dica') || lower.includes('macete') || lower.includes('bizu')) {
                          Icon = Lightbulb;
                          colorClass = "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]";
                          bgClass = "bg-amber-400/10 border-amber-400/20";
                        } else if (lower.includes('exemplo')) {
                          Icon = BookMarked;
                          bgClass = "bg-primary/15 border-primary/20";
                        } else if (lower.includes('nota') || lower.includes('observação') || lower.includes('obs')) {
                          Icon = Flag;
                          bgClass = "bg-primary/10 border-primary/20";
                        }
                        
                        return (
                          <strong className={`inline-flex items-center gap-1.5 font-display font-black ${colorClass} uppercase text-[12px] sm:text-[13px] tracking-widest ${bgClass} border px-2 py-0.5 rounded-md mr-0.5 align-middle -mt-1 mb-1`}>
                            {Icon && <Icon className="w-3.5 h-3.5" />}
                            {children}
                          </strong>
                        );
                      },
                      strong: ({ children }) => {
                        const txt = String(children).trim();
                        const lower = txt.toLowerCase();
                        let Icon = null;
                        let colorClass = "text-primary";
                        let bgClass = "bg-primary/10 border-primary/20";
                        
                        if (lower.includes('atenção') || lower.includes('importante') || lower.includes('cuidado') || lower.includes('alerta')) {
                          Icon = AlertTriangle;
                          colorClass = "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]";
                          bgClass = "bg-amber-500/15 border-amber-500/20";
                        } else if (lower.includes('dica') || lower.includes('macete') || lower.includes('bizu')) {
                          Icon = Lightbulb;
                          colorClass = "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]";
                          bgClass = "bg-amber-400/10 border-amber-400/20";
                        } else if (lower.includes('exemplo')) {
                          Icon = BookMarked;
                          bgClass = "bg-primary/15 border-primary/20";
                        } else if (lower.includes('nota') || lower.includes('observação') || lower.includes('obs')) {
                          Icon = Flag;
                          bgClass = "bg-primary/10 border-primary/20";
                        }
                        
                        return (
                          <strong className={`inline-flex items-center gap-1.5 font-display font-black ${colorClass} uppercase text-[12px] sm:text-[13px] tracking-widest ${bgClass} border px-2 py-0.5 rounded-md mr-0.5 align-middle -mt-1 mb-1`}>
                            {Icon && <Icon className="w-3.5 h-3.5" />}
                            {children}
                          </strong>
                        );
                      }
                    }}
                  >
                    {normalizarMarkdown(item.conteudo || '').replace(/[\uFFFD\u26A0\uFE0F🚨💡📌🛑📝]/g, '')}
                  </ReactMarkdown>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  }

  if (isBlocoTexto(bloco.tipo)) {
    const rawContent = String(bloco.payload?.conteudo ?? bloco.payload?.texto ?? '');
    
    // Identifica e desvia para o componente interativo se for um desafio de lacunas
    if (/Opções do Menu Suspenso/i.test(rawContent) && /Gabarito Comentado/i.test(rawContent)) {
      return <LacunasInterativasBlock rawContent={rawContent} onComplete={() => onResponder('completo')} />;
    }
    
    return <LeituraBlock payload={bloco.payload || {}} />;
  }

  if (bloco.tipo === 'checkpoint') return <CheckpointBlock payload={bloco.payload || {}} />;
  if (bloco.tipo === 'recapitulacao') return <RecapBlock payload={bloco.payload || {}} />;

  if (bloco.tipo === 'citacao') {
    const { texto, autor, fonte_url } = bloco.payload || {};
    return (
      <motion.article
        className="max-w-[70ch] mx-auto py-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="mb-4 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/80">
          <Quote className="h-3.5 w-3.5" /> Citação Especial
        </p>
        <blockquote className="relative pl-6 py-2">
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-primary via-primary/50 to-transparent"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            style={{ transformOrigin: 'top' }}
          />
          <p className="font-sans text-[18px] sm:text-[20px] md:text-[22px] leading-[1.7] italic text-neutral-300">"{texto}"</p>
          {autor && <footer className="mt-4 text-[14px] sm:text-[15px] font-medium text-neutral-500">— {autor}</footer>}
          {fonte_url && (
            <a href={fonte_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[13px] font-semibold text-primary hover:text-primary-light underline underline-offset-4 decoration-primary/30 hover:decoration-primary/80 transition-all">
              Acessar fonte original
            </a>
          )}
        </blockquote>
      </motion.article>
    );
  }

  if (bloco.tipo === 'artigo_lei') {
    const { lei, numero, texto: rawTexto, titulo } = bloco.payload || {};
    const textoLimpo = limparTextoInstrucoes(rawTexto || '');
    return (
      <motion.article
        className="max-w-[70ch] mx-auto py-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
          <Scale className="h-3.5 w-3.5" />
          <span>Texto da Lei & Dispositivo Legal</span>
        </div>
        {titulo && (
          <h2 className="mb-4 font-sans text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
            {limparMarkdownInline(titulo)}
          </h2>
        )}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-4 sm:p-6 shadow-xl backdrop-blur-md">
          {(lei || numero) && (
            <p className="mb-4 text-sm font-bold text-white uppercase tracking-wide border-b border-white/10 pb-3">
              {lei} {numero ? <span className="text-primary font-black">— Art. {numero}</span> : ''}
            </p>
          )}
          <div className="prose prose-invert prose-p:text-[16px] sm:prose-p:text-[17px] md:prose-p:text-[18px] prose-p:leading-[1.8] prose-p:text-neutral-200 prose-p:mb-4 prose-strong:text-white prose-strong:font-bold prose-blockquote:border-primary prose-blockquote:bg-primary/[0.08] prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:text-neutral-100 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {normalizarMarkdown(textoLimpo)}
            </ReactMarkdown>
          </div>
        </div>
      </motion.article>
    );
  }

  if (bloco.tipo === 'tabela') {
    const { titulo, colunas = [], linhas = [] } = bloco.payload || {};
    return (
      <motion.article
        className="max-w-[70ch] lg:max-w-none mx-auto py-1.5 sm:py-2.5 px-0.5 sm:px-2"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {titulo && (
          <h3 className="mb-3 sm:mb-4 font-sans text-[16px] sm:text-[18px] font-bold leading-snug text-white flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary rounded-full" />
            <span>{limparMarkdownInline(titulo)}</span>
          </h3>
        )}
        <div className="space-y-2 sm:hidden">
          {linhas.map((row: string[], ri: number) => (
            <motion.div
              key={ri}
              className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-md"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: ri * 0.05 }}
            >
              <div className="bg-white/5 px-3.5 py-2.5 font-sans text-[14px] font-bold text-white border-b border-white/5">
                {limparMarkdownInline(row[0])}
              </div>
              <dl className="divide-y divide-white/5">
                {row.slice(1).map((cell, ci) => (
                  <div key={ci} className="px-3.5 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-0.5">
                      {limparMarkdownInline(colunas[ci + 1])}
                    </dt>
                    <dd className="text-[13px] sm:text-[14px] leading-relaxed text-neutral-200">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <span className="inline">{children}</span>,
                          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>
                        }}
                      >
                        {normalizarMarkdown(cell)}
                      </ReactMarkdown>
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          ))}
        </div>
        <div className="hidden overflow-x-auto rounded-xl border border-white/10 shadow-lg sm:block bg-white/[0.02] backdrop-blur-sm">
          <table className="w-full text-[14px]">
            <thead className="bg-white/5">
              <tr>
                {colunas.map((c: string, i: number) => (
                  <th key={i} className="px-3.5 py-2.5 text-left text-[12px] sm:text-[13px] font-bold text-white uppercase tracking-wider">
                    {limparMarkdownInline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((row: string[], ri: number) => (
                <tr key={ri} className="border-t border-white/5 odd:bg-white/[0.01] hover:bg-white/[0.04] transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3.5 py-2.5 align-top leading-relaxed text-neutral-300">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <span className="inline">{children}</span>,
                          strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>
                        }}
                      >
                        {ci === 0 ? normalizarMarkdown(limparMarkdownInline(cell)) : normalizarMarkdown(cell)}
                      </ReactMarkdown>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.article>
    );
  }

  if (bloco.tipo === 'mapa_mental') {
    const { raiz, definicao_raiz, ramos = [] } = bloco.payload || {};
    return (
      <article className="mt-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-primary rounded-full animate-pulse" />
            <p className="text-[11px] font-black uppercase tracking-widest text-primary">Mapa mental sintético</p>
          </div>
          <span className="text-xs text-neutral-400 font-semibold">
            {ramos.length} ramificações
          </span>
        </div>
        
        {/* Raiz do Mapa */}
        <div className="relative z-10 rounded-2xl border border-primary/40 bg-black/50 backdrop-blur-md p-6 text-center shadow-[0_0_24px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-60 rounded-2xl pointer-events-none" />
          <p className="relative z-10 font-sans text-[22px] sm:text-[26px] font-black text-white leading-tight tracking-tight drop-shadow-md">{raiz}</p>
          {definicao_raiz && (
            <p className="relative z-10 mt-2 text-[13px] sm:text-sm text-white/80 leading-relaxed font-medium max-w-lg mx-auto">{definicao_raiz}</p>
          )}
        </div>

        {/* Conector Vertical */}
        {ramos.length > 0 && (
          <div className="flex justify-center -mt-2 -mb-2 relative z-0" aria-hidden>
            <span className="block w-[2px] h-10 bg-gradient-to-b from-primary/80 to-primary/20" />
          </div>
        )}

        <div className="relative pl-6 sm:pl-8">
          {ramos.length > 0 && (
            <span
              aria-hidden
              className="absolute left-1.5 sm:left-3 top-0 bottom-8 w-[2px] bg-gradient-to-b from-primary/60 via-primary/20 to-transparent"
            />
          )}
          
          <div className="space-y-5">
            {ramos.map((r: any, i: number) => {
              const isCollapsed = !!collapsedRamos[i];
              return (
                <div key={i} className="relative group">
                  <span aria-hidden className="absolute -left-4 sm:-left-[22px] top-[26px] h-[2px] w-4 sm:w-5 bg-primary/40 group-hover:bg-primary/80 transition-colors" />
                  <span
                    aria-hidden
                    className="absolute -left-[20px] sm:-left-[26px] top-[22px] h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full border-[2px] border-primary bg-black shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"
                  />
                  
                  {/* Card do Ramo */}
                  <div className="rounded-xl border border-white/10 bg-card/60 backdrop-blur-sm p-4 sm:p-5 shadow-lg transition-all group-hover:border-primary/40 group-hover:bg-card/80">
                    <button
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        setCollapsedRamos((c) => ({ ...c, [i]: !c[i] }));
                      }}
                      className="w-full flex items-center justify-between text-left cursor-pointer select-none"
                    >
                      <div>
                        <p className="font-sans text-[16px] sm:text-[17px] font-bold text-white tracking-normal">{r.titulo}</p>
                        {r.definicao && (
                          <p className="mt-1 text-[13px] text-white/70 italic leading-relaxed font-medium">{r.definicao}</p>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-xs text-primary font-bold ml-3 shrink-0">
                        <span>{r.itens?.length || 0} itens</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
                      </span>
                    </button>
                    
                    {/* Itens do Ramo com AnimatePresence */}
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="relative space-y-2.5 text-[14px] pl-3 mt-4 overflow-hidden border-t border-white/5 pt-3"
                        >
                          <span aria-hidden className="absolute left-0 top-1 bottom-1 w-[1px] bg-white/10" />
                          {(r.itens || []).map((it: any, j: number) => {
                            const isObj = it && typeof it === 'object';
                            const termo = isObj ? it.termo : String(it);
                            const definicao = isObj ? it.definicao : '';
                            return (
                              <li key={j} className="relative flex gap-3 items-start">
                                <span aria-hidden className="absolute -left-3 top-[10px] h-[1px] w-2.5 bg-white/10" />
                                <span className="mt-[7px] inline-block w-1.5 h-1.5 rounded-full bg-primary/80 flex-shrink-0 shadow-[0_0_5px_rgba(255,255,255,0.3)]" />
                                <span className="flex-1 leading-snug">
                                  <span className="font-bold text-white/95">{termo}</span>
                                  {definicao && (
                                    <span className="text-white/70"> <span className="text-primary/60">—</span> {definicao}</span>
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
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
      <article className="max-w-[70ch] lg:max-w-[76ch] mx-auto py-3">
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-widest text-primary flex items-center gap-2">
          <span className="w-1.5 h-4 bg-primary rounded-full" /> Fluxograma
        </p>
        {titulo && <h3 className="mb-5 font-sans text-lg sm:text-xl font-bold text-foreground">{titulo}</h3>}
        <ol className="space-y-1">
          {etapas.map((et: any, i: number) => {
            const s = stepStyle(et.tipo);
            const isDecisao = et.tipo === 'decisao';
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className={`rounded-2xl border ${s.border} ${s.bg} p-3.5 sm:p-4 shadow-sm ${isDecisao ? 'transform-gpu' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full ${s.badge} flex items-center justify-center font-bold text-xs sm:text-sm`}>
                      {et.n ?? i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded ${s.badge}`}>{s.label}</span>
                      </div>
                      <p className="font-sans text-[14px] sm:text-base font-bold text-foreground leading-tight">{et.titulo}</p>
                      {et.descricao && (
                        <p className="mt-1 text-[13px] sm:text-[14px] text-muted-foreground leading-relaxed">{et.descricao}</p>
                      )}
                    </div>
                  </div>
                </div>
                {i < etapas.length - 1 && (
                  <div className="flex justify-center py-0.5" aria-hidden="true">
                    <motion.div
                      className="w-0.5 h-4 bg-primary/30"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.2, delay: i * 0.08 + 0.2 }}
                    />
                  </div>
                )}
              </motion.li>
            );
          })}
        </ol>
      </article>
    );
  }

  if (bloco.tipo === 'linha_tempo') {
    const { titulo, eventos = [], texto: rawTexto } = bloco.payload || {};
    const textoLimpo = limparTextoInstrucoes(rawTexto || '');
    return (
      <article className="max-w-[70ch] lg:max-w-[76ch] mx-auto py-3 px-1 sm:px-2">
        <header className="mb-6 sm:mb-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-primary mb-2 bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            Linha Estrutural · Origem e Contexto
          </span>
          {titulo && (
            <h2 className="font-sans text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
              {limparMarkdownInline(titulo)}
            </h2>
          )}
        </header>

        {eventos && eventos.length > 0 ? (
          <ol className="relative border-l-2 border-primary/30 pl-5 sm:pl-8 space-y-5 sm:space-y-7 my-4">
            {eventos.map((ev: any, i: number) => (
              <motion.li
                key={i}
                className="relative group"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <motion.span
                  className="absolute -left-[27px] sm:-left-[39px] top-1.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary text-black font-black text-[11px] shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.1 + 0.1, type: 'spring', stiffness: 400 }}
                >
                  {i + 1}
                </motion.span>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3.5 sm:p-5 backdrop-blur-sm shadow-md transition-all group-hover:border-primary/40 group-hover:bg-white/[0.05]">
                  <span className="inline-block text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-primary mb-1">
                    {limparMarkdownInline(ev.marco)}
                  </span>
                  <p className="font-sans text-base sm:text-lg font-bold text-white leading-snug mb-1.5">
                    {limparMarkdownInline(ev.titulo)}
                  </p>
                  {ev.descricao && (
                    <div className="text-[14px] sm:text-[15px] leading-relaxed text-neutral-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <span className="inline">{children}</span> }}>
                        {normalizarMarkdown(ev.descricao)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.li>
            ))}
          </ol>
        ) : (
          <div className="relative border-l-2 border-primary/30 pl-5 sm:pl-8 my-4">
            <div className="absolute -left-[9px] top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.6)]" />
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-6 backdrop-blur-md shadow-xl">
              <div className="prose prose-invert prose-p:text-[16px] sm:prose-p:text-[17px] md:prose-p:text-[18px] prose-p:leading-[1.8] prose-p:text-neutral-200 prose-p:mb-5 prose-h3:text-lg sm:prose-h3:text-xl prose-h3:font-bold prose-h3:text-primary prose-h3:mt-4 prose-h3:mb-2 prose-strong:text-white max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {normalizarMarkdown(textoLimpo)}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </article>
    );
  }

  if (bloco.tipo === 'destaque') {
    const { tom = 'info', titulo, texto: textoRaw, subtipo } = bloco.payload || {};
    const isDicaProfessora = subtipo === 'audio_dica' || (titulo || '').toLowerCase().includes('dica da professora') || (titulo || '').toLowerCase().includes('áudio-guia');
    const texto = isDicaProfessora ? formatarDicaProfessora(textoRaw) : limparTextoInstrucoes(textoRaw);

    let style = {
      bg: 'bg-primary/[0.08]',
      br: 'border-primary/30',
      tx: 'text-primary',
      glow: 'shadow-[0_0_24px_hsl(var(--primary)/0.1)]',
      Icon: BookMarked,
    };
    if (tom === 'alerta') {
      style = {
        bg: 'bg-amber-500/[0.06]',
        br: 'border-amber-500/25',
        tx: 'text-amber-400',
        glow: 'shadow-[0_0_24px_rgba(245,158,11,0.08)]',
        Icon: AlertTriangle,
      };
    }
    if (tom === 'dica') {
      style = {
        bg: 'bg-amber-500/[0.08]',
        br: 'border-amber-500/30',
        tx: 'text-amber-400',
        glow: 'shadow-[0_0_24px_rgba(245,158,11,0.1)]',
        Icon: Lightbulb,
      };
    }
    return (
      <article className="max-w-[70ch] lg:max-w-[76ch] mx-auto py-3 px-1 sm:px-2">
        <div className={`rounded-3xl border ${style.br} ${style.bg} p-4 sm:p-6 backdrop-blur-md shadow-xl ${style.glow}`}>
          <div className={`mb-4 inline-flex items-center gap-2 text-[11px] sm:text-[12px] font-extrabold uppercase tracking-widest ${style.tx} bg-white/5 px-3 py-1 rounded-full border border-white/10`}>
            <style.Icon className="h-4 w-4" strokeWidth={2} />
            {isDicaProfessora ? (
              <span className="flex items-center gap-1.5">
                <span>Dica Estratégica · Áudio-Guia</span>
                <span className="flex items-center gap-0.5 ml-1 h-3" aria-hidden="true">
                  <span className="w-0.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
                  <span className="w-0.5 h-3.5 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-0.5 h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </span>
              </span>
            ) : tom === 'alerta' ? (
              'Atenção Crucial'
            ) : tom === 'dica' ? (
              'Dica Estratégica'
            ) : (
              'Ponto Fundamental'
            )}
          </div>
          {titulo && (
            <h2 className="mb-4 font-sans text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
              {limparMarkdownInline(titulo)}
            </h2>
          )}
          <div className="prose prose-invert prose-blockquote:quotes-none prose-p:text-[16px] sm:prose-p:text-[17px] md:prose-p:text-[18px] prose-p:leading-[1.8] prose-p:text-neutral-200 prose-p:mb-4 prose-li:text-[16px] sm:prose-li:text-[17px] md:prose-li:text-[18px] prose-li:leading-[1.75] prose-li:text-neutral-200 prose-strong:text-white prose-strong:font-bold max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-amber-500/80 bg-amber-500/[0.04] text-neutral-100 py-3.5 px-4 sm:px-6 rounded-r-2xl my-2 not-italic font-medium shadow-sm backdrop-blur-sm space-y-4">
                    {children}
                  </blockquote>
                ),
                p: ({ children }) => (
                  <p className="text-[16px] sm:text-[17px] md:text-[18px] leading-[1.8] text-neutral-200">
                    {children}
                  </p>
                ),
              }}
            >
              {normalizarMarkdown(texto)}
            </ReactMarkdown>
          </div>
        </div>
      </article>
    );
  }

  if (bloco.tipo === 'mapa_conceitual') return <MapaConceitualBlock payload={bloco.payload} />;
  if (bloco.tipo === 'ordenacao') {
    const isCompleteLacuna = bloco.payload?.subtipo?.includes('complete_lacuna') || !!bloco.payload?.textoComLacunas;
    if (!isCompleteLacuna) {
      return <OrdenacaoBlock payload={bloco.payload} />;
    }
  }
  if (bloco.tipo === 'cena_animada') return <CenaAnimadaBlock payload={bloco.payload} />;

  if (bloco.tipo === 'infografico') {
    const { titulo, itens = [] } = bloco.payload || {};
    return (
      <article className="max-w-[70ch] lg:max-w-[76ch] mx-auto py-3">
        {titulo && <h3 className="mb-4 font-sans text-lg sm:text-xl font-bold text-foreground">{titulo}</h3>}
        <div className="grid gap-3 sm:grid-cols-2">
          {itens.map((it: any, i: number) => (
            <motion.div
              key={i}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/8 to-transparent p-4 sm:p-5 backdrop-blur-sm shadow-md hover:border-primary/30 transition-colors"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
            >
              {it.numero && (
                <p className="font-sans text-2xl sm:text-3xl font-extrabold text-primary mb-1">{it.numero}</p>
              )}
              <p className="font-semibold text-[14px] sm:text-[15px] text-foreground leading-snug">{it.titulo}</p>
              {it.descricao && <p className="mt-1.5 text-[13px] sm:text-sm text-muted-foreground leading-relaxed">{it.descricao}</p>}
            </motion.div>
          ))}
        </div>
      </article>
    );
  }

  if (bloco.tipo === 'pergunta' || (bloco.tipo === 'ordenacao' && (bloco.payload?.subtipo?.includes('complete_lacuna') || bloco.payload?.textoComLacunas))) {
    let rawEnunciado = bloco.payload?.enunciado || bloco.payload?.pergunta || bloco.payload?.textoComLacunas || bloco.payload?.texto || '';
    let rawOpcoes = Array.isArray(bloco.payload?.opcoes) ? bloco.payload.opcoes : [];

    if (rawOpcoes.length === 0 && rawEnunciado) {
       rawEnunciado = String(rawEnunciado).replace(/\[(Animação Visual|Animação|Transição de Tela|Transição|Efeito de Revelação|Efeito)[^\]]*\]\s*/gi, '');
       if (bloco.payload?.subtipo === 'certo_errado') {
           rawOpcoes = ["Certo", "Errado"];
       } else {
           // Ensure options are on new lines even if they were in a single paragraph
           const normalizedEnunciado = String(rawEnunciado).replace(/(\s+|^)([(]?[a-eA-E][)\]\-]\s+)/g, '\n$2');
           const lines = normalizedEnunciado.split('\n');
           const ops = [];
           const enunLines = [];
           let parsingOpcoes = false;
           for(const l of lines) {
               if (l.match(/^[\s*]*[(]?[a-eA-E][)\]\-][\s*]+/)) {
                   parsingOpcoes = true;
                   ops.push(l.replace(/^[\s*]*[(]?[a-eA-E][)\]\-][\s*]+/, '').replace(/\*\*$/, '').trim());
               } else if (parsingOpcoes && l.trim() && !l.startsWith('#')) {
                   ops[ops.length-1] += " " + l.trim();
               } else {
                   enunLines.push(l);
               }
           }
           if (ops.length > 0) {
               rawOpcoes = ops;
               rawEnunciado = enunLines.join('\n').trim();
           }
       }
    }

    let justificativaText = bloco.payload?.justificativa || bloco.payload?.gabarito || bloco.justificativa || '';
    const gabaritoRegex = /(?:--\s*Alternativa Correta[\s\S]*|☒?\s*GABARITO E JUSTIFICATIVA:[\s\S]*|Gabarito:[\s\S]*|Justificativa:[\s\S]*)/i;

    if (gabaritoRegex.test(rawEnunciado)) {
      const match = String(rawEnunciado).match(gabaritoRegex);
      if (match && !justificativaText) justificativaText = match[0];
      rawEnunciado = String(rawEnunciado).replace(gabaritoRegex, '');
    }

    const enunciado = String(rawEnunciado)
      .replace(/^#{1,3}\s*(?:\d+[-.)]\s*)?[^\n]+\n*/i, '')
      .replace(/^###\s*(?:Enunciado|Julgue[^\n]*):\s*/i, '')
      .replace(/^[\s*]*(?:Enunciado|Questão)[\s*]*:\s*/i, '')
      .replace(/\[\s*\]\s*$/, '') // Remove stray checkbox or brackets at the end
      .replace(/☒/g, '')
      .trim();

    const opcoes = rawOpcoes.map((op: any, i: number) => {
      let texto = typeof op === 'string' ? op : (op.texto || '');
      let id = typeof op === 'string' ? '' : op.id;

      const match = texto.match(gabaritoRegex);
      if (match) {
        if (!justificativaText) justificativaText = match[0];
        texto = texto.replace(gabaritoRegex, '').trim();
      }

      if (!id) {
        id = texto.toLowerCase() === 'certo' ? 'certo' : texto.toLowerCase() === 'errado' ? 'errado' : String.fromCharCode(97 + i);
      }

      return { id, texto };
    });

    justificativaText = String(justificativaText)
      .replace(/^(?:--\s*Alternativa Correta[:\s]*(\([a-eA-E]\)|\w+)?\.?\s*\*Fundamentação\*:\s*)/i, '')
      .replace(/^(?:☒?\s*GABARITO E JUSTIFICATIVA:\s*)/i, '')
      .replace(/^(?:Gabarito:\s*)/i, '')
      .replace(/^(?:Justificativa:\s*)/i, '')
      .trim();

    const correta = String(
      bloco.resposta_correta?.id_correto ??
      bloco.resposta_correta ??
      ''
    ).toLowerCase();

    const isLacuna =
      bloco.payload?.subtipo === 'complete_lacuna' ||
      String(enunciado || '').toLowerCase().includes('complete a lacuna') ||
      String(enunciado || '').includes('[_____]') ||
      /\[(?:_{2,}|lacuna|\.\.\.)\]|\[\[.*?\]\]/i.test(String(enunciado || ''));

    if (isLacuna) {
      const activeChoiceId = resposta ? resposta.escolha?.toLowerCase() : selectedOpcao;
      const selectedOptionObj = (opcoes || []).find((op: any) => String(op.id).toLowerCase() === activeChoiceId);
      const chosenWord = selectedOptionObj ? selectedOptionObj.texto : null;
      const parts = String(enunciado || '').split(/\[_{2,}\]|\[\[.*?\]\]|\[(?:lacuna|\.\.\.)\]/i);

      return (
        <article className="max-w-[70ch] mx-auto py-2">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-amber-400">
            <Puzzle className="h-3.5 w-3.5" />
            <span>Complete o Tipo Penal</span>
          </div>

          <div className="p-4 sm:p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-xl mb-6">
            <p className="font-sans text-[15px] sm:text-[18px] leading-[1.8] text-white font-normal break-words">
              {parts[0]}
              <span className={`inline-block align-middle text-[13px] sm:text-[15px] mx-1 sm:mx-1.5 px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl font-bold transition-all border-2 ${
                chosenWord
                  ? resposta?.correta
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : resposta && !resposta.correta
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                    : 'border-primary bg-primary/20 text-white shadow-[0_0_12px_hsl(var(--primary)/0.4)]'
                  : 'border-dashed border-amber-400/60 bg-amber-400/10 text-amber-300 animate-pulse'
              }`}>
                {chosenWord || '··· selecione o termo abaixo ···'}
              </span>
              {parts[1] || ''}
            </p>
          </div>

          {resposta && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border mb-6 text-sm sm:text-[15px] leading-relaxed ${
                resposta.correta
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
              }`}
            >
              <p className="font-bold mb-1 flex items-center gap-2">
                {resposta.correta ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                {resposta.correta ? 'Encaixe Correto!' : 'Gabarito Oficial'}
              </p>
              <p className="text-white/85 font-normal">
                {bloco.resposta_correta?.explicacao || bloco.payload?.explicacao}
              </p>
            </motion.div>
          )}

          <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">
            Banco de Termos Legais:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-24">
            {(opcoes || []).map((op: any) => {
              const id = String(op.id).toLowerCase();
              const escolhida = activeChoiceId === id;
              const acertou = resposta?.correta && escolhida;
              const errou = resposta && escolhida && !resposta.correta;
              const revelaCerta = resposta && id === correta;

              let btnStyle = 'border-white/10 bg-card/60 hover:bg-card hover:border-white/20 text-neutral-200';
              if (acertou || revelaCerta) {
                btnStyle = 'border-emerald-500/60 bg-emerald-500/20 text-white ring-1 ring-emerald-500';
              } else if (errou) {
                btnStyle = 'border-rose-500/60 bg-rose-500/20 text-white ring-1 ring-rose-500';
              } else if (escolhida) {
                btnStyle = 'border-primary bg-primary/25 text-white ring-2 ring-primary';
              }

              return (
                <button
                  key={op.id}
                  disabled={!!resposta}
                  onClick={() => {
                    if (!resposta) {
                      haptic.selection();
                      setSelectedOpcao(id);
                    }
                  }}
                  className={`flex items-center justify-between p-4 rounded-2xl border font-bold text-[15px] sm:text-[16px] transition-all active:scale-[0.98] cursor-pointer ${btnStyle}`}
                >
                  <span>{op.texto}</span>
                  <span className="text-xs font-black uppercase text-neutral-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                    {op.id}
                  </span>
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
                className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-background/90 backdrop-blur-xl px-4 py-3.5 pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-2xl"
              >
                <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    Termo selecionado
                  </div>
                  <button
                    onClick={() => onResponder(selectedOpcao)}
                    className="w-full sm:w-auto sm:min-w-[200px] ml-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-light active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Confirmar Encaixe <ArrowRight className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </article>
      );
    }

    return (
      <article className="max-w-[70ch] mx-auto py-2">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{bloco.payload?.titulo ? limparMarkdownInline(bloco.payload.titulo.replace(/^#+\s*/, '').replace(/^\d+[-.)]\s*/, '')) : 'Questão Comentada (Certo ou Errado)'}</span>
        </div>
        <div className="mb-6 font-sans text-[17px] sm:text-[18px] md:text-[20px] font-normal leading-[1.7] text-neutral-200 tracking-tight">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <>{children}</>,
              strong: ({ children }) => (
                <strong className="font-bold text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.35)]">
                  {children}
                </strong>
              ),
              b: ({ children }) => (
                <b className="font-bold text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.35)]">
                  {children}
                </b>
              ),
            }}
          >
            {normalizarMarkdown(enunciado)}
          </ReactMarkdown>
        </div>

        {resposta && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border mb-6 text-sm sm:text-[15px] leading-relaxed ${
              resposta.correta
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
            }`}
          >
            <p className="font-bold mb-1 flex items-center gap-2">
              {resposta.correta ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
              {resposta.correta ? 'Resposta Correta!' : 'Gabarito Oficial'}
            </p>
            <div className="text-white/85 font-normal">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {normalizarMarkdown(limparTextoInstrucoes(bloco.resposta_correta?.explicacao || bloco.payload?.explicacao || ''))}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}

        {(() => {
          const isCertoErrado =
            bloco.payload?.subtipo === 'certo_errado' ||
            (opcoes && opcoes.length === 2 && opcoes.every((op: any) => {
              const raw = String(op.id || op.texto || '').trim().toLowerCase();
              return ['certo', 'errado', 'c', 'e', 'verdadeiro', 'falso', 'v', 'f'].includes(raw);
            }));

          return (
            <div className={isCertoErrado ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pb-24" : "space-y-3 pb-24"}>
              {(opcoes || []).map((op: any, opIdx: number) => {
                const id = String(op.id).toLowerCase();
                const rawTexto = String(op.texto || '').trim().toLowerCase();
                const isOpCerto = id === 'certo' || id === 'c' || id === 'verdadeiro' || id === 'v' || rawTexto === 'certo' || rawTexto === 'verdadeiro';
                const escolhida = resposta ? (resposta.escolha?.toLowerCase() === id) : (selectedOpcao === id);
                const acertou = resposta?.correta && (resposta.escolha?.toLowerCase() === id);
                const errou = resposta && (resposta.escolha?.toLowerCase() === id) && !resposta.correta;
                const revelaCerta = resposta && id === correta;

                if (isCertoErrado) {
                  const label = isOpCerto ? (op.texto && !['c', 'certo'].includes(rawTexto) ? op.texto : 'Certo') : (op.texto && !['e', 'errado'].includes(rawTexto) ? op.texto : 'Errado');

                  let cardClass = isOpCerto
                    ? 'border-white/[0.08] bg-card/60 hover:bg-emerald-500/[0.08] hover:border-emerald-500/30 text-neutral-200 shadow-sm backdrop-blur-sm'
                    : 'border-white/[0.08] bg-card/60 hover:bg-rose-500/[0.08] hover:border-rose-500/30 text-neutral-200 shadow-sm backdrop-blur-sm';

                  let badgeClass = isOpCerto
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 group-hover:border-emerald-500/40 group-hover:bg-emerald-500/20'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-400 group-hover:border-rose-500/40 group-hover:bg-rose-500/20';

                  if (acertou || revelaCerta) {
                    cardClass = 'border-emerald-500/70 bg-emerald-500/[0.18] text-white ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/15';
                    badgeClass = 'border-emerald-500 bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/30';
                  } else if (errou) {
                    cardClass = 'border-rose-500/70 bg-rose-500/[0.18] text-white ring-1 ring-rose-500/50 shadow-lg shadow-rose-500/15';
                    badgeClass = 'border-rose-500 bg-rose-500 text-white font-black shadow-md shadow-rose-500/30';
                  } else if (escolhida) {
                    if (isOpCerto) {
                      cardClass = 'border-emerald-500 bg-emerald-500/20 text-white ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20';
                      badgeClass = 'border-emerald-500 bg-emerald-500 text-black font-black';
                    } else {
                      cardClass = 'border-rose-500 bg-rose-500/20 text-white ring-2 ring-rose-500/50 shadow-lg shadow-rose-500/20';
                      badgeClass = 'border-rose-500 bg-rose-500 text-white font-black';
                    }
                  }

                  return (
                    <motion.button
                      key={op.id}
                      disabled={!!resposta}
                      onClick={() => { if (!resposta) { haptic.selection(); setSelectedOpcao(id); } }}
                      className={`group relative flex w-full items-center gap-3.5 sm:gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all duration-200 min-h-[3.75rem] sm:min-h-[4.25rem] active:scale-[0.98] cursor-pointer ${cardClass}`}
                      whileTap={{ scale: resposta ? 1 : 0.97 }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 * opIdx }}
                    >
                      <span className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${badgeClass}`}>
                        {isOpCerto ? <Check className="h-5 w-5" strokeWidth={3} /> : <X className="h-5 w-5" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 font-bold text-[16px] sm:text-[17px] md:text-[18px] tracking-wide">
                        {label}
                      </span>
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
                    </motion.button>
                  );
                }

                // Múltipla Escolha Padrão
                const letter = String(op.id).length <= 2 ? String(op.id).toUpperCase() : String.fromCharCode(65 + opIdx);
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
                  <motion.button
                    key={op.id}
                    disabled={!!resposta}
                    onClick={() => { if (!resposta) { haptic.selection(); setSelectedOpcao(id); } }}
                    className={`group relative flex w-full items-center gap-3 sm:gap-4 rounded-2xl border p-3.5 sm:p-4 md:p-5 text-left text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed transition-all duration-200 min-h-[3.5rem] sm:min-h-[4rem] active:scale-[0.98] cursor-pointer ${cardClass}`}
                    whileTap={{ scale: resposta ? 1 : 0.97 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * opIdx }}
                  >
                    <span className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold uppercase transition-colors ${badgeClass}`}>
                      {letter}
                    </span>
                    <span className="flex-1 font-medium">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <span className="inline">{children}</span> }}>
                        {normalizarMarkdown(op.texto)}
                      </ReactMarkdown>
                    </span>
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
                  </motion.button>
                );
              })}
            </div>
          );
        })()}

        {resposta && justificativaText && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mt-8 overflow-hidden"
          >
            <div className="p-5 sm:p-6 rounded-2xl border border-primary/20 bg-primary/[0.03] backdrop-blur-sm relative">
              <h4 className="text-primary text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Gabarito Comentado
              </h4>
              <div className="prose prose-base max-w-none prose-invert prose-p:leading-[1.75] prose-p:text-neutral-200">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>
                  }}
                >
                  {normalizarMarkdown(justificativaText)}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}

        {!onSelectOpcao && (
          <AnimatePresence>
            {!resposta && selectedOpcao && (
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 350 }}
                className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-background/90 backdrop-blur-xl px-4 py-3.5 pb-[calc(1rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] shadow-2xl"
              >
                <div className="mx-auto max-w-3xl lg:max-w-[74ch] xl:max-w-[80ch] flex items-center justify-between gap-4">
                  <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    {['certo', 'errado', 'verdadeiro', 'falso'].includes(selectedOpcao)
                      ? `Opção ${selectedOpcao.toUpperCase()} selecionada`
                      : `Alternativa ${selectedOpcao.toUpperCase()} selecionada`}
                  </div>
                  <button
                    onClick={() => onResponder(selectedOpcao)}
                    className="w-full sm:w-auto sm:min-w-[200px] ml-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-light active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Confirmar Resposta <ArrowRight className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </article>
    );
  }

  if (bloco.tipo === 'flashcard') {
    const { frente, verso, explicacao, exemplo, aplicando, dica } = bloco.payload || {};
    let displayFrente = frente || '';
    let displayVerso = explicacao || verso || bloco.payload?.texto || '';
    let displayTitulo = bloco.payload?.titulo || '';

    displayFrente = limparTextoInstrucoes(displayFrente);
    displayVerso = limparTextoInstrucoes(displayVerso);

    // Auto-extração inteligente de payload bruto legado
    const rawTextToSearch = displayVerso + '\n\n' + displayFrente;
    if (rawTextToSearch.includes('### FRENTE DO CARTÃO') || rawTextToSearch.includes('Pergunta para reflexão')) {
      const fMatch = rawTextToSearch.match(/###\s*FRENTE\s*DO\s*CARTÃO[^\n]*\n+([\s\S]*?)(?=---\s*|###\s*VERSO|$)/i);
      const vMatch = rawTextToSearch.match(/###\s*VERSO\s*DO\s*CARTÃO[^\n]*\n+([\s\S]*$)/i);
      if (fMatch && vMatch) {
        if (!displayTitulo && displayFrente && displayFrente.length < 60) {
          displayTitulo = displayFrente.replace(/^#+\s*/, '').replace(/^\d+[-.)]\s*/, '');
        }
        displayFrente = fMatch[1];
        displayVerso = vMatch[1];
      }
    }

    // Auto-extração do "Exemplo Prático" caso esteja embutido no verso
    let extractedExemplo = exemplo || '';
    if (displayVerso.match(/Exemplo Prático/i)) {
      const parts = displayVerso.split(/Exemplo Prático[^\n]*:?/i);
      if (parts.length > 1) {
         displayVerso = parts[0];
         extractedExemplo = parts[1];
      }
    }

    // Limpeza inteligente de prefixos (Resposta: / Pergunta:)
    displayVerso = displayVerso.replace(/^>*\s*\*\*\s*Resposta\s*:?\s*\*\*\s*/i, '');
    displayVerso = displayVerso.replace(/^(>*\s*\*\*\s*)Resposta\s*:?\s*/i, '$1');
    displayVerso = displayVerso.replace(/^>*\s*Resposta\s*:?\s*/i, '');
    
    displayFrente = displayFrente.replace(/^>*\s*\*\*\s*Pergunta[^\n:]*\s*\*\*\s*:?\s*/i, '');
    displayFrente = displayFrente.replace(/^(>*\s*\*\*\s*)Pergunta[^\n:]*:?\s*/i, '$1');
    displayFrente = displayFrente.replace(/^>*\s*Pergunta[^\n:]*:?\s*/i, '');
    
    displayFrente = displayFrente.replace(/^\s*\([^)]+\):\s*/, '').trim(); // Remove parenteses soltos tipo "(Pergunta de Revisão):"

    // Limpa caracteres soltos de formatação de blockquote no início (preserva markdown como **, #, -, etc)
    displayFrente = displayFrente.replace(/^>\s*/gm, '').trim();
    displayVerso = displayVerso.replace(/^>\s*/gm, '').trim();
    
    extractedExemplo = extractedExemplo.replace(/^>\s*/gm, '').trim();

    displayFrente = displayFrente.split('\n').map((l: string) => l.trim()).filter(Boolean).join('\n\n');
    displayVerso = displayVerso.split('\n').map((l: string) => l.trim()).filter(Boolean).join('\n\n');
    extractedExemplo = extractedExemplo.split('\n').map((l: string) => l.trim()).filter(Boolean).join('\n\n');

    const Divider = ({ label, Icon }: { label: string; Icon?: React.ComponentType<{ className?: string }> }) => (
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
            className="relative w-full min-h-[440px] cursor-pointer"
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
            onClick={onFlip}
          >
            {/* Frente */}
            <div
              className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-[#111] to-[#1a1a1a] border border-white/10 p-4 sm:p-6 md:p-9 flex flex-col shadow-2xl overflow-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-10 -right-10 sm:-bottom-14 sm:-right-14 select-none z-0 overflow-hidden opacity-[0.05] sm:opacity-[0.07] transition-opacity duration-500"
              >
                <img
                  src="/images/gamificacao/direito_penal_prisao_vazado.webp"
                  alt=""
                  loading="eager"
                  decoding="async"
                  className="w-56 h-56 sm:w-80 sm:h-80 md:w-[340px] md:h-[340px] object-contain"
                />
              </div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-white/70">
                  {displayTitulo ? limparMarkdownInline(displayTitulo.replace(/^\d+[-.)]\s*/, '')) : 'FRENTE'}
                </span>
                <Brain className="w-4 h-4 text-primary/80" />
              </div>
              <div className="relative z-10 flex-1 flex items-center justify-center text-center px-2 sm:px-4">
                <div className="font-sans text-[17px] sm:text-[19px] md:text-xl font-normal leading-snug text-white/95 max-w-[50ch] prose prose-invert prose-p:leading-snug prose-p:text-white/95 prose-strong:text-white prose-strong:font-bold prose-ul:list-none prose-li:mb-2 prose-p:mb-4 last:prose-p:mb-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {normalizarMarkdown(displayFrente)}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-white/30 pt-4 sm:pt-6 border-t border-white/5">
                <RotateCw className="w-4 h-4" /> Toque para virar
              </div>
            </div>

            {/* Verso */}
            <div
              className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 p-4 sm:p-6 md:p-9 flex flex-col shadow-2xl backdrop-blur-xl overflow-hidden"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-10 -right-10 sm:-bottom-14 sm:-right-14 select-none z-0 overflow-hidden opacity-[0.03] sm:opacity-[0.05] transition-opacity duration-500"
              >
                <img
                  src="/images/gamificacao/direito_penal_prisao_vazado.webp"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-56 h-56 sm:w-80 sm:h-80 md:w-[340px] md:h-[340px] object-contain"
                />
              </div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest font-extrabold text-primary">
                  Verso · Resposta
                </span>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="relative z-10 flex-1 overflow-y-auto text-left pr-1 sm:pr-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col justify-center">
                <div className="font-sans text-[15px] sm:text-[16px] md:text-[17px] font-normal leading-[1.6] text-white/95 max-w-[55ch] prose prose-invert prose-p:leading-[1.6] prose-p:text-white/95 prose-strong:text-white prose-strong:font-bold prose-ul:pl-5 prose-li:mb-2 prose-li:marker:text-primary prose-p:mb-4 last:prose-p:mb-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {normalizarMarkdown(displayVerso)}
                  </ReactMarkdown>
                </div>
                {extractedExemplo && (
                  <>
                    <Divider label="Exemplo prático" Icon={Lightbulb} />
                    <p className="font-sans text-[15px] leading-relaxed text-white/80 italic">{extractedExemplo}</p>
                  </>
                )}
                {aplicando && (
                  <>
                    <Divider label="Aplicando" Icon={Flag} />
                    <p className="font-sans text-[15px] leading-relaxed text-white/80">{aplicando}</p>
                  </>
                )}
                {dica && (
                  <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">Dica de Ouro</p>
                    <p className="font-sans text-[14px] leading-relaxed text-white/90">{dica}</p>
                  </div>
                )}
              </div>
              <div className="relative z-10 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-white/30 pt-4 sm:pt-6 mt-3 border-t border-white/5">
                <RotateCw className="w-4 h-4" /> Toque para voltar
              </div>
            </div>
          </motion.div>
        </div>


      </article>
    );
  }

  if (bloco.tipo === 'conexao') {
    let pares = Array.isArray(bloco.payload?.pares) ? bloco.payload.pares : [];
    if (pares.length === 0 && typeof bloco.payload?.texto === 'string') {
      const linhas = bloco.payload.texto.split('\n');
      pares = linhas.map((l: string) => {
        const m = l.match(/^[•\-*]\s*(?:\*\*)?([^*:\n]+)(?:\*\*)?:\s*(.+)$/);
        if (m) return { termo: m[1].trim(), definicao: m[2].trim() };
        return null;
      }).filter(Boolean);
    }
    
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
