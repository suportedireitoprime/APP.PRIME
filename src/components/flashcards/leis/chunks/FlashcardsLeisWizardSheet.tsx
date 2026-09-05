import React, { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Scale } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { StepRow, SelecaoSheet } from '@/components/flashcards/FlashcardsFiltroSheet';
import { QuantidadeSheet } from '@/components/flashcards/QuantidadeSheet';
import { haptic } from '@/lib/nativeHaptics';
import { TemaRow, STATUS_LEIS } from './flashcardsLeisConstants';
import { FlashcardsLeisStatusSheet } from './FlashcardsLeisStatusSheet';

interface FlashcardsLeisWizardSheetProps {
  leiSelecionada: TemaRow | null;
  onClose: () => void;
  cardsDisponiveis: { tema: string; artigo: string }[];
  loadingCards: boolean;
  infoPorTitulo: Record<string, { count: number; minArt: number; maxArt: number }>;
  titulosUnicos: string[];
  artigosUnicos: string[];
  cardsPorArtigo: Record<string, number>;
  totalCardsFiltrados: number;
  onStartSession: (config: {
    temas: string[];
    artigos: string[];
    modo: string;
    quantidade?: number | 'todos';
    ordem: 'sequencial' | 'embaralhado';
  }) => void;
}

export function FlashcardsLeisWizardSheet({
  leiSelecionada,
  onClose,
  cardsDisponiveis,
  loadingCards,
  infoPorTitulo,
  titulosUnicos,
  artigosUnicos,
  cardsPorArtigo,
  totalCardsFiltrados,
  onStartSession,
}: FlashcardsLeisWizardSheetProps) {
  const [passo, setPasso] = useState<null | 'titulos' | 'artigos' | 'status' | 'quantidade' | 'ordem'>(null);
  const [statusSel, setStatusSel] = useState<string>('');
  const [quantidadeSel, setQuantidadeSel] = useState<number | 'todos' | undefined>(undefined);
  const [ordemSel, setOrdemSel] = useState<'sequencial' | 'embaralhado'>('sequencial');
  const [titulosSelecionados, setTitulosSelecionados] = useState<string[]>([]);
  const [artigosSelecionados, setArtigosSelecionados] = useState<string[]>([]);
  const [etapaAlcancada, setEtapaAlcancada] = useState<number>(1);

  const renderTituloOpcao = (opcao: string) => {
    if (!leiSelecionada) return opcao;
    const prefix = leiSelecionada.tema + ' - ';
    const prefixCurto = (leiSelecionada.nome_curto || '') + ' - ';

    let name = opcao;
    if (opcao.toLowerCase().startsWith(prefix.toLowerCase())) {
      name = opcao.slice(prefix.length);
    } else if (prefixCurto !== ' - ' && opcao.toLowerCase().startsWith(prefixCurto.toLowerCase())) {
      name = opcao.slice(prefixCurto.length);
    }

    const info = infoPorTitulo[opcao];
    const count = info?.count || 0;
    const faixa =
      info && info.minArt < 999999
        ? info.minArt === info.maxArt
          ? `Art. ${info.minArt}`
          : `Arts. ${info.minArt} a ${info.maxArt}`
        : null;

    const limpo = name.replace(/\r?\n/g, ' - ').replace(/\s+/g, ' ').trim();
    const badges: string[] = [];
    let remaining = limpo;

    const structRegex = /^(?:PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+[\wºª]+(?:-[\wºª]+)?/i;

    while (true) {
      const match = remaining.match(structRegex);
      if (!match) break;

      badges.push(match[0].toUpperCase());
      remaining = remaining.slice(match[0].length).trim();

      if (remaining.startsWith('-') || remaining.startsWith('–') || remaining.startsWith(':')) {
        remaining = remaining.replace(/^[-–—:]+\s*/, '').trim();
      }
    }

    const formatSentence = (s: string) => {
      if (!s) return null;
      const minors = new Set([
        'da', 'de', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'ao', 'à', 'às', 'por', 'para', 'com', 'sem', 'sob', 'ou',
      ]);
      return s
        .toLowerCase()
        .split(/\s+/)
        .map((word, i) => {
          if (i === 0 || !minors.has(word)) {
            return word.charAt(0).toUpperCase() + word.slice(1);
          }
          return word;
        })
        .join(' ');
    };

    const description = formatSentence(remaining);

    return (
      <div className="flex w-full items-center justify-between pr-2 py-1">
        <div className="flex flex-col min-w-0 pr-2">
          {(badges.length > 0 || faixa) && (
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              {badges.map((b, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-emerald-500/50 shrink-0" />}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    {b}
                  </span>
                </div>
              ))}
              {badges.length > 0 && faixa && (
                <ChevronRight className="h-3 w-3 text-emerald-500/50 shrink-0" />
              )}
              {faixa && (
                <span className="text-[11px] font-bold text-[#36AF85] whitespace-nowrap">
                  {faixa}
                </span>
              )}
            </div>
          )}
          {description && (
            <span className="text-[15px] font-bold text-zinc-100 leading-snug tracking-tight">
              {description}
            </span>
          )}
        </div>
        {count > 0 && (
          <span className="text-[12px] font-bold text-zinc-300 bg-zinc-800/90 border border-zinc-700/80 px-2.5 py-1 rounded-lg ml-2 whitespace-nowrap shrink-0 shadow-sm">
            {count} {count === 1 ? 'card' : 'cards'}
          </span>
        )}
      </div>
    );
  };

  const renderArtigoOpcao = (art: string) => {
    const count = cardsPorArtigo[art] || 0;
    const isNum = /^\d+$/.test(art);
    const label = isNum ? `Artigo ${art}` : art;
    return (
      <div className="flex w-full items-center justify-between pr-2 py-0.5">
        <span className="text-[15px] font-bold text-zinc-100">{label}</span>
        {count > 0 && (
          <span className="text-[12px] font-medium text-zinc-400 bg-zinc-800/80 border border-zinc-700/50 px-2.5 py-0.5 rounded-full ml-2 whitespace-nowrap shrink-0">
            {count} {count === 1 ? 'card' : 'cards'}
          </span>
        )}
      </div>
    );
  };

  const handleStart = () => {
    if (!leiSelecionada || !statusSel) return;
    haptic.selection?.();
    const temasParaEnviar = titulosSelecionados.length > 0 ? titulosSelecionados : titulosUnicos;
    onStartSession({
      temas: temasParaEnviar,
      artigos: artigosSelecionados,
      modo: statusSel,
      quantidade: quantidadeSel,
      ordem: ordemSel,
    });
  };

  return (
    <Sheet open={!!leiSelecionada} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-border/50 bg-background/95 p-0 backdrop-blur-xl h-[95dvh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 pb-4 pt-safe-header border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 transition-colors active:scale-95"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[20px] font-extrabold text-zinc-100 tracking-tight uppercase">
              <Scale className="h-5 w-5 text-[#36AF85]" /> CONFIGURAR SESSÃO
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-zinc-400 truncate">
              {leiSelecionada?.tema}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto px-4 pb-4 pt-2">
          <StepRow
            step={1}
            label="Títulos"
            hint={
              titulosSelecionados.length
                ? `${titulosSelecionados.length} selecionado(s)`
                : loadingCards
                ? 'Carregando títulos...'
                : 'Todos os títulos'
            }
            active={passo === 'titulos'}
            done={etapaAlcancada >= 2 || !!titulosSelecionados.length}
            badge={titulosSelecionados.length || undefined}
            onClick={() => setPasso('titulos')}
          />
          <StepRow
            step={2}
            label="Artigos"
            hint={
              artigosSelecionados.length
                ? `${artigosSelecionados.length} selecionado(s)`
                : 'Todos os artigos'
            }
            active={passo === 'artigos'}
            done={etapaAlcancada >= 3 || !!artigosSelecionados.length}
            locked={etapaAlcancada < 2}
            badge={artigosSelecionados.length || undefined}
            onClick={() => setPasso('artigos')}
          />
          <StepRow
            step={3}
            label="Status"
            hint={
              statusSel
                ? STATUS_LEIS.find((s) => s.id === statusSel)?.label || ''
                : 'Selecione o status'
            }
            active={passo === 'status'}
            done={!!statusSel || etapaAlcancada >= 4}
            locked={etapaAlcancada < 3}
            onClick={() => setPasso('status')}
          />
          <StepRow
            step={4}
            label="Quantidade"
            hint={
              quantidadeSel === 'todos'
                ? 'Todos os flashcards'
                : quantidadeSel
                ? `${quantidadeSel} flashcards`
                : 'Selecione a quantidade'
            }
            active={passo === 'quantidade'}
            done={etapaAlcancada >= 5}
            locked={etapaAlcancada < 4}
            onClick={() => setPasso('quantidade')}
          />
          <StepRow
            step={5}
            label="Ordem de Exibição"
            hint={ordemSel === 'sequencial' ? 'Sequencial' : 'Aleatório'}
            active={passo === 'ordem'}
            done={etapaAlcancada >= 5}
            locked={etapaAlcancada < 5}
            onClick={() => setPasso('ordem')}
          />
        </div>

        <div className="flex items-center gap-3 border-t border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md px-5 pb-safe-nav pt-4">
          <button
            type="button"
            onClick={handleStart}
            disabled={!statusSel}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#36AF85] hover:bg-[#2C9570] text-[16px] font-black text-white shadow-lg shadow-black/40 active:scale-[0.98] transition-all [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)] disabled:opacity-50"
          >
            Iniciar Sessão
          </button>
        </div>

        <AnimatePresence>
          {passo === 'titulos' && (
            <SelecaoSheet
              key="tit"
              titulo="Títulos"
              buscavel
              opcoes={titulosUnicos}
              selecionado={titulosSelecionados}
              loading={loadingCards}
              totalCount={cardsDisponiveis.length}
              itemHeight={86}
              onFechar={() => setPasso(null)}
              onConfirmar={(v) => {
                setTitulosSelecionados(v);
                setArtigosSelecionados([]);
                setEtapaAlcancada((prev) => Math.max(prev, 2));
                setPasso('artigos');
              }}
              renderOpcao={renderTituloOpcao}
            />
          )}
          {passo === 'artigos' && (
            <SelecaoSheet
              key="art"
              titulo="Artigos"
              buscavel
              opcoes={artigosUnicos}
              selecionado={artigosSelecionados}
              loading={loadingCards}
              totalCount={
                cardsDisponiveis.filter(
                  (c) =>
                    titulosSelecionados.length === 0 ||
                    titulosSelecionados.includes(c.tema)
                ).length
              }
              itemHeight={64}
              onFechar={() => setPasso(null)}
              onConfirmar={(v) => {
                setArtigosSelecionados(v);
                setEtapaAlcancada((prev) => Math.max(prev, 3));
                setPasso('status');
              }}
              renderOpcao={renderArtigoOpcao}
            />
          )}
          {passo === 'status' && (
            <FlashcardsLeisStatusSheet
              key="status"
              statusSel={statusSel}
              totalCount={totalCardsFiltrados}
              onFechar={() => setPasso(null)}
              onConfirmar={(s) => {
                setStatusSel(s);
                setEtapaAlcancada((prev) => Math.max(prev, 4));
                setPasso('quantidade');
              }}
            />
          )}
          {passo === 'quantidade' && (
            <QuantidadeSheet
              key="qtd"
              quantidadeSel={quantidadeSel}
              totalCount={totalCardsFiltrados}
              onFechar={() => setPasso(null)}
              onConfirmar={(q) => {
                setQuantidadeSel(q);
                setEtapaAlcancada((prev) => Math.max(prev, 5));
                setPasso('ordem');
              }}
            />
          )}
          {passo === 'ordem' && (
            <SelecaoSheet
              key="ord"
              titulo="Ordem de Exibição"
              single
              opcoes={['Sequencial', 'Aleatório']}
              selecionado={[ordemSel === 'sequencial' ? 'Sequencial' : 'Aleatório']}
              onFechar={() => setPasso(null)}
              onConfirmar={(v) => {
                setOrdemSel(v[0] === 'Sequencial' ? 'sequencial' : 'embaralhado');
                setPasso(null);
              }}
            />
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
}
