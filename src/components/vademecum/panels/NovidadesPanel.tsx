import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import type { ArtigoLei } from '@/data/mockData';
import type { ModificationInfo } from '@/components/vademecum/ArtigoBottomSheet';

type DbAlteracao = {
  artigo_numero: string;
  tipo_alteracao: string;
  texto_anterior: string | null;
  texto_atual: string | null;
  detectado_em: string;
};

type ModItem = {
  artigo: ArtigoLei;
  tipo: string;
  referencia: string;
  ano: number;
  parteModificada: string;
  leiNome: string;
  linhasModificadas: number[];
  fromMonitor?: boolean;
};

interface NovidadesPanelProps {
  artigos: ArtigoLei[];
  dbAlteracoes: DbAlteracao[];
  loadingDbAlteracoes: boolean;
  onOpenArtigo: (artigo: ArtigoLei, modInfo: ModificationInfo) => void;
}

const modRegex = /\((?:Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Vide|Promulgação|Renumerado|Transformado|Suprimido|Restabelecido|Ressalvado|Produção de efeito)[^)]*\)/gi;
const yearRegex = /\b(1\d{3}|20\d{2})\b/;
const typeRegex = /^\((Redação\s+dada|Incluíd[oa]|Acrescid[oa]|Revogad[oa]|Alterad[oa]|Vetad[oa]|Vigência|Regulamento|Vide|Promulgação|Renumerado|Transformado|Suprimido|Restabelecido|Ressalvado|Produção de efeito)/i;

function badgeColor(tipo: string) {
  const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (t.startsWith('revogad')) return 'bg-destructive/20 text-destructive';
  if (t.startsWith('vetad')) return 'bg-destructive/20 text-destructive';
  if (t.startsWith('suprimid')) return 'bg-destructive/20 text-destructive';
  if (t.startsWith('incluid')) return 'bg-emerald-500/20 text-emerald-400';
  if (t.startsWith('acrescid')) return 'bg-emerald-500/20 text-emerald-400';
  if (t.startsWith('redacao') || t.startsWith('alterad')) return 'bg-amber-500/20 text-amber-400';
  if (t.startsWith('renumerad')) return 'bg-sky-500/20 text-sky-400';
  if (t.startsWith('vigencia') || t.startsWith('producao')) return 'bg-violet-500/20 text-violet-400';
  return 'bg-muted text-muted-foreground';
}

const NovidadesPanel: React.FC<NovidadesPanelProps> = ({ artigos, dbAlteracoes, loadingDbAlteracoes, onOpenArtigo }) => {
  const { items, grouped } = useMemo(() => {
    const result: ModItem[] = [];

    for (const artigo of artigos) {
      const lines = artigo.caput.split('\n').filter(l => l.trim());
      const refGroups = new Map<string, { indices: number[]; tipo: string; ref: string; ano: number }>();
      for (let li = 0; li < lines.length; li++) {
        const lineMatches = lines[li].match(modRegex);
        if (!lineMatches) continue;
        const ref = lineMatches[lineMatches.length - 1];
        const refKey = ref.replace(/^\(/, '').replace(/\)$/, '');
        const tm = ref.match(typeRegex);
        const ym = ref.match(yearRegex);
        let tipo = tm ? tm[1].replace(/\s+dada/i, '') : 'Alteração';
        if (/^redaç/i.test(tipo)) tipo = 'Alterada';
        const ano = ym ? parseInt(ym[1]) : 0;
        if (!refGroups.has(refKey)) {
          refGroups.set(refKey, { indices: [], tipo, ref: refKey, ano });
        }
        refGroups.get(refKey)!.indices.push(li);
      }
      if (refGroups.size === 0) continue;
      for (const [, group] of refGroups) {
        let parteModificada = 'Artigo inteiro';
        if (group.indices.length < lines.length) {
          const firstModLine = lines[group.indices[0]];
          if (/^§\s*\d+[º°]?/i.test(firstModLine)) {
            const pMatch = firstModLine.match(/^(§\s*\d+[º°]?)/i);
            parteModificada = pMatch ? pMatch[1].replace(/°/g, 'º') : '§';
          } else if (/^[IVXLC]+\s*[-–.]/i.test(firstModLine)) {
            const iMatch = firstModLine.match(/^([IVXLC]+)/i);
            parteModificada = iMatch ? `Inciso ${iMatch[1]}` : 'Inciso';
          } else if (/^[a-z]\)/i.test(firstModLine)) {
            const aMatch = firstModLine.match(/^([a-z]\))/i);
            parteModificada = aMatch ? `Alínea ${aMatch[1]}` : 'Alínea';
          } else if (/^Parágrafo\s+único/i.test(firstModLine)) {
            parteModificada = 'Parágrafo único';
          } else if (/caput/i.test(group.ref)) {
            parteModificada = 'Caput';
          }
          if (group.indices.length > 1) {
            parteModificada += ` (+${group.indices.length - 1})`;
          }
        }
        const leiMatch = group.ref.match(/(?:Lei(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional|Medida\s+Provisória)\s+n[º°]?\s*[\d.]+(?:,\s*de\s*\d{4})?/i);
        const leiNome = leiMatch ? leiMatch[0] : group.ref;
        result.push({ artigo, tipo: group.tipo, referencia: group.ref, ano: group.ano, parteModificada, leiNome, linhasModificadas: group.indices });
      }
    }
    result.sort((a, b) => b.ano - a.ano);

    // Merge DB alteracoes (from monitoramento)
    const parsedKeys = new Set(result.map(i => `${i.artigo.numero}::${i.ano}`));
    for (const dbItem of dbAlteracoes) {
      const d = dbItem.detectado_em ? new Date(dbItem.detectado_em) : new Date();
      const ano = d.getFullYear() || 0;
      const key = `${dbItem.artigo_numero}::${ano}`;
      if (parsedKeys.has(key)) continue;

      const matchingArtigo = artigos.find(a => a.numero === dbItem.artigo_numero);
      const tipoLabel = dbItem.tipo_alteracao === 'artigo_revogado' ? 'Revogado'
        : dbItem.tipo_alteracao === 'artigo_novo' ? 'Incluído'
        : dbItem.tipo_alteracao === 'texto_alterado' ? 'Alterada'
        : 'Alteração';

      const options = { day: 'numeric', month: 'long', year: 'numeric' } as const;
      const dataFormatada = d.toLocaleDateString('pt-BR', options);

      result.push({
        artigo: matchingArtigo || { id: dbItem.artigo_numero, numero: dbItem.artigo_numero, caput: dbItem.texto_atual || dbItem.texto_anterior || '' },
        tipo: tipoLabel,
        referencia: `Em ${dataFormatada} (Monitoramento)`,
        ano,
        parteModificada: 'Artigo inteiro',
        leiNome: 'Atualização Oficial do Planalto',
        linhasModificadas: [],
        fromMonitor: true,
      });
    }
    result.sort((a, b) => b.ano - a.ano);

    const grp = new Map<number, ModItem[]>();
    for (const item of result) {
      const k = item.ano || 0;
      if (!grp.has(k)) grp.set(k, []);
      grp.get(k)!.push(item);
    }

    return { items: result, grouped: grp };
  }, [artigos, dbAlteracoes]);

  if (items.length === 0) {
    return loadingDbAlteracoes ? (
      <div className="flex flex-col items-center py-12 gap-2">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando alterações do monitoramento...</p>
      </div>
    ) : (
      <div className="flex flex-col items-center py-12 gap-2">
        <Sparkles className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Nenhuma alteração legislativa encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {[...grouped.entries()].map(([ano, group]) => (
        <div key={ano}>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">{ano > 0 ? ano : 'Sem data'}</h3>
            <span className="text-xs text-muted-foreground">({group.length} {group.length === 1 ? 'alteração' : 'alterações'})</span>
          </div>
          <div className="space-y-2">
            {group.map((item, i) => {
              const displayNumero = item.artigo.numero;
              const previewText = item.artigo.caput
                .replace(/\s*\((?:Redação|Incluído|Revogado|Acrescido|Alterado|Vetado|Vide|Regulamento|Vigência|Promulgação|Renumerado|Transformado|Suprimido|Restabelecido|Ressalvado|Produção de efeito)[^)]*\)/gi, '')
                .split('\n').filter(l => l.trim())[0] || '';
              return (
                <motion.button
                  key={`${item.artigo.id}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => {
                    onOpenArtigo(item.artigo, {
                      tipo: item.tipo,
                      referencia: item.referencia,
                      leiNome: item.leiNome,
                      parteModificada: item.parteModificada,
                      linhasModificadas: item.linhasModificadas,
                    });
                  }}
                  className="w-full text-left rounded-2xl bg-card hover:bg-secondary/60 transition-all group flex overflow-hidden min-h-[82px]"
                >
                  <div className="w-1.5 bg-primary rounded-l-2xl shrink-0" />
                  <div className="flex-1 min-w-0 p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display text-[15px] font-bold text-primary-light">{displayNumero}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor(item.tipo)}`}>
                        {item.tipo}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400">
                        {item.parteModificada}
                      </span>
                      {item.fromMonitor && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" /></span>
                          Monitoramento
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1 italic">{item.referencia}</p>
                    {previewText && (
                      <p className="text-[13px] leading-relaxed line-clamp-2 text-foreground/80">{previewText}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-4 mr-3 transition-colors" />
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(NovidadesPanel);
