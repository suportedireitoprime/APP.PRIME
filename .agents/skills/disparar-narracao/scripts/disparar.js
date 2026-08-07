const fs = require('fs');
const http = require('https');

const URL_GATEWAY = "https://dnjrgpldcwcpoywamorr.supabase.co/functions/v1/narracao?fn=artigo";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0";

// Tabela slug map para abreviações comuns
const MAPA_TABELAS = {
  "codigo_penal": "codigo_penal",
  "cp": "codigo_penal",
  "codigo penal": "codigo_penal",
  "cf": "constituicao_federal",
  "cf88": "constituicao_federal",
  "constituicao": "constituicao_federal",
  "cc": "codigo_civil",
  "codigo civil": "codigo_civil",
  "cpc": "codigo_processo_civil",
  "cpp": "codigo_processo_penal",
  "clt": "clt",
  "ctn": "codigo_tributario_nacional",
  "cdc": "codigo_defesa_consumidor"
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
  const queryUrl = `https://dnjrgpldcwcpoywamorr.supabase.co/rest/v1/vade_mecum_artigos?select=numero,caput,hierarquia,epigrafe&tabela_codigo=eq.${tabela}&numero=eq.${artigoNum}&limit=1`;
  
  const res = await fetch(queryUrl, {
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    }
  });

  if (!res.ok) return null;
  const rows = await res.json();
  return rows && rows.length > 0 ? rows[0] : null;
}

async function dispararNarracao() {
  const params = parseArgs();
  const rawTabela = String(params.tabela || params.lei || "codigo_penal").toLowerCase().trim();
  const tabela = MAPA_TABELAS[rawTabela] || rawTabela;
  const artigoNum = String(params.artigo || params.numero || "1").trim();
  const force = params.force === 'true' || params.force === true;

  console.log(`🎙️ [Skill disparar-narracao] Iniciando narração do Artigo ${artigoNum} (${tabela})...`);

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
    } else {
      console.warn(`⚠️ Artigo ${artigoNum} não encontrado no banco para ${tabela}. Usando parâmetros genéricos.`);
    }
  }

  const payload = {
    fn: "artigo",
    tabela_nome: tabela,
    artigo_numero: artigoNum,
    lei_nome: params.nome_lei || "Legislação",
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

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ Erro HTTP ${res.status}:`, errText);
      process.exit(1);
    }

    const json = await res.json();
    console.log("\n✅ [DISPARAR-NARRACAO] SUCESSO!");
    console.log(`🔊 Audio URL: ${json.audio_url}`);
    console.log(`⏱️ Timings capturados: ${json.word_timings?.length || 0} palavras`);
    console.log("\nJSON_RESULT:" + JSON.stringify(json));
  } catch (err) {
    console.error("❌ Falha na narração:", err);
    process.exit(1);
  }
}

dispararNarracao();
