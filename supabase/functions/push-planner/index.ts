import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    let reqBody: any = {};
    try { reqBody = await req.clone().json(); } catch(e) {}
    
    // O planner gerará campanhas para os próximos 7 dias
    const diasPlanejamento = reqBody.dias || 7;
    
    const hoje = new Date();
    const campanhasToInsert = [];

    // Fetch random items for each slot to guarantee variety
    // Dicionário
    const { data: dicIds } = await admin.from("dicionario_juridico").select("id, palavra");
    // Audioaulas
    const { data: audioIds } = await admin.from("audioaulas_itens").select("id, titulo");
    // Videoaulas
    const { data: videoIds } = await admin.from("videoaulas_itens").select("id, titulo");
    // Blog
    const { data: blogIds } = await admin.from("blog_posts").select("id, titulo, slug").eq("published", true);

    for (let i = 0; i < diasPlanejamento; i++) {
      const targetDate = new Date(hoje);
      targetDate.setDate(targetDate.getDate() + i);
      
      const getDateWithHour = (hour: number) => {
        const d = new Date(targetDate);
        d.setHours(hour, 0, 0, 0);
        return d.toISOString();
      };

      // 06:00 Boletim Matinal
      campanhasToInsert.push({
        title: "🌅 Boletim Push: Matinal",
        body: "Bom dia, {nome}! Veja as atualizações jurídicas de hoje para começar o dia informado.",
        status: "scheduled",
        next_run_at: getDateWithHour(6),
        audience: { all: true },
        automation_key: "planner-matinal"
      });

      // 08:00 Explicações CF88/Leis
      campanhasToInsert.push({
        title: "📚 Hora do Estudo: CF88 e Leis",
        body: "As leis mudam rápido, {nome}. Tire 5 minutos agora para se atualizar com nossas explicações recentes.",
        status: "scheduled",
        next_run_at: getDateWithHour(8),
        audience: { all: true },
        automation_key: "planner-leis"
      });

      // 10:00 Dicionário Jurídico
      let dicItem = { palavra: "Jurisprudência" };
      if (dicIds && dicIds.length > 0) {
        dicItem = dicIds[Math.floor(Math.random() * dicIds.length)];
      }
      campanhasToInsert.push({
        title: `📖 Você sabe o que é ${dicItem.palavra}?`,
        body: `{nome}, venha conferir o significado dessa palavra no nosso Dicionário Jurídico e aumente seu vocabulário.`,
        status: "scheduled",
        next_run_at: getDateWithHour(10),
        url: `/dicionario`,
        audience: { all: true },
        automation_key: "planner-dicionario"
      });

      // 12:00 Sugestão de Leitura
      campanhasToInsert.push({
        title: "📖 Sugestão de Leitura para o almoço",
        body: "Aproveite a pausa para conferir um livro estratégico na nossa biblioteca.",
        status: "scheduled",
        next_run_at: getDateWithHour(12),
        url: `/biblioteca`,
        audience: { all: true },
        automation_key: "planner-livro"
      });

      // 14:00 Áudio-aula Explicativa
      let audioItem = { titulo: "uma audioaula surpresa", id: "" };
      if (audioIds && audioIds.length > 0) {
        audioItem = audioIds[Math.floor(Math.random() * audioIds.length)];
      }
      campanhasToInsert.push({
        title: "🎧 Coloque o fone de ouvido, {nome}",
        body: `Sua tarde pede uma revisão: ${audioItem.titulo}. Aproveite para revisar enquanto faz outras atividades!`,
        status: "scheduled",
        next_run_at: getDateWithHour(14),
        url: audioItem.id ? `/audioaulas?play_id=${audioItem.id}` : `/audioaulas`,
        audience: { all: true },
        automation_key: "planner-audio"
      });

      // 16:00 Pílula Jurídica
      let blogItem = { titulo: "novo artigo", slug: "" };
      if (blogIds && blogIds.length > 0) {
        blogItem = blogIds[Math.floor(Math.random() * blogIds.length)];
      }
      campanhasToInsert.push({
        title: "💊 Pílula Jurídica da Tarde",
        body: `Revisão rápida de Doutrina/Jurisprudência: ${blogItem.titulo}. Leitura de 2 minutinhos!`,
        status: "scheduled",
        next_run_at: getDateWithHour(16),
        url: blogItem.slug ? `/blog/${blogItem.slug}` : `/blog`,
        audience: { all: true },
        automation_key: "planner-blog"
      });

      // 18:00 Boletim Push: Noturno
      campanhasToInsert.push({
        title: "🌆 Resumo do Expediente",
        body: "Fechando o dia de estudos! {nome}, veja as decisões que movimentaram os tribunais hoje.",
        status: "scheduled",
        next_run_at: getDateWithHour(18),
        audience: { all: true },
        automation_key: "planner-noturno"
      });

      // 20:00 Questão Prática
      campanhasToInsert.push({
        title: "🧠 Fixação Noturna",
        body: "Bora resolver algumas questões antes de relaxar, {nome}? A prática leva à perfeição.",
        status: "scheduled",
        next_run_at: getDateWithHour(20),
        url: `/questoes`,
        audience: { all: true },
        automation_key: "planner-questao"
      });

      // 22:00 Audioaula de Revisão
      campanhasToInsert.push({
        title: "🌙 Áudio-aula para dormir gravando",
        body: "Deite, feche os olhos e ouça esse áudio curto de revisão passiva. Bons estudos, {nome}!",
        status: "scheduled",
        next_run_at: getDateWithHour(22),
        url: `/audioaulas`,
        audience: { all: true },
        automation_key: "planner-audio-noite"
      });

      // 00:00 Videoaula (Madrugada)
      let videoItem = { titulo: "uma videoaula coringa" };
      if (videoIds && videoIds.length > 0) {
        videoItem = videoIds[Math.floor(Math.random() * videoIds.length)];
      }
      campanhasToInsert.push({
        title: "🦉 Coruja dos Concursos",
        body: `Ainda acordado(a)? Assista a esta aula rápida: ${videoItem.titulo}. Depois, vá descansar!`,
        status: "scheduled",
        next_run_at: getDateWithHour(0),
        url: `/aprender`,
        audience: { all: true },
        automation_key: "planner-video-madrugada"
      });
    }

    // Antes de inserir, apagamos agendamentos futuros não enviados para evitar duplicidade
    const deleteFrom = new Date(hoje);
    deleteFrom.setHours(0,0,0,0);
    
    await admin.from("push_campaigns")
      .delete()
      .eq("status", "scheduled")
      .gte("next_run_at", deleteFrom.toISOString())
      .like("automation_key", "planner-%");

    const { error: insertError } = await admin.from("push_campaigns").insert(campanhasToInsert);
    
    if (insertError) throw insertError;

    return json({ ok: true, generated: campanhasToInsert.length });
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
