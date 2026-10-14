const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

function extrairNumeroArtigo(titulo) {
  const m = titulo.match(/art(?:igo|\.)?\s*([0-9]+(?:\s*[-–—]\s*[A-Za-z0-9]+|[A-Za-z0-9]+)?)[º°ª]?/i);
  if (!m) {
    // Tenta formato direto se o título for apenas o número ou "Artigo X"
    const m2 = titulo.match(/^([0-9]+(?:\s*[-–—]\s*[A-Za-z0-9]+|[A-Za-z0-9]+)?)/i);
    if (m2) return m2[1].replace(/\s+/g, '').toUpperCase().trim();
    return null;
  }
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

async function uploadLaw(law) {
  if (!fs.existsSync(law.jsonFile)) {
    console.log(`[${law.prefix}] Arquivo ${law.jsonFile} ainda não existe. Pulando.`);
    return;
  }

  const allAudios = JSON.parse(fs.readFileSync(law.jsonFile, 'utf8'));
  console.log(`\n========================================`);
  console.log(`[${law.prefix}] Processando ${allAudios.length} arquivos para ${law.tabela_nome}...`);
  console.log(`========================================`);

  // Checar quais já existem
  const { data: existentes } = await sb
    .from('narracoes_artigos')
    .select('artigo_numero, audio_url')
    .eq('tabela_nome', law.tabela_nome);

  const existentesSet = new Set((existentes || []).map(r => r.artigo_numero));
  console.log(`[${law.prefix}] Já existem ${existentesSet.size} registros no Supabase.`);

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
    const storagePath = `narracoes/${law.tabela_nome}/${law.prefix}_Art_${numRaw}.mp3`;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/audios/${storagePath}`;

    const jaCadastrado = variantes.some(v => existentesSet.has(v));
    if (jaCadastrado) {
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

    const rowsToInsert = variantes.map(v => ({
      tabela_nome: law.tabela_nome,
      artigo_numero: v,
      lei_nome: law.lei_nome,
      titulo_artigo: `Artigo ${numRaw}`,
      audio_url: publicUrl
    }));

    const { error: insErr } = await sb.from('narracoes_artigos').upsert(rowsToInsert, {
      onConflict: 'tabela_nome,artigo_numero'
    });

    if (insErr) {
      console.warn(`  ⚠️ Aviso ao inserir no banco Art. ${numRaw}:`, insErr.message);
    } else {
      console.log(`  ✅ Art. ${numRaw} gravado e indexado! (${(fileBuf.length / 1024).toFixed(1)} KB)`);
    }

    processados++;
  }

  console.log(`[${law.prefix}] Concluído: ${processados} processados, ${erros} erros.`);
}

async function run() {
  const targetLaw = process.argv[2];

  const laws = [
    {
      prefix: 'CTN',
      tabela_nome: 'CTN_CODIGO_TRIBUTARIO_NACIONAL',
      lei_nome: 'Código Tributário Nacional',
      jsonFile: fs.existsSync('scratch/ctn_clean_files.json') ? 'scratch/ctn_clean_files.json' : 'scratch/ctn_complete_files.json'
    },
    {
      prefix: 'CE',
      tabela_nome: 'CE_CODIGO_ELEITORAL',
      lei_nome: 'Código Eleitoral',
      jsonFile: fs.existsSync('scratch/ce_clean_files.json') ? 'scratch/ce_clean_files.json' : 'scratch/ce_complete_files.json'
    },
    {
      prefix: 'CPC',
      tabela_nome: 'CPC_CODIGO_PROCESSO_CIVIL',
      lei_nome: 'Código de Processo Civil',
      jsonFile: fs.existsSync('scratch/cpc_clean_files.json') ? 'scratch/cpc_clean_files.json' : 'scratch/cpc_complete_files.json'
    }
  ];

  const selected = targetLaw ? laws.filter(l => l.prefix.toUpperCase() === targetLaw.toUpperCase()) : laws;

  for (const law of selected) {
    await uploadLaw(law);
  }
}

run().catch(console.error);
