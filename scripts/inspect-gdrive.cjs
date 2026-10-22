const fs = require('fs');

async function main() {
  const url = 'https://drive.google.com/drive/folders/1z2qIusic5U6ZV9No15xU6HMaA3YqVVEU';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const html = await res.text();
  fs.writeFileSync('scripts/gdrive.html', html, 'utf8');
  console.log('HTML saved, length:', html.length);
}

main().catch(console.error);
