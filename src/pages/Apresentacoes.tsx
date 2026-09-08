import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'framer-motion';
import { Presentation, Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { PrimeImage } from '@/components/ui/PrimeImage';
import { supabase } from '@/integrations/supabase/client';
import { useGatedFeature } from '@/hooks/useGatedFeature';

type Apres = {
  id: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  total_slides: number;
  origem: string;
  area: string | null;
  tema: string | null;
  subtema: string | null;
};

const Apresentacoes = () => {
  const navigate = useNavigate();
  const [itens, setItens] = useState<Apres[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [area, setArea] = useState<string>(() => sessionStorage.getItem('apres_filtro_area') || '');
  const [aberta, setAberta] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [temMais, setTemMais] = useState(true);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const isBottomVisible = useInView(bottomRef, { margin: "200px" });

  const gate = useGatedFeature('apresentacao_ver', 'default', { scope: aberta });

  const buscarItens = useCallback(async (paginaAtual: number, sinal?: AbortSignal) => {
    try {
      const { data, error } = await supabase
        .from('apresentacoes_narradas')
        .select('id, titulo, descricao, capa_url, total_slides, origem, area, tema, subtema')
        .eq('publicada', true)
        .order('created_at', { ascending: false })
        .range(paginaAtual * 20, (paginaAtual + 1) * 20 - 1)
        .abortSignal(sinal);
        
      if (error) {
        if (error.name !== 'AbortError') throw error;
        return;
      }
      
      if (!sinal?.aborted) {
        if (data) {
          setItens(prev => paginaAtual === 0 ? (data as Apres[]) : [...prev, ...(data as Apres[])]);
          setTemMais(data.length === 20);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error('Não foi possível carregar as apresentações.');
      }
    }
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    (async () => {
      setCarregando(true);
      await buscarItens(0, abort.signal);
      if (!abort.signal.aborted) setCarregando(false);
    })();
    return () => abort.abort();
  }, [buscarItens]);

  useEffect(() => {
    if (isBottomVisible && temMais && !carregando && !carregandoMais) {
      setCarregandoMais(true);
      buscarItens(page + 1).then(() => {
        setPage(p => p + 1);
        setCarregandoMais(false);
      });
    }
  }, [isBottomVisible, temMais, carregando, carregandoMais, page, buscarItens]);

  const handleSetArea = (novaArea: string) => {
    setArea(novaArea);
    sessionStorage.setItem('apres_filtro_area', novaArea);
  };

  const areas = useMemo(
    () => Array.from(new Set(itens.map((i) => i.area).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [itens],
  );
  const filtrados = useMemo(() => (area ? itens.filter((i) => i.area === area) : itens), [itens, area]);

  const abrir = async (a: Apres) => {
    setAberta(a.id);
    const ok = await gate.run();
    if (ok) navigate(`/apresentacao/${a.id}`, { state: { capa_url: a.capa_url, titulo: a.titulo } });
  };

  return (
    <div className="min-h-dvh bg-background pb-28">
      <PageHeader title="Apresentação" subtitle="Aulas narradas em slides" onBack={() => navigate('/')} />

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {!!areas.length && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {[{ id: '', label: 'Todas' }, ...areas.map((a) => ({ id: a, label: a }))].map((c) => (
              <button
                key={c.id || 'todas'}
                onClick={() => handleSetArea(c.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold font-body border transition ${area === c.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {carregando ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !filtrados.length ? (
          <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-2">
            <Presentation className="w-8 h-8 text-primary mx-auto" />
            <p className="text-sm font-body text-muted-foreground">
              Nenhuma apresentação publicada por aqui ainda. Volte em breve.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtrados.map((a) => (
              <button
                key={a.id}
                onClick={() => abrir(a)}
                className="text-left rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors"
              >
                <span className="block aspect-video bg-muted relative overflow-hidden group">
                  <PrimeImage
                    src={a.capa_url}
                    alt={a.titulo}
                    aspectRatio="16/9"
                    targetWidth={200}
                    priority={filtrados.indexOf(a) < 2}
                    containerClassName="w-full h-full"
                    className="transition-transform duration-500 group-hover:scale-105"
                    fallbackIcon={<Presentation className="w-8 h-8 text-primary" />}
                  />
                  
                  {/* Player de Vidro */}
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-110">
                    <span className="w-12 h-12 rounded-full bg-black/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white drop-shadow-xl shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                      <PlayCircle className="w-6 h-6 ml-0.5" strokeWidth={1.5} />
                    </span>
                  </span>

                  <span className="absolute bottom-2 right-2 rounded-full bg-background/85 px-2 py-1 text-[11px] font-body flex items-center gap-1 shadow-sm backdrop-blur-sm z-10">
                    <Presentation className="w-3.5 h-3.5 text-primary" /> {a.total_slides} slides
                  </span>
                </span>
                <span className="block p-3">
                  <span className="block font-heading font-bold text-sm">{a.titulo}</span>
                  <span className="block text-[11px] text-muted-foreground font-body mt-0.5 truncate">
                    {[a.area, a.tema].filter(Boolean).join(' · ') || a.descricao}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
        
        {/* Infinite Scroll trigger */}
        {filtrados.length > 0 && <div ref={bottomRef} className="h-4" />}
        {carregandoMais && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
      </div>

      {gate.gateNode}
    </div>
  );
};

export default Apresentacoes;
