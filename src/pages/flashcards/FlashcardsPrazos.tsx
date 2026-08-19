import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';
import { ChevronRight, Search, Sparkles, Scale, BookOpen, Clock, FileText, Quote, Library, GraduationCap, Flame } from 'lucide-react';
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

const PRAZOS_TIPOS = [
  { id: 'prazos_processuais', label: 'Prazos Processuais', desc: 'Penal e Civil', icon: Clock, color: 'text-amber-500', keywords: ['prazo', 'dias', 'horas', 'meses', 'anos', 'processual'] },
  { id: 'prescricao', label: 'Prescrição', desc: 'Prazos prescricionais', icon: Clock, color: 'text-blue-500', keywords: ['prescrição', 'prescricional'] },
  { id: 'decadencia', label: 'Decadência', desc: 'Perda do direito', icon: Flame, color: 'text-rose-500', keywords: ['decadência', 'decadencial'] }
];

export default function FlashcardsPrazos() {
  const navigate = useNavigate();
  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();
  const areas = areasRaw || [];

  const [todosTemas, setTodosTemas] = useState<TemaRow[]>([]);
  const [loadingTemas, setLoadingTemas] = useState(false);
  
  // States
  const [tipoSelecionado, setTipoSelecionado] = useState<typeof PRAZOS_TIPOS[0] | null>(null);
  const [busca, setBusca] = useState('');

  // Selected state for the bottom sheet
  const [temaSelecionado, setTemaSelecionado] = useState<TemaRow | null>(null);
  const [passo, setPasso] = useState<1 | 2>(1);
  const [statusSel, setStatusSel] = useState<string>('');
  const [ordemSel, setOrdemSel] = useState<'sequencial' | 'embaralhado'>('sequencial');

  useEffect(() => {
    document.title = 'Flashcards Prazos | Vade Mecum PRIME';
  }, []);

  useEffect(() => {
    if (!areasRaw || areasRaw.length === 0 || !tipoSelecionado) return;
    
    let isMounted = true;
    const fetchAllTermos = async () => {
      setLoadingTemas(true);
      try {
        const promises = areasRaw.map(a => 
          supabase.rpc('flashcards_temas', { _area: a.area })
            .then(res => {
              if (res.error) return [];
              return (res.data || []).filter(t => {
                const temaLower = t.tema.toLowerCase();
                return tipoSelecionado.keywords.some(k => temaLower.includes(k));
              }).map(t => ({ ...t, area: a.area }));
            })
        );
        const results = await Promise.all(promises);
        const flattened = results.flat() as TemaRow[];
        
        flattened.sort((a, b) => a.tema.localeCompare(b.tema, 'pt-BR'));
        
        if (isMounted) {
          setTodosTemas(flattened);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingTemas(false);
      }
    };

    fetchAllTermos();
    return () => { isMounted = false; };
  }, [areasRaw, tipoSelecionado]);

  const listaFiltrada = useMemo(() => {
    if (!busca.trim()) return todosTemas;
    const q = busca.toLowerCase();
    return todosTemas.filter(t => t.tema.toLowerCase().includes(q) || (t.area && t.area.toLowerCase().includes(q)));
  }, [todosTemas, busca]);

  const loading = loadingAreas || loadingTemas;

  const handleStartSession = () => {
    if (!temaSelecionado || !statusSel) return;
    haptic.selection();
    const p = new URLSearchParams();
    if (temaSelecionado.area) p.set('areas', temaSelecionado.area);
    p.set('temas', temaSelecionado.tema);
    p.set('modo', statusSel);
    p.set('limite', temaSelecionado.total.toString());
    p.set('ordem', ordemSel);
    navigate(`/flashcards/estudar?${p.toString()}`);
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-28 lg:pb-12">
      <PageHeader 
        title="Prazos"
        subtitle="Explore prazos processuais e prescricionais"
        onBack={() => {
          if (tipoSelecionado) setTipoSelecionado(null);
          else navigate('/flashcards');
        }} 
      />
      
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl px-3 sm:px-6 lg:px-8 mt-4">
        
        {!tipoSelecionado ? (
          <>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Quote className="w-6 h-6 text-[#36AF85]" />
                Termos e Teorias
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione qual formato de teoria ou conceito você deseja estudar agora.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PRAZOS_TIPOS.map((tipo) => (
                <button
                  key={tipo.id}
                  onClick={() => {
                    haptic.selection();
                    setTipoSelecionado(tipo);
                  }}
                  className="group flex flex-col items-center justify-center p-6 rounded-3xl border border-border/80 bg-card text-center transition-all hover:border-[#36AF85]/50 hover:shadow-lg hover:shadow-[#36AF85]/10 active:scale-[0.98] gap-4"
                >
                  <div className={`p-4 rounded-2xl bg-background border border-border/50 group-hover:scale-110 transition-transform ${tipo.color}`}>
                    <tipo.icon className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-[#36AF85] transition-colors">{tipo.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{tipo.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <tipoSelecionado.icon className={`w-6 h-6 ${tipoSelecionado.color}`} />
                {tipoSelecionado.label}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha o tema para gerar os flashcards de conceitos.
              </p>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={`Buscar em ${tipoSelecionado.label.toLowerCase()}...`}
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
                Nenhum tema encontrado para esta categoria.
              </div>
            ) : (
              <div className="space-y-3">
                {listaFiltrada.map((tema) => {
                  const progresso = tema.total ? Math.round((tema.compreendidos / tema.total) * 100) : 0;
                  return (
                    <button
                      key={tema.tema}
                      onClick={() => {
                        haptic.selection();
                        setTemaSelecionado(tema);
                        setPasso(1);
                        setStatusSel('');
                      }}
                      className="group flex items-center justify-between p-4 rounded-2xl border border-border/80 bg-card text-left transition-all hover:border-[#36AF85]/50 hover:shadow-md active:scale-[0.99]"
                    >
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                          {tema.area}
                        </span>
                        <span className="font-bold text-foreground text-sm sm:text-base leading-tight group-hover:text-[#36AF85] transition-colors line-clamp-2">
                          {tema.tema}
                        </span>
                        <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-muted-foreground">
                          <span>{tema.total} cards</span>
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
            )}
          </>
        )}
      </div>

      {/* Sheet to Start Session for specific law */}
      <Sheet open={!!temaSelecionado} onOpenChange={(v) => !v && setTemaSelecionado(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl border-t border-border/50 bg-background/95 p-0 backdrop-blur-xl max-h-[85vh] flex flex-col shadow-2xl">
          <SheetHeader className="px-6 pt-6 pb-2 text-left shrink-0">
            <SheetTitle className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Quote className="w-6 h-6 text-[#36AF85]" />
              Configurar Sessão
            </SheetTitle>
            <p className="text-sm font-medium text-muted-foreground mt-1 line-clamp-1">
              {temaSelecionado?.tema}
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
                    { id: 'todos', label: 'Todos os Cards', desc: `Estudar todos os ${temaSelecionado?.total} cards`, icon: Sparkles, color: 'text-blue-500' },
                    { id: 'novos', label: 'Apenas Novos', desc: 'Cards que você ainda não estudou', icon: BookOpen, color: 'text-purple-500' },
                    { id: 'revisar', label: 'A Revisar', desc: `${temaSelecionado?.a_revisar || 0} cards agendados para hoje`, icon: Clock, color: 'text-amber-500' },
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
                    { id: 'sequencial', label: 'Ordem Sequencial', desc: 'Respeita a ordem dos conceitos', icon: FileText },
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
