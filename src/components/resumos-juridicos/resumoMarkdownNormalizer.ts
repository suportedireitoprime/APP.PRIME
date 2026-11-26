/** Remove prefixos numéricos redundantes ("01. ", "02 - ", etc.) dos títulos */
export const cleanTitulo = (raw?: string | null): string => {
  if (!raw) return "";
  return raw.replace(/^\d+[\.\-\s_]+\s*/i, "").trim();
};

/** Normaliza markdown exportado do Word para manter fidelidade visual em todo o catálogo. */
export function normalizarMarkdownWord(raw?: string | null): string {
  if (!raw) return "";
  let md = raw;

  // 0. Remove comentários HTML e tags de áudio para não vazar no texto renderizado
  md = md.replace(/<!--[\s\S]*?-->/g, "");
  md = md.replace(/\[audio:\s*[^\s\]]+\s*\]/gi, "");

  // 0.05 Remove prefixo numérico no título principal (# 01. Título -> # Título)
  md = md.replace(/^#\s*\d+[\.\-\s_]+\s*/gm, "# ");
  md = md.replace(/^##\s*\d+[\.\-\s_]+\s*/gm, "## ");

  // 0.1 Normaliza callouts de Curiosidade e Exemplo Prático
  md = md.replace(
    />\s*\[!(?:WARNING|IMPORTANT|TIP|NOTE)\]\s*(?:\*\*)?(?:Atenção\s*[—\-–]?\s*Curiosidade|Curiosidade)(?:\*\*)?/gi,
    "> [!CURIOSIDADE]"
  );
  md = md.replace(/(>\s*\[!CURIOSIDADE\]\s*\r?\n>\s*(?:\*|_)?)\s*Curiosidade:\s*/gi, "$1");
  md = md.replace(
    />\s*\[!(?:TIP|NOTE|WARNING|IMPORTANT)\]\s*(?:\*\*)?Exemplo\s*pr[aá]tico(?:\*\*)?/gi,
    "> [!EXEMPLO]"
  );
  md = md.replace(/(>\s*\[!EXEMPLO\]\s*\r?\n>\s*(?:\*|_)?)\s*Exemplo(?:\s*pr[aá]tico)?:\s*/gi, "$1");

  // 0.2 Remove negrito artificial que envolve o tópico/bullet inteiro
  md = md.replace(/^(\s*[-*]\s*(?:[✓⚠]\s*)?)\*\*(.*?)\*\*\s*$/gm, "$1$2");
  md = md.replace(/^(\s*\d{1,2}[.)]\s*)\*\*(.*?)\*\*\s*$/gm, "$1$2");

  // 1. Converte headers legacy de seções para ##
  md = md.replace(
    /^###\s*(?:[🎯💡📋📌]\s*)?(Em linguagem simples|Para entender melhor|De olho na prova|Ficha do tema|Ficha do crime|Ficha do conceito|Para guardar|Antes de começar|Como usar este material|Sumário)/gim,
    "## $1"
  );

  // 2. Converte `> [!WARNING]\n> **Topic:** desc` em bullets limpos com ⚠
  md = md.replace(/>\s*\[!WARNING\]\s*\n>\s*\*\*([^\n*]+)\*\*/g, (match, p1: string) => {
    if (p1.includes(":") || p1.startsWith("⚠")) {
      const clean = p1.replace(/^⚠\s*/, "").trim();
      const cIdx = clean.indexOf(":");
      if (cIdx > 0 && cIdx < 60) {
        return `- ⚠ **${clean.slice(0, cIdx).trim()}:** ${clean.slice(cIdx + 1).trim()}`;
      }
      return `- ⚠ **${clean}**`;
    }
    return match;
  });

  // 3. Converte "## Exemplo prático" solto em callout [!TIP]
  md = md.replace(
    /#{2,3}\s*(?:💡\s*)?Exemplo prático\s*\n+([\s\S]*?)(?=\n#{1,3}\s|\n---|$)/i,
    (match, body: string) => {
      const cleanBody = body.trim();
      if (!cleanBody.startsWith(">")) {
        return `> [!TIP] **Exemplo prático**\n> *${cleanBody}*\n\n`;
      }
      return match;
    }
  );

  // 4. Converte "Ficha do tema" sem pipe de tabela em tabela Markdown
  md = md.replace(
    /#{2,3}\s*(?:📋\s*)?(Ficha do (?:tema|crime|conceito))\s*\n+([\s\S]*?)(?=\n#{1,3}\s|\n---|$)/i,
    (match, headerTitle: string, body: string) => {
      const trimmedBody = body.trim();
      if (trimmedBody.includes("|")) return `## ${headerTitle}\n\n${trimmedBody}\n\n`;

      const lines = trimmedBody.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 4) {
        const rows = [`| ${headerTitle} | Detalhamento |`, `| :--- | :--- |`];
        for (let i = 0; i < lines.length; i += 2) {
          const k = lines[i];
          const v = lines[i + 1] || "";
          if (k && v) {
            rows.push(`| **${k}** | ${v} |`);
          }
        }
        return `## ${headerTitle}\n\n` + rows.join("\n") + "\n\n";
      }
      return match;
    }
  );

  // 5. Converte subtítulos soltos dentro de "Para entender melhor" em ###
  md = md.replace(/(##\s*Para entender melhor[\s\S]*?)(?=\n##|\n---|$)/i, (_match, sectionBody: string) => {
    const lines = sectionBody.split("\n");
    const newLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const trimmed = l.trim();

      if (
        trimmed &&
        !trimmed.startsWith("#") &&
        !trimmed.startsWith("-") &&
        !trimmed.startsWith(">") &&
        !trimmed.startsWith("|") &&
        trimmed.length >= 10 &&
        trimmed.length <= 80 &&
        !trimmed.endsWith(".") &&
        !trimmed.endsWith(":") &&
        !trimmed.endsWith(",") &&
        lines[i + 1] === "" &&
        lines[i + 2] &&
        lines[i + 2].trim().length > 60
      ) {
        newLines.push(`### ${trimmed}`);
      } else {
        newLines.push(l);
      }
    }
    return newLines.join("\n");
  });

  return md;
}
