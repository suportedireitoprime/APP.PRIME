import { useState } from 'react';
import { Loader2, ExternalLink, Trash2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { Juris, Peticao } from '@/types/peticao';

interface StepJurisprudenciaProps {
  pet: Peticao;
  onNext: (v: Partial<Peticao>) => void;
  onBack: () => void;
}

export function StepJurisprudencia({ pet, onNext, onBack }: StepJurisprudenciaProps) {
  const [incluir, setIncluir] = useState<boolean>((pet.jurisprudencias as Juris[])?.length > 0);
  const [items, setItems] = useState<Juris[]>((pet.jurisprudencias as Juris[]) ?? []);
  const [loading, setLoading] = useState(false);
  const [pontos, setPontos] = useState('');
  const [pontosOpen, setPontosOpen] = useState(false);

  const buscar = async (foco?: string) => {
    setLoading(true);
    try {
      const { withOnlineGuard } = await import('@/lib/onlineGuard');
      const { data, error } = await withOnlineGuard(
        () => supabase.functions.invoke('peticao', {
          body: { fn: 'jurisprudencia',
            tema: pet.resumo,
            area_direito: pet.area_direito,
            fatos_resumo: pet.resumo ?? pet.fatos_texto,
            pontos_foco: foco,
            quantidade: 4,
          },
        }),
        { message: 'Sem internet — a busca de jurisprudência precisa de conexão.' },
      );
      if (error) throw error;
      const list: Juris[] = data?.jurisprudencias ?? [];
      if (!list.length) {
        toast.info('Nenhuma jurisprudência real encontrada no Corpus927 para este caso.');
        setItems([]);
      } else if (data?.usou_fallback) {
        toast.info('Corpus927 sem resultado — usei busca web (STF/STJ) como fallback.');
        setItems(list);
      } else {
        toast.success(`Corpus927 (Enfam/STJ) retornou ${list.length} jurisprudência(s) reais.`);
        setItems(list);
      }
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao buscar jurisprudência');
    } finally {
      setLoading(false);
    }
  };

  const remover = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const buscarMais = async () => {
    setLoading(true);
    try {
      const { withOnlineGuard } = await import('@/lib/onlineGuard');
      const { data } = await withOnlineGuard(
        () => supabase.functions.invoke('peticao', {
          body: { fn: 'jurisprudencia',
            tema: pet.resumo,
            area_direito: pet.area_direito,
            fatos_resumo: pet.resumo ?? pet.fatos_texto,
            quantidade: 4,
          },
        }),
        { message: 'Sem internet — não é possível buscar mais jurisprudências.' },
      );
      const novos: Juris[] = data?.jurisprudencias ?? [];
      const existentes = new Set(items.map((i) => i.link));
      const filtrados = novos.filter((n) => n.link && !existentes.has(n.link));
      if (!filtrados.length) toast.info('Nada novo por agora.');
      else setItems([...items, ...filtrados]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold">Jurisprudência</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Buscamos primeiro no <strong>Corpus927 (Enfam/STJ)</strong> — jurisprudências
          <strong> reais</strong>, com link oficial. Se não houver, caímos em busca web no STF/STJ.
        </p>
      </div>

      {!incluir ? (
        <div className="rounded-2xl border border-border p-5 space-y-3">
          <p className="text-sm">Deseja incluir jurisprudência real do STF/STJ na sua petição?</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl"
              onClick={() => onNext({ jurisprudencias: [] })}
            >
              Sem jurisprudência
            </Button>
            <Button
              onClick={() => {
                setIncluir(true);
                buscar();
              }}
              className="flex-1 h-12 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800"
            >
              Buscar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {loading && items.length === 0 && (
            <div className="rounded-xl bg-card border border-border p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[hsl(0_70%_40%)] mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Agente pesquisador consultando o Corpus927 (Enfam/STJ)…
              </p>
            </div>
          )}

          {items.map((j, i) => (
            <div key={i} className="rounded-xl bg-card border border-border p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Badge
                  className={`shrink-0 ${
                    j.tribunal === 'STF'
                      ? 'bg-blue-600 hover:bg-blue-600'
                      : 'bg-green-600 hover:bg-green-600'
                  } text-white`}
                >
                  {j.tribunal}
                </Badge>
                {j.tipo && (
                  <Badge variant="outline" className="text-xs">
                    {j.tipo} {j.numero ? `nº ${j.numero}` : ''}
                  </Badge>
                )}
              </div>
              <p className="font-semibold text-sm">{j.titulo || j.tese?.slice(0, 100)}</p>
              {j.tese && (
                <p className="text-xs text-muted-foreground line-clamp-3">{j.tese}</p>
              )}
              <div className="flex items-center justify-between pt-1">
                {j.link && (
                  <a
                    href={j.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 min-w-0"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">Fonte oficial</span>
                  </a>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => remover(i)}
                    className="w-8 h-8 grid place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    aria-label="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {items.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={buscarMais}
                disabled={loading}
                className="flex-1 h-11 rounded-xl"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Buscar mais
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPontosOpen(true)}
                className="flex-1 h-11 rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refazer c/ foco
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1 h-12 rounded-xl">
          Voltar
        </Button>
        <Button
          onClick={() => onNext({ jurisprudencias: items })}
          disabled={loading}
          className="flex-[2] h-12 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800"
        >
          Continuar
        </Button>
      </div>

      <Sheet open={pontosOpen} onOpenChange={setPontosOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Refazer busca com foco</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Ex.: "foco em dano moral por inscrição indevida no SPC/Serasa"
            </p>
            <Textarea
              value={pontos}
              onChange={(e) => setPontos(e.target.value)}
              placeholder="Digite o foco…"
              className="min-h-[100px]"
            />
            <Button
              onClick={async () => {
                setPontosOpen(false);
                await buscar(pontos);
                setPontos('');
              }}
              className="w-full h-12 rounded-xl bg-gray-900 text-white font-bold"
            >
              Buscar com foco
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
