import { jsPDF } from "jspdf";

type ResumoLike = {
  area: string;
  tema: string;
  subtema: string | null;
  markdown: string | null;
  exemplos?: string | null;
  termos?: string | null;
};

/** Converte markdown simples em blocos imprimíveis (ABNT-like) */
type Bloco = { tipo: "h1" | "h2" | "h3" | "p" | "li" | "quote"; texto: string };

function parseMarkdown(md: string): Bloco[] {
  const linhas = md.replace(/\r/g, "").split("\n");
  const blocos: Bloco[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length) {
      blocos.push({ tipo: "p", texto: limpar(buffer.join(" ")) });
      buffer = [];
    }
  };

  for (const raw of linhas) {
    const linha = raw.trim();
    if (!linha) {
      flush();
      continue;
    }
    if (/^###\s+/.test(linha)) {
      flush();
      blocos.push({ tipo: "h3", texto: limpar(linha.replace(/^###\s+/, "")) });
    } else if (/^##\s+/.test(linha)) {
      flush();
      blocos.push({ tipo: "h2", texto: limpar(linha.replace(/^##\s+/, "")) });
    } else if (/^#\s+/.test(linha)) {
      flush();
      blocos.push({ tipo: "h1", texto: limpar(linha.replace(/^#\s+/, "")) });
    } else if (/^>\s?/.test(linha)) {
      flush();
      blocos.push({ tipo: "quote", texto: limpar(linha.replace(/^>\s?/, "")) });
    } else if (/^([-*+]|\d+\.)\s+/.test(linha)) {
      flush();
      blocos.push({ tipo: "li", texto: limpar(linha.replace(/^([-*+]|\d+\.)\s+/, "")) });
    } else if (/^\|/.test(linha)) {
      flush();
      const celulas = linha
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (celulas.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      blocos.push({ tipo: "p", texto: limpar(celulas.join("  •  ")) });
    } else {
      buffer.push(linha);
    }
  }
  flush();
  return blocos;
}

function limpar(t: string) {
  return t
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function gerarResumoPdf(resumo: ResumoLike) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const LARGURA = 210;
  const ALTURA = 297;
  const MARGEM_ESQ = 30; // ABNT: 3cm
  const MARGEM_DIR = 20; // ABNT: 2cm
  const MARGEM_TOPO = 30;
  const MARGEM_BASE = 20;
  const UTIL = LARGURA - MARGEM_ESQ - MARGEM_DIR;

  const titulo = (resumo.subtema || resumo.tema || "Resumo").toUpperCase();

  // ---------- Capa ----------
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, LARGURA, ALTURA, "F");
  doc.setFillColor(154, 21, 45);
  doc.rect(0, 0, LARGURA, 6, "F");
  doc.rect(0, ALTURA - 6, LARGURA, 6, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("RESUMO JURÍDICO", LARGURA / 2, 70, { align: "center" });

  doc.setDrawColor(154, 21, 45);
  doc.setLineWidth(1);
  doc.line(LARGURA / 2 - 20, 76, LARGURA / 2 + 20, 76);

  doc.setFontSize(24);
  const tituloLinhas = doc.splitTextToSize(titulo, UTIL);
  doc.text(tituloLinhas, LARGURA / 2, 100, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(200, 200, 205);
  doc.text(resumo.area || "", LARGURA / 2, 100 + tituloLinhas.length * 10 + 8, {
    align: "center",
  });
  doc.setFontSize(11);
  doc.text(resumo.tema || "", LARGURA / 2, 100 + tituloLinhas.length * 10 + 16, {
    align: "center",
  });

  doc.setFontSize(9);
  doc.setTextColor(160, 160, 168);
  doc.text(
    new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
    LARGURA / 2,
    ALTURA - 30,
    { align: "center" }
  );

  // ---------- Conteúdo ----------
  let y = MARGEM_TOPO;
  let pagina = 1;
  doc.addPage();
  pagina++;

  const rodape = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(130, 130, 130);
    doc.text(String(pagina - 1), LARGURA - MARGEM_DIR, 15, { align: "right" });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(MARGEM_ESQ, ALTURA - MARGEM_BASE + 6, LARGURA - MARGEM_DIR, ALTURA - MARGEM_BASE + 6);
    doc.setFontSize(8);
    doc.text(titulo.slice(0, 70), MARGEM_ESQ, ALTURA - MARGEM_BASE + 11);
  };

  rodape();

  const quebra = (altura: number) => {
    if (y + altura > ALTURA - MARGEM_BASE) {
      doc.addPage();
      pagina++;
      y = MARGEM_TOPO;
      rodape();
    }
  };

  const escrever = (blocos: Bloco[]) => {
    for (const b of blocos) {
      doc.setTextColor(20, 20, 20);
      if (b.tipo === "h1" || b.tipo === "h2") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(b.tipo === "h1" ? 14 : 12.5);
      } else if (b.tipo === "h3") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11.5);
      } else if (b.tipo === "quote") {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(70, 70, 70);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12); // ABNT corpo 12
      }

      const recuo = b.tipo === "li" || b.tipo === "quote" ? 6 : 0;
      const texto = b.tipo === "li" ? `•  ${b.texto}` : b.texto;
      const linhas = doc.splitTextToSize(texto, UTIL - recuo);
      const lineHeight = b.tipo === "p" || b.tipo === "li" ? 7 : 6.5; // 1,5 entrelinhas
      const espacoAntes = b.tipo.startsWith("h") ? 6 : 2;

      quebra(linhas.length * lineHeight + espacoAntes);
      y += espacoAntes;
      doc.text(linhas, MARGEM_ESQ + recuo, y, {
        align: b.tipo === "p" ? "justify" : "left",
        maxWidth: UTIL - recuo,
      });
      y += linhas.length * lineHeight + 2;
    }
  };

  const secao = (rotulo: string, conteudo?: string | null) => {
    if (!conteudo?.trim()) return;
    quebra(20);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(154, 21, 45);
    doc.text(rotulo.toUpperCase(), MARGEM_ESQ, y);
    y += 8;
    escrever(parseMarkdown(conteudo));
  };

  secao("Resumo", resumo.markdown);
  secao("Exemplos", resumo.exemplos);
  secao("Termos", resumo.termos);

  const nome = (resumo.subtema || resumo.tema || "resumo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()
    .slice(0, 60);

  doc.save(`${nome || "resumo"}.pdf`);
}

export function resumoParaTexto(resumo: ResumoLike) {
  const partes = [
    `${resumo.subtema || resumo.tema}`,
    `${resumo.area} · ${resumo.tema}`,
    "",
    resumo.markdown || "",
  ];
  if (resumo.exemplos) partes.push("", "EXEMPLOS", resumo.exemplos);
  if (resumo.termos) partes.push("", "TERMOS", resumo.termos);
  return partes.join("\n");
}
