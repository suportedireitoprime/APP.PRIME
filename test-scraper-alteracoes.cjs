const fs = require('fs');

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

const ART_REGEX = /^Art\.?\s*(\d+(?:\.\d+)*(?:-[A-Za-z0-9]+)?)/i;
const ALTERACAO_NOTE_RE = /(?:[([][\s]*)?(Reda[çc][ãa]o\s+dada|Inclu[íi]d[oa]|Acrescid[oa]|Revogad[oa]|Restaurad[oa]|Alterad[oa]|Transformad[oa]|Renumerad[oa])\s+(?:pela|pelo|na)\s+([^)\]\n]+)/i;

function parseAlteracoesFromHtml(html, baseUrl, maxAgeYears = 100) {
  const currentYear = new Date().getFullYear();
  const found = [];

  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;

  let currentArtNum = '';
  let prevStrikeText = '';

  while ((pMatch = pRegex.exec(html)) !== null) {
    const rawParagraph = pMatch[1];
    const textClean = decodeHtmlEntities(rawParagraph.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();

    const artMatch = textClean.match(ART_REGEX);
    if (artMatch) {
      currentArtNum = artMatch[1].replace(/\./g, '');
    }

    let strikeText = '';
    const strikeMatch = rawParagraph.match(/<strike\b[^>]*>([\s\S]*?)<\/strike>/i);
    if (strikeMatch) {
      strikeText = decodeHtmlEntities(strikeMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();
      prevStrikeText = strikeText;
    }

    const noteMatch = textClean.match(ALTERACAO_NOTE_RE);
    if (noteMatch) {
      const acao = noteMatch[1];
      const leiDetalhe = noteMatch[2];
      
      const anoCaptured = leiDetalhe.match(/\b(19\d{2}|20\d{2})\b/);
      let ano = anoCaptured ? parseInt(anoCaptured[1], 10) : 0;
      if (!ano) {
        const fallbackAno = textClean.match(/\b(19\d{2}|20\d{2})\b/);
        if (fallbackAno) ano = parseInt(fallbackAno[1], 10);
      }

      if (ano && (currentYear - ano > maxAgeYears)) {
        continue;
      }

      const artigoFinal = artMatch ? artMatch[1].replace(/\./g, '') : currentArtNum;
      if (!artigoFinal) continue;

      let linkLei = '';
      const hrefMatch = rawParagraph.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/i);
      if (hrefMatch) {
        const rawHref = hrefMatch[1];
        try {
          linkLei = new URL(rawHref, baseUrl).href;
        } catch {
          linkLei = rawHref;
        }
      }

      const motivoLimpo = `${acao} pela ${leiDetalhe}`.replace(/\s+/g, ' ').trim();

      let textoNovo = textClean
        .replace(strikeText, '')
        .replace(noteMatch[0], '')
        .replace(/\s+/g, ' ')
        .trim();

      found.push({
        artigo: `Art. ${artigoFinal}`,
        motivo: motivoLimpo,
        ano: ano || currentYear,
        texto_antigo: strikeText || prevStrikeText || '',
        texto_novo: textoNovo || textClean,
        link_lei: linkLei || undefined,
      });

      prevStrikeText = '';
    }
  }

  const uniqueMap = new Map();
  for (const item of found) {
    const key = `${item.artigo}_${item.ano}_${item.motivo.slice(0, 30).toLowerCase()}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values()).sort((a, b) => b.ano - a.ano);
}

async function run() {
  const url = 'https://planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const bytes = new Uint8Array(await res.arrayBuffer());
  let body = new TextDecoder('windows-1252').decode(bytes);
  
  body = body.normalize("NFC")
    .replace(/\uFFFD/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  const results = parseAlteracoesFromHtml(body, url, 100);
  console.log('Total found:', results.length);
  console.log('Sample 3:', results.slice(0, 3));
}

run().catch(console.error);
