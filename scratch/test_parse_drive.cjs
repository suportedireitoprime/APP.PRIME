const fs = require('fs');

function parseAulaHtml(html, aulaId, disciplinaId) {
  let imagens = {};
  const imgMatch = html.match(/var\s+IMG\s*=\s*(\{[\s\S]*?\});/);
  if (imgMatch) {
    try {
      imagens = (new Function(`return ${imgMatch[1]}`))();
    } catch (e) {
      console.warn('Erro ao avaliar IMG:', e);
    }
  }

  let audioBaseUrl = '';
  const audioMatch = html.match(/function\s+audioSrc\s*\(\s*i\s*\)\s*\{\s*return\s*["']([^"']+)["']/);
  if (audioMatch) {
    audioBaseUrl = audioMatch[1];
  }

  let slides = [];
  const startMarker = 'var SLIDES = [';
  const startIdx = html.indexOf(startMarker);
  if (startIdx !== -1) {
    const fromStart = html.substring(startIdx + 'var SLIDES = '.length);
    const endMatch = fromStart.match(/\];\s*(?:\/\*[\s\S]*?\*\/|\s)*(?:var|const|let|\n)/);
    if (endMatch) {
      let slidesCode = fromStart.substring(0, endMatch.index + 1);
      slidesCode = slidesCode.replace(/src="([^"]+)"/g, 'src=\\"$1\\"');
      try {
        slides = (new Function(`return ${slidesCode}`))();
      } catch (e) {
        console.warn('Erro ao avaliar SLIDES via Function:', e);
      }
    }
  }

  return {
    aulaId,
    titulo: slides[0]?.titulo || 'Aula Interativa',
    disciplinaId,
    totalEtapas: slides.length,
    slides,
    imagens,
    audioBaseUrl
  };
}

async function test() {
  const fileId = '1qEz6r1AfPgWqCOSQv20mk4F4D0Gg02U_';
  const url = 'https://drive.usercontent.google.com/download?id=' + fileId + '&export=download&authuser=0';
  const res = await fetch(url);
  const text = await res.text();
  console.log('Tamanho HTML:', text.length);
  const parsed = parseAulaHtml(text, 'penal-06-01', 'penal');
  console.log('Titulo:', parsed.titulo);
  console.log('Total de Etapas parsed:', parsed.totalEtapas);
  console.log('Total de Imagens no map:', Object.keys(parsed.imagens).length);
  console.log('Imagens sample:', Object.entries(parsed.imagens).slice(0, 3));
  console.log('audioBaseUrl:', parsed.audioBaseUrl);
  if (parsed.slides[0]) {
    console.log('Slide 0:', parsed.slides[0].titulo, parsed.slides[0].tipo);
  }
  if (parsed.slides[parsed.totalEtapas - 1]) {
    console.log('Último Slide:', parsed.slides[parsed.totalEtapas - 1].titulo);
  }
}
test();
