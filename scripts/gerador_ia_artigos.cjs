/**
 * Robô Gerador em Massa de Conteúdos de IA para Artigos de Leis (Modo Turbo em Lotes de 15)
 * 
 * Gera simultaneamente em lotes de 15 artigos:
 * 1. Explicação didática com estrutura por seções (Caput, Incisos, etc.)
 * 2. Exemplos práticos realistas com casos concretos
 * 3. Termos jurídicos explicados de forma simples
 * 
 * Persiste triplamente no Supabase:
 * - vade_mecum_artigos (explicacao_resumido, exemplo, termos)
 * - resumos_juridicos (markdown, exemplos, termos)
 * - artigo_ai_cache (tipo: 'explicacao', 'exemplo', 'termos')
 * 
 * Uso no Terminal:
 *   node scripts/gerador_ia_artigos.cjs --todas               (Processa todas as leis em lotes de 15)
 *   node scripts/gerador_ia_artigos.cjs --lei cc              (Processa Código Civil em lotes de 15)
 *   node scripts/gerador_ia_artigos.cjs --lei cdc --lote 15   (Processa CDC em lotes de 15)
 *   node scripts/gerador_ia_artigos.cjs --lei cp --limite 30  (Processa 30 artigos do Código Penal)
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2ODYxMzMsImV4cCI6MjA5ODI2MjEzM30.GuZuUn1ITbjsTYi_SjL-eFSCxdxxs3rUASArbMf62O0';
const OMNIROUTE_URL = 'https://omniroute-production-fb57.up.railway.app/v1/chat/completions';
const OMNIROUTE_KEY = 'sk-b0c9c945f62322b0-d2454f-a292242f';
const OMNIROUTE_MODEL = 'auto/fast';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const PROGRESS_FILE = path.join(__dirname, '..', 'scratch', 'gerador_progresso.json');

// Mapeamento de Slugs para tabela_nome oficial
const TABELAS_MAP = {
  clt: 'CLT_CONSOLIDACAO_LEIS_TRABALHO',
  cp: 'CP_CODIGO_PENAL',
  cc: 'CC_CODIGO_CIVIL',
  cpc: 'CPC_CODIGO_PROCESSO_CIVIL',
  cpp: 'CPP_CODIGO_PROCESSO_PENAL',
  cf: 'CF88_CONSTITUICAO_FEDERAL',
  cf88: 'CF88_CONSTITUICAO_FEDERAL',
  cdc: 'CDC_CODIGO_DEFESA_CONSUMIDOR',
  ctn: 'CTN_CODIGO_TRIBUTARIO_NACIONAL',
  ce: 'CE_CODIGO_ELEITORAL',
  ctb: 'CTB_CODIGO_TRANSITO_BRASILEIRO',
  cpm: 'CPM_CODIGO_PENAL_MILITAR',
  cppm: 'CPPM_CODIGO_PROCESSO_PENAL_MILITAR',
  ccom: 'CCOM_CODIGO_COMERCIAL',
  cba: 'CBA_CODIGO_BRASILEIRO_AERONAUTICA',
  cagua: 'CAGUA_CODIGO_AGUAS',
  cmin: 'CMIN_CODIGO_MINAS',
  ctel: 'CTEL_CODIGO_TELECOMUNICACOES',
  cflor: 'CFLOR_CODIGO_FLORESTAL',
  eca: 'ECA_ESTATUTO_CRIANCA_ADOLESCENTE',
  ei: 'EI_ESTATUTO_IDOSO',
  epd: 'EPD_ESTATUTO_PESSOA_DEFICIENCIA',
  eir: 'EIR_ESTATUTO_IGUALDADE_RACIAL',
  ec: 'EC_ESTATUTO_CIDADE',
  ed: 'ED_ESTATUTO_DESARMAMENTO',
  eoab: 'EOAB_ESTATUTO_OAB',
  et: 'ET_ESTATUTO_TORCEDOR',
  ej: 'EJ_ESTATUTO_JUVENTUDE',
  em: 'EM_ESTATUTO_MILITARES',
  eind: 'EIND_ESTATUTO_INDIO',
  eterra: 'ETERRA_ESTATUTO_TERRA',
  emig: 'EMIG_ESTATUTO_MIGRACAO',
  eref: 'EREF_ESTATUTO_REFUGIADO',
  lep: 'LEP_EXECUCAO_PENAL',
  lmp: 'LMP_MARIA_PENHA',
  ld: 'LD_LEI_DROGAS',
  loc: 'LOC_ORGANIZACAO_CRIMINOSA',
  laa: 'LAA_ABUSO_AUTORIDADE',
  lit: 'LIT_INTERCEPTACAO_TELEFONICA',
  l8112: 'L8112_SERVIDORES_FEDERAIS',
  lia: 'LIA_IMPROBIDADE_ADMINISTRATIVA',
  nll: 'NLL_LICITACOES',
  lms: 'LMS_MANDADO_SEGURANCA',
  lacp: 'LACP_ACAO_CIVIL_PUBLICA',
  lje: 'LJE_JUIZADOS_ESPECIAIS',
  lgpd: 'LGPD_PROTECAO_DADOS',
  mci: 'MCI_MARCO_CIVIL_INTERNET',
  lf: 'LF_FALENCIAS',
  la: 'LA_ARBITRAGEM',
  li: 'LI_INQUILINATO',
  lrp: 'LRP_REGISTROS_PUBLICOS',
  loman: 'LOMAN_LEI_ORGANICA_MAGISTRATURA',
  lat: 'LAT_ANTITERRORISMO',
  lindb: 'LINDB_INTRODUCAO_NORMAS',
  lch: 'LCH_CRIMES_HEDIONDOS',
  ltort: 'LTORT_TORTURA',
  lca: 'LCA_CRIMES_AMBIENTAIS',
  lrac: 'LRAC_RACISMO',
  llav: 'LLAV_LAVAGEM_DINHEIRO',
  lpaf: 'LPAF_PROCESSO_ADMINISTRATIVO',
  lrf: 'LRF_RESPONSABILIDADE_FISCAL',
  lai: 'LAI_ACESSO_INFORMACAO',
  lap: 'LAP_ACAO_POPULAR',
  lcp: 'LCP_CONTRAVENCOES_PENAIS',
  ldb: 'LDB_DIRETRIZES_EDUCACAO',
};

// Prompt 3-em-1 unificado de alta performance (gera Explicação + Exemplo + Termos de uma vez)
const PROMPT_UNIFICADO_3EM1 = `Você é um jurista brasileiro de alto nível e professor de direito.
Para o artigo de lei fornecido, você DEVE gerar as 3 seções completas utilizando RIGOROSAMENTE as tags delimitadoras abaixo, sem saudações ou preâmbulos:

<<<SECAO_EXPLICACAO>>>
Estrutura por seções usando o marcador '---SECAO---' em linha sozinha entre seções.
Seção 1 DEVE ser '## Caput'. Depois '## Inciso I', '## Parágrafo único', etc. conforme constar no texto.
Dentro de cada seção inclua:
### Em uma frase (ideia central em 1 linha)
### Destrinchando (3 parágrafos curtos explicando elementos e efeitos práticos)
### Exemplo prático (caso com nomes fictícios e consequência legal)
### Pegadinha de prova (alerta sobre pegadinhas comuns em concursos/OAB)

<<<SECAO_EXEMPLO>>>
Crie exatamente 3 exemplos práticos e realistas usando nomes fictícios.
Separe os exemplos com o marcador '---EXEMPLO---' em linha sozinha antes de cada um.
Cada exemplo deve ter:
## Exemplo X: [Título curto]
### O caso (situação em 2 a 4 linhas)
### Encaixando na lei (como a norma se aplica ao fato)
### Se mudasse um detalhe (uma variação jurídica)

<<<SECAO_TERMOS>>>
Separe cada termo com o marcador '---TERMO---' em uma linha sozinha.
Formato: '## [Nome do Termo]' seguido da explicação simples e analogia do dia a dia.
Explique de 3 a 8 termos essenciais presentes no dispositivo.`;

// Prompts individuais mantidos para fallback
const PROMPT_EXPLICACAO = `Você é um jurista brasileiro que explica artigos de lei de forma direta, técnica e didática.
REGRAS:
- NUNCA use saudações. Vá DIRETO ao ponto.
- Organize por seções usando o marcador "---SECAO---" em linha sozinha entre seções.
- Seção 1 DEVE ser "## Caput". Depois incisos e parágrafos.
- Em cada seção:
  ### Em uma frase
  ### Destrinchando
  ### Exemplo prático
  ### Pegadinha de prova`;

const PROMPT_EXEMPLO = `Você é um jurista brasileiro que ilustra artigos de lei com 3 exemplos práticos e realistas.
REGRAS:
- NUNCA use saudações.
- Separe os exemplos com o marcador "---EXEMPLO---" em linha sozinha antes de cada um.
- Cada exemplo:
  ## Exemplo X: [Título curto]
  ### O caso
  ### Encaixando na lei
  ### Se mudasse um detalhe`;

const PROMPT_TERMOS = `Você é um glossarista jurídico. Explique de 3 a 8 termos técnicos do artigo em linguagem simples.
REGRAS:
- Separe cada termo com o marcador "---TERMO---" em linha sozinha.
- Formato: "## [Nome do Termo]" seguido da explicação simples e analogia.`;

async function chamarOmniRoute(systemPrompt, userText, maxTentativas = 2) {
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s de tolerância por requisição

    try {
      const res = await fetch(OMNIROUTE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OMNIROUTE_KEY}`,
        },
        body: JSON.stringify({
          model: OMNIROUTE_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userText },
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`HTTP ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content?.trim();
      if (reply && reply.length > 20) return reply;

      throw new Error('Resposta vazia da IA');
    } catch (err) {
      clearTimeout(timeout);
      if (tentativa === maxTentativas) throw err;
      await new Promise(r => setTimeout(r, 2000 * tentativa));
    }
  }
}

function extrairSecoes(raw) {
  let explicacao = '';
  let exemplo = '';
  let termos = '';

  const idxExp = raw.indexOf('<<<SECAO_EXPLICACAO>>>');
  const idxEx = raw.indexOf('<<<SECAO_EXEMPLO>>>');
  const idxTer = raw.indexOf('<<<SECAO_TERMOS>>>');

  if (idxExp !== -1 && idxEx !== -1 && idxTer !== -1) {
    explicacao = raw.slice(idxExp + '<<<SECAO_EXPLICACAO>>>'.length, idxEx).trim();
    exemplo = raw.slice(idxEx + '<<<SECAO_EXEMPLO>>>'.length, idxTer).trim();
    termos = raw.slice(idxTer + '<<<SECAO_TERMOS>>>'.length).trim();
  } else {
    const matchExp = raw.match(/<<<\s*SECAO_EXPLICACAO\s*>>>([\s\S]*?)(?=<<<\s*SECAO_EXEMPLO\s*>>>|$)/i);
    const matchEx = raw.match(/<<<\s*SECAO_EXEMPLO\s*>>>([\s\S]*?)(?=<<<\s*SECAO_TERMOS\s*>>>|$)/i);
    const matchTer = raw.match(/<<<\s*SECAO_TERMOS\s*>>>([\s\S]*?)$/i);

    if (matchExp) explicacao = matchExp[1].trim();
    if (matchEx) exemplo = matchEx[1].trim();
    if (matchTer) termos = matchTer[1].trim();
  }

  return { explicacao, exemplo, termos };
}

function carregarProgresso() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch {}
  return { processados: {} };
}

function salvarProgresso(progresso) {
  try {
    const dir = path.dirname(PROGRESS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progresso, null, 2), 'utf8');
  } catch {}
}

async function processarArtigo(artigo, leiNome, slug, progresso) {
  const chave = `${artigo.id}`;
  if (progresso.processados[chave]) {
    return { skipped: true };
  }

  const numLimpo = String(artigo.numero || '').replace(/^art(?:igo|\.)?\s*/i, '').trim();
  const textoLimpo = (artigo.texto || '').trim().slice(0, 3200);
  const contextText = `LEGISLAÇÃO: ${leiNome}\nDISPOSITIVO: Artigo ${numLimpo}\nTEXTO OFICIAL:\n${textoLimpo}`;

  let explicacao = '';
  let exemplo = '';
  let termos = '';

  try {
    // 1. Gera as 3 seções de uma vez em chamada única ultrarrápida
    const raw3em1 = await chamarOmniRoute(PROMPT_UNIFICADO_3EM1, contextText);
    const extraidas = extrairSecoes(raw3em1);
    explicacao = extraidas.explicacao;
    exemplo = extraidas.exemplo;
    termos = extraidas.termos;
  } catch (err) {
    // Fallback de contingência
    const [resExp, resEx, resTer] = await Promise.all([
      chamarOmniRoute(PROMPT_EXPLICACAO, contextText),
      chamarOmniRoute(PROMPT_EXEMPLO, contextText),
      chamarOmniRoute(PROMPT_TERMOS, contextText),
    ]);
    explicacao = resExp;
    exemplo = resEx;
    termos = resTer;
  }

  // Se por alguma razão pontual faltou uma seção, completa individualmente
  if (!explicacao || explicacao.length < 20) {
    explicacao = await chamarOmniRoute(PROMPT_EXPLICACAO, contextText);
  }
  if (!exemplo || exemplo.length < 20) {
    exemplo = await chamarOmniRoute(PROMPT_EXEMPLO, contextText);
  }
  if (!termos || termos.length < 20) {
    termos = await chamarOmniRoute(PROMPT_TERMOS, contextText);
  }

  // 1. Atualiza vade_mecum_artigos
  await sb
    .from('vade_mecum_artigos')
    .update({
      explicacao_resumido: explicacao,
      exemplo: exemplo,
      termos: termos,
      updated_at: new Date().toISOString(),
    })
    .eq('id', artigo.id);

  // Lista de códigos para cobrir tanto o slug quanto a tabela oficial
  const tabelaOficial = TABELAS_MAP[slug.toLowerCase()] || slug.toUpperCase();
  const codigosTabela = Array.from(new Set([tabelaOficial, slug.toUpperCase(), slug.toLowerCase()]));

  // 2. Salva em resumos_juridicos e artigo_ai_cache para cada alias
  for (const cod of codigosTabela) {
    try {
      await sb
        .from('resumos_juridicos')
        .upsert({
          tabela_codigo: cod,
          numero_artigo: numLimpo,
          markdown: explicacao,
          exemplos: exemplo,
          termos: termos,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'tabela_codigo,numero_artigo' });

      await sb.from('artigo_ai_cache').upsert([
        { tabela_codigo: cod, numero_artigo: numLimpo, tipo: 'explicacao', conteudo: explicacao },
        { tabela_codigo: cod, numero_artigo: numLimpo, tipo: 'exemplo', conteudo: exemplo },
        { tabela_codigo: cod, numero_artigo: numLimpo, tipo: 'termos', conteudo: termos },
      ], { onConflict: 'tabela_codigo,numero_artigo,tipo' });
    } catch {}
  }

  progresso.processados[chave] = {
    numero: numLimpo,
    lei: leiNome,
    data: new Date().toISOString(),
  };
  salvarProgresso(progresso);

  return { success: true, numero: numLimpo };
}

function ehArtigoReal(numero, texto) {
  if (!numero || !texto) return false;
  const numStr = String(numero).trim();
  if (/^(t[ií]tulo|cap[ií]tulo|se[cç][aã]o|subse[cç][aã]o|livro|parte|anexo|disposi[cç][õo]es|índice|pre[âa]mbulo)/i.test(numStr)) {
    return false;
  }
  if (texto.trim().length < 15) return false;
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const leiFilterIndex = args.indexOf('--lei');
  const limiteIndex = args.indexOf('--limite');
  const loteIndex = args.indexOf('--lote');
  const concorrenciaIndex = args.indexOf('--concorrencia');

  const leiFiltro = leiFilterIndex !== -1 ? args[leiFilterIndex + 1]?.toLowerCase() : null;
  const limite = limiteIndex !== -1 ? parseInt(args[limiteIndex + 1], 10) : null;
  const TAMANHO_LOTE = loteIndex !== -1 ? parseInt(args[loteIndex + 1], 10) :
                       concorrenciaIndex !== -1 ? parseInt(args[concorrenciaIndex + 1], 10) : 15;

  console.log('╔═════════════════════════════════════════════════════════════════╗');
  console.log('║   ROBÔ IA TURBO: 15 EM 15 ARTIGOS SIMULTÂNEOS [3-EM-1]          ║');
  console.log('╚═════════════════════════════════════════════════════════════════╝\n');
  console.log(`• Modo: Lotes de ${TAMANHO_LOTE} artigos gerados de uma vez simultaneamente`);
  console.log(`• Conteúdo por Artigo: [Explicação Completa + 3 Exemplos + Glossário de Termos]`);
  console.log(`• Motor IA: OmniRoute (${OMNIROUTE_MODEL}) via pipeline 3-em-1`);
  console.log(`• Filtro de Lei: ${leiFiltro ? leiFiltro.toUpperCase() : 'Todas as Leis (--todas)'}`);
  if (limite) console.log(`• Limite Total da Sessão: ${limite} artigos`);
  console.log('');

  // Busca catálogo de leis
  const { data: leis } = await sb
    .from('vade_mecum_leis')
    .select('id, slug, nome, total_artigos')
    .order('total_artigos', { ascending: false });

  let leisParaProcessar = leis || [];
  if (leiFiltro) {
    leisParaProcessar = leisParaProcessar.filter(
      l => l.slug.toLowerCase().includes(leiFiltro) || l.nome.toLowerCase().includes(leiFiltro)
    );
  }

  if (leisParaProcessar.length === 0) {
    console.error(`Nenhuma legislação encontrada para o filtro: "${leiFiltro}"`);
    return;
  }

  const progresso = carregarProgresso();
  let totalProcessados = 0;

  for (let idxLei = 0; idxLei < leisParaProcessar.length; idxLei++) {
    const lei = leisParaProcessar[idxLei];
    console.log(`\n📚 [${idxLei + 1}/${leisParaProcessar.length}] ${lei.nome} (Slug: ${lei.slug})`);

    // Busca TODOS os artigos da lei com paginação
    let artigos = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await sb
        .from('vade_mecum_artigos')
        .select('id, numero, texto, ordem, explicacao_resumido, exemplo, termos')
        .eq('lei_id', lei.id)
        .order('ordem', { ascending: true })
        .range(from, from + step - 1);

      if (error || !data || data.length === 0) break;
      artigos = artigos.concat(data);
      if (data.length < step) break;
      from += step;
    }

    // Filtra apenas dispositivos que são artigos reais (ignora TÍTULO I, CAPÍTULO II, etc.)
    const artigosReais = artigos.filter(a => ehArtigoReal(a.numero, a.texto));

    if (artigosReais.length === 0) {
      console.log(`  ↪ Nenhum artigo real encontrado para esta lei.`);
      continue;
    }

    // Filtra apenas artigos pendentes
    const pendentes = artigosReais.filter(art => {
      const numLimpo = String(art.numero || '').replace(/^art(?:igo|\.)?\s*/i, '').trim();
      const jaProcessado = progresso.processados[art.id] || 
        (art.explicacao_resumido && art.exemplo && art.termos &&
         art.explicacao_resumido.length > 20 && art.exemplo.length > 20 && art.termos.length > 20);

      if (jaProcessado && !progresso.processados[art.id]) {
        progresso.processados[art.id] = { numero: numLimpo, lei: lei.nome, data: new Date().toISOString() };
      }
      return !jaProcessado;
    });

    salvarProgresso(progresso);

    console.log(`  ↪ Artigos Reais: ${artigosReais.length} | Já concluídos: ${artigosReais.length - pendentes.length} | Pendentes: ${pendentes.length}`);

    if (pendentes.length === 0) {
      console.log(`  ✅ Todos os artigos desta lei já estão 100% preenchidos!`);
      continue;
    }

    // Processamento em lotes de TAMANHO_LOTE (15 em 15 simultâneos)
    const totalLotes = Math.ceil(pendentes.length / TAMANHO_LOTE);

    for (let i = 0; i < pendentes.length; i += TAMANHO_LOTE) {
      if (limite && totalProcessados >= limite) {
        console.log(`\n🛑 Limite de ${limite} artigos atingido.`);
        return;
      }

      const lote = pendentes.slice(i, i + TAMANHO_LOTE);
      const loteNum = Math.floor(i / TAMANHO_LOTE) + 1;
      const numerosArtigos = lote.map(a => String(a.numero || '').replace(/^art(?:igo|\.)?\s*/i, '').trim());
      const inicioArt = numerosArtigos[0];
      const fimArt = numerosArtigos[numerosArtigos.length - 1];

      console.log(`\n⚡ [Lote ${loteNum}/${totalLotes}] Disparando ${lote.length} artigos simultâneos (Arts. ${inicioArt} ao ${fimArt})...`);
      const tLote0 = Date.now();

      // Dispara os 15 artigos em paralelo
      const promessasLote = lote.map(async (art) => {
        const numLimpo = String(art.numero || '').replace(/^art(?:igo|\.)?\s*/i, '').trim();
        const tArt0 = Date.now();
        try {
          await processarArtigo(art, lei.nome, lei.slug, progresso);
          const dur = ((Date.now() - tArt0) / 1000).toFixed(1);
          console.log(`  ✓ Art. ${numLimpo} pronto (${dur}s) [Explicação + Exemplo + Termos]`);
          return { success: true, numero: numLimpo };
        } catch (err) {
          const dur = ((Date.now() - tArt0) / 1000).toFixed(1);
          console.log(`  ✗ Art. ${numLimpo} falhou (${dur}s): ${err.message}`);
          return { success: false, numero: numLimpo, erro: err.message };
        }
      });

      const resultados = await Promise.all(promessasLote);
      const sucessos = resultados.filter(r => r.success).length;
      totalProcessados += sucessos;

      const tempoLote = ((Date.now() - tLote0) / 1000).toFixed(1);
      console.log(`🏁 Lote ${loteNum} finalizado em ${tempoLote}s (${sucessos}/${lote.length} artigos salvos no Supabase)`);

      // Pausa rápida entre lotes para respeitar a rede
      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log(`\n🎉 Processamento finalizado! Total de artigos gerados nesta sessão: ${totalProcessados}`);
}

main().catch(console.error);
