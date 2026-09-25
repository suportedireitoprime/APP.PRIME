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
      estilo_tom: "Animado e envolvente, como professora jovem de Direito",
      lote_tamanho: 1,
      artigos_gerados_total: 0,
    };

    if (!isManual && !config.ativa) {
      return new Response(
        JSON.stringify({ ok: true, status: "pausado", message: "Automação cron está pausada no admin" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tabelaAlvo = body.tabela_nome || config.tabela_nome || "CP_CODIGO_PENAL";
    const prioridade = body.prioridade || config.prioridade || "artigos_maiores";
    const voz = body.voz || config.voz_padrao || "Kore";
    const estilo = body.estilo || config.estilo_tom || "Animado e envolvente, como professora jovem de Direito";

    // 2. Busca artigos da lei alvo
    const { data: todosArtigos, error: errArtigos } = await supabase
      .from(tabelaAlvo)
      .select("id, numero, rotulo, texto, ordem_numero, titulo, capitulo")
      .order("ordem_numero", { ascending: true })
      .limit(1000);

    if (errArtigos || !todosArtigos || todosArtigos.length === 0) {
      throw new Error(`Erro ao buscar artigos de ${tabelaAlvo}: ${errArtigos?.message || "nenhum artigo encontrado"}`);
    }

    // 3. Busca artigos que já possuem narração
    const { data: narrados, error: errNarrados } = await supabase
      .from("narracoes_artigos")
      .select("artigo_numero")
      .eq("tabela_nome", tabelaAlvo);

    const numerosNarrados = new Set((narrados || []).map((n: any) => String(n.artigo_numero).trim()));

    // 4. Filtra apenas os pendentes
    const pendentes = todosArtigos.filter((a: any) => {
      const numLimpo = String(a.rotulo || a.numero).replace(/^[Aa]rt\.?\s*/, "").trim();
      return !numerosNarrados.has(numLimpo) && !numerosNarrados.has(String(a.numero).trim());
    });

    if (pendentes.length === 0) {
      await supabase
        .from("narracao_leis_config")
        .update({ ultimo_status: "concluido - todos os artigos já narrados", updated_at: new Date().toISOString() })
        .eq("id", 1);

      return new Response(
        JSON.stringify({ ok: true, status: "concluido", message: "Todos os artigos desta lei já possuem narração gerada!" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Ordena por prioridade
    if (prioridade === "artigos_maiores") {
      // Artigos maiores (mais densos, mais caracteres) primeiro!
      pendentes.sort((a: any, b: any) => {
        const lenA = (a.texto || "").length;
        const lenB = (b.texto || "").length;
        return lenB - lenA;
      });
    } else {
      // Ordem numérica normal
      pendentes.sort((a: any, b: any) => (a.ordem_numero ?? 0) - (b.ordem_numero ?? 0));
    }

    // Seleciona o artigo topo da fila
    const artigoAlvo = pendentes[0];
    const numAlvo = String(artigoAlvo.rotulo || artigoAlvo.numero).replace(/^[Aa]rt\.?\s*/, "").trim();
    const textoAlvo = artigoAlvo.texto || "";

    console.log(`[Automação] Processando Artigo ${numAlvo} de ${tabelaAlvo} (${textoAlvo.length} chars)`);

    // 6. Fatia em partes contínuas (até ~1 minuto por áudio com introdução da Lei/Capítulo)
    const leiNomeFormatada = tabelaAlvo === "CP_CODIGO_PENAL" ? "Código Penal" : tabelaAlvo.replace(/_/g, " ");
    const partes = fatiarArtigo(
      textoAlvo,
      numAlvo,
      leiNomeFormatada,
      artigoAlvo.capitulo,
      artigoAlvo.titulo
    );
    console.log(`[Automação] Fatiado em ${partes.length} partes`);

    const partesResultado: Array<any> = [];

    // 7. Gera áudio para cada parte
    for (let idx = 0; idx < partes.length; idx++) {
      const parte = partes[idx];
      const wavBytes = await gerarAudioGemini(parte.textoTTS, voz, estilo, geminiKey);
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

    // 8. Áudio principal (caput ou primeiro bloco)
    const audioUrlPrincipal = partesResultado[0]?.audio_url || "";

    // 9. Salva em narracoes_artigos
    const { error: insErr } = await supabase.from("narracoes_artigos").upsert(
      {
        tabela_nome: tabelaAlvo,
        artigo_numero: numAlvo,
        lei_nome: tabelaAlvo === "CP_CODIGO_PENAL" ? "Código Penal" : tabelaAlvo,
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

    // 10. Atualiza config e registra log
    await Promise.all([
      supabase.from("narracao_leis_config").update({
        ultimo_disparo: new Date().toISOString(),
        ultimo_artigo_gerado: `Artigo ${numAlvo}`,
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
