const fs = require('fs');
const https = require('https');
const path = require('path');

const publicDir = path.join(__dirname, 'public', 'laboratorio');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Download a default avatar from Ready Player Me
const avatarUrl = 'https://models.readyplayer.me/64bfa15f0e72c63d7c393481.glb?morphTargets=ARKit,Oculus Visemes'; 
const avatarDest = path.join(publicDir, 'avatar.glb');

// We will generate a quick test audio using Google Translate TTS (free, no auth)
// Text: "Olá, eu sou um avatar de teste. Estou no laboratório para testar a sincronização labial."
const text = encodeURIComponent("Olá, eu sou um avatar de teste. Estou no laboratório para testar a sincronização labial. Qual dessas opções será a melhor?");
const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${text}&tl=pt-BR&client=tw-ob`;
const audioDest = path.join(publicDir, 'teste-lipsync.mp3');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function main() {
  console.log('Baixando avatar...');
  await download(avatarUrl, avatarDest);
  console.log('Avatar baixado.');
  
  console.log('Baixando áudio...');
  await download(audioUrl, audioDest);
  console.log('Áudio baixado.');
}

main().catch(console.error);
