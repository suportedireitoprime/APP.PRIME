import fs from 'fs';
import path from 'path';

const folderId = '1t0_tG_nv_15H1bQag_wk2FjWY0l26mXP'; // imagens Aula 02
const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;

async function fetchFolder() {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();
  
  const re = /id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?<div[^>]*class="[^"]*flip-entry-title[^"]*"[^>]*>([^<]+)<\/div>/g;
  let m;
  const entries = [];
  while ((m = re.exec(html)) !== null) {
    entries.push({ id: m[1], title: m[2].trim() });
  }

  console.log('Imagens Aula 02:', entries);

  // Baixar cada uma
  const imgDir2 = 'public/aulas-interativas/direito-administrativo/01-origens-e-definicoes/assets/img';
  for (const img of entries) {
    const dest = path.join(imgDir2, img.title);
    if (!fs.existsSync(dest)) {
      console.log(`Baixando ${img.title}...`);
      try {
        const u = `https://drive.google.com/uc?export=download&id=${img.id}`;
        const r = await fetch(u);
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 1000) {
          fs.writeFileSync(dest, buf);
          console.log(`Salvo ${img.title} (${buf.length} bytes)`);
        }
      } catch (err) {
        console.error(`Erro ${img.title}:`, err);
      }
    }
  }
}

fetchFolder();
