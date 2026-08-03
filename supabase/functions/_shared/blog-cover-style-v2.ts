// Estilo oficial das capas do blog (espelha src/data/blogCoverStyle.json).
// Fundo PRETO puro + personagem cartoon vetorial + vestígios da cor da categoria.

export const BASE_PALETTE = {
  background: "#000000",
  skin: "#EFE0C4",
  beigeLight: "#F5E9CE",
  neutralWarm: "#C9A26A",
  brownDark: "#6B3F1D",
  outline: "#1A1004",
};

type Accent = { hex: string; name: string; hint: string };

export const THEME_ACCENTS: Record<string, Accent> = {
  "Iniciantes": { hex: "#F5C76A", name: "âmbar quente", hint: "estudante jovem, expressão curiosa, livro didático" },
  "Filosofia": { hex: "#A78BFA", name: "violeta/roxo", hint: "pensador clássico, pergaminho ou tocha" },
  "Clássicos": { hex: "#FCA5A5", name: "vermelho terroso", hint: "figura togada, coroa de louros" },
  "Classicos": { hex: "#FCA5A5", name: "vermelho terroso", hint: "figura togada, coroa de louros" },
  "STF": { hex: "#60A5FA", name: "azul institucional", hint: "ministro togado, martelo, colunata austera" },
  "STJ": { hex: "#38BDF8", name: "azul ciano", hint: "ministro do STJ, autos empilhados" },
  "Curiosidades": { hex: "#5EEAD4", name: "verde-água", hint: "figura intrigada, lupa, ponto de interrogação" },
  "Leis": { hex: "#A3B18A", name: "verde-oliva", hint: "legislador, código de leis fechado" },
  "Jurisprudência": { hex: "#F0ABFC", name: "magenta suave", hint: "juiz analisando acórdão" },
  "Direito Constitucional": { hex: "#93C5FD", name: "azul-royal", hint: "figura séria segurando a Constituição" },
  "Direito Penal": { hex: "#EF4444", name: "vermelho sangue", hint: "promotor severo, algemas ou martelo" },
  "Direito Civil": { hex: "#93C5FD", name: "azul frio", hint: "advogado civilista, contrato assinado" },
  "Direito Administrativo": { hex: "#D4D4D8", name: "cinza-aço", hint: "servidor público, carimbo" },
  "Direito do Trabalho": { hex: "#FBBF24", name: "amarelo trabalho", hint: "operário em traje formal, engrenagem" },
  "Direito Processual": { hex: "#C4B5FD", name: "violeta suave", hint: "escrivão, pilha de autos" },
  "Direito Tributário": { hex: "#6EE7B7", name: "verde-cofre", hint: "contador de terno, cofre" },
  "Carreiras Jurídicas": { hex: "#FCD34D", name: "ouro", hint: "concurseiro focado, medalha" },
  "Atualidades Jurídicas": { hex: "#7DD3FC", name: "azul jornal", hint: "jornalista jurídica, microfone" },
};

const FALLBACK: Accent = { hex: "#F5C76A", name: "âmbar quente", hint: "cena editorial vintage com objetos jurídicos" };

// ---------------------------------------------------------------------------
// Estilo "painel do Blogger Jurídico": exatamente o visual do hero vermelho do
// app — fundo chapado na cor do tema, motivos jurídicos em linha (balança, §,
// livro, coluna, pena) bem apagados por trás, e UMA figura vetorial "vazada"
// (recortada, sem cenário) apoiada na base, num dos terços laterais.
// ---------------------------------------------------------------------------

// Figuras vazadas — mesmo espírito dos recortes usados no painel (Têmis,
// professor, magistrado…). Uma por capa, sempre diferente da anterior.
const FIGURE_POOL = [
  "Lady Justice (Themis) standing, blindfolded, holding brass scales and a sword",
  "elderly law professor in a dark suit and glasses, holding an open book, one finger raised",
  "female judge in a black robe with a white jabot, holding a gavel",
  "young law student with a backpack, hugging a thick code book",
  "classical Greek philosopher in a toga, holding a rolled scroll",
  "bearded 19th-century jurist in a frock coat, hand resting on a stack of books",
  "female lawyer in a burgundy blazer, folder of case files under her arm",
  "public prosecutor in a suit, sleeves rolled up, pointing at an open statute",
  "court clerk with an armful of tied case files and a stamp",
  "senator at a lectern with a microphone and the Constitution in hand",
  "legal journalist holding a rolled newspaper and a recorder",
  "seated thinker on a plain stool, chin on hand, book on the lap",
];

// Adereço extra (opcional) que acompanha a figura, sempre vazado junto.
const PROP_POOL = [
  "stack of old leather-bound books beside the feet",
  "brass scales of justice on a small pedestal",
  "single ionic column cropped by the frame edge",
  "quill and inkwell on a low stool",
  "wooden gavel and sound block",
  "rolled parchment leaning against the leg",
  "hourglass on a low plinth",
  "laurel wreath resting on a closed book",
  "bundle of case files tied with string",
  "antique key and padlock on the floor",
  "hardwood lectern with an open code book",
  "small strongbox with a coin on top",
];

// Lado / enquadramento da figura no painel.
const SIDE_POOL = [
  "figure anchored on the RIGHT third, facing slightly left, bottom-aligned",
  "figure anchored on the LEFT third, facing slightly right, bottom-aligned",
  "figure CENTERED and bottom-aligned, prop cropped on one side",
  "figure on the RIGHT third seen in three-quarter view, prop on the far left",
  "figure on the LEFT third in near-profile, prop on the far right",
];

// Motivos de fundo (line art apagado, nunca protagonista).
const MOTIF_POOL = [
  "scales of justice, paragraph sign §, open book",
  "paragraph sign §, ionic column, quill",
  "open book, laurel wreath, scales of justice",
  "gavel, paragraph sign §, ionic column",
  "quill, scroll, scales of justice",
];


export function getAccent(categoria?: string | null): Accent {
  if (!categoria) return FALLBACK;
  const direct = THEME_ACCENTS[categoria];
  if (direct) return direct;
  const norm = categoria.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  for (const [k, v] of Object.entries(THEME_ACCENTS)) {
    if (k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === norm) return v;
  }
  return FALLBACK;
}

/**
 * Monta o prompt final da capa no padrão "painel do Blogger Jurídico":
 * fundo chapado na cor do tema + motivos jurídicos apagados + figura vazada.
 * `evitar` recebe títulos/figuras de capas recentes para forçar variação.
 */
export function buildCoverPrompt(
  titulo: string,
  categoria: string,
  evitar: string[] = [],
): string {
  const a = getAccent(categoria);
  const avoid = evitar.filter(Boolean).slice(0, 8);
  // Semente = título + categoria + aleatório, para que duas capas nunca caiam
  // na mesma figura/adereço/enquadramento mesmo com temas parecidos.
  const seed = Math.abs(
    [...`${titulo}|${categoria}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) +
      Math.floor(Math.random() * 100000),
  );
  const pick = <T,>(pool: T[], offset: number): T => pool[(seed + offset) % pool.length];
  const figure = pick(FIGURE_POOL, 3);
  const prop = pick(PROP_POOL, 11);
  const side = pick(SIDE_POOL, 23);
  const motifs = pick(MOTIF_POOL, 37);

  return `Flat vector cover panel for a Brazilian legal-education blog ("Blogger Jurídico"). 16:9 horizontal, FULL-BLEED, no borders.

THEME OF THIS COVER: "${titulo}" — category: ${categoria}. Interpretation direction: ${a.hint}.

BACKGROUND (most important): one FLAT, SOLID, SATURATED colour panel filling 100% of the canvas — a smooth diagonal gradient of the category colour ${a.hex} (${a.name}): lighter and slightly warmer at the top-right, deeper and darker at the bottom-left. Absolutely NO scenery, NO room, NO landscape, NO photographic texture, NO black background, NO white or cream margins.

BACKGROUND MOTIFS: large legal line-art symbols drawn very faintly on the colour panel, in a darker shade of the same colour (about 12-20% contrast, thin uniform strokes, outline only, no fill): ${motifs}. Scatter 4 to 6 of them near the corners and edges, partially cropped by the frame, plus an even, very subtle fine dot grid over the whole panel. These motifs must read as a watermark pattern behind everything — never as the main subject.

MAIN SUBJECT — ONE CUT-OUT FIGURE: a single flat vector illustrated figure, ${figure}. ${side}. The figure is a clean CUT-OUT (knockout) illustration placed on top of the colour panel: no ground, no shadow scenery, no scene around it, only a soft drop shadow. It occupies roughly 55-70% of the frame height, feet/base touching the bottom edge, and is fully inside the frame (never cropped at the head or hands). Add a single supporting cut-out prop: ${prop}.

STYLE: flat vector editorial illustration, thin-to-medium clean dark outlines (${BASE_PALETTE.outline}), flat 2-3 tone shading, no gradients on the figure, no cross-hatching, no photorealism, no 3D render, no watercolour.

FIGURE PALETTE: cream #EFE1BD, warm beige skin ${BASE_PALETTE.skin}, warm neutral ${BASE_PALETTE.neutralWarm}, dark brown ${BASE_PALETTE.brownDark}, burgundy #8C1220 and soft gold #C9A26A for cloth and metal details. The figure must clearly stand out against the ${a.name} panel.

TEXT: none at all. No title, no caption, no watermark, no logo, no letters (a single short serif word engraved on a book spine is the only tolerated exception).

UNIQUENESS: the figure, the prop and the side of the frame must NOT repeat previous covers.${avoid.length ? ` Avoid repeating the subject/props of: ${avoid.join("; ")}.` : ""}

NEGATIVES: photorealistic, 3D render, painted scenery, interior/exterior environment, sepia vintage engraving, many overlapping objects, cluttered collage, black background, white or cream background, borders, frames, vignette, visible text or captions, modern devices (laptops, smartphones), distorted hands, extra limbs, low quality.`;
}

