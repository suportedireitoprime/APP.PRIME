require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const automation_key = "push-aleatorio-audio-1";

  // Pick a random audioaula
  const { data: allIds } = await supabase.from("audioaulas_itens").select("id");
  if (!allIds || allIds.length === 0) {
    console.log("No audioaulas found");
    return;
  }

  const randomId = allIds[Math.floor(Math.random() * allIds.length)].id;

  const { data: item } = await supabase
    .from("audioaulas_itens")
    .select("id, titulo, curso_id, audioaulas_cursos(titulo)")
    .eq("id", randomId)
    .single();

  const cursoTitulo = item.audioaulas_cursos?.titulo || "Curso Especial";
  const title = `🎧 Audioaula do Dia: Dê o play a caminho do trabalho`;
  const body = `Revisão de ${cursoTitulo}: ${item.titulo}. Comece o dia já revisando um conteúdo importante enquanto se desloca.`;
  const url = `/aprender`;

  const { data: campaign, error: campErr } = await supabase
    .from("push_campaigns")
    .insert({
      title,
      body,
      url,
      audience: { all: true },
      status: "sending",
      tipo: "audio",
      automation_key,
    })
    .select("id")
    .single();

  if (campErr) {
    console.error("Failed to insert campaign", campErr);
    return;
  }

  console.log("Campaign created:", campaign.id);

  // trigger send-push
  const { data: pushData, error: pushErr } = await supabase.functions.invoke("send-push", {
    body: {
      campaign_id: campaign.id,
      title,
      body,
      url,
      audience: { all: true },
      personalize: true,
    },
  });

  console.log("Send-push trigger:", pushErr || pushData);
}

run();
