import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ChevronRight, X, Sparkles, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { useNavigate } from 'react-router-dom';
import { useFlashcardsResumoAreas } from '@/lib/flashcardsQueries';

// Re-using components from FlashcardsFiltroSheet
import { StepRow, SelecaoSheet } from '@/components/flashcards/FlashcardsFiltroSheet';
import { QuantidadeSheet } from '@/components/flashcards/QuantidadeSheet';

export type TermoTipo = {
  id: string;
  label: string;
  desc: string;
  icon: any;
  color: string;
  keywords: string[];
};

export type FlashcardsTermosFiltroState = {
  areas: string[];
  temas: string[];
  status: string[];
  ordem: string;
  quantidade: number | null;
};

const STATUS = [
  { id: 'todos', label: 'Todos os cards' },
  { id: 'novos', label: 'Novos (Não fiz)' },
  { id: 'revisar', label: 'Em revisão (Para revisar)' },
  { id: 'compreendidos', label: 'Compreendidos (Já fiz)' },
];

const ORDENS = [
  { id: 'sequencial', label: 'Ordem Sequencial', desc: 'Respeita a ordem dos conceitos', icon: FileText },
  { id: 'embaralhado', label: 'Aleatório (Misturado)', desc: 'Cards fora de ordem para retenção ativa', icon: Sparkles }
];

export function FlashcardsTermosFiltro({
  open,
  onOpenChange,
  tipo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: TermoTipo | null;
}) {
  const navigate = useNavigate();
  const [passo, setPasso] = useState<'root' | 'areas' | 'temas' | 'status' | 'ordem' | 'quantidade'>('root');
  
  const [filtro, setFiltro] = useState<FlashcardsTermosFiltroState>({
    areas: [],
    temas: [],
    status: [],
    ordem: 'sequencial',
    quantidade: null,
  });

  const { data: areasRaw, isLoading: loadingAreas } = useFlashcardsResumoAreas();
  const [temasRaw, setTemasRaw] = useState<string[]>([]);
  const [loadingTemas, setLoadingTemas] = useState(false);

  // When Areas change, or Tipo changes, fetch the themes
  useEffect(() => {
    if (!open || !tipo || !areasRaw) return;
    let isMounted = true;
    
    const fetchTemas = async () => {
      setLoadingTemas(true);
      try {
        const areasToFetch = filtro.areas.length > 0 
          ? filtro.areas 
          : areasRaw.map(a => a.area);
          
        const promises = areasToFetch.map(a => 
          supabase.rpc('flashcards_temas', { _area: a })
            .then(res => res.data || [])
        );
        const results = await Promise.all(promises);
        const allTemas = results.flat();
        
        // Filter by keywords
        const filteredTemas = allTemas.filter(t => {
          const temaLower = t.tema.toLowerCase();
          return tipo.keywords.some(k => temaLower.includes(k));
        }).map(t => t.tema);
        
        const uniqueTemas = Array.from(new Set(filteredTemas)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        
        if (isMounted) {
          setTemasRaw(uniqueTemas);
          // Auto clear temas if they are no longer in the list
          setFiltro(prev => ({
            ...prev,
            temas: prev.temas.filter(t => uniqueTemas.includes(t))
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoadingTemas(false);
      }
    };
    
    fetchTemas();
    return () => { isMounted = false; };
  }, [open, tipo, filtro.areas, areasRaw]);

  // GSAP animation for steps
  const stepsRef = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (open && passo === 'root' && stepsRef.current) {
      gsap.fromTo(
        stepsRef.current.children,
        { opacity: 0, y: 15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.2)' }
      );
    }
  }, [open, passo]);

  const handleStart = () => {
    haptic.selection?.();
    const p = new URLSearchParams();
    
    if (filtro.areas.length > 0) p.set('areas', filtro.areas.join('|'));
    
    const temasParaEnviar = filtro.temas.length > 0 ? filtro.temas : temasRaw;
    if (temasParaEnviar.length > 0) p.set('temas', temasParaEnviar.join('|'));
    
    if (filtro.status.length > 0) p.set('modo', filtro.status[0]); // Using first status (todos/novos/revisar)
    
    p.set('ordem', filtro.ordem);
    
    if (filtro.quantidade) {
      p.set('limite', filtro.quantidade.toString());
    } else {
      p.set('limite', '9999');
    }
    
    onOpenChange(false);
    navigate(`/flashcards/estudar?${p.toString()}`);
  };

  if (!open || !tipo) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px]"
        onClick={() => onOpenChange(false)}
      />

      <motion.div
        key="sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[90dvh] min-h-[50dvh] flex-col overflow-hidden rounded-t-[32px] bg-zinc-950 border-t border-zinc-800 shadow-2xl"
      >
        <div className="flex h-1.5 w-12 shrink-0 self-center rounded-full bg-zinc-700/50 mt-3" />
        
        <div className="flex shrink-0 items-center justify-between px-6 pb-2 pt-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold text-zinc-100">
              <tipo.icon className={`h-6 w-6 ${tipo.color}`} />
              {tipo.label}
            </h2>
            <p className="mt-1 text-sm font-medium text-zinc-400">
              Configure sua sessão
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-800/80 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden p-6 pt-2 pb-24">
            <div ref={stepsRef} className="space-y-4">
              <StepRow
                step={1}
                label="Áreas"
                hint={filtro.areas.length === 0 ? 'Todas as áreas' : `${filtro.areas.length} área${filtro.areas.length > 1 ? 's' : ''} selecionada${filtro.areas.length > 1 ? 's' : ''}`}
                onClick={() => setPasso('areas')}
                badge={filtro.areas.length}
              />
              
              <StepRow
                step={2}
                label="Temas Específicos"
                hint={filtro.temas.length === 0 ? 'Todos os temas' : `${filtro.temas.length} tema${filtro.temas.length > 1 ? 's' : ''} selecionado${filtro.temas.length > 1 ? 's' : ''}`}
                onClick={() => setPasso('temas')}
                badge={filtro.temas.length}
              />

              <StepRow
                step={3}
                label="Status"
                hint={filtro.status.length === 0 ? 'Todos os cards' : STATUS.find(s => s.id === filtro.status[0])?.label || 'Filtrado'}
                onClick={() => setPasso('status')}
                done={filtro.status.length > 0}
              />

              <StepRow
                step={4}
                label="Ordem de Apresentação"
                hint={ORDENS.find(o => o.id === filtro.ordem)?.label || 'Sequencial'}
                onClick={() => setPasso('ordem')}
                done={true}
              />

              <StepRow
                step={5}
                label="Quantidade"
                hint={filtro.quantidade === null ? 'Revisar tudo' : `${filtro.quantidade} cards`}
                onClick={() => setPasso('quantidade')}
                done={filtro.quantidade !== null}
              />
            </div>
          </div>

          <AnimatePresence>
            {passo === 'areas' && (
              <SelecaoSheet
                titulo="Selecionar Áreas"
                opcoes={areasRaw?.map(a => a.area) || []}
                selecionado={filtro.areas}
                loading={loadingAreas}
                buscavel
                onConfirmar={(v) => { setFiltro(p => ({ ...p, areas: v })); setPasso('root'); }}
                onFechar={() => setPasso('root')}
              />
            )}
            
            {passo === 'temas' && (
              <SelecaoSheet
                titulo="Selecionar Temas"
                opcoes={temasRaw}
                selecionado={filtro.temas}
                loading={loadingTemas}
                buscavel
                onConfirmar={(v) => { setFiltro(p => ({ ...p, temas: v })); setPasso('root'); }}
                onFechar={() => setPasso('root')}
              />
            )}

            {passo === 'status' && (
              <SelecaoSheet
                titulo="Status dos Cards"
                opcoes={STATUS.map(s => s.id)}
                selecionado={filtro.status}
                single
                onConfirmar={(v) => { setFiltro(p => ({ ...p, status: v })); setPasso('root'); }}
                onFechar={() => setPasso('root')}
                renderOpcao={(o) => {
                  const s = STATUS.find(x => x.id === o);
                  return s ? s.label : o;
                }}
              />
            )}

            {passo === 'ordem' && (
              <SelecaoSheet
                titulo="Ordem de Apresentação"
                opcoes={ORDENS.map(o => o.id)}
                selecionado={[filtro.ordem]}
                single
                onConfirmar={(v) => { if (v.length > 0) setFiltro(p => ({ ...p, ordem: v[0] })); setPasso('root'); }}
                onFechar={() => setPasso('root')}
                renderOpcao={(o) => {
                  const s = ORDENS.find(x => x.id === o);
                  return (
                    <div className="flex items-center gap-3 py-1">
                      {s?.icon && <s.icon className="w-5 h-5 text-muted-foreground" />}
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-foreground">{s?.label}</span>
                        <span className="text-xs text-muted-foreground">{s?.desc}</span>
                      </div>
                    </div>
                  );
                }}
              />
            )}

            {passo === 'quantidade' && (
              <QuantidadeSheet
                selecionado={filtro.quantidade}
                onConfirmar={(v) => { setFiltro(p => ({ ...p, quantidade: v })); setPasso('root'); }}
                onFechar={() => setPasso('root')}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-6 pb-6 px-6">
          <button
            onClick={handleStart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#36AF85] px-4 py-4 text-[16px] font-black uppercase tracking-wide text-white transition-all hover:bg-[#2C9570] active:scale-95 shadow-lg shadow-[#36AF85]/20"
          >
            Iniciar Sessão
            <ChevronRight className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
