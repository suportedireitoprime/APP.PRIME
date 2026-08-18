import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation, Loader2, PlayCircle } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
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
  const [area, setArea] = useState<string>('');
  const [aberta, setAberta] = useState<string | null>(null);

  const gate = useGatedFeature('apresentacao_ver', 'default', { scope: aberta });

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from('apresentacoes_narradas') as any)
        .select('id, titulo, descricao, capa_url, total_slides, origem, area, tema, subtema')
        .eq('publicada', true)
        .order('created_at', { ascending: false });
      setItens((data as Apres[]) ?? []);
      setCarregando(false);
    })();
  }, []);

  const areas = useMemo(
    () => Array.from(new Set(itens.map((i) => i.area).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [itens],
  );
  const filtrados = useMemo(() => (area ? itens.filter((i) => i.area === area) : itens), [itens, area]);

  const abrir = async (a: Apres) => {
    setAberta(a.id);
    const ok = await gate.run();
    if (ok) navigate(`/apresentacao/${a.id}`);
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
                onClick={() => setArea(c.id)}
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
                  {a.capa_url
                    ? <img src={a.capa_url} alt={a.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="eager" fetchPriority="high" decoding="async" />
                    : <Presentation className="w-8 h-8 text-primary absolute inset-0 m-auto" />}
                  
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
      </div>

      {gate.gateNode}
    </div>
  );
};

export default Apresentacoes;
