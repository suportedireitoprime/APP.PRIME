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

// Enquadramento: SEMPRE centralizado (padrão aprovado pela capa verde).
// A variação acontece na pose/ângulo, nunca no lado do quadro.
const SIDE_POOL = [
  "figure PERFECTLY CENTERED on the horizontal axis, front view, bottom-aligned, with the supporting props balanced symmetrically on both sides",
  "figure PERFECTLY CENTERED on the horizontal axis, three-quarter view, bottom-aligned, one prop on the left and one on the right at similar visual weight",
  "figure PERFECTLY CENTERED on the horizontal axis, slight contrapposto pose, bottom-aligned, props flanking both sides like a small stage",
  "figure PERFECTLY CENTERED on the horizontal axis, near-frontal with head slightly turned, bottom-aligned, mirrored props on each side",
];

// Elementos secundários vazados que preenchem a cena ao redor da figura.
const SECONDARY_POOL = [
  "a low stack of leather-bound books on the left and a small ionic column on the right",
  "an open code book on a small lectern on one side and a wooden gavel with sound block on the other",
  "brass scales on a plinth on one side and a rolled parchment leaning on a stool on the other",
  "a bundle of tied case files on one side and a quill with inkwell on a low pedestal on the other",
  "an hourglass on a plinth on one side and a laurel wreath over a closed book on the other",
  "a small strongbox with coins on one side and a stamp with an ink pad on the other",
];

// Detalhes flutuantes (ícones vazados leves) que dão densidade sem poluir.
const FLOATING_POOL = [
  "3 to 5 small flat vector legal icons floating in the upper area (tiny scales, paragraph sign §, gavel, quill, seal ribbon), same figure palette, evenly balanced left and right of the figure",
  "a light arc of 4 small floating icons above the figure (open book, §, laurel leaf, key), symmetric on both sides",
  "small floating cards/papers with a wax seal and a ribbon, 2 on each side of the figure at different heights",
  "a subtle halo of thin concentric rings behind the figure's head plus 4 small floating legal icons, 2 per side",
];

// Motivos de fundo (line art apagado, nunca protagonista).
const MOTIF_POOL = [
  "scales of justice, paragraph sign §, open book, ionic column, quill",
  "paragraph sign §, ionic column, quill, gavel, scroll",
  "open book, laurel wreath, scales of justice, seal, column capital",
  "gavel, paragraph sign §, ionic column, hourglass, tied case files",
  "quill, scroll, scales of justice, open code book, wax seal",
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

export function detectSubjectFigure(titulo: string, categoria: string): string | null {
  const t = titulo.toLowerCase();
  
  if (/kelsen|pirâ|piram|hierarquia\s+das\s+normas/i.test(t)) {
    return "austrian 20th-century jurist (Hans Kelsen) in a classic formal suit standing beside a prominent 3-tiered legal hierarchy pyramid diagram (Constituição at top, Leis in middle, Normas at base) with scales of justice";
  }
  if (/esperança\s+garcia|esperanca\s+garcia/i.test(t)) {
    return "courageous 18th-century Afro-Brazilian woman lawyer (Esperança Garcia, first female attorney of Brazil) in dignified historical attire, holding a feather quill and parchment petition of rights";
  }
  if (/inquilinato|aluguel|locação|locacao/i.test(t)) {
    return "distinguished civil lawyer holding a residential lease contract and set of brass keys next to a miniature house model and scales of justice";
  }
  if (/lgpd|privacidade|dados/i.test(t)) {
    return "cyber law attorney holding a digital privacy shield with a padlock icon and data protection statute book";
  }
  if (/aristóteles|aristoteles|ética\s+a\s+nicômaco/i.test(t)) {
    return "classical Greek philosopher Aristotle in a toga holding a scroll of justice and brass scales on a marble plinth";
  }
  if (/terras\s+indígenas|indigena|marco\s+temporal/i.test(t)) {
    return "dignified STF magistrate in black robe holding the 1988 Constitution beside a map of indigenous territories";
  }
  if (/fuller|denunciantes\s+invejosos/i.test(t)) {
    return "thoughtful 20th-century legal philosopher (Lon Fuller) standing between a scale of morality and law books";
  }
  if (/hart|dworkin|lei\s+ou\s+moral/i.test(t)) {
    return "two distinguished legal philosophers in debate, one holding a positivist code book and the other a book of moral principles";
  }
  if (/victor\s+nunes\s+leal|era\s+das\s+súmulas/i.test(t)) {
    return "dignified STF minister (Victor Nunes Leal) holding the landmark Book of Precedents (Súmulas do STF)";
  }
  if (/tributári|tributaria|imposto|reforma\s+tributária/i.test(t)) {
    return "tax attorney in formal suit holding a financial ledger and tax reform code beside a scales of justice";
  }
  if (/sherlock|agatha|expresso|assassinato/i.test(t)) {
    return "detective in classic coat holding a magnifying glass inspecting legal evidence files and a gavel";
  }
  if (/habeas\s+corpus|liberdade/i.test(t)) {
    return "criminal defense attorney holding a signed writ of habeas corpus and unclasped brass handcuffs";
  }
  if (/rousseau|contrato\s+social/i.test(t)) {
    return "18th-century philosopher Jean-Jacques Rousseau holding a quill and the manuscript of The Social Contract";
  }
  if (/inquisição|inquisicao|colônia|colonia/i.test(t)) {
    return "colonial magistrate holding a historical court record scroll beside an antique scale of justice";
  }
  if (/beccaria|delitos\s+e\s+das\s+penas/i.test(t)) {
    return "18th-century reformer Cesare Beccaria holding a quill and his book On Crimes and Punishments";
  }
  if (/hammurabi|código\npenal/i.test(t)) {
    return "ancient king Hammurabi standing beside a carved stone stele of the Code of Hammurabi";
  }
  if (/kafka|gregor\s+samsa|o\s+processo/i.test(t)) {
    return "thoughtful writer Franz Kafka in a suit holding a court case file folder and pocket watch";
  }
  if (/antígona|antigona/i.test(t)) {
    return "classical Greek heroine Antigone holding a scroll of divine law vs human decree";
  }
  if (/rui\s+barbosa/i.test(t)) {
    return "distinguished 19th-century Brazilian jurist Rui Barbosa in formal frock coat holding legal manuscripts";
  }
  if (/foucault|vigiar\s+e\s+punir/i.test(t)) {
    return "philosopher Michel Foucault holding a pocket watch and book on penal system history";
  }
  if (/rawls|equidade/i.test(t)) {
    return "philosopher John Rawls holding a scale of social justice and fairness";
  }
  if (/maquiavel|o\s+príncipe/i.test(t)) {
    return "Renaissance thinker Niccolò Machiavelli holding a quill and book of statecraft";
  }
  if (/hobbes|leviatã|leviata/i.test(t)) {
    return "philosopher Thomas Hobbes holding a scepter and legal manuscript of Leviathan";
  }
  if (/kant|imperativo/i.test(t)) {
    return "philosopher Immanuel Kant holding a book of practical reason and balance scale";
  }
  if (/maria\s+da\s+penha/i.test(t)) {
    return "courageous female advocate for women's rights holding a decree of justice and scales of protection";
  }
  if (/advogada|mulheres?\s+no\s+direito|jurista\s+mulher|primeira\s+advogada|advogadas/i.test(t)) {
    return "distinguished female lawyer in an elegant burgundy suit holding a law folder and scales of justice";
  }
  if (/juíza|juiza|magistrada|ministra/i.test(t)) {
    return "dignified female judge in a black judicial robe with white collar holding a wooden gavel";
  }
  if (/estudante|concurseiro|iniciante|faculdade|primeiro\s+semestre/i.test(t)) {
    return "focused young law student with a backpack holding a thick law code book";
  }
  if (/ministro|stf|supremo|tribunal|acórdão/i.test(t)) {
    return "dignified magistrate in a black judicial robe holding a formal court document";
  }
  if (/sócrates|socrates|filosofia|platão|platao/i.test(t)) {
    return "classical philosopher in a toga, holding a rolled parchment scroll";
  }
  if (/promotor|acusação|penal|crime|defensoria|defensor/i.test(t)) {
    return "prosecutor in a formal suit pointing at an open criminal statute book";
  }
  return null;
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
  
  // 1) Checa se o título exige uma figura/personagem específica (ex: Esperança Garcia -> mulher negra advogada histórica)
  const detectedSubject = detectSubjectFigure(titulo, categoria);

  const seed = Math.abs(
    [...`${titulo}|${categoria}`].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) +
      Math.floor(Math.random() * 100000),
  );
  const pick = <T,>(pool: T[], offset: number): T => pool[(seed + offset) % pool.length];
  const figure = detectedSubject || pick(FIGURE_POOL, 3);
  const prop = pick(PROP_POOL, 11);
  const side = pick(SIDE_POOL, 23);
  const motifs = pick(MOTIF_POOL, 37);
  const secondary = pick(SECONDARY_POOL, 53);
  const floating = pick(FLOATING_POOL, 71);

  return `Flat vector cover panel for a Brazilian legal-education blog ("Blogger Jurídico"). 16:9 horizontal, FULL-BLEED, no borders.

THEME OF THIS COVER: "${titulo}" — category: ${categoria}. Interpretation direction: ${a.hint}.

BACKGROUND (most important): one FLAT, SOLID, SATURATED colour panel filling 100% of the canvas — a smooth diagonal gradient of the category colour ${a.hex} (${a.name}): lighter and slightly warmer at the top-right, deeper and darker at the bottom-left. Absolutely NO scenery, NO room, NO landscape, NO photographic texture, NO black background, NO white or cream margins.

BACKGROUND MOTIFS: large legal line-art symbols drawn very faintly on the colour panel, in a darker shade of the same colour (about 12-20% contrast, thin uniform strokes, outline only, no fill): ${motifs}. Scatter 5 to 7 of them near the corners and edges, partially cropped by the frame, plus an even, very subtle fine dot grid over the whole panel. These motifs must read as a watermark pattern behind everything — never as the main subject.

COMPOSITION (mandatory): CENTERED and SYMMETRICAL. The main figure sits exactly on the horizontal centre of the canvas, bottom-aligned, with supporting elements distributed evenly to its left and right so the two halves have similar visual weight. Never push the figure to a side third, never leave one half of the panel empty.

MAIN SUBJECT — ONE CUT-OUT FIGURE: a single flat vector illustrated figure, ${figure}. ${side}. The figure is a clean CUT-OUT (knockout) illustration placed on top of the colour panel: no ground, no shadow scenery, no room around it, only a soft drop shadow. It occupies roughly 60-72% of the frame height, feet/base touching the bottom edge, and is fully inside the frame (never cropped at the head or hands).

SUPPORTING ELEMENTS (fill the panel, keep it rich but tidy): ${prop}; plus ${secondary}; plus ${floating}. All of them are cut-out flat vector objects in the same palette and outline weight as the figure, bottom-aligned or floating, arranged so the composition stays balanced around the centre. Aim for a well-populated scene — roughly 6 to 9 distinct foreground elements in total — with clear breathing space between objects, no overlapping clutter, and nothing touching the frame edges except the ground line.

STYLE: flat vector editorial illustration, thin-to-medium clean dark outlines (${BASE_PALETTE.outline}), crisp 1-2px white stroke outline (sticker-style white halo contour around the central character and props so the figure pops with high contrast against the background), flat 2-3 tone shading, no gradients on the figure, no cross-hatching, no photorealism, no 3D render, no watercolour.

FIGURE PALETTE: cream #EFE1BD, warm beige skin ${BASE_PALETTE.skin}, warm neutral ${BASE_PALETTE.neutralWarm}, dark brown ${BASE_PALETTE.brownDark}, burgundy #8C1220 and soft gold #C9A26A for cloth and metal details. The figure must clearly stand out against the ${a.name} panel.

TEXT: none at all. No title, no caption, no watermark, no logo, no letters (a single short serif word engraved on a book spine is the only tolerated exception).

UNIQUENESS: the figure and the supporting objects must NOT repeat previous covers — but the CENTERED framing is fixed and must always be respected.${avoid.length ? ` Avoid repeating the subject/props of: ${avoid.join("; ")}.` : ""}

NEGATIVES: off-centre or side-anchored figure, empty half of the panel, photorealistic, 3D render, painted scenery, interior/exterior environment, sepia vintage engraving, cluttered overlapping collage, black background, white or cream background, borders, frames, vignette, visible text or captions, modern devices (laptops, smartphones), distorted hands, extra limbs, low quality.`;

}

