import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface ConcursoMCPItem {
  id: number;
  titulo: string;
  cargos_resumo?: string;
  cargos?: string[];
  vagas_salario?: string;
  formacao?: string;
  regiao?: string;
  uf?: string | null;
  datas?: {
    inicio?: string;
    fim?: string;
    texto?: string;
    aberto?: boolean;
    dias_restantes?: number;
  };
  noticia?: {
    id?: number;
    titulo?: string;
    link?: string;
    imagem?: string;
  };
  apostila?: string | null;
}

serve(async (req: Request) => {
  try {
    console.log("Iniciando sincronização via MCP Oficial PCI Concursos...");

    // 1. Inicializar sessão MCP
    const initRes = await fetch("https://mcp.pciconcursos.com.br/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "app-prime", version: "1.0.0" }
        }
      })
    });

    if (!initRes.ok) {
      throw new Error(`Falha ao inicializar MCP: status ${initRes.status}`);
    }

    // 2. Chamar ferramenta listar_concursos
    const callRes = await fetch("https://mcp.pciconcursos.com.br/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "listar_concursos",
          arguments: {}
        }
      })
    });

    if (!callRes.ok) {
      throw new Error(`Falha na chamada da tool MCP: status ${callRes.status}`);
    }

    const callJson = await callRes.json();
    const rawText = callJson.result?.content?.[0]?.text;
    if (!rawText) {
      throw new Error("Resposta MCP não continha texto estruturado");
    }

    const parsed = JSON.parse(rawText);
    const concursosRaw: ConcursoMCPItem[] = parsed.data || [];
    console.log(`Recebidos ${concursosRaw.length} concursos do MCP (Total meta: ${parsed.meta?.total || 0})`);

    // 3. Normalizar e preparar os dados para o Supabase
    const rowsToUpsert = concursosRaw
      .filter(item => (item.noticia?.link || item.id) && (item.noticia?.titulo || item.titulo))
      .map(item => {
        const link = item.noticia?.link || `https://www.pciconcursos.com.br/concursos/${item.id}`;
        const titulo = item.noticia?.titulo || item.titulo;
        const resumo = item.cargos_resumo
          ? `${item.cargos_resumo}${item.vagas_salario ? ' · ' + item.vagas_salario : ''}`
          : item.vagas_salario || 'Inscrições abertas para concurso público.';

        const uf = item.uf ? item.uf.trim().toUpperCase() : (item.regiao === 'NACIONAL' ? 'NACIONAL' : null);
        const regiao = item.regiao ? item.regiao.trim().toUpperCase() : null;
        const imagem_url = item.noticia?.imagem || null;

        return {
          pci_id: item.id,
          titulo,
          link,
          resumo,
          imagem_url,
          uf,
          regiao,
          cargos: Array.isArray(item.cargos) ? item.cargos : [],
          cargos_resumo: item.cargos_resumo || null,
          vagas_salario: item.vagas_salario || null,
          formacao: item.formacao || null,
          data_inicio: item.datas?.inicio || null,
          data_fim: item.datas?.fim || null,
          dias_restantes: typeof item.datas?.dias_restantes === 'number' ? item.datas.dias_restantes : null,
          data_publicacao: item.datas?.inicio ? new Date(item.datas.inicio).toISOString() : new Date().toISOString()
        };
      });

    // 4. Salvar em lotes (batch upsert de 50 em 50 para máxima performance)
    let totalSalvos = 0;
    const batchSize = 50;
    for (let i = 0; i < rowsToUpsert.length; i += batchSize) {
      const batch = rowsToUpsert.slice(i, i + batchSize);
      const { error: upsertErr } = await supabase
        .from("concursos_noticias")
        .upsert(batch, { onConflict: "link" });

      if (upsertErr) {
        console.error(`Erro ao salvar lote ${i}-${i + batch.length}:`, upsertErr.message);
      } else {
        totalSalvos += batch.length;
      }
    }

    console.log(`Sincronização concluída com sucesso! Total salvos/atualizados: ${totalSalvos}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `${totalSalvos} concursos públicos sincronizados com dados do MCP.`,
        totalRecebido: concursosRaw.length,
        totalSalvo: totalSalvos,
        meta: parsed.meta
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error("Erro geral no sincronizador MCP de concursos:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});
