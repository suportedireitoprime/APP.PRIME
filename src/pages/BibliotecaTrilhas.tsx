import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Target, Calendar, CheckCircle2, Route as RouteIcon, FileText, Smartphone, Search, BookOpen, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { haptic } from '@/lib/nativeHaptics';
import { useBibliotecaTrilhasStore, type TrilhaLeituraAtiva } from '@/lib/bibliotecaTrilhasStore';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, type LivroNormalizado, normalizeLivro } from '@/lib/bibliotecaColecoes';
import PdfScrollReader from '@/components/biblioteca/PdfScrollReader';
import LeitorNativo from '@/components/biblioteca/LeitorNativo';
import { readLeituraProgress } from '@/lib/leituraProgress';
import BibliotecaBottomNav from '@/components/biblioteca/BibliotecaBottomNav';
import { useLivroPageCount } from '@/hooks/useLivroPageCount';

// --- SETUP 1: ESCOLHER LIVRO ---
const SetupLivro = ({ onSelect, onCancel }: { onSelect: (livro: LivroNormalizado) => void, onCancel: () => void }) => {
  const [busca, setBusca] = useState('');
  const [livros, setLivros] = useState<LivroNormalizado[]>([]);
  const [loading, setLoading] = useState(false);
  const [colecaoAberta, setColecaoAberta] = useState<string | null>(null);
  const [areaAberta, setAreaAberta] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const fetchLivros = async () => {
      setLoading(true);
      try {
        const promises = COLECOES.filter(c => !c.adminOnly).map(async (colecao) => {
          const { data } = await supabase.from(colecao.table as any).select(colecao.select).limit(2000);
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

  const filtradosBusca = useMemo(() => {
    if (!busca) return [];
    const q = busca.toLowerCase();
    return livros.filter(l => l.titulo?.toLowerCase().includes(q) || l.autor?.toLowerCase().includes(q)).slice(0, 50);
  }, [busca, livros]);

  const handleBack = () => {
    if (busca) {
      setBusca('');
      return;
    }
    if (areaAberta) {
      setAreaAberta(null);
      return;
    }
    if (colecaoAberta) {
      setColecaoAberta(null);
      return;
    }
    onCancel();
  };

  const currentTitle = areaAberta ? areaAberta : (colecaoAberta ? colecoesConfig.find(c => c.id === colecaoAberta)?.label : "Qual livro ler?");
  const currentSubtitle = areaAberta ? "Escolha a obra" : (colecaoAberta ? "Escolha a categoria" : "Selecione o acervo");

  return (
    <motion.div initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="w-full flex flex-col pb-32">
      <PageHeader
        title={currentTitle || "Qual livro ler?"}
        subtitle={currentSubtitle}
        onBack={handleBack}
      />
      
      <div className="pt-4 px-4">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Buscar título ou autor..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-card border border-border/50 rounded-full py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : busca ? (
          <div className="space-y-3">
            {filtradosBusca.map(livro => (
              <motion.button
                key={livro.id}
                onClick={() => { haptic.selection(); onSelect(livro); }}
                className="w-full flex items-center gap-4 text-left p-4 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:border-primary/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-16 bg-muted rounded overflow-hidden shrink-0">
                  {livro.capa ? <img src={livro.capa} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 opacity-30" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight mb-1 truncate text-foreground">{livro.titulo}</p>
                  <p className="text-xs text-muted-foreground truncate">{livro.autor || 'Autor Desconhecido'}</p>
                </div>
              </motion.button>
            ))}
            {filtradosBusca.length === 0 && (
               <p className="text-center text-muted-foreground py-8">Nenhum livro encontrado.</p>
            )}
          </div>
        ) : !colecaoAberta ? (
          <div className="space-y-3">
            {colecoesConfig.map(colecao => (
              <motion.button
                key={colecao.id}
                onClick={() => { haptic.selection(); setColecaoAberta(colecao.id); }}
                className="w-full flex items-center justify-between p-4 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:border-primary/50 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{colecao.label}</p>
                    <p className="text-xs text-muted-foreground">{livrosPorColecao.get(colecao.id)?.length || 0} livros</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (!areaAberta && colecoesConfig.find(c => c.id === colecaoAberta)?.modo === 'categorias') ? (
          <div className="space-y-3">
            {areasDaColecao.map(([nome, count]) => (
              <motion.button
                key={nome}
                onClick={() => { haptic.selection(); setAreaAberta(nome); }}
                className="w-full flex items-center justify-between p-4 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:border-primary/50 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">{nome}</p>
                    <p className="text-xs text-muted-foreground">{count} livros</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {(livrosPorColecao.get(colecaoAberta) || [])
               .filter(l => !areaAberta || (l.area || 'Outros') === areaAberta)
               .map(livro => (
              <motion.button
                key={livro.id}
                onClick={() => { haptic.selection(); onSelect(livro); }}
                className="w-full flex items-center gap-4 text-left p-4 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm hover:border-primary/50 transition-all active:scale-[0.98]"
              >
                <div className="w-12 h-16 bg-muted rounded overflow-hidden shrink-0">
                  {livro.capa ? <img src={livro.capa} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 opacity-30" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight mb-1 truncate text-foreground">{livro.titulo}</p>
                  <p className="text-xs text-muted-foreground truncate">{livro.autor || 'Autor Desconhecido'}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- SETUP 2: RITMO/PRAZO E FORMATO ---
const SetupDetalhes = ({ livro, onBack, onFinish }: { livro: LivroNormalizado, onBack: () => void, onFinish: (dias: number, formato: 'pdf'|'nativo', paginas: number) => void }) => {
  const [dias, setDias] = useState(7);
  const [formato, setFormato] = useState<'pdf'|'nativo'>('pdf');
  const [paginas, setPaginas] = useState<number>(0);
  const opcoesDias = [3, 7, 15, 30];
  const pdfPages = useLivroPageCount(livro.download);

  useEffect(() => {
    if (pdfPages && paginas === 0) setPaginas(pdfPages);
  }, [pdfPages]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full flex flex-col pt-4 px-4 pb-32">
      <button onClick={onBack} className="self-start p-2 mb-4 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-2">Meta de Leitura</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Defina como deseja devorar <strong className="text-foreground">{livro.titulo}</strong>
        </p>

        <p className="text-left text-sm font-bold text-foreground mt-8 mb-3">1. Prazo em dias</p>
        <div className="grid grid-cols-4 gap-2 mb-8">
          {opcoesDias.map(num => (
            <button
              key={num}
              onClick={() => { haptic.selection(); setDias(num); }}
              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                dias === num ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/50 bg-card/60 hover:border-primary/50'
              }`}
            >
              <span className={`text-xl font-black ${dias === num ? 'text-primary' : 'text-foreground'}`}>{num}</span>
            </button>
          ))}
        </div>

        <p className="text-left text-sm font-bold text-foreground mb-3">2. Formato preferido</p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => { haptic.selection(); setFormato('pdf'); }}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
              formato === 'pdf' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/50 bg-card/60 hover:border-primary/50'
            }`}
          >
            <FileText className={`w-6 h-6 ${formato === 'pdf' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-bold ${formato === 'pdf' ? 'text-primary' : 'text-foreground'}`}>Ler em PDF</span>
          </button>
          <button
            onClick={() => { haptic.selection(); setFormato('nativo'); }}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
              formato === 'nativo' ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/50 bg-card/60 hover:border-primary/50'
            }`}
          >
            <Smartphone className={`w-6 h-6 ${formato === 'nativo' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-bold ${formato === 'nativo' ? 'text-primary' : 'text-foreground'}`}>Texto Nativo</span>
          </button>
        </div>

        <p className="text-left text-sm font-bold text-foreground mb-3">3. Total de Páginas</p>
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-3 bg-card/60 p-2 rounded-2xl border-2 border-border/50 focus-within:border-primary/50 transition-colors">
            <input 
              type="number" 
              value={paginas || ''} 
              onChange={e => setPaginas(parseInt(e.target.value) || 0)} 
              className="w-full bg-transparent p-2 outline-none font-bold text-lg text-center" 
              placeholder="Ex: 250" 
            />
          </div>
          <div className="flex justify-between px-2">
            <span className="text-xs text-muted-foreground">Necessário para dividir a leitura</span>
            {pdfPages ? <span className="text-xs text-primary font-bold">Auto-detectado ✓</span> : <span className="text-xs text-muted-foreground">Calculando...</span>}
          </div>
        </div>

        <button
          onClick={() => { 
            if (paginas <= 0) { 
              haptic.selection(); 
              if (!confirm('Páginas não informadas. Prosseguir com leitura livre?')) return; 
            } else {
              haptic.selection();
            }
            onFinish(dias, formato, paginas); 
          }}
          className="w-full mt-2 bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all active:scale-95"
        >
          Iniciar Missão
        </button>
      </div>
    </motion.div>
  );
};

// --- MAPA DA TRILHA DE LEITURA ---
const TrilhaMapaLeitura = ({ trilha, onBack, onOpenReader }: { trilha: TrilhaLeituraAtiva, onBack: () => void, onOpenReader: (trilha: TrilhaLeituraAtiva, startPage: number) => void }) => {
  const { marcarDiaConcluido, desmarcarDiaConcluido, limparTrilha, atualizarTrilha } = useBibliotecaTrilhasStore();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 2500);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (!trilha.paginasTotais) return;
    const progressos = readLeituraProgress(tick);
    if (trilha.formato === 'nativo' && trilha.tabela) {
      const p = progressos.find(x => String(x.snap.id) === String(trilha.livroId));
      if (p) {
        const paginasPorDia = Math.ceil(trilha.paginasTotais / trilha.diasMeta);
        const indexAtual = p.index;
        const paginaAtual = indexAtual + 1;
        const diasQueDevemEstarConcluidos = Math.floor(paginaAtual / paginasPorDia);
        for (let d = 1; d <= diasQueDevemEstarConcluidos; d++) {
          if (!trilha.diasConcluidos.includes(d) && d <= trilha.diasMeta) {
            marcarDiaConcluido(trilha.id, d);
          }
        }
      }
    }
    if (trilha.formato === 'pdf' && trilha.downloadUrl) {
      const pdfPageKey = `pdf-reader:page:${trilha.downloadUrl}`;
      const savedPageStr = localStorage.getItem(pdfPageKey);
      if (savedPageStr) {
        const p = Number(savedPageStr);
        const paginasPorDia = Math.ceil(trilha.paginasTotais / trilha.diasMeta);
        const diasQueDevemEstarConcluidos = Math.floor(p / paginasPorDia);
        for (let d = 1; d <= diasQueDevemEstarConcluidos; d++) {
          if (!trilha.diasConcluidos.includes(d) && d <= trilha.diasMeta) {
            marcarDiaConcluido(trilha.id, d);
          }
        }
      }
    }
  }, [tick, trilha]);
  
  const nodos = Array.from({ length: trilha.diasMeta }).map((_, i) => ({ dia: i + 1 }));
  const totalConcluido = trilha.diasConcluidos.length;
  const progressoPct = Math.round((totalConcluido / trilha.diasMeta) * 100);

  return (
    <div className="w-full pb-32">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 max-w-[65%]">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full bg-white/5 text-muted-foreground hover:text-foreground shrink-0">
             <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex flex-col">
            <p className="text-[10px] uppercase font-black text-primary tracking-widest mb-0.5 truncate">Lendo em {trilha.diasMeta} dias</p>
            <p className="text-sm font-bold text-foreground truncate">{trilha.livroTitulo}</p>
            {!trilha.paginasTotais && (
              <button 
                onClick={() => {
                  haptic.selection();
                  const val = prompt('Quantas páginas tem o livro?');
                  if (val && !isNaN(Number(val)) && Number(val) > 0) {
                    atualizarTrilha(trilha.id, { paginasTotais: Number(val) });
                  }
                }}
                className="text-[10px] font-bold text-yellow-500 hover:text-yellow-400 mt-0.5 text-left flex items-center gap-1 active:scale-95 transition-all"
              >
                ⚠️ Definir total de páginas
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold text-primary">{progressoPct}%</span>
            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
              <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressoPct}%` }} />
            </div>
          </div>
          <button onClick={() => { if(confirm('Abortar missão?')) { limparTrilha(trilha.id); onBack(); } }} className="p-2 rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-10 relative overflow-hidden">
        <div className="absolute left-1/2 top-10 bottom-10 w-1.5 bg-white/5 -translate-x-1/2 z-0 rounded-full overflow-hidden">
          <div className="w-full bg-primary/80 transition-all duration-700 ease-in-out" style={{ height: `${(totalConcluido / trilha.diasMeta) * 100}%`, boxShadow: '0 0 10px rgba(var(--primary), 0.5)' }} />
        </div>

        <div className="space-y-10">
          {nodos.map((nodo, i) => {
            const concluido = trilha.diasConcluidos.includes(nodo.dia);
            const isLeft = i % 2 === 0;

            const paginasPorDia = trilha.paginasTotais ? Math.ceil(trilha.paginasTotais / trilha.diasMeta) : 0;
            const startPage = paginasPorDia ? Math.max(1, (nodo.dia - 1) * paginasPorDia + 1) : 1;
            const endPage = paginasPorDia ? Math.min(trilha.paginasTotais!, nodo.dia * paginasPorDia) : 0;

            return (
              <motion.div
                key={nodo.dia}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ type: 'spring', stiffness: 110, damping: 15, delay: i * 0.05 }}
                className={`relative z-10 flex w-full items-center ${isLeft ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`absolute top-1/2 w-[calc(50%-2.5rem)] h-[2px] border-b-2 border-dotted -translate-y-1/2 z-0 ${concluido ? 'border-primary/40' : 'border-white/10'} ${isLeft ? 'left-1/2' : 'right-1/2'}`} />

                <button
                  onClick={() => {
                    haptic.selection();
                    if(concluido) desmarcarDiaConcluido(trilha.id, nodo.dia);
                    else marcarDiaConcluido(trilha.id, nodo.dia);
                  }}
                  className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-20 flex items-center justify-center transition-all duration-300 ${
                    concluido ? 'bg-primary border-4 border-background shadow-[0_0_15px_rgba(var(--primary),0.6)] scale-110' : 'bg-[#1A1A1A] border-4 border-background text-muted-foreground'
                  }`}
                >
                  {concluido ? <CheckCircle2 className="w-5 h-5 text-primary-foreground" /> : <span className="text-[11px] font-black">{nodo.dia}</span>}
                </button>

                <button 
                  onClick={() => { haptic.selection(); onOpenReader(trilha, startPage); }}
                  className={`w-[45%] text-left rounded-3xl p-4 relative z-30 transition-all duration-300 backdrop-blur-md border overflow-hidden ${
                    concluido ? 'bg-primary/5 border-primary/20 shadow-sm opacity-80' : 'bg-card/40 border-white/10 shadow-lg hover:border-primary/50 cursor-pointer active:scale-95'
                }`}>
                  {trilha.livroCapa && (
                    <>
                      <div className="absolute inset-0 z-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${trilha.livroCapa})` }} />
                      <div className="absolute inset-0 z-0 bg-gradient-to-br from-background/40 via-background/80 to-background" />
                    </>
                  )}
                  <div className="relative z-10">
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${concluido ? 'text-primary/70' : 'text-muted-foreground'}`}>
                      Dia {nodo.dia}
                    </p>
                    <p className="text-[11px] text-foreground font-semibold line-clamp-2">
                      {paginasPorDia ? `Páginas ${startPage} a ${endPage}` : `Leitura livre`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 text-primary">Abrir {trilha.formato.toUpperCase()}</p>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD PRINCIPAL ---
export const BibliotecaTrilhas = () => {
  const { trilhasAtivas, setTrilhaAtiva } = useBibliotecaTrilhasStore();
  const trilhasArr = Object.values(trilhasAtivas);
  const navigate = useNavigate();
  const [view, setView] = useState<'dashboard'|'setup_livro'|'setup_detalhes'|'mapa'>(trilhasArr.length > 0 ? 'dashboard' : 'setup_livro');
  const [selectedLivro, setSelectedLivro] = useState<LivroNormalizado | null>(null);
  const [trilhaVisualizada, setTrilhaVisualizada] = useState<TrilhaLeituraAtiva | null>(null);
  const [readerOpen, setReaderOpen] = useState<TrilhaLeituraAtiva | null>(null);

  const handleCreateTrilha = async (dias: number, formato: 'pdf'|'nativo', paginas: number) => {
    if (!selectedLivro) return;
    
    const nova: TrilhaLeituraAtiva = {
      id: `${selectedLivro.id}-${Date.now()}`,
      livroId: String(selectedLivro.id),
      livroTitulo: selectedLivro.titulo,
      livroCapa: selectedLivro.capa,
      formato,
      diasMeta: dias,
      diasConcluidos: [],
      dataInicio: new Date().toISOString(),
      paginasTotais: paginas > 0 ? paginas : null,
      tabela: selectedLivro.colecaoId,
      downloadUrl: selectedLivro.download || undefined
    };
    setTrilhaAtiva(nova);
    setTrilhaVisualizada(nova);
    setView('mapa');
  };

  const handleOpenReader = (trilha: TrilhaLeituraAtiva, startPage: number) => {
    if (trilha.formato === 'nativo' && trilha.tabela) {
      const key = `leitura-nativa:${trilha.tabela.replace(/^biblioteca_/, '')}:${trilha.livroId}`;
      const fallbackKey = `leitura-nativa:${trilha.tabela}:${trilha.livroId}`;
      const payload = JSON.stringify({ index: Math.max(0, startPage - 1), updatedAt: Date.now() });
      localStorage.setItem(key, payload);
      localStorage.setItem(fallbackKey, payload);
    } else if (trilha.formato === 'pdf' && trilha.downloadUrl) {
      const pdfPageKey = `pdf-reader:bookmark:${trilha.downloadUrl}`;
      localStorage.setItem(pdfPageKey, String(startPage));
      localStorage.setItem(`pdf-reader:page:${trilha.downloadUrl}`, String(startPage));
    }
    setReaderOpen(trilha);
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {view === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full pt-6 px-4 pb-32">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-foreground">Missões de Leitura</h2>
                <p className="text-sm text-muted-foreground">Continue seus livros</p>
              </div>
              <button onClick={() => { haptic.selection(); setView('setup_livro'); }} className="bg-primary/10 text-primary p-3 rounded-full hover:bg-primary/20">
                <Target className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {trilhasArr.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma missão ativa.</p>}
              {trilhasArr.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTrilhaVisualizada(t); setView('mapa'); }}
                  className="w-full relative overflow-hidden flex items-center gap-4 text-left p-4 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-md shadow-lg shadow-black/10 active:scale-[0.98]"
                >
                  <div className="w-12 h-16 bg-muted rounded overflow-hidden shrink-0">
                    {t.livroCapa ? <img src={t.livroCapa} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 opacity-30" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Missão: {t.diasMeta} dias</p>
                    <p className="text-sm font-bold text-foreground truncate mb-2">{t.livroTitulo}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.round((t.diasConcluidos.length / t.diasMeta)*100)}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground font-bold">{Math.round((t.diasConcluidos.length / t.diasMeta)*100)}%</p>
                    </div>
                  </div>
                </button>
              ))}
              {trilhasArr.length > 0 && (
                <button
                  onClick={() => { haptic.selection(); setView('setup_livro'); }}
                  className="w-full mt-4 flex items-center justify-center gap-2 p-4 rounded-3xl border-2 border-dashed border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98]"
                >
                  <Target className="w-5 h-5" />
                  <span className="text-sm font-bold">Adicionar Nova Missão</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

        {view === 'setup_livro' && (
          <SetupLivro 
            onSelect={(livro) => { setSelectedLivro(livro); setView('setup_detalhes'); }}
            onCancel={() => {
              if (trilhasArr.length > 0) {
                setView('dashboard');
              } else {
                navigate('/biblioteca');
              }
            }}
          />
        )}

        {view === 'setup_detalhes' && selectedLivro && (
          <SetupDetalhes 
            livro={selectedLivro}
            onBack={() => setView('setup_livro')}
            onFinish={handleCreateTrilha}
          />
        )}

        {view === 'mapa' && trilhaVisualizada && (
          <TrilhaMapaLeitura 
            trilha={trilhaVisualizada} 
            onBack={() => { setTrilhaVisualizada(null); setView('dashboard'); }}
            onOpenReader={handleOpenReader}
          />
        )}
      </AnimatePresence>

      {readerOpen?.formato === 'pdf' && readerOpen.downloadUrl && (
        <PdfScrollReader
          url={readerOpen.downloadUrl}
          titulo={readerOpen.livroTitulo}
          livroId={readerOpen.livroId}
          onClose={() => setReaderOpen(null)}
        />
      )}
      
      {readerOpen?.formato === 'nativo' && readerOpen.tabela && (
        <LeitorNativo
          livroId={readerOpen.livroId}
          livroTabela={readerOpen.tabela}
          pdfUrl={readerOpen.downloadUrl || ''}
          titulo={readerOpen.livroTitulo}
          capa={readerOpen.livroCapa}
          onClose={() => setReaderOpen(null)}
        />
      )}
      
      {view === 'dashboard' && <BibliotecaBottomNav />}
    </div>
  );
};

export default BibliotecaTrilhas;
