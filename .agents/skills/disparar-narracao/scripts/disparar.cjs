const fs = require('fs');

const URL_GATEWAY = "https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/narracao?fn=artigo";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

const MAPA_TABELAS = {
  "codigo_penal": "CP_CODIGO_PENAL",
  "cp": "CP_CODIGO_PENAL",
  "cp_codigo_penal": "CP_CODIGO_PENAL",
  "codigo penal": "CP_CODIGO_PENAL",
  "cf": "CF88_CONSTITUICAO_FEDERAL",
  "cf88": "CF88_CONSTITUICAO_FEDERAL",
  "constituicao": "CF88_CONSTITUICAO_FEDERAL",
  "cf88_constituicao_federal": "CF88_CONSTITUICAO_FEDERAL",
  "cc": "CC_CODIGO_CIVIL",
  "codigo civil": "CC_CODIGO_CIVIL",
  "cc_codigo_civil": "CC_CODIGO_CIVIL",
  "cpc": "CPC_CODIGO_PROCESSO_CIVIL",
  "cpc_codigo_processo_civil": "CPC_CODIGO_PROCESSO_CIVIL",
  "cpp": "CPP_CODIGO_PROCESSO_PENAL",
  "cpp_codigo_processo_penal": "CPP_CODIGO_PROCESSO_PENAL",
  "clt": "CLT_CONSOLIDACAO_LEIS_TRABALHO",
  "ctn": "CTN_CODIGO_TRIBUTARIO_NACIONAL",
  "cdc": "CDC_CODIGO_DEFESA_CONSUMIDOR",
  "eca": "ECA_ESTATUTO_CRIANCA_ADOLESCENTE",
  "eoab": "EOAB_ESTATUTO_OAB"
};

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      params[key] = val;
    }
  }
  return params;
}

async function buscarTextoArtigoNoBanco(tabela, artigoNum) {
  const aliasLower = tabela.replace(/^[A-Z0-9]+_/, '').toLowerCase();
  const queryUrl = `https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/vade_mecum_artigos?select=numero,caput,hierarquia,epigrafe&tabela_codigo=in.(${tabela},${aliasLower})&numero=eq.${artigoNum}&limit=1`;
  
  try {
    const res = await fetch(queryUrl, {
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`
      }
    });

    if (!res.ok) return null;
    const rows = await res.json();
    return rows && rows.length > 0 ? rows[0] : null;
  } catch {
    return null;
  }
}

async function dispararNarracao() {
  const params = parseArgs();
  const rawTabela = String(params.tabela || params.lei || "codigo_penal").toLowerCase().trim();
  const tabela = MAPA_TABELAS[rawTabela] || rawTabela.toUpperCase();
  const artigoNum = String(params.artigo || params.numero || "1").trim();
  const force = params.force === 'true' || params.force === true;

  console.log(`🎙️ [Gemini TTS] Iniciando narração do Artigo ${artigoNum} (${tabela}) com voz Kore...`);

  let texto = params.texto;
  let hierarquia = params.hierarquia;
  let epigrafe = params.epigrafe;

  if (!texto) {
    console.log(`🔍 Buscando texto do Artigo ${artigoNum} em ${tabela}...`);
    const dbData = await buscarTextoArtigoNoBanco(tabela, artigoNum);
    if (dbData) {
      texto = dbData.caput;
      hierarquia = hierarquia || dbData.hierarquia;
      epigrafe = epigrafe || dbData.epigrafe;
      console.log(`✅ Texto do artigo encontrado: "${texto.substring(0, 80)}..."`);
    }
  }

  const payload = {
    fn: "artigo",
    tabela_nome: tabela,
    artigo_numero: artigoNum,
    lei_nome: params.nome_lei || "Código Penal",
    titulo_artigo: hierarquia || `Artigo ${artigoNum}`,
    epigrafe: epigrafe || "",
    hierarquia: hierarquia || "",
    artigo_texto: texto || `Artigo ${artigoNum}`,
    force_regenerate: force
  };

  try {
    const res = await fetch(URL_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json.audio_url) {
      console.log("\n✅ [GEMINI TTS] GERADO COM SUCESSO!");
      console.log(`🔊 Audio URL: ${json.audio_url}`);
      console.log(`⏱️ Timings capturados: ${json.word_timings?.length || 0} palavras (Karaokê HD)`);
      console.log("\nJSON_RESULT:" + JSON.stringify(json));
      return;
    }

    console.error(`❌ Erro da Edge Function Gemini (${res.status}):`, JSON.stringify(json));
    process.exit(1);

  } catch (err) {
    console.error("❌ Falha de rede na requisição:", err);
    process.exit(1);
  }
}

dispararNarracao();
