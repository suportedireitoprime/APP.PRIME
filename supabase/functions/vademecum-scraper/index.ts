import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
};

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

async function fetchHtmlOnce(url: string): Promise<string> {
  const fullUrl = url.replace(/^http:/, "https:");
  const res = await fetch(fullUrl, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${fullUrl}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  let html: string;
  try {
    html = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    html = new TextDecoder("windows-1252").decode(bytes);
  }
  return html
    .normalize("NFC")
    .replace(/\uFFFD/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
}

function urlVariants(url: string): string[] {
  const u = url.replace(/^http:/, "https:");
  const out = new Set<string>([u]);
  if (/compilad[oa]\.htm$/i.test(u)) {
    out.add(u.replace(/compilad[oa]\.htm$/i, ".htm"));
  } else if (/\.htm$/i.test(u)) {
    out.add(u.replace(/\.htm$/i, "compilado.htm"));
    out.add(u.replace(/\.htm$/i, "compilada.htm"));
  }
  out.add(u.replace("/LEIS/", "/leis/"));
  out.add(u.replace("/leis/", "/LEIS/"));
  out.add(u.replace("://www.planalto", "://planalto"));
  out.add(u.replace("://planalto", "://www.planalto"));
  return [...out];
}

async function fetchHtml(url: string): Promise<string> {
  const variants = urlVariants(url);
  let lastErr: unknown = null;
  for (const v of variants) {
    try {
      return await fetchHtmlOnce(v);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

interface ScrapedItem {
  artigo: string;
  motivo: string;
  ano: number;
  texto_antigo: string;
  texto_novo: string;
  link_lei?: string;
  data_completa?: string;
}

// Regex universal para Artigos (suporta "Art. 1225", "Art. 1.225", "Art. 300-A", "Art. 15-B")
const ART_REGEX = /^Art\.?\s*(\d+(?:\.\d+)*(?:-[A-Za-z0-9]+)?)/i;

// Regex universal para termos modificadores de legislação oficial do Planalto
const ALTERACAO_NOTE_RE =
  /(?:[([][\s]*)?(Reda[çc][ãa]o\s+dada|Inclu[íi]d[oa]|Acrescid[oa]|Revogad[oa]|Restaurad[oa]|Alterad[oa]|Transformad[oa]|Renumerad[oa])\s+(?:pela|pelo|na)\s+((?:Lei(?:\s+Federal)?(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional|Medida\s+Provis[óo]ria)[^)\].\n]{0,140}?(?:de\s+(\d{4}))?)(?:[)\]][\s]*)?/i;

/**
 * Motor nativo rápido: extrai alterações diretamente do HTML oficial do Planalto
 */
function parseAlteracoesFromHtml(html: string, baseUrl: string, maxAgeYears = 20): ScrapedItem[] {
  const currentYear = new Date().getFullYear();
  const found: ScrapedItem[] = [];

  // Quebra o HTML em blocos de parágrafos (<p>...</p>)
  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch: RegExpExecArray | null;

  let currentArtNum = '';
  let prevStrikeText = '';

  while ((pMatch = pRegex.exec(html)) !== null) {
    const rawParagraph = pMatch[1];
    const textClean = decodeHtmlEntities(rawParagraph.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();

    // 1. Verifica se este parágrafo inicia um novo artigo
    const artMatch = textClean.match(ART_REGEX);
    if (artMatch) {
      // Normaliza "1.225" para "1225", mas mantém sufixos como "300-A"
      currentArtNum = artMatch[1].replace(/\./g, '');
    }

    // Extrai texto strike (antigo) se presente
    let strikeText = '';
    const strikeMatch = rawParagraph.match(/<strike\b[^>]*>([\s\S]*?)<\/strike>/i);
    if (strikeMatch) {
      strikeText = decodeHtmlEntities(strikeMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
      prevStrikeText = strikeText;
    }

    // 2. Verifica se há anotação de alteração no parágrafo
    const noteMatch = textClean.match(ALTERACAO_NOTE_RE);
    if (noteMatch) {
      const acao = noteMatch[1];
      const leiDetalhe = noteMatch[2];
      const anoCaptured = noteMatch[3];

      let ano = anoCaptured ? parseInt(anoCaptured, 10) : 0;
      if (!ano) {
        const fallbackAno = textClean.match(/\b(19\d{2}|20\d{2})\b/);
        if (fallbackAno) ano = parseInt(fallbackAno[1], 10);
      }

      // Se não atingir o critério de idade recente, ignora
      if (ano && (currentYear - ano > maxAgeYears)) {
        continue;
      }

      // Artigo alvo:
      // Se o próprio parágrafo é o artigo (ex: "Art. 300-A"), usa ele.
      // Se for parágrafo/inciso, usa o currentArtNum herdado.
      const artigoFinal = artMatch ? artMatch[1].replace(/\./g, '') : currentArtNum;
      if (!artigoFinal) continue;

      // Link para a lei oficial
      let linkLei = '';
      const hrefMatch = rawParagraph.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/i);
      if (hrefMatch) {
        const rawHref = hrefMatch[1];
        try {
          linkLei = new URL(rawHref, baseUrl).href;
        } catch {
          linkLei = rawHref;
        }
      }

      // Texto do motivo limpo
      const motivoLimpo = `${acao} pela ${leiDetalhe}`.replace(/\s+/g, ' ').trim();

      // Texto novo (parágrafo sem o texto antigo e sem a nota)
      let textoNovo = textClean
        .replace(strikeText, '')
        .replace(noteMatch[0], '')
        .replace(/\s+/g, ' ')
        .trim();

      found.push({
        artigo: `Art. ${artigoFinal}`,
        motivo: motivoLimpo,
        ano: ano || currentYear,
        texto_antigo: strikeText || prevStrikeText || '',
        texto_novo: textoNovo || textClean,
        link_lei: linkLei || undefined,
      });

      prevStrikeText = '';
    }
  }

  // Deduplicação inteligente: preserva diferentes alterações do mesmo artigo (anos/dispositivos distintos)
  const uniqueMap = new Map<string, ScrapedItem>();
  for (const item of found) {
    const key = `${item.artigo}_${item.ano}_${item.motivo.slice(0, 30).toLowerCase()}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values()).sort((a, b) => b.ano - a.ano);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const tabela_nome = url.searchParams.get('tabela_nome');
      if (tabela_nome) {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.45.6");
        const supabase = createClient(Deno.env.get('SUPABASE_URL') || '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
        const { data, error } = await supabase.from('legislacao_alteracoes').select('*').eq('tabela_nome', tabela_nome).eq('revisado', true);
        if (error) throw error;
        return new Response(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const { targetUrl, maxAgeYears = 20 } = await req.json();

    if (!targetUrl || !targetUrl.includes('planalto.gov.br')) {
      return new Response(JSON.stringify({ error: "URL inválida ou não pertence ao planalto.gov.br" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[vademecum-scraper] Iniciando extração para: ${targetUrl}`);

    // =========================================================================
    // MOTOR 1 (PRIMÁRIO E RÁPIDO): HTTP Nativo com Deno e Decodificação Precisa
    // =========================================================================
    try {
      const html = await fetchHtml(targetUrl);
      if (html && html.length > 500) {
        const articles = parseAlteracoesFromHtml(html, targetUrl, maxAgeYears);
        if (articles.length > 0) {
          console.log(`[vademecum-scraper] Motor nativo identificou com sucesso ${articles.length} alterações.`);
          return new Response(JSON.stringify({ success: true, articles }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (nativeErr: any) {
      console.warn(`[vademecum-scraper] Motor nativo encontrou exceção: ${nativeErr.message}. Tentando Puppeteer...`);
    }

    // =========================================================================
    // MOTOR 2 (FALLBACK): Puppeteer via Browserless
    // =========================================================================
    const browserlessApiKey = Deno.env.get("BROWSERLESS_API_KEY");
    const browserlessUrl = Deno.env.get("BROWSERLESS_URL") || (browserlessApiKey ? `wss://chrome.browserless.io?token=${browserlessApiKey}` : null);

    if (!browserlessUrl) {
      // Se não houver Browserless configurado e o motor nativo retornou vazio
      return new Response(JSON.stringify({ success: true, articles: [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let browser;
    try {
      browser = await puppeteer.connect({ browserWSEndpoint: browserlessUrl });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: "Falha ao conectar no Browserless", details: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
    });

    console.log(`[vademecum-scraper] Puppeteer navegando para: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const updates = await page.evaluate((maxAge) => {
      const found: any[] = [];
      const currentYear = new Date().getFullYear();

      const elements = document.querySelectorAll('p, blockquote, tr');

      const extractArticleData = (p: Element) => {
        const text = p.textContent?.trim() || '';

        // 1. PRIMEIRA PRIORIDADE: O próprio parágrafo é o artigo (ex: "Art. 300-A", "Art. 1.225")
        const selfMatch = text.match(/^Art\.?\s*(\d+(?:\.\d+)*(?:-[A-Za-z0-9]+)?)/i);
        if (selfMatch) {
          const artNum = selfMatch[1].replace(/\./g, '');
          let textoAntigo = "";
          const strike = p.querySelector('strike');
          if (strike) textoAntigo = strike.textContent?.trim() || "";
          const textoNovo = p.textContent?.replace(textoAntigo, '').trim() || "";
          return { artNum, textoAntigo, textoNovo };
        }

        // 2. SEGUNDA PRIORIDADE: É um subdispositivo (§, inciso, etc). Procura o artigo nos irmãos anteriores.
        let prev = p.previousElementSibling;
        let artNum = null;
        let count = 0;
        while (prev && count < 35) {
          const prevText = prev.textContent?.trim() || '';
          const prevMatch = prevText.match(/^Art\.?\s*(\d+(?:\.\d+)*(?:-[A-Za-z0-9]+)?)/i);
          if (prevMatch) {
            artNum = prevMatch[1].replace(/\./g, '');
            break;
          }
          prev = prev.previousElementSibling;
          count++;
        }

        if (!artNum) return null;

        let textoAntigo = "";
        const strike = p.querySelector('strike');
        if (strike) textoAntigo = strike.textContent?.trim() || "";
        const textoNovo = p.textContent?.replace(textoAntigo, '').trim() || "";
        return { artNum, textoAntigo, textoNovo };
      };

      const NOTE_REGEX = /(?:[([][\s]*)?(Reda[çc][ãa]o\s+dada|Inclu[íi]d[oa]|Acrescid[oa]|Revogad[oa]|Restaurad[oa]|Alterad[oa]|Transformad[oa]|Renumerad[oa])\s+(?:pela|pelo|na)\s+((?:Lei(?:\s+Federal)?(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional|Medida\s+Provis[óo]ria)[^)\].\n]{0,140}?(?:de\s+(\d{4}))?)(?:[)\]][\s]*)?/i;

      elements.forEach(p => {
        const text = p.textContent || '';
        const match = text.match(NOTE_REGEX);
        if (match) {
          let ano = match[3] ? parseInt(match[3], 10) : 0;
          if (!ano) {
            const fbAno = text.match(/\b(19\d{2}|20\d{2})\b/);
            if (fbAno) ano = parseInt(fbAno[1], 10);
          }

          if (ano && (currentYear - ano <= maxAge)) {
            const data = extractArticleData(p);
            if (data) {
              let linkLei = "";
              const aTag = p.querySelector('a');
              if (aTag && aTag.href) {
                linkLei = aTag.href;
              }

              found.push({
                artigo: `Art. ${data.artNum}`,
                motivo: `${match[1]} pela ${match[2]}`.replace(/\s+/g, ' ').trim(),
                ano: ano || currentYear,
                texto_antigo: data.textoAntigo,
                texto_novo: data.textoNovo,
                link_lei: linkLei
              });
            }
          }
        }
      });

      // Deduplicação preservando múltiplos artigos alterados
      const uniqueMap = new Map();
      for (const item of found) {
        const key = `${item.artigo}_${item.ano}_${item.motivo.slice(0, 30).toLowerCase()}`;
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        }
      }
      return Array.from(uniqueMap.values()).sort((a: any, b: any) => b.ano - a.ano);
    }, maxAgeYears);

    await browser.close();

    return new Response(JSON.stringify({ success: true, articles: updates }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
