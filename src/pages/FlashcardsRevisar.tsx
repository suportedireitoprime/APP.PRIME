import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { Button } from '@/components/ui/button';
import { RotateCcw, BookOpen, Scale, Lightbulb, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type Item = {
  id: string;
  area: string;
  tema: string | null;
  pergunta: string;
  resposta: string;
  exemplo: string | null;
  base_legal: string | null;
  dica: string | null;
  reforco_conteudo: string | null;
};

const FlashcardsRevisar = () => {
  const navigate = useNavigate();
  const [itens, setItens] = useState<Item[]>([]);
  const [areas, setAreas] = useState<{ area: string; a_revisar: number }[]>([]);
  const [areaSel, setAreaSel] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = async (area: string | null) => {
    setLoading(true);
    const { data } = await supabase.rpc('flashcards_sessao', {
      _areas: area ? [area] : null,
      _temas: null,
      _modo: 'revisar',
      _deck_id: null,
      _limit: 50,
    });
    setItens((data as unknown as Item[]) || []);
    setLoading(false);
  };

  useEffect(() => { carregar(areaSel); }, [areaSel]);

  useEffect(() => {
    supabase.rpc('flashcards_resumo_areas').then(({ data }) => {
      if (data) {
        setAreas(
          (data as any[])
            .filter((a) => Number(a.a_revisar) > 0)
            .map((a) => ({ area: a.area, a_revisar: Number(a.a_revisar) })),
        );
      }
    });
  }, []);

  const marcarCompreendido = async (cardId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase
      .from('flashcards_progresso')
      .update({ status: 'compreendido', ultima_resposta_em: new Date().toISOString() })
      .eq('user_id', auth.user.id)
      .eq('card_id', cardId);
    if (error) { toast.error('Não foi possível atualizar'); return; }
    setItens((prev) => prev.filter((i) => i.id !== cardId));
    toast.success('Marcado como compreendido');
  };

  return (
    <div className="min-h-dvh bg-background pb-24">
      <div className="mx-auto w-full md:max-w-[900px]">
        <PageHeader
          title="Revisar"
          subtitle="Material de apoio do que você marcou"
          onBack={() => navigate('/flashcards')}
        />

        <div className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAreaSel(null)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                !areaSel ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground'
              }`}
            >
              Todas
            </button>
            {areas.map((a) => (
              <button
                key={a.area}
                onClick={() => setAreaSel(a.area)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  areaSel === a.area ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground'
                }`}
              >
                {a.area} · {a.a_revisar}
              </button>
            ))}
          </div>

          {itens.length > 0 && (
            <Button
              className="w-full rounded-2xl"
              onClick={() =>
                navigate(
                  `/flashcards/estudar?modo=revisar${areaSel ? `&area=${encodeURIComponent(areaSel)}` : ''}`,
                )
              }
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Iniciar sessão de revisão
            </Button>
          )}

          {loading && <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>}

          {!loading && !itens.length && (
            <div className="py-16 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
              <p className="font-semibold text-foreground">Nada para revisar</p>
              <p className="text-sm text-muted-foreground">
                Marque flashcards como "Revisar" durante o estudo.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {itens.map((i) => {
              const open = aberto === i.id;
              return (
                <div key={i.id} className="rounded-2xl border border-border bg-card p-4">
                  <button className="w-full text-left" onClick={() => setAberto(open ? null : i.id)}>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        {i.area}
                      </span>
                      {i.tema && (
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                          {i.tema}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{i.pergunta}</p>
                  </button>

                  {open && (
                    <div className="mt-3 space-y-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{i.resposta}</p>
                      {i.reforco_conteudo && (
                        <Bloco icon={BookOpen} titulo="Material de reforço" texto={i.reforco_conteudo} />
                      )}
                      {i.exemplo && <Bloco icon={BookOpen} titulo="Exemplo" texto={i.exemplo} />}
                      {i.base_legal && <Bloco icon={Scale} titulo="Base legal" texto={i.base_legal} />}
                      {i.dica && <Bloco icon={Lightbulb} titulo="Dica" texto={i.dica} />}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => marcarCompreendido(i.id)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Já compreendi
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <FlashcardsBottomNav />
    </div>
  );
};

function Bloco({ icon: Icon, titulo, texto }: { icon: any; titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {titulo}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{texto}</p>
    </div>
  );
}

export default FlashcardsRevisar;
