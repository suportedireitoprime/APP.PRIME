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

async function run() {
  const url = 'https://planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm';
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const bytes = new Uint8Array(await res.arrayBuffer());
  const html = new TextDecoder("windows-1252").decode(bytes);

  const currentYear = new Date().getFullYear();
  const maxAgeYears = 100; // O usuário quer TODAS
  const found = [];

  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let pMatch;

  let currentArtNum = '';
  let prevStrikeText = '';
  const ART_REGEX = /^Art\.?\s*(\d+(?:\.\d+)*(?:-[A-Za-z0-9]+)?)/i;
  const ALTERACAO_NOTE_RE = /(?:[([][\s]*)?(Reda[çc][ãa]o\s+dada|Inclu[íi]d[oa]|Acrescid[oa]|Revogad[oa]|Restaurad[oa]|Alterad[oa]|Transformad[oa]|Renumerad[oa])\s+(?:pela|pelo|na)\s+((?:Lei(?:\s+Federal)?(?:\s+Complementar)?|Decreto(?:-Lei)?|Emenda\s+Constitucional|Medida\s+Provis[óo]ria)[^)\].\n]{0,140}?(?:de\s+(\d{4}))?)(?:[)\]][\s]*)?/i;

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
      const anoCaptured = noteMatch[3];

      let ano = anoCaptured ? parseInt(anoCaptured, 10) : 0;
      if (!ano) {
        const fallbackAno = textClean.match(/\b(19\d{2}|20\d{2})\b/);
        if (fallbackAno) ano = parseInt(fallbackAno[1], 10);
      }

      const artigoFinal = artMatch ? artMatch[1].replace(/\./g, '') : currentArtNum;
      if (!artigoFinal) continue; // PULA AQUI SE NAO ACHAR

      const motivoLimpo = `${acao} pela ${leiDetalhe}`.replace(/\s+/g, ' ').trim();

      let textoNovo = textClean
        .replace(strikeText, '')
        .replace(noteMatch[0], '')
        .replace(/\s+/g, ' ')
        .trim();

      found.push({
        artigo: `Art. ${artigoFinal}`,
        motivo: motivoLimpo,
        ano: ano || currentYear
      });

      prevStrikeText = '';
    }
  }

  console.log('Total identified updates (array length):', found.length);
  console.log('Sample found:', found.slice(0, 5));
}
run().catch(console.error);
