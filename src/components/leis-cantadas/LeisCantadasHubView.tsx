import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Heart, ChevronRight, Scale, Lock } from 'lucide-react';
import { LeiCantada } from '@/lib/leisCantadasApi';
import { LeisCantadasRankRow } from './LeisCantadasRankRow';
import { CAPA_PENAL, AREAS_EM_BREVE } from './leisCantadasUtils';

interface LeisCantadasHubViewProps {
  faixas: LeiCantada[];
  rankAba: 'ouvidas' | 'curtidas';
  setRankAba: (aba: 'ouvidas' | 'curtidas') => void;
  topOuvidas: LeiCantada[];
  topCurtidas: LeiCantada[];
  rankingCompletoLength: number;
  plays: (id: string) => number;
  likes: (id: string) => number;
  onSelectFaixa: (f: LeiCantada) => void;
  onVerTodos: () => void;
  onOpenLista: () => void;
}

export function LeisCantadasHubView({
  faixas,
  rankAba,
  setRankAba,
  topOuvidas,
  topCurtidas,
  rankingCompletoLength,
  plays,
  likes,
  onSelectFaixa,
  onVerTodos,
  onOpenLista,
}: LeisCantadasHubViewProps) {
  return (
    <div className="px-4 space-y-8 mt-2">
      {/* Rankings em destaque */}
      {faixas.length > 0 && (
        <section>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-8 w-8 grid place-items-center rounded-lg text-white ${
                  rankAba === 'ouvidas' ? 'bg-orange-500/90' : 'bg-rose-500/90'
                }`}
              >
                {rankAba === 'ouvidas' ? <Flame className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
              </span>
              <h2 className="text-lg font-bold">Top 3</h2>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-white/5 p-1 text-xs font-semibold">
              <button
                onClick={() => setRankAba('ouvidas')}
                className={`px-3 py-1.5 rounded-full transition ${
                  rankAba === 'ouvidas' ? 'bg-white/15 text-foreground' : 'text-muted-foreground'
                }`}
              >
                Mais ouvidas
              </button>
              <button
                onClick={() => setRankAba('curtidas')}
                className={`px-3 py-1.5 rounded-full transition ${
                  rankAba === 'curtidas' ? 'bg-white/15 text-foreground' : 'text-muted-foreground'
                }`}
              >
                Mais curtidas
              </button>
            </div>
          </div>
          <motion.div
            className="space-y-1.5"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
            }}
            initial="hidden"
            animate="show"
          >
            {(rankAba === 'ouvidas' ? topOuvidas : topCurtidas).map((f, i) => (
              <LeisCantadasRankRow
                key={f.id}
                f={f}
                pos={i + 1}
                valor={rankAba === 'ouvidas' ? plays(f.id) : likes(f.id)}
                unidade={rankAba === 'ouvidas' ? 'plays' : 'curtidas'}
                onClick={() => onSelectFaixa(f)}
              />
            ))}
          </motion.div>
          {rankingCompletoLength > 3 && (
            <button
              onClick={onVerTodos}
              className="mt-3 w-full flex items-center justify-center gap-1 rounded-xl bg-white/5 py-2.5 text-sm font-semibold text-foreground hover:bg-white/10 transition"
            >
              Ver todos
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </section>
      )}

      {/* Categorias estilo Spotify */}
      <section>
        <h2 className="text-lg font-bold mb-3">Categorias</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onOpenLista}
            className="group relative aspect-square rounded-2xl overflow-hidden text-left"
          >
            <img
              src={CAPA_PENAL}
              alt="Direito Penal"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 p-3 flex flex-col justify-between">
              <span className="self-start h-9 w-9 grid place-items-center rounded-lg bg-red-500 text-white shadow-lg">
                <Scale className="h-5 w-5" />
              </span>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="font-bold leading-tight">Direito Penal</p>
                  <p className="text-[11px] text-white/70">{faixas.length} faixa(s)</p>
                </div>
                <span className="shrink-0 h-8 w-8 grid place-items-center rounded-full bg-white/15 text-white group-hover:bg-white/25 transition">
                  <ChevronRight className="h-5 w-5" />
                </span>
              </div>
            </div>
          </button>
          {AREAS_EM_BREVE.map((a) => (
            <div
              key={a.nome}
              aria-disabled
              className="relative aspect-square rounded-2xl overflow-hidden bg-white/[0.04] cursor-not-allowed"
            >
              <img
                src={a.capa}
                alt={a.nome}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale-[0.2]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                <span className="self-start h-9 w-9 grid place-items-center rounded-lg bg-white/10 text-white/80">
                  <a.Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold leading-tight text-white/90">{a.nome}</p>
                  <p className="inline-flex items-center gap-1 text-[11px] text-white/70">
                    <Lock className="h-3 w-3" /> Em breve
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
