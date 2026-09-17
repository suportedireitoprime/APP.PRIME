import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, BookOpen, Scale, Award } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { iconeDoItem } from '@/lib/visuaisJuridicos/icones';
import type { CatalogoItem } from '@/lib/visuaisJuridicos/catalogo';
import type { VisualCategoria, VisualRecord } from '@/lib/visuaisJuridicos/types';
import { ITEM_CORES, type Filtro } from './visuaisConstants';
import { VisuaisBarraBusca } from './VisuaisBarraBusca';
import { VisuaisAbasFiltro, EstrelaFavorito } from './VisuaisAbasFiltro';
import HomeCard from '@/components/vademecum/home/HomeCard';

interface VisuaisPassoItensProps {
  categoria: VisualCategoria;
  onSelectCategoria: (c: VisualCategoria) => void;
  filtro: Filtro;
  setFiltro: (f: Filtro) => void;
  busca: string;
  setBusca: (b: string) => void;
  carregando: boolean;
  carregandoMaterias: boolean;
  lista: CatalogoItem[];
  limiteLista: number;
  setLimiteLista: React.Dispatch<React.SetStateAction<number>>;
  gerando: boolean;
  gerandoKey: string | null;
  prontos: Record<string, VisualRecord>;
  favoritos: string[];
  onEscolherItem: (item: CatalogoItem) => void;
  alternarFavorito: (key: string) => void;
}

const CATEGORIAS_PAINEL: Array<{
  id: VisualCategoria;
  label: string;
  icone: typeof BookOpen;
  cor: string;
}> = [
  { id: 'materias', label: 'Matérias', icone: BookOpen, cor: '#38bdf8' },
  { id: 'codigos', label: 'Códigos', icone: Scale, cor: '#ef4444' },
  { id: 'estatutos', label: 'Estatutos', icone: Award, cor: '#10b981' },
];

export function VisuaisPassoItens({
  categoria,
  onSelectCategoria,
  filtro,
  setFiltro,
  busca,
  setBusca,
  carregando,
  carregandoMaterias,
  lista,
  limiteLista,
  setLimiteLista,
  gerando,
  gerandoKey,
  prontos,
  favoritos,
  onEscolherItem,
  alternarFavorito,
}: VisuaisPassoItensProps) {
  return (
    <div className="space-y-4">
      {/* ── Topo Fixo: Seletor de Categoria + Filtros + Busca ── */}
      <div className="sticky top-0 z-10 -mx-1 space-y-3 bg-background/95 backdrop-blur-md px-1 pb-3 pt-0.5">
        {/* Seletor de Categoria Principal: Matérias | Códigos | Estatutos */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-white/5">
          {CATEGORIAS_PAINEL.map((cat) => {
            const ativa = categoria === cat.id;
            const Icone = cat.icone;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  haptic.selection();
                  onSelectCategoria(cat.id);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-display text-[13px] sm:text-[14px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  ativa
                    ? 'bg-zinc-800 text-white shadow-md border border-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
              >
                <Icone
                  className="w-4 h-4 shrink-0 transition-transform duration-200"
                  style={{ color: ativa ? cat.cor : undefined }}
                  strokeWidth={ativa ? 2.2 : 1.6}
                />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Abas de Filtro (Todos / Favoritos / Recentes) */}
        <VisuaisAbasFiltro valor={filtro} onChange={setFiltro} />

        {/* Barra de Busca */}
        <VisuaisBarraBusca
          valor={busca}
          onChange={setBusca}
          placeholder={`Buscar em ${
            categoria === 'materias'
              ? 'matérias (ex.: Penal, Civil...)'
              : categoria === 'codigos'
                ? 'códigos (ex.: Penal, Civil...)'
                : 'estatutos (ex.: OAB, ECA...)'
          }`}
        />
      </div>

      {(carregando || carregandoMaterias) && (
        <p className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          {carregandoMaterias ? 'Carregando matérias…' : 'Verificando conteúdos prontos…'}
        </p>
      )}

      {/* ── Grid de Cards no Padrão do Painel de Estudos ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
        {lista.slice(0, limiteLista).map((i, idx) => {
          const Icon = iconeDoItem(i.key, i.label, i.sub);
          const cor = ITEM_CORES[idx % ITEM_CORES.length];
          const favorito = favoritos.includes(i.key);
          const isPronto = Boolean(prontos[i.key]);

          return (
            <motion.div
              key={i.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.02, 0.2), duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              className="relative group"
            >
              <HomeCard
                icon={Icon}
                label={i.label}
                sublabel={i.sub || ''}
                color={cor}
                delay={0}
                badge={favorito ? '★' : isPronto ? 'PRONTO' : undefined}
                className="transition-all bg-[#252528] hover:bg-[#2F2F33] border-white/5 shadow-sm min-h-[96px] h-[96px]"
                iconClassName="w-7 h-7"
                iconStrokeWidth={1.5}
                onClick={() => {
                  onEscolherItem(i);
                }}
              />
              <div className="absolute top-2 right-2 z-20">
                <EstrelaFavorito ativo={favorito} onToggle={() => alternarFavorito(i.key)} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {!lista.length && !carregando && !carregandoMaterias && (
        <p className="py-12 text-center font-body text-sm text-muted-foreground">
          {filtro === 'favoritos'
            ? 'Nenhum favorito encontrado nesta categoria.'
            : filtro === 'recentes'
              ? 'Nenhum item aberto recentemente nesta categoria.'
              : 'Nenhum item encontrado.'}
        </p>
      )}

      {lista.length > limiteLista && (
        <div className="pt-2 pb-6">
          <button
            type="button"
            onClick={() => setLimiteLista((l) => l + 30)}
            className="w-full py-3.5 rounded-xl bg-secondary/50 font-display text-sm font-bold text-primary active:scale-95 transition-transform hover:bg-secondary/70"
          >
            Mostrar mais opções...
          </button>
        </div>
      )}
    </div>
  );
}
