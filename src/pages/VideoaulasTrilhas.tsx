import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, PlayCircle, Route as RouteIcon, MapPin, CheckCircle2, Settings2, Lightbulb, Target, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { useTrilhaStore } from '@/lib/trilhasStore';
import { useAreaTrilhaStore } from '@/lib/areaTrilhasStore';
import { loadConcursos, type ConcursoRow } from '@/lib/videoaulasStore';
import { haptic } from '@/lib/nativeHaptics';
import { slugify, getCapaDaArea } from '@/lib/videoaulasCatalogos';
import VideoaulasBottomNav from '@/components/videoaulas/VideoaulasBottomNav';
import { Drawer, DrawerContent, DrawerPortal, DrawerOverlay } from '@/components/ui/drawer';
import { toast } from '@/hooks/use-toast';

// --- SETUP FASE 1: ESCOLHER EDITAL ---
const SetupEdital = ({ concursos, onSelect }: { concursos: ConcursoRow[], onSelect: (id: string) => void }) => (
 <motion.div
 initial="hidden"
 animate="show"
 exit={{ opacity: 0, y: -20 }}
 variants={{
 show: { transition: { staggerChildren: 0.1 } }
 }}
 className="w-full flex flex-col pt-4 px-4 pb-32"
 >
 <motion.div 
 variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
 className="text-center mb-8"
 >
 <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 relative">
 <Target className="w-10 h-10 text-primary" />
 <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50" />
 </div>
 <h2 className="text-2xl font-black text-foreground mb-2">Qual seu alvo?</h2>
 <p className="text-sm text-muted-foreground">Escolha o edital para montarmos seu plano de aprovação.</p>
 </motion.div>

 <div className="space-y-3">
 {concursos.map(c => (
 <motion.button
 variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }}
 key={c.id}
 onClick={() => {
 haptic.selection();
 onSelect(c.id);
 }}
 className="w-full flex items-center gap-4 text-left p-4 rounded-3xl border border-border/40 bg-card shadow-lg shadow-black/10 hover:border-primary/50 transition-all active:scale-[0.98]"
 >
 <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
 <Target className="w-6 h-6 text-muted-foreground" />
 </div>
 <div>
 <p className="text-sm font-bold uppercase leading-tight mb-1 text-foreground">{c.titulo}</p>
 <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold">
 <MapPin className="w-3.5 h-3.5" /> {c.disciplinas?.length || 0} disciplinas
 </p>
 </div>
 </motion.button>
 ))}
 </div>
 </motion.div>
);

// --- SETUP FASE 2: RITMO/PRAZO ---
const SetupRitmo = ({ editalId, concursos, onBack, onFinish }: { editalId: string, concursos: ConcursoRow[], onBack: () => void, onFinish: (dias: number) => void }) => {
 const edital = concursos.find(c => c.id === editalId);
 const [dias, setDias] = useState(30);
 const opcoesDias = [15, 30, 45, 90];

 return (
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -20 }}
 className="w-full flex flex-col pt-4 px-4 pb-32"
 >
 <button onClick={onBack} className="self-start p-2 mb-4 text-muted-foreground hover:text-foreground">
 <ChevronLeft className="w-6 h-6" />
 </button>

 <div className="text-center mb-8">
 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
 <Calendar className="w-8 h-8 text-primary" />
 </div>
 <h2 className="text-2xl font-black text-foreground mb-2">Prazo da Missão</h2>
 <p className="text-sm text-muted-foreground mb-4">
 Em quanto tempo você quer bater o edital <strong className="text-foreground">{edital?.titulo}</strong>?
 </p>

 <div className="grid grid-cols-2 gap-3 mt-8">
 {opcoesDias.map(num => (
 <button
 key={num}
 onClick={() => {
 haptic.selection();
 setDias(num);
 }}
 className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
 dias === num ? 'border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20' : 'border-border/50 bg-card hover:border-primary/50'
 }`}
 >
 <span className={`text-2xl font-black ${dias === num ? 'text-primary' : 'text-foreground'}`}>
 {num}
 </span>
 <span className={`text-xs font-semibold uppercase tracking-wider ${dias === num ? 'text-primary/80' : 'text-muted-foreground'}`}>
 Dias
 </span>
 {dias === num && <CheckCircle2 className="w-5 h-5 text-primary absolute top-2 right-2" />}
 </button>
 ))}
 </div>

 <button
 onClick={() => {
 haptic.success();
 onFinish(dias);
 }}
 className="w-full mt-10 bg-primary text-primary-foreground font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all active:scale-95"
 >
 Gerar Minha Trilha
 </button>
 </div>
 </motion.div>
 );
};

// --- MAPA DA TRILHA (GLOBAL/EDITAL) ---
const TrilhaMap = ({ concursos, onBack }: { concursos: ConcursoRow[], onBack: () => void }) => {
 const navigate = useNavigate();
 const { trilhaAtiva, limparTrilha, marcarDiaConcluido, desmarcarDiaConcluido } = useTrilhaStore();
 const [drawerOpen, setDrawerOpen] = useState(false);

 const edital = useMemo(() => concursos.find(c => c.id === trilhaAtiva?.editalId), [concursos, trilhaAtiva]);

 const nodos = useMemo(() => {
 if (!edital || !trilhaAtiva) return [];
 const diasList = [];
 let dIndex = 0;
 const disc = edital.disciplinas || ['Disciplinas Gerais'];
 const aulasPorDia = 2; 

 for (let i = 0; i < trilhaAtiva.diasMeta; i++) {
 const selecionadas = [];
 for(let a=0; a < aulasPorDia; a++){
 selecionadas.push(disc[dIndex % disc.length]);
 dIndex++;
 }
 diasList.push({ dia: i + 1, disciplinas: selecionadas });
 }
 return diasList;
 }, [edital, trilhaAtiva]);

 if (!edital || !trilhaAtiva) return null;

 const totalConcluido = trilhaAtiva.diasConcluidos.length;
 const progressoPct = Math.round((totalConcluido / trilhaAtiva.diasMeta) * 100);

 return (
 <div className="w-full pb-32">
 <div className="sticky top-0 z-40 bg-background/95 border-b border-white/5 px-4 py-4 flex items-center justify-between shadow-sm">
 <div className="flex items-center gap-3">
 <button onClick={onBack} className="p-2 -ml-2 rounded-full bg-white/5 text-muted-foreground hover:text-foreground">
 <ChevronLeft className="w-5 h-5" />
 </button>
 <div>
 <p className="text-[10px] uppercase font-black text-primary tracking-widest mb-0.5">Edital Completo</p>
 <p className="text-sm font-bold text-foreground truncate max-w-[150px]">{edital.titulo}</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex flex-col items-end">
 <span className="text-xs font-bold text-primary">{progressoPct}%</span>
 <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden mt-0.5">
 <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progressoPct}%` }} />
 </div>
 </div>
 <button 
 onClick={() => {
 haptic.selection();
 setDrawerOpen(true);
 }}
 className="p-2 rounded-full bg-white/5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
 >
 <Settings2 className="w-5 h-5" />
 </button>
 </div>
 </div>

 <div className="px-4 py-10 relative overflow-hidden">
 <div className="absolute left-1/2 top-10 bottom-10 w-1.5 bg-white/5 -translate-x-1/2 z-0 rounded-full overflow-hidden">
 <div 
 className="w-full bg-primary/80 transition-all duration-700 ease-in-out" 
 style={{ height: `${(totalConcluido / trilhaAtiva.diasMeta) * 100}%`, boxShadow: '0 0 10px rgba(var(--primary), 0.5)' }} 
 />
 </div>

 <div className="space-y-10">
 {nodos.map((nodo, i) => {
 const concluido = trilhaAtiva.diasConcluidos.includes(nodo.dia);
 const isLeft = i % 2 === 0;

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
 if(concluido) {
 desmarcarDiaConcluido(nodo.dia);
 } else {
 marcarDiaConcluido(nodo.dia);
 }
 }}
 className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full z-20 flex items-center justify-center transition-all duration-300 ${
 concluido 
 ? 'bg-primary border-4 border-background shadow-[0_0_15px_rgba(var(--primary),0.6)] scale-110' 
 : 'bg-[#1A1A1A] border-4 border-background text-muted-foreground'
 }`}
 >
 {concluido ? (
 <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
 ) : (
 <span className="text-[11px] font-black">{nodo.dia}</span>
 )}
 </button>

 <div 
 className={`w-[45%] rounded-3xl p-4 relative z-30 transition-all duration-300 border ${
 concluido 
 ? 'bg-primary/5 border-primary/20 shadow-sm opacity-80' 
 : 'bg-card/40 border-white/10 shadow-lg hover:border-white/20 hover:-translate-y-1'
 }`}
 >
 <div className="flex items-center justify-between mb-3">
 <p className={`text-[10px] font-black uppercase tracking-widest ${concluido ? 'text-primary/70' : 'text-muted-foreground'}`}>
 Dia {nodo.dia}
 </p>
 {(nodo.dia === 1 || nodo.dia === trilhaAtiva.diasMeta) && !concluido && (
 <Lightbulb className="w-3.5 h-3.5 text-yellow-500/70 animate-pulse" />
 )}
 </div>
 
 <div className="space-y-2.5">
 {nodo.disciplinas.map((disc, idx) => (
 <button 
 key={idx}
 onClick={(e) => {
 e.stopPropagation();
 haptic.light();
 navigate(`/videoaulas/areas/${slugify(disc)}`);
 }}
 className="flex flex-col gap-1 w-full text-left group"
 >
 <div className="flex items-center gap-2">
 <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${concluido ? 'bg-primary/20' : 'bg-white/5 group-hover:bg-primary/20'}`}>
 <PlayCircle className={`w-3 h-3 ${concluido ? 'text-primary' : 'text-foreground/70 group-hover:text-primary'}`} />
 </div>
 <p className={`text-[11px] font-semibold line-clamp-2 leading-tight ${concluido ? 'text-muted-foreground' : 'text-foreground group-hover:text-primary transition-colors'}`}>
 {disc}
 </p>
 </div>
 </button>
 ))}
 </div>
 </div>
 </motion.div>
 );
 })}
 </div>
 </div>

 <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
 <DrawerPortal>
 <DrawerOverlay className="fixed inset-0 bg-black/60 z-50 " onClick={() => setDrawerOpen(false)} />
 <DrawerContent className="bg-card border-t border-white/10 flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-50 pb-[calc(1.25rem+var(--sai-bottom))]">
 <div className="p-6">
 <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-white/10 mb-8" />
 <h3 className="text-xl font-black mb-2">Ajustes da Missão</h3>
 <p className="text-sm text-muted-foreground mb-8">
 Você definiu o prazo de <strong className="text-foreground">{trilhaAtiva.diasMeta} dias</strong> para o edital {edital.titulo}.
 </p>
 
 <button
 onClick={() => {
 haptic.medium();
 limparTrilha();
 setDrawerOpen(false);
 onBack();
 }}
 className="w-full bg-destructive/10 text-destructive font-bold py-4 rounded-2xl hover:bg-destructive/20 transition-colors active:scale-[0.98]"
 >
 Abortar Missão (Edital)
 </button>
 </div>
 </DrawerContent>
 </DrawerPortal>
 </Drawer>
 </div>
 );
};


// --- DASHBOARD DE TRILHAS ---
const TrilhasDashboard = ({ concursos, onCreateNova, onOpenEdital }: { concursos: ConcursoRow[], onCreateNova: () => void, onOpenEdital: () => void }) => {
 const navigate = useNavigate();
 const { trilhaAtiva, limparTrilha } = useTrilhaStore();
 const { trilhasAtivas, limparAreaTrilha } = useAreaTrilhaStore();

 const areasArray = Object.values(trilhasAtivas);
 const editalConcurso = trilhaAtiva ? concursos.find(c => c.id === trilhaAtiva.editalId) : null;
 const editalCapa = editalConcurso?.capa;

 const handleDeleteTrilha = (e: React.MouseEvent | React.PointerEvent) => {
 e.preventDefault();
 e.stopPropagation();
 haptic.medium();
 limparTrilha();
 toast({ title: 'Trilha apagada', description: 'Seu cronograma de edital foi removido.' });
 };

 const handleDeleteAreaTrilha = (e: React.MouseEvent | React.PointerEvent, slug: string) => {
 e.preventDefault();
 e.stopPropagation();
 haptic.medium();
 limparAreaTrilha(slug);
 toast({ title: 'Trilha apagada', description: 'A trilha de disciplina foi removida.' });
 };
 
 return (
 <div className="w-full flex flex-col pt-6 px-4 pb-32">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h2 className="text-2xl font-black text-foreground">Suas Trilhas</h2>
 <p className="text-sm text-muted-foreground">Continue de onde parou</p>
 </div>
 <button 
 onClick={() => {
 haptic.selection();
 onCreateNova();
 }}
 className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors p-3 rounded-full"
 >
 <Plus className="w-6 h-6" />
 </button>
 </div>

 <div className="space-y-4">
 {/* Cartão da Trilha de Edital (Global) */}
 {trilhaAtiva && (
 <div className="relative w-full overflow-hidden rounded-3xl shadow-lg border border-primary/20 bg-primary/5 hover:border-primary/50 transition-all active:scale-[0.98]">
 {editalCapa && (
 <img 
 src={editalCapa} 
 alt="Capa" 
 className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-10 mix-blend-screen pointer-events-none"
 />
 )}
 <div className="w-full flex items-stretch">
 <div
 onClick={() => {
 haptic.light();
 onOpenEdital();
 }}
 className="flex-1 cursor-pointer flex flex-col text-left p-4 relative z-10 pr-2"
 >
 <div className="flex items-start justify-between mb-3 w-full">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
 <Target className="w-5 h-5 text-primary" />
 </div>
 <div>
 <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Edital Completo</p>
 <p className="text-[13px] leading-snug font-bold text-foreground line-clamp-2">
 {editalConcurso?.titulo || 'Edital'}
 </p>
 </div>
 </div>
 </div>
 
 <div className="mt-auto">
 <div className="flex items-center justify-between mb-1.5">
 <p className="text-[10px] font-bold text-muted-foreground">
 {trilhaAtiva.diasMeta * 2} aulas • {trilhaAtiva.diasMeta} dias
 </p>
 <p className="text-[10px] font-bold text-primary">
 {Math.round((trilhaAtiva.diasConcluidos.length / trilhaAtiva.diasMeta) * 100)}%
 </p>
 </div>
 <div className="h-1.5 w-full rounded-full bg-black/80 overflow-hidden">
 <div
 className="h-full rounded-full bg-primary"
 style={{ width: `${Math.round((trilhaAtiva.diasConcluidos.length / trilhaAtiva.diasMeta) * 100)}%` }}
 />
 </div>
 </div>
 </div>
 
 <div className="shrink-0 flex items-start justify-end p-4 relative z-30">
 <button
 type="button"
 onClick={handleDeleteTrilha}
 className="p-2.5 bg-black/50 text-white/70 hover:bg-red-500/30 hover:text-red-400 active:bg-red-600/40 active:text-red-300 rounded-full transition-colors flex items-center justify-center"
 >
 <Trash2 className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Cartões das Trilhas de Disciplina (Área) */}
 {areasArray.map((areaTrilha) => {
 const capaArea = getCapaDaArea(areaTrilha.areaName);
 return (
 <div key={areaTrilha.areaSlug} className="relative w-full overflow-hidden rounded-3xl shadow-lg border border-border/40 bg-card hover:border-white/20 transition-all active:scale-[0.98]">
 <div className="w-full flex items-stretch">
 <div
 onClick={() => {
 haptic.light();
 navigate(`/videoaulas/${areaTrilha.catalogoId}/${areaTrilha.areaSlug}`, { state: { tab: 'trilhas' } });
 }}
 className="flex-1 cursor-pointer flex flex-col text-left p-4 relative z-10 pr-2"
 >
 <div className="flex items-start justify-between mb-3 w-full">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0 overflow-hidden">
 {capaArea ? (
 <img src={capaArea} alt={areaTrilha.areaName} className="w-full h-full object-cover" />
 ) : (
 <RouteIcon className="w-5 h-5 text-muted-foreground" />
 )}
 </div>
 <div>
 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Disciplina</p>
 <p className="text-[13px] leading-snug font-bold text-foreground line-clamp-2">
 {areaTrilha.areaName}
 </p>
 </div>
 </div>
 </div>
 
 <div className="mt-auto">
 <div className="flex items-center justify-between mb-1.5">
 <p className="text-[10px] font-bold text-muted-foreground">
 {areaTrilha.diasMeta * 2} aulas • {areaTrilha.diasMeta} dias
 </p>
 <p className="text-[10px] font-bold text-primary">
 {Math.round((areaTrilha.diasConcluidos.length / areaTrilha.diasMeta) * 100)}%
 </p>
 </div>
 <div className="h-1.5 w-full rounded-full bg-black/80 overflow-hidden">
 <div
 className="h-full rounded-full bg-primary/70"
 style={{ width: `${Math.round((areaTrilha.diasConcluidos.length / areaTrilha.diasMeta) * 100)}%` }}
 />
 </div>
 </div>
 </div>
 
 <div className="shrink-0 flex items-start justify-end p-4 relative z-30">
 <button
 type="button"
 onClick={(e) => handleDeleteAreaTrilha(e, areaTrilha.areaSlug)}
 className="p-2.5 bg-black/50 text-white/70 hover:bg-red-500/30 hover:text-red-400 active:bg-red-600/40 active:text-red-300 rounded-full transition-colors flex items-center justify-center"
 >
 <Trash2 className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>
 )})}
 </div>
 </div>
 );
};


const VideoaulasTrilhas = () => {
 const navigate = useNavigate();
 const [concursos, setConcursos] = useState<ConcursoRow[]>([]);
 const [loading, setLoading] = useState(true);
 
 const { trilhaAtiva, setTrilhaAtiva } = useTrilhaStore();
 const { trilhasAtivas } = useAreaTrilhaStore();

 const hasAnyTrail = !!trilhaAtiva || Object.keys(trilhasAtivas).length > 0;

 // Estados de navegação local
 const [view, setView] = useState<'dashboard' | 'setup_edital' | 'setup_ritmo' | 'mapa'>(
 hasAnyTrail ? 'dashboard' : 'setup_edital'
 );
 
 const [selectedEdital, setSelectedEdital] = useState<string | null>(null);

 useEffect(() => {
 let alive = true;
 loadConcursos().then((c) => {
 if (!alive) return;
 setConcursos(c.filter(x => x.disciplinas?.length > 0)); // Apenas concursos com disciplinas
 setLoading(false);
 });
 return () => { alive = false; };
 }, []);

 return (
 <div className="min-h-screen bg-[#0A0A0A]">
 <PageHeader
 title="Trilhas"
 subtitle="Cronogramas Inteligentes"
 onBack={() => {
 if (view === 'setup_edital' && hasAnyTrail) {
 setView('dashboard');
 } else {
 navigate(-1);
 }
 }}
 />

 {loading ? (
 <div className="flex items-center justify-center min-h-[50vh]">
 <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
 </div>
 ) : (
 <AnimatePresence mode="wait">
 {view === 'dashboard' && (
 <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
 <TrilhasDashboard 
 concursos={concursos}
 onCreateNova={() => setView('setup_edital')}
 onOpenEdital={() => setView('mapa')}
 />
 </motion.div>
 )}

 {view === 'setup_edital' && (
 <SetupEdital 
 key="edital" 
 concursos={concursos} 
 onSelect={(id) => {
 setSelectedEdital(id);
 setView('setup_ritmo');
 }}
 />
 )}

 {view === 'setup_ritmo' && (
 <SetupRitmo 
 key="ritmo" 
 editalId={selectedEdital!} 
 concursos={concursos} 
 onBack={() => setView('setup_edital')}
 onFinish={(dias) => {
 setTrilhaAtiva({
 editalId: selectedEdital!,
 diasMeta: dias,
 diasConcluidos: [],
 dataInicio: new Date().toISOString()
 });
 setView('mapa');
 }} 
 />
 )}

 {view === 'mapa' && trilhaAtiva && (
 <motion.div key="mapa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
 <TrilhaMap 
 concursos={concursos} 
 onBack={() => setView('dashboard')} 
 />
 </motion.div>
 )}
 </AnimatePresence>
 )}
 <VideoaulasBottomNav />
 </div>
 );
};

export default VideoaulasTrilhas;
