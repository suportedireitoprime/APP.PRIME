const url = 'https://omniroute-production-fb57.up.railway.app/v1/chat/completions';

async function testPrompt() {
  const slideCorpo = `<p>Nossa primeira parada é a mais antiga: o <b class="term">Código de Hamurabi</b>, escrito por volta de <b>1772 a.C.</b>, na Babilônia. É um dos primeiros grandes conjuntos de leis escritas da história, gravado em pedra para que todos pudessem conhecer as regras e as consequências de quebrá-las.</p><p>A base do código era a <b class="term">lei de talião</b>, que você conhece pela fórmula famosa: <b>olho por olho, dente por dente</b>. A lógica era a da reciprocidade exata: quem causou um dano sofria um dano igual. Hoje isso soa como vingança, e em parte era mesmo; mas repare no avanço escondido aí: a resposta deixava de ser ilimitada e passava a ter <b>medida</b>. O castigo tinha um teto: o tamanho do dano causado.</p><p>Mas não imagine um código igual para todos. O Código de Hamurabi estabelecia <b>diferentes julgamentos</b> e fazia <b>distinções entre pobres e ricos</b>: a mesma conduta podia ter consequências diferentes conforme a posição social de quem a praticava e de quem a sofria.</p><p>E como o crime era explicado nesse mundo? Sob <b>perspectivas religiosas e sobrenaturais</b>: delinquir era desagradar aos deuses e perturbar uma ordem que vinha do céu. A lei escrita era apresentada como presente divino ao rei, e desobedecer a ela era, ao mesmo tempo, crime e pecado.</p><div class="box exemplo"><div class="excontent"><p class="blabel">EXEMPLO PRÁTICO</p><p>Imagine um artesão que, numa briga, quebra o braço de outro homem livre. Pela lei de talião, a resposta prevista era equivalente: o osso dele também seria quebrado. Nada de indenização calculada, nada de pena de prisão: <b>o corpo pagava o corpo, na mesma moeda</b>.</p></div></div>`;

  const prompt = `Você é um Designer Instrucional de Elite e Arquiteto de UI/UX Educacional Jurídico.
Analise o conteúdo do seguinte slide de uma aula interativa de Criminologia / Direito Penal:

CONTEÚDO ATUAL DO SLIDE:
${slideCorpo}

SUA TAREFA:
Enriqueça este slide introduzindo elementos visuais de alta retenção mnemônica sem perder o texto original:
1. Uma TABELA COMPARATIVA didática (.tabela-comparativa-juridica) ou INFOGRÁFICO DE FLUXO (.infografico-fluxo com .fluxo-card) ou GRAFO DE CAUSA E EFEITO (.grafo-causa-efeito) que sintetize o conceito-chave.
2. Um card de alerta de prova (.alerta-concurso-card) destacando como as bancas cobram essa matéria.
3. Mantenha as classes HTML compatíveis com o design system escuro do app:
   - <div class="infografico-fluxo">...</div> com .fluxo-etapas, .fluxo-card, .fluxo-badge, etc.
   - <table class="tabela-comparativa-juridica">...</table> com th, td, td.col-destaque.
   - <div class="alerta-concurso-card"><div class="alerta-header">...</div><p>...</p></div>
   - <div class="box exemplo">...</div>
   - Preservar os termos em <b class="term"> e <b>.

IMPORTANTE: Retorne APENAS o HTML enriquecido dentro do bloco de resposta (sem explicações antes ou depois, sem crases markdown triplas se possível, apenas o código HTML puro).`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-38e56915733a82fb-ae2ff9-2d6df645'
    },
    body: JSON.stringify({
      model: 'antigravity/gemini-3.8-flash-tiered',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  });

  const data = await res.json();
  console.log('RESULTADO DO TESTE:\n', data.choices[0].message.content);
}

testPrompt().catch(console.error);

