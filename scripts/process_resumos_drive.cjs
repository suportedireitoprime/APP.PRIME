const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Configurações do R2
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: "199f43b3ef1e89db1506e45430cb4660",
    secretAccessKey: "6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc",
  },
});
const R2_BUCKET = "estudos-juridicos-midias";
const R2_PUBLIC_BASE = "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev";

// Função para fazer upload de buffer para o R2
async function uploadToR2(key, buffer, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return `${R2_PUBLIC_BASE}/${key}`;
}

// Utilitário para slugify
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Download de arquivo do Drive por ID com retry
async function downloadDriveFile(id, retries = 3) {
  const url = `https://drive.google.com/uc?export=download&id=${id}`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      if (res.ok) {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error(`Falha ao baixar arquivo ${id}`);
}

// Lista arquivos de pasta do Drive (com suporte a _DRIVE_ivd e fallback de regex)
async function listDriveFolder(folderId) {
  try {
    const url = `https://drive.google.com/drive/folders/${folderId}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const html = await res.text();
    const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
    if (match) {
      const hexDecoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
      const data = JSON.parse(hexDecoded);
      const items = [];
      function findItems(arr) {
        if (!Array.isArray(arr)) return;
        if (
          arr.length >= 4 &&
          typeof arr[0] === "string" &&
          arr[0].length >= 20 &&
          typeof arr[2] === "string"
        ) {
          items.push({ id: arr[0], name: arr[2] });
        }
        for (const el of arr) {
          if (Array.isArray(el)) findItems(el);
        }
      }
      findItems(data);
      if (items.length > 0) return items;
    }
  } catch {}

  // Fallback para embeddedfolderview
  try {
    const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    const html = await res.text();
    const entries = [];
    const regex = /<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const href = m[1];
      const text = m[2].replace(/<[^>]+>/g, "").trim();
      if (href.includes("drive.google.com") || href.includes("file")) {
        const idMatch = href.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (idMatch) {
          entries.push({ id: idMatch[1], name: text });
        }
      }
    }
    return entries;
  } catch {
    return [];
  }
}

// Processa um .docx e extrai capítulos estruturados com imagens
async function processDocxBuffer(docxBuffer, areaSlug, temaSlug) {
  const zip = await JSZip.loadAsync(docxBuffer);

  // Extrai imagens de word/media/
  const imageR2Urls = {};
  const mediaFiles = Object.keys(zip.files).filter((k) => k.startsWith("word/media/"));

  for (const mediaPath of mediaFiles) {
    const filename = path.basename(mediaPath);
    const imgData = await zip.file(mediaPath).async("nodebuffer");
    const ext = path.extname(filename).toLowerCase().replace(".", "") || "png";
    const mime =
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
    const r2Key = `resumos/imagens/${areaSlug}/${temaSlug}/${filename}`;

    try {
      const publicUrl = await uploadToR2(r2Key, imgData, mime);
      imageR2Urls[filename] = publicUrl;
    } catch (e) {
      console.error(`Erro ao subir imagem ${filename}:`, e.message);
    }
  }

  // Carrega document.xml e rels
  const docXml = await zip.file("word/document.xml").async("text");
  let relsXml = "";
  if (zip.file("word/_rels/document.xml.rels")) {
    relsXml = await zip.file("word/_rels/document.xml.rels").async("text");
  }

  const relsMap = {};
  const relRegex = /Id="([^"]+)"[^>]+Target="media\/([^"]+)"/g;
  let rm;
  while ((rm = relRegex.exec(relsXml)) !== null) {
    relsMap[rm[1]] = rm[2];
  }

  // Limpeza de entidades XML
  function cleanXmlText(xmlStr) {
    return (xmlStr || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .trim();
  }

  function isKnownSectionHeader(text) {
    const norm = (text || "").toLowerCase().trim();
    return [
      "em linguagem simples",
      "para entender melhor",
      "de olho na prova",
      "exemplo pratico",
      "exemplo prático",
      "ficha do crime",
      "ficha do tema",
      "ficha do conceito",
      "para guardar",
      "antes de comecar",
      "antes de começar",
      "como usar este material",
      "sumario",
      "sumário",
    ].includes(norm);
  }

  function isTerracotta(color) {
    if (!color) return false;
    const c = color.toUpperCase();
    return ["C0563F", "C00000", "B22222", "D97706", "D04A2A", "9C3420"].includes(c);
  }

  const bodyMatch = docXml.match(/<w:body>([\s\S]*?)<\/w:body>/);
  if (!bodyMatch) return [];
  const body = bodyMatch[1];

  const elRegex = /<w:(p|tbl)\b[\s\S]*?<\/w:\1>/g;
  const elements = [];
  let m;
  while ((m = elRegex.exec(body)) !== null) {
    elements.push({ type: m[1], raw: m[0] });
  }

  const parsedItems = [];

  for (const el of elements) {
    if (el.type === "p") {
      const blipMatch = el.raw.match(/r:embed="([^"]+)"/);
      const imageFile = blipMatch ? relsMap[blipMatch[1]] : null;

      const rRegex = /<w:r\b[\s\S]*?<\/w:r>/g;
      let rMatch;
      const textSpans = [];
      let pFullText = "";

      while ((rMatch = rRegex.exec(el.raw)) !== null) {
        const rRaw = rMatch[0];
        const tMatches = rRaw.match(/<w:t\b[^>]*>(.*?)<\/w:t>/g) || [];
        const t = tMatches.map(cleanXmlText).join("");
        if (!t) continue;

        const isBold = rRaw.includes("<w:b/>") || rRaw.includes("<w:b ");
        const isItalic = rRaw.includes("<w:i/>") || rRaw.includes("<w:i ");
        const colorMatch = rRaw.match(/<w:color\s+[^>]*w:val="([^"]+)"/);
        const color = colorMatch ? colorMatch[1].toUpperCase() : null;

        textSpans.push({ text: t, bold: isBold, italic: isItalic, color });
        pFullText += t;
      }

      pFullText = pFullText.trim();
      const pColorMatch = el.raw.match(/<w:color\s+[^>]*w:val="([^"]+)"/);
      const pColor = pColorMatch ? pColorMatch[1].toUpperCase() : null;
      const hasBorderBottom = el.raw.includes("w:bottom") || el.raw.includes("w:pBdr");
      const isBullet = el.raw.includes("ListBullet") || el.raw.includes("w:numPr");
      const hasTerracottaSpan = textSpans.some((s) => isTerracotta(s.color));
      const capMatch = pFullText.match(/^CAPÍTULO\s+(\d+)(?:\s+[•\-–]\s*(.*))?$/i);

      parsedItems.push({
        type: "p",
        text: pFullText,
        spans: textSpans,
        color: pColor,
        hasTerracottaSpan,
        hasBorderBottom,
        isBullet,
        isChapter: !!capMatch,
        chapterNum: capMatch ? parseInt(capMatch[1], 10) : null,
        chapterSub: capMatch ? (capMatch[2] || "").trim() : null,
        imageFile,
      });
    } else if (el.type === "tbl") {
      const trRegex = /<w:tr\b[\s\S]*?<\/w:tr>/g;
      let trM;
      const rows = [];
      while ((trM = trRegex.exec(el.raw)) !== null) {
        const tcRegex = /<w:tc\b[\s\S]*?<\/w:tc>/g;
        let tcM;
        const cells = [];
        while ((tcM = tcRegex.exec(trM[0])) !== null) {
          const pRegex = /<w:p\b[\s\S]*?<\/w:p>/g;
          let pM;
          const cellParagraphs = [];
          while ((pM = pRegex.exec(tcM[0])) !== null) {
            const tMatches = pM[0].match(/<w:t\b[^>]*>(.*?)<\/w:t>/g) || [];
            const t = tMatches.map(cleanXmlText).join("").trim();
            const isBold = pM[0].includes("<w:b/>") || pM[0].includes("<w:b ");
            const isItalic = pM[0].includes("<w:i/>") || pM[0].includes("<w:i ");
            if (t) {
              cellParagraphs.push({ text: t, bold: isBold, italic: isItalic });
            }
          }
          cells.push(cellParagraphs);
        }
        rows.push(cells);
      }

      const firstText = rows[0]?.[0]?.[0]?.text || "";
      const capMatch = firstText.match(/^CAPÍTULO\s+(\d+)(?:\s+[•\-–]\s*(.*))?$/i);

      parsedItems.push({
        type: "tbl",
        rows,
        isChapter: !!capMatch,
        chapterNum: capMatch ? parseInt(capMatch[1], 10) : null,
        chapterSub: capMatch ? (capMatch[2] || "").trim() : null,
      });
    }
  }

  // Identifica capítulos
  const chapterStarts = [];
  for (let i = 0; i < parsedItems.length; i++) {
    const item = parsedItems[i];
    if (item.isChapter) {
      let titulo = "";
      let subtitulo = "";

      let offset = 1;
      while (i + offset < parsedItems.length) {
        const next = parsedItems[i + offset];
        if (next.type === "p" && next.text) {
          if (!titulo) {
            titulo = next.text;
          } else if (!subtitulo && !isKnownSectionHeader(next.text)) {
            subtitulo = next.text;
            break;
          } else {
            break;
          }
        } else if (next.type === "tbl") {
          break;
        }
        offset++;
      }

      if (item.chapterSub) {
        if (!titulo || isKnownSectionHeader(titulo)) {
          titulo = item.chapterSub;
        }
      }

      chapterStarts.push({
        index: i,
        numero: item.chapterNum,
        titulo: titulo || `Capítulo ${item.chapterNum}`,
        subtitulo: subtitulo || "",
        contentStartIndex: i + offset,
      });
    }
  }

  // Constrói Markdown de cada capítulo
  const chapters = [];
  for (let cIdx = 0; cIdx < chapterStarts.length; cIdx++) {
    const curr = chapterStarts[cIdx];
    const next = chapterStarts[cIdx + 1];
    const startIndex = curr.index;
    const endIndex = next ? next.index : parsedItems.length;

    // Encontra imagem principal
    let chapterImgUrl = null;
    for (let j = startIndex; j < Math.min(startIndex + 12, endIndex); j++) {
      const it = parsedItems[j];
      if (it.type === "p" && it.imageFile && imageR2Urls[it.imageFile]) {
        chapterImgUrl = imageR2Urls[it.imageFile];
        break;
      }
    }

    const lines = [];
    lines.push(`# ${curr.numero.toString().padStart(2, "0")}. ${curr.titulo}`);
    if (curr.subtitulo) {
      lines.push(`*${curr.subtitulo}*`);
      lines.push("");
    }

    if (chapterImgUrl) {
      lines.push(`![${curr.titulo}](${chapterImgUrl})`);
      lines.push("");
    }

    for (let j = curr.contentStartIndex; j < endIndex; j++) {
      const it = parsedItems[j];

      if (it.type === "p") {
        // Se for outra imagem no meio do texto
        if (
          it.imageFile &&
          imageR2Urls[it.imageFile] &&
          imageR2Urls[it.imageFile] !== chapterImgUrl
        ) {
          lines.push(`![Ilustração explicativa](${imageR2Urls[it.imageFile]})`);
          lines.push("");
          continue;
        }

        const t = it.text;
        if (!t) continue;

        // Seção principal
        if (
          isKnownSectionHeader(t) ||
          (it.hasBorderBottom && (it.color === "1B2A4A" || !it.color))
        ) {
          lines.push("");
          lines.push(`## ${t}`);
          lines.push("");
          continue;
        }

        // Subtítulo terracota
        if (
          (isTerracotta(it.color) || it.hasTerracottaSpan) &&
          !it.isBullet &&
          !t.startsWith("⚠") &&
          !t.startsWith("✓")
        ) {
          lines.push("");
          lines.push(`### ${t}`);
          lines.push("");
          continue;
        }

        // Tópicos com ⚠ de "De olho na prova"
        if (t.startsWith("⚠") || (it.isBullet && it.hasTerracottaSpan)) {
          const cleanT = t.replace(/^⚠\s*/, "").trim();
          const colonIdx = cleanT.indexOf(":");
          if (colonIdx > 0 && colonIdx < 60) {
            const topic = cleanT.slice(0, colonIdx).trim();
            const rest = cleanT.slice(colonIdx + 1).trim();
            lines.push(`- ⚠ **${topic}:** ${rest}`);
          } else {
            lines.push(`- ⚠ **${cleanT}**`);
          }
          continue;
        }

        // Tópicos de "Para guardar" com checkmark
        if (t.startsWith("✓") || (it.isBullet && t.includes("✓"))) {
          const cleanT = t.replace(/^✓\s*/, "").trim();
          lines.push(`- ✓ **${cleanT}**`);
          continue;
        }

        if (it.isBullet) {
          lines.push(`- ${t}`);
          continue;
        }

        lines.push(t);
        lines.push("");
      } else if (it.type === "tbl") {
        const rows = it.rows;
        if (!rows || rows.length === 0) continue;

        // Callout box de 1 linha e 1 célula
        if (rows.length === 1 && rows[0].length === 1) {
          const paras = rows[0][0];
          const firstP = paras[0]?.text || "";
          const restP = paras
            .slice(1)
            .map((p) => p.text)
            .join("\n\n");

          if (
            firstP.toLowerCase().includes("exemplo prático") ||
            firstP.toLowerCase().includes("exemplo pratico")
          ) {
            lines.push("");
            lines.push("> [!TIP] **Exemplo prático**");
            if (restP) lines.push(`> *${restP}*`);
            lines.push("");
          } else if (
            firstP.toLowerCase().includes("atenção") ||
            firstP.toLowerCase().includes("atencao") ||
            firstP.toLowerCase().includes("curiosidade")
          ) {
            lines.push("");
            lines.push("> [!WARNING] **Atenção — Curiosidade**");
            const fullRest = (
              firstP.replace(/^aten[cç][aã]o\s*/i, "") + (restP ? "\n\n" + restP : "")
            ).trim();
            lines.push(`> *${fullRest}*`);
            lines.push("");
          } else if (
            firstP.toLowerCase().includes("aviso importante") ||
            firstP.toLowerCase().includes("sobre este material")
          ) {
            lines.push("");
            lines.push("> [!NOTE] **Aviso importante**");
            lines.push(`> *${restP || firstP}*`);
            lines.push("");
          } else {
            lines.push("");
            lines.push(`> **${firstP}**`);
            if (restP) lines.push(`> ${restP}`);
            lines.push("");
          }
          continue;
        }

        // Tabela de dados (2 ou mais colunas)
        const colCount = Math.max(...rows.map((r) => r.length));
        if (colCount >= 2) {
          lines.push("");
          const headerRow = rows[0];
          const col1Header = headerRow[0]?.[0]?.text || "Item / Conceito";
          const col2Header =
            headerRow[1]?.[0]?.text || (colCount === 2 ? "Detalhamento" : "Definição");
          const col3Header = headerRow[2]?.[0]?.text || "Exemplo";

          if (colCount === 2) {
            lines.push(`| ${col1Header} | ${col2Header} |`);
            lines.push(`| :--- | :--- |`);
          } else {
            lines.push(`| ${col1Header} | ${col2Header} | ${col3Header} |`);
            lines.push(`| :--- | :--- | :--- |`);
          }

          for (let rIdx = 1; rIdx < rows.length; rIdx++) {
            const r = rows[rIdx];
            const col1 = (r[0] || [])
              .map((p) => p.text)
              .join(" ")
              .trim();
            const col2 = (r[1] || [])
              .map((p) => p.text)
              .join(" ")
              .trim();
            const col3 = (r[2] || [])
              .map((p) => p.text)
              .join(" ")
              .trim();

            if (!col1 && !col2) continue;

            const safeC1 = col1.replace(/\|/g, "\\|");
            const safeC2 = col2.replace(/\|/g, "\\|");
            const safeC3 = col3.replace(/\|/g, "\\|");

            if (colCount === 2) {
              lines.push(`| **${safeC1}** | ${safeC2} |`);
            } else {
              lines.push(`| **${safeC1}** | ${safeC2} | ${safeC3} |`);
            }
          }
          lines.push("");
        }
      }
    }

    chapters.push({
      numero: curr.numero,
      titulo: `${curr.numero.toString().padStart(2, "0")}. ${curr.titulo}`,
      subtitulo: curr.subtitulo,
      markdown: lines.join("\n").trim(),
      imageUrl: chapterImgUrl,
    });
  }

  return chapters;
}

// Processa um tema completo (Docx + Áudios)
async function processTheme(areaName, docxItem, audioFolderItem) {
  const areaSlug = slugify(areaName);
  const cleanTemaName = docxItem.name
    .replace(/^[\d\s\-]+resumo\s*[-–]\s*/i, "")
    .replace(/\.docx$/i, "");
  const temaSlug = slugify(cleanTemaName);

  console.log(`\n==================================================`);
  console.log(`PROCESSANDO TEMA: [${cleanTemaName}]`);
  console.log(`Área: ${areaName}`);
  console.log(`==================================================`);

  // 1. Baixa o .docx do Google Drive
  console.log(`Baixando .docx do Drive (id: ${docxItem.id})...`);
  const docxBuffer = await downloadDriveFile(docxItem.id);
  console.log(`Docx baixado: ${docxBuffer.length} bytes`);

  // 2. Extrai imagens e capítulos
  console.log(`Extraindo imagens e capítulos do Word...`);
  const chapters = await processDocxBuffer(docxBuffer, areaSlug, temaSlug);
  console.log(`Total de capítulos extraídos: ${chapters.length}`);

  // 3. Baixa e sobe os áudios correspondentes
  const audioMap = {};
  let audioFiles = [];
  if (audioFolderItem && audioFolderItem.id) {
    console.log(`Listando arquivos de áudio na pasta [${audioFolderItem.name}]...`);
    audioFiles = await listDriveFolder(audioFolderItem.id);
    console.log(`Encontrados ${audioFiles.length} arquivos de áudio`);
  }

  // Se a subpasta estava vazia ou não existia, tenta buscar áudios na pasta raiz de narrações da área
  if (audioFiles.length === 0) {
    try {
      const parentNarracoes = JSON.parse(fs.readFileSync("scratch/penal_narracoes.json", "utf8"));
      // Arquivos que são .mp3 diretamente na pasta raiz
      const rootMp3s = parentNarracoes.filter((n) => n.name && n.name.endsWith(".mp3"));
      if (rootMp3s.length > 0 && cleanTemaName.toLowerCase().includes("familia")) {
        audioFiles = rootMp3s;
        console.log(
          `Encontrados ${audioFiles.length} arquivos de áudio na pasta raiz para este tema`,
        );
      }
    } catch {}
  }

  for (const af of audioFiles) {
    if (!af.name.endsWith(".mp3")) continue;
    // Extrai número do capítulo do nome do arquivo (ex: cap01-..., cap12-...)
    const numMatch = af.name.match(/cap0?(\d+)/i);
    const capNum = numMatch ? parseInt(numMatch[1], 10) : null;

    console.log(`Baixando áudio: ${af.name} (Capítulo ${capNum})...`);
    try {
      const audioBuf = await downloadDriveFile(af.id);
      const r2Key = `resumos/audio/${areaSlug}/${temaSlug}/${af.name}`;
      const audioUrl = await uploadToR2(r2Key, audioBuf, "audio/mpeg");
      console.log(`  -> Áudio enviado para R2: ${audioUrl}`);
      if (capNum != null) {
        audioMap[capNum] = audioUrl;
      }
    } catch (e) {
      console.error(`Erro ao processar áudio ${af.name}:`, e.message);
    }
  }

  // 4. Vincula o áudio ao Markdown do capítulo
  const subtemas = [];
  for (const c of chapters) {
    const audioUrl = audioMap[c.numero] || null;
    let finalMarkdown = c.markdown;
    if (audioUrl) {
      finalMarkdown = `<!-- audio: ${audioUrl} -->\n\n` + finalMarkdown;
    }

    subtemas.push({
      id: `${areaSlug}_${temaSlug}_cap${c.numero}`,
      subtema: c.titulo,
      ordem: c.numero,
      markdown: finalMarkdown,
      audio_url: audioUrl,
      imageUrl: c.imageUrl,
    });
  }

  return {
    tema: cleanTemaName,
    total: subtemas.length,
    subtemas,
  };
}

module.exports = {
  processTheme,
  slugify,
  uploadToR2,
  listDriveFolder,
  downloadDriveFile,
};
