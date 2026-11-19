import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { findVideoaulaByVideoId } from "@/data/videoaulas/videoaulasDriveData";
import { formatarTituloEditorial } from "@/lib/videoaulasCatalogos";

export type VideoaulaTabela =
  | "videoaulas_areas_direito"
  | "videoaulas_iniciante"
  | "videoaulas_oab_primeira_fase"
  | "videoaulas_oab_segunda_fase";

export type AulaAcaoTipo =
  | "flashcards" | "lacunas" | "conceito"
  | "pegadinhas" | "mapa" | "cornell"
  | "feynman" | "topicos" | "tradicional" | "fichamento" | "comparativa"
  | "lei" | "questoes" | "termos";

export interface AulaCtxInput {
  videoId: string;
  titulo: string;
  tabela?: VideoaulaTabela;
  area?: string;
  conteudo?: string | null;
  descricao?: string | null;
}

async function fetchAcao(body: Record<string, unknown>) {
  const videoId = body.videoId as string;
  const tipo = body.tipo as AulaAcaoTipo;

  // Intercepta itens do catálogo oficial (100% completos do Drive)
  const driveItem = findVideoaulaByVideoId(videoId);
  if (driveItem) {
    if (tipo === "questoes") {
      return {
        questoes: driveItem.questoes.map((q) => ({
          enunciado: q.enunciado,
          a: q.opcoes[0] || "",
          b: q.opcoes[1] || "",
          c: q.opcoes[2] || "",
          d: q.opcoes[3] || "",
          gabarito: q.correta,
          comentario: q.explicacao,
        })),
      };
    }
    if (tipo === "flashcards" || tipo === "lacunas" || tipo === "conceito") {
      return {
        cards: driveItem.flashcards.map((f) => ({
          frente: f.frente,
          verso: f.verso,
        })),
      };
    }
    if (tipo === "mapa") {
      return {
        raiz: driveItem.titulo,
        pdfUrl: driveItem.mapaMentalUrl,
        ramos: [
          { titulo: "Fundamentos", topicos: [driveItem.canal, `Duração: ${driveItem.duracao}`] },
          { titulo: "Download em PDF", topicos: ["Mapa mental esquematizado de alta resolução disponível"] },
        ],
      };
    }
    if (tipo === "cornell") {
      return {
        titulo: driveItem.titulo,
        resumo: driveItem.transcricao.slice(0, 600) + "...",
        pdfUrl: driveItem.resumoCornellUrl,
        perguntas_chave: driveItem.flashcards.slice(0, 4).map((f) => ({
          pergunta: f.frente,
          resposta: f.verso,
        })),
        sintese: `Aula completa ministrada por ${driveItem.canal} (${driveItem.duracao}).`,
      };
    }
    if (tipo === "tradicional" || tipo === "topicos" || tipo === "feynman" || tipo === "fichamento") {
      return {
        titulo: driveItem.titulo,
        introducao: `Aula ministrada por ${driveItem.canal} (${driveItem.duracao}). Transcrição e materiais completos.`,
        desenvolvimento: driveItem.transcricao.slice(0, 1500) + "...",
        conclusao: "Material completo com resumos, mapa mental e questões estruturadas.",
        pdfUrl: driveItem.resumoCompletoUrl,
      };
    }
  }

  // Verifica o cache diretamente pelo cliente primeiro para máxima velocidade
  if (body.tabela && body.videoId && body.tipo) {
    const { data: cached } = await supabase
      .from("videoaulas_acao_cache")
      .select("payload")
      .eq("tabela", body.tabela as string)
      .eq("video_id", body.videoId as string)
      .eq("tipo", body.tipo as string)
      .maybeSingle();
      
    if (cached?.payload) {
      return cached.payload;
    }
  }

  // Se não estiver no cache, chama a IA (Edge Function)
  const { data, error } = await supabase.functions.invoke("videoaula-acao-ia", { body });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.payload as unknown;
}

export function useVideoaulaAcao(
  input: AulaCtxInput | null,
  tipo: AulaAcaoTipo,
  enabled: boolean,
) {
  const tabela = input?.tabela ?? "videoaulas_areas_direito";
  return useQuery({
    queryKey: ["videoaula-acao", "v2", tabela, input?.videoId, tipo],
    queryFn: () =>
      fetchAcao({
        tipo,
        tabela,
        videoId: input!.videoId,
        titulo: input!.titulo,
        area: input!.area ?? "",
        conteudo: input!.conteudo ?? "",
        descricao: input!.descricao ?? "",
      }),
    enabled: !!input && enabled,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 1,
  });
}

export function useVideoaulaResumo(
  input: { videoId: string; titulo: string; area?: string; tabela?: VideoaulaTabela } | null,
) {
  const tabela = input?.tabela ?? "videoaulas_areas_direito";
  return useQuery({
    queryKey: ["videoaula-resumo", tabela, input?.videoId],
    queryFn: async () => {
      const driveItem = findVideoaulaByVideoId(input?.videoId);
      if (driveItem) {
        const tituloFormatado = formatarTituloEditorial(driveItem.titulo);
        const topicos = driveItem.flashcards?.length
          ? driveItem.flashcards.slice(0, 6).map(f => `* **${f.frente}**: ${f.verso}`).join('\n')
          : '';
        const intro = driveItem.transcricao?.length
          ? driveItem.transcricao.slice(0, 850).trim() + '...'
          : 'Conteúdo da aula gravado e disponível nos materiais complementares.';

        const md = [
          `### ${tituloFormatado}`,
          `*Professor / Canal*: **${driveItem.canal}** · *Duração*: **${driveItem.duracao}**`,
          topicos ? `\n#### Pontos e Conceitos Fundamentais:\n${topicos}` : '',
          `\n#### Síntese Inicial da Matéria:\n${intro}`,
        ].filter(Boolean).join('\n\n');

        return {
          area: driveItem.categoria === "iniciantes" ? "Fundamentos do Direito" : "Áreas do Direito",
          tema: driveItem.titulo,
          resumo: md,
        };
      }
      const { data, error } = await supabase.functions.invoke("videoaula-resumo", {
        body: { tabela, videoId: input!.videoId, titulo: input!.titulo, area: input!.area ?? "" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { area: string; tema: string; resumo: string };
    },
    enabled: !!input?.videoId,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}
