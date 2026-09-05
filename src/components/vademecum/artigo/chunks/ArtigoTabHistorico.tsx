import React, { memo, useMemo } from 'react';
import { History } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';

interface ArtigoTabHistoricoProps {
  caput?: string;
}

export const ArtigoTabHistorico = memo(function ArtigoTabHistorico({
  caput,
}: ArtigoTabHistoricoProps) {
  const items = useMemo(() => {
    const modRegex =
      /\(((?:Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Renumerado|Transformado|Suprimido|Restabelecido|Produção de efeito)[^)]*)\)/gi;
    const found: { texto: string; ano: number }[] = [];
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    const src = caput || '';
    while ((m = modRegex.exec(src)) !== null) {
      const t = m[1].trim();
      if (seen.has(t)) continue;
      seen.add(t);
      const y = t.match(/\b(1\d{3}|20\d{2})\b/);
      found.push({ texto: t, ano: y ? Number(y[1]) : 0 });
    }
    found.sort((a, b) => b.ano - a.ano);
    return found;
  }, [caput]);

  return (
    <TabsContent value="historico" className="px-5 pb-[calc(8rem+var(--sai-bottom))] pt-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-primary">
          <History className="w-4 h-4" />
          <p className="text-sm font-semibold uppercase tracking-wider">Histórico de alterações</p>
        </div>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">
            Este artigo não possui alterações registradas em seu texto oficial.
          </p>
        ) : (
          <ul className="space-y-2">
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
        )}
        <p className="text-[11px] text-muted-foreground/70 text-center pt-2">
          Fonte: metadados oficiais do dispositivo.
        </p>
      </div>
    </TabsContent>
  );
});
