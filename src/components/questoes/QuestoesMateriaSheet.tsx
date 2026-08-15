import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase as db } from '@/integrations/supabase/client';
import { 
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, 
  DrawerFooter, DrawerClose 
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, Layers } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { haptic } from '@/lib/nativeHaptics';

interface QuestoesMateriaSheetProps {
  materia: string | null;
  aberto: boolean;
  onOpenChange: (o: boolean) => void;
}

export function QuestoesMateriaSheet({ materia, aberto, onOpenChange }: QuestoesMateriaSheetProps) {
  const navigate = useNavigate();
  const [assuntos, setAssuntos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [assuntoSelecionado, setAssuntoSelecionado] = useState<string>('todos');
  const [qtd, setQtd] = useState<string>('10');

  useEffect(() => {
    if (aberto && materia) {
      setLoading(true);
      setAssuntoSelecionado('todos');
      setQtd('10');
      db.rpc('questoes_filtro_counts', {
        _segmentos: null,
        _disciplinas: [materia],
        _assuntos: null,
        _anos: null,
        _bancas: null,
      }).then(({ data, error }) => {
        if (!error && data) {
          setAssuntos((data as any).assuntos || {});
        }
        setLoading(false);
      });
    }
  }, [aberto, materia]);

  const listaAssuntos = useMemo(() => {
    return Object.entries(assuntos)
      .sort((a, b) => b[1] - a[1])
      .map(([nome, count]) => ({ nome, count }));
  }, [assuntos]);

  const totalMateria = useMemo(() => {
    return listaAssuntos.reduce((acc, a) => acc + a.count, 0);
  }, [listaAssuntos]);

  const handlePraticar = () => {
    if (!materia) return;
    haptic.selection();
    const params = new URLSearchParams();
    params.set('area', materia);
    
    if (assuntoSelecionado !== 'todos') {
      params.set('filtro', '1');
      const filtroData = {
        segmentos: [],
        disciplinas: [materia],
        assuntos: [assuntoSelecionado],
        anos: [],
        status: 'todos',
        ordem: 'embaralhado',
        quantidade: qtd === 'todas' ? null : Number(qtd),
      };
      localStorage.setItem('questoes:filtro', JSON.stringify(filtroData));
    } else {
      if (qtd !== 'todas') {
        params.set('qtd', qtd);
      }
    }
    
    onOpenChange(false);
    navigate(`/questoes/praticar?${params.toString()}`);
  };

  return (
    <Drawer open={aberto} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background max-h-[90vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {materia}
          </DrawerTitle>
          <DrawerDescription>
            Configure sua sessão de estudos para esta matéria.
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Escolha o Tema
                </label>
                <Select value={assuntoSelecionado} onValueChange={setAssuntoSelecionado}>
                  <SelectTrigger className="w-full h-12 bg-card rounded-xl border-border/80">
                    <SelectValue placeholder="Selecione um tema" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="todos">
                      Todos os temas ({totalMateria})
                    </SelectItem>
                    {listaAssuntos.map((a) => (
                      <SelectItem key={a.nome} value={a.nome}>
                        {a.nome} <span className="text-muted-foreground ml-1">({a.count})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Quantas questões?</label>
                <div className="grid grid-cols-4 gap-2">
                  {['10', '20', '50', 'todas'].map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        haptic.selection();
                        setQtd(v);
                      }}
                      className={`h-12 rounded-xl border font-semibold transition-all ${
                        qtd === v 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-card text-muted-foreground border-border/80 hover:border-primary/50'
                      }`}
                    >
                      {v === 'todas' ? 'Todas' : v}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DrawerFooter className="pt-2 pb-safe">
          <Button 
            onClick={handlePraticar} 
            disabled={loading}
            className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
          >
            Começar a Praticar
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="h-12 rounded-xl">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
