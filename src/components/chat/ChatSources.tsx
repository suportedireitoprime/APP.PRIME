import { ExternalLink, ArrowUpRight, BookOpen, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { leiToSlug, tipoToSlug } from '@/lib/legislacaoSlugs';
import { abrirLink } from '@/lib/nativo';

export interface ChatSource {
  n: number;
  title: string;
  url: string;
  domain?: string;
  /** When true, url is an internal app route (e.g. /legislacao/...). */
  internal?: boolean;
}

/** Numbered [n] chip. Tap opens a floating card describing the source. */
export function CitationChip({ n, source }: { n: number; source?: ChatSource }) {
  const navigate = useNavigate();
  const chipClass =
    'inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 mx-0.5 -translate-y-0.5 rounded-md bg-accent/25 border border-accent/50 text-[10px] font-bold text-accent hover:bg-accent hover:text-accent-foreground transition-colors align-middle no-underline cursor-pointer select-none';
  // Hide from copy: replaced by an invisible marker (see stripCitations)
  const dataAttrs = { 'data-citation': String(n) } as const;
  const openTarget = () => {
    if (!source) return;
    if (source.internal && source.url.startsWith('/')) navigate(source.url);
    else void abrirLink(source.url);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={chipClass} aria-label={`Fonte ${n}`} {...dataAttrs}>
          {n}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-72 p-0 overflow-hidden rounded-2xl border border-accent/40 bg-card shadow-2xl"
      >
        {source ? (
          <div className="flex flex-col">
            <div className="flex items-start gap-2.5 p-3 border-b border-border/60">
              <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-accent/25 border border-accent/50 text-[12px] font-bold text-accent flex items-center justify-center">
                {n}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-tight break-words">
                  {source.title || source.domain || domainOf(source.url)}
                </p>
                <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  {source.internal ? <BookOpen className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                  {source.domain || domainOf(source.url)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openTarget}
              className="flex items-center justify-between gap-2 px-3 py-2.5 text-[12px] font-semibold text-accent hover:bg-accent/10 transition-colors"
            >
              <span>{source.internal ? 'Abrir no Vade Mecum' : 'Abrir fonte'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="p-3 text-[12px] text-muted-foreground">Fonte indisponível.</div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Remove [n] chip markers from a rendered chat message so copy/share gets clean text. */
export function stripCitations(text: string): string {
  return text
    .replace(/\s*\[(?:\d+(?:\s*,\s*\d+)*)\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function domainOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

export function SourcesFooter({ sources }: { sources: ChatSource[] }) {
  if (!sources?.length) return null;
  // Exibe apenas as fontes reais pesquisadas na internet (como nas builds anteriores)
  const webSources = sources.filter((s) => s.url && (s.url.startsWith('http://') || s.url.startsWith('https://') || !s.internal));
  if (!webSources.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5 font-sans">
        <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
        Fontes citadas
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {webSources.map((s) => (
          <a
            id={`src-${s.n}`}
            key={s.n}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2 p-2 rounded-xl bg-secondary/60 border border-border hover:border-accent/60 hover:bg-accent/5 transition-colors text-left"
          >
            <span className="shrink-0 min-w-[22px] h-[22px] rounded-md bg-accent/20 border border-accent/40 text-[11px] font-bold text-accent flex items-center justify-center font-mono">
              {s.n}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[12px] font-semibold text-foreground truncate leading-tight group-hover:text-accent">
                {s.title || s.domain || domainOf(s.url)}
              </span>
              <span className="block text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                <ExternalLink className="w-2.5 h-2.5" />
                {s.domain || domainOf(s.url)}
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Transforms plain text with [1], [2], [1,2] into markdown that can be rendered
 * with a custom `a` handler. Returns the transformed text so ReactMarkdown can
 * process it.
 */
export function injectCitationLinks(text: string, maxN: number): string {
  if (!maxN) return text;
  return text.replace(/\[(\d+(?:\s*,\s*\d+)*)\]/g, (_m, group: string) => {
    const nums = group.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => n >= 1 && n <= maxN);
    if (!nums.length) return _m;
    return nums.map((n) => `[[${n}]](cite://${n})`).join('');
  });
}

// ─── Statute article extraction ───────────────────────────────────────

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Sort by length desc so longer keys match first (e.g. "Código Penal" before "CP")
const LAW_ENTRIES: Array<{ key: string; lei: LeiCatalogItem }> = LEIS_CATALOG
  .flatMap((lei) => {
    const list = [
      { key: lei.sigla, lei },
      { key: lei.nome, lei },
    ];
    if (lei.sigla === 'CF/88') {
      list.push({ key: 'Constituição Federal de 1988', lei });
      list.push({ key: 'CF', lei });
      list.push({ key: 'Constituição', lei });
      list.push({ key: 'CRFB', lei });
    }
    if (lei.sigla === 'CP') {
      list.push({ key: 'Código Penal Brasileiro', lei });
    }
    return list;
  })
  .filter((e) => e.key && e.key.length >= 2)
  .sort((a, b) => b.key.length - a.key.length);

const LAW_ALT = LAW_ENTRIES.map((e) => escapeReg(e.key)).join('|');

// Matches: art(igo)? NUM (extras)? (do/da)? LAW
const STATUTE_RE = new RegExp(
  `\\b(arts?\\.?|artigos?)\\s*(\\d+(?:-[A-Z])?)[ºª°]?` +
    `((?:[\\s,]+(?:§+\\s*\\d+[ºª°]?|inc(?:\\.|iso)?\\s*[IVXLCDM]+|[IVXLCDM]+|alínea\\s*[a-z]|\\d+(?:-[A-Z])?|[e,|]))*)` +
    `[\\s,]*(?:d[oa]s?\\s+)?(${LAW_ALT})\\b`,
  'gi',
);

/**
 * Scans the assistant answer for statute-article references (e.g. "art. 157 do CP",
 * "Art. 5º da Constituição Federal") and returns:
 *  - `text` with `[n]` markers appended after each recognized reference
 *  - `sources` for each unique (lei, artigo) pair, linking to the Vade Mecum
 *
 * `startN` is the first citation number to use (usually `lastWebSource.n + 1`).
 */
export function extractStatuteSources(
  text: string,
  startN: number,
): { text: string; sources: ChatSource[] } {
  if (!text) return { text, sources: [] };
  const sources: ChatSource[] = [];
  const seen = new Map<string, number>(); // `${leiId}|${artigo}` -> n
  let n = Math.max(1, startN);

  const replaced = text.replace(STATUTE_RE, (match, _artWord, artNum, extras, lawText, offset, fullStr) => {
    const entry = LAW_ENTRIES.find((e) => e.key.toLowerCase() === String(lawText).toLowerCase());
    if (!entry) return match;
    const cleanExtras = typeof extras === 'string' ? extras.replace(/^[,\s]+/, '').trim() : '';
    const key = `${entry.lei.id}|${artNum}`;
    let num = seen.get(key);
    if (!num) {
      num = n++;
      seen.set(key, num);
      const url = `/legislacao/${tipoToSlug(entry.lei.tipo)}/${leiToSlug(entry.lei)}/${encodeURIComponent(
        String(artNum),
      )}`;
      const titleExtra = cleanExtras ? `, ${cleanExtras}` : '';
      sources.push({
        n: num,
        title: `Art. ${artNum}${titleExtra} — ${entry.lei.sigla}`,
        url,
        domain: entry.lei.nome,
        internal: true,
      });
    }
    // Check if the original text already had a [n] citation immediately following
    const following = fullStr.slice(offset + match.length, offset + match.length + 8);
    if (/^\s*\[\d+\]/.test(following)) {
      return match;
    }
    return `${match} [${num}]`;
  });

  return { text: replaced, sources };
}