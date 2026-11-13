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

    // Desativação preventiva de jobs e chamadas acidentais para poupar conexões e CPU do banco
    const isManual = req.headers.get("x-manual-import") === "true" || body?.manual === true;
    if (!isManual && action !== "stats") {
      return new Response(
        JSON.stringify({
          message: "Importação desativada. Envie 'manual: true' para acionar pontualmente.",
          status: "disabled"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // 0. Estatísticas atuais
    if (action === "stats") {
      const { count: cardsCount } = await admin.from("flashcards_cards").select("id", { count: "exact", head: true });
      const { count: progCount } = await admin.from("flashcards_progresso").select("id", { count: "exact", head: true });
      const { count: deckCount } = await admin.from("flashcards_deck_itens").select("id", { count: "exact", head: true });
      const { data: areasData } = await admin.from("flashcards_areas").select("area, slug, total_cards");

      return new Response(
        JSON.stringify({
          cardsCount: cardsCount || 0,
          progCount: progCount || 0,
          deckCount: deckCount || 0,
          areas: areasData || [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Reset completo dos flashcards antigos
    if (action === "reset") {
      console.log("Iniciando exclusão dos flashcards antigos...");
      const startTime = Date.now();

      // Exclui progresso e itens de decks associados (em lotes de 100 para respeitar limite de URL do PostgREST)
      try {
        while (true) {
          const { data: chunk } = await admin.from("flashcards_deck_itens").select("id").limit(100);
          if (!chunk || chunk.length === 0) break;
          const ids = chunk.map((c: any) => c.id);
          await admin.from("flashcards_deck_itens").delete().in("id", ids);
        }
      } catch (e: any) {
        console.warn("Aviso ao limpar deck itens:", e.message);
      }

      try {
        while (true) {
          const { data: chunk } = await admin.from("flashcards_progresso").select("id").limit(100);
          if (!chunk || chunk.length === 0) break;
          const ids = chunk.map((c: any) => c.id);
          await admin.from("flashcards_progresso").delete().in("id", ids);
        }
      } catch (e: any) {
        console.warn("Aviso ao limpar progresso:", e.message);
      }

      // Exclusão por área primeiro (rápida, sem limite de URL)
      try {
        const { data: areasList } = await admin.from("flashcards_areas").select("area");
        if (areasList && areasList.length > 0) {
          for (const item of areasList) {
            if (item.area) {
              await admin.from("flashcards_cards").delete().eq("area", item.area);
            }
          }
        }
      } catch (e: any) {
        console.warn("Aviso ao deletar por área:", e.message);
      }

      // Exclui quaisquer cartões remanescentes em lotes de 100 IDs
      let totalDeleted = 0;
      while (true) {
        if (Date.now() - startTime > 45000) {
          return new Response(
            JSON.stringify({
              success: true,
              deletedCards: totalDeleted,
              partial: true,
              message: "Deleção parcial por tempo limite. Chamar novamente se restarem cards.",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: chunk, error: selErr } = await admin
          .from("flashcards_cards")
          .select("id")
          .limit(100);

        if (selErr) {
          throw new Error(`Erro ao buscar lote para exclusão: ${selErr.message}`);
        }

        if (!chunk || chunk.length === 0) break;

        const ids = chunk.map((c: any) => c.id);
        const { error: delErr } = await admin
          .from("flashcards_cards")
          .delete()
          .in("id", ids);

        if (delErr) {
          throw new Error(`Erro ao excluir lote de flashcards: ${delErr.message}`);
        }

        totalDeleted += ids.length;
      }

      // Também limpa flashcards_areas para recriação limpa
      await admin.from("flashcards_areas").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      return new Response(
        JSON.stringify({
          success: true,
          deletedCards: totalDeleted,
          partial: false,
          message: "Tabelas de flashcards limpas com sucesso.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Inserção de lote de flashcards
    if (action === "insert_batch") {
      const { cards } = body;
      if (!Array.isArray(cards) || cards.length === 0) {
        return new Response(
          JSON.stringify({ success: true, count: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await admin
        .from("flashcards_cards")
        .insert(cards);

      if (error) {
        throw new Error(`Erro ao inserir lote: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, inserted: cards.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "cleanup_test") {
      await admin.from("flashcards_cards").delete().eq("area", "Teste Speed");
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // 3. Recálculo das áreas e métricas
    if (action === "recalculate_areas") {
      const { areas } = body;
      console.log("Recalculando métricas e áreas dos flashcards...");

      if (Array.isArray(areas) && areas.length > 0) {
        for (const item of areas) {
          await admin
            .from("flashcards_areas")
            .upsert(
              {
                area: item.area,
                slug: item.slug,
                total_cards: item.total_cards,
                ordem: item.ordem || 99,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "slug" }
            );
        }
      }

      // Tenta acionar RPC de recount se existir
      try {
        await admin.rpc("flashcards_recontar_areas");
      } catch (e: any) {
        console.log("RPC flashcards_recontar_areas não disparado ou inexistente:", e.message);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Métricas e áreas atualizadas com sucesso." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Ação desconhecida: ${action}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Erro em importar-flashcards:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
