import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.0";
import {
  mergeCleanedPages,
  normalizeMarkdownPages,
  normalizeOcrMarkdown,
} from "./markdown-cleanup.ts";
import { geminiFetch } from "../_shared/geminiFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY")!;
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a resume request (JSON body)
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (body.action === "resume" && body.livro_id) {
        // @ts-ignore
        EdgeRuntime.waitUntil(
          resumeCleaning({
            supabaseUrl,
            supabaseServiceKey,
            geminiApiKey,
            livroId: body.livro_id,
          })
        );
        return new Response(
          JSON.stringify({ success: true, message: "Retomando processamento" }),
          { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (body.action === "fetch_cover" && body.livro_id) {
        const { data: book, error: bookErr } = await supabase
          .from("biblioteca_livros")
          .select("titulo, autor, user_id")
          .eq("id", body.livro_id)
          .single();
        if (bookErr || !book) {
          return new Response(JSON.stringify({ error: "Livro não encontrado" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Clean title: remove numeric prefixes like "11. " or "1 - "
        const cleanTitle = (book.titulo || "").replace(/^\d+[\s.\-–—:]+/, "").trim();
        const author = book.autor || "";
        const query = encodeURIComponent(
          author ? `${cleanTitle} inauthor:${author}` : cleanTitle
        );
        const gbUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&langRestrict=pt&maxResults=3`;
        console.log(`fetch_cover: searching "${cleanTitle}" by "${author}"`);

        let coverUrl: string | null = null;
        try {
          const gbRes = await fetch(gbUrl);
          if (gbRes.ok) {
            const gbData = await gbRes.json();
            for (const item of (gbData.items || [])) {
              const thumb = item.volumeInfo?.imageLinks?.thumbnail;
              if (thumb) {
                const hiRes = thumb.replace("zoom=1", "zoom=2").replace("&edge=curl", "").replace("http://", "https://");
                coverUrl = await downloadAndUploadCover(hiRes, supabase, book.user_id, body.livro_id);
                if (coverUrl) break;
              }
            }
          }
        } catch (e) {
          console.warn("fetch_cover Google Books error:", e);
        }

        if (coverUrl) {
          await supabase.from("biblioteca_livros").update({ capa_url: coverUrl }).eq("id", body.livro_id);
          return new Response(JSON.stringify({ success: true, capa_url: coverUrl }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Capa não encontrada" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.action === "restructure" && body.livro_id) {
        const { data: book, error: bookErr } = await supabase
          .from("biblioteca_livros")
          .select("conteudo, total_paginas, user_id")
          .eq("id", body.livro_id)
          .single();
        if (bookErr || !book) {
          return new Response(JSON.stringify({ error: "Livro não encontrado" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (book.user_id !== user.id) {
          return new Response(JSON.stringify({ error: "Não autorizado" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const conteudo = (book.conteudo as any[]).map((p: any) => ({ pagina: p.pagina, markdown: p.markdown }));
        await supabase.from("biblioteca_livros").update({ status: "structuring" }).eq("id", body.livro_id);

        // @ts-ignore
        EdgeRuntime.waitUntil((async () => {
          const sb = createClient(supabaseUrl, supabaseServiceKey);
          try {
            const estrutura = await structureWithGemini(geminiApiKey, conteudo, book.total_paginas);
            // Populate pages with markdown
            for (const ch of estrutura.chapters) {
              if (!ch.pages || ch.pages.length === 0) {
                const skipSet = new Set(estrutura.skip_pages || []);
                ch.pages = [];
                for (let pg = ch.start_source_page; pg <= ch.end_source_page; pg++) {
                  if (skipSet.has(pg)) continue;
                  const found = conteudo.find((p: any) => p.pagina === pg);
                  if (found) ch.pages.push({ source_page: pg, markdown: found.markdown });
                }
              }
            }
            await sb.from("biblioteca_livros").update({ estrutura_leitura: estrutura, status: "ready" }).eq("id", body.livro_id);
          } catch (e) {
            console.error("Restructure error:", e);
            await sb.from("biblioteca_livros").update({ status: "ready", erro_detalhe: "Falha ao reindexar capítulos" }).eq("id", body.livro_id);
          }
        })());

        return new Response(
          JSON.stringify({ success: true, message: "Reindexação iniciada" }),
          { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // URL-based processing: download PDF from URL (e.g. Google Drive) and process
      if (body.url && body.titulo) {
        const pdfUrl = body.url as string;
        const titulo = body.titulo as string;
        const autor = (body.autor as string) || null;
        const capaUrl = (body.capa_url as string) || null;

        // Download PDF from URL (handle Google Drive confirm)
        let downloadUrl = pdfUrl;
        const driveMatch = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch) {
          downloadUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}&confirm=t`;
        }

        console.log(`URL processing: downloading from ${downloadUrl}`);
        const pdfRes = await fetch(downloadUrl, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        if (!pdfRes.ok) {
          return new Response(JSON.stringify({ error: "Falha ao baixar PDF", status: pdfRes.status }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const pdfBuffer = await pdfRes.arrayBuffer();

        // Upload to storage
        const filePath = `${user.id}/${crypto.randomUUID()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("biblioteca")
          .upload(filePath, pdfBuffer, { contentType: "application/pdf" });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          return new Response(JSON.stringify({ error: "Falha no upload" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: publicUrlData } = supabase.storage.from("biblioteca").getPublicUrl(filePath);
        const pdfPublicUrl = publicUrlData.publicUrl;

        const { data: livro, error: insertError } = await supabase
          .from("biblioteca_livros")
          .insert({
            user_id: user.id,
            titulo,
            autor,
            capa_url: capaUrl,
            status: "ocr",
            tamanho_bytes: pdfBuffer.byteLength,
            conteudo: [],
            versao_processamento: 2,
          })
          .select("id")
          .single();

        if (insertError || !livro) {
          console.error("Insert error:", insertError);
          return new Response(JSON.stringify({ error: "Falha ao criar registro" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // @ts-ignore
        EdgeRuntime.waitUntil(
          processPdfInBackground({
            supabaseUrl,
            supabaseServiceKey,
            mistralApiKey,
            geminiApiKey,
            livroId: livro.id,
            pdfPublicUrl,
            userId: user.id,
          })
        );

        return new Response(
          JSON.stringify({ success: true, livro_id: livro.id, message: "Processamento iniciado" }),
          { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const titulo = (formData.get("titulo") as string) || "Sem título";

    if (!file) {
      return new Response(JSON.stringify({ error: "Nenhum arquivo enviado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileExt = file.name.split(".").pop() || "pdf";
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("biblioteca")
      .upload(filePath, fileBuffer, { contentType: file.type || "application/pdf" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Falha no upload do PDF" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrlData } = supabase.storage.from("biblioteca").getPublicUrl(filePath);
    const pdfPublicUrl = publicUrlData.publicUrl;

    const { data: livro, error: insertError } = await supabase
      .from("biblioteca_livros")
      .insert({
        user_id: user.id,
        titulo,
        status: "ocr",
        tamanho_bytes: file.size,
        conteudo: [],
        versao_processamento: 2,
      })
      .select("id")
      .single();

    if (insertError || !livro) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Falha ao criar registro" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // @ts-ignore
    EdgeRuntime.waitUntil(
      processPdfInBackground({
        supabaseUrl,
        supabaseServiceKey,
        mistralApiKey,
        geminiApiKey,
        pdfPublicUrl,
        userId: user.id,
        livroId: livro.id,
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        livro_id: livro.id,
        status: "processing",
        message: "Processamento iniciado",
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Types ───────────────────────────────────────────────────────────

interface ProcessPdfInBackgroundParams {
  supabaseUrl: string;
  supabaseServiceKey: string;
  mistralApiKey: string;
  geminiApiKey: string;
  pdfPublicUrl: string;
  userId: string;
  livroId: string;
}

interface GeminiChapter {
  title: string;
  start_source_page: number;
  end_source_page: number;
  pages: { source_page: number; markdown: string }[];
}

interface EstruturaLeitura {
  version: number;
  title: string;
  content_start_page?: number;
  skip_pages?: number[];
  chapters: GeminiChapter[];
}

interface ResumeCleaningParams {
  supabaseUrl: string;
  supabaseServiceKey: string;
  geminiApiKey: string;
  livroId: string;
}

// ── Helpers ─────────────────────────────────────────────────────────

async function markBookAsError(supabase: any, livroId: string, message: string) {
  await supabase
    .from("biblioteca_livros")
    .update({ status: "error", erro_detalhe: message.slice(0, 500) })
    .eq("id", livroId);
}

function buildOcrErrorMessage(errText: string) {
  let userMessage = `OCR: ${errText.slice(0, 500)}`;
  try {
    const errJson = JSON.parse(errText);
    if (errJson.type === "document_parser_too_many_pages" || String(errJson.code) === "3730") {
      userMessage = "O PDF tem mais de 1000 páginas, que é o limite máximo do OCR. Tente dividir o PDF em partes menores.";
    }
  } catch (_) { /* ignore */ }
  return userMessage;
}

function buildFallbackStructure(
  conteudo: { pagina: number; markdown: string }[],
  totalPages: number
): EstruturaLeitura {
  return {
    version: 2,
    title: "Livro",
    chapters: [{
      title: "Conteúdo",
      start_source_page: 1,
      end_source_page: totalPages,
      pages: conteudo.map(p => ({ source_page: p.pagina, markdown: p.markdown })),
    }],
  };
}

// ── Background PDF Processing ───────────────────────────────────────

async function processPdfInBackground({
  supabaseUrl,
  supabaseServiceKey,
  mistralApiKey,
  geminiApiKey,
  pdfPublicUrl,
  userId,
  livroId,
}: ProcessPdfInBackgroundParams) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Calling Mistral OCR for:", pdfPublicUrl);
    const ocrResponse = await fetch("https://api.mistral.ai/v1/ocr", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: { type: "document_url", document_url: pdfPublicUrl },
        include_image_base64: true,
      }),
    });

    if (!ocrResponse.ok) {
      const errText = await ocrResponse.text();
      console.error("Mistral OCR error:", errText);
      await markBookAsError(supabase, livroId, buildOcrErrorMessage(errText));
      return;
    }

    const ocrData = await ocrResponse.json();
    const ocrPages = ocrData.pages || [];

    const conteudo: { pagina: number; markdown: string }[] = [];
    const imagensToInsert: { livro_id: string; pagina: number; url: string; alt_text: string }[] = [];

    for (let i = 0; i < ocrPages.length; i++) {
      const page = ocrPages[i];
      let markdown = page.markdown || "";

      if (page.images && page.images.length > 0) {
        for (const img of page.images) {
          if (img.image_base64) {
            const imgId = crypto.randomUUID();
            const imgPath = `${userId}/${livroId}/img_${i}_${imgId}.png`;
            const base64Data = img.image_base64.replace(/^data:image\/\w+;base64,/, "");
            const binaryStr = atob(base64Data);
            const bytes = new Uint8Array(binaryStr.length);
            for (let j = 0; j < binaryStr.length; j++) {
              bytes[j] = binaryStr.charCodeAt(j);
            }

            const { error: imgUploadErr } = await supabase.storage
              .from("biblioteca")
              .upload(imgPath, bytes.buffer, { contentType: "image/png" });

            if (!imgUploadErr) {
              const { data: imgUrlData } = supabase.storage.from("biblioteca").getPublicUrl(imgPath);
              if (img.id && markdown.includes(img.id)) {
                markdown = markdown.replace(
                  new RegExp(`!\\[.*?\\]\\(${img.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "g"),
                  `![Imagem](${imgUrlData.publicUrl})`
                );
              } else {
                // Orphan image: not referenced in markdown, append at end
                markdown += `\n\n![Imagem](${imgUrlData.publicUrl})`;
              }
              imagensToInsert.push({
                livro_id: livroId,
                pagina: i + 1,
                url: imgUrlData.publicUrl,
                alt_text: img.id || `Imagem página ${i + 1}`,
              });
            }
          }
        }
      }

      conteudo.push({ pagina: i + 1, markdown: normalizeOcrMarkdown(markdown) });
    }

    if (imagensToInsert.length > 0) {
      await supabase.from("biblioteca_imagens").insert(imagensToInsert);
    }

    // Fetch book cover from Google Books
    let capaUrl: string | null = null;
    try {
      capaUrl = await fetchBookCover(geminiApiKey, conteudo, supabase, userId, livroId);
    } catch (e) {
      console.warn("Book cover fetch failed:", e);
    }

    if (!capaUrl) {
      const firstPageImages = imagensToInsert.filter((img) => img.pagina === 1);
      if (firstPageImages.length > 0) {
        capaUrl = firstPageImages[0].url;
      }
    }

    await supabase
      .from("biblioteca_livros")
      .update({
        conteudo,
        total_paginas: ocrPages.length,
        status: "structuring",
        ...(capaUrl ? { capa_url: capaUrl } : {}),
      })
      .eq("id", livroId);

    console.log("Calling Gemini to structure chapters...");
    const estruturaLeitura = await structureWithGemini(geminiApiKey, conteudo, ocrPages.length);

    await supabase
      .from("biblioteca_livros")
      .update({
        estrutura_leitura: estruturaLeitura,
        total_paginas: ocrPages.length,
      })
      .eq("id", livroId);

    console.log("Cleaning edge pages with Gemini (first/last 10)...");

    // Collect all pages flat
    const allPagesFlat: { ci: number; pi: number; source_page: number; markdown: string }[] = [];
    for (let ci = 0; ci < estruturaLeitura.chapters.length; ci++) {
      const ch = estruturaLeitura.chapters[ci];
      if (!ch.pages) continue;
      for (let pi = 0; pi < ch.pages.length; pi++) {
        allPagesFlat.push({ ci, pi, source_page: ch.pages[pi].source_page, markdown: ch.pages[pi].markdown });
      }
    }

    const EDGE = 10;
    const firstEdge = allPagesFlat.filter((_, i) => i < EDGE);
    const lastEdge = allPagesFlat.filter((_, i) => i >= allPagesFlat.length - EDGE && i >= EDGE);
    const middlePages = allPagesFlat.filter((_, i) => i >= EDGE && i < allPagesFlat.length - EDGE);

    await supabase.from("biblioteca_livros").update({ status: "cleaning:10" }).eq("id", livroId);

    // Clean first 10 with AI
    const cleanedFirst = await cleanEdgePages(geminiApiKey, firstEdge.map(p => ({ source_page: p.source_page, markdown: p.markdown })));
    for (const cp of cleanedFirst) {
      const entry = firstEdge.find(p => p.source_page === cp.source_page);
      if (entry) estruturaLeitura.chapters[entry.ci].pages![entry.pi].markdown = cp.markdown;
    }

    // Normalize middle pages (deterministic only)
    await supabase.from("biblioteca_livros").update({ status: "cleaning:50" }).eq("id", livroId);
    for (const mp of middlePages) {
      const normalized = normalizeMarkdownPages([{ source_page: mp.source_page, markdown: mp.markdown }]);
      estruturaLeitura.chapters[mp.ci].pages![mp.pi].markdown = normalized[0].markdown;
    }

    // Clean last 10 with AI
    await supabase.from("biblioteca_livros").update({ status: "cleaning:80" }).eq("id", livroId);
    if (lastEdge.length > 0) {
      const cleanedLast = await cleanEdgePages(geminiApiKey, lastEdge.map(p => ({ source_page: p.source_page, markdown: p.markdown })));
      for (const cp of cleanedLast) {
        const entry = lastEdge.find(p => p.source_page === cp.source_page);
        if (entry) estruturaLeitura.chapters[entry.ci].pages![entry.pi].markdown = cp.markdown;
      }
    }

    const { error: updateError } = await supabase
      .from("biblioteca_livros")
      .update({
        estrutura_leitura: estruturaLeitura,
        versao_processamento: 2,
        total_paginas: ocrPages.length,
        status: "ready",
      })
      .eq("id", livroId);

    if (updateError) {
      console.error("Update error:", updateError);
      await markBookAsError(supabase, livroId, updateError.message);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Background processing error:", errorMessage);
    await markBookAsError(supabase, livroId, errorMessage);
  }
}

// ── Gemini structuring ──────────────────────────────────────────────

async function structureWithGemini(
  apiKey: string,
  conteudo: { pagina: number; markdown: string }[],
  totalPages: number
): Promise<EstruturaLeitura> {
  // AI Structuring disabled by user request. Using native fallback.
  return buildFallbackStructure(conteudo, totalPages);
}

// ── Gemini edge-page cleaning (first/last pages only) ───────────────

async function cleanEdgePages(
  apiKey: string,
  pages: { source_page: number; markdown: string }[]
): Promise<{ source_page: number; markdown: string }[]> {
  // AI Cleaning disabled by user request. Returning normalized deterministic pages.
  return normalizeMarkdownPages(pages);
}

// ── Resume cleaning for interrupted processing ──────────────────────

async function resumeCleaning({
  supabaseUrl,
  supabaseServiceKey,
  geminiApiKey,
  livroId,
}: ResumeCleaningParams) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: livro } = await supabase
      .from("biblioteca_livros")
      .select("status, estrutura_leitura")
      .eq("id", livroId)
      .single();

    if (!livro || !livro.status.startsWith("cleaning:")) {
      console.log("Resume: book not in cleaning state, skipping");
      return;
    }

    const estrutura = livro.estrutura_leitura as EstruturaLeitura;
    if (!estrutura?.chapters) {
      console.error("Resume: no chapters found");
      await markBookAsError(supabase, livroId, "Estrutura de capítulos não encontrada para retomar");
      return;
    }

    console.log(`Resuming cleaning for book ${livroId}...`);

    // Collect ALL pages across chapters with their chapter index
    const allPages: { ci: number; pi: number; source_page: number; markdown: string }[] = [];
    for (let ci = 0; ci < estrutura.chapters.length; ci++) {
      const ch = estrutura.chapters[ci];
      if (!ch.pages) continue;
      for (let pi = 0; pi < ch.pages.length; pi++) {
        allPages.push({ ci, pi, source_page: ch.pages[pi].source_page, markdown: ch.pages[pi].markdown });
      }
    }

    const totalPagesAll = allPages.length;
    if (totalPagesAll === 0) {
      await supabase.from("biblioteca_livros").update({ status: "ready", versao_processamento: 2 }).eq("id", livroId);
      return;
    }

    const EDGE_SIZE = 10;
    const firstEdge = allPages.filter((_, i) => i < EDGE_SIZE);
    const lastEdge = allPages.filter((_, i) => i >= totalPagesAll - EDGE_SIZE && i >= EDGE_SIZE);
    const middlePages = allPages.filter((_, i) => i >= EDGE_SIZE && i < totalPagesAll - EDGE_SIZE);
    const pagesProcessed = firstEdge.length + middlePages.length + lastEdge.length;

    console.log(`Cleaning: ${firstEdge.length} first + ${lastEdge.length} last pages with AI, ${middlePages.length} middle pages normalized only`);

    // 1) Clean first edge pages with AI
    await supabase.from("biblioteca_livros").update({ status: "cleaning:10" }).eq("id", livroId);
    const cleanedFirst = await cleanEdgePages(geminiApiKey, firstEdge.map(p => ({ source_page: p.source_page, markdown: p.markdown })));
    for (const cp of cleanedFirst) {
      const entry = firstEdge.find(p => p.source_page === cp.source_page);
      if (entry) estrutura.chapters[entry.ci].pages![entry.pi].markdown = cp.markdown;
    }

    // 2) Normalize middle pages (deterministic only — fast)
    await supabase.from("biblioteca_livros").update({ status: "cleaning:50" }).eq("id", livroId);
    for (const mp of middlePages) {
      const normalized = normalizeMarkdownPages([{ source_page: mp.source_page, markdown: mp.markdown }]);
      estrutura.chapters[mp.ci].pages![mp.pi].markdown = normalized[0].markdown;
    }

    // 3) Clean last edge pages with AI
    await supabase.from("biblioteca_livros").update({ status: "cleaning:80" }).eq("id", livroId);
    let cleanedLastCount = 0;
    if (lastEdge.length > 0) {
      const cleanedLast = await cleanEdgePages(geminiApiKey, lastEdge.map(p => ({ source_page: p.source_page, markdown: p.markdown })));
      cleanedLastCount = cleanedLast.length;
      for (const cp of cleanedLast) {
        const entry = lastEdge.find(p => p.source_page === cp.source_page);
        if (entry) estrutura.chapters[entry.ci].pages![entry.pi].markdown = cp.markdown;
      }
    }

    console.log(`Resume complete: first=${cleanedFirst.length}, middle=${middlePages.length}, last=${cleanedLastCount}, total=${pagesProcessed}`);

    const { error: finalizeError } = await supabase
      .from("biblioteca_livros")
      .update({
        estrutura_leitura: estrutura,
        versao_processamento: 2,
        status: "ready",
      })
      .eq("id", livroId);

    if (finalizeError) {
      throw finalizeError;
    }

    console.log(`Resume finalized successfully for book ${livroId}`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Resume cleaning error:", errorMessage);
    await markBookAsError(supabase, livroId, errorMessage);
  }
}

// ── Book Cover Fetch (Google Books API) ─────────────────────────────

async function fetchBookCover(
  geminiApiKey: string,
  conteudo: { pagina: number; markdown: string }[],
  supabase: any,
  userId: string,
  livroId: string
): Promise<string | null> {
  // Extracting title/author with AI disabled by user request.
  return null;
}

async function downloadAndUploadCover(
  imageUrl: string,
  supabase: any,
  userId: string,
  livroId: string
): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.warn("Cover download failed:", imgRes.status);
      return null;
    }

    const imgBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const coverPath = `${userId}/${livroId}/cover.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("biblioteca")
      .upload(coverPath, imgBuffer, { contentType, upsert: true });

    if (uploadErr) {
      console.warn("Cover upload failed:", uploadErr);
      return null;
    }

    const { data } = supabase.storage.from("biblioteca").getPublicUrl(coverPath);
    console.log("Book cover uploaded:", data.publicUrl);
    return data.publicUrl;
  } catch (e) {
    console.warn("Cover download error:", e);
    return null;
  }
}
