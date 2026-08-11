import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
// Use a chave de admin/service_role para rodar o script (coloque no .env)
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("ERRO: Configure VITE_SUPABASE_URL e VITE_SUPABASE_SERVICE_ROLE_KEY no seu arquivo .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function uploadToStorage(filePath, content) {
  const { error } = await supabase.storage.from('biblioteca-obras').upload(filePath, content, {
    contentType: 'text/markdown',
    upsert: true,
  });
  if (error) {
    console.error(`Erro ao subir ${filePath}:`, error);
    return null;
  }
  const { data: pubUrl } = supabase.storage.from('biblioteca-obras').getPublicUrl(filePath);
  return pubUrl.publicUrl;
}

async function run() {
  console.log("Iniciando migração de textos longos (TOAST) para o Storage...");

  let continueProcessing = true;
  let totalProcessed = 0;

  while (continueProcessing) {
    // Buscar um lote de 10
    const { data, error } = await supabase
      .from('biblioteca_leitura_nativa')
      .select('id, livro_id, livro_tabela, conteudo_md, conteudo_md_refinado')
      .or('conteudo_md.not.is.null,conteudo_md_refinado.not.is.null')
      .limit(10);

    if (error) {
      console.error("Erro ao buscar livros:", error);
      break;
    }

    if (!data || data.length === 0) {
      console.log(`Todos os livros processados. Total limpo: ${totalProcessed}`);
      continueProcessing = false;
      break;
    }

    let batchProcessed = 0;
    for (const row of data) {
      console.log(`Processando [${row.livro_tabela}] ${row.livro_id}...`);
      let ocrUrl = null;
      let refinoUrl = null;
      let toUpdate = {};

      if (row.conteudo_md) {
        const pathStr = `ocr/${row.livro_tabela}_${row.livro_id}.md`;
        ocrUrl = await uploadToStorage(pathStr, row.conteudo_md);
        if (ocrUrl) {
          toUpdate.conteudo_md_url = ocrUrl;
          toUpdate.conteudo_md = null;
        }
      }

      if (row.conteudo_md_refinado) {
        const pathStr = `refinado/${row.livro_tabela}_${row.livro_id}.md`;
        refinoUrl = await uploadToStorage(pathStr, row.conteudo_md_refinado);
        if (refinoUrl) {
          toUpdate.conteudo_md_refinado_url = refinoUrl;
          toUpdate.conteudo_md_refinado = null;
        }
      }

      if (Object.keys(toUpdate).length > 0) {
        const { error: updErr } = await supabase
          .from('biblioteca_leitura_nativa')
          .update(toUpdate)
          .eq('id', row.id);
          
        if (updErr) {
          console.error(`Erro ao atualizar linha ${row.id}:`, updErr);
        } else {
          batchProcessed++;
          totalProcessed++;
        }
      }
    }
    
    console.log(`Lote processado (${batchProcessed}). Indo para o próximo...`);
  }
}

run();
