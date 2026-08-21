// Edge function: generate TTS narration per scene for admin triagem preview.
// Uses Gemini API with Gemini TTS (google/gemini-2.5-flash-tts).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

type SceneIn = { id: string; text: string };
type Body = { voice?: string; scenes: SceneIn[]; model?: string };



async function speakOne(text: string, voice: string, model: string): Promise<string> {
  const prompt = `Fale em português brasileiro, com tom acolhedor, ritmo natural e sem pressa: ${text}`;
  const res = await fetch('https://ai.gateway.Gemini.dev/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GEMINI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        },
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Response(
      JSON.stringify({ error: `TTS ${res.status}`, detail: err }),
      { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    bin += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export const handler = (async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const body = (await req.json()) as Body;
    const voice = (body.voice || 'Kore').toString();
    const model = (body.model || 'gemini-2.5-flash-tts').toString();
    const scenes = Array.isArray(body.scenes) ? body.scenes.slice(0, 30) : [];
    if (!scenes.length) {
      return new Response(JSON.stringify({ error: 'no scenes' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const out: { id: string; audioBase64: string; mime: string }[] = [];
    for (const s of scenes) {
      const text = (s.text || '').trim();
      if (!text) continue;
      try {
        const audioBase64 = await speakOne(text, voice, model);
        out.push({ id: s.id, audioBase64, mime: 'audio/wav' });
      } catch (e) {
        if (e instanceof Response) return e;
        throw e;
      }
    }
    return new Response(JSON.stringify({ scenes: out }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message || 'internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
