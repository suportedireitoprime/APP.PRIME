/**
 * scrape_dados_datas.ts
 * =====================
 * Raspa a seção "Dados e Datas" de cada ministro do STF na biblioteca do portal,
 * extrai os eventos (Indicação, Posse, Aposentadoria etc.) e os PDFs associados,
 * envia cada PDF para a Mistral Files API + OCR, e salva o resultado estruturado
 * na coluna `dados_e_datas` (JSONB) da tabela `stf_ministros`.
 *
 * Uso:
 *   deno run --allow-net --allow-read --allow-env --unsafely-ignore-certificate-errors scrape_dados_datas.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";
import "https://deno.land/std@0.210.0/dotenv/load.ts";

// ── Config ────────────────────────────────────────────────────────
const supabase = createClient(
  Deno.env.get('VITE_SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const MISTRAL_API_KEY = Deno.env.get('MISTRAL_API_KEY') || '';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// ── Helpers ───────────────────────────────────────────────────────

function sanitizeName(name: string): string {
  const noAccents = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const parts = noAccents.split(' ').filter(p => !['de', 'da', 'do', 'das', 'dos'].includes(p.toLowerCase()));
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
}

async function sleep(ms: number) {
  await new Promise(r => setTimeout(r, ms));
}

/**
 * Faz OCR de um PDF via Mistral Files API + OCR endpoint.
 * Retorna o texto extraído ou null em caso de falha.
 */
async function ocrPdfViaMistral(pdfUrl: string, label: string): Promise<string | null> {
  if (!MISTRAL_API_KEY) {
    console.warn(`  [SKIP OCR] MISTRAL_API_KEY não configurada`);
    return null;
  }

  try {
    // 1) Baixar o PDF
    console.log(`    [OCR] Baixando PDF: ${pdfUrl}`);
    const pdfResp = await fetch(pdfUrl, { headers: HEADERS });
    if (!pdfResp.ok) {
      console.warn(`    [OCR] Falha ao baixar PDF (${pdfResp.status})`);
      return null;
    }
    const pdfBytes = new Uint8Array(await pdfResp.arrayBuffer());
    if (pdfBytes.length < 100) {
      console.warn(`    [OCR] PDF muito pequeno (${pdfBytes.length} bytes), pulando`);
      return null;
    }

    // 2) Upload para Mistral Files API
    console.log(`    [OCR] Enviando ao Mistral (${pdfBytes.length} bytes)...`);
    const form = new FormData();
    form.append("purpose", "ocr");
    form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), `${label}.pdf`);

    let upResp: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      upResp = await fetch("https://api.mistral.ai/v1/files", {
        method: "POST",
        headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` },
        body: form,
      });
      if (upResp.ok) break;
      if (upResp.status === 429 || upResp.status >= 500) {
        console.warn(`    [OCR] Upload retry ${attempt}/3 (${upResp.status})`);
        await sleep(2000 * attempt);
        continue;
      }
      console.warn(`    [OCR] Upload falhou: ${upResp.status}`);
      return null;
    }
    if (!upResp || !upResp.ok) return null;

    const fileData = await upResp.json();
    const fileId = fileData.id;
    if (!fileId) { console.warn(`    [OCR] Sem file ID`); return null; }

    // 3) Obter signed URL (com retry pois o Mistral demora a indexar)
    let documentUrl = "";
    for (let attempt = 1; attempt <= 5; attempt++) {
      await sleep(800 * attempt);
      const signedResp = await fetch(
        `https://api.mistral.ai/v1/files/${fileId}/url?expiry=24`,
        { headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` } }
      );
      if (signedResp.ok) {
        const signedJson = await signedResp.json();
        documentUrl = signedJson.url;
        break;
      }
      console.log(`    [OCR] Signed URL tentativa ${attempt}/5...`);
    }
    if (!documentUrl) { console.warn(`    [OCR] Não conseguiu signed URL`); return null; }

    // 4) Chamar OCR
    console.log(`    [OCR] Executando OCR...`);
    const ocrResp = await fetch("https://api.mistral.ai/v1/ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: { type: "document_url", document_url: documentUrl },
        include_image_base64: false,
      }),
    });

    if (!ocrResp.ok) {
      console.warn(`    [OCR] OCR falhou: ${ocrResp.status}`);
      return null;
    }

    const ocrData = await ocrResp.json();
    const pages: any[] = ocrData.pages || [];
    const text = pages.map((p: any) => (p.markdown || "").trim()).filter(Boolean).join("\n\n");

    // 5) Limpar arquivo no Mistral (best-effort)
    fetch(`https://api.mistral.ai/v1/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` },
    }).catch(() => {});

    console.log(`    [OCR] Extraiu ${text.length} chars`);
    return text || null;

  } catch (e) {
    console.error(`    [OCR] Erro:`, (e as Error).message);
    return null;
  }
}

// ── Scraper Principal ─────────────────────────────────────────────

interface DadoEvento {
  etapa: string;
  pdf_url: string | null;
  ocr_text: string | null;
}

async function scrapeDadosDatas(pastaName: string): Promise<DadoEvento[] | null> {
  const url = `https://portal.stf.jus.br/textos/verTexto.asp?servico=bibliotecaConsultaProdutoBibliotecaPastaMinistro&pagina=${pastaName}DadosDatas`;
  const res = await fetch(url, { headers: HEADERS });

  if (res.status !== 200 || res.url.includes("erro-404")) {
    return null;
  }

  const html = await res.text();
  if (html.includes("403 Forbidden") || html.length < 200) {
    return null;
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  if (!document) return null;

  const content = document.querySelector("#texto-pagina-interna");
  if (!content) return null;

  // Extrair links de PDF e seus textos de etapa
  const allLinks = content.querySelectorAll("a");
  const eventos: DadoEvento[] = [];
  let currentEtapa = "";

  for (const link of allLinks) {
    const href = (link as any).getAttribute("href") || "";
    const text = (link as any).textContent?.trim() || "";

    // Links âncora (#item_X) indicam os títulos de seção
    if (href.startsWith("#item_")) {
      currentEtapa = text;
      continue;
    }

    // Links para PDFs
    if (href.toLowerCase().includes(".pdf")) {
      // Se não temos uma etapa corrente, tenta usar o texto do link ou o contexto anterior
      const etapaFinal = currentEtapa || text || "Documento";

      // Verificar se a etapa já existe no array
      const existing = eventos.find(e => e.etapa === etapaFinal);
      if (existing) {
        // Adicionar um sufixo para distinguir múltiplos PDFs da mesma etapa
        if (!existing.pdf_url) {
          existing.pdf_url = href;
        } else {
          // Criar uma nova entrada com sufixo
          eventos.push({
            etapa: `${etapaFinal} (Documento ${eventos.filter(e => e.etapa.startsWith(etapaFinal)).length + 1})`,
            pdf_url: href,
            ocr_text: null,
          });
        }
      } else {
        eventos.push({
          etapa: etapaFinal,
          pdf_url: href,
          ocr_text: null,
        });
      }
    }

    // Links com texto de seção (tipo "INDICAÇÃO PARA O SUPREMO TRIBUNAL FEDERAL" sem href âncora)
    if (!href.startsWith("#") && !href.includes(".pdf") && !href.includes("javascript") && !href.includes("http") && text.length > 5) {
      currentEtapa = text;
    }
  }

  // Se não encontrou eventos via links, tenta extrair de outra forma (texto puro)
  if (eventos.length === 0) {
    // Extrair texto do conteúdo como fallback
    const fullText = (content as any).textContent?.trim() || "";
    if (fullText.length > 50) {
      eventos.push({
        etapa: "Dados e Datas",
        pdf_url: null,
        ocr_text: fullText.replace(/\n{3,}/g, '\n\n').trim(),
      });
    }
  }

  return eventos.length > 0 ? eventos : null;
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const { data: ministros } = await supabase
    .from('stf_ministros')
    .select('id, nome')
    .order('nome');

  if (!ministros) {
    console.error("Nenhum ministro encontrado");
    return;
  }

  console.log(`\n📜 Raspando Dados e Datas para ${ministros.length} ministros...\n`);

  let totalComDados = 0;
  let totalPDFs = 0;
  let totalOCR = 0;

  for (let i = 0; i < ministros.length; i++) {
    const min = ministros[i];
    const pastaName = sanitizeName(min.nome);
    console.log(`\n[${i + 1}/${ministros.length}] ${min.nome} → ${pastaName}`);

    const eventos = await scrapeDadosDatas(pastaName);

    if (!eventos || eventos.length === 0) {
      console.log(`  ❌ Sem seção "Dados e Datas"`);
      await sleep(500);
      continue;
    }

    console.log(`  ✅ ${eventos.length} evento(s) encontrado(s)`);
    totalComDados++;

    // OCR dos PDFs
    for (const ev of eventos) {
      if (!ev.pdf_url) continue;
      totalPDFs++;

      const label = `${pastaName}_${ev.etapa.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}`;
      const ocrText = await ocrPdfViaMistral(ev.pdf_url, label);
      if (ocrText) {
        ev.ocr_text = ocrText;
        totalOCR++;
      }

      // Rate limiting do Mistral
      await sleep(1500);
    }

    // Salvar no banco
    const { error } = await supabase
      .from('stf_ministros')
      .update({ dados_e_datas: eventos })
      .eq('id', min.id);

    if (error) {
      console.error(`  ⚠️ Erro ao salvar: ${error.message}`);
    } else {
      console.log(`  💾 Salvo no banco (${eventos.length} eventos)`);
    }

    // Rate limiting STF portal
    await sleep(1000);
  }

  console.log(`\n\n════════════════════════════════════════════`);
  console.log(`📊 RESUMO:`);
  console.log(`   Ministros com Dados e Datas: ${totalComDados}/${ministros.length}`);
  console.log(`   PDFs encontrados: ${totalPDFs}`);
  console.log(`   PDFs com OCR: ${totalOCR}`);
  console.log(`════════════════════════════════════════════\n`);
}

main();
