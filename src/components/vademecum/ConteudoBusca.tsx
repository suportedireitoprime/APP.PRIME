import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBuscaConteudo, prefetchBusca, type ConteudoGrupo } from '@/hooks/useBuscaConteudo';
import { resolveRotaResultado } from '@/lib/buscaRotas';
import type { CategoriaKey } from './CategoriaFiltroBar';
import ResultadoConteudoCard from './ResultadoConteudoCard';
import BuscaChecklist from './BuscaChecklist';
import SugestoesAprendidas from './SugestoesAprendidas';
import { useSugestoesBusca, registrarBuscaClick } from '@/hooks/useSugestoesBusca';

const SUGESTOES_CONTEUDO = ['princípios', 'dolo', 'boa-fé', 'devido processo legal', 'contrato', 'posse', 'habeas corpus'];
const SUGESTOES_JURIS = ['dano moral', 'prescrição', 'usucapião', 'alimentos', 'improbidade', 'tráfico', 'execução fiscal'];

export default function ConteudoBusca({
  query, onNavigate, grupo = 'conteudo', categoria = 'tudo', buscaIA = false
}: { query: string; onNavigate?: () => void; grupo?: ConteudoGrupo, categoria?: CategoriaKey, buscaIA?: boolean }) {
  const { resultados: brutos, loading } = useBuscaConteudo(query, grupo, buscaIA);

  // Pré-aquece as sugestões em background sem impactar a UI
  useEffect(() => {
    const lista = grupo === 'jurisprudencia' ? SUGESTOES_JURIS : SUGESTOES_CONTEUDO;
    for (const sug of lista) {
      prefetchBusca(sug, grupo);
    }
  }, [grupo]);

  // Remove resultados sem tela correspondente no app (ex.: artigo de lei
  // que não está no catálogo) e já traduz a rota final.
  const resultados = useMemo(
    () => brutos
      .map((r) => ({ ...r, route: resolveRotaResultado(r) || '' }))
      .filter((r) => !!r.route),
    [brutos],
  );

  const SUGESTOES = grupo === 'jurisprudencia' ? SUGESTOES_JURIS : SUGESTOES_CONTEUDO;
  const { sugestoes } = useSugestoesBusca(query, query.trim().length >= 2);
  const navigate = useNavigate();

  const filtrados = useMemo(
    () => categoria === 'tudo' ? resultados : resultados.filter((r) => r.entity_type === categoria),
    [resultados, categoria],
  );

  const termoCurto = query.trim().length < 2;

  const irPara = (route: string) => {
    onNavigate?.();
    navigate(route);
  };

  // Virtualização: só renderiza ~15 itens visíveis, destruindo o resto do DOM
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtrados.length,
    getScrollElement: () => parentRef.current?.closest('[class*="overflow-y-auto"]') as HTMLElement | null,
    estimateSize: () => 88,
    overscan: 20,
  });

  return (
    <div className="space-y-3 pt-2">
      {!termoCurto && sugestoes.length > 0 && (
        <SugestoesAprendidas
          sugestoes={sugestoes}
          onClick={(s) => {
            if (!s.top_route) return;
            registrarBuscaClick(query, {
              entity_type: s.top_entity_type || 'sugestao',
              entity_id: s.top_route,
              title: s.top_title,
              subtitle: s.top_subtitle,
              thumb_url: s.top_thumb_url,
              route: s.top_route,
            });
            irPara(s.top_route);
          }}
        />
      )}

      {!termoCurto && (
        <BuscaChecklist query={query} loading={loading} resultCount={filtrados.length} />
      )}

      {termoCurto && (
        <div className="px-4 py-8 space-y-4">
          <div className="text-center space-y-2">

            <p className="text-sm text-muted-foreground">
              {grupo === 'jurisprudencia'
                ? 'Pesquise qualquer termo. Trazemos súmulas do STF e do STJ, jurisprudência em teses, informativos e pesquisas prontas.'
                : 'Pesquise qualquer termo. Trazemos artigos de lei, dicionário jurídico, videoaulas, livros, blog, resumos, notícias e filmes que citam o assunto.'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground py-2 px-1 font-semibold">
              Sugestões
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    const ev = new CustomEvent('search:sugestao', { detail: s });
                    window.dispatchEvent(ev);
                  }}
                  className="px-3 py-1.5 rounded-full bg-muted text-sm text-foreground hover:bg-primary/10"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!termoCurto && !loading && filtrados.length === 0 && (
        <p className="text-center text-muted-foreground text-base py-10 px-4">
          Nada encontrado para "{query}". Tente outro termo.
        </p>
      )}

      {!termoCurto && filtrados.length > 0 && (
        <div ref={parentRef} className="px-2" style={{ position: 'relative', height: rowVirtualizer.getTotalSize(), width: '100%' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = filtrados[virtualRow.index];
            return (
              <div
                key={`${item.entity_type}-${item.entity_id}-${virtualRow.index}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <ResultadoConteudoCard
                  item={item}
                  termo={query}
                  index={virtualRow.index}
                  onClick={() => {
                    registrarBuscaClick(query, {
                      entity_type: item.entity_type,
                      entity_id: item.entity_id,
                      entity_table: item.entity_table,
                      title: item.title,
                      subtitle: item.subtitle,
                      thumb_url: item.thumb_url,
                      route: item.route,
                    });
                    irPara(item.route);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
