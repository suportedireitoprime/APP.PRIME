import React from 'react';
import { Scale, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  JurisCategoria,
  containerVariants,
  itemVariants,
  tribunalClasses,
} from './jurisprudenciaConstants';

interface JurisprudenciaCategoriaListProps {
  categoriasVisiveis: JurisCategoria[];
  tab: 'todos' | 'favoritos';
  onSelectCategoria: (cat: JurisCategoria) => void;
}

export const JurisprudenciaCategoriaList: React.FC<JurisprudenciaCategoriaListProps> = ({
  categoriasVisiveis,
  tab,
  onSelectCategoria,
}) => {
  if (categoriasVisiveis.length === 0) {
    return (
      <div className="text-center py-16">
        <Scale className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {tab === 'favoritos'
            ? 'Nenhum favorito ainda.'
            : 'Nenhuma jurisprudência encontrada para este artigo.'}
        </p>
      </div>
    );
  }

  const grupos = new Map<string, JurisCategoria[]>();
  categoriasVisiveis.forEach((c) => {
    const arr = grupos.get(c.tribunal) || [];
    arr.push(c);
    grupos.set(c.tribunal, arr);
  });
  const ordem = ['STF', 'STJ'];
  const chaves = Array.from(grupos.keys()).sort(
    (a, b) => (ordem.indexOf(a) + 999) % 999 - (ordem.indexOf(b) + 999) % 999
  );

  return (
    <div className="space-y-5">
      {chaves.map((trib) => {
        const items = grupos.get(trib)!;
        const totalTrib = items.reduce((acc, c) => acc + c.itens.length, 0);
        return (
          <section key={trib}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span
                className={`inline-flex items-center h-5 px-2 rounded-md border text-[10px] font-bold tracking-wider ${tribunalClasses(
                  trib
                )}`}
              >
                {trib}
              </span>
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-[11px] text-muted-foreground font-medium">
                {totalTrib} {totalTrib === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <motion.ul
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {items.map((cat) => {
                const preview = cat.itens
                  .map((i) => (i.titulo || '').trim())
                  .filter(Boolean)
                  .slice(0, 4)
                  .join(' · ');
                return (
                  <motion.li variants={itemVariants} key={cat.codigo}>
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onSelectCategoria(cat)}
                      className="w-full text-left rounded-2xl border border-border/60 bg-card hover:bg-card/80 hover:border-border transition-all p-3.5 flex items-center gap-3 focus-visible:outline-none"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-body text-[15px] font-semibold text-foreground leading-snug line-clamp-1">
                          {cat.label}
                        </div>
                        {preview && (
                          <div className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">
                            {preview}
                          </div>
                        )}
                      </div>
                      <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-1.5 rounded-full bg-hero-yellow text-[11px] font-bold text-black shrink-0">
                        {cat.itens.length}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </motion.button>
                  </motion.li>
                );
              })}
            </motion.ul>
          </section>
        );
      })}
    </div>
  );
};
