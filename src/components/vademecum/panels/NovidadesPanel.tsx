import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import type { ArtigoLei } from '@/data/mockData';
import type { ModificationInfo } from '@/components/vademecum/artigo/ArtigoBottomSheet';
import { getScrapedAlteracoes, extractMesAno, parseDispositivoAlteracao, type ScrapedArticleUpdate } from '@/data/leiAlteracoesScraped';

export type DbAlteracao = {
  artigo_numero: string;
  tipo_alteracao: string;
  texto_anterior: string | null;
  texto_atual: string | null;
  detectado_em: string;
};

type ModItem = {
  artigo: ArtigoLei;
  artigoDisplay: string;
  tipo: string;
  referencia: string;
  ano: number;
  mes?: string;
  mesAno: string;
  parteModificada: string;
  leiNome: string;
  linhasModificadas: number[];
  fromMonitor?: boolean;
  linkLei?: string;
  textoAntigo?: string;
  textoNovo?: string;
  acaoDescritiva?: string;
  corpoTexto?: string;
  rotuloDispositivo?: string;
};

interface NovidadesPanelProps {
  artigos: ArtigoLei[];
  dbAlteracoes: DbAlteracao[];
  loadingDbAlteracoes: boolean;
  tabelaNome?: string | null;
  leiId?: string | null;
  onOpenArtigo: (artigo: ArtigoLei, modInfo: ModificationInfo) => void;
  onOpenComparativo?: (item: any) => void;
}

function badgeColor(tipo: string) {
  const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (t.startsWith('revogad') || t.startsWith('vetad') || t.startsWith('suprimid')) {
    return 'bg-rose-500/15 text-rose-400 border border-rose-500/25';
  }
  if (t.startsWith('incluid') || t.startsWith('acrescid')) {
    return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25';
  }
  if (t.startsWith('redacao') || t.startsWith('alterad')) {
    return 'bg-amber-500/15 text-amber-400 border border-amber-500/25';
  }
  if (t.startsWith('renumerad')) {
    return 'bg-sky-500/15 text-sky-400 border border-sky-500/25';
  }
  if (t.startsWith('vigencia') || t.startsWith('producao')) {
    return 'bg-purple-500/15 text-purple-400 border border-purple-500/25';
  }
  return 'bg-white/[0.06] text-zinc-300 border border-white/[0.08]';
}

function cleanArtigoNumber(val: string): string {
  return (val || '').replace(/[^0-9]/g, '').trim();
}

function formatArtigoDisplay(val: string): string {
  const trimmed = (val || '').trim();
  if (/^art/i.test(trimmed)) return trimmed;
  return `Art. ${trimmed}`;
}

function extractTipoFromMotivo(motivo: string, hasTextoAntigo: boolean): string {
  const m = motivo.toLowerCase();
  if (m.includes('revogad')) return 'Revogado';
  if (m.includes('incluíd') || m.includes('incluid') || m.includes('acrescid')) return 'Incluído';
  if (m.includes('redação dada') || m.includes('redacao') || m.includes('alterad')) return 'Alterado';
  if (m.includes('vigência') || m.includes('vigencia')) return 'Vigência';
  return hasTextoAntigo ? 'Alterado' : 'Incluído';
}

function extractLeiNomeFromMotivo(motivo: string): string {
  const match = motivo.match(
    /(?:Lei(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional|Medida\s+Provisória)\s+n[º°]?\s*[\d.]+(?:,\s*de\s*\d{4})?/i
  );
  if (match) return match[0];
  const parenMatch = motivo.match(/\(([^)]+)\)/);
  if (parenMatch) return parenMatch[1];
  return motivo || 'Legislação Oficial';
}

const NovidadesPanel: React.FC<NovidadesPanelProps> = ({
  artigos,
  dbAlteracoes,
  loadingDbAlteracoes,
  tabelaNome,
  leiId,
  onOpenArtigo,
  onOpenComparativo,
}) => {
  const { items, grouped } = useMemo(() => {
    const scrapedList = getScrapedAlteracoes(tabelaNome || null, leiId || null);

    const artigoByNumber = new Map<string, ArtigoLei>();
    for (const a of artigos) {
      const clean = cleanArtigoNumber(a.numero);
      if (clean && !artigoByNumber.has(clean)) {
        artigoByNumber.set(clean, a);
      }
    }

    const result: ModItem[] = [];
    const seenKeys = new Set<string>();

    for (const scraped of scrapedList) {
      const numClean = cleanArtigoNumber(scraped.artigo);
      const key = `${numClean || scraped.artigo}-${scraped.ano}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const matchedArtigo = numClean ? artigoByNumber.get(numClean) : undefined;
      const artigoObj: ArtigoLei = matchedArtigo || {
        id: `scraped-${scraped.artigo}`,
        numero: scraped.artigo.replace(/^art\.?\s*/i, '').trim(),
        caput: scraped.texto_novo || scraped.motivo,
      };

      const dispInfo = parseDispositivoAlteracao(scraped);
      const { mes, mesAno } = extractMesAno(scraped.motivo, scraped.ano, scraped.data_completa);

      result.push({
        artigo: artigoObj,
        artigoDisplay: dispInfo.artigoDisplayCompleto,
        tipo: dispInfo.acaoTexto || tipo,
        referencia: scraped.motivo,
        ano: scraped.ano || 2026,
        mes: scraped.mes || mes,
        mesAno: scraped.mes_ano || mesAno,
        parteModificada: dispInfo.rotuloDispositivo || 'Dispositivo',
        leiNome: dispInfo.leiReferencia || leiNome,
        linhasModificadas: [],
        linkLei: scraped.link_lei,
        textoAntigo: scraped.texto_antigo,
        textoNovo: scraped.texto_novo,
        acaoDescritiva: dispInfo.acaoDescritiva,
        corpoTexto: dispInfo.corpoTexto,
        rotuloDispositivo: dispInfo.rotuloDispositivo,
      });
    }

    // Mescla alterações do Supabase
    for (const dbItem of dbAlteracoes) {
      const numClean = cleanArtigoNumber(dbItem.artigo_numero);
      const ano = dbItem.detectado_em ? new Date(dbItem.detectado_em).getFullYear() : 2026;
      const key = `${numClean || dbItem.artigo_numero}-${ano}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      const matchedArtigo = numClean ? artigoByNumber.get(numClean) : undefined;
      const artigoObj: ArtigoLei = matchedArtigo || {
        id: `db-${dbItem.artigo_numero}`,
        numero: dbItem.artigo_numero.replace(/^art\.?\s*/i, '').trim(),
        caput: dbItem.texto_atual || dbItem.texto_anterior || '',
      };

      const tipo = dbItem.tipo_alteracao === 'artigo_revogado' ? 'Revogado'
        : dbItem.tipo_alteracao === 'artigo_novo' ? 'Incluído'
        : dbItem.tipo_alteracao === 'texto_alterado' ? 'Alterado'
        : 'Alteração';

      const dispInfo = parseDispositivoAlteracao({
        artigo_numero: dbItem.artigo_numero,
        texto_atual: dbItem.texto_atual,
        texto_anterior: dbItem.texto_anterior,
        tipo_alteracao: dbItem.tipo_alteracao,
        ano,
      });

      const d = dbItem.detectado_em ? new Date(dbItem.detectado_em) : new Date();
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mesName = meses[d.getMonth()] || 'Jan';
      const mesAno = `${mesName}/${ano}`;

      result.push({
        artigo: artigoObj,
        artigoDisplay: dispInfo.artigoDisplayCompleto,
        tipo: dispInfo.acaoTexto || tipo,
        referencia: 'Atualização oficial registrada na varredura',
        ano,
        mes: mesName,
        mesAno,
        parteModificada: dispInfo.rotuloDispositivo || 'Dispositivo',
        leiNome: dispInfo.leiReferencia || 'Atualização Planalto',
        linhasModificadas: [],
        fromMonitor: true,
        textoAntigo: dbItem.texto_anterior || undefined,
        textoNovo: dbItem.texto_atual || undefined,
        acaoDescritiva: dispInfo.acaoDescritiva,
        corpoTexto: dispInfo.corpoTexto,
        rotuloDispositivo: dispInfo.rotuloDispositivo,
      });
    }

    result.sort((a, b) => (b.ano || 0) - (a.ano || 0));

    const grp = new Map<number, ModItem[]>();
    for (const item of result) {
      const k = item.ano || 0;
      if (!grp.has(k)) grp.set(k, []);
      grp.get(k)!.push(item);
    }

    return { items: result, grouped: grp };
  }, [artigos, dbAlteracoes, tabelaNome, leiId]);

  if (items.length === 0) {
    return loadingDbAlteracoes ? (
      <div className="flex flex-col items-center py-12 gap-2">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando alterações do Planalto...</p>
      </div>
    ) : (
      <div className="flex flex-col items-center py-12 gap-2">
        <Sparkles className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Nenhuma alteração identificada nesta lei.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {[...grouped.entries()].map(([ano, group]) => (
        <div key={ano}>
          {/* Cabeçalho do Ano com tipografia nítida e espaçamento amplo (tracking-widest) */}
          <div className="flex items-center gap-2.5 mb-3.5 pt-1">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <h3 className="font-sans text-sm sm:text-base font-black uppercase tracking-widest text-zinc-100">
              {ano > 0 ? `ANO ${ano}` : 'SEM DATA'}
            </h3>
            <span className="text-xs text-zinc-400 font-medium">
              ({group.length} {group.length === 1 ? 'alteração' : 'alterações'})
            </span>
          </div>

          <div className="space-y-2.5">
            {group.map((item, i) => {
              const displayNumero = item.artigoDisplay || formatArtigoDisplay(item.artigo.numero);
              const previewText = (item.textoNovo || item.artigo.caput || item.referencia)
                .replace(/\([^)]*\)/g, '')
                .replace(/^Art\.\s*[\w-]+[º°]?\s*[-–.:]?\s*/i, '')
                .trim();

              return (
                <motion.div
                  key={`${item.artigo.id}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => {
                    if (onOpenComparativo) {
                      onOpenComparativo({
                        artigo: item.artigo,
                        artigoDisplay: displayNumero,
                        tipo: item.tipo,
                        referencia: item.referencia,
                        ano: item.ano,
                        mesAno: item.mesAno,
                        leiNome: item.leiNome,
                        textoAntigo: item.textoAntigo,
                        textoNovo: item.textoNovo,
                        linkLei: item.linkLei,
                      });
                    } else {
                      onOpenArtigo(item.artigo, {
                        tipo: item.tipo,
                        referencia: item.referencia,
                        ano: item.ano,
                        leiNome: item.leiNome,
                        parteModificada: item.parteModificada,
                        linhasModificadas: item.linhasModificadas,
                      });
                    }
                  }}
                  className="w-full text-left rounded-2xl bg-[#121316] hover:bg-[#17181e] border border-white/[0.04] hover:border-white/[0.08] transition-all group flex overflow-hidden min-h-[82px] cursor-pointer shadow-md shadow-black/40"
                >
                  <div className="w-1.5 bg-primary shrink-0" />
                  <div className="flex-1 min-w-0 p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-display text-[15px] font-bold text-white group-hover:text-primary transition-colors">
                        {displayNumero}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor(item.tipo)}`}>
                        {item.tipo}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] tracking-widest">
                        {item.mesAno}
                      </span>
                      {item.linkLei && (
                        <a
                          href={item.linkLei}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 underline ml-auto"
                        >
                          <span>{item.leiNome}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 mb-1 leading-relaxed">
                      {item.referencia}
                    </p>

                    {item.acaoDescritiva ? (
                      <p className="text-[12px] leading-relaxed line-clamp-3 text-zinc-300/90 font-serif">
                        <strong className="font-sans font-semibold text-white/95">{item.acaoDescritiva}: </strong>
                        <span>{item.corpoTexto}</span>
                      </p>
                    ) : previewText ? (
                      <p className="text-[12px] leading-relaxed line-clamp-3 text-zinc-300/90 font-serif">
                        {previewText}
                      </p>
                    ) : null}
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-primary shrink-0 my-auto mr-3 transition-colors" />
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(NovidadesPanel);
