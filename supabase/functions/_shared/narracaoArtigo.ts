// Narração de artigo com karaokê preciso.
//
// Estratégia: o texto é sintetizado em segmentos curtos (o prefixo falado —
// hierarquia + epígrafe + número do artigo — é sempre um segmento isolado).
// Como sabemos a duração exata do PCM de cada segmento, as palavras exibidas
// recebem timings dentro da janela do seu próprio segmento, o que mantém o
// grifo colado na fala do início ao fim.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import { geminiFetch } from "./geminiFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const NARRACAO_ARTIGO_VERSION = "v5-hierarquia-epigrafe";

const VOICE_NAME = "Kore";
const MODEL = "gemini-2.5-flash-preview-tts";
const MAX_TTS_CHARS = 600;
const SAMPLE_RATE = 24000;

const letrasParaExtenso: Record<string, string> = {
  a: "á", b: "bê", c: "cê", d: "dê", e: "é", f: "éfe", g: "gê", h: "agá",
  i: "í", j: "jota", k: "cá", l: "éle", m: "ême", n: "êne", o: "ó", p: "pê",
  q: "quê", r: "érre", s: "ésse", t: "tê", u: "ú", v: "vê", w: "dáblio",
  x: "xis", y: "ípsilon", z: "zê",
};

const romanos: Record<string, number> = {
  I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
  XI: 11, XII: 12, XIII: 13, XIV: 14, XV: 15, XVI: 16, XVII: 17, XVIII: 18,
  XIX: 19, XX: 20, XXI: 21, XXII: 22, XXIII: 23, XXIV: 24, XXV: 25, XXVI: 26,
  XXVII: 27, XXVIII: 28, XXIX: 29, XXX: 30, XL: 40, L: 50, LX: 60, LXX: 70,
  LXXX: 80, XC: 90, C: 100,
};

const ordUnid = ["", "primeiro", "segundo", "terceiro", "quarto", "quinto", "sexto", "sétimo", "oitavo", "nono"];
const ordDez = ["", "", "vigésimo", "trigésimo", "quadragésimo", "quinquagésimo", "sexagésimo", "septuagésimo", "octogésimo", "nonagésimo"];

function numeroParaOrdinal(n: number): string {
  if (n <= 0) return String(n);
  if (n === 10) return "décimo";
  if (n < 10) return ordUnid[n];
  if (n < 20) return "décimo " + ordUnid[n - 10];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return ordDez[d] + (u ? " " + ordUnid[u] : "");
  }
  return String(n);
}

const cardUnid = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const card10a19 = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const cardDez = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const cardCent = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function numeroParaCardinal(n: number): string {
  if (n === 0) return "zero";
  if (n === 100) return "cem";
  if (n < 10) return cardUnid[n];
  if (n < 20) return card10a19[n - 10];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    return cardDez[d] + (u ? " e " + cardUnid[u] : "");
  }
  if (n < 1000) {
    const c = Math.floor(n / 100);
    const r = n % 100;
    return r ? cardCent[c] + " e " + numeroParaCardinal(r) : cardCent[c];
  }
  return String(n);
}

function numeroParaExtensoJuridico(n: number): string {
  return n >= 1 && n <= 9 ? numeroParaOrdinal(n) : numeroParaCardinal(n);
}

function limparAnotacoes(texto: string): string {
  return texto
    .replace(
      /\(\s*(?:Reda[çc][ãa]o\s+dada|Inclu[ií]d[oa]|Acrescid[oa]|Alterad[oa]|Vide|Vig[êe]ncia|Regulamento|Produ[çc][ãa]o\s+de\s+efeitos|NR)[^)]*\)/gi,
      "",
    )
    .replace(/\(\s*(?:Lei\s+(?:n[ºo°]?\s*)?\d|Decreto|Medida\s+Provis[oó]ria|Emenda\s+Constitucional|Lei\s+Complementar)[^)]*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Normaliza o texto do artigo mantendo, palavra a palavra, o que será falado.
export function normalizarTextoArtigo(texto: string): string {
  let r = limparAnotacoes(texto);

  r = r
    .replace(/[º°]/g, "")
    .replace(/[""''""]/g, "")
    .replace(/\bart\.\s?(\d+)/gi, "artigo $1")
    .replace(/\barts\.\s?/gi, "artigos ")
    .replace(/\binc\.\s?/gi, "inciso ")
    .replace(/\bal\.\s?/gi, "alínea ")
    .replace(/[<>{}|\\^~[\]]/g, "");

  r = r.replace(/§\s*único/gi, ". parágrafo único. ");
  r = r.replace(/§§/g, "parágrafos");
  r = r.replace(/§\s*(\d+)/g, (_, num) => `. parágrafo ${numeroParaExtensoJuridico(parseInt(num, 10))}. `);

  const chaves = Object.keys(romanos).sort((a, b) => b.length - a.length);
  for (const rom of chaves) {
    const ordinal = numeroParaOrdinal(romanos[rom]);
    r = r.replace(new RegExp(`(^|\\n|\\s)(${rom})\\s*[-–—.:;]\\s*`, "g"), `$1. inciso ${ordinal}. `);
  }

  r = r.replace(/(^|\n|\s)([a-z])\)\s*/gm, (_, p, l) => `${p}. alínea ${letrasParaExtenso[l.toLowerCase()] || l}. `);
  r = r.replace(/\s*[-–—]\s*/g, ", ");
  r = r.replace(/\s+/g, " ").replace(/,\s*,/g, ",");

  return r.trim();
}

// "PARTE GERAL. TÍTULO IV. DO CONCURSO DE PESSOAS" → "parte geral, título quarto, do concurso de pessoas"
export function hierarquiaParaFala(valor: unknown): string {
  if (!valor) return "";
  return String(valor)
    .split(/\s*[.>›|]+\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((seg) => {
      const base = seg === seg.toUpperCase() ? seg.toLowerCase() : seg;
      return base.replace(
        /^(parte|livro|t[ií]tulo|cap[ií]tulo|se[çc][ãa]o|subse[çc][ãa]o)\s+([IVXLCDM]+|\d+)\b[.\-–—:]?/i,
        (_m, label: string, num: string) => {
          const rom = num.toUpperCase();
          let ordinal = romanos[rom]
            ? numeroParaOrdinal(romanos[rom])
            : /^\d+$/.test(num) ? numeroParaOrdinal(parseInt(num, 10)) : num;
          if (/se[çc][ãa]o/i.test(label)) ordinal = ordinal.replace(/o\b/g, "a");
          return `${label.toLowerCase()} ${ordinal}`;
        },
      );
    })
    .join(", ");
}

function limparRotulo(s: unknown): string {
  return s
    ? String(s).trim()
        .replace(/^(PARTE|LIVRO|T[IÍ]TULO|CAP[IÍ]TULO|SEÇ[AÃ]O|SUBSEÇ[AÃ]O)\s+[IVXLCDM\d]+\s*[-–—:.]?\s*/i, "")
        .replace(/\.+$/, "")
        .trim()
    : "";
}

function dividirEmSegmentos(texto: string): string[] {
  const t = texto.trim();
  if (!t) return [];
  if (t.length <= MAX_TTS_CHARS) return [t];
  const unidades = t.match(/[^.!?;]+[.!?;]?\s*/g) || [t];
  const out: string[] = [];
  let buf = "";
  for (const u of unidades) {
    const cand = buf ? buf + u : u;
    if (cand.length <= MAX_TTS_CHARS) { buf = cand; continue; }
    if (buf) out.push(buf.trim());
    if (u.length > MAX_TTS_CHARS) {
      for (let i = 0; i < u.length; i += MAX_TTS_CHARS) out.push(u.slice(i, i + MAX_TTS_CHARS).trim());
      buf = "";
    } else buf = u;
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter(Boolean);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function gerarSegmento(texto: string, keys: string[], idx: number, total: number): Promise<string> {
  const prompt =
    `TTS(português brasileiro, tom animado e envolvente):\n` +
    `Narre com entonação profissional e ritmo uniforme, como uma professora jovem apaixonada por Direito.\n` +
    `Leia exatamente o texto abaixo, sem acrescentar nada, sem repetir o número do artigo e sem dizer "parte um" ou "continuação".\n\n${texto}`;

  for (let ki = 0; ki < keys.length; ki++) {
    for (let tent = 0; tent < 2; tent++) {
      try {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), 180000);
        const res = await geminiFetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${keys[ki]}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                response_modalities: ["AUDIO"],
                speech_config: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } } },
              },
            }),
          },
        );
        clearTimeout(to);
        const data = await res.json();
        const audio = data?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData?.data)?.inlineData?.data;
        if (audio) return audio;
        console.error(`Seg ${idx}/${total}: sem áudio (${JSON.stringify(data?.error ?? {}).slice(0, 200)})`);
        if (tent === 0) { await sleep(2500); continue; }
      } catch (e) {
        console.error(`Seg ${idx}/${total}: ${e instanceof Error ? e.message : String(e)}`);
        if (tent === 0) { await sleep(2500); continue; }
      }
    }
  }
  throw new Error(`Falha ao gerar segmento ${idx}`);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pcmToWav(pcm: Uint8Array): Uint8Array {
  const dataSize = pcm.length;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  w(36, "data");
  view.setUint32(40, dataSize, true);
  const bytes = new Uint8Array(buf);
  bytes.set(pcm, 44);
  return bytes;
}

function palavras(texto: string): string[] {
  return Array.from(texto.matchAll(/[\p{L}\p{N}]+(?:[-–][\p{L}\p{N}]+)*/gu), (m) => m[0]);
}

// Distribui as palavras de um segmento dentro da janela de tempo real desse segmento.
function timingsDoSegmento(texto: string, inicio: number, fim: number) {
  const toks = palavras(texto);
  if (!toks.length || fim <= inicio) return [];
  const pesos = toks.map((t) => Math.max(2, t.length) + 1);
  const total = pesos.reduce((a, b) => a + b, 0);
  let acc = 0;
  return toks.map((word, i) => {
    const start = inicio + (acc / total) * (fim - inicio);
    acc += pesos[i];
    const end = inicio + (acc / total) * (fim - inicio);
    return { word, start: Number(start.toFixed(3)), end: Number(end.toFixed(3)) };
  });
}

export async function handleNarracaoArtigo(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { tabela_nome, artigo_numero, artigo_texto, lei_nome, hierarquia, titulo_artigo, epigrafe, force_regenerate } = body;

    if (!tabela_nome || !artigo_numero || !artigo_texto) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const filePath = `narracoes/${tabela_nome}/${NARRACAO_ARTIGO_VERSION}/${String(artigo_numero).replace(/[^a-zA-Z0-9]/g, "_")}.wav`;

    const assinar = async () => {
      const { data, error } = await supabase.storage.from("audios").createSignedUrl(filePath, 60 * 60 * 24 * 365 * 5);
      if (error || !data?.signedUrl) throw new Error(error?.message || "sem URL assinada");
      return data.signedUrl;
    };

    if (!force_regenerate) {
      const { data: cached } = await supabase
        .from("narracoes_artigos")
        .select("audio_url,word_timings")
        .eq("tabela_nome", tabela_nome)
        .eq("artigo_numero", artigo_numero)
        .maybeSingle();

      const timings = Array.isArray(cached?.word_timings) ? cached!.word_timings : [];
      const versaoOk = typeof cached?.audio_url === "string" && cached.audio_url.includes(`/${NARRACAO_ARTIGO_VERSION}/`);
      if (versaoOk && timings.length) {
        try {
          const audioUrl = await assinar();
          if (audioUrl !== cached!.audio_url) {
            await supabase.from("narracoes_artigos").update({ audio_url: audioUrl })
              .eq("tabela_nome", tabela_nome).eq("artigo_numero", artigo_numero);
          }
          return new Response(JSON.stringify({ audio_url: audioUrl, word_timings: timings, cached: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } catch (_e) { /* regenera */ }
      }
    }

    const keys = [Deno.env.get("GEMINI_AUDIO_API_KEY"), Deno.env.get("GEMINI_API_KEY")].filter(Boolean) as string[];
    if (!keys.length) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Número do artigo por extenso
    const numStr = String(artigo_numero).trim();
    const soNum = numStr.match(/^(\d+)/)?.[1];
    const sufixo = numStr.match(/[-–]\s*([A-Za-z])/)?.[1];
    let numExtenso = numStr;
    if (soNum) {
      numExtenso = numeroParaExtensoJuridico(parseInt(soNum, 10));
      if (sufixo) numExtenso += " " + (letrasParaExtenso[sufixo.toLowerCase()] ?? sufixo);
    }

    // Prefixo falado: hierarquia → epígrafe → artigo N
    const hierFala = hierarquiaParaFala(hierarquia ?? titulo_artigo);
    const epigrafeLabel = limparRotulo(epigrafe);
    const partesPrefixo: string[] = [];
    if (hierFala) partesPrefixo.push(`${hierFala}.`);
    if (epigrafeLabel) partesPrefixo.push(`${epigrafeLabel}.`);
    partesPrefixo.push(`artigo ${numExtenso}.`);
    const prefixo = partesPrefixo.join(" ");

    const textoArtigo = normalizarTextoArtigo(
      String(artigo_texto).replace(/^\s*(?:Artigo|Art)\.?\s*\d+[º°]?(?:\s*[-–—]\s*[A-Za-z])?\s*[.\-–—:]?\s*/i, "").trim(),
    );

    const segmentosArtigo = dividirEmSegmentos(textoArtigo);
    const segmentos = [prefixo, ...segmentosArtigo];

    const pcms: Uint8Array[] = [];
    for (let i = 0; i < segmentos.length; i++) {
      pcms.push(b64ToBytes(await gerarSegmento(segmentos[i], keys, i + 1, segmentos.length)));
    }

    const totalLen = pcms.reduce((a, p) => a + p.length, 0);
    const pcm = new Uint8Array(totalLen);
    let off = 0;
    for (const p of pcms) { pcm.set(p, off); off += p.length; }
    const wav = pcmToWav(pcm);

    // Timings: pula o segmento do prefixo e distribui cada segmento na sua janela real
    const wordTimings: Array<{ word: string; start: number; end: number }> = [];
    let cursor = pcms[0].length / (SAMPLE_RATE * 2);
    for (let i = 1; i < segmentos.length; i++) {
      const dur = pcms[i].length / (SAMPLE_RATE * 2);
      wordTimings.push(...timingsDoSegmento(segmentos[i], cursor, cursor + dur));
      cursor += dur;
    }

    const { error: upErr } = await supabase.storage.from("audios").upload(filePath, wav, {
      contentType: "audio/wav", upsert: true, cacheControl: "31536000, immutable",
    });
    if (upErr) {
      return new Response(JSON.stringify({ error: `Upload falhou: ${upErr.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioUrl = await assinar();

    const { error: insErr } = await supabase.from("narracoes_artigos").upsert(
      {
        tabela_nome,
        artigo_numero,
        lei_nome: lei_nome || tabela_nome,
        titulo_artigo: limparRotulo(hierarquia ?? titulo_artigo) || null,
        audio_url: audioUrl,
        word_timings: wordTimings,
      },
      { onConflict: "tabela_nome,artigo_numero" },
    );
    if (insErr) console.error("Cache narração:", insErr);

    return new Response(JSON.stringify({ audio_url: audioUrl, word_timings: wordTimings }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("narracao/artigo:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
