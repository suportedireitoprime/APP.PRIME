const fs = require('fs');

const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const OMNIROUTE_URL = env.OMNIROUTE_URL || 'https://omniroute-production-fb57.up.railway.app/v1';
const OMNIROUTE_KEY = env.OMNIROUTE_KEY || 'sk-38e56915733a82fb-ae2ff9-2d6df645';
const MODEL = env.OMNIROUTE_MODEL || 'antigravity/gemini-3.8-flash-tiered';

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

async function testSingle() {
  const t0 = Date.now();
  console.log('Testando chamada ao OmniRoute...');

  const endpoint = `${OMNIROUTE_URL.replace(/\/+$/, '')}/chat/completions`;
  const userPrompt = `TIPO DE VISUAL: mapa_mental
ÁREA: Direito Administrativo
TÓPICO: Atos Administrativos
SUBTÓPICO: Elementos e Requisitos de Validade do Ato (COMFIFOM)
CONTEXTO: Matéria jurídica brasileira: Direito Administrativo. Elementos de validade do ato administrativo: Competência, Finalidade, Forma, Motivo e Objeto. Requisitos vinculados e discricionários.`;

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
      max_tokens: 3000
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }

  const json = await res.json();
  const rawContent = json.choices[0].message.content.trim();
  const cleanJson = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(cleanJson);

  console.log(`Sucesso em ${((Date.now() - t0) / 1000).toFixed(2)}s!`);
  console.log(JSON.stringify(parsed, null, 2));
}

testSingle().catch(console.error);
