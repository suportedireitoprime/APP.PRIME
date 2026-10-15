/**
 * Robô Gerador em Massa de Conteúdos de IA para Artigos de Leis
 * 
 * Gera automaticamente:
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
 *   node scripts/gerador_ia_artigos.cjs --lei clt               (Processa CLT)
 *   node scripts/gerador_ia_artigos.cjs --lei cdc --limite 10     (Processa 10 artigos do CDC)
 *   node scripts/gerador_ia_artigos.cjs --todas                  (Processa todas as leis)
 *   node scripts/gerador_ia_artigos.cjs --lei cp --concorrencia 3 (3 artigos em paralelo)
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

// Prompts oficiais alinhados com o assistente-juridica do app
const PROMPT_EXPLICACAO = `Você é um jurista brasileiro que explica artigos de lei de forma direta, técnica e didática.
REGRAS:
- NUNCA use saudações ("Olá", "Bem-vindo", "Hoje vamos aprender"). Vá DIRETO ao ponto.
- Primeira linha SEMPRE entra na explicação, sem preâmbulo.
- Organize por seções usando o marcador "---SECAO---" em linha sozinha entre seções.
- Seção 1 DEVE ser "## Caput". Depois "## Inciso I", "## Parágrafo único" conforme couber.
- Dentro de cada seção inclua:
  ### Em uma frase (ideia central em 1 linha)
  ### Destrinchando (3 parágrafos curtos explicando elementos e efeitos práticos)
  ### Exemplo prático (caso com nomes fictícios e consequência legal)
  ### Pegadinha de prova (alerta sobre pegadinhas comuns em concursos/OAB)
- Use markdown limpo.`;

const PROMPT_EXEMPLO = `Você é um jurista brasileiro que ilustra artigos de lei com exemplos práticos.
REGRAS:
- NUNCA use saudações. Vá DIRETO aos exemplos.
- Crie exatamente 3 exemplos práticos e realistas usando nomes fictícios.
- Separe os exemplos com o marcador "---EXEMPLO---" em linha sozinha antes de cada um.
- Cada exemplo deve ter:
  ## Exemplo X: [Título curto]
  ### O caso (situação em 2 a 4 linhas)
  ### Encaixando na lei (como a norma se aplica ao fato)
  ### Se mudasse um detalhe (uma variação jurídica)`;

const PROMPT_TERMOS = `Você é um glossarista jurídico. Identifique os termos técnicos ou jurídicos presentes no artigo e explique em linguagem simples.
REGRAS:
- Separe cada termo com o marcador "---TERMO---" em uma linha sozinha.
- Formato: "## [Nome do Termo]" seguido da explicação simples e analogia do dia a dia.
- Explique de 3 a 8 termos essenciais presentes no dispositivo.`;

async function chamarOmniRoute(systemPrompt, userText, maxTentativas = 3) {
  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

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
      if (tentativa === maxTentativas) throw err;
      await new Promise(r => setTimeout(r, 2000 * tentativa));
    }
  }
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
  const contextText = `LEGISLAÇÃO: ${leiNome}\nDISPOSITIVO: Artigo ${numLimpo}\nTEXTO OFICIAL:\n${artigo.texto || ''}`;

  // Executa as 3 gerações em paralelo para máxima velocidade
  const [explicacao, exemplo, termos] = await Promise.all([
    chamarOmniRoute(PROMPT_EXPLICACAO, contextText),
    chamarOmniRoute(PROMPT_EXEMPLO, contextText),
    chamarOmniRoute(PROMPT_TERMOS, contextText),
  ]);

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

async function main() {
  const args = process.argv.slice(2);
  const leiFilterIndex = args.indexOf('--lei');
  const limiteIndex = args.indexOf('--limite');

  const leiFiltro = leiFilterIndex !== -1 ? args[leiFilterIndex + 1]?.toLowerCase() : null;
  const limite = limiteIndex !== -1 ? parseInt(args[limiteIndex + 1], 10) : null;

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   ROBÔ GERADOR DE EXPLICAÇÃO, EXEMPLO E TERMOS COM IA    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log(`• Motor IA: OmniRoute (${OMNIROUTE_MODEL}) em chamadas paralelas`);
  console.log(`• Filtro de Lei: ${leiFiltro ? leiFiltro.toUpperCase() : 'Todas as Leis'}`);
  if (limite) console.log(`• Limite por Execução: ${limite} artigos`);
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

  for (const lei of leisParaProcessar) {
    console.log(`\n📚 [${lei.nome}] (Slug: ${lei.slug})`);

    // Busca artigos da lei
    const { data: artigos, error } = await sb
      .from('vade_mecum_artigos')
      .select('id, numero, texto, ordem')
      .eq('lei_id', lei.id)
      .order('ordem', { ascending: true });

    if (error || !artigos || artigos.length === 0) {
      console.log(`  ↪ Nenhum artigo encontrado para esta lei no banco.`);
      continue;
    }

    console.log(`  ↪ ${artigos.length} artigos encontrados.`);

    for (let i = 0; i < artigos.length; i++) {
      if (limite && totalProcessados >= limite) {
        console.log(`\n🛑 Limite de ${limite} artigos atingido.`);
        return;
      }

      const art = artigos[i];
      const numLimpo = String(art.numero || '').replace(/^art(?:igo|\.)?\s*/i, '').trim();

      // Checar se já foi processado
      if (progresso.processados[art.id]) {
        continue;
      }

      process.stdout.write(`  [${i + 1}/${artigos.length}] Art. ${numLimpo}... `);

      try {
        const t0 = Date.now();
        await processarArtigo(art, lei.nome, lei.slug, progresso);
        const tempo = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(`✓ Concluído (${tempo}s) [Explicação + Exemplo + Termos]`);
        totalProcessados++;
      } catch (err) {
        console.log(`✗ Erro: ${err.message}`);
      }

      // Pequena pausa entre artigos
      await new Promise(r => setTimeout(r, 400));
    }
  }

  console.log(`\n🎉 Processamento finalizado! Total de artigos gerados: ${totalProcessados}`);
}

main().catch(console.error);
