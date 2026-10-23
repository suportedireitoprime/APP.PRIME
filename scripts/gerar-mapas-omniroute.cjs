/**
 * ============================================================================
 * ROBÔ GERADOR DE MAPAS MENTAIS & VISUAIS JURÍDICOS VIA OMNIROUTE (AI GATEWAY)
 * ============================================================================
 * 
 * Gera os 4 tipos de visuais (mapa_mental, infografico, fluxograma, diagrama)
 * para todos os subtemas/tópicos das matérias e salva no Supabase.
 *
 * Como rodar no terminal:
 *   node scripts/gerar-mapas-omniroute.cjs
 *   node scripts/gerar-mapas-omniroute.cjs --concurrency=4
 *   node scripts/gerar-mapas-omniroute.cjs --area="Direito Administrativo"
 *   node scripts/gerar-mapas-omniroute.cjs --tipo=mapa_mental
 *   node scripts/gerar-mapas-omniroute.cjs --limit=10
 *   node scripts/gerar-mapas-omniroute.cjs --dry-run
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. CARREGAR VARIÁVEIS DE AMBIENTE (.env)
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

// 2. PARSE DE ARGUMENTOS DA LINHA DE COMANDO
const args = process.argv.slice(2);
function getArg(name, defaultValue = null) {
  const prefix = `--${name}=`;
  const found = args.find(a => a.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  if (args.includes(`--${name}`)) return true;
  return defaultValue;
}

const OMNIROUTE_URL = (getArg('url') || env.OMNIROUTE_URL || 'https://omniroute-production-fb57.up.railway.app/v1').replace(/\/+$/, '');
const OMNIROUTE_KEY = getArg('key') || env.OMNIROUTE_KEY || 'sk-38e56915733a82fb-ae2ff9-2d6df645';
const MODEL = getArg('model') || env.OMNIROUTE_MODEL || 'antigravity/gemini-3.8-flash-tiered';
const CONCURRENCY = parseInt(getArg('concurrency', '4'), 10);
const FILTER_AREA = getArg('area', null);
const FILTER_TIPO = getArg('tipo', null);
const LIMIT = getArg('limit') ? parseInt(getArg('limit'), 10) : null;
const DRY_RUN = Boolean(getArg('dry-run', false));

const CHECKPOINT_FILE = path.resolve('scripts/mapas_gerados_checkpoint.json');
const LOG_FILE = path.resolve('scripts/gerar-mapas.log');

// 3. UTILITÁRIOS DE STRING E SLUG
const norm = (v) =>
  (v || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const slug = (v) =>
  v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function chaveDe(baseKey, sub, kind = 'artigo') {
  const a = (sub || '').trim().replace(/^art\.?\s*/i, '');
  if (!a) return baseKey;
  return `${baseKey}#${kind === 'tema' ? 'tema' : 'art'}-${norm(a).replace(/[^a-z0-9]+/g, '-')}`;
}

function clamp(v, max) {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function formatDuration(ms) {
  if (ms <= 0 || !isFinite(ms)) return '00m 00s';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hours > 0) {
    return `${hours}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

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

// 4. PROMPT DE GERAÇÃO ESTRUTURADA
const SYSTEM_PROMPT = `Você é um Especialista em Direito Brasileiro e Designer de Esquemas Didáticos Visuais.
Sua missão é gerar conteúdo estritamente no formato JSON para visuais jurídicos de estudo (mapa_mental, infografico, fluxograma ou diagrama).

REGRAS GERAIS INVIOLÁVEIS:
1. Responda APENAS com um objeto JSON válido, sem texto antes ou depois, sem markdown (sem \`\`\`json).
2. O conteúdo deve ser 100% embasado na doutrina, legislação e jurisprudência brasileira vigentes.
3. Não use jargões vagos: seja cirúrgico, didático e de alto valor para concursos e OAB.

LIMITES E ESTRUTURA PARA CADA TIPO:

Se tipo === 'mapa_mental':
{
  "tipo": "mapa_mental",
  "titulo": "string (máx 70 chars)",
  "subtitulo": "string (máx 130 chars)",
  "fonte": "string citando lei/CF/doutrina (máx 90 chars)",
  "central": "Conceito central curto (máx 34 chars)",
  "ramos": [
    {
      "titulo": "Título do ramo (máx 44 chars)",
      "itens": ["Item 1 (máx 70 chars)", "Item 2", "Item 3"] // 3 a 5 itens por ramo
    }
    // 4 a 6 ramos no total
  ]
}

Se tipo === 'infografico':
{
  "tipo": "infografico",
  "titulo": "string (máx 70 chars)",
  "subtitulo": "string (máx 130 chars)",
  "fonte": "string citando lei/CF/doutrina (máx 90 chars)",
  "rodape": "Síntese / dica de prova para rodapé (máx 180 chars)",
  "cards": [
    {
      "titulo": "Título do cartão (máx 44 chars)",
      "texto": "Explicação clara e objetiva do ponto/requisito (máx 200 chars)"
    }
    // 4 a 6 cards
  ]
}

Se tipo === 'fluxograma':
{
  "tipo": "fluxograma",
  "titulo": "string (máx 70 chars)",
  "subtitulo": "string (máx 130 chars)",
  "fonte": "string citando lei/CF (máx 90 chars)",
  "entrada": "Fato inicial / Situação prática (máx 70 chars)",
  "decisoes": [
    {
      "pergunta": "Pergunta de decisão (sim/não) (máx 78 chars)",
      "seNao": "Consequência caso a resposta seja NÃO (máx 70 chars)",
      "base": "Artigo ou súmula base (máx 40 chars)"
    }
    // 3 a 5 decisões sequenciais
  ],
  "resultado": "Consequência jurídica final se todas as respostas forem SIM (máx 70 chars)"
}

Se tipo === 'diagrama':
{
  "tipo": "diagrama",
  "titulo": "string (máx 70 chars)",
  "subtitulo": "string (máx 130 chars)",
  "fonte": "string citando lei/CF/doutrina (máx 90 chars)",
  "raiz": "Conceito-raiz / Gênero (máx 50 chars)",
  "grupos": [
    {
      "titulo": "Espécie / Grupo (máx 44 chars)",
      "itens": ["Característica 1 (máx 64 chars)", "Característica 2", "Característica 3"] // 3 a 5 itens
    }
    // 3 a 5 grupos
  ]
}`;

// 5. NORMALIZAÇÃO DO CONTRATO
function normalizeVisualContent(tipo, raw) {
  if (!raw || typeof raw !== 'object') return null;
  const base = {
    titulo: clamp(raw.titulo || 'Esquema Jurídico', 72),
    subtitulo: raw.subtitulo ? clamp(raw.subtitulo, 130) : undefined,
    fonte: clamp(raw.fonte || 'Legislação e Doutrina', 90),
  };

  if (tipo === 'mapa_mental') {
    const ramos = (Array.isArray(raw.ramos) ? raw.ramos : [])
      .map(r => ({
        titulo: clamp(r?.titulo, 44),
        itens: (Array.isArray(r?.itens) ? r.itens : []).map(i => clamp(i, 70)).filter(Boolean),
        nota: r?.nota ? clamp(r.nota, 90) : undefined
      }))
      .filter(r => r.titulo && r.itens.length >= 2);
    if (ramos.length < 3) return null;
    return { tipo, ...base, central: clamp(raw.central || base.titulo, 34), ramos };
  }

  if (tipo === 'infografico') {
    const cards = (Array.isArray(raw.cards) ? raw.cards : [])
      .map(c => ({
        titulo: clamp(c?.titulo, 44),
        texto: clamp(c?.texto, 200)
      }))
      .filter(c => c.titulo && c.texto);
    if (cards.length < 3) return null;
    return { tipo, ...base, cards, rodape: raw.rodape ? clamp(raw.rodape, 180) : undefined };
  }

  if (tipo === 'fluxograma') {
    const decisoes = (Array.isArray(raw.decisoes) ? raw.decisoes : [])
      .map(d => ({
        pergunta: clamp(d?.pergunta, 78),
        seNao: clamp(d?.seNao, 70),
        base: d?.base ? clamp(d.base, 40) : undefined
      }))
      .filter(d => d.pergunta && d.seNao);
    if (decisoes.length < 2) return null;
    return {
      tipo,
      ...base,
      entrada: clamp(raw.entrada || 'Fato Concreto', 72),
      decisoes,
      resultado: clamp(raw.resultado || 'Consequência Jurídica', 70)
    };
  }

  if (tipo === 'diagrama') {
    const grupos = (Array.isArray(raw.grupos) ? raw.grupos : [])
      .map(g => ({
        titulo: clamp(g?.titulo, 44),
        itens: (Array.isArray(g?.itens) ? g.itens : []).map(i => clamp(i, 64)).filter(Boolean),
        nota: g?.nota ? clamp(g.nota, 90) : undefined
      }))
      .filter(g => g.titulo && g.itens.length >= 2);
    if (grupos.length < 2) return null;
    return { tipo: 'diagrama', ...base, raiz: clamp(raw.raiz || base.titulo, 52), grupos };
  }

  return null;
}

// 6. CHAMADA COM RETRY AO OMNIROUTE
async function callOmniRouteWithRetry(tipo, area, tema, subtema, maxRetries = 3) {
  const endpoint = `${OMNIROUTE_URL}/chat/completions`;
  const userPrompt = `TIPO DE VISUAL: ${tipo}
ÁREA: ${area}
TÓPICO: ${tema}
SUBTÓPICO: ${subtema}
CONTEXTO: Matéria jurídica brasileira: ${area}. Foque especificamente no instituto/tema "${subtema}", contido em "${tema}". Destaque conceitos, requisitos, prazos, consequências práticas e distinções doutrinárias essenciais.`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OMNIROUTE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          max_tokens: 3500
        }),
        signal: AbortSignal.timeout(45000)
      });

      if (!res.ok) {
        const errText = await res.text();
        if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
          const waitMs = attempt * 3000;
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }

      const json = await res.json();
      const rawText = json.choices?.[0]?.message?.content?.trim() || '';
      const cleanJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/```\s*$/, '')
        .trim();

      const parsed = JSON.parse(cleanJson);
      const normalized = normalizeVisualContent(tipo, parsed);
      if (!normalized) {
        throw new Error('Conteúdo gerado não atendeu ao contrato mínimo.');
      }
      return normalized;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

// 7. EXECUÇÃO PRINCIPAL
async function main() {
  console.clear();
  log('\x1b[35m========================================================================================\x1b[0m');
  log('\x1b[1m\x1b[36m   ⚡ ROBÔ GERADOR DE MAPAS MENTAIS & VISUAIS JURÍDICOS (OMNIROUTE) ⚡\x1b[0m');
  log('\x1b[35m========================================================================================\x1b[0m');
  log(`OmniRoute Endpoint : \x1b[33m${OMNIROUTE_URL}\x1b[0m`);
  log(`Modelo IA          : \x1b[33m${MODEL}\x1b[0m`);
  log(`Concorrência       : \x1b[33m${CONCURRENCY} workers paralelos\x1b[0m`);
  log(`Modo DRY RUN       : \x1b[33m${DRY_RUN ? 'SIM (apenas teste)' : 'NÃO (grava no Supabase)'}\x1b[0m`);
  if (FILTER_AREA) log(`Filtro Área        : \x1b[33m${FILTER_AREA}\x1b[0m`);
  if (FILTER_TIPO) log(`Filtro Tipo        : \x1b[33m${FILTER_TIPO}\x1b[0m`);
  if (LIMIT) log(`Limite Máximo      : \x1b[33m${LIMIT} visuais\x1b[0m`);
  log(`Log de Execução    : \x1b[34m${LOG_FILE}\x1b[0m`);
  log('----------------------------------------------------------------------------------------\n');

  // Passo 1: Carregar todos os visuais já existentes no Supabase
  process.stdout.write('🔍 Consultando visuais já existentes no Supabase... ');
  const existentes = new Set();
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('visuais_juridicos')
      .select('item_key, tipo')
      .range(from, from + step - 1);
    if (error) {
      console.error('\nErro ao buscar visuais_juridicos:', error);
      break;
    }
    if (!data?.length) break;
    data.forEach(v => existentes.add(`${v.item_key}::${v.tipo}`));
    if (data.length < step) break;
    from += step;
  }
  console.log(`\x1b[32mOK (${existentes.size} já prontos)\x1b[0m`);

  // Carregar checkpoint local se existir
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const localCk = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      localCk.forEach(k => existentes.add(k));
    } catch {}
  }

  // Passo 2: Carregar todas as matérias e subtemas de resumos_juridicos
  process.stdout.write('📚 Carregando catálogo de resumos jurídicos... ');
  let resumos = [];
  from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('resumos_juridicos')
      .select('id, area, tema, subtema')
      .range(from, from + step - 1);
    if (error) {
      console.error('\nErro ao buscar resumos_juridicos:', error);
      break;
    }
    if (!data?.length) break;
    resumos.push(...data);
    if (data.length < step) break;
    from += step;
  }
  console.log(`\x1b[32mOK (${resumos.length} capítulos encontrados)\x1b[0m\n`);

  // Passo 3: Montar fila de tarefas pendentes
  const TIPOS = FILTER_TIPO ? [FILTER_TIPO] : ['mapa_mental', 'infografico', 'fluxograma', 'diagrama'];
  const queue = [];

  for (const r of resumos) {
    const area = (r.area || '').trim();
    if (FILTER_AREA && !norm(area).includes(norm(FILTER_AREA))) continue;

    const tema = (r.tema || 'Geral').trim();
    const subtema = (r.subtema || '').trim();
    if (!area || !subtema) continue;

    const areaKey = `materia:${slug(area)}`;
    const chave = chaveDe(areaKey, `${tema} ${subtema}`, 'tema');
    const rotulo = `${area} — ${tema} · ${subtema}`;

    for (const tipo of TIPOS) {
      const taskKey = `${chave}::${tipo}`;
      if (!existentes.has(taskKey)) {
        queue.push({
          area,
          tema,
          subtema,
          tipo,
          chave,
          rotulo,
          taskKey
        });
      }
    }
  }

  const totalParaProcessar = LIMIT ? Math.min(queue.length, LIMIT) : queue.length;
  const itensFila = queue.slice(0, totalParaProcessar);

  log(`📋 \x1b[1mTotal de visuais pendentes para gerar: \x1b[33m${totalParaProcessar}\x1b[0m (de ${queue.length} pendentes globais)\n`);

  if (totalParaProcessar === 0) {
    log('\x1b[32m✨ Todos os visuais para os filtros informados já estão 100% gerados no Supabase!\x1b[0m');
    return;
  }

  const startTime = Date.now();
  let completed = 0;
  let successCount = 0;
  let errorCount = 0;
  const recentDurations = [];
  const localCheckpoint = new Set(existentes);

  function saveCheckpoint() {
    try {
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify([...localCheckpoint]));
    } catch {}
  }

  // Worker com controle de concorrência
  async function worker(id) {
    while (itensFila.length > 0) {
      const task = itensFila.shift();
      if (!task) break;

      const itemStart = Date.now();
      const currentIdx = ++completed;
      const pct = ((currentIdx / totalParaProcessar) * 100).toFixed(1);

      // Calcular tempo decorrido, tempo médio e ETA
      const elapsedTotalMs = Date.now() - startTime;
      const avgItemMs = elapsedTotalMs / currentIdx;
      const remainingItems = totalParaProcessar - currentIdx;
      const etaMs = remainingItems * avgItemMs;
      const speedPerMin = ((currentIdx / (elapsedTotalMs / 60000)) || 0).toFixed(1);
      const avgSecStr = (avgItemMs / 1000).toFixed(1);

      // Barra de progresso visual
      const barWidth = 20;
      const filled = Math.round((currentIdx / totalParaProcessar) * barWidth);
      const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, barWidth - filled));

      const tipoIcon = {
        mapa_mental: '🧠',
        infografico: '📊',
        fluxograma: '🔀',
        diagrama: '🌲'
      }[task.tipo] || '📄';

      log(
        `\x1b[36m[W${id}] [${bar}] ${pct}%\x1b[0m (${currentIdx}/${totalParaProcessar}) | ` +
        `⏱ \x1b[33mMéd: ${avgSecStr}s/item\x1b[0m | ` +
        `⏳ \x1b[32mETA: ${formatDuration(etaMs)}\x1b[0m (decorrido: ${formatDuration(elapsedTotalMs)}) | ` +
        `⚡ ${speedPerMin}/min | ` +
        `${tipoIcon} \x1b[1m${task.tipo}\x1b[0m`
      );
      log(`     \x1b[2m${task.rotulo}\x1b[0m`);

      try {
        const conteudo = await callOmniRouteWithRetry(task.tipo, task.area, task.tema, task.subtema);
        const itemDurSec = ((Date.now() - itemStart) / 1000).toFixed(1);

        if (!DRY_RUN) {
          // Checagem prévia para evitar falha de constraint ON CONFLICT
          const { data: existingRec } = await supabase
            .from('visuais_juridicos')
            .select('id')
            .eq('item_key', task.chave)
            .eq('tipo', task.tipo)
            .maybeSingle();

          if (existingRec?.id) {
            const { error: updErr } = await supabase
              .from('visuais_juridicos')
              .update({
                categoria: 'materias',
                item_label: task.rotulo,
                titulo: conteudo.titulo,
                conteudo,
                fonte: conteudo.fonte || null,
                modelo: MODEL,
                gerado_por: 'omniroute-robot',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingRec.id);
            if (updErr) throw updErr;
          } else {
            const { error: insErr } = await supabase
              .from('visuais_juridicos')
              .insert({
                categoria: 'materias',
                tipo: task.tipo,
                item_key: task.chave,
                item_label: task.rotulo,
                titulo: conteudo.titulo,
                conteudo,
                fonte: conteudo.fonte || null,
                modelo: MODEL,
                gerado_por: 'omniroute-robot',
                views: 0
              });
            if (insErr) throw insErr;
          }
        }

        successCount++;
        localCheckpoint.add(task.taskKey);
        if (successCount % 5 === 0) saveCheckpoint();

        log(`     \x1b[32m✔ Sucesso em ${itemDurSec}s — "${conteudo.titulo}" salvo no Supabase!\x1b[0m\n`);
      } catch (err) {
        errorCount++;
        log(`     \x1b[31m✖ Erro: ${err.message}\x1b[0m\n`);
      }
    }
  }

  // Disparar workers em paralelo
  const workers = Array.from({ length: Math.min(CONCURRENCY, totalParaProcessar) }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  saveCheckpoint();

  const totalTime = Date.now() - startTime;
  log('\x1b[35m========================================================================================\x1b[0m');
  log('\x1b[1m\x1b[32m                           🏁 EXECUÇÃO CONCLUÍDA! 🏁\x1b[0m');
  log('\x1b[35m========================================================================================\x1b[0m');
  log(`Total processado : ${completed}`);
  log(`Sucessos salvos  : \x1b[32m${successCount}\x1b[0m`);
  log(`Erros            : \x1b[31m${errorCount}\x1b[0m`);
  log(`Tempo total      : \x1b[33m${formatDuration(totalTime)}\x1b[0m`);
  log(`Tempo médio/item : \x1b[33m${((totalTime / Math.max(1, completed)) / 1000).toFixed(1)}s\x1b[0m`);
  log('========================================================================================\n');
}

main().catch(err => {
  console.error('\x1b[31m[ERRO FATAL]\x1b[0m', err);
});
