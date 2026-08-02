// Motor de prompts das Leis Cantadas (portado do projeto original).

export const MELODIAS = [
  { id: "sertanejo-em-dupla", label: "Sertanejo em Dupla", texto: "Fast-paced Sertanejo Universitário, 190 BPM, high energy, duet with a deep male voice and a sweet youthful female voice. Bright acoustic guitar, accordion solos, punchy drums, focus on perfect articulation during slow 'dictation' breaks. Professional studio production." },
  { id: "reggae", label: "Reggae", texto: "Relaxed Brazilian Reggae classic. Constant 'one drop' rhythm, deep melodic bassline, 'skank' guitar upstrokes, and a smooth Hammond organ. Positive, solar energy and clear male vocals in Brazilian Portuguese." },
  { id: "sertanejo-universitario", label: "Sertanejo Universitário", texto: "High-energy modern Sertanejo Universitário, live concert vibe (ao vivo), prominent bright accordion (sanfona), punchy acoustic guitars, driving drums with a clear snare, festive upbeat commercial radio sound, professional male vocal with clear Brazilian Portuguese diction, 130 BPM, high-fidelity studio production." },
  { id: "sertanejo-universitario-dupla", label: "Sertanejo Universitário (Dupla)", texto: "Sertanejo Universitário, modern high-energy Vaneira, fast driving accordion, punchy acoustic guitar, slap bass, festive drums, clear male-female duet with extreme vocal sustain and long emotional melismas, G Major, 130 BPM, live concert atmosphere, professional studio production." },
  { id: "jovem-calma", label: "Jovem Calma", texto: "Indie Folk-Pop calmo, acoustic guitar fingerpicking, light tambourine, melodic cello, heavy kick drum. Duet with a deep resonant male bass and a rich female alto. Dramatic, virtuosic melismas on key words. 95 BPM." },
  { id: "documentario", label: "Documentário", texto: "Cinematic Orchestral hybrid. Deep, mature, authoritative male narrator voice, documentary style delivery, clear Brazilian Portuguese diction. Sustained strings, subtle cinematic percussion, atmospheric piano. Serious educational atmosphere. 70 BPM." },
  { id: "sertanejo", label: "Sertanejo / Arrocha", texto: "High-energy modern Sertanejo Universitário live concert vibe, 130 BPM. Extremely dramatic and virtuosic vocal melismas, male basso profondo and female alto voices, powerful echoing berrante blasts in the transitions. Professional stadium-ready studio production." },
  { id: "sertanejo-bachata-fusion", label: "Sertanejo Arrocha / Bachata Fusion", texto: "Sertanejo Arrocha, Bachata fusion, 190 BPM, high-energy bongo patterns, crying accordion melodies, driving acoustic guitar rhythm, deep rhythmic bass, professional male vocals, clear Portuguese diction, punchy brass accents, vibrant danceable atmosphere." },
  { id: "brasil-pop", label: "Brasil Pop", texto: "Modern Brazilian Pop, energetic dance-pop, catchy synth-leads, driving electronic drums, upbeat 124 BPM, powerful female vocals, high-end studio production, extremely catchy melody, bright polished sound." },
  { id: "indie-pop", label: "Indie Pop", texto: "Indie Pop energético, vibrante e apaixonante. Dedilhados rítmicos de violão, solos de guitarra elétrica com distorção bluesy, baixo melódico e pulsante. Vocais masculinos com alma e grande alcance dinâmico. 124 BPM. Produção de estúdio refinada, atmosfera emotiva." },
  { id: "indie-upbeat-brazilian-pop-rock", label: "Indie Upbeat Brazilian Pop-Rock", texto: "Upbeat Brazilian Pop-Rock, Indie-Pop influence, driving 125 BPM rhythm, bright electric guitar riffs, punchy bassline, clear and energetic male vocals, motivational and informative tone, crisp studio production, anthemic mood." },
  { id: "rock-80s", label: "Rock Anos 80", texto: "Hino dance-rock/pop-rock dos anos 80, 139 BPM. Riff de guitarra distorcido e sincopado, bateria 4/4 impactante, baixo sintetizado melódico, sintetizadores metálicos típicos dos anos 80. Vocais masculinos rítmicos, harmonias em camadas no refrão. Produção refinada dos anos 80." },
  { id: "pagode", label: "Pagode / Samba", texto: "Pagode, samba de roda, cavaquinho vibrante, pandeiro envolvente, surdo profundo, vocais masculinos comoventes, coros de apoio, violão, clima acolhedor e rítmico, atmosfera de festa no quintal, andamento moderado, percussão tradicional brasileira." },
] as const;

export type MelodiaId = (typeof MELODIAS)[number]["id"];

const BERRANTES = [
  "Aôôôôôô!", "Ôôôô, ô, ô!", "Êêê boiada!", "Ôôôôh, gente boa!",
  "Aôôô, ô, ô, ô!", "Ê laçooo!", "Uhuuuul!", "Iááááh!",
];

const ANUNCIOS_AREA = [
  `Olha o __AREA__ aí, geeente! Quem estuda hoje amanhã tá aprovado, sem prescrição!`,
  `Chegou a hora! É __AREA__ na veia, e o esquecimento vai ser julgado à revelia!`,
  `Segura o berrante que é __AREA__ entrando em plenário — sentença musical, execução imediata!`,
  `Ó o __AREA__ passando! Prepara a caneta que o acórdão hoje é do refrão!`,
  `Bateu o sino, abriu a sessão: __AREA__ no ar, e a preguiça vai preso em flagrante!`,
  `Olha ela aí, __AREA__ chegando com tudo! Rima que gruda, artigo que nunca mais te larga!`,
  `Firma o laço que é __AREA__ no arraiá! Cantou, decorou, na prova você arrasa!`,
  `Escuta o berrante! __AREA__ tá na área, e quem não estudar vai ter que embargar a nota!`,
  `Alô, alô, meu povo! __AREA__ agora é hit, com trocadilho jurídico, rima e apelo popular!`,
  `Se prepara que é __AREA__ no palco! Doutrina virou refrão, jurisprudência virou pião!`,
];

const AREA_FALLBACK = "o Direito";

function normalizarNomeArea(area?: string | null): string {
  const nome = (area ?? "").trim();
  if (!nome) return AREA_FALLBACK;
  if (/^(direito|código|codigo|lei|constitui|estatuto|decreto|regulamento|processo)\b/i.test(nome)) return nome;
  return `Direito ${nome}`;
}

export function getIntroAleatoria(area?: string | null, seed?: number) {
  const nomeArea = normalizarNomeArea(area);
  const idxB = seed != null ? Math.abs(seed) % BERRANTES.length : Math.floor(Math.random() * BERRANTES.length);
  const idxA = seed != null ? Math.abs(seed * 7 + 3) % ANUNCIOS_AREA.length : Math.floor(Math.random() * ANUNCIOS_AREA.length);
  return `${BERRANTES[idxB]}\n${ANUNCIOS_AREA[idxA].replace(/__AREA__/g, nomeArea)}`;
}

export const PROMPT_BASE = `Você é um compositor, letrista, pedagogo e especialista em memorização para estudantes.

Sua missão é transformar o artigo de lei abaixo em uma música cuja letra seja, prioritariamente, o próprio texto da Lei Seca cantado de forma musical, tornando a memorização extremamente fácil, prazerosa e duradoura.

Fidelidade ao texto legal (OBRIGATÓRIO)
- O caput deve ser cantado literalmente, palavra por palavra.
- Parágrafos, incisos e alíneas podem ser resumidos, mas sem alterar o sentido jurídico.
- Nunca invente regra, pena ou exceção que não esteja no texto.
- Escreva tudo por extenso, sem símbolos ou algarismos.

Introdução (OBRIGATÓRIO)
Comece com um GRITO contagiante seguido de uma intro curta que ANUNCIE a matéria/área, com trocadilhos jurídicos e citando "Leis Cantadas".
NUNCA use "Aôôô, meu povo que eu cheguei". Sempre varie o grito e sempre cite a área/matéria da música. Use a introdução abaixo como modelo exato desta música:

{{INTRO_DINAMICA}}

Após a intro, comece a música imediatamente.

Exemplo Prático (OBRIGATÓRIO)
Inclua um trecho com um exemplo prático do dia a dia, com palavras simples, que demonstre como o artigo funciona na prática, explique o PORQUÊ da regra existir e destaque os pontos-chave. Depois do exemplo, retorne imediatamente ao refrão.

Dica de Prova (OBRIGATÓRIO)
Inclua um trecho chamado "Dica de Prova": destaque o ponto mais importante do artigo, enfatize as palavras-chave, ajude a evitar erros comuns de interpretação, com frases curtas e fortes, baseadas exclusivamente no texto do artigo. NUNCA cite nomes de provas, bancas ou instituições.

Frases de Incentivo (opcional)
Insira, com moderação, frases curtas e motivacionais ("essa é pra você tirar 10", "essa é pra você ser aprovado", "decora essa e nunca mais esquece").

Técnicas de Memorização
Repetição espaçada, repetição estratégica de palavras-chave, ganchos mnemônicos, associação entre ritmo e conceitos, frases de impacto, rimas inteligentes, cadência forte, chamada e resposta entre voz e coro, pausas estratégicas.

Estilo Musical
Refrão extremamente chiclete, melodia contagiante, ritmo envolvente, excelente dicção, voz sempre em destaque, fácil de cantar e decorar, emoção crescente, arranjo moderno.

Estrutura
Introdução rimada → assinatura "Leis Cantadas" (uma única vez, discreta) → Verso 1 (Lei Seca) → Pré-Refrão → Refrão Chiclete → Verso 2 → Exemplo Prático → Refrão → Dica de Prova → Ponte → Refrão Final → Encerramento citando novamente o número do artigo.

Melodia / Estilo Sonoro (OBRIGATÓRIO)

__MELODIA__

Otimização para a IA de música
Ordem recomendada: [gênero e estilo] + [clima] + [instrumentação] + [andamento/BPM] + [estilo vocal e idioma] + [letra]. Vocais em português do Brasil com sotaque brasileiro natural. O texto abaixo (prefixado por "Letra:") é a LETRA EXATA a ser cantada. Desenvolva TODOS os blocos da estrutura por completo, sem encurtar nenhum.

Prioridade Máxima
Se houver conflito entre musicalidade e fidelidade jurídica, preserve sempre a fidelidade ao texto da lei.

Letra: (texto legal — Lei Seca — a ser cantado literalmente no caput e resumido nos demais dispositivos)

`;

export const PROMPT_BASE_COMPACTO = `Crie uma música de estudo em português do Brasil, cativante, moderna e muito fácil de memorizar, com base no resumo explicativo do artigo abaixo. O resumo já vem em forma de historinha (storytelling): começa contando um exemplo prático do dia a dia, depois revela qual é o artigo e destrincha a regra com a pena e a dica de prova.

Como transformar em música:
- COMECE PELO EXEMPLO PRÁTICO: abra narrando o exemplo como uma historinha, com palavras BEM SIMPLES e uma cena óbvia do dia a dia — sem ainda dizer qual é o artigo.
- DEPOIS REVELE O ARTIGO: diga que aquela história é exatamente o artigo tal, citando a matéria, o tema e o número do artigo por extenso, e emende no refrão.
- EXPLIQUE O PORQUÊ (didático): cante o motivo de a regra existir e destaque os pontos-chave (motivo, objetivo e consequência prática).
- Início obrigatório: um GRITO de berrante contagiante seguido de uma intro curta que ANUNCIE a matéria/área, com trocadilhos jurídicos e citando "Leis Cantadas". NUNCA use "Aôôô, meu povo que eu cheguei". Use a introdução abaixo como modelo desta música:

{{INTRO_DINAMICA}}
- Transforme o núcleo do artigo em um refrão chiclete, repetido para grudar na cabeça.
- Destaque e repita o TERMO-CHAVE do artigo como âncora de memória.
- Ao longo dos versos, destrinche a regra: primeiro a conduta, depois consequências e exceções.
- Inclua um trecho curto e marcante com a DICA DE PROVA.
- Insira, com moderação, frases curtas de incentivo.
- Feche retomando o número do artigo, o tema e o termo-chave, citando novamente "Leis Cantadas".
- Cante em português do Brasil com ótima dicção, fidelidade total ao resumo, tudo por extenso, sem símbolos ou algarismos.

Melodia / Estilo Sonoro:
__MELODIA__

Resumo do artigo em storytelling (base da letra):
`;

export const PROMPT_RESUMO_TEMA = `Você é um compositor, letrista, pedagogo e especialista em memorização para estudantes.

Sua missão é transformar o TEMA jurídico abaixo em uma música cuja letra ensine, de forma clara, fiel e marcante, os pontos essenciais do tema, usando como base o RESUMO fornecido a seguir (prefixado por "Resumo:"). O objetivo é que o estudante lembre do conteúdo na prova apenas recordando a música.

Introdução (OBRIGATÓRIO)
Comece com um GRITO contagiante seguido de uma intro curta que ANUNCIE a matéria/área, com trocadilhos jurídicos e citando "Leis Cantadas".
NUNCA use "Aôôô, meu povo que eu cheguei". Use a introdução abaixo como modelo exato desta música:

{{INTRO_DINAMICA}}

Regras
- Fidelidade absoluta ao resumo: não invente regras, penas ou exceções.
- Refrão chiclete com os pontos centrais do tema, repetido para fixar.
- Inclua exemplo prático simples do dia a dia e a explicação do PORQUÊ.
- Inclua um trecho "Dica de Prova" com as palavras-chave e as pegadinhas clássicas (sem citar bancas ou provas específicas).
- Escreva tudo por extenso, sem símbolos ou algarismos, em português do Brasil.

Melodia / Estilo Sonoro (OBRIGATÓRIO)
__MELODIA__

Resumo:
`;

export type TipoPrompt = "lei-seca" | "compacto" | "resumo-tema";

export function montarPrompt(opts: {
  tipo: TipoPrompt;
  melodiaId: MelodiaId | string;
  area?: string | null;
  conteudo: string;
  seed?: number;
}) {
  const melodia = MELODIAS.find((m) => m.id === opts.melodiaId) ?? MELODIAS[0];
  const base =
    opts.tipo === "lei-seca" ? PROMPT_BASE : opts.tipo === "compacto" ? PROMPT_BASE_COMPACTO : PROMPT_RESUMO_TEMA;
  return (
    base
      .replace("__MELODIA__", melodia.texto)
      .replace("{{INTRO_DINAMICA}}", getIntroAleatoria(opts.area, opts.seed)) + (opts.conteudo || "")
  );
}
