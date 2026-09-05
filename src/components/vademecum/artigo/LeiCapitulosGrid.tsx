import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import ArtigoCard from '@/components/vademecum/artigo/ArtigoCard';
import type { ArtigoLei } from '@/data/mockData';

interface LeiCapitulosGridProps {
  capituloGroups: Array<{
    titulo: string;
    capitulos: Array<{
      capitulo: string;
      artigos: ArtigoLei[];
    }>;
  }>;
  expandedTitulo: string | null;
  setExpandedTitulo: (t: string | null) => void;
  setOpenArtigo: (artigo: ArtigoLei) => void;
  leiAccent: string;
  isArtigoFav: (a: { id: string; numero: string | number }) => boolean;
  grifadoNumeros: Set<string>;
  anotadoNumeros: Set<string>;
}

const splitRe = /^((?:PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+[IVXLCDM0-9º°]+(?:-[A-Z])?)\s*[–—\-:]?\s*(.+)$/i;
const _lowerWords = new Set(['a','à','às','ao','aos','o','os','as','e','ou','de','do','da','dos','das','em','no','na','nos','nas','por','para','com','sem','sob','sobre','entre','após','ante','até','contra','desde','perante','trás','um','uma','uns','umas']);

const toTitleCase = (s: string) => s.toLowerCase().split(/(\s+)/).map((w, i) => {
  if (/^\s+$/.test(w) || !w) return w;
  if (i !== 0 && _lowerWords.has(w)) return w;
  return w.charAt(0).toUpperCase() + w.slice(1);
}).join('');

const LeiCapitulosGrid: React.FC<LeiCapitulosGridProps> = ({
  capituloGroups,
  expandedTitulo,
  setExpandedTitulo,
  setOpenArtigo,
  leiAccent,
  isArtigoFav,
  grifadoNumeros,
  anotadoNumeros,
}) => {
  const stripRedacaoFn = (s: string) => s.replace(/\s*\((?:Redação|Incluído|Revogado|Acrescido|Alterado|Vide|Regulamento)[^)]*\)/gi, '').trim();

  // Se o único "título" é o sintético TÍTULO ÚNICO (lei que só tem capítulos),
  // renderiza os capítulos como cards de topo — sem o wrapper redundante.
  const flatCapitulos = capituloGroups.length === 1 && capituloGroups[0].titulo === 'TÍTULO ÚNICO';
  
  if (flatCapitulos) {
    const tGroup = capituloGroups[0];
    return (
      <div className="space-y-3 pb-8">
        {tGroup.capitulos.map((capGroup, ci) => {
          const capKey = `flat__${capGroup.capitulo}`;
          const isCapExpanded = expandedTitulo === capKey;
          const fA = capGroup.artigos[0]?.numero || '';
          const lA = capGroup.artigos[capGroup.artigos.length - 1]?.numero || '';
          const rawCap = capGroup.capitulo === '__sem_capitulo__' ? 'Disposições Gerais' : stripRedacaoFn(capGroup.capitulo);
          const cMatch = rawCap.match(splitRe);
          const capHead = cMatch ? cMatch[1].trim() : rawCap;
          const capSub = cMatch ? cMatch[2].trim() : '';

          return (
            <div key={ci}>
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.02 }}
                onClick={() => setExpandedTitulo(isCapExpanded ? null : capKey)}
                className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all flex overflow-hidden min-h-[104px] md:min-h-[112px]"
              >
                <div className="w-2 rounded-l-2xl shrink-0" style={{ background: leiAccent }} />
                <div className="p-4 md:p-5 flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300/90">{capHead}</p>
                  {capSub ? (
                    <h5 className="font-serif text-sm md:text-base font-semibold text-foreground leading-snug mt-0.5">{toTitleCase(capSub)}</h5>
                  ) : null}
                  <p className="text-muted-foreground text-xs md:text-sm mt-1">
                    {capGroup.artigos.length} artigos{fA && lA ? ` (${fA} – ${lA})` : ''}
                  </p>
                </div>
                <div className="flex items-center pr-4">
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isCapExpanded ? 'rotate-90' : ''}`} />
                </div>
              </motion.button>
              {isCapExpanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-3 mt-2 space-y-2">
                  {capGroup.artigos.map((artigo, i) => (
                    <ArtigoCard key={artigo.id} artigo={artigo} index={i} onClick={() => setOpenArtigo(artigo)} accentColor={leiAccent} tags={{ favorito: isArtigoFav(artigo), grifado: grifadoNumeros.has(artigo.numero), anotado: anotadoNumeros.has(artigo.numero) }} />
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8">
      {capituloGroups.map((tGroup, ti) => {
        const rawTitulo = stripRedacaoFn(tGroup.titulo);
        const tMatch = rawTitulo.match(splitRe);
        const titHead = tMatch ? tMatch[1].trim() : rawTitulo;
        let titSub = tMatch ? tMatch[2].trim() : '';
        // Remove duplicated head prefix (e.g. "TÍTULO I DISPOSIÇÕES PRELIMINARES" -> "DISPOSIÇÕES PRELIMINARES")
        if (titSub && titHead) {
          const dupRe = new RegExp(`^${titHead.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*[-–—:]?\\s*`, 'i');
          titSub = titSub.replace(dupRe, '').trim();
        }
        const totalArts = tGroup.capitulos.reduce((s, c) => s + c.artigos.length, 0);
        const allArts = tGroup.capitulos.flatMap(c => c.artigos);
        const firstArt = allArts[0]?.numero || '';
        const lastArt = allArts[allArts.length - 1]?.numero || '';
        const hasRealCapitulos = tGroup.capitulos.some(c => c.capitulo !== '__sem_capitulo__');
        const titKey = `titulo__${tGroup.titulo}`;
        const isTitExpanded = expandedTitulo === titKey || (expandedTitulo?.startsWith(`${tGroup.titulo}__`) ?? false);
        return (
          <div key={ti}>
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ti * 0.02 }}
              onClick={() => setExpandedTitulo(isTitExpanded ? null : titKey)}
              className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all flex overflow-hidden min-h-[112px] md:min-h-[124px]"
            >
              <div className="w-2 rounded-l-2xl shrink-0" style={{ background: leiAccent }} />
              <div className="p-4 md:p-5 flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.22em] text-amber-300/90">{titHead}</p>
                {titSub ? (
                  <h5 className="font-serif text-base md:text-lg font-semibold text-foreground leading-snug mt-1 line-clamp-2">
                    {toTitleCase(titSub)}
                  </h5>
                ) : (
                  <h5 className="font-serif text-base md:text-lg font-semibold text-foreground leading-snug mt-1 opacity-0 select-none" aria-hidden>
                    &nbsp;
                  </h5>
                )}
                <p className="text-muted-foreground text-xs md:text-sm mt-1.5">
                  {totalArts} artigos{firstArt && lastArt ? ` (${firstArt} – ${lastArt})` : ''}
                </p>
              </div>
              <div className="flex items-center pr-4">
                <ChevronRight
                  className={`w-6 h-6 md:w-7 md:h-7 transition-transform ${isTitExpanded ? 'rotate-90' : ''}`}
                  style={{ color: leiAccent }}
                  strokeWidth={2.5}
                />
              </div>
            </motion.button>
            {isTitExpanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-4 mt-2 space-y-2">
                {hasRealCapitulos ? (
                  tGroup.capitulos.map((capGroup, ci) => {
                    const capKey = `${tGroup.titulo}__${capGroup.capitulo}`;
                    const isCapExpanded = expandedTitulo === capKey;
                    const fA = capGroup.artigos[0]?.numero || '';
                    const lA = capGroup.artigos[capGroup.artigos.length - 1]?.numero || '';
                    const rawCap = capGroup.capitulo === '__sem_capitulo__'
                      ? 'Disposições Gerais'
                      : stripRedacaoFn(capGroup.capitulo);
                    const cMatch = rawCap.match(splitRe);
                    const capHead = cMatch ? cMatch[1].trim() : rawCap;
                    let capSub = cMatch ? cMatch[2].trim() : '';
                    if (capSub && capHead) {
                      const dupRe = new RegExp(`^${capHead.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\s*[-–—:]?\\s*`, 'i');
                      capSub = capSub.replace(dupRe, '').trim();
                    }
                    return (
                      <div key={ci}>
                        <button
                          onClick={() => setExpandedTitulo(isCapExpanded ? titKey : capKey)}
                          className="w-full text-left rounded-xl bg-card/70 hover:bg-secondary/60 transition-all flex overflow-hidden border border-border/40"
                        >
                          <div className="p-3 md:p-4 flex-1 min-w-0">
                            {capSub ? (
                              <>
                                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/80">{capHead}</p>
                                <h6 className="font-serif text-sm md:text-base font-semibold text-foreground leading-snug mt-0.5 line-clamp-2">
                                  {toTitleCase(capSub)}
                                </h6>
                              </>
                            ) : (
                              <h6 className="font-display text-sm md:text-base font-bold text-foreground leading-snug">{capHead}</h6>
                            )}
                            <p className="text-muted-foreground text-[11px] md:text-xs mt-1">{capGroup.artigos.length} artigos ({fA} – {lA})</p>
                          </div>
                          <div className="flex items-center pr-3">
                            <ChevronRight
                              className={`w-5 h-5 md:w-6 md:h-6 transition-transform ${isCapExpanded ? 'rotate-90' : ''}`}
                              style={{ color: leiAccent }}
                              strokeWidth={2.5}
                            />
                          </div>
                        </button>
                        {isCapExpanded && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pl-3 mt-2 space-y-2">
                            {capGroup.artigos.map((artigo, i) => (
                              <ArtigoCard key={artigo.id} artigo={artigo} index={i} onClick={() => setOpenArtigo(artigo)} accentColor={leiAccent} tags={{ favorito: isArtigoFav(artigo), grifado: grifadoNumeros.has(artigo.numero), anotado: anotadoNumeros.has(artigo.numero) }} />
                            ))}
                          </motion.div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  allArts.map((artigo, i) => (
                    <ArtigoCard key={artigo.id} artigo={artigo} index={i} onClick={() => setOpenArtigo(artigo)} accentColor={leiAccent} tags={{ favorito: isArtigoFav(artigo), grifado: grifadoNumeros.has(artigo.numero), anotado: anotadoNumeros.has(artigo.numero) }} />
                  ))
                )}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LeiCapitulosGrid;
