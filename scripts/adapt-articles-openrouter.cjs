/**
 * ============================================================================
 * ROBÔ DE ADAPTAÇÃO EDITORIAL DE ARTIGOS DO BLOG VIA OPENROUTER AI
 * ============================================================================
 * Lê os artigos da tabela `blog_edicao_posts` no Supabase, envia para a API do
 * OpenRouter para enriquecimento editorial em Markdown:
 *   - Criação de títulos estruturados (## e ###)
 *   - Tópicos claros com marcadores (bullet points)
 *   - Tabelas comparativas/resumo em Markdown (| ... | ... |)
 *   - Caixas de destaque (> **💡 Destaque Prático:**)
 *   - PRESERVAÇÃO TOTAL das imagens inline (![legenda](url))
 *
 * Modo de uso no terminal:
 *   node scripts/adapt-articles-openrouter.cjs --key=sk-or-v1-...
 *   node scripts/adapt-articles-openrouter.cjs --limit=5 --dry-run
 *   node scripts/adapt-articles-openrouter.cjs --categoria="Direito Constitucional"
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// 1. CARREGAMENTO DE VARIÁVEIS DE AMBIENTE (.env)
// ---------------------------------------------------------------------------
const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\x1b[31m[ERRO] Credenciais do Supabase não encontradas no .env\x1b[0m');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// 2. PARSE DE ARGUMENTOS DA LINHA DE COMANDO
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
function getArg(name, defaultValue = null) {
  const prefix = `--${name}=`;
  const found = args.find(a => a.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  if (args.includes(`--${name}`)) return true;
  return defaultValue;
}

const OPENROUTER_API_KEY =
  getArg('key') ||
  process.env.OPENROUTER_API_KEY ||
  env.OPENROUTER_API_KEY ||
  '';

const MODEL = getArg('model', 'google/gemini-2.5-flash');
const LIMIT = getArg('limit') ? parseInt(getArg('limit'), 10) : null;
const OFFSET = getArg('offset') ? parseInt(getArg('offset'), 10) : 0;
const CATEGORIA = getArg('categoria', null);
const DRY_RUN = Boolean(getArg('dry-run', false));
const FORCE = Boolean(getArg('force', false));
const CONCURRENCY = parseInt(getArg('concurrency', '1'), 10);

// Log file persistente
const LOG_FILE = path.resolve('scripts/adapt-articles.log');
fs.writeFileSync(LOG_FILE, `=== INÍCIO DA EXECUÇÃO: ${new Date().toISOString()} ===\n`, { flag: 'a' });

function writeLog(msg) {
  const cleanMsg = msg.replace(/\x1b\[[0-9;]*m/g, '');
  try {
    fs.appendFileSync(LOG_FILE, `[${new Date().toLocaleTimeString('pt-BR')}] ${cleanMsg}\n`);
  } catch {}
}

function log(msg) {
  console.log(msg);
  writeLog(msg);
}

// ---------------------------------------------------------------------------
// 3. PROMPT DE ENRIQUECIMENTO EDITORIAL EM MARKDOWN
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `Você é um Editor Jurídico Sênior e Especialista em Didática do Direito e Formatação Markdown.
Sua missão é receber um artigo jurídico bruto e transformá-lo em uma peça de leitura PREMIUM, visualmente atraente, extremamente clara e rica didaticamente.

DIRETRIZES DE FORMATAÇÃO E ESTRUTURAÇÃO:
1. PRESERVAÇÃO TOTAL DAS IMAGENS (REGRA CRÍTICA INVIOLÁVEL):
   - O texto original pode conter imagens no formato Markdown: ![Legenda](https://pub-.../imagem.png)
   - Você DEVE manter TODAS as imagens originais, exatamente com o mesmo URL e mesma sintaxe de Markdown.
   - Posicione cada imagem de forma contextualizada entre seções pertinentes, nunca delete nem altere o link de nenhuma imagem.

2. TÍTULOS E SUBTÍTULOS ESTRUTURADOS:
   - Use ## para tópicos principais (seções temáticas bem delimitadas).
   - Use ### para subtópicos, etapas ou detalhamentos.
   - Crie títulos claros e atrativos. NÃO crie título # h1 no início (o sistema já renderiza o título na capa).

3. TÓPICOS E LISTAS COM MARCADORES:
   - Transforme blocos densos de texto explicativo em listas claras com bullet points (- ), destacando a ideia central em negrito no início de cada item (ex: "- **Requisito temporal:** o prazo decadencial de...").
   - Use listas numeradas quando houver sequência lógica ou cronológica de etapas procedimentais.

4. TABELAS COMPARATIVAS / SÍNTESE (MARKDOWN TABLES):
   - Em todo artigo onde fizer sentido pedagógico, crie pelo menos UMA tabela comparativa em Markdown (| Coluna 1 | Coluna 2 | Coluna 3 |).
   - Exemplos: diferenças entre institutos, tabela de prazos, requisitos legais x exceções, competências, quadro sinóptico resumo.

5. CAIXAS DE DESTAQUE / CALLOUTS:
   - Crie citações informativas e práticas usando a sintaxe de blockquote:
     > **💡 Destaque Prático:** [Dica de aplicação prática, jurisprudência ou macete para concurso/exame]
     > **⚠️ Ponto de Atenção:** [Exceção legal ou erro comum na interpretação]

6. CONTEÚDO E FIDELIDADE:
   - Mantenha 100% da fidelidade técnica, jurídica e legislativa do texto original. Não invente leis nem altere o sentido técnico do autor.
   - Melhore a fluidez, ritmo de leitura e escaneabilidade do texto.

RETORNE APENAS O MARKDOWN DO ARTIGO EDITADO, SEM MENSAGENS ANTES OU DEPOIS, SEM BLOCOS DELIMITADORES DE CÓDIGO (\`\`\`markdown ... \`\`\`). Retorne o texto direto em Markdown.`;

// ---------------------------------------------------------------------------
// 4. CHAMADA À API DO OPENROUTER
// ---------------------------------------------------------------------------
async function callOpenRouter(apiKey, model, title, category, originalMarkdown) {
  const userPrompt = `ARTIGO: "${title}"
CATEGORIA: ${category}

CONTEÚDO ORIGINAL A SER EDITADO:
${originalMarkdown}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://estudosjuridicos.com',
      'X-Title': 'Estudos Juridicos Blog Adapter',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.25,
      max_tokens: 16000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  const choice = json.choices && json.choices[0];
  if (!choice || !choice.message || !choice.message.content) {
    throw new Error('Resposta vazia da OpenRouter API');
  }

  let text = choice.message.content.trim();
  // Se o modelo envolveu em ```markdown ... ```, remover a casca externa
  if (text.startsWith('```markdown')) {
    text = text.replace(/^```markdown\s*/i, '').replace(/```\s*$/i, '').trim();
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/```\s*$/i, '').trim();
  }

  return text;
}

// ---------------------------------------------------------------------------
// 5. VALIDAÇÃO E RECUPERAÇÃO DE IMAGENS
// ---------------------------------------------------------------------------
function preserveImages(originalMd, newMd) {
  const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/g;
  const originalImgs = [];
  let m;
  while ((m = imgRegex.exec(originalMd)) !== null) {
    originalImgs.push({ full: m[0], alt: m[1], url: m[2] });
  }

  if (originalImgs.length === 0) {
    return { markdown: newMd, preservedCount: 0, restoredCount: 0 };
  }

  let finalMd = newMd;
  let restored = 0;

  for (const img of originalImgs) {
    // Se a URL não existe no novo markdown, reinserir
    if (!finalMd.includes(img.url)) {
      finalMd += `\n\n${img.full}\n`;
      restored++;
    }
  }

  return {
    markdown: finalMd,
    preservedCount: originalImgs.length,
    restoredCount: restored
  };
}

// ---------------------------------------------------------------------------
// 6. DETECÇÃO SE O ARTIGO JÁ POSSUI FORMATAÇÃO RICA
// ---------------------------------------------------------------------------
function isAlreadyAdapted(md) {
  if (!md) return false;
  const hasHeadings = (md.match(/^##\s+/gm) || []).length >= 2;
  const hasTables = md.includes('| ---') || md.includes('|:---') || md.includes('| :---');
  const hasLists = (md.match(/^-\s+\*\*/gm) || []).length >= 3;
  return hasHeadings && (hasTables || hasLists);
}

// ---------------------------------------------------------------------------
// 7. FUNÇÃO PRINCIPAL DO ROBÔ
// ---------------------------------------------------------------------------
async function main() {
  console.clear();
  log('\x1b[36m========================================================================\x1b[0m');
  log('\x1b[1m\x1b[35m  ⚡ ROBÔ DE ADAPTAÇÃO EDITORIAL DE ARTIGOS DO BLOG (OPENROUTER AI) ⚡\x1b[0m');
  log('\x1b[36m========================================================================\x1b[0m');
  log(`Modelo AI selecionado : \x1b[33m${MODEL}\x1b[0m`);
  log(`Modo DRY RUN         : \x1b[33m${DRY_RUN ? 'SIM (sem alterar o banco)' : 'NÃO (salva no Supabase)'}\x1b[0m`);
  log(`Forçar re-adaptação   : \x1b[33m${FORCE ? 'SIM' : 'NÃO (pula artigos já estruturados)'}\x1b[0m`);
  if (CATEGORIA) log(`Filtro por categoria  : \x1b[33m${CATEGORIA}\x1b[0m`);
  if (LIMIT) log(`Limite de artigos     : \x1b[33m${LIMIT}\x1b[0m`);
  log(`Arquivo de Log        : \x1b[34m${LOG_FILE}\x1b[0m`);
  log('------------------------------------------------------------------------\n');

  let key = OPENROUTER_API_KEY;
  if (!key) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    key = await new Promise(resolve => {
      rl.question('\x1b[33mDigite sua OPENROUTER_API_KEY (ou passe com --key=...): \x1b[0m', ans => {
        rl.close();
        resolve(ans.trim());
      });
    });
  }

  if (!key) {
    log('\x1b[31m[ERRO] OPENROUTER_API_KEY não foi informada. Abortando.\x1b[0m');
    log('Dica: Execute passando a chave: node scripts/adapt-articles-openrouter.cjs --key=sk-or-v1-...\n');
    process.exit(1);
  }

  // Buscar artigos no Supabase
  log('\x1b[36m[1/3] Consultando artigos em blog_edicao_posts no Supabase...\x1b[0m');
  let query = supabase
    .from('blog_edicao_posts')
    .select('id, titulo, categoria, length:conteudo_md, conteudo_md, created_at')
    .order('created_at', { ascending: true });

  if (CATEGORIA) {
    query = query.eq('categoria', CATEGORIA);
  }

  if (LIMIT) {
    query = query.range(OFFSET, OFFSET + LIMIT - 1);
  }

  const { data: posts, error } = await query;
  if (error) {
    log(`\x1b[31m[ERRO] Falha ao consultar posts: ${error.message}\x1b[0m`);
    process.exit(1);
  }

  if (!posts || posts.length === 0) {
    log('\x1b[33mNenhum post encontrado com os critérios fornecidos.\x1b[0m');
    process.exit(0);
  }

  log(`\x1b[32m[✓] Encontrados ${posts.length} posts para processamento.\x1b[0m\n`);

  // Estatísticas
  let totalProcessed = 0;
  let totalAdapted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalTablesCreated = 0;
  const startTime = Date.now();

  log('\x1b[36m[2/3] Iniciando adaptação editorial...\x1b[0m\n');

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const indexStr = `[${i + 1}/${posts.length}]`;
    const percent = Math.round(((i + 1) / posts.length) * 100);

    // Barra de progresso visual
    const barWidth = 20;
    const filled = Math.round((percent / 100) * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

    log(`\x1b[34m${indexStr} [${bar}] ${percent}%\x1b[0m | ID: \x1b[2m${post.id}\x1b[0m`);
    log(`     Título   : \x1b[1m${post.titulo}\x1b[0m`);
    log(`     Categoria: ${post.categoria}`);

    if (!post.conteudo_md || post.conteudo_md.trim().length < 50) {
      log(`     \x1b[33m[PULADO] Conteúdo vazio ou muito curto.\x1b[0m\n`);
      totalSkipped++;
      continue;
    }

    // Verificar se já está adaptado e se não tem flag --force
    if (!FORCE && isAlreadyAdapted(post.conteudo_md)) {
      log(`     \x1b[32m[PULADO] Artigo já possui formatação rica (tabelas e tópicos detectados).\x1b[0m`);
      log(`              (Use --force para re-adaptar)\n`);
      totalSkipped++;
      continue;
    }

    try {
      const postStartTime = Date.now();
      process.stdout.write(`     \x1b[35m[→] Enviando para OpenRouter (${MODEL})...\x1b[0m `);

      const adaptedMarkdown = await callOpenRouter(
        key,
        MODEL,
        post.titulo,
        post.categoria,
        post.conteudo_md
      );

      const elapsedSec = ((Date.now() - postStartTime) / 1000).toFixed(1);

      // Preservar e checar imagens
      const { markdown: safeMarkdown, preservedCount, restoredCount } = preserveImages(
        post.conteudo_md,
        adaptedMarkdown
      );

      // Métricas da nova formatação
      const headingsCount = (safeMarkdown.match(/^##\s+/gm) || []).length;
      const subheadingsCount = (safeMarkdown.match(/^###\s+/gm) || []).length;
      const tablesCount = (safeMarkdown.match(/\| :?---/g) || []).length;
      const bulletsCount = (safeMarkdown.match(/^-\s+/gm) || []).length;
      totalTablesCreated += tablesCount;

      console.log(`\x1b[32mOK (${elapsedSec}s)\x1b[0m`);
      log(`     \x1b[36mMétricas : ${headingsCount} seções | ${subheadingsCount} subtópicos | ${bulletsCount} tópicos | ${tablesCount} tabela(s)\x1b[0m`);
      log(`     \x1b[36mImagens  : ${preservedCount} preservadas${restoredCount > 0 ? ` (${restoredCount} restauradas)` : ''}\x1b[0m`);

      // Salvar no banco
      if (DRY_RUN) {
        log(`     \x1b[33m[DRY-RUN] Nenhuma alteração gravada no banco.\x1b[0m\n`);
      } else {
        const { error: updateError } = await supabase
          .from('blog_edicao_posts')
          .update({
            conteudo_md: safeMarkdown
          })
          .eq('id', post.id);

        if (updateError) {
          throw new Error(`Falha no update Supabase: ${updateError.message}`);
        }

        log(`     \x1b[32m[SALVO] Atualizado com sucesso no Supabase!\x1b[0m\n`);
      }

      totalAdapted++;
    } catch (err) {
      console.log(`\x1b[31mFALHOU\x1b[0m`);
      log(`     \x1b[31m[ERRO] ${err.message}\x1b[0m\n`);
      totalErrors++;

      // Se for rate limit (429), pausa 10s antes do próximo
      if (err.message.includes('429')) {
        log(`     \x1b[33mRate limit atingido. Pausando 10 segundos...\x1b[0m`);
        await new Promise(r => setTimeout(r, 10000));
      }
    }

    totalProcessed++;

    // Pequeno intervalo de cortesia para não estourar rate limit
    if (i < posts.length - 1) {
      await new Promise(r => setTimeout(r, 600));
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  log('\x1b[36m========================================================================\x1b[0m');
  log('\x1b[1m\x1b[32m  ✔ PROCESSO DE ADAPTAÇÃO FINALIZADO!\x1b[0m');
  log('\x1b[36m========================================================================\x1b[0m');
  log(`Total analisados    : \x1b[1m${totalProcessed}\x1b[0m`);
  log(`Total adaptados     : \x1b[32m${totalAdapted}\x1b[0m`);
  log(`Total pulados       : \x1b[33m${totalSkipped}\x1b[0m`);
  log(`Total erros         : \x1b[31m${totalErrors}\x1b[0m`);
  log(`Tabelas geradas     : \x1b[35m${totalTablesCreated}\x1b[0m`);
  log(`Tempo total         : ${totalDuration}s`);
  log(`Log detalhado salvo : \x1b[34m${LOG_FILE}\x1b[0m`);
  log('========================================================================\n');
}

main().catch(err => {
  log(`\x1b[31m[ERRO FATAL] ${err.stack || err.message}\x1b[0m`);
  process.exit(1);
});
