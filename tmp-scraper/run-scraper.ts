

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
  let isIso = false;
  const headerPreview = new TextDecoder("ascii").decode(bytes.slice(0, 1024));
  if (/charset=["']?(iso-8859-1|windows-1252)/i.test(headerPreview)) {
    isIso = true;
  }
  let html: string;
  try {
    if (isIso) throw new Error("Force ISO");
    html = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    html = new TextDecoder("iso-8859-1").decode(bytes);
  }
  return html;
}

const HIER_RE = /^(PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+([IVXLCDM]+|[0-9]+|[ÚU]NICO|PRELIMINAR)\b/i;
const ART_RE = /^Art\.?\s*(\d+[A-Z]?)(?:º|o|°)?/i;

const PLANALTO_NOTE_BLOCK_RE =
  /[\(\[]\s*(?:Reda[çc][ãa]o\s+dada|Inclu[íi]d[oa]|Acrescid[oa]|Alterad[oa]|Vide|Vig[êe]ncia|Regulamento|Nova\s+reda[çc][ãa]o|Renumerad[oa]|Transformad[oa]|Restabelecid[oa]|Produ[çc][ãa]o\s+de\s+efeito)[^\)\]]{0,250}?[\)\]]/gi;

function removePlanaltoAnnotationBlocks(s: string): string {
  // WE ARE COMMENTING THIS OUT TO SEE WHAT HAPPENS
  // return s.replace(PLANALTO_NOTE_BLOCK_RE, " ");
  return s;
}

function normalizeHierLabel(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLocaleUpperCase("pt-BR");
}

interface Bloco {
  tipo: "hier" | "art";
  numero: string;
  texto: string;
  vetado?: boolean;
}

function extractBlocos(html: string): Bloco[] {
  let body = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<(?:s|strike|del)\b[^>]*>[\s\S]*?<\/(?:s|strike|del)>/gi, " ")
    .replace(/<([a-z]+)\b[^>]*style\s*=\s*["'][^"']*text-decoration\s*:\s*[^"']*line-through[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, " ");

  const bm = body.match(/<body[^>]*>([\s\S]+)/i);
  if (bm) body = bm[1];

  body = body.replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, (_, inner) => {
    const t = inner.replace(/<[^>]+>/g, "").trim().toLowerCase();
    if (t === "" || t === "o" || t === "a" || t === "º" || t === "°" || t === "ª") return "º";
    return inner;
  });

  body = body.replace(/<a\b[^>]*>\s*\(?\s*Vig[êe]ncia\s*\)?\s*<\/a>/gi, " (Vigência) ");

  body = body
    .replace(/<blockquote[^>]*>/gi, "\n\n")
    .replace(/<\/blockquote>/gi, "\n\n")
    .replace(/<p\b[^>]*>/gi, "\n\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<div\b[^>]*>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  
  body = decodeHtmlEntities(body).replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ");

  body = body.replace(
    /(?<!^)(?<!\n)\s*(?=(?:PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+(?:[IVXLCDM]+|[0-9]+|[ÚU]NICO|PRELIMINAR)\b)/gi,
    "\n\n"
  );

  body = body.replace(/(?<=\S)\s+Vig[êe]ncia\b/g, " (Vigência)");
  body = body.replace(/^\s*Vig[êe]ncia\s*$/gm, "(Vigência)");

  body = removePlanaltoAnnotationBlocks(body);

  const linhasBrutas = body
    .split(/\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 0);

  const linhas: string[] = [];
  for (let k = 0; k < linhasBrutas.length; k++) {
    const atual = linhasBrutas[k];
    const proxima = linhasBrutas[k + 1];
    if (/^Art\.?$/.test(atual) && proxima && /^\d/.test(proxima)) {
      linhas.push(`Art. ${proxima}`);
      k += 1;
      continue;
    }
    linhas.push(atual);
  }

  const startIdx = linhas.findIndex(
    (l) => HIER_RE.test(l) || ART_RE.test(l),
  );
  const uteis = startIdx > 0 ? linhas.slice(startIdx) : linhas;

  let endIdx = -1;
  for (let k = uteis.length - 1; k >= 0; k--) {
    if (/Este texto não substitui/i.test(uteis[k])) { endIdx = k; break; }
  }
  const finais = endIdx > 0 ? uteis.slice(0, endIdx) : uteis;

  const blocos: Bloco[] = [];
  let i = 0;
  while (i < finais.length) {
    const linha = finais[i];

    const hm = linha.match(HIER_RE);
    if (hm) {
      const proximaUtil = (from: number): { idx: number; linha: string | undefined } => {
        for (let j = from; j < finais.length; j++) {
          const l = finais[j];
          if (/^\(.*\)$/.test(l)) continue; 
          return { idx: j, linha: l };
        }
        return { idx: -1, linha: undefined };
      };
      
      const { idx: nextIdx, linha: labelText } = proximaUtil(i + 1);
      
      let finalNum = hm[0].toUpperCase();
      let finalLabel = `${finalNum}`;

      if (labelText && !HIER_RE.test(labelText) && !ART_RE.test(labelText) && labelText.length < 150) {
        finalLabel = `${finalNum}\n${labelText}`;
        i = nextIdx + 1;
      } else {
        i++;
      }

      blocos.push({
        tipo: "hier",
        numero: normalizeHierLabel(finalNum),
        texto: finalLabel,
      });
      continue;
    }

    const am = linha.match(ART_RE);
    if (am) {
      let num = am[1];
      if (!/[A-Z]$/.test(num)) {
        num = num.replace(/^0+/, "");
      }
      const rawText = linha.replace(/^Art\.?\s*\d+[A-Z]?(?:º|o|°)?\s*-?/i, "").trim();
      let finalText = rawText ? `Art. ${num}º ${rawText}` : `Art. ${num}º`;
      if (!/[A-Z]$/i.test(num) && parseInt(num, 10) > 9) {
        finalText = rawText ? `Art. ${num} ${rawText}` : `Art. ${num}`;
      }

      blocos.push({
        tipo: "art",
        numero: num.toUpperCase(),
        texto: finalText,
      });
      i++;
      continue;
    }

    if (blocos.length > 0) {
      const last = blocos[blocos.length - 1];
      if (last.tipo === "art") {
        if (!/^[a-z]\)/.test(linha) && /^[a-z]\s*\)/.test(linha)) {
          last.texto += "\n" + linha.replace(/^([a-z])\s*\)/, "$1)");
        } else {
          last.texto += "\n" + linha;
        }
      }
    }
    i++;
  }

  for (const b of blocos) {
    if (b.tipo === "art" && /\bVETADO\b/i.test(b.texto)) {
      b.vetado = true;
    }
  }

  return blocos;
}

async function rebuildLeiFromPlanalto(url: string, isSumula: boolean) {
  const html = await fetchHtmlOnce(url);
  const blocos = extractBlocos(html);
  
  let raw_art_matches = (html.match(/Art\.?\s*\d+/gi) || []).length;
  const totalmente_revogada = html.match(/Revogad[ao]\s+pela/gi)?.length > 5;
  const aviso_hierarquia_vazia = !isSumula && blocos.filter(b => b.tipo === "hier").length === 0;

  return {
    ementa: "Ementa",
    blocos,
    totalmente_revogada,
    aviso_hierarquia_vazia,
    raw_art_matches
  };
}

import { createClient } from "@supabase/supabase-js";

async function saveToDB() {
  const supabase = createClient('https://dnjrgpldcwcpoywamorr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0');
  const result = await rebuildLeiFromPlanalto('https://www.planalto.gov.br/ccivil_03/leis/2003/l10.741compilado.htm', false);
  
  const slug = 'ei';
  const tableSuffix = 'EI_ESTATUTO_IDOSO';
  
  console.log('Resetting...');
  await supabase.rpc('reset_artigos_lei', { p_slug: slug });
  await supabase.from('vade_mecum_artigos').delete().eq('lei_slug', slug);
  
  console.log('Inserting ' + result.blocos.length + ' blocos...');
  const BATCH_SIZE = 50;
  for (let i = 0; i < result.blocos.length; i += BATCH_SIZE) {
    const lote = result.blocos.slice(i, i + BATCH_SIZE).map((b: any) => ({
      lei_slug: slug,
      tabela_codigo: tableSuffix,
      tipo: b.tipo,
      numero: b.numero,
      texto: b.texto,
      livro: '',
      titulo: '',
      capitulo: '',
      secao: '',
      subsecao: '',
      artigo: b.tipo === 'art' ? b.numero : '',
    }));
    const { error } = await supabase.from('vade_mecum_artigos').insert(lote);
    if(error) console.error(error);
  }
  
  console.log('Building hierarchy...');
  await supabase.rpc('build_hierarquia_lei', { p_slug: slug });
  console.log('Done!');
}
saveToDB();

