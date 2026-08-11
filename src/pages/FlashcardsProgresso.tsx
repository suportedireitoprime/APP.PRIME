import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/vademecum/PageHeader';
import FlashcardsBottomNav from '@/components/flashcards/FlashcardsBottomNav';
import { getAreaVisual } from '@/lib/flashcardsAreaVisual';
import { haptic } from '@/lib/nativeHaptics';
import { AlertTriangle, BarChart3, ChevronRight, Trophy } from 'lucide-react';

type AreaRow = {
  area: string;
  slug: string;
  ordem: number;
  total_cards: number;
  compreendidos: number;
  a_revisar: number;
};

type Item = AreaRow & { estudados: number; dominio: number; atencao: number };

const FlashcardsProgresso = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [loading, setLoading] = useState(true);

  // SEO & Título dinâmico
  useEffect(() => {
    document.title = 'Progresso & Estatísticas de Flashcards | Vade Mecum PRIME';
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.rpc('flashcards_resumo_areas');
      if (!alive) return;
      if (data) setAreas(data as unknown as AreaRow[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const itens = useMemo<Item[]>(() => {
    return areas
      .map((a) => {
        const compreendidos = Number(a.compreendidos) || 0;
        const aRevisar = Number(a.a_revisar) || 0;
        const estudados = compreendidos + aRevisar;
        return {
          ...a,
          estudados,
          dominio: estudados ? Math.round((compreendidos / estudados) * 100) : 0,
          atencao: estudados ? Math.round((aRevisar / estudados) * 100) : 0,
        };
      })
      .filter((a) => a.estudados > 0);
  }, [areas]);

  const dominando = useMemo(
    () => [...itens].sort((a, b) => b.dominio - a.dominio || b.estudados - a.estudados).slice(0, 5),
    [itens],
  );
  const atencao = useMemo(
    () => [...itens].sort((a, b) => b.atencao - a.atencao || b.a_revisar - a.a_revisar).slice(0, 5),
    [itens],
  );

  const totalCompreendidos = itens.reduce((s, a) => s + Number(a.compreendidos), 0);
  const totalRevisar = itens.reduce((s, a) => s + Number(a.a_revisar), 0);
  const totalEstudados = totalCompreendidos + totalRevisar;
  const dominioGeral = totalEstudados ? Math.round((totalCompreendidos / totalEstudados) * 100) : 0;

  return (
    <div className="min-h-dvh bg-background pb-32">
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader title="Progresso" onBack={() => navigate('/flashcards')} />

        <div className="space-y-6 px-4 pt-4 sm:px-6">
          {/* Resumo geral */}
          <section className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-500" /> Domínio geral
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display text-4xl font-black leading-none text-foreground">{dominioGeral}%</span>
              <span className="pb-1 text-[12px] text-muted-foreground">
                {totalCompreendidos.toLocaleString('pt-BR')} compreendidos · {totalRevisar.toLocaleString('pt-BR')} a revisar
              </span>
            </div>
            <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-[hsl(var(--aprender-accent))]" style={{ width: `${dominioGeral}%` }} />
              <div className="h-full bg-[#f97316]" style={{ width: `${100 - dominioGeral}%` }} />
            </div>
          </section>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : itens.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              <BarChart3 className="mx-auto mb-2 h-6 w-6" />
              Estude alguns cards para ver seu progresso por área.
            </div>
          ) : (
            <>
              <Bloco
                titulo="Você está dominando"
                icone={<Trophy className="h-3.5 w-3.5 text-[hsl(var(--aprender-accent))]" />}
                itens={dominando}
                tipo="dominio"
                onPick={(area) => { haptic.selection(); navigate(`/flashcards/estudar?area=${encodeURIComponent(area)}`); }}
              />
              <Bloco
                titulo="Precisa de mais atenção"
                icone={<AlertTriangle className="h-3.5 w-3.5 text-[#f97316]" />}
                itens={atencao}
                tipo="atencao"
                onPick={(area) => { haptic.selection(); navigate(`/flashcards/estudar?area=${encodeURIComponent(area)}&modo=revisar`); }}
              />
            </>
          )}
        </div>
      </div>

      <FlashcardsBottomNav />
    </div>
  );
};

function Bloco({
  titulo,
  icone,
  itens,
  tipo,
  onPick,
}: {
  titulo: string;
  icone: React.ReactNode;
  itens: Item[];
  tipo: 'dominio' | 'atencao';
  onPick: (area: string) => void;
}) {
  if (!itens.length) return null;
  return (
    <section>
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {icone} {titulo}
      </p>
      <div className="space-y-2">
        {itens.map((a) => {
          const { icon: Icon, color } = getAreaVisual(a.area);
          const valor = tipo === 'dominio' ? a.dominio : a.atencao;
          const barra = tipo === 'dominio' ? 'hsl(var(--aprender-accent))' : '#f97316';
          return (
            <button
              key={a.area}
              onClick={() => onPick(a.area)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-emerald-500/40 active:scale-[0.995]"
            >
              <div className="aprender-icon-shine relative flex h-12 w-12 shrink-0 items-center justify-center">
                <Icon className="h-8 w-8 text-emerald-500" strokeWidth={1.9} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">{a.area}</p>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
                    style={{ color: barra, background: `${tipo === 'dominio' ? 'hsl(var(--aprender-accent)/0.18)' : 'rgba(249,115,22,0.18)'}` }}
                  >
                    {valor}%
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {tipo === 'dominio'
                    ? `${Number(a.compreendidos).toLocaleString('pt-BR')} compreendidos de ${a.estudados.toLocaleString('pt-BR')}`
                    : `${Number(a.a_revisar).toLocaleString('pt-BR')} marcados para revisar`}
                </p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all" style={{ width: `${valor}%`, background: barra }} />
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default FlashcardsProgresso;
