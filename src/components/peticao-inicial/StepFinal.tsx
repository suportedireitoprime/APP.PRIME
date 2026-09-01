import { useState, useMemo } from 'react';
import { Download, BookOpen, Pencil, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { gerarPeticaoPDF } from '@/lib/peticaoPdf';
import { Juris, Peticao } from '@/types/peticao';

interface StepFinalProps {
  pet: Peticao;
  onEditJuris: () => void;
  onSave: (v: Partial<Peticao>) => void;
}

export function StepFinal({ pet, onEditJuris }: StepFinalProps) {
  const [fontesOpen, setFontesOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dados = (pet.dados_sensiveis as Record<string, string>) ?? {};
  const pecaPreview = useMemo(() => applyPlaceholders(pet.peca_markdown ?? '', dados, true), [
    pet.peca_markdown,
    dados,
  ]);
  const pecaFinal = useMemo(() => applyPlaceholders(pet.peca_markdown ?? '', dados, false), [
    pet.peca_markdown,
    dados,
  ]);

  const fontes: Array<{ label: string; url?: string }> = (pet.fontes as any) ?? [];

  const exportar = async () => {
    setExporting(true);
    try {
      await gerarPeticaoPDF({
        titulo: pet.titulo,
        areaDireito: pet.area_direito ?? undefined,
        peca: pecaFinal,
        fontes,
      });
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Petição pronta</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toque nos campos amarelos para preencher.
          </p>
        </div>
        <Badge className="bg-green-500 text-white">Finalizada</Badge>
      </div>

      <div className="rounded-2xl bg-card border border-border p-4 max-h-[55vh] overflow-y-auto text-sm leading-relaxed">
        <MarkdownRenderer md={pecaPreview} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={() => setFontesOpen(true)}
          className="h-12 rounded-xl"
        >
          <BookOpen className="w-4 h-4 mr-1" />
          Fontes usadas
        </Button>
        <Button variant="outline" onClick={onEditJuris} className="h-12 rounded-xl">
          <Pencil className="w-4 h-4 mr-1" />
          Editar jurisprudência
        </Button>
      </div>

      <Button
        onClick={exportar}
        disabled={exporting}
        className="w-full h-14 rounded-xl font-bold bg-gradient-to-br from-[hsl(0_72%_52%)] to-[hsl(0_70%_40%)] text-primary-foreground hover:opacity-90"
      >
        {exporting ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Download className="w-5 h-5 mr-2" />
        )}
        Exportar PDF
      </Button>

      <Sheet open={fontesOpen} onOpenChange={setFontesOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl h-[90vh]">
          <SheetHeader>
            <SheetTitle>Fontes usadas</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-2 overflow-y-auto">
            {fontes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma fonte externa citada.
              </p>
            )}
            {fontes.map((f, i) => (
              <div key={i} className="p-3 rounded-xl bg-card border border-border">
                <p className="text-sm font-semibold">{f.label}</p>
                {f.url && (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="truncate">{f.url}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function applyPlaceholders(md: string, dados: Record<string, string>, previewMask: boolean) {
  return md.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    const value = dados[key];
    if (value && value.length > 0) return value;
    if (key === 'DATA_HOJE') return new Date().toLocaleDateString('pt-BR');
    if (previewMask) {
      // Placeholder amarelo visual — no preview mostramos como pill
      return `[[${key}]]`;
    }
    // No PDF, se não foi preenchido, deixa em branco marcado
    return `_____________`;
  });
}

function MarkdownRenderer({ md }: { md: string }) {
  const blocks = md.split(/\n\n+/);
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        if (/^##\s+/.test(b)) {
          return (
            <h3 key={i} className="font-display font-bold text-base mt-4">
              {b.replace(/^##\s+/, '')}
            </h3>
          );
        }
        return (
          <p key={i} className="text-foreground/90 whitespace-pre-wrap">
            {renderInline(b)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(s: string): React.ReactNode {
  // [[PLACEHOLDER]] = pill amarelo
  // [text](url) = link azul
  const nodes: React.ReactNode[] = [];
  const re = /\[\[([A-Z_]+)\]\]|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) nodes.push(s.slice(last, m.index));
    if (m[1]) {
      nodes.push(
        <span
          key={key++}
          className="inline-block px-2 py-0.5 mx-0.5 rounded-md bg-[hsl(0_72%_52%)]/70 text-primary-foreground text-xs font-semibold border border-[hsl(0_70%_40%)]"
        >
          {m[1].replace(/_/g, ' ').toLowerCase()}
        </span>,
      );
    } else if (m[2] !== undefined && m[3] !== undefined) {
      const url = m[3];
      if (url.startsWith('http')) {
        nodes.push(
          <a
            key={key++}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            {m[2]}
          </a>,
        );
      } else {
        nodes.push(
          <span key={key++} className="text-blue-600 underline decoration-dotted">
            {m[2]}
          </span>,
        );
      }
    } else if (m[4]) {
      nodes.push(
        <strong key={key++}>{m[4]}</strong>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) nodes.push(s.slice(last));
  return <>{nodes}</>;
}
