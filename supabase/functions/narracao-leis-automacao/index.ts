// supabase/functions/narracao-leis-automacao/index.ts
//
// Edge Function para Automação de Narração de Leis Fatiada.
// Disparada a cada 10 minutos pelo pg_cron ou acionada manualmente no Admin.
//
// Prioridade: Processa primeiro os artigos de maior extensão (artigos maiores primeiro).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import { geminiFetch } from "../_shared/geminiFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const MODEL = "gemini-2.5-flash-preview-tts";

// Tabelas de extenso para pronúncia fonética precisa
const ROMANOS_ORDINAIS: Record<string, string> = {
  I: "primeiro", II: "segundo", III: "terceiro", IV: "quarto", V: "quinto",
  VI: "sexto", VII: "sétimo", VIII: "oitavo", IX: "nono", X: "décimo",
  XI: "décimo primeiro", XII: "décimo segundo", XIII: "décimo terceiro",
  XIV: "décimo quarto", XV: "décimo quinto", XVI: "décimo sexto",
  XVII: "décimo sétimo", XVIII: "décimo oitavo", XIX: "décimo nono",
  XX: "vigésimo", XXI: "vigésimo primeiro", XXII: "vigésimo segundo",
  XXIII: "vigésimo terceiro", XXIV: "vigésimo quarto", XXV: "vigésimo quinto",
  XXVI: "vigésimo sexto", XXVII: "vigésimo sétimo", XXVIII: "vigésimo oitavo",
  XXIX: "vigésimo nono", XXX: "trigésimo",
};

const LETRAS_EXTENSO: Record<string, string> = {
  a: "á", b: "bê", c: "cê", d: "dê", e: "é",
  f: "éfe", g: "gê", h: "agá", i: "í", j: "jota",
  k: "cá", l: "éle", m: "ême", n: "êne", o: "ó",
  p: "pê", q: "quê", r: "érre", s: "ésse", t: "tê",
  u: "ú", v: "vê", w: "dáblio", x: "xis", y: "ípsilon", z: "zê",
};

// Artigos de altíssima relevância e frequência em exames (OAB, Concursos e Doutrina)
const MAPA_TOP_PROVAS: Record<string, string[]> = {
  CP_CODIGO_PENAL: [
    '1', '2', '5', '13', '14', '18', '20', '21', '23', '24', '25', '28', '29', '59',
    '69', '70', '71', '107', '109', '121', '129', '147', '155', '157', '171', '213',
    '217-A', '288', '297', '299', '312', '316', '317', '319', '333',
  ],
  CC_CODIGO_CIVIL: [
    '1', '2', '3', '4', '5', '11', '12', '50', '104', '138', '145', '151', '156', '157',
    '158', '166', '186', '187', '205', '206', '389', '395', '421', '422', '927', '932',
    '944', '1196', '1228', '1238', '1240', '1511', '1694', '1784',
  ],
  CF88_CONSTITUICAO_FEDERAL: [
    '1', '2', '3', '4', '5', '6', '12', '14', '18', '21', '22', '24', '37', '38', '39',
    '40', '41', '102', '103', '105', '133', '144', '150',
  ],
  CPC_CODIGO_PROCESSO_CIVIL: [
    '1', '4', '6', '9', '10', '85', '219', '300', '311', '319', '335', '355', '356',
    '485', '487', '994', '1003', '1015', '1022',
  ],
  CPP_CODIGO_PROCESSO_PENAL: [
    '4', '5', '6', '24', '28', '155', '156', '157', '282', '283', '310', '311', '312',
    '315', '316', '396', '397', '406', '413', '414', '415', '581', '593', '647', '648',
  ],
  CLT_CONSOLIDACAO_LEIS_TRABALHO: [
    '2', '3', '7', '58', '59', '71', '442', '443', '468', '477', '482', '483', '840',
    '893', '895',
  ],
  CDC_CODIGO_DEFESA_CONSUMIDOR: [
    '2', '3', '6', '12', '14', '18', '26', '27', '39', '51', '66', '67',
  ],
  ECA_ESTATUTO_CRIANCA_ADOLESCENTE: [
    '1', '2', '3', '4', '18', '103', '104', '105', '112', '121', '122', '131', '225', '244-A',
  ],
  CTN_CODIGO_TRIBUTARIO_NACIONAL: [
    '3', '9', '97', '108', '113', '114', '121', '128', '142', '150', '151', '156', '173', '174',
  ],
  CTB_CODIGO_TRANSITO_BRASILEIRO: [
    '165', '165-A', '291', '302', '303', '306', '308', '309', '310', '311',
  ],
  EI_ESTATUTO_IDOSO: [
    '1', '2', '3', '4', '96', '97', '98', '99', '100', '102',
  ],
  EOAB_ESTATUTO_OAB: [
    '1', '2', '3', '7', '7-A', '7-B', '22', '34', '35', '36', '38',
  ],
};

function calcularScoreArtigo(artigo: any, tabelaNome: string): number {
  const numLimpo = String(artigo.rotulo || artigo.numero || '')
    .replace(/^[Aa]rt\.?\s*/i, '')
    .replace(/[º°]/g, '')
    .trim();
  const topList = MAPA_TOP_PROVAS[tabelaNome] || [];
  const isTop = topList.includes(numLimpo);
  const len = (artigo.texto || '').length;
  return (isTop ? 50000 : 0) + len;
}

function numeroExtenso(n: number): string {
  const ord = ["", "primeiro", "segundo", "terceiro", "quarto", "quinto", "sexto", "sétimo", "oitavo", "nono"];
  if (n >= 1 && n <= 9) return ord[n];
  return String(n);
}

function limparTexto(texto: string): string {
  return (texto || "")
    .replace(/\(\s*(?:Reda[çc][ãa]o\s+dada|Inclu[ií]d[oa]|Acrescid[oa]|Alterad[oa]|Renumerad[oa]|Vide|Vig[êe]ncia|Regulamento|Produ[çc][ãa]o\s+de\s+efeitos|NR)[^)]*\)/gi, "")
    .replace(/\(\s*(?:Lei\s+(?:n[ºo°]?\s*)?\d|Decreto|Medida\s+Provis[oó]ria|Emenda\s+Constitucional|Lei\s+Complementar)[^)]*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizarParaTTS(texto: string, rotulo: string, numeroArtigo: string): string {
  let r = limparTexto(texto);

  if (rotulo.toLowerCase().includes("caput")) {
    const limpo = r.replace(/^\s*(?:Artigo|Art)\.?\s*\d+[º°]?(?:\s*[-–—]\s*[A-Za-z])?\s*[.\-–—:]?\s*/i, "").trim();
    const numInt = parseInt(numeroArtigo.replace(/\D/g, ""), 10);
    const numExt = isNaN(numInt) ? numeroArtigo : numeroExtenso(numInt);
    r = `Artigo ${numExt}. ${limpo}`;
  }

  r = r.replace(/§\s*[úu]nico[.\s-]*/gi, "Parágrafo único. ");
  r = r.replace(/§\s*(\d+)[º°]?[.\s-]*/g, (_m, num) => {
    const n = parseInt(num, 10);
    return `Parágrafo ${numeroExtenso(n)}. `;
  });

  r = r.replace(/\b([IVXLCDM]+)\s*[-–—.:]\s*/g, (m, rom) => {
    const ord = ROMANOS_ORDINAIS[rom.toUpperCase()];
    return ord ? `Inciso ${ord}. ` : m;
  });

  r = r.replace(/(^|\n|\s)([a-z])\)\s*/gi, (_m, prefix, letra) => {
    const lExt = LETRAS_EXTENSO[letra.toLowerCase()] || letra;
    return `${prefix}Alínea ${lExt}. `;
  });

  r = r.replace(/\bPena\s*[-–—:]\s*/gi, "Pena: ");

  return r.trim();
}

function fatiarArtigo(
  textoCompleto: string,
  numeroArtigo: string,
  leiNome = "Código Penal",
  capitulo?: string,
  titulo?: string,
  maxChars = 850
): Array<{ id: string; rotulo: string; tipo: string; texto: string; textoTTS: string }> {
  const linhas = (textoCompleto || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const numLimpo = numeroArtigo.replace(/^[Aa]rt\.?\s*/i, "").trim();
  const numInt = parseInt(numLimpo.replace(/\D/g, ""), 10);
  const numExt = isNaN(numInt) ? numLimpo : numeroExtenso(numInt);
  const artFalado = `Artigo ${numExt}`;

  // Monta introdução de contexto
  let introTTS = `${leiNome}. `;
  if (capitulo && capitulo.trim()) {
    introTTS += `${limparTexto(capitulo)}. `;
  } else if (titulo && titulo.trim()) {
    introTTS += `${limparTexto(titulo)}. `;
  }
  introTTS += `${artFalado}: `;

  const blocos: Array<{ textoOriginal: string; textoTTS: string; tipo: string }> = [];
  const caputAcumulado: string[] = [];
  let caputFechado = false;

  for (const linha of linhas) {
    const isParagrafo = /^§|^(?:Par[áa]grafo\s+[úu]nico)/i.test(linha);
    const isInciso = /^[IVXLCDM]+\s*[-–—.]/i.test(linha);
    const isAlinea = /^[a-z]\)\s*/i.test(linha);
    const isPena = /^Pena\s*[-–—:]/i.test(linha);

    if (!caputFechado && !isParagrafo && !isInciso && !isAlinea && !isPena) {
      caputAcumulado.push(linha);
      continue;
    }

    if (!caputFechado && caputAcumulado.length > 0) {
      const caputTexto = limparTexto(caputAcumulado.join(" "));
      const semPrefixo = caputTexto.replace(/^\s*(?:Artigo|Art)\.?\s*\d+[º°]?(?:\s*[-–—]\s*[A-Za-z])?\s*[.\-–—:]?\s*/i, "").trim();
      blocos.push({
        textoOriginal: caputTexto,
        textoTTS: semPrefixo,
        tipo: "caput",
      });
      caputFechado = true;
    }

    const limpo = limparTexto(linha);
    const tipo = isPena ? "pena" : isParagrafo ? "paragrafo" : isInciso ? "inciso" : isAlinea ? "alinea" : "outro";
    blocos.push({
      textoOriginal: limpo,
      textoTTS: normalizarParaTTS(limpo, tipo, numeroArtigo),
      tipo,
    });
  }

  if (!caputFechado && caputAcumulado.length > 0) {
    const caputTexto = limparTexto(caputAcumulado.join(" "));
    const semPrefixo = caputTexto.replace(/^\s*(?:Artigo|Art)\.?\s*\d+[º°]?(?:\s*[-–—]\s*[A-Za-z])?\s*[.\-–—:]?\s*/i, "").trim();
    blocos.push({
      textoOriginal: caputTexto,
      textoTTS: semPrefixo,
      tipo: "caput",
    });
  }

  if (blocos.length === 0) {
    const fb = limparTexto(textoCompleto || `Artigo ${numLimpo}`);
    blocos.push({ textoOriginal: fb, textoTTS: fb, tipo: "caput" });
  }

  // Agrupamento contínuo em partes de até ~1 minuto (~850 chars)
  const partes: Array<{ id: string; rotulo: string; tipo: string; texto: string; textoTTS: string }> = [];
  let parteAtualOrig: string[] = [];
  let parteAtualTTS = "";
  let parteIndex = 1;

  for (let i = 0; i < blocos.length; i++) {
    const b = blocos[i];
    const isPrimeiro = i === 0;

    let incTTS = "";
    if (parteAtualTTS === "") {
      incTTS = isPrimeiro ? `${introTTS}${b.textoTTS}` : b.textoTTS;
    } else {
      incTTS = ` ${b.textoTTS}`;
    }

    if ((parteAtualTTS + incTTS).length <= maxChars || parteAtualTTS === "") {
      parteAtualOrig.push(b.textoOriginal);
      parteAtualTTS += incTTS;
    } else {
      partes.push({
        id: `parte_${parteIndex}`,
        rotulo: `Parte ${parteIndex}`,
        tipo: parteIndex === 1 ? "caput" : "continua",
        texto: parteAtualOrig.join("\n\n"),
        textoTTS: parteAtualTTS.trim(),
      });
      parteIndex++;
      parteAtualOrig = [b.textoOriginal];
      parteAtualTTS = b.textoTTS;
    }
  }

  if (parteAtualTTS.trim().length > 0) {
    partes.push({
      id: `parte_${parteIndex}`,
      rotulo: parteIndex === 1 ? "Artigo Completo" : `Parte ${parteIndex}`,
      tipo: parteIndex === 1 ? "artigo_completo" : "continua",
      texto: parteAtualOrig.join("\n\n"),
      textoTTS: parteAtualTTS.trim(),
    });
  }

  if (partes.length > 1) {
    partes.forEach((p, idx) => {
      p.rotulo = `Parte ${idx + 1} de ${partes.length}`;
      if (idx > 0) p.tipo = "continua";
    });
  }

  return partes;
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pcmToWav(pcm: Uint8Array, sampleRate = 24000): Uint8Array {
  const dataSize = pcm.length;
  const wavSize = 44 + dataSize;
  const buf = new ArrayBuffer(wavSize);
  const view = new DataView(buf);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, wavSize - 8, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  const bytes = new Uint8Array(buf);
  bytes.set(pcm, 44);
  return bytes;
}

function concatenarWavs(blobsOrBuffers: Uint8Array[]): Uint8Array {
  if (blobsOrBuffers.length === 0) return new Uint8Array(0);
  if (blobsOrBuffers.length === 1) return blobsOrBuffers[0];

  const pcmChunks: Uint8Array[] = [];
  let totalPcmBytes = 0;

  for (const wav of blobsOrBuffers) {
    if (wav.length <= 44) continue;
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    let pcmOffset = 44;
    let pcmLength = wav.byteLength - 44;

    let offset = 12;
    while (offset < wav.byteLength - 8) {
      const chunkId = String.fromCharCode(
        view.getUint8(offset),
        view.getUint8(offset + 1),
        view.getUint8(offset + 2),
        view.getUint8(offset + 3)
      );
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === "data") {
        pcmOffset = offset + 8;
        pcmLength = Math.min(chunkSize, wav.byteLength - pcmOffset);
        break;
      }
      offset += 8 + chunkSize;
    }

    const pcm = wav.subarray(pcmOffset, pcmOffset + pcmLength);
    pcmChunks.push(pcm);
    totalPcmBytes += pcm.length;
  }

  const outBuffer = new ArrayBuffer(44 + totalPcmBytes);
  const view = new DataView(outBuffer);
  const writeString = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + totalPcmBytes, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 24000, true);
  view.setUint32(28, 48000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, totalPcmBytes, true);

  const outBytes = new Uint8Array(outBuffer);
  let offset = 44;
  for (const chunk of pcmChunks) {
    outBytes.set(chunk, offset);
    offset += chunk.length;
  }
  return outBytes;
}

async function gerarAudioGemini(texto: string, voz: string, estilo: string, key: string): Promise<Uint8Array> {
  const instrucao = `TTS(português brasileiro): ${estilo}.\nNarre de forma clara, contínua e expressiva.\n\n${texto}`;

  const res = await geminiFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: instrucao }] }],
        generationConfig: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Falha Gemini TTS (${res.status}): ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  const audioPart = json.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData?.data);
  const audioData = audioPart?.inlineData?.data;
  if (!audioData) {
    throw new Error("Resposta Gemini TTS sem dados de áudio");
  }

  const pcm = b64ToBytes(audioData);
  return pcmToWav(pcm, 24000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const inicioMs = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const geminiKey = Deno.env.get("GEMINI_AUDIO_API_KEY") || Deno.env.get("GEMINI_API_KEY") || "";

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const isManual = body.manual === true;

    // 1. Lê a configuração atual da tabela narracao_leis_config
    const { data: configRow } = await supabase
      .from("narracao_leis_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    const config = configRow || {
      ativa: false,
      intervalo_minutos: 10,
      tabela_nome: "CP_CODIGO_PENAL",
      lei_id: "cp",
      prioridade: "artigos_maiores",
      voz_padrao: "Kore",
      estilo_tom: "Super animado, vibrante, extremamente fluido, expressivo e cativante, tornando o estudo de Direito leve, envolvente e memorável",
      lote_tamanho: 1,
      artigos_gerados_total: 0,
    };

    if (!isManual && !config.ativa) {
      return new Response(
        JSON.stringify({ ok: true, status: "pausado", message: "Automação cron está pausada no admin" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prioridade = body.prioridade || config.prioridade || "artigos_maiores";
    const voz = body.voz || config.voz_padrao || "Kore";
    const estilo = body.estilo || config.estilo_tom || "Super animado, vibrante, extremamente fluido, expressivo e cativante, tornando o estudo de Direito leve, envolvente e memorável";

    // 1. Identifica a lista de leis ativas para rotação intercalada (Round-Robin)
    const leisAtivas: string[] = Array.isArray(config.leis_ativas) && config.leis_ativas.length > 0
      ? config.leis_ativas
      : [body.tabela_nome || config.tabela_nome || "CP_CODIGO_PENAL"];

    let indiceAtual = typeof config.indice_lei_atual === "number" ? config.indice_lei_atual : 0;
    if (body.tabela_nome) {
      const idx = leisAtivas.indexOf(body.tabela_nome);
      if (idx >= 0) indiceAtual = idx;
    }

    // Busca artigos pendentes alternando entre as leis ativas
    let tabelaAlvo = leisAtivas[indiceAtual % leisAtivas.length];
    let todosArtigos: any[] = [];
    let pendentes: any[] = [];
    let leiIndexEscolhida = indiceAtual % leisAtivas.length;

    for (let i = 0; i < leisAtivas.length; i++) {
      const idxTentativa = (indiceAtual + i) % leisAtivas.length;
      const tabCandidata = leisAtivas[idxTentativa];

      const { data: arts } = await supabase
        .from(tabCandidata)
        .select("id, numero, rotulo, texto, ordem_numero, titulo, capitulo")
        .order("ordem_numero", { ascending: true })
        .limit(1000);

      if (arts && arts.length > 0) {
        const { data: narrados } = await supabase
          .from("narracoes_artigos")
          .select("artigo_numero")
          .eq("tabela_nome", tabCandidata);

        const numerosNarrados = new Set((narrados || []).map((n: any) => String(n.artigo_numero).trim()));
        const pends = arts.filter((a: any) => {
          const numLimpo = String(a.rotulo || a.numero).replace(/^[Aa]rt\.?\s*/, "").trim();
          return !numerosNarrados.has(numLimpo) && !numerosNarrados.has(String(a.numero).trim());
        });

        if (pends.length > 0) {
          tabelaAlvo = tabCandidata;
          todosArtigos = arts;
          pendentes = pends;
          leiIndexEscolhida = idxTentativa;
          break;
        }
      }
    }

    if (pendentes.length === 0) {
      await supabase
        .from("narracao_leis_config")
        .update({ ultimo_status: "concluido - todos os artigos das leis ativas já narrados", updated_at: new Date().toISOString() })
        .eq("id", 1);

      return new Response(
        JSON.stringify({ ok: true, status: "concluido", message: "Todos os artigos das leis ativas já possuem narração gerada!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Ordena por prioridade inteligente (Top Provas + Artigos Maiores)
    if (prioridade === "artigos_maiores") {
      pendentes.sort((a: any, b: any) => {
        const scoreA = calcularScoreArtigo(a, tabelaAlvo);
        const scoreB = calcularScoreArtigo(b, tabelaAlvo);
        return scoreB - scoreA;
      });
    } else {
      pendentes.sort((a: any, b: any) => (a.ordem_numero ?? 0) - (b.ordem_numero ?? 0));
    }

    // Seleciona o artigo topo da fila
    const artigoAlvo = pendentes[0];
    const numAlvo = String(artigoAlvo.rotulo || artigoAlvo.numero).replace(/^[Aa]rt\.?\s*/, "").trim();
    const textoAlvo = artigoAlvo.texto || "";

    console.log(`[Automação] Processando Artigo ${numAlvo} de ${tabelaAlvo} (${textoAlvo.length} chars)`);

    // 6. Fatia em partes contínuas (até ~1 minuto por áudio com introdução da Lei/Capítulo)
    const leiNomeFormatada = tabelaAlvo === "CP_CODIGO_PENAL" ? "Direito Penal" : tabelaAlvo.replace(/_/g, " ");
    const partes = fatiarArtigo(
      textoAlvo,
      numAlvo,
      leiNomeFormatada,
      artigoAlvo.capitulo,
      artigoAlvo.titulo
    );
    console.log(`[Automação] Fatiado em ${partes.length} partes`);

    const partesResultado: Array<any> = [];
    const rawWavBytes: Uint8Array[] = [];

    // 7. Gera áudio para cada parte
    for (let idx = 0; idx < partes.length; idx++) {
      const parte = partes[idx];
      const wavBytes = await gerarAudioGemini(parte.textoTTS, voz, estilo, geminiKey);
      rawWavBytes.push(wavBytes);
      const safeNum = numAlvo.replace(/[^a-zA-Z0-9]/g, "_");
      const storagePath = `narracoes/${tabelaAlvo}/fatiado/${safeNum}_${parte.id}.wav`;

      const { error: upErr } = await supabase.storage
        .from("audios")
        .upload(storagePath, wavBytes, {
          contentType: "audio/wav",
          upsert: true,
          cacheControl: "31536000, immutable",
        });

      if (upErr) console.warn(`Falha upload parte ${parte.id}:`, upErr.message);

      const { data: signed } = await supabase.storage
        .from("audios")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365 * 5);

      const audioUrl = signed?.signedUrl || `${supabaseUrl}/storage/v1/object/public/audios/${storagePath}`;
      const duracaoSegundos = Number((wavBytes.length / (24000 * 2)).toFixed(1));

      partesResultado.push({
        id: parte.id,
        rotulo: parte.rotulo,
        tipo: parte.tipo,
        texto: parte.texto,
        audio_url: audioUrl,
        duracaoSegundos,
      });
    }

    // 8. Áudio principal (se mais de 1 parte, unifica em 1 único WAV contínuo)
    let audioUrlPrincipal = partesResultado[0]?.audio_url || "";
    if (rawWavBytes.length > 1) {
      try {
        const wavUnificado = concatenarWavs(rawWavBytes);
        const safeNum = numAlvo.replace(/[^a-zA-Z0-9]/g, "_");
        const storagePathUnificado = `narracoes/${tabelaAlvo}/fatiado/${safeNum}_art_${safeNum}_completo.wav`;
        const { error: upErr } = await supabase.storage
          .from("audios")
          .upload(storagePathUnificado, wavUnificado, {
            contentType: "audio/wav",
            upsert: true,
            cacheControl: "31536000, immutable",
          });
        if (!upErr) {
          const { data: signed } = await supabase.storage
            .from("audios")
            .createSignedUrl(storagePathUnificado, 60 * 60 * 24 * 365 * 5);
          if (signed?.signedUrl) audioUrlPrincipal = signed.signedUrl;
        }
      } catch (err) {
        console.warn("Falha concatenação automação:", err);
      }
    }

    // 9. Salva em narracoes_artigos
    const { error: insErr } = await supabase.from("narracoes_artigos").upsert(
      {
        tabela_nome: tabelaAlvo,
        artigo_numero: numAlvo,
        lei_nome: tabelaAlvo === "CP_CODIGO_PENAL" ? "Direito Penal" : tabelaAlvo,
        titulo_artigo: artigoAlvo.titulo || null,
        audio_url: audioUrlPrincipal,
        word_timings: { partes: partesResultado },
      },
      { onConflict: "tabela_nome,artigo_numero" }
    );

    if (insErr) {
      console.error("Erro ao salvar em narracoes_artigos:", insErr);
      throw insErr;
    }

    const duracaoTotalMs = Date.now() - inicioMs;

    // 10. Atualiza config e registra log, avançando o round-robin para a próxima lei
    const proximoIndiceLei = (leiIndexEscolhida + 1) % leisAtivas.length;

    await Promise.all([
      supabase.from("narracao_leis_config").update({
        indice_lei_atual: proximoIndiceLei,
        ultimo_disparo: new Date().toISOString(),
        ultimo_artigo_gerado: `${tabelaAlvo} - Artigo ${numAlvo}`,
        artigos_gerados_total: (config.artigos_gerados_total || 0) + 1,
        ultimo_status: "sucesso",
        updated_at: new Date().toISOString(),
      }).eq("id", 1),
      supabase.from("narracao_leis_logs").insert({
        tabela_nome: tabelaAlvo,
        artigo_numero: numAlvo,
        partes_geradas: partes.length,
        status: "sucesso",
        mensagem: `Artigo ${numAlvo} (${textoAlvo.length} chars) fatiado em ${partes.length} partes com voz ${voz}`,
        duracao_ms: duracaoTotalMs,
      }),
    ]);

    return new Response(
      JSON.stringify({
        ok: true,
        artigo: numAlvo,
        tabela_nome: tabelaAlvo,
        partes_geradas: partes.length,
        partes: partesResultado,
        duracao_ms: duracaoTotalMs,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[Automação] Erro fatal:", err);

    await supabase.from("narracao_leis_logs").insert({
      tabela_nome: "desconhecida",
      artigo_numero: "erro",
      partes_geradas: 0,
      status: "erro",
      mensagem: String(err),
      duracao_ms: Date.now() - inicioMs,
    }).catch(() => {});

    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
