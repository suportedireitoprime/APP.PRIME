const BASE = 'https://omniroute-production-fb57.up.railway.app/v1';

async function testEndpoint(name, url, headers, body) {
  try {
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    console.log(`[${name}] Status: ${res.status} | Body: ${text.slice(0, 160)}`);
  } catch (e) {
    console.log(`[${name}] Erro de rede: ${e.message}`);
  }
}

async function run() {
  console.log('--- DIAGNÓSTICO OMNIROUTE RAILWAY ---');
  // Sem auth
  await testEndpoint('GET /models (sem auth)', `${BASE}/models`, {});
  // x-api-key
  await testEndpoint('GET /models (x-api-key sk-03fcfd719bf0cc25-19fbd7-028392e5)', `${BASE}/models`, {
    'x-api-key': 'sk-03fcfd719bf0cc25-19fbd7-028392e5'
  });
  // Bearer
  await testEndpoint('GET /models (Bearer sk-03fcfd719bf0cc25-19fbd7-028392e5)', `${BASE}/models`, {
    'Authorization': 'Bearer sk-03fcfd719bf0cc25-19fbd7-028392e5'
  });
  // Chat completions com dummy
  await testEndpoint('POST /chat/completions (Bearer sk-03fcfd719bf0cc25-19fbd7-028392e5)', `${BASE}/chat/completions`, {
    'Authorization': 'Bearer sk-03fcfd719bf0cc25-19fbd7-028392e5'
  }, {
    model: 'antigravity/gemini-3.7-flash-high',
    messages: [{ role: 'user', content: 'oi' }]
  });
  // Chat completions com x-api-key
  await testEndpoint('POST /chat/completions (x-api-key)', `${BASE}/chat/completions`, {
    'x-api-key': 'sk-03fcfd719bf0cc25-19fbd7-028392e5'
  }, {
    model: 'antigravity/gemini-3.7-flash-high',
    messages: [{ role: 'user', content: 'oi' }]
  });
}

run();
