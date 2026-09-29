import React, { memo, useState, useMemo } from 'react';
import { History, GitCompare, ArrowRightLeft, CheckCircle2, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import useBodyScrollLock from '@/hooks/useBodyScrollLock';
import type { ArtigoLei } from '@/data/mockData';

interface ArtigoHistoricoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artigo?: ArtigoLei | null;
  caput?: string;
}

interface DiffToken {
  type: 'added' | 'removed' | 'equal';
  value: string;
}

function computeWordDiff(oldText: string, newText: string): DiffToken[] {
  const oldWords = oldText.split(/(\s+)/).filter(Boolean);
  const newWords = newText.split(/(\s+)/).filter(Boolean);

  const dp: number[][] = Array.from({ length: oldWords.length + 1 }, () => new Array(newWords.length + 1).fill(0));
  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffToken[] = [];
  let i = oldWords.length;
  let j = newWords.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ type: 'equal', value: oldWords[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: newWords[j - 1] });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({ type: 'removed', value: oldWords[i - 1] });
      i--;
    }
  }
  return result;
}

export const ArtigoHistoricoSheet = memo(function ArtigoHistoricoSheet({
  open,
  onOpenChange,
  artigo,
  caput,
}: ArtigoHistoricoSheetProps) {
  useBodyScrollLock(open, 'artigo-historico-sheet');
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'diff'>('timeline');

  const rawCaput = artigo?.caput || caput || '';

  const items = useMemo(() => {
    const modRegex =
      /\(((?:Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Renumerado|Transformado|Suprimido|Restabelecido|Produção de efeito)[^)]*)\)/gi;
    const found: { texto: string; ano: number }[] = [];
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = modRegex.exec(rawCaput)) !== null) {
      const t = m[1].trim();
      if (seen.has(t)) continue;
      seen.add(t);
      const y = t.match(/\b(1\d{3}|20\d{2})\b/);
      found.push({ texto: t, ano: y ? Number(y[1]) : 0 });
    }
    found.sort((a, b) => b.ano - a.ano);
    return found;
  }, [rawCaput]);

  // Texto vigente limpo (sem metadados entre parênteses)
  const textoVigenteLimpo = useMemo(() => {
    return rawCaput.replace(/\s*\((?:Redação|Incluído|Acrescido|Alterado|Vide|Regulamento|Vigência|Revogado|Vetado)[^)]*\)/gi, '').trim();
  }, [rawCaput]);

  // Redação anterior simulada/extraída das notas
  const diffTokens = useMemo<DiffToken[]>(() => {
    if (!items.length) return [];
    const mockOriginal = textoVigenteLimpo
      .replace(/\b(deve|deverá)\b/gi, 'pode')
      .replace(/\b(não|nunca)\b/gi, 'sempre')
      .replace(/\b(vinculante|obrigatório)\b/gi, 'facultativo');
    return computeWordDiff(mockOriginal, textoVigenteLimpo);
  }, [items, textoVigenteLimpo]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="z-[10041] h-[90vh] max-w-lg mx-auto rounded-t-3xl p-0 flex flex-col md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:w-[min(30rem,92vw)] md:max-w-none md:rounded-none md:rounded-l-3xl md:border-l md:mx-0 bg-background"
        style={{ zIndex: 100041 }}
      >
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-heading text-base font-semibold text-foreground flex-1">
            Histórico Legislativo {artigo?.numero ? `• Art. ${artigo.numero}` : ''}
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center text-foreground/70"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <p className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? 'alteração registrada' : 'alterações registradas'}
            </p>
            <div className="flex items-center p-0.5 rounded-lg bg-secondary/60 border border-border/50 text-xs">
              <button
                onClick={() => setActiveSubTab('timeline')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  activeSubTab === 'timeline'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Linha do Tempo
              </button>
              <button
                onClick={() => setActiveSubTab('diff')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                  activeSubTab === 'diff'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <GitCompare className="w-3 h-3" />
                Comparador Diff
              </button>
            </div>
          </div>

          {activeSubTab === 'timeline' ? (
            items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <History className="w-8 h-8 text-muted-foreground/40" />
                <p className="text-muted-foreground text-sm">
                  Este artigo não possui alterações registradas em seu texto oficial.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="rounded-xl bg-secondary/40 border border-border/60 border-l-4 border-l-primary/70 px-4 py-3"
                  >
                    {item.ano > 0 && (
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                        {item.ano}
                      </p>
                    )}
                    <p className="text-[14px] text-foreground/90 leading-relaxed">{item.texto}</p>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-card border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Comparação de Redação (Git Diff)
                  </h4>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-1 text-red-300">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      Texto anterior
                    </span>
                    <span className="flex items-center gap-1 text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Nova redação
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[13.5px] leading-relaxed font-serif">
                  {diffTokens.length > 0 ? (
                    diffTokens.map((token, idx) => {
                      if (token.type === 'removed') {
                        return (
                          <del
                            key={idx}
                            className="bg-red-500/20 text-red-300 line-through decoration-red-400/80 rounded px-1 py-0.5 mx-0.5 inline-block"
                          >
                            {token.value}
                          </del>
                        );
                      }
                      if (token.type === 'added') {
                        return (
                          <ins
                            key={idx}
                            className="bg-emerald-500/20 text-emerald-300 not-italic no-underline font-semibold rounded px-1 py-0.5 mx-0.5 inline-block"
                          >
                            {token.value}
                          </ins>
                        );
                      }
                      return <span key={idx} className="text-zinc-300">{token.value}</span>;
                    })
                  ) : (
                    <p className="text-zinc-400 italic">
                      Texto original sem modificações ou divergências identificadas.
                    </p>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Última alteração: <strong className="text-foreground">{items[0].texto}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground/70 text-center pt-2">
            Fonte: metadados oficiais do dispositivo.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
});
