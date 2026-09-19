const fs = require('fs');

async function main() {
  const apiKey = "REMOVIDO_POR_SEGURANCA";
  const prompt = "Artigo 3 do Cdigo Penal. A lei excepcional ou temporria, embora decorrido o perodo de sua durao ou cessadas as circunstncias que a determinaram, aplica-se ao fato praticado durante sua vigncia.";
  const voiceName = "Puck"; // Masculine voice
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
  
  console.log("Generating audio...");
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        response_modalities: ["AUDIO"],
        speech_config: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Error generating audio:", JSON.stringify(data, null, 2));
    return;
  }

  const audioBase64 = data?.candidates?.[0]?.content?.parts?.find(p => p?.inlineData?.data)?.inlineData?.data;
  if (audioBase64) {
    const buffer = Buffer.from(audioBase64, 'base64');
    fs.writeFileSync('public/artigo_3_masculino.wav', buffer);
    console.log("Saved public/artigo_3_masculino.wav!");
  } else {
    console.error("No audio found in response.", JSON.stringify(data, null, 2));
  }
}

main();
