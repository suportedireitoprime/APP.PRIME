import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "reset_oab") {
      console.log("Iniciando reset completo das provas da OAB...");

      // 1. Encontrar categorias OAB em simulado_exams
      const { data: oabExams } = await admin
        .from("simulado_exams")
        .select("id, name")
        .or("name.ilike.%OAB%,name.ilike.%Exame de Ordem%");

      let deletedSimulados = 0;
      let deletedSimuladoQuestions = 0;

      if (oabExams && oabExams.length > 0) {
        const examIds = oabExams.map((e: any) => e.id);
        const { data: sims } = await admin
          .from("simulados")
          .select("id")
          .in("exam_id", examIds);

        if (sims && sims.length > 0) {
          const simIds = sims.map((s: any) => s.id);

          // Excluir respostas e histórico dos simulados OAB
          await admin.from("user_simulados_respostas").delete().in("simulado_id", simIds);
          await admin.from("user_simulados_historico").delete().in("simulado_id", simIds);

          // Excluir questões de simulado
          const { count: qCount } = await admin
            .from("simulado_questions")
            .delete({ count: "exact" })
            .in("simulado_id", simIds);
          deletedSimuladoQuestions = qCount || 0;

          // Excluir simulados
          const { count: sCount } = await admin
            .from("simulados")
            .delete({ count: "exact" })
            .in("id", simIds);
          deletedSimulados = sCount || 0;
        }

        // Excluir exames OAB
        await admin.from("simulado_exams").delete().in("id", examIds);
      }

      // 2. Excluir questões da OAB na tabela 'questoes'
      // Identificadores: cargo ilike '%OAB%', orgao ilike '%OAB%', prova ilike '%OAB%', cargo_id = '63fbd266-3c2d-4b91-85b7-25402ff2ac1f'
      const { count: deletedQuestoes } = await admin
        .from("questoes")
        .delete({ count: "exact" })
        .or("cargo.ilike.%OAB%,orgao.ilike.%OAB%,prova.ilike.%OAB%,cargo_id.eq.63fbd266-3c2d-4b91-85b7-25402ff2ac1f,cargo.ilike.%Advogado%");

      // 3. Resetar total de questões do cargo OAB
      await admin
        .from("questoes_cargos")
        .update({ total_questoes: 0, updated_at: new Date().toISOString() })
        .eq("id", "63fbd266-3c2d-4b91-85b7-25402ff2ac1f");

      return new Response(
        JSON.stringify({
          ok: true,
          deletedSimulados,
          deletedSimuladoQuestions,
          deletedQuestoes: deletedQuestoes || 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "import_all_catalog_exams") {
      const { exam_id, exams } = body;
      if (!exam_id || !Array.isArray(exams)) {
        return new Response(JSON.stringify({ error: "exam_id e exams são obrigatórios" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Buscar simulados existentes para evitar duplicatas
      const { data: existingSims } = await admin
        .from("simulados")
        .select("id, prova_url")
        .eq("exam_id", exam_id);

      const existingSet = new Set((existingSims || []).map((s: any) => (s.prova_url || "").toLowerCase().trim()));

      const toInsert: any[] = [];
      for (const ex of exams) {
        const title = (ex.name || "").trim();
        // Se já existe um simulado com essa prova_url ou título, pula
        const alreadyExists = [...existingSet].some(
          (e) => e === title.toLowerCase() || (e.includes("47º") && title.includes("47")) || (e.includes("46º") && title.includes("46")) || (e.includes("45º") && title.includes("45")) || (e.includes("44º") && title.includes("44")) || (e.includes("43º") && title.includes("43"))
        );

        if (!alreadyExists) {
          toInsert.push({
            exam_id,
            year: Number(ex.year) || 2024,
            prova_url: title,
            gabarito_url: ex.gabaritoUrl || null,
            edital_url: ex.editalUrl || null,
          });
        }
      }

      let insertedCount = 0;
      // Inserir em lotes de 50
      for (let i = 0; i < toInsert.length; i += 50) {
        const batch = toInsert.slice(i, i + 50);
        const { error: insErr } = await admin.from("simulados").insert(batch);
        if (insErr) throw insErr;
        insertedCount += batch.length;
      }

      // Retornar contagem total atual de simulados do exame
      const { count: totalAtual } = await admin
        .from("simulados")
        .select("id", { count: "exact", head: true })
        .eq("exam_id", exam_id);

      return new Response(
        JSON.stringify({
          ok: true,
          novosInseridos: insertedCount,
          totalSimuladosOAB: totalAtual,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create_oab_exam") {
      const examName = body.name || "OAB (Exame de Ordem)";
      let { data: exam } = await admin
        .from("simulado_exams")
        .select("id, name")
        .eq("name", examName)
        .maybeSingle();

      if (!exam) {
        const { data: newExam, error: errExam } = await admin
          .from("simulado_exams")
          .insert({ name: examName })
          .select("id, name")
          .single();
        if (errExam) throw errExam;
        exam = newExam;
      }

      return new Response(JSON.stringify({ ok: true, exam }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "import_simulado_sheet") {
      const {
        exam_id,
        cargo_id,
        year,
        prova_title,
        prova_url,
        gabarito_url,
        edital_url,
        questions,
      } = body;

      // 1. Criar o registro na tabela simulados
      const { data: simulado, error: simErr } = await admin
        .from("simulados")
        .insert({
          exam_id,
          year: Number(year) || new Date().getFullYear(),
          prova_url: prova_title || "Exame de Ordem",
          gabarito_url: gabarito_url || null,
          edital_url: edital_url || null,
        })
        .select()
        .single();

      if (simErr) throw simErr;
      const simuladoId = simulado.id;

      // 2. Mapear para simulado_questions
      const simuladoQuestionsPayload = questions.map((q: any) => ({
        simulado_id: simuladoId,
        disciplina: q.disciplina || "",
        assunto: q.assunto || "",
        text: q.texto_questao || "",
        options: {
          A: q.alternativa_a || "",
          B: q.alternativa_b || "",
          C: q.alternativa_c || "",
          D: q.alternativa_d || "",
          E: q.alternativa_e || "",
        },
        gabarito: (q.resposta_correta || "A").trim().toUpperCase(),
        correct_comment: q.comentario_correta || "",
        incorrect_comment: q.comentario_incorretas || "",
      }));

      // Inserir em lotes de 100
      for (let i = 0; i < simuladoQuestionsPayload.length; i += 100) {
        const batch = simuladoQuestionsPayload.slice(i, i + 100);
        const { error: sqErr } = await admin.from("simulado_questions").insert(batch);
        if (sqErr) throw sqErr;
      }

      // 3. Mapear para a tabela 'questoes' (para a área de Questões)
      const questoesPayload = questions.map((q: any) => {
        const fullComentario = [
          q.comentario_correta ? `Gabarito Comentado:\n${q.comentario_correta}` : "",
          q.comentario_incorretas ? `Análise das Demais Alternativas:\n${q.comentario_incorretas}` : "",
        ]
          .filter(Boolean)
          .join("\n\n") || null;

        return {
          cargo: "Advogado (Exame de Ordem)",
          cargo_id: cargo_id || "63fbd266-3c2d-4b91-85b7-25402ff2ac1f",
          nivel: "intermediario",
          disciplina: q.disciplina || "",
          assunto: q.assunto || "",
          ano: Number(year) || 2026,
          banca: q.banca || "FGV",
          orgao: "OAB",
          prova: prova_title || `FGV - ${year} - OAB - Exame de Ordem`,
          numero_questao: String(q.numero_questao || ""),
          enunciado: q.texto_questao || "",
          alt_a: q.alternativa_a || null,
          alt_b: q.alternativa_b || null,
          alt_c: q.alternativa_c || null,
          alt_d: q.alternativa_d || null,
          alt_e: q.alternativa_e || null,
          gabarito_oficial: (q.resposta_correta || "A").trim().toUpperCase(),
          gabarito_comentado: fullComentario,
          hash_dedup: q.hash_dedup,
          origem: "planilha_oab_drive",
          ativo: true,
        };
      });

      // Inserir na tabela 'questoes' em lotes de 100
      for (let i = 0; i < questoesPayload.length; i += 100) {
        const batch = questoesPayload.slice(i, i + 100);
        const { error: qErr } = await admin.from("questoes").insert(batch);
        if (qErr) throw qErr;
      }

      return new Response(
        JSON.stringify({
          ok: true,
          simulado_id: simuladoId,
          total_questions: questions.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "finalize_metrics") {
      const cargoId = body.cargo_id || "63fbd266-3c2d-4b91-85b7-25402ff2ac1f";

      // 1. Contar total de questões ativas da OAB
      const { count: totalOAB } = await admin
        .from("questoes")
        .select("id", { count: "exact", head: true })
        .eq("cargo_id", cargoId);

      // 2. Atualizar questoes_cargos
      await admin
        .from("questoes_cargos")
        .update({
          total_questoes: totalOAB || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cargoId);

      // 3. Obter contagem por simulados
      const { data: oabExams } = await admin
        .from("simulado_exams")
        .select("id, name")
        .or("name.ilike.%OAB%,name.ilike.%Exame de Ordem%");

      let simuladosMetrics = [];
      if (oabExams && oabExams.length > 0) {
        const { data: sims } = await admin
          .from("simulados")
          .select("id, year, prova_url, created_at")
          .in("exam_id", oabExams.map((e: any) => e.id))
          .order("year", { ascending: false });

        if (sims) {
          for (const s of sims) {
            const { count: sqCount } = await admin
              .from("simulado_questions")
              .select("id", { count: "exact", head: true })
              .eq("simulado_id", s.id);
            simuladosMetrics.push({
              id: s.id,
              year: s.year,
              prova: s.prova_url,
              questionsCount: sqCount || 0,
            });
          }
        }
      }

      // 4. Obter contagem por disciplina
      const { data: questoesDisc } = await admin
        .from("questoes")
        .select("disciplina")
        .eq("cargo_id", cargoId);

      const disciplinasCount: Record<string, number> = {};
      for (const q of questoesDisc || []) {
        const d = (q as any).disciplina || "Não especificada";
        disciplinasCount[d] = (disciplinasCount[d] || 0) + 1;
      }

      return new Response(
        JSON.stringify({
          ok: true,
          totalQuestoesOAB: totalOAB || 0,
          totalSimulados: simuladosMetrics.length,
          simulados: simuladosMetrics,
          disciplinas: disciplinasCount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Ação não suportada" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erro em importar-provas-oab:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
