import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Lock, Flame, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDesafios, type DesafioStatus } from '@/hooks/useQuestoesExtras';
import { corTrilha } from '@/lib/desafiosCores';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


const Anel = ({ pct, cor }: { pct: number; cor: string }) => {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-white/15" />
      <circle
        cx="22" cy="22" r={r} fill="none" stroke={cor} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * Math.min(pct, 100)) / 100}
      />
    </svg>
  );
};

export const DesafioCard = ({
  d, compacto, onClick,
}: { d: DesafioStatus; compacto?: boolean; onClick?: () => void }) => {
  const concluido = d.status === 'concluido';
  const bloqueado = !d.desbloqueado;
  const cor = corTrilha(d.trilha);
  const fracHoje = Math.min(1, d.meta_diaria ? d.respondidas_hoje / d.meta_diaria : 0);
  const pctNivel = concluido
    ? 100
    : Math.min(100, Math.round(((d.dias_concluidos + fracHoje) / Math.max(1, d.dias)) * 100));

  if (compacto) {
    return (
      <button
        onClick={onClick}
        className="flex w-[132px] shrink-0 flex-col items-start gap-2 rounded-2xl border border-border bg-card/60 p-3 text-left"
      >
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: `${cor}22`, color: cor }}
        >
          {concluido ? <Check className="h-5 w-5" strokeWidth={2.6} /> : <Lock className="h-4 w-4" />}
        </span>
        <span className="text-[13px] font-bold text-foreground">{d.titulo}</span>
        <span className="text-[11px] text-muted-foreground">
          {concluido ? 'Concluído' : 'Bloqueado'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={bloqueado}
      className={cn(
        'relative flex w-[248px] shrink-0 flex-col gap-3 overflow-hidden rounded-2xl border p-4 text-left transition-all',
        bloqueado ? 'border-border bg-card/50 opacity-70' : 'border-border bg-card active:scale-[0.99]',
      )}
      style={!bloqueado ? { borderColor: `${cor}55`, boxShadow: `0 10px 30px -18px ${cor}` } : undefined}
    >
      <span
        className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full opacity-20 blur-2xl"
        style={{ background: cor }}
      />
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 items-center justify-center">
          <Anel pct={pctNivel} cor={cor} />
          <span className="absolute text-[10px] font-bold" style={{ color: cor }}>
            {pctNivel}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-foreground">{d.titulo}</p>
          <p className="truncate text-[12px] text-muted-foreground">{d.subtitulo}</p>
        </div>
        {bloqueado ? <Lock className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: d.dias }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: i < d.dias_concluidos ? cor : 'hsl(var(--muted))' }}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {concluido
          ? 'Desafio concluído 🎉'
          : bloqueado
            ? `Bloqueado · ${d.dias} dias`
            : `Dia ${Math.min(d.dias_concluidos + 1, d.dias)} de ${d.dias} · hoje ${d.respondidas_hoje}/${d.meta_diaria}`}
      </p>
    </button>
  );
};

const DesafiosStrip = () => {
  const navigate = useNavigate();
  const { desafios, trilhas, pendentes, concluidos, loading } = useDesafios();
  const [filtro, setFiltro] = useState<string>('todos');

  if (loading || desafios.length === 0) return null;

  const filtrar = <T extends DesafioStatus>(lista: T[]) =>
    filtro === 'todos' ? lista : lista.filter((d) => d.trilha === filtro);

  const trilhaSel = filtro !== 'todos' ? trilhas.find((t) => t.slug === filtro) : undefined;
  const pend = trilhaSel
    ? trilhaSel.desafios.filter((d) => d.status !== 'concluido')
    : filtrar(pendentes);
  const atual = pend[0];
  const proximos = pend.slice(1, trilhaSel ? pend.length : 5);
  const medalhas = filtrar(concluidos).slice(-3);
  const abrir = (d?: DesafioStatus) =>
    navigate(d ? `/questoes/desafios?trilha=${d.trilha}` : '/questoes/desafios?trilha=pendentes');

  const labelFiltro =
    filtro === 'todos' ? 'Todos' : trilhas.find((t) => t.slug === filtro)?.label ?? 'Todos';

  return (
    <div className="pt-6">
      <div className="flex items-center gap-2">
        <span className="h-6 w-1 rounded-full bg-primary" />
        <h2 className="flex-1 text-xl font-bold leading-tight text-foreground sm:text-2xl">Desafios diários</h2>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-foreground active:scale-[0.98]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: filtro === 'todos' ? 'hsl(var(--primary))' : corTrilha(filtro) }}
            />
            {labelFiltro}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 w-52 overflow-y-auto">
            <DropdownMenuItem onSelect={() => setFiltro('todos')} className="gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Todos
            </DropdownMenuItem>
            {trilhas.map((t) => (
              <DropdownMenuItem key={t.slug} onSelect={() => setFiltro(t.slug)} className="gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: corTrilha(t.slug) }} />
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="ml-3 mt-1 flex items-center gap-1 text-sm leading-5 text-muted-foreground">
        <Flame className="h-4 w-4 text-primary" /> Bata a meta diária e avance de nível.
      </p>

      <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {medalhas.map((d) => (
          <DesafioCard key={d.desafio_id} d={d} compacto onClick={() => abrir(d)} />
        ))}
        {atual && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <DesafioCard d={atual} onClick={() => abrir(atual)} />
          </motion.div>
        )}
        {proximos.map((d) => (
          <DesafioCard key={d.desafio_id} d={d} onClick={() => abrir(d)} />
        ))}
        {!atual && medalhas.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">Nenhum desafio nessa trilha.</p>
        )}
      </div>
    </div>
  );
};


export default DesafiosStrip;
