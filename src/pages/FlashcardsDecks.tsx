import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Play, Trash2, FolderPlus } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

type Deck = {
  id: string;
  nome: string;
  descricao: string | null;
  filtros: any;
  total_cards: number;
};

const FlashcardsDecks = () => {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [nome, setNome] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    const { data } = await supabase
      .from('flashcards_decks')
      .select('*')
      .order('created_at', { ascending: false });
    setDecks((data as unknown as Deck[]) || []);
  };

  useEffect(() => {
    carregar();
    supabase.rpc('flashcards_resumo_areas').then(({ data }) => {
      if (data) setAreas((data as any[]).map((a) => a.area));
    });
  }, []);

  const criar = async () => {
    if (!nome.trim() || !sel.length) {
      toast.error('Dê um nome e escolha ao menos uma área');
      return;
    }
    setSalvando(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setSalvando(false); return; }

    const { count } = await supabase
      .from('flashcards_cards')
      .select('id', { count: 'exact', head: true })
      .in('area', sel);

    const { error } = await supabase.from('flashcards_decks').insert({
      user_id: auth.user.id,
      nome: nome.trim(),
      descricao: sel.join(' · '),
      filtros: { areas: sel },
      total_cards: count ?? 0,
    });
    setSalvando(false);
    if (error) { toast.error('Não foi possível criar o deck'); return; }
    toast.success('Deck criado');
    setNome(''); setSel([]); setAberto(false);
    carregar();
  };

  const excluir = async (id: string) => {
    const { error } = await supabase.from('flashcards_decks').delete().eq('id', id);
    if (error) { toast.error('Não foi possível excluir'); return; }
    setDecks((d) => d.filter((x) => x.id !== id));
  };

  const estudar = (d: Deck) => {
    const areasDeck: string[] = d.filtros?.areas || [];
    const qs = areasDeck.length === 1 ? `?area=${encodeURIComponent(areasDeck[0])}` : '';
    if (areasDeck.length > 1) {
      navigate(`/flashcards/estudar?areas=${encodeURIComponent(areasDeck.join('|'))}`);
      return;
    }
    navigate(`/flashcards/estudar${qs}`);
  };

  return (
    <div className="min-h-dvh bg-background pb-24">
      <div className="mx-auto w-full md:max-w-[900px]">
        <PageHeader
          title="Meus decks"
          subtitle="Monte combinações de áreas"
          onBack={() => navigate('/flashcards')}
        />

        <div className="space-y-4 p-4">
          <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
              <Button className="w-full rounded-2xl">
                <Plus className="mr-2 h-4 w-4" /> Novo deck
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85dvh] overflow-y-auto">
              <DialogHeader><DialogTitle>Novo deck</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do deck" />
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Áreas</p>
                  <div className="flex flex-wrap gap-2">
                    {areas.map((a) => {
                      const on = sel.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setSel((s) => (on ? s.filter((x) => x !== a) : [...s, a]))}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                            on ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-foreground'
                          }`}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={criar} disabled={salvando} className="w-full">
                  {salvando ? 'Criando…' : 'Criar deck'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {!decks.length && (
            <div className="py-16 text-center">
              <FolderPlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum deck ainda. Crie um combinando as áreas que quer estudar.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {decks.map((d) => (
              <div key={d.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{d.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.descricao}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {(d.total_cards || 0).toLocaleString('pt-BR')} cards
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="icon" variant="outline" onClick={() => estudar(d)}>
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => excluir(d.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FlashcardsBottomNav />
    </div>
  );
};

export default FlashcardsDecks;
