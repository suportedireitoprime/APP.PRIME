import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  try {
    // 1. Upload Cover
    console.log("Uploading cover...");
    const coverPath = path.join(__dirname, '../docs/91CqQ4PnqZL._SY466_.jpg');
    const coverBuffer = fs.readFileSync(coverPath);
    const { error: coverError } = await supabase.storage
      .from('biblioteca-obras')
      .upload('capas/a_riqueza_das_nacoes.jpg', coverBuffer, { contentType: 'image/jpeg', upsert: true });

    if (coverError) {
      console.error("Cover upload error:", coverError);
      return;
    }
    const coverUrl = supabase.storage.from('biblioteca-obras').getPublicUrl('capas/a_riqueza_das_nacoes.jpg').data.publicUrl;
    console.log("Cover URL:", coverUrl);

    // 2. Upload PDF
    console.log("Uploading PDF...");
    const pdfPath = path.join(__dirname, '../docs/29. A riqueza das nações -- Adam Smith.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const { error: pdfError } = await supabase.storage
      .from('biblioteca-obras')
      .upload('pdfs/a_riqueza_das_nacoes.pdf', pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (pdfError) {
      console.error("PDF upload error:", pdfError);
      return;
    }
    const pdfUrl = supabase.storage.from('biblioteca-obras').getPublicUrl('pdfs/a_riqueza_das_nacoes.pdf').data.publicUrl;
    console.log("PDF URL:", pdfUrl);

    // 3. Insert into database
    console.log("Inserting into database...");
    const { data: insertData, error: insertError } = await supabase
      .from('biblioteca_classicos')
      .insert({
        livro: "A Riqueza das Nações",
        autor: "Adam Smith",
        imagem: coverUrl,
        download: pdfUrl,
        sobre: "Uma investigação sobre a natureza e as causas da riqueza das nações é a obra mais famosa de Adam Smith.",
        area: "Economia",
        paginas: 2411,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return;
    }

    const newId = insertData.id;
    console.log("Inserted with ID:", newId);

    // 4. Run importar_json.mjs
    console.log("Running importar_json.mjs...");
    const jsonPath = path.join(__dirname, '../livros_json/a_riqueza_das_nacoes_por_capitulo_e_pagina.json');
    execSync(`node "${path.join(__dirname, 'importar_json.mjs')}" biblioteca_classicos ${newId} "${jsonPath}"`, { stdio: 'inherit' });

    console.log("All done successfully!");
  } catch (err) {
    console.error("Execution error:", err);
  }
}

run();
