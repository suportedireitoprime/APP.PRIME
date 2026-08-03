// Prompts e normalização — espelho de `src/lib/visuaisJuridicos/types.ts`.
// Mantidos aqui porque a edge function não pode importar de `src/`.

export type VisualTipo = "mapa_mental" | "infografico" | "fluxograma" | "diagrama";

export const LIMITES: Record<VisualTipo, any> = {
  mapa_mental: { titulo: 72, subtitulo: 130, central: 34, ramos: [4, 7], ramoTitulo: 44, itens: [3, 6], item: 70, nota: 90 },
  infografico: { titulo: 72, subtitulo: 130, cards: [4, 8], cardTitulo: 44, cardTexto: 200, rodape: 180 },
  fluxograma: { titulo: 72, subtitulo: 130, entrada: 72, decisoes: [3, 6], pergunta: 78, seNao: 70, base: 40, resultado: 70 },
  diagrama: { titulo: 72, subtitulo: 130, raiz: 52, grupos: [2, 5], grupoTitulo: 44, itens: [3, 6], item: 64, nota: 90 },
};


const clamp = (v: unknown, max: number): string => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
};

const list = <T>(v: unknown, bounds: number[], map: (x: any) => T): T[] =>
  Array.isArray(v) ? v.slice(0, bounds[1]).map(map) : [];

export function normalizeContent(tipo: VisualTipo, raw: any): any | null {
  if (!raw || typeof raw !== "object") return null;
  const L = LIMITES[tipo];
  const base = {
    titulo: clamp(raw.titulo, L.titulo),
    subtitulo: raw.subtitulo ? clamp(raw.subtitulo, L.subtitulo) : undefined,
    fonte: clamp(raw.fonte, 90),
  };
  if (!base.titulo) return null;

  if (tipo === "mapa_mental") {
    const ramos = list(raw.ramos, L.ramos, (r: any) => ({
      titulo: clamp(r?.titulo, L.ramoTitulo),
      itens: list(r?.itens, L.itens, (i: any) => clamp(i, L.item)).filter(Boolean),
      nota: r?.nota ? clamp(r.nota, L.nota) : undefined,
    })).filter((r: any) => r.titulo && r.itens.length);
    if (ramos.length < 3) return null;
    return { tipo, ...base, central: clamp(raw.central || base.titulo, L.central), ramos };
  }

  if (tipo === "infografico") {
    const cards = list(raw.cards, L.cards, (c: any) => ({
      titulo: clamp(c?.titulo, L.cardTitulo),
      texto: clamp(c?.texto, L.cardTexto),
    })).filter((c: any) => c.titulo && c.texto);
    if (cards.length < 3) return null;
    return { tipo, ...base, cards, rodape: raw.rodape ? clamp(raw.rodape, L.rodape) : undefined };
  }

  if (tipo === "fluxograma") {
    const decisoes = list(raw.decisoes, L.decisoes, (d: any) => ({
      pergunta: clamp(d?.pergunta, L.pergunta),
      seNao: clamp(d?.seNao, L.seNao),
      base: d?.base ? clamp(d.base, L.base) : undefined,
    })).filter((d: any) => d.pergunta && d.seNao);
    if (decisoes.length < 2) return null;
    return {
      tipo,
      ...base,
      entrada: clamp(raw.entrada, L.entrada) || "Fato concreto",
      decisoes,
      resultado: clamp(raw.resultado, L.resultado) || "Consequência jurídica",
    };
  }

  const grupos = list(raw.grupos, L.grupos, (g: any) => ({
    titulo: clamp(g?.titulo, L.grupoTitulo),
    itens: list(g?.itens, L.itens, (i: any) => clamp(i, L.item)).filter(Boolean),
    nota: g?.nota ? clamp(g.nota, L.nota) : undefined,
  })).filter((g: any) => g.titulo && g.itens.length);
  if (grupos.length < 2) return null;
  return { tipo: "diagrama", ...base, raiz: clamp(raw.raiz || base.titulo, L.raiz), grupos };

}

const REGRAS_COMUNS = `
Você é professor de Direito brasileiro e editor de material visual de estudo.
Sua tarefa é EXTRAIR CONTEÚDO, não desenhar: quem desenha é o aplicativo.

Regras obrigatórias:
- Português do Brasil, linguagem técnica correta, tom de doutrina didática.
- Só afirme o que é seguro na legislação/jurisprudência brasileira vigente. Nunca invente número de artigo, súmula ou tese.
- Cite a base normativa no campo "fonte" (ex.: "CP, art. 121" / "CF/88, art. 5º, XXXIX" / "Súmula Vinculante 11").
- Itens do mesmo nível devem ser PARALELOS entre si: mesma natureza e tamanho parecido.
- Textos curtos e densos, sem encher linguiça, sem "etc.", sem repetir o título.
- NUNCA use markdown, asteriscos, emojis, aspas decorativas ou numeração manual ("1.", "a)").
- RESPEITE OS LIMITES DE CARACTERES. Texto acima do limite é cortado e estraga o material.
- Responda SOMENTE com o JSON pedido, sem comentário nem cerca de código.
`.trim();

export function promptFor(tipo: VisualTipo, itemLabel: string, contexto: string, retry: boolean): string {
  const L = LIMITES[tipo];
  const cabecalho = `${REGRAS_COMUNS}

TEMA: ${itemLabel}
CONTEXTO: ${contexto}
${retry ? "\nATENÇÃO: a resposta anterior veio fora do formato. Siga o esquema à risca, com todos os campos obrigatórios e dentro dos limites.\n" : ""}`;

  if (tipo === "mapa_mental") {
    return `${cabecalho}
Produza um MAPA MENTAL DE REVISÃO PROFUNDA: conceito central e ${L.ramos[0]} a ${L.ramos[1]} ramos que cobrem o tema por inteiro, sem sobreposição de assunto entre ramos.

Esquema JSON:
{
  "titulo": "título do mapa, máx ${L.titulo} caracteres",
  "subtitulo": "uma linha de contexto (o que a norma resolve), máx ${L.subtitulo}",
  "fonte": "base normativa, máx 90",
  "central": "conceito central, máx ${L.central}",
  "ramos": [
    { "titulo": "eixo do ramo, máx ${L.ramoTitulo}", "itens": ["ponto-chave, máx ${L.item}", "..."], "nota": "alerta de prova ou distinção do ramo, máx ${L.nota}" }
  ]
}
Regras deste formato:
- ${L.ramos[0]} a ${L.ramos[1]} ramos; ${L.itens[0]} a ${L.itens[1]} itens por ramo (busque o máximo que ainda seja preciso).
- Cubra obrigatoriamente: conceito/fundamento, requisitos ou elementos, efeitos jurídicos, exceções e um ramo de aplicação prática (exemplo concreto ou jurisprudência consolidada).
- Cada item é uma afirmação fechada e memorizável (não pergunta), densa, com o dado técnico que a prova cobra (prazo, competência, natureza, artigo quando for seguro).
- Pelo menos 3 ramos devem trazer "nota" com pegadinha de prova, distinção de instituto parecido ou súmula pertinente.`;
  }

  if (tipo === "infografico") {
    return `${cabecalho}
Produza um INFOGRÁFICO DETALHADO de requisitos/elementos: ${L.cards[0]} a ${L.cards[1]} cartões numerados, cada um com rótulo curto e explicação densa.

Esquema JSON:
{
  "titulo": "máx ${L.titulo}",
  "subtitulo": "máx ${L.subtitulo}",
  "fonte": "máx 90",
  "cards": [
    { "titulo": "nome do requisito/elemento, máx ${L.cardTitulo}", "texto": "explicação + aplicação prática + base legal quando segura, máx ${L.cardTexto}" }
  ],
  "rodape": "conclusão prática e a principal pegadinha de prova, máx ${L.rodape}"
}
Regras deste formato:
- ${L.cards[0]} a ${L.cards[1]} cartões formando conjunto completo e ordenado (do pressuposto ao efeito), preferindo o número maior.
- Cada "texto" usa 2 a 3 frases: o que é, como se aplica e um exemplo ou distinção; nunca repete o "titulo".
- Inclua ao menos um cartão de exceções/hipóteses de exclusão e um de consequências práticas.`;
  }

  if (tipo === "fluxograma") {
    return `${cabecalho}
Produza um FLUXOGRAMA DE APLICAÇÃO DA NORMA em cadeia de decisões: a partir do fato, cada etapa é uma pergunta fechada; se SIM avança, se NÃO há uma consequência que encerra o caminho.

Esquema JSON:
{
  "titulo": "máx ${L.titulo}",
  "subtitulo": "máx ${L.subtitulo}",
  "fonte": "máx 90",
  "entrada": "ponto de partida concreto, máx ${L.entrada}",
  "decisoes": [
    { "pergunta": "pergunta fechada respondível com sim/não, máx ${L.pergunta}", "seNao": "consequência jurídica se NÃO, máx ${L.seNao}", "base": "artigo/súmula que fundamenta a etapa, máx ${L.base}" }
  ],
  "resultado": "consequência quando todas as respostas são SIM, máx ${L.resultado}"
}
Regras deste formato:
- ${L.decisoes[0]} a ${L.decisoes[1]} decisões, em ordem lógica de análise (competência/tipicidade antes de ilicitude e culpabilidade, e assim por diante), preferindo o número maior.
- Cada "seNao" indica um desfecho jurídico real e nomeado (ex.: "atipicidade: absolvição, CPP art. 386, III"), não um comentário.
- Preencha "base" sempre que houver artigo seguro; se não houver, omita o campo.`;
  }

  return `${cabecalho}
Produza um DIAGRAMA de hierarquia: a partir de um conceito-raiz, ${L.grupos[0]} a ${L.grupos[1]} grupos (espécies, classificações ou dimensões) e os itens de cada grupo.

Esquema JSON:
{
  "titulo": "máx ${L.titulo}",
  "subtitulo": "máx ${L.subtitulo}",
  "fonte": "máx 90",
  "raiz": "conceito-raiz, máx ${L.raiz}",
  "grupos": [
    { "titulo": "nome do grupo, máx ${L.grupoTitulo}", "itens": ["item, máx ${L.item}", "..."], "nota": "critério ou distinção do grupo, máx ${L.nota}" }
  ]
}
Regras deste formato: os grupos usam UM único critério de divisão, sem misturar critérios; ${L.itens[0]} a ${L.itens[1]} itens por grupo, preferindo o número maior; cada item traz o dado técnico que o diferencia dos demais.`;
}

