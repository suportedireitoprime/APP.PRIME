const fs = require('fs');

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function removePlanaltoAnnotationBlocks(s) {
  const PLANALTO_NOTE_BLOCK_RE = /[\(\[]\s*(?:Reda[çc][ãa]o\s+dada|Inclu[íi]d[oa]|Acrescid[oa]|Alterad[oa]|Vide|Vig[êe]ncia|Regulamento|Nova\s+reda[çc][ãa]o|Renumerad[oa]|Transformad[oa]|Restabelecid[oa]|Produ[çc][ãa]o\s+de\s+efeito)[^\)\]]{0,250}?[\)\]]/gi;
  return s.replace(PLANALTO_NOTE_BLOCK_RE, (match) => match.replace(/\n/g, ' '));
}

async function run() {
  const url = 'https://planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const bytes = new Uint8Array(await res.arrayBuffer());
  let body = new TextDecoder('windows-1252').decode(bytes);
  
  const allArts = body.match(/Art\.\s*\d+/gi);
  console.log('Total Artigos brutos:', allArts ? allArts.length : 0);

  body = body
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<(?:s|strike|del)\b[^>]*>[\s\S]*?<\/(?:s|strike|del)>/gi, ' ')
    .replace(/<([a-z]+)\b[^>]*style\s*=\s*["'][^"']*text-decoration\s*:\s*[^"']*line-through[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi, ' ');

  const bm = body.match(/<body[^>]*>([\s\S]+)/i);
  if (bm) body = bm[1];

  body = body.replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, (_, inner) => {
    const t = inner.replace(/<[^>]+>/g, '').trim().toLowerCase();
    if (t === '' || t === 'o' || t === 'a' || t === 'º' || t === '°' || t === 'ª') return 'º';
    return inner;
  });

  body = body.replace(/<a\b[^>]*>\s*\(\s*Vig[êe]ncia\s*\)\s*<\/a>/gi, ' (Vigência) ');

  body = body
    .replace(/<blockquote[^>]*>/gi, '\n\n')
    .replace(/<\/blockquote>/gi, '\n\n')
    .replace(/<p\b[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div\b[^>]*>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<[^>]+>/g, '');
    
  body = decodeHtmlEntities(body).replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ');
  body = removePlanaltoAnnotationBlocks(body);

  const linhasBrutas = body
    .split(/\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);

  const linhas = [];
  for (let k = 0; k < linhasBrutas.length; k++) {
    const atual = linhasBrutas[k];
    const proxima = linhasBrutas[k + 1];
    if (/^Art\.?$/.test(atual) && proxima && /^\d/.test(proxima)) {
      linhas.push('Art. ' + proxima);
      k += 1;
      continue;
    }
    linhas.push(atual);
  }

  const ART_RE = /^Art\.\s*(\d+(?:\.\d+)*(?:-[A-Z0-9]+)?)/;
  let matches = 0;
  for (const l of linhas) {
     if (ART_RE.test(l)) {
        matches++;
     }
  }
  
  console.log('Total Artigos identificados após limpeza (ART_RE):', matches);
  
  const HIER_RE = /^(PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)(?:\s+(?:[IVXLCDM]+|[ÚU]NICO|[ÚU]NICA|PRELIMINAR|GERAL|ESPECIAL|PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA|SEXTA|S[ÉE]TIMA|OITAVA|NONA|D[ÉE]CIMA|\d+[ºª°]?)\b[\s\S]{0,100}?|\s*)$/i;

  const startIdx = linhas.findIndex((l) => HIER_RE.test(l) || ART_RE.test(l));
  const uteis = startIdx > 0 ? linhas.slice(startIdx) : linhas;

  let endIdx = -1;
  for (let k = uteis.length - 1; k >= 0; k--) {
    if (/Este texto não substitui/i.test(uteis[k])) { endIdx = k; break; }
  }
  const finais = endIdx > 0 ? uteis.slice(0, endIdx) : uteis;

  let finaisMatches = 0;
  for (const l of finais) {
     if (ART_RE.test(l)) finaisMatches++;
  }
  
  console.log('Total Artigos no array finais:', finaisMatches);
  
  if (finaisMatches < matches) {
      console.log('Foi cortado antes do tempo!');
      console.log('Linhas perto do corte:');
      console.log(uteis.slice(endIdx - 5, endIdx + 5).join('\n'));
  }
}

run().catch(console.error);
