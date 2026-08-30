import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2, Route as RouteIcon, Search, BookOpen, Target } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import PdfScrollReader from '@/components/biblioteca/PdfScrollReader';
import LeitorNativo from '@/components/biblioteca/LeitorNativo';
import { readLeituraProgress } from '@/lib/leituraProgress';
import BibliotecaBottomNav from '@/components/biblioteca/BibliotecaBottomNav';
import { useIsPdfCached } from '@/hooks/useIsPdfCached';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TrilhasStore {
  livrosLidos: string[];
  marcarLido: (id: string) => void;
  desmarcarLido: (id: string) => void;
}

export const useTrilhasStore = create<TrilhasStore>()(
  persist(
    (set) => ({
      livrosLidos: [],
      marcarLido: (id) => set((state) => ({ livrosLidos: Array.from(new Set([...state.livrosLidos, id])) })),
      desmarcarLido: (id) => set((state) => ({ livrosLidos: state.livrosLidos.filter(l => l !== id) })),
    }),
    { name: 'biblioteca-trilhas-lidos' }
  )
);

const TimelineView = ({ 
  titulo, 
  livros, 
  onBack, 
  onOpenReader 
}: { 
  titulo: string;
  livros: LivroNormalizado[];
  onBack: () => void;
  onOpenReader: (livro: LivroNormalizado) => void;
}) => {
  const { livrosLidos, marcarLido, desmarcarLido } = useTrilhasStore();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(i);
  }, []);

  const progressos = useMemo(() => readLeituraProgress(tick), [tick]);

  const isLido = (l: LivroNormalizado) => {
    if (livrosLidos.includes(String(l.id))) return true;
    const p = progressos.find(x => String(x.snap.id) === String(l.id));
    if (p && p.percent >= 90) return true;
    return false;
  };

  const concluidosCount = livros.filter(isLido).length;
  const progressoPct = livros.length > 0 ? Math.round((concluidosCount / livros.length) * 100) : 0;

  return (
    <div className="w-full pb-32">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 max-w-[65%]">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground shrink-0">
             <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex flex-col">
            <p className="text-[10px] uppercase font-black text-primary tracking-widest mb-0.5 truncate">Trilha de Leitura</p>
            <p className="text-sm font-bold text-foreground truncate">{titulo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-primary">{progressoPct}%</span>
            <div className="w-16 h-1.5 bg-secondary/60 rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressoPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-10 relative overflow-hidden">
        {/* Linha vertical central */}
        <div className="absolute left-1/2 top-10 bottom-10 w-1.5 bg-secondary/60 -translate-x-1/2 z-0 rounded-full overflow-hidden">
          <div 
            className="w-full bg-primary/80 transition-all duration-700 ease-in-out" 
            style={{ height: `${progressoPct}%`, boxShadow: '0 0 10px rgba(var(--primary), 0.5)' }} 
          />
        </div>

        <div className="space-y-10">
          {livros.map((livro, i) => {
            const concluido = isLido(livro);
            const isLeft = i % 2 === 0;

            return (
              <motion.div
                key={livro.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ type: 'spring', stiffness: 110, damping: 15, delay: i * 0.05 }}
                className={`relative z-10 flex w-full items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
              >
                {/* Linha conectando o centro ao card */}
                <div className={`absolute top-1/2 w-[calc(50%-2.5rem)] h-[2px] border-b-2 border-dotted -translate-y-1/2 z-0 ${concluido ? 'border-primary/40' : 'border-border'} ${isLeft ? 'left-1/2' : 'right-1/2'}`} />

                {/* Bolinha central (Nó) */}
                <button
                  onClick={() => {
                    haptic.selection();
                    if(concluido) desmarcarLido(String(livro.id));
                    else marcarLido(String(livro.id));
                  }}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-20 flex items-center justify-center transition-all duration-300 ${
                    concluido ? 'bg-primary border-4 border-background shadow-[0_0_15px_rgba(var(--primary),0.6)] scale-110' : 'bg-card border-4 border-background text-muted-foreground'
                  }`}
                >
                  {concluido ? <CheckCircle2 className="w-5 h-5 text-primary-foreground" /> : <span className="text-[11px] font-black">{i + 1}</span>}
                </button>

                {/* Card do Livro */}
                <button 
                  onClick={() => { haptic.selection(); onOpenReader(livro); }}
                  className={`w-[45%] text-left rounded-3xl p-3 relative z-30 transition-all duration-300 backdrop-blur-md border overflow-hidden ${
                    concluido ? 'bg-primary/5 border-primary/20 shadow-sm opacity-90' : 'bg-card/80 border-border/50 shadow-lg hover:border-primary/50 cursor-pointer active:scale-95'
                }`}>
                  <div className="w-full h-24 mb-2 bg-muted rounded-xl overflow-hidden relative">
                    {livro.capa ? (
                      <img src={livro.capa} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-6 h-6 text-muted-foreground/30" /></div>
                    )}
                    {concluido && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="relative z-10 px-1">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${concluido ? 'text-primary/70' : 'text-muted-foreground'}`}>
                      Livro {i + 1}
                    </p>
                    <p className="text-[12px] text-foreground font-semibold line-clamp-2 leading-snug">
                      {livro.titulo}
                    </p>
                  </div>
                </button>
              </motion.div>
            );
          })}
          {livros.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum livro nesta trilha.</p>
          )}
        </div>
      </div>
    </div>
  );
};


export const BibliotecaTrilhas = () => {
  const navigate = useNavigate();
  const [livros, setLivros] = useState<LivroNormalizado[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [colecaoAberta, setColecaoAberta] = useState<string | null>(null);
  const [areaAberta, setAreaAberta] = useState<string | null>(null);
  const [readerOpen, setReaderOpen] = useState<LivroNormalizado | null>(null);

  useEffect(() => {
    let alive = true;
    const fetchLivros = async () => {
      setLoading(true);
      try {
        const { getPersistedColecao } = await import('@/services/offlineDb');
        const promises = COLECOES.filter(c => !c.adminOnly).map(async (colecao) => {
          try {
            const cached = await getPersistedColecao<LivroNormalizado>(colecao.id);
            if (cached && cached.length > 0) return cached;
          } catch {}
          
          let q = supabase.from(colecao.table as any).select(colecao.select).limit(2000);
          if (colecao.orderBy) q = q.order(colecao.orderBy, { ascending: true, nullsFirst: false }) as any;
          
          const { data } = await q;
          return (data || []).map((r: any) => normalizeLivro(r, colecao));
        });
        const results = await Promise.all(promises);
        if (alive) setLivros(results.flat().filter(l => l.titulo));
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetchLivros();
    return () => { alive = false; };
  }, []);

  const { colecoesConfig, livrosPorColecao } = useMemo(() => {
    const config = COLECOES.filter(c => !c.adminOnly);
    const map = new Map<string, LivroNormalizado[]>();
    for (const l of livros) {
      if (!map.has(l.colecaoId)) map.set(l.colecaoId, []);
      map.get(l.colecaoId)!.push(l);
    }
    return { colecoesConfig: config, livrosPorColecao: map };
  }, [livros]);

  const areasDaColecao = useMemo(() => {
    if (!colecaoAberta) return [];
    const lista = livrosPorColecao.get(colecaoAberta) || [];
    const map = new Map<string, number>();
    for (const l of lista) {
      const a = l.area || 'Outros';
      map.set(a, (map.get(a) || 0) + 1);
    }
    return Array.from(map.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [colecaoAberta, livrosPorColecao]);

  const colecaoAtual = colecoesConfig.find(c => c.id === colecaoAberta);

  const handleBack = () => {
    if (areaAberta) {
      setAreaAberta(null);
      return;
    }
    if (colecaoAberta) {
      setColecaoAberta(null);
      return;
    }
    navigate('/biblioteca');
  };

  const handleOpenReader = (livro: LivroNormalizado) => {
    setReaderOpen(livro);
  };

  const isTimelineView = colecaoAberta && (colecaoAtual?.modo === 'livros' || areaAberta);
  const livrosTimeline = isTimelineView ? (
    (livrosPorColecao.get(colecaoAberta) || []).filter(l => !areaAberta || (l.area || 'Outros') === areaAberta)
  ) : [];

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {!isTimelineView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} className="w-full flex flex-col pb-32">
            <PageHeader
              title={colecaoAberta ? colecaoAtual?.label || "Trilhas" : "Trilhas de Leitura"}
              subtitle={colecaoAberta ? "Escolha a matéria" : "Explore os caminhos do conhecimento"}
              onBack={handleBack}
            />
            
            <div className="pt-6 px-4">
              {loading && livros.length === 0 ? (
                <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : !colecaoAberta ? (
                <div className="space-y-3">
                  {colecoesConfig.map(colecao => (
                    <motion.button
                      key={colecao.id}
                      onClick={() => { haptic.selection(); setColecaoAberta(colecao.id); }}
                      className="w-full relative overflow-hidden flex flex-col items-start gap-4 text-left p-4 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md shadow-lg shadow-black/10 active:scale-[0.98] transition-all"
                    >
                      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-[0.03]" style={{ backgroundImage: `url(${colecao.cover})` }} />
                      
                      <div className="relative z-10 flex items-center gap-4 w-full">
                        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                          <RouteIcon className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">
                            {colecao.modo === 'categorias' ? 'Múltiplas Trilhas' : 'Trilha Única'}
                          </p>
                          <p className="text-lg font-bold text-foreground truncate">{colecao.label}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{colecao.subtitle}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {areasDaColecao.map(([nome, count]) => (
                    <motion.button
                      key={nome}
                      onClick={() => { haptic.selection(); setAreaAberta(nome); }}
                      className="w-full flex items-center justify-between p-4 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:border-primary/50 transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center shrink-0">
                          <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground">{nome}</p>
                          <p className="text-xs text-muted-foreground">{count} {count === 1 ? 'livro' : 'livros'} na trilha</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {isTimelineView && (
          <motion.div key="timeline" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <TimelineView 
              titulo={areaAberta ? areaAberta : (colecaoAtual?.label || '')}
              livros={livrosTimeline}
              onBack={handleBack}
              onOpenReader={handleOpenReader}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ao invés de forçar nativo/pdf, podemos usar o LeitorNativo por padrão que já tem o fallback para PDF dentro dele se configurado,
          ou abrir o detalhe do livro. O componente LeitorNativo ou PdfScrollReader podem ser usados.
          Se a tabela for conhecida, o LeitorNativo é a melhor opção. 
      */}
      {readerOpen && (
        <LeitorNativo
          livroId={String(readerOpen.id)}
          livroTabela={readerOpen.colecaoId ? COLECOES.find(c => c.id === readerOpen.colecaoId)?.table || '' : ''}
          pdfUrl={readerOpen.download || ''}
          titulo={readerOpen.titulo}
          capa={readerOpen.capa || undefined}
          onClose={() => setReaderOpen(null)}
        />
      )}
      
      {!isTimelineView && <BibliotecaBottomNav />}
    </div>
  );
};

export default BibliotecaTrilhas;
