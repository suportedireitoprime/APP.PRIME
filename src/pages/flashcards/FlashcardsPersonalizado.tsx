import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Plus, FileText, Layers, Youtube, Mic, ImageIcon, Trash2, Search, Book, Scale, Library, Clock, Award, Video, Info, Share2, FolderOpen } from 'lucide-react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import WizardFlashcardsIA from '@/components/flashcards/WizardFlashcardsIA';
import { getOfflineDecks, saveOfflineDecks, getOfflineFolders, saveOfflineFolders, Deck, Folder } from '@/lib/flashcardsOfflineManager';
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CATEGORIAS = [
  { id: 'pdf', title: 'Documento PDF', sources: ['pdf', 'documento'] },
  { id: 'youtube', title: 'Vídeo YouTube', sources: ['youtube', 'video'] },
  { id: 'audio', title: 'Áudio', sources: ['audio'] },
  { id: 'imagem', title: 'Imagens', sources: ['imagem', 'image'] },
];

function SwipeableDeckItem({ deck, onSelect, onDelete, onInfo, renderIcon, getTypeColors, formatDate }: any) {
  const x = useMotionValue(0);
  const trashOpacity = useTransform(x, [-80, -30], [1, 0]);
  const deckTipo = deck.filtros?.source || 'pdf';
  const colors = getTypeColors(deckTipo);

  return (
    <div className="relative group overflow-hidden rounded-xl mb-3 border border-border/80 bg-red-500/10">
      <div className="absolute inset-y-0 right-0 w-24 bg-red-500 flex flex-col items-center justify-center text-white rounded-r-xl">
        <motion.div style={{ opacity: trashOpacity }} className="flex flex-col items-center">
          <Trash2 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Excluir</span>
        </motion.div>
      </div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        style={{ x }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -80) {
            onDelete(deck);
            setTimeout(() => x.set(0), 300);
          } else {
            x.set(0);
          }
        }}
        onClick={(e) => {
          if (x.get() < -10) return;
          onSelect(deck);
        }}
        className="relative bg-card hover:border-[#36AF85]/50 transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center p-3 gap-3 overflow-hidden rounded-xl h-full w-full"
      >
        {deck.thumbnail ? (
          <div className="w-20 h-14 bg-muted rounded-lg relative overflow-hidden shrink-0 border border-border/50">
            <img src={deck.thumbnail} alt={deck.nome} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-black/20 pointer-events-none" />
            <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm px-1 rounded text-[8px] text-white font-bold">
              {deck.duration || 'Vídeo'}
            </div>
          </div>
        ) : (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors.iconBg}`}>
            {renderIcon(deckTipo)}
          </div>
        )}
        
        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
          <h4 className="font-bold text-foreground text-sm leading-tight truncate">{deck.nome}</h4>
          
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {deck.materia && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[#36AF85]/10 text-[#36AF85] border border-[#36AF85]/20 truncate max-w-[120px]">
                {deck.materia}
              </span>
            )}
            {deck.tags && deck.tags.length > 0 && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border/50 truncate max-w-[80px]">
                {deck.tags[0]}
              </span>
            )}
            <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {deck.total_cards} cards
            </p>
          </div>
          {deck.total_cards > 0 && deck.cards_compreendidos !== undefined && (
            <div className="mt-2 w-full max-w-[120px]">
              <Progress value={(deck.cards_compreendidos / deck.total_cards) * 100} className="h-1 [&>div]:bg-[#36AF85]" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider bg-background/50 px-1.5 py-0.5 rounded border border-border/50 hidden sm:block">
            {formatDate(deck.created_at)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onInfo(deck);
            }}
            className="p-1.5 text-muted-foreground hover:text-[#36AF85] hover:bg-[#36AF85]/10 rounded-md transition-colors"
            aria-label="Informações do Deck"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function FlashcardsPersonalizado() {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardSource, setWizardSource] = useState<'document' | 'image' | 'youtube' | 'audio' | null>(null);
  const [offlineDecks, setOfflineDecks] = useState<Deck[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [appendDeckId, setAppendDeckId] = useState<string | null>(null);
  const [raioXDeck, setRaioXDeck] = useState<Deck | null>(null);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
  const [offlineFolders, setOfflineFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    document.title = 'Personalizado | Flashcards';
    setOfflineDecks(getOfflineDecks());
    setOfflineFolders(getOfflineFolders());
  }, []);

  // Recarregar os decks quando o modal fechar
  useEffect(() => {
    if (!wizardOpen) {
      setOfflineDecks(getOfflineDecks());
    }
  }, [wizardOpen]);

  const handleDeleteDeck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    haptic.medium();
    const newDecks = offlineDecks.filter(d => d.id !== id);
    setOfflineDecks(newDecks);
    saveOfflineDecks(newDecks);
  };

  const handleUpdateDeckFolder = (folderId: string | null) => {
    if (!raioXDeck) return;
    haptic.selection();
    const updated = { ...raioXDeck, folderId: folderId || undefined };
    setRaioXDeck(updated);
    
    const newDecks = offlineDecks.map(d => d.id === updated.id ? updated : d);
    setOfflineDecks(newDecks);
    saveOfflineDecks(newDecks);
  };

  const getTypeColors = (tipo: string) => {
    if (['youtube', 'video'].includes(tipo)) {
      return { hex: '#EF4444', iconBg: 'bg-red-500/10 text-red-500' };
    }
    if (['imagem', 'image'].includes(tipo)) {
      return { hex: '#F97316', iconBg: 'bg-orange-500/10 text-orange-500' };
    }
    if (['audio'].includes(tipo)) {
      return { hex: '#A855F7', iconBg: 'bg-purple-500/10 text-purple-500' };
    }
    return { hex: '#3B82F6', iconBg: 'bg-blue-500/10 text-blue-500' };
  };

  const renderIcon = (tipo: string) => {
    if (['youtube', 'video'].includes(tipo)) return <Youtube className="w-6 h-6" style={{ color: '#EF4444' }} strokeWidth={1.5} />;
    if (['imagem', 'image'].includes(tipo)) return <ImageIcon className="w-6 h-6" style={{ color: '#F97316' }} strokeWidth={1.5} />;
    if (['audio'].includes(tipo)) return <Mic className="w-6 h-6" style={{ color: '#A855F7' }} strokeWidth={1.5} />;
    return <FileText className="w-6 h-6" style={{ color: '#3B82F6' }} strokeWidth={1.5} />;
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Hoje';
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Filtragem para a view de Categoria
  // Filtra por pasta também
  const recentesGeral = useMemo(() => {
    let list = offlineDecks
      .slice()
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    
    if (activeFolderId) {
      list = list.filter(d => d.folderId === activeFolderId);
    }
    return list;
  }, [offlineDecks, activeFolderId]);

  const decksDaCategoria = useMemo(() => {
    return categoriaSelecionada 
      ? offlineDecks.filter(d => {
          const cat = CATEGORIAS.find(c => c.id === categoriaSelecionada);
          return cat?.sources.includes(d.filtros?.source || 'pdf');
        })
      : [];
  }, [offlineDecks, categoriaSelecionada]);

  const datasDisponiveis = useMemo(() => {
    const dates = decksDaCategoria.map(d => formatDate(d.created_at));
    return ['Todas', ...Array.from(new Set(dates))];
  }, [decksDaCategoria]);

  const decksFiltrados = useMemo(() => {
    if (dataSelecionada === 'Todas') return decksDaCategoria;
    return decksDaCategoria.filter(d => formatDate(d.created_at) === dataSelecionada);
  }, [decksDaCategoria, dataSelecionada]);


  const groupedRecentes = useMemo(() => {
    const groups: { [key: string]: Deck[] } = {};
    recentesGeral.forEach(deck => {
      const dateStr = formatDate(deck.created_at);
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(deck);
    });
    return groups;
  }, [recentesGeral]);

  const resultadosBusca = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return offlineDecks.filter(d => 
      d.nome.toLowerCase().includes(q) || 
      (d.tags && d.tags.some(t => t.toLowerCase().includes(q)))
    );
  }, [offlineDecks, searchQuery]);

  const renderDeckCard = (deck: Deck) => {
    return (
      <SwipeableDeckItem 
        key={deck.id}
        deck={deck} 
        onSelect={(d: Deck) => { haptic.selection(); setSelectedDeck(d); }}
        onDelete={(d: Deck) => { haptic.medium(); setDeckToDelete(d); }}
        onInfo={(d: Deck) => { haptic.selection(); setRaioXDeck(d); }}
        renderIcon={renderIcon}
        getTypeColors={getTypeColors}
        formatDate={formatDate}
      />
    );
  };

  return (
    <div className="min-h-dvh bg-background pb-[calc(8rem+env(safe-area-inset-bottom,0px))] lg:pb-[calc(3rem+env(safe-area-inset-bottom,0px))] overflow-x-hidden">
      <div className="mx-auto w-full max-w-2xl lg:max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8">
        
        {categoriaSelecionada ? (
          <PageHeader
            title={CATEGORIAS.find(c => c.id === categoriaSelecionada)?.title || 'Decks'}
            onBack={() => {
              haptic.selection();
              setCategoriaSelecionada(null);
            }}
          />
        ) : (
          <PageHeader
            title="Decks Personalizados"
            subtitle="Gere flashcards a partir dos seus PDFs, áudios e vídeos"
            onBack={() => navigate('/flashcards')}
          />
        )}

        <div className="mt-6">
          {/* SEARCH BAR */}
          <div className="mb-6 relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou tag..."
              className="pl-10 h-12 rounded-full bg-card border-border/80 shadow-sm"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
          </div>

          {searchQuery.trim() ? (
            <>
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Resultados da Busca</h3>
              </div>
              {resultadosBusca.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-10 text-center mt-2">
                  <p className="text-base font-extrabold text-foreground">Nenhum resultado.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {resultadosBusca.map(renderDeckCard)}
                </div>
              )}
            </>
          ) : !categoriaSelecionada ? (
            <>
              {/* CATEGORIAS GRID */}
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Categorias</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
                {CATEGORIAS.map((cat) => {
                  const count = offlineDecks.filter(d => cat.sources.includes(d.filtros?.source || 'pdf')).length;
                  
                  return (
                    <div 
                      key={cat.id}
                      onClick={() => {
                        haptic.selection();
                        setCategoriaSelecionada(cat.id);
                        setDataSelecionada('Todas');
                      }}
                      className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col items-start gap-3 hover:border-[#36AF85]/50 transition-all cursor-pointer active:scale-95 relative"
                    >
                      <div className="mb-1">
                        {renderIcon(cat.id)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-foreground uppercase">{cat.title}</h4>
                        <p className="text-[11px] sm:text-xs font-medium text-muted-foreground mt-0.5">
                          {count} {count === 1 ? 'deck gerado' : 'decks gerados'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TEMPLATES RÁPIDOS SE VAZIO */}
              {offlineDecks.length === 0 && (
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Ideias de Uso</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'youtube', title: 'Aulas do YouTube', desc: 'Resumo e questões de vídeos', icon: <Youtube className="w-5 h-5 text-red-500" />, bg: 'bg-red-500/10' },
                      { id: 'document', title: 'Documentos & PDFs', desc: 'Gere questões de apostilas', icon: <FileText className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-500/10' },
                      { id: 'document', title: 'Leis Secas', desc: 'Memorize artigos complexos', icon: <Book className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-500/10' },
                      { id: 'image', title: 'Mapas Mentais', desc: 'Extraia conceitos de imagens', icon: <ImageIcon className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-500/10' },
                      { id: 'document', title: 'Jurisprudência', desc: 'Decisões e Súmulas', icon: <Scale className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-500/10' },
                      { id: 'audio', title: 'Áudios e Podcasts', desc: 'Transcrição e flashcards', icon: <Mic className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-500/10' },
                      { id: 'document', title: 'Doutrina', desc: 'Conceitos fundamentais', icon: <Library className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-500/10' },
                      { id: 'youtube', title: 'Julgamentos', desc: 'Análise de sustentações orais', icon: <Video className="w-5 h-5 text-pink-500" />, bg: 'bg-pink-500/10' },
                      { id: 'document', title: 'Prazos Processuais', desc: 'Fixação de datas e prazos', icon: <Clock className="w-5 h-5 text-cyan-500" />, bg: 'bg-cyan-500/10' },
                      { id: 'document', title: 'Súmulas Vinculantes', desc: 'Treino intensivo STF/STJ', icon: <Award className="w-5 h-5 text-yellow-500" />, bg: 'bg-yellow-500/10' },
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => { haptic.selection(); setWizardSource(item.id as "youtube" | "document" | "image" | "audio"); setWizardOpen(true); }}
                        className="bg-card border border-border/80 hover:border-[#36AF85]/50 rounded-2xl p-3 flex gap-4 cursor-pointer transition-all active:scale-95 items-center"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground leading-none">{item.title}</h4>
                          <p className="text-[10px] text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RECENTES */}
              {recentesGeral.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Recentes</h3>
                  </div>
                  <div className="space-y-6">
                    {Object.entries(groupedRecentes).map(([dateLabel, decks]) => (
                      <div key={dateLabel} className="space-y-3">
                        <div className="flex items-center gap-2">
                           <div className="h-px bg-border flex-1" />
                           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">{dateLabel}</span>
                           <div className="h-px bg-border flex-1" />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {decks.map(renderDeckCard)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* FILTRO DE DATAS (HORIZONTAL SCROLL) */}
              {datasDisponiveis.length > 1 && (
                <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-1 -mx-3 px-3 sm:mx-0 sm:px-0">
                  {datasDisponiveis.map((data) => (
                    <button
                      key={data}
                      onClick={() => {
                        haptic.selection();
                        setDataSelecionada(data);
                      }}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        dataSelecionada === data 
                          ? 'bg-[#36AF85] text-white shadow-md' 
                          : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {data}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Decks Gerados</h3>
                <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                  {decksFiltrados.length} {decksFiltrados.length === 1 ? 'encontrado' : 'encontrados'}
                </span>
              </div>

              {decksFiltrados.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-10 text-center mt-6">
                  <p className="text-base font-extrabold text-foreground">Nenhum deck encontrado.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Clique no botão flutuante para gerar um novo deck.</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {decksFiltrados.map(renderDeckCard)}
                </div>
              )}
            </>
          )}
        </div>

      </div>

      <button
        onClick={() => {
          haptic.selection();
          if (categoriaSelecionada) {
            let mapped = categoriaSelecionada;
            if (mapped === 'imagem') mapped = 'image';
            if (mapped === 'pdf') mapped = 'document';
            setWizardSource(mapped as "youtube" | "document" | "image" | "audio");
          } else {
            setWizardSource(null);
          }
          setAppendDeckId(null);
          setWizardOpen(true);
        }}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-8 right-6 z-50 w-14 h-14 bg-[#36AF85] hover:bg-[#2b8c6a] rounded-full flex items-center justify-center shadow-lg shadow-[#36AF85]/30 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      <WizardFlashcardsIA open={wizardOpen} onOpenChange={setWizardOpen} initialSource={wizardSource} appendDeckId={appendDeckId} />

      <Sheet open={!!selectedDeck} onOpenChange={(open) => !open && setSelectedDeck(null)}>
        <SheetContent side="bottom" className="p-0 bg-background border-t border-border/50 max-h-[85vh] flex flex-col rounded-t-[2rem]">
          {selectedDeck && (
            <>
              <div className="relative">
                {selectedDeck.thumbnail ? (
                  <div className="w-full h-48 bg-zinc-900 relative">
                    <img src={selectedDeck.thumbnail} alt={selectedDeck.nome} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                  </div>
                ) : (
                  <div className={`w-full h-32 ${getTypeColors(selectedDeck.filtros?.source || 'pdf').iconBg} relative`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                  </div>
                )}
                
                <div className="absolute bottom-4 left-6 right-6">
                  <div className="flex gap-2 mb-2">
                    {selectedDeck.tags?.map((tag, i) => (
                      <span key={i} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-muted text-foreground border border-border/50 shadow-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <SheetTitle className="font-black text-2xl leading-tight text-foreground line-clamp-2">{selectedDeck.nome}</SheetTitle>
                </div>
              </div>

              <div className="px-6 py-4 flex-1 overflow-y-auto">
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quantidade</p>
                      <p className="text-sm font-bold text-foreground">{selectedDeck.total_cards} Cards</p>
                    </div>
                  </div>
                  
                  {selectedDeck.duration && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                        <Youtube className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Duração</p>
                        <p className="text-sm font-bold text-foreground">{selectedDeck.duration}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Criado em</p>
                      <p className="text-sm font-bold text-foreground">{formatDate(selectedDeck.created_at)}</p>
                    </div>
                  </div>
                </div>

                {selectedDeck.descricao && (
                  <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Resumo da IA</h4>
                    <p className="text-sm text-foreground leading-relaxed">{selectedDeck.descricao}</p>
                  </div>
                )}
              </div>

              <div className="p-6 pt-2 bg-background border-t border-border/50 space-y-3">
                <Button 
                  onClick={() => {
                    haptic.selection();
                    const c = getTypeColors(selectedDeck.filtros?.source || 'pdf').hex;
                    navigate(`/flashcards/estudar?deck=${selectedDeck.id}&cor=${encodeURIComponent(c)}&modo=todos`);
                  }} 
                  className="w-full bg-[#36AF85] hover:bg-[#2b8c6a] text-white rounded-full font-bold h-14 text-base shadow-lg shadow-[#36AF85]/20 active:scale-95 transition-all"
                >
                  Iniciar Sessão <span className="ml-1 opacity-80 text-sm font-normal">({selectedDeck.total_cards} cards)</span>
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      haptic.selection();
                      setWizardSource(null);
                      setAppendDeckId(selectedDeck.id);
                      setWizardOpen(true);
                      setSelectedDeck(null);
                    }} 
                    className="flex-1 rounded-full h-12 font-bold border-border/50 text-foreground"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Adicionar Cards
                  </Button>

                  {selectedDeck.cards_a_revisar !== undefined && selectedDeck.cards_a_revisar > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        haptic.selection();
                        const c = getTypeColors(selectedDeck.filtros?.source || 'pdf').hex;
                        navigate(`/flashcards/estudar?deck=${selectedDeck.id}&cor=${encodeURIComponent(c)}&modo=revisar`);
                      }} 
                      className="flex-1 rounded-full h-12 font-bold border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    >
                      Revisar Erros ({selectedDeck.cards_a_revisar})
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* RAIO-X SHEET */}
      <Sheet open={!!raioXDeck} onOpenChange={(open) => !open && setRaioXDeck(null)}>
        <SheetContent side="bottom" className="p-0 bg-background border-t border-border/50 max-h-[90vh] flex flex-col rounded-t-[2rem]">
          {raioXDeck && (
            <div className="flex flex-col h-full overflow-y-auto p-6 scrollbar-hide">
              <SheetHeader className="mb-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-[#36AF85]/10 flex items-center justify-center shrink-0 mb-2">
                  {renderIcon(raioXDeck.filtros?.source || 'pdf')}
                </div>
                <SheetTitle className="text-xl font-black text-foreground text-center line-clamp-2">
                  {raioXDeck.nome}
                </SheetTitle>
                <p className="text-xs text-muted-foreground text-center mt-1 uppercase tracking-widest font-bold">
                  Criado em {formatDate(raioXDeck.created_at)}
                </p>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-[#36AF85]">{raioXDeck.total_cards}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Cards Total</span>
                </div>
                <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-amber-500">{(raioXDeck.cards_compreendidos || 0)}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">Acertos Recentes</span>
                </div>
              </div>

              <div className="mb-6 space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Pasta</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateDeckFolder(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${!raioXDeck.folderId ? 'bg-[#36AF85] text-white border-[#36AF85]' : 'bg-card text-muted-foreground border-border/80'}`}
                  >
                    Nenhuma
                  </button>
                  {offlineFolders.map(f => (
                    <button
                      key={f.id}
                      onClick={() => handleUpdateDeckFolder(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${raioXDeck.folderId === f.id ? 'bg-[#36AF85] text-white border-[#36AF85]' : 'bg-card text-muted-foreground border-border/80'}`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 mt-auto">
                <Button 
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-600/20 text-sm font-bold gap-2"
                  onClick={() => {
                    haptic.selection();
                    // Implementação de compartilhamento
                    alert('Gerando link seguro... Funcionalidade de compartilhamento em construção');
                  }}
                >
                  <Share2 className="w-5 h-5" /> Compartilhar Deck via Link
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full h-14 border-border/80 text-foreground hover:bg-accent rounded-xl text-sm font-bold"
                  onClick={() => {
                    haptic.selection();
                    setSelectedDeck(raioXDeck);
                    setRaioXDeck(null);
                  }}
                >
                  <Book className="w-5 h-5 mr-2" /> Iniciar Estudo
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deckToDelete} onOpenChange={(open) => !open && setDeckToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir deck?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deckToDelete?.nome}"? Esta ação não pode ser desfeita e os flashcards serão apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deckToDelete) {
                  const newDecks = offlineDecks.filter(d => d.id !== deckToDelete.id);
                  setOfflineDecks(newDecks);
                  saveOfflineDecks(newDecks);
                  setDeckToDelete(null);
                }
              }} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
