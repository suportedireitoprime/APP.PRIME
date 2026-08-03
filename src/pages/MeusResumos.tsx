import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Heart, History, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import ResumoJuridicoReaderSheet, { ResumoRow } from '@/components/resumos-juridicos/ResumoJuridicoReaderSheet';
import { resumosLocal, type ResumoRef } from '@/lib/resumosLocal';
import { supabase } from '@/integrations/supabase/client';
import { useGoBack } from '@/hooks/useGoBack';

type Filtro = 'todos' | 'favoritos' | 'recentes';

/** Lista única dos resumos do usuário: favoritados e abertos recentemente. */
export default function MeusResumos() {
  const voltar = useGoBack('/inicio');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [favs, setFavs] = useState<ResumoRef[]>(() => resumosLocal.favoritos());
  const [recentes, setRecentes] = useState<ResumoRef[]>(() => resumosLocal.recentes());
  const [selected, setSelected] = useState<ResumoRow | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setFavs(resumosLocal.favoritos());
      setRecentes(resumosLocal.recentes());
    };
    void resumosLocal.pull().then(sync);
    window.addEventListener('resumos-local-change', sync);
    return () => window.removeEventListener('resumos-local-change', sync);
  }, []);

  const itens = useMemo(() => {
    const idsFav = new Set(favs.map((r) => r.id));
    const base =
      filtro === 'favoritos' ? favs : filtro === 'recentes' ? recentes : [...favs, ...recentes];
    const vistos = new Set<string>();
    return base
      .filter((r) => (vistos.has(r.id) ? false : (vistos.add(r.id), true)))
      .sort((a, b) => b.ts - a.ts)
      .map((r) => ({ ...r, favorito: idsFav.has(r.id) }));
  }, [favs, recentes, filtro]);

  const abrir = async (ref: ResumoRef) => {
    setLoadingId(ref.id);
    const { data } = await (supabase as any)
      .from('resumos_juridicos')
      .select('id, area, tema, subtema, ordem_subtema, markdown, exemplos, termos')
      .eq('id', ref.id)
      .maybeSingle();
    setLoadingId(null);
    if (data) {
      resumosLocal.registrarRecente({
        id: data.id,
        area: data.area,
        tema: data.tema,
        subtema: data.subtema,
      });
      setSelected(data as ResumoRow);
    }
  };

  const abas: { id: Filtro; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'favoritos', label: 'Favoritos' },
    { id: 'recentes', label: 'Recentes' },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <PageHeader
        title="Meus resumos"
        subtitle={`${itens.length} ${itens.length === 1 ? 'resumo' : 'resumos'}`}
        onBack={voltar}
      />

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <div className="flex gap-2">
          {abas.map((a) => (
            <button
              key={a.id}
              onClick={() => setFiltro(a.id)}
              className={`h-11 px-4 rounded-xl border text-[13px] font-semibold transition ${
                filtro === a.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border/60'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {itens.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              Nenhum resumo aqui ainda. Abra ou favorite um resumo jurídico para aparecer nesta lista.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {itens.map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.24) }}
              >
                <button
                  onClick={() => void abrir(r)}
                  className="w-full flex items-center gap-3 px-4 py-4 min-h-[72px] rounded-2xl bg-card border border-border/60 text-left active:scale-[0.99] transition"
                >
                  <FileText className="w-7 h-7 shrink-0 text-[#22D3EE]" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-foreground text-[15px] font-bold leading-tight line-clamp-2">
                      {r.subtema || r.tema}
                    </p>
                    <p className="font-body text-muted-foreground text-[12px] truncate mt-0.5">
                      {r.area} · {r.tema}
                    </p>
                  </div>
                  {loadingId === r.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                  ) : r.favorito ? (
                    <Heart className="w-4 h-4 text-primary fill-current shrink-0" />
                  ) : (
                    <History className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <ResumoJuridicoReaderSheet resumo={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
