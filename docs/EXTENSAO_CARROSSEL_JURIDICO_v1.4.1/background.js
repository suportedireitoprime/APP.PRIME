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
    `O carrossel deve ter entre 8 e 12 imagens. VOCÊ, IA, escolhe automaticamente a quantidade ideal conforme a complexidade do tema. O usuário não escolhe a quantidade. Use 8 quando o assunto couber de forma completa e aumente até 12 somente quando houver conteúdo relevante para justificar.`,
    'O conteúdo é voltado para estudo jurídico e deve ser didático, explicativo, objetivo e útil para estudantes e profissionais do Direito.',
    'A estrutura deve ficar lógica e progressiva: capa em forma de pergunta, conceito/introdução, desenvolvimento em blocos curtos, pelo menos um EXEMPLO PRÁTICO obrigatório, pelo menos um card de atenção/erro comum/pegadinha quando fizer sentido, e fechamento com resumo, revisão ou chamada para salvar.',
    'REGRA FIXA DA CAPA: o primeiro card deve SEMPRE começar com uma pergunta curta, direta e intrigante sobre o tema. Nunca use apenas o nome do tema como título. Abaixo da pergunta, inclua uma descrição/chamada curta que desperte curiosidade sem revelar toda a resposta. Exemplo de estrutura: pergunta “O que é dolo?” + chamada breve que faça a pessoa querer avançar.',
    'A capa deve ter impacto visual máximo: fundo vermelho vivo e forte, nunca vinho triste. Use pergunta em tipografia muito grande e legível no Instagram, imagem principal dominante à direita, e mais 2 ou 3 recortes complementares em colagem editorial premium levemente sobreposta/embaralhada. Evite texto pequeno e poluição visual.',
    'Cada imagem deve ter um título curto e forte, texto curto, muito legível e pensado para leitura em tela de celular, e também uma instrução de elemento visual principal coerente com o conteúdo daquele card.',
    'As imagens devem ser narrativas, impactantes e nada genéricas: prefira direção visual em colagem recortada semi-realista com linguagem editorial premium. Quando houver pessoas, use expressões faciais e gestos coerentes com a situação (tensão, dúvida, surpresa, confiança ou leve sorriso quando combinar). Prefira cenas concretas a símbolos jurídicos soltos.',
    'Inclua obrigatoriamente ao menos um exemplo prático com uma situação visual concreta e fácil de entender. Quando fizer sentido, também use comparação visual, passo a passo ou aplicação prática.',
    'Quando o tema envolver Direito Penal, crime, polícia, prisão, medo, flagrante ou consequência jurídica, incentive cenas específicas e visualmente fortes. Quando envolver Constituição, instituições ou Direito Público, incentive referências visuais coerentes com o Brasil e com a autoridade do tema, sempre com harmonia e sem excesso.',
    'Evite excesso de elementos visuais. A proposta deve ser direta, limpa e pontual, com poucos elementos por card.',
    'Se houver base legal relevante, mencione de forma breve e organizada.',
    'Tudo em português do Brasil, tom professoral, claro e sem enrolação. Não use termos em inglês.',
    'Evite excesso de informação por card. Prefira conteúdo direto, pontual, bem distribuído e com fácil escaneabilidade.',
    'O texto complementar deve ser curto, mas não raso: precisa ser didático e visualmente confortável, de preferência em poucas linhas.',
    'Evite sugerir muitos elementos decorativos ou muitos objetos secundários na imagem; a composição deve ser mais limpa e objetiva.',
    'Cada item do array deve vir como um mini-roteiro pronto para ser colocado no prompt da imagem, descrevendo: tipo do card, objetivo, título, texto curto, elemento visual principal, sugestão de cena específica e direção de impacto/expressão da cena.',
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
  if (lista.length < 8) throw new Error(`A IA retornou apenas ${lista.length} cards. O padrão obrigatório é de 8 a 12; gere novamente.`);
  return lista.slice(0, 12);
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
