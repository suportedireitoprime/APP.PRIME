import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { geminiFetch } from "../_shared/geminiFetch.ts";
import { notificarBoletimPronto } from "../_shared/boletimNotify.ts";
import { logAiCall } from "../_shared/ai-log.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

const TTS_MODEL = "gemini-2.5-flash-preview-tts";
const TEXT_MODEL = "gemini-3.1-flash-lite";
const BUCKET_AUDIO = "boletins-audio";

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pcmToWav(pcm: Uint8Array, sampleRate = 24000): { wav: Uint8Array; durationS: number } {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm.length;
  const wavSize = 44 + dataSize;
  const buf = new ArrayBuffer(wavSize);
  const view = new DataView(buf);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  view.setUint32(4, wavSize - 8, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  w(36, "data");
  view.setUint32(40, dataSize, true);
  const bytes = new Uint8Array(buf);
  bytes.set(pcm, 44);
  const durationS = dataSize / byteRate;
  return { wav: bytes, durationS };
}

async function gerarTTS(
  texto: string,
  voz: string,
  promptExtra: string,
): Promise<{ wav: Uint8Array; durationS: number }> {
  const prompt =
    `${promptExtra}\n\nLeia em português brasileiro, exatamente o texto abaixo, sem repetir instruções:\n\n${texto}`;
  const _t0 = Date.now();
  const res = await geminiFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } },
          },
        },
      }),
    },
  );
  const data = await res.json();
  if (!res.ok || data?.error) {
    await logAiCall({ functionName: "boletim-legislativo-gerar", kind: "tts", model: TTS_MODEL, triggerType: "auto", inputUnits: texto.length, success: false, error: String(data?.error?.message ?? res.status).slice(0, 200), durationMs: Date.now() - _t0 });
    throw new Error(`TTS falhou: ${res.status} ${JSON.stringify(data?.error || data).slice(0, 300)}`);
  }
  await logAiCall({ functionName: "boletim-legislativo-gerar", kind: "tts", model: TTS_MODEL, triggerType: "auto", inputUnits: texto.length, durationMs: Date.now() - _t0 });
  const audioPart = data.candidates?.[0]?.content?.parts?.find(
    (p: any) => p?.inlineData?.data,
  );
  const b64 = audioPart?.inlineData?.data;
  if (!b64) throw new Error("TTS sem áudio na resposta");
  const pcm = base64ToBytes(b64);
  return pcmToWav(pcm);
}

async function gerarRoteirosGemini(
  normas: Array<{ tipo_ato: string; numero_ato: string; ementa: string; autor_nome: string }>,
): Promise<Array<{ titulo: string; resumo: string }>> {
  const lista = normas
    .map((n, i) => {
      return `[${i + 1}] PROPOSTA: ${n.tipo_ato} ${n.numero_ato}\nAUTOR: ${n.autor_nome}\nEMENTA: ${n.ementa}`;
    })
    .join("\n\n---\n\n");

  const prompt = `Você é redator do "Boletim Legislativo" — um mini-podcast que explica projetos de lei.
Para cada proposta abaixo, produza:
- "titulo": o número da proposta, ex: "PL 1234/2024"
- "resumo": narração curta em português brasileiro explicando: O QUE O DEPUTADO QUER e UM EXEMPLO PRÁTICO de como isso afeta as pessoas. Sem jurídiques complicado, linguagem de fácil acesso e leiga. NÃO cite artigos por número. MÁXIMO de 50 palavras por resumo.

Retorne SOMENTE JSON válido no formato:
{ "normas": [ { "titulo": "...", "resumo": "..." } ] }

NORMAS:
${lista}`;

  const _t0 = Date.now();
  const res = await geminiFetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TEXT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
      }),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    await logAiCall({ functionName: "boletim-legislativo-gerar", kind: "text", model: TEXT_MODEL, triggerType: "auto", success: false, error: String(res.status).slice(0, 200), durationMs: Date.now() - _t0 });
    throw new Error(`Roteiro falhou: ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  }
  const _u = data?.usageMetadata ?? {};
  await logAiCall({ functionName: "boletim-legislativo-gerar", kind: "text", model: TEXT_MODEL, triggerType: "auto", inputUnits: _u.promptTokenCount ?? 0, outputUnits: _u.candidatesTokenCount ?? 0, durationMs: Date.now() - _t0 });
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed?.normas) ? parsed.normas : [];
  return arr.map((x: any) => ({
    titulo: String(x?.titulo || "").trim(),
    resumo: String(x?.resumo || "").trim(),
  }));
}

function hojeBRT(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supa = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const dataRef = (body.dataRef as string) || hojeBRT();
    const triggeredBy = (body.triggeredBy as string) || null;

    // Config
    const { data: cfg } = await supa
      .from("boletim_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
      
    const voz = cfg?.legislativo_voz_id || "Kore";
    const promptExtra =
      cfg?.legislativo_prompt_tts_extra ||
      "Narração explicativa, didática e acessível, ritmo moderado.";
    const maxNormas = cfg?.legislativo_max_itens || 5;

    // 1. Fetch Proposicoes
    const resCamara = await fetch(`https://dadosabertos.camara.leg.br/api/v2/proposicoes?ordem=DESC&ordenarPor=id&itens=\${maxNormas}&siglaTipo=PL,PEC,PLP`, { headers: { 'Accept': 'application/json' } });
    if (!resCamara.ok) throw new Error("Falha ao buscar proposições da câmara");
    const jsonCamara = await resCamara.json();
    const filtradas = jsonCamara.dados || [];
    
    if (filtradas.length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "sem_leis", dataRef, message: "Nenhuma PL encontrada." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Cria registro (gerando)
    const tituloBd = `Radar Legislativo — \${new Date(dataRef + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}`;
    const { data: existente } = await supa
      .from("boletins_juridicos")
      .select("id")
      .eq("data_ref", dataRef)
      .eq("tipo", "legislativo")
      .maybeSingle();
      
    let boletimId = existente?.id;
    
    if (!boletimId) {
      const { data: boletim, error: insErr } = await supa
        .from("boletins_juridicos")
        .insert({
          data_ref: dataRef,
          titulo: tituloBd,
          tipo: "legislativo",
          subtitulo: `\${filtradas.length} \${filtradas.length === 1 ? "proposta detalhada" : "propostas detalhadas"}`,
          status: "gerando",
          gerado_por: triggeredBy,
          roteiro_json: [],
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      boletimId = boletim.id;
    } else {
      await supa.from("boletins_juridicos").update({ status: "gerando" }).eq("id", boletimId);
    }

    // 3. Fetch Authors and Photos
    const roteirosParams = [];
    for (const p of filtradas) {
        let urlFoto = "";
        let autorNome = "Deputado/Senador";
        try {
            const resAutores = await fetch(`https://dadosabertos.camara.leg.br/api/v2/proposicoes/\${p.id}/autores`, { headers: { 'Accept': 'application/json' } });
            if (resAutores.ok) {
               const jAutores = await resAutores.json();
               if (jAutores.dados && jAutores.dados.length > 0) {
                   autorNome = jAutores.dados[0].nome;
                   const uri = jAutores.dados[0].uri;
                   if (uri) {
                      const resDep = await fetch(uri, { headers: { 'Accept': 'application/json' } });
                      if (resDep.ok) {
                         const jDep = await resDep.json();
                         if (jDep.dados && jDep.dados.ultimoStatus && jDep.dados.ultimoStatus.urlFoto) {
                            urlFoto = jDep.dados.ultimoStatus.urlFoto;
                         }
                      }
                   }
               }
            }
        } catch(e) {}
        roteirosParams.push({
           tipo_ato: p.siglaTipo,
           numero_ato: p.numero + "/" + p.ano,
           ementa: p.ementa,
           autor_nome: autorNome,
           urlFoto: urlFoto,
           url: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=\${p.id}`
        });
    }

    // 4. Gemini Script Generation
    const roteiros = await gerarRoteirosGemini(roteirosParams);
    
    const scenes: any[] = [];
    // Intro
    const intro = `Radar Legislativo de \${new Date(dataRef + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}. Resumimos de forma prática o que os deputados propuseram hoje na câmara.`;
    scenes.push({ kind: "intro", tipo: "legislativo", titulo: "Radar Legislativo", texto: intro, cor_hex: "#B91C1C", tipo_label: "Radar Legislativo" });

    // Normas
    for (let i = 0; i < roteirosParams.length; i++) {
      const src = roteirosParams[i];
      const g = roteiros[i];
      const titulo = g?.titulo || `\${src.tipo_ato} \${src.numero_ato}`;
      const resumo = g?.resumo || src.ementa.slice(0, 400);
      scenes.push({ 
        kind: "norma", 
        tipo: "legislativo", 
        titulo, 
        texto: resumo, 
        url_fonte: src.url,
        imagem_url: src.urlFoto, 
        autor_nome: src.autor_nome,
        cor_hex: "#B91C1C", // Painel vermelho
        tipo_label: "Projeto de Lei",
        imagem_fonte: src.urlFoto ? 'url' : 'tipo_padrao'
      });
    }

    scenes.push({
      kind: "outro",
      tipo: "legislativo",
      titulo: "Até a próxima!",
      texto:
        "Esse foi o Radar Legislativo. Fique por dentro de tudo que tramita no congresso aqui no Vacatio.",
      cor_hex: "#B91C1C",
      tipo_label: "Radar Legislativo"
    });

    // 5. Gera TTS
    const audioUrls: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const s = scenes[i];
      const { wav, durationS } = await gerarTTS(s.texto, voz, promptExtra);
      const path = `\${boletimId}/\${String(i).padStart(2, "0")}-legis.wav`;
      const up = await supa.storage.from(BUCKET_AUDIO).upload(path, wav, {
        contentType: "audio/wav",
        upsert: true,
        cacheControl: "31536000, immutable",
      });
      if (up.error) throw up.error;
      const { data: signed } = await supa.storage
        .from(BUCKET_AUDIO)
        .createSignedUrl(path, 60 * 60 * 24 * 30);
      const url = signed?.signedUrl || "";
      s.audio_url = url;
      s.audio_path = path;
      s.duracao_s = Math.max(2, Math.round(durationS * 10) / 10);
      audioUrls.push(url);
    }

    const duracaoTotal = scenes.reduce((acc, s) => acc + (s.duracao_s || 0), 0);

    await supa
      .from("boletins_juridicos")
      .update({
        status: "pronto",
        roteiro_json: scenes,
        audio_urls: audioUrls,
        duracao_s: Math.round(duracaoTotal),
      })
      .eq("id", boletimId);

    // 6. Push
    if (cfg?.enviar_push !== false) {
      await notificarBoletimPronto({
        supa,
        boletimId,
        tipo: "legislativo",
        titulo: tituloBd,
        totalCenas: filtradas.length,
        duracaoS: duracaoTotal,
        automationKey: "boletim_legislativo_diario",
        pushEmoji: "🏛️",
        labelUnidade: filtradas.length === 1 ? "proposta detalhada" : "propostas detalhadas",
      });
    }

    return new Response(
      JSON.stringify({ boletim_id: boletimId, duracao_s: Math.round(duracaoTotal), cenas: scenes.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("boletim-legislativo-gerar erro:", e);

    try {
      const body = await req.json().catch(() => ({}));
      const fallbackDataRef = (body.dataRef as string) || hojeBRT();
      await supa.from("boletins_juridicos")
          .update({ status: "erro", erro: String((e as Error).message || e) })
          .eq("data_ref", fallbackDataRef)
          .eq("tipo", "legislativo")
          .eq("status", "gerando");
    } catch (_) {}

    return new Response(
      JSON.stringify({ error: String((e as Error).message || e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});