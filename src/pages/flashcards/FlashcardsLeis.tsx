import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { ChevronRight, Search, Sparkles, Scale, BookOpen, Clock, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { haptic } from '@/lib/nativeHaptics';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// Types
type TemaRow = {
  tema: string;
  total: number;
  estudados?: number;
  compreendidos: number;
  a_revisar: number;
  area?: string;
};

const isLei = (tema: string) => {
  const t = tema.toLowerCase();
  return (
    t.includes('lei') || t.includes('código') || t.includes('estatuto') ||
    t.includes('constituição') || t.includes('cf') || t.includes('súmula') ||
    t.includes('resolução') || t.includes('decreto') || t.includes('clt')
  );
};

export default function FlashcardsLeis() {
  const navigate = useNavigate();
  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();
  const areas = areasRaw || [];

  const [todasLeis, setTodasLeis] = useState<TemaRow[]>([]);
  const [loadingLeis, setLoadingLeis] = useState(false);
  const [busca, setBusca] = useState('');

  // Selected state for the bottom sheet
  const [leiSelecionada, setLeiSelecionada] = useState<TemaRow | null>(null);
  const [passo, setPasso] = useState<1 | 2>(1); // 1 = Status, 2 = Ordem
  const [statusSel, setStatusSel] = useState<string>('');
  const [ordemSel, setOrdemSel] = useState<'sequencial' | 'embaralhado'>('sequencial');

  useEffect(() => {
    document.title = 'Flashcards Leis | Vade Mecum PRIME';
  }, []);

  useEffect(() => {
    if (!areasRaw || areasRaw.length === 0) return;
    
    let isMounted = true;
    const fetchAllLeis = async () => {
      setLoadingLeis(true);
      try {
        const promises = areasRaw.map(a => 
          supabase.rpc('flashcards_temas', { _area: a.area })
            .then(res => {
              if (res.error) return [];
              return (res.data || []).filter(t => isLei(t.tema)).map(t => ({ ...t, area: a.area }));
            })
        );
        const results = await Promise.all(promises);
        const flattened = results.flat() as TemaRow[];
        
        // Sort alphabetically
        flattened.sort((a, b) => a.tema.localeCompare(b.tema, 'pt-BR'));
        
        if (isMounted) {
          setTodasLeis(flattened);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingLeis(false);
      }
    };

    fetchAllLeis();
    return () => { isMounted = false; };
  }, [areasRaw]);

  const listaFiltrada = useMemo(() => {
    if (!busca.trim()) return todasLeis;
    const q = busca.toLowerCase();
    return todasLeis.filter(t => t.tema.toLowerCase().includes(q) || (t.area && t.area.toLowerCase().includes(q)));
  }, [todasLeis, busca]);

  // Group by area for better visual organization
  const groupedLeis = useMemo(() => {
    const groups: Record<string, TemaRow[]> = {};
    for (const lei of listaFiltrada) {
      const area = lei.area || 'Outros';
      if (!groups[area]) groups[area] = [];
      groups[area].push(lei);
    }
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'));
  }, [listaFiltrada]);

  const loading = loadingAreas || loadingLeis;

  const handleStartSession = () => {
    if (!leiSelecionada || !statusSel) return;
    haptic.selection();
    const p = new URLSearchParams();
    if (leiSelecionada.area) p.set('areas', leiSelecionada.area);
    p.set('temas', leiSelecionada.tema);
    p.set('modo', statusSel);
    p.set('limite', leiSelecionada.total.toString());
    p.set('ordem', ordemSel);
    navigate(`/flashcards/estudar?${p.toString()}`);
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-28 lg:pb-12">
      <PageHeader title="Leis" onBack={() => navigate('/flashcards')} />
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl px-3 sm:px-6 lg:px-8 mt-4">
        
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#36AF85]" />
            Leis e Códigos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesse diretamente todas as legislações mapeadas para os flashcards.
          </p>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome da lei ou matéria..."
            className="pl-10 h-12 rounded-2xl border-border bg-card shadow-sm text-base"
          />
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse border border-border/60 bg-muted/40" />
            ))}
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-7 w-7 text-[#36AF85]" />
            Nenhuma legislação encontrada.
          </div>
        ) : (
          <div className="space-y-8">
            {groupedLeis.map(([areaName, leis]) => (
              <div key={areaName} className="space-y-3">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 ml-1">
                  <BookOpen className="w-4 h-4 text-[#36AF85]/70" />
                  {areaName} ({leis.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {leis.map((lei) => {
                    const progresso = lei.total ? Math.round((lei.compreendidos / lei.total) * 100) : 0;
                    return (
                      <button
                        key={lei.tema}
                        onClick={() => {
                          haptic.selection();
                          setLeiSelecionada(lei);
                          setPasso(1);
                          setStatusSel('');
                        }}
                        className="group flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-card text-left transition-all hover:border-[#36AF85]/50 hover:shadow-md active:scale-[0.99]"
                      >
                        <div className="flex flex-col min-w-0 pr-4">
                          <span className="font-bold text-foreground text-sm sm:text-base leading-tight group-hover:text-[#36AF85] transition-colors line-clamp-2">
                            {lei.tema}
                          </span>
                          <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-muted-foreground">
                            <span>{lei.total} cards</span>
                            {progresso > 0 && (
                              <span className="flex items-center gap-1 text-[#36AF85]">
                                <Sparkles className="w-3 h-3" /> {progresso}% dominado
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sheet to Start Session for specific law */}
      <Sheet open={!!leiSelecionada} onOpenChange={(v) => !v && setLeiSelecionada(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl border-t border-border/50 bg-background/95 p-0 backdrop-blur-xl max-h-[85vh] flex flex-col shadow-2xl">
          <SheetHeader className="px-6 pt-6 pb-2 text-left shrink-0">
            <SheetTitle className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Scale className="w-6 h-6 text-[#36AF85]" />
              Configurar Sessão
            </SheetTitle>
            <p className="text-sm font-medium text-muted-foreground mt-1 line-clamp-1">
              {leiSelecionada?.tema}
            </p>
          </SheetHeader>

          <div className="px-6 pb-8 overflow-y-auto flex-1">
            {passo === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="mb-4 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
                  Selecione os cards que deseja estudar:
                </p>
                <div className="space-y-3">
                  {[
                    { id: 'todos', label: 'Todos os Cards', desc: `Estudar todos os ${leiSelecionada?.total} cards`, icon: Sparkles, color: 'text-blue-500' },
                    { id: 'novos', label: 'Apenas Novos', desc: 'Cards que você ainda não estudou', icon: BookOpen, color: 'text-purple-500' },
                    { id: 'revisar', label: 'A Revisar', desc: `${leiSelecionada?.a_revisar || 0} cards agendados para hoje`, icon: Clock, color: 'text-amber-500' },
                  ].map(st => (
                    <button
                      key={st.id}
                      onClick={() => { haptic.selection(); setStatusSel(st.id); }}
                      className={`w-full flex items-center p-4 rounded-2xl border transition-all ${statusSel === st.id ? 'border-[#36AF85] bg-[#36AF85]/10' : 'border-border/60 bg-card hover:border-[#36AF85]/50'}`}
                    >
                      <div className={`p-2 rounded-xl bg-background border border-border/50 ${statusSel === st.id ? 'text-[#36AF85]' : st.color}`}>
                        <st.icon className="w-5 h-5" />
                      </div>
                      <div className="ml-4 text-left flex-1">
                        <p className={`font-bold text-base ${statusSel === st.id ? 'text-[#36AF85]' : 'text-foreground'}`}>
                          {st.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{st.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${statusSel === st.id ? 'border-[#36AF85]' : 'border-muted-foreground/30'}`}>
                        {statusSel === st.id && <div className="w-2.5 h-2.5 bg-[#36AF85] rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => { haptic.selection(); setPasso(2); }}
                    disabled={!statusSel}
                    className="w-full flex items-center justify-center py-4 rounded-2xl bg-[#36AF85] hover:bg-[#2b8c6a] text-white font-bold text-lg transition-colors shadow-lg shadow-[#36AF85]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar <ChevronRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {passo === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="mb-4 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
                  Como deseja que os cards apareçam?
                </p>
                <div className="space-y-3">
                  {[
                    { id: 'sequencial', label: 'Ordem Sequencial', desc: 'Respeita a ordem dos artigos da lei', icon: FileText },
                    { id: 'embaralhado', label: 'Aleatório (Misturado)', desc: 'Cards fora de ordem para retenção ativa', icon: Sparkles }
                  ].map(ord => (
                    <button
                      key={ord.id}
                      onClick={() => { haptic.selection(); setOrdemSel(ord.id as 'sequencial' | 'embaralhado'); }}
                      className={`w-full flex items-center p-4 rounded-2xl border transition-all ${ordemSel === ord.id ? 'border-[#36AF85] bg-[#36AF85]/10' : 'border-border/60 bg-card hover:border-[#36AF85]/50'}`}
                    >
                      <div className={`p-2 rounded-xl bg-background border border-border/50 ${ordemSel === ord.id ? 'text-[#36AF85]' : 'text-muted-foreground'}`}>
                        <ord.icon className="w-5 h-5" />
                      </div>
                      <div className="ml-4 text-left flex-1">
                        <p className={`font-bold text-base ${ordemSel === ord.id ? 'text-[#36AF85]' : 'text-foreground'}`}>
                          {ord.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{ord.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${ordemSel === ord.id ? 'border-[#36AF85]' : 'border-muted-foreground/30'}`}>
                        {ordemSel === ord.id && <div className="w-2.5 h-2.5 bg-[#36AF85] rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => { haptic.selection(); setPasso(1); }}
                    className="flex items-center justify-center py-4 px-6 rounded-2xl bg-muted text-foreground font-bold hover:bg-muted/80 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleStartSession}
                    className="flex-1 flex items-center justify-center py-4 rounded-2xl bg-[#36AF85] hover:bg-[#2b8c6a] text-white font-bold text-lg transition-colors shadow-lg shadow-[#36AF85]/20"
                  >
                    Iniciar Sessão
                  </button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
