const fs = require('fs');

function pcmToWav(pcm) {
  const dataSize = pcm.length;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  
  w(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, 24000, true); // Sample rate 24000
  view.setUint32(28, 24000 * 2, true); // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  w(36, "data");
  view.setUint32(40, dataSize, true);
  
  const bytes = new Uint8Array(buf);
  bytes.set(pcm, 44);
  return Buffer.from(bytes);
}

const pcmBuf = fs.readFileSync('public/artigo_3_masculino.wav');
// The file is currently raw PCM, although it has the .wav extension.
const wavBuf = pcmToWav(new Uint8Array(pcmBuf));
fs.writeFileSync('public/artigo_3_masculino.wav', wavBuf);
console.log('Fixed header added!');
