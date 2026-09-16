import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usa role key para ter permissão de escrita irrestrita

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const CAMARA_API = 'https://dadosabertos.camara.leg.br/api/v2';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function fetchDeputadoDetalhe(id) {
  try {
    const res = await fetch(`${CAMARA_API}/deputados/${id}`, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.dados;
  } catch (e) {
    console.error(`Erro detalhe ${id}:`, e);
    return null;
  }
}

async function fetchDeputadoDespesas(id) {
  try {
    const res = await fetch(`${CAMARA_API}/deputados/${id}/despesas?ordem=DESC&ordenarPor=ano&itens=30`, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.dados || [];
  } catch (e) {
    console.error(`Erro despesas ${id}:`, e);
    return [];
  }
}

async function fetchTodosDeputados() {
  const url = `${CAMARA_API}/deputados?ordem=ASC&ordenarPor=nome&itens=1000`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error("Falha ao puxar lista de deputados");
  const json = await res.json();
  return json.dados || [];
}

async function main() {
  console.log("Baixando lista de deputados da API da Câmara (itens=1000)...");
  const deputados = await fetchTodosDeputados();
  
  console.log(`Encontrados ${deputados.length} deputados. Iniciando extração de detalhes e despesas...`);
  
  for (let i = 0; i < deputados.length; i++) {
    const dep = deputados[i];
    const camaraId = dep.id;
    
    console.log(`[${i+1}/${deputados.length}] Puxando dados para ${dep.nome} (ID: ${camaraId})...`);
    
    const [detalhe, despesas] = await Promise.all([
      fetchDeputadoDetalhe(camaraId),
      fetchDeputadoDespesas(camaraId)
    ]);
    
    const dadosParaSalvar = {
      camara_id: camaraId,
      nome: dep.nome,
      sigla_partido: dep.siglaPartido,
      sigla_uf: dep.siglaUf,
      foto_url: dep.urlFoto,
      email: dep.email,
      dados_json: { detalhe, despesas }
    };
    
    const { error: upsertError } = await supabase
      .from('radar_deputados')
      .upsert(dadosParaSalvar, { onConflict: 'camara_id' });
      
    if (upsertError) {
      console.error(`Erro ao inserir/atualizar ${dep.nome}:`, upsertError);
    }
    
    // Atraso para não tomar rate limit da câmara
    await delay(300);
  }
  
  console.log("Sincronização concluída com sucesso!");
}

main().catch(console.error);
