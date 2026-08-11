import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadToStorage(pathStr, textData) {
  const { data, error } = await supabase.storage
    .from('biblioteca-obras')
    .upload(pathStr, textData, {
      contentType: 'text/markdown',
      upsert: true
    });
    
  if (error) {
    console.error(`Erro no upload para ${pathStr}:`, error);
    return null;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('biblioteca-obras')
    .getPublicUrl(pathStr);
    
  return publicUrl;
}

async function run() {
  const tabela = process.argv[2];
  const livroId = process.argv[3];
  const filePath = process.argv[4];

  if (!tabela || !livroId || !filePath) {
    console.error("Uso: node importar_json.mjs <tabela> <livro_id> <caminho_do_arquivo>");
    process.exit(1);
  }

  console.log(`Lendo arquivo ${filePath}...`);
  const rawData = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(rawData);

  console.log("Processando seções para gerar Markdown...");
  let md = "";
  let sumario = [];

  for (const sec of jsonData.secoes) {
    if (sec.titulo) {
      sumario.push({
        titulo: sec.titulo,
        nivel: sec.nivel_toc || 1,
        pagina: sec.pagina_inicio
      });
      
      const hashes = '#'.repeat(Math.max(1, Math.min(6, sec.nivel_toc || 1)));
      md += `${hashes} ${sec.titulo}\n\n`;
    }
    
    if (sec.paginas && Array.isArray(sec.paginas)) {
      for (const p of sec.paginas) {
        if (p.texto && p.texto.trim()) {
          const numStr = p.numero ? `\n<!-- page:${p.numero} -->\n` : '';
          md += `${numStr}${p.texto}\n\n`;
        }
      }
    }
  }

  console.log(`Markdown gerado com ${md.length} caracteres.`);
  console.log("Fazendo upload para o Storage...");

  const pathRefinado = `refinado/${tabela}_${livroId}.md`;
  const urlRefinado = await uploadToStorage(pathRefinado, md);

  if (!urlRefinado) {
    console.error("Falha no upload do arquivo.");
    process.exit(1);
  }

  console.log("Upload concluído! URL:", urlRefinado);
  console.log("Salvando registro no Supabase...");

  // Verifica se já existe a leitura nativa
  const { data: exist, error: existErr } = await supabase
    .from('biblioteca_leitura_nativa')
    .select('id')
    .eq('livro_tabela', tabela)
    .eq('livro_id', String(livroId))
    .maybeSingle();

  if (existErr) {
    console.error("Erro ao verificar registro existente:", existErr);
  }

  const payload = {
    livro_tabela: tabela,
    livro_id: String(livroId),
    status: 'pronto',
    refino_status: 'concluido',
    conteudo_md_refinado_url: urlRefinado,
    sumario_json: sumario,
    total_paginas: jsonData.metadata?.total_paginas || 0,
    conteudo_md: null,
    conteudo_md_refinado: null
  };

  if (exist) {
    console.log("Atualizando registro existente ID:", exist.id);
    const { error: updErr } = await supabase
      .from('biblioteca_leitura_nativa')
      .update(payload)
      .eq('id', exist.id);
      
    if (updErr) console.error("Erro no update:", updErr);
    else console.log("Sucesso no update!");
  } else {
    console.log("Criando novo registro...");
    const { error: insErr } = await supabase
      .from('biblioteca_leitura_nativa')
      .insert(payload);
      
    if (insErr) console.error("Erro no insert:", insErr);
    else console.log("Sucesso no insert!");
  }
}

run();
