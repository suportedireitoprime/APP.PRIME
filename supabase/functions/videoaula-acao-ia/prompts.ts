export type AulaCtx = {
  titulo: string;
  area: string;
  conteudo: string;
  descricao: string;
  fonte?: "transcrição" | "descrição";
};

function header(c: AulaCtx) {
  const fonte = c.fonte || (c.conteudo ? "descrição" : "tema");
  const base = c.conteudo || c.descricao;
  const parts = [
    `Aula: ${c.titulo}`,
    c.area ? `Área: ${c.area}` : null,
    "",
    `Base principal da aula (${fonte}; use como única base material):`,
    base ||
      "(sem transcrição/descrição jurídica disponível — use o título limpo e a área para gerar conteúdo de revisão do tema jurídico, sem mencionar plataforma ou canal)",
    c.descricao && c.descricao !== c.conteudo ? `\nDescrição complementar:\n${c.descricao}` : null,
    "\nRegras obrigatórias: produza conteúdo de Direito sobre o tema indicado no título/área. Ignore totalmente texto institucional, propaganda, saudação, missão da plataforma, curso gratuito, links, nomes de canal/professor e qualquer trecho que não ensine Direito. Nunca gere itens vazios. Se a base vier pobre, use o tema jurídico limpo como referência para revisão de concursos e OAB, mas não mencione plataforma/canal.",
  ].filter(Boolean);
  return parts.join("\n");
}

export function buildPrompt(tipo: string, c: AulaCtx): string {
  const ctx = header(c);
  switch (tipo) {
    case "flashcards":
      return `Você é uma professora de Direito criando flashcards de revisão para concursos e OAB a partir do conteúdo jurídico explicado na videoaula.\n${ctx}\n\nGere 8 flashcards sobre conceitos, regras, classificações, prazos, exceções e aplicações jurídicas abordadas. NÃO crie cartões sobre plataforma, canal, ensino gratuito, apresentação do curso ou frases institucionais.\nResponda APENAS JSON estrito (sem \`\`\`):\n{"cards":[{"frente":"...","verso":"..."}]}`;

    case "lacunas":
      return `Você é uma professora de Direito criando flashcards do tipo CLOZE (lacuna) sobre o tema desta videoaula.\n${ctx}\n\nGere 8 cartões. Em "frente" coloque uma frase doutrinária/legal com a palavra-chave SUBSTITUÍDA por "_____" (5 underlines). Em "verso" coloque APENAS a palavra/expressão que completa a lacuna.\nResponda APENAS JSON estrito (sem \`\`\`):\n{"cards":[{"frente":"O prazo prescricional do crime é de _____ anos.","verso":"oito"}]}`;

    case "conceito":
      return `Você é uma professora de Direito criando flashcards de CONCEITO-CHAVE sobre o tema desta videoaula.\n${ctx}\n\nGere 8 cartões. "frente" = termo jurídico curto (1-4 palavras). "verso" = definição objetiva e técnica em 1-2 frases.\nResponda APENAS JSON estrito (sem \`\`\`):\n{"cards":[{"frente":"Dolo eventual","verso":"..."}]}`;

    case "pegadinhas":
      return `Você é uma professora de Direito mostrando as armadilhas típicas de prova (bancas de concurso e OAB) sobre o conteúdo jurídico desta aula.\n${ctx}\n\nGere de 4 a 6 pegadinhas sobre o tema de Direito abordado, com título curto, descrição clara e exemplo. NÃO use conteúdo institucional da plataforma.\nResponda APENAS JSON estrito (sem \`\`\`):\n{"pegadinhas":[{"titulo":"...","descricao":"...","exemplo":"..."}]}`;

    case "mapa":
      return `Você é uma professora de Direito montando um mapa mental do tema desta videoaula.\n${ctx}\n\nPara cada ramo, traga também um "exemplo" curto (1 frase, prático e concreto).\nResponda APENAS JSON estrito (sem \`\`\`):\n{"raiz":"tema central","ramos":[{"titulo":"sub-tema","itens":["ponto 1","ponto 2","ponto 3"],"exemplo":"exemplo curto e prático"}]}\nLimite a 5-7 ramos com até 4 itens cada. O "exemplo" é obrigatório.`;

    case "cornell":
      return `Você é uma professora de Direito gerando um resumo no formato Cornell sobre o tema desta videoaula.\n${ctx}\n\nResponda APENAS JSON estrito (sem \`\`\`):\n{"palavras_chave":["..."],"notas":"texto principal em markdown leve, 6-10 linhas cobrindo os pontos-chave","sintese":"síntese final em 2-3 frases"}`;

    case "feynman":
      return `Você é uma professora de Direito explicando o tema desta videoaula usando o método Feynman (linguagem simples, como se explicasse a uma pessoa leiga, com analogias).\n${ctx}\n\nResponda APENAS JSON estrito (sem \`\`\`):\n{"titulo":"...","explicacao_simples":"texto em 4-7 parágrafos curtos, linguagem cotidiana","analogia":"uma analogia concreta do dia a dia","pontos_dificeis":[{"conceito":"...","explicacao_facil":"..."}],"resumo_uma_frase":"..."}`;

    case "topicos":
      return `Você é uma professora de Direito organizando o tema desta videoaula em formato POR TÓPICOS hierarquizados.\n${ctx}\n\nResponda APENAS JSON estrito (sem \`\`\`):\n{"titulo":"...","topicos":[{"titulo":"...","subtopicos":[{"titulo":"...","conteudo":"explicação curta de 1-3 frases"}]}]}\nUse 4-6 tópicos principais, 2-4 subtópicos cada.`;

    case "tradicional":
      return `Você é uma professora de Direito escrevendo um RESUMO TRADICIONAL (texto corrido e fluido) sobre o tema desta videoaula.\n${ctx}\n\nResponda APENAS JSON estrito (sem \`\`\`):\n{"titulo":"...","introducao":"parágrafo de abertura","desenvolvimento":"corpo principal em 5-8 parágrafos, texto corrido em markdown leve","conclusao":"parágrafo final amarrando os pontos"}`;

    case "fichamento":
      return `Você é uma professora de Direito elaborando um FICHAMENTO acadêmico do tema desta videoaula.\n${ctx}\n\nResponda APENAS JSON estrito (sem \`\`\`):\n{"titulo":"...","referencia_principal":"obra/lei/doutrina central","citacoes":[{"trecho":"citação direta ou paráfrase","fonte":"art./autor/obra"}],"analise":"análise crítica em 3-5 parágrafos","conceitos_chave":["..."]}`;

    case "comparativa":
      return `Você é uma professora de Direito montando uma TABELA COMPARATIVA sobre o tema desta videoaula (institutos, espécies, classificações etc).\n${ctx}\n\nResponda APENAS JSON estrito (sem \`\`\`):\n{"titulo":"...","criterios":["Critério 1","Critério 2","Critério 3"],"itens":[{"nome":"Instituto A","valores":["...","...","..."]},{"nome":"Instituto B","valores":["...","...","..."]}]}\nA quantidade de "valores" em cada item DEVE ser igual à quantidade de "criterios". Use 2-4 itens e 3-5 critérios.`;

    case "lei":
      return `Você é especialista em legislação brasileira. A partir do conteúdo da videoaula abaixo, liste TODOS os dispositivos legais (artigos, parágrafos, incisos ou súmulas) relevantes para o tema.\n${ctx}\n\nRegras OBRIGATÓRIAS:\n- "codigo" DEVE ser uma destas siglas exatas: CP, CPP, CC, CPC, CF, CDC, CLT, CTN, CE, CTB, CPM, CPPM, LCP. Se for outra lei, use "OUTRO" e descreva em "lei".\n- "artigo" = apenas o número/identificação (ex.: "313-A", "5º, LXIX", "Súmula 711").\n- "texto" = texto literal do dispositivo (transcrição fiel).\n- "trecho_relevante" = pedaço EXATO do "texto" mais importante para o tema. Deve ser substring contínua de "texto".\n- Liste de 2 a 6 dispositivos; sem duplicar.\n\nResponda APENAS JSON estrito (sem \`\`\`):\n{"leis":[{"lei":"Código Penal","codigo":"CP","artigo":"313-A","texto":"...","trecho_relevante":"..."}]}`;

    case "questoes":
      return `Você é uma banca de concurso elaborando questões objetivas sobre o tema jurídico desta videoaula (padrão FGV/CEBRASPE/VUNESP e OAB).\n${ctx}\n\nGere 5 questões de múltipla escolha (A, B, C, D), nível médio/difícil, cobrando o Direito explicado na aula. Não pergunte nada sobre plataforma, canal, curso gratuito ou apresentação.\nCada questão DEVE ter: enunciado claro, 4 alternativas plausíveis, gabarito (apenas a letra) e comentário curto justificando o gabarito e citando dispositivo legal quando pertinente.\n\nResponda APENAS JSON estrito (sem \`\`\`):\n{"questoes":[{"enunciado":"...","a":"...","b":"...","c":"...","d":"...","gabarito":"A","comentario":"..."}]}`;

    case "termos":
      return `Você é uma professora de Direito identificando os TERMOS JURÍDICOS centrais abordados na videoaula abaixo (com base na transcrição/descrição).\n${ctx}\n\nExtraia de 8 a 15 termos técnicos efetivamente usados ou explicados na aula. Para cada um, dê uma definição objetiva, técnica e curta (1-3 frases). Inclua, quando útil, uma frase de exemplo curta mostrando o termo em contexto. Ordene por ordem de aparição/relevância na aula. NÃO inclua palavras genéricas, nomes de plataforma, professor ou canal.\n\nResponda APENAS JSON estrito (sem \`\`\`):\n{"termos":[{"termo":"...","definicao":"...","exemplo":"..."}]}`;

    default:
      throw new Error(`Tipo desconhecido: ${tipo}`);
  }
}
