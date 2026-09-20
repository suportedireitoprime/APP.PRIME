/* Roda em segundo plano. Recebe um pedido do painel (tema + faixa de
   quantidade) e chama a API do Gemini para gerar o texto de cada imagem
   do carrossel. Fica aqui, e não no content script, para não depender da
   política de segurança de conteúdo (CSP) da página do Flow. */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || !msg.type) return;

  if (msg.type === 'ffila-gerar-ia') {
    gerarCarrossel(msg)
      .then(itens => sendResponse({ ok: true, itens }))
      .catch(err => sendResponse({ ok: false, erro: err.message || String(err) }));
    return true;
  }

  if (msg.type === 'ffila-fetch-image') {
    buscarImagem(msg.url)
      .then(dado => sendResponse({ ok: true, ...dado }))
      .catch(err => sendResponse({ ok: false, erro: err.message || String(err) }));
    return true;
  }
});

async function buscarImagem(url) {
  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error('URL de imagem inválida para o serviço em segundo plano.');
  }
  const resp = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ao buscar a imagem.`);
  const tipo = resp.headers.get('content-type') || 'application/octet-stream';
  const buf = new Uint8Array(await resp.arrayBuffer());
  let bin = '';
  const passo = 0x8000;
  for (let i = 0; i < buf.length; i += passo) {
    bin += String.fromCharCode(...buf.subarray(i, i + passo));
  }
  return { base64: btoa(bin), contentType: tipo };
}

async function gerarCarrossel({ apiKey, modelo, tema, min, max, regras }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const linhas = [
    'Você é um estrategista de conteúdo jurídico para Instagram.',
    `Crie o roteiro de um carrossel educativo sobre o tema: "${tema}".`,
    `O carrossel deve ter entre ${min} e ${max} imagens. Escolha a quantidade ideal dentro dessa faixa. Prefira pelo menos 12 imagens para desenvolver bem o tema e use mais imagens quando o assunto pedir aprofundamento, respeitando a faixa escolhida.`,
    'O conteúdo é voltado para estudo jurídico e deve ser didático, explicativo, objetivo e útil para estudantes e profissionais do Direito.',
    'A estrutura deve ficar lógica e progressiva: capa/gancho, conceito ou introdução, desenvolvimento em blocos curtos, pelo menos um exemplo prático, pelo menos um card de atenção/erro comum/pegadinha quando fizer sentido, e fechamento com resumo, revisão ou chamada para salvar.',
    'A capa deve ser muito chamativa, com título forte e grande, visual de alto impacto e sugestão de imagem principal realista e dominante.',
    'Não exagere nos adornos. A capa deve impactar mais pela imagem principal e pela hierarquia do texto do que por excesso de detalhes.',
    'Cada imagem deve ter um título curto e forte, texto curto, muito legível e pensado para leitura em tela de celular, e também uma instrução de elemento visual principal coerente com o conteúdo daquele card.',
    'Quando fizer sentido, inclua personagem principal, cena jurídica, situação concreta, comparação visual, passo a passo ou aplicação prática.',
    'Para temas penais, criminais, investigação, prisão e processo penal, sugira imagens mais impactantes, realistas e sérias, com clima penal forte, sem gore e sem violência explícita.',
    'Evite carimbos decorativos ou selos carimbados como elemento visual, porque isso polui a imagem.',
    'Evite sugerir imagens genéricas como martelo, livro isolado, balança solta ou ícones jurídicos óbvios repetidos. Prefira cenas, pessoas e imagens de apoio coerentes com o tema do card.',
    'As imagens de complemento devem seguir a lógica de papel rasgado + colagem editorial, com recortes mais contextuais e menos genéricos.',
    'Evite excesso de elementos visuais. A proposta deve ser direta, limpa e pontual, com poucos elementos por card.',
    'Se houver base legal relevante, mencione de forma breve e organizada.',
    'Tudo em português do Brasil, tom professoral, claro e sem enrolação. Não use termos em inglês.',
    'Evite excesso de informação por card. Prefira conteúdo direto, pontual, bem distribuído e com fácil escaneabilidade.',
    'O texto complementar deve ser curto, mas não raso: precisa ser didático e visualmente confortável, de preferência em poucas linhas.',
    'Evite sugerir muitos elementos decorativos ou muitos objetos secundários na imagem; a composição deve ser mais limpa e objetiva.',
    'Dê preferência a uma imagem principal mais forte e a poucos elementos de apoio.',
    'Cada item do array deve vir como um mini-roteiro pronto para ser colocado no prompt da imagem, descrevendo: tipo do card, objetivo, título, texto curto e elemento visual principal.',
    'Pense sempre no mesmo design-padrão do carrossel, sem variar aleatoriamente o estilo entre os cards.',
    'O texto de cada card deve caber confortavelmente em layout grande e legível: evite parágrafos longos e prefira frases curtas ou poucos tópicos.',
    'Se for texto complementar, ele deve continuar bem visível, com poucas linhas e leitura confortável.'
  ];

  if (regras && regras.trim()) {
    linhas.push(
      '',
      'REGRAS OBRIGATÓRIAS — siga 100%, sem exceção, mesmo que pareçam limitar a criatividade acima:',
      regras.trim()
    );
  }

  linhas.push(
    '',
    'Responda apenas com um array JSON de strings, uma string por imagem. Cada string deve estar pronta para uso e seguir um formato natural como: "Tipo do card: ... | Objetivo: ... | Título: ... | Texto: ... | Elemento visual principal: ...".',
    'Não use markdown, não use numeração fora das strings e não escreva nada fora do array JSON.'
  );

  const instrucao = linhas.join('\n');

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: instrucao }] }],
      generationConfig: { temperature: 0.9, responseMimeType: 'application/json' }
    })
  });

  let dados;
  try { dados = await resp.json(); } catch (_) { dados = null; }

  if (!resp.ok) {
    const detalhe = dados && dados.error && dados.error.message;
    throw new Error(detalhe || `Erro HTTP ${resp.status} ao chamar a API do Gemini.`);
  }

  const texto = (dados && dados.candidates && dados.candidates[0] &&
    dados.candidates[0].content && dados.candidates[0].content.parts || [])
    .map(p => p.text || '').join('');

  const lista = extrairLista(texto);
  if (!lista.length) throw new Error('A resposta do Gemini veio vazia ou em um formato inesperado.');
  return lista;
}

function extrairLista(texto) {
  const limpo = texto.trim()
    .replace(/^```json/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();

  const tentar = str => {
    try {
      const j = JSON.parse(str);
      const arr = Array.isArray(j) ? j : (Array.isArray(j.imagens) ? j.imagens : (Array.isArray(j.slides) ? j.slides : null));
      if (!arr) return null;
      return arr
        .map(item => typeof item === 'string' ? item : (item.conteudo || item.texto || item.text || ''))
        .map(s => String(s).trim())
        .filter(Boolean);
    } catch (_) { return null; }
  };

  let lista = tentar(limpo);
  if (lista) return lista;

  const ini = limpo.indexOf('[');
  const fim = limpo.lastIndexOf(']');
  if (ini !== -1 && fim > ini) {
    lista = tentar(limpo.slice(ini, fim + 1));
    if (lista) return lista;
  }
  return [];
}
