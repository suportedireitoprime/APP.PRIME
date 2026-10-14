const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

function extrairNumeroArtigo(titulo) {
  // Ex: "CP Art. 1.mp3", "CP Art. 359-A.mp3", "CP Art. 121.mp3"
  const m = titulo.match(/art(?:igo|\.)?\s*([0-9]+(?:\s*[-–—]\s*[A-Za-z]+|[A-Za-z]+)?)[º°ª]?/i);
  if (!m) return null;
  return m[1].replace(/\s+/g, '').toUpperCase().trim();
}

function gerarVariantesArtigo(numRaw) {
  if (!numRaw) return [];
  const variantes = new Set();
  const isOrdinal = /^[1-9]$/.test(numRaw);

  variantes.add(numRaw);
  variantes.add(`Art. ${numRaw}`);
  variantes.add(`Artigo ${numRaw}`);

  if (isOrdinal) {
    variantes.add(`${numRaw}º`);
    variantes.add(`Art. ${numRaw}º`);
    variantes.add(`Artigo ${numRaw}º`);
  }

  return Array.from(variantes);
}

async function downloadDriveFile(fileId) {
  const urls = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://docs.google.com/uc?export=download&id=${fileId}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        if (buf.byteLength > 1000) {
          return Buffer.from(buf);
        }
      }
    } catch (e) {
      // try next
    }
  }
  return null;
}

async function run() {
  if (!fs.existsSync('scratch/cp_complete_files.json')) {
    console.error('scratch/cp_complete_files.json não encontrado!');
    return;
  }

  const allAudios = JSON.parse(fs.readFileSync('scratch/cp_complete_files.json', 'utf8'));
  console.log(`Carregando ${allAudios.length} arquivos de narração do Código Penal para o Supabase...`);

  // Checar quais já existem no narracoes_artigos
  const { data: existentes } = await sb
    .from('narracoes_artigos')
    .select('artigo_numero, audio_url')
    .eq('tabela_nome', 'CP_CODIGO_PENAL');

  const existentesSet = new Set((existentes || []).map(r => r.artigo_numero));
  console.log(`Já existem ${existentesSet.size} registros no Supabase para CP_CODIGO_PENAL.`);

  let processados = 0;
  let erros = 0;

  for (let i = 0; i < allAudios.length; i++) {
    const item = allAudios[i];
    const numRaw = extrairNumeroArtigo(item.title);
    if (!numRaw) {
      console.warn(`[${i+1}/${allAudios.length}] Não foi possível extrair número de "${item.title}"`);
      continue;
    }

    const variantes = gerarVariantesArtigo(numRaw);
    const storagePath = `narracoes/CP_CODIGO_PENAL/CP_Art_${numRaw}.mp3`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/audios/${storagePath}`;

    // Checar se já tem URL no banco
    const jaCadastrado = variantes.some(v => existentesSet.has(v));
    if (jaCadastrado) {
      console.log(`[${i+1}/${allAudios.length}] Artigo ${numRaw} já cadastrado. Pulando upload.`);
      processados++;
      continue;
    }

    console.log(`[${i+1}/${allAudios.length}] Baixando ${item.title} (ID: ${item.id})...`);
    const fileBuf = await downloadDriveFile(item.id);

    if (!fileBuf) {
      console.error(`  ❌ Falha ao baixar ${item.title}`);
      erros++;
      continue;
    }

    // Upload pro Supabase Storage
    const { error: upErr } = await sb.storage
      .from('audios')
      .upload(storagePath, fileBuf, {
        contentType: 'audio/mpeg',
        upsert: true
      });

    if (upErr) {
      console.error(`  ❌ Falha no upload Storage para Art. ${numRaw}:`, upErr.message);
      erros++;
      continue;
    }

    // Inserir variantes no banco
    const rowsToInsert = variantes.map(v => ({
      tabela_nome: 'CP_CODIGO_PENAL',
      artigo_numero: v,
      lei_nome: 'Código Penal',
      titulo_artigo: `Artigo ${numRaw}`,
      audio_url: publicUrl
    }));

    const { error: insErr } = await sb.from('narracoes_artigos').upsert(rowsToInsert, {
      onConflict: 'tabela_nome,artigo_numero'
    });

    if (insErr) {
      console.warn(`  ⚠️ Aviso ao inserir no banco Art. ${numRaw}:`, insErr.message);
    } else {
      console.log(`  ✅ Art. ${numRaw} enviado pro Storage e cadastrado com sucesso! (${(fileBuf.length / 1024).toFixed(1)} KB)`);
      for (const v of variantes) existentesSet.add(v);
      processados++;
    }

    // Pequeno intervalo para não estourar rate-limit
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n========================================`);
  console.log(`MIGRAÇÃO CP CONCLUÍDA!`);
  console.log(`Processados: ${processados} | Erros: ${erros} | Total: ${allAudios.length}`);
  console.log(`========================================`);
}

run().catch(console.error);
