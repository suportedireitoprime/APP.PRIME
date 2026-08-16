import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { Calendar, ChevronRight, Flame, Search, Sparkles, Users, X, Layers, Target, BarChart3, FolderPlus, RotateCcw, Filter, BookOpen, Scale, Gavel, Quote, Lightbulb, Clock } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import FlashcardsCargoHero from '@/components/flashcards/FlashcardsCargoHero';
import { useFlashcardsDashboard, useFlashcardsResumoAreas, FlashcardsAreaRow, FlashcardsDash } from '@/lib/flashcardsQueries';
import FlashcardsFiltroSheet, { FlashcardsFiltro } from '@/components/flashcards/FlashcardsFiltroSheet';


const Flashcards = () => {
  const navigate = useNavigate();
  const { data: dash, isLoading: loadingDash } = useFlashcardsDashboard();
  const { data: areasRaw } = useFlashcardsResumoAreas();
  const [loadingMix, setLoadingMix] = useState(false);
  
  const [filtroAberto, setFiltroAberto] = useState(false);

  const loading = loadingDash;

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Flashcards | Vade Mecum PRIME';
  }, []);

  const pct = dash && dash.total_cards ? Math.round((dash.compreendidos / dash.total_cards) * 100) : 0;
  const paraHoje = Number(dash?.a_revisar ?? 0) || Number(dash?.hoje ?? 0);
  const criticos = (dash?.temas_criticos ?? []).slice(0, 4);

  const handleMixRapido = async () => {
    if (!areasRaw || areasRaw.length === 0) return;
    haptic.selection();
    setLoadingMix(true);
    try {
      const promises = areasRaw.map(a => 
        supabase.rpc('flashcards_temas', { _area: a.area })
          .then(res => {
            if (res.error) return [];
            return (res.data || []);
          })
      );
      
      const results = await Promise.all(promises);
      const allTemas = results.flat();
      const MIX_KEYWORDS = [
        'filosofia', 'filósofo', 'platão', 'aristóteles', 'sócrates', 'kant', 'hegel', 'habermas', 'rawls', 'dworkin', 'alexy',
        'sociologia', 'sociólogo', 'foucault', 'weber', 'marx', 'durkheim',
        'teoria geral', 'tgd', 'kelsen', 'radbruch', 'reale', 'bobbio',
        'doutrina penal', 'penalista', 'nucci', 'capez', 'bitencourt', 'sanches', 'mirabete', 'zaffaroni', 'lopes jr', 'pacelli', 'távora',
        'doutrina civil', 'civilista', 'tartuce', 'rosenvald', 'farias', 'gagliano', 'gonçalves', 'venosa', 'diniz', 'tepedino', 'marinoni', 'didier', 'neves', 'theodoro',
        'doutrina constitucional', 'administrativista', 'barroso', 'mendes', 'canotilho', 'carvalho', 'meirelles', 'di pietro', 'carvalho filho', 'alexandrino', 'moraes', 'novelino',
        'doutrina', 'autor', 'jurista', 'entendimento doutrinário', 'segundo a doutrina', 'posição majoritária',
        'prazo', 'dias', 'horas', 'meses', 'anos', 'prescrição', 'decadência',
        'exceção', 'salvo', 'exceto', 'regra geral', 'ressalva',
        'classificação', 'espécies', 'tipos de', 'modalidades', 'requisitos', 'elementos'
      ];

      const temasValidos = allTemas
        .filter(t => MIX_KEYWORDS.some(k => t.tema.toLowerCase().includes(k)))
        .map(t => t.tema);

      if (temasValidos.length === 0) {
        toast.error('Nenhum card especial encontrado.');
        return;
      }

      // Randomize and take up to 20 themes to keep the URL concise
      const shuffled = temasValidos.sort(() => 0.5 - Math.random()).slice(0, 20);
      const temasParam = encodeURIComponent(shuffled.join('|'));
      
      navigate(`/flashcards/estudar?temas=${temasParam}&modo=revisar&limite=50&ordem=embaralhado`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar mix.');
    } finally {
      setLoadingMix(false);
    }
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background pb-28 lg:pb-12">
      <PageHeader title="Flashcards" onBack={() => navigate('/')} />
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">


        <div className="-mx-3 sm:-mx-6 lg:-mx-8 mb-6 mt-1">
          <FlashcardsCargoHero 
            pct={pct} 
            total={dash?.estudados || 0} 
            hoje={dash?.hoje || 0} 
            meta={100} 
            disponiveis={dash?.total_cards || 0} 
          />
        </div>
        
        <div className="pt-1 space-y-6">
          {/* ── Card Principal com Botão "Filtro Rápido" ───────────────── */}
          <div className="bg-card/60 border border-border/80 p-5 rounded-3xl backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#36AF85]" />
              <h2 className="text-lg font-extrabold leading-tight text-foreground sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] uppercase">Praticar Flashcards</h2>
            </div>
            <p className="ml-3 mt-1 text-xs text-muted-foreground">
              Escolha filtros personalizados e comece sua rotina de revisão.
            </p>

            <button
              onClick={() => { haptic.selection(); setFiltroAberto(true); }}
              className="btn-attention-shine group mt-4 flex h-14 sm:h-16 min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl bg-[#2C9570] hover:bg-[#237A5C] text-white text-base sm:text-lg font-black shadow-xl shadow-[#2C9570]/35 transition-all active:scale-[0.99] border border-[#2C9570]/30"
            >
              <Filter className="h-6 w-6 text-white" strokeWidth={2} />
              <span className="tracking-wide text-white">Filtro Rápido</span>
              <ChevronRight className="h-6 w-6 text-white transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
            </button>
          </div>

          {/* ── Ações Rápidas (4 botões) ───────────────── */}
          <section className="grid grid-cols-4 gap-2">
            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/decks'); }}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95 gap-2 sm:gap-3"
            >
              <FolderPlus className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              <p className="text-[10px] sm:text-xs font-bold text-foreground text-center leading-tight">Meus Decks</p>
            </button>

            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/revisar'); }}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95 gap-2 sm:gap-3"
            >
              <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              <p className="text-[10px] sm:text-xs font-bold text-foreground text-center leading-tight">Minha Revisão</p>
            </button>

            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/desafios'); }}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95 gap-2 sm:gap-3"
            >
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              <p className="text-[10px] sm:text-xs font-bold text-foreground text-center leading-tight">Meus Desafios</p>
            </button>

            <button
              onClick={() => { haptic.selection(); navigate('/flashcards/progresso'); }}
              className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95 gap-2 sm:gap-3"
            >
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
              <p className="text-[10px] sm:text-xs font-bold text-foreground text-center leading-tight">Progresso</p>
            </button>
          </section>

          {/* ── Categorias ───────────────────── */}
          <section className="space-y-3 pt-2">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              Categorias
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => { haptic.selection(); navigate('/flashcards/materias'); }}
                className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#36AF85]/50 transition-colors active:scale-95"
              >
                <div className="flex items-center justify-center text-[#36AF85] group-hover:scale-110 transition-transform">
                  <BookOpen className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-foreground">Matérias</span>
                </div>
              </button>

              <button
                onClick={() => { haptic.selection(); navigate('/flashcards/leis'); }}
                className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#36AF85]/50 transition-colors active:scale-95"
              >
                <div className="flex items-center justify-center text-[#36AF85] group-hover:scale-110 transition-transform">
                  <Scale className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-foreground">Leis</span>
                </div>
              </button>

              <button
                onClick={() => { haptic.selection(); navigate('/flashcards/jurisprudencia'); }}
                className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#36AF85]/50 transition-colors active:scale-95"
              >
                <div className="flex items-center justify-center text-[#36AF85] group-hover:scale-110 transition-transform">
                  <Gavel className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-foreground">Jurisprudência</span>
                </div>
              </button>

              <button
                onClick={() => { haptic.selection(); navigate('/flashcards/termos'); }}
                className="group flex flex-col items-center justify-center gap-3 p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-[#36AF85]/50 transition-colors active:scale-95"
              >
                <div className="flex items-center justify-center text-[#36AF85] group-hover:scale-110 transition-transform">
                  <Quote className="h-8 w-8" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-bold text-foreground">Termos</span>
                </div>
              </button>
            </div>
          </section>

          {/* ── Subcategorias ───────────────────── */}
          <section className="space-y-3 pt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] flex items-center justify-between">
              Subcategorias Especiais
              <button 
                onClick={handleMixRapido}
                disabled={loadingMix}
                className="text-[#36AF85] hover:text-[#36AF85]/80 active:scale-95 transition-all text-xs font-black flex items-center gap-1.5"
              >
                {loadingMix ? 'GERANDO...' : '🎲 MIX RÁPIDO'}
              </button>
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { haptic.selection(); navigate('/flashcards/filosofos'); }}
                className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                    <Lightbulb className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-bold text-foreground">Filósofos</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => { haptic.selection(); navigate('/flashcards/juristas'); }}
                className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                    <Users className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-bold text-foreground">Juristas</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => { haptic.selection(); navigate('/flashcards/prazos'); }}
                className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                    <Clock className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-bold text-foreground">Prazos</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => { haptic.selection(); navigate('/flashcards/excecoes'); }}
                className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                    <Flame className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-bold text-foreground">Exceções & Regras</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => { haptic.selection(); navigate('/flashcards/classificacoes'); }}
                className="group flex items-center justify-between p-4 rounded-2xl bg-card border border-border/80 shadow-sm hover:border-success/50 transition-colors active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                    <Layers className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <span className="text-sm font-bold text-foreground">Classificações</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </section>
        </div>
      </div>

      <FlashcardsFiltroSheet
        aberto={filtroAberto}
        onFechar={() => setFiltroAberto(false)}
        onAplicar={(f) => {
          setFiltroAberto(false);
          const p = new URLSearchParams();
          if (f.disciplinas.length) p.set('areas', f.disciplinas.join('|'));
          if (f.assuntos.length) p.set('temas', f.assuntos.join('|'));
          if (f.status.length) p.set('modo', f.status[0]);
          if (f.quantidade) p.set('limite', String(f.quantidade));
          
          navigate(`/flashcards/estudar?${p.toString()}`);
        }}
      />

      <FlashcardsBottomNav />
    </div>
  );
};

export default Flashcards;
