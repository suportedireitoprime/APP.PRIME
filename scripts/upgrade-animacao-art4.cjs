const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const vm = require('vm');

const R2_CONFIG = {
  endpoint: 'https://f654819db5e99f6d7f9475abf6e3f834.r2.cloudflarestorage.com',
  accessKeyId: '199f43b3ef1e89db1506e45430cb4660',
  secretAccessKey: '6ac079b15bc8f24d9bbeacdf5bbb7ad9ead1b1caa96eafe1ba1b75d15200c6bc',
  bucket: 'estudos-juridicos-midias',
};

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
});

const SLUG = 'cp-art-4-o-tiro-de-segunda-feira';
const R2_URL = `https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/animacoes/${SLUG}/index.html`;

function applyUpgrades(html) {
  let out = html;

  // 1. Skyline distante + reflexos no asfalto + cone volumétrico em drawNightStreet
  const oldMoonAnchor = `  // prédios dos dois lados, com janelas acesas em ritmos diferentes`;
  const newSkylineBlock = `  // skyline distante em parallax (profundidade urbana)
  c.fillStyle='#10172d';
  var skyB=[{x:0,w:95,h:480},{x:88,w:110,h:540},{x:190,w:80,h:450},{x:265,w:125,h:590},{x:385,w:90,h:500},{x:470,w:115,h:560},{x:580,w:145,h:470}];
  for(var sb=0; sb<skyB.length; sb++){
    var sbi=skyB[sb];
    c.fillRect(sbi.x, 1010-sbi.h, sbi.w, sbi.h);
    if(sb%2===1){
      c.fillStyle='#10172d'; c.fillRect(sbi.x+sbi.w*0.5-2, 1010-sbi.h-24, 4, 24);
      var blink=0.35+0.65*Math.max(0,Math.sin(now*2.4+sb));
      c.fillStyle='rgba(255,70,85,'+blink.toFixed(2)+')';
      circle(c, sbi.x+sbi.w*0.5, 1010-sbi.h-26, 3.2); c.fill();
      c.fillStyle='#10172d';
    }
  }
  // prédios dos dois lados, com janelas acesas em ritmos diferentes`;
  if (!out.includes(oldMoonAnchor)) throw new Error('Anchor skyline nao encontrado');
  out = out.replace(oldMoonAnchor, newSkylineBlock);

  // Cone volumétrico do poste
  const oldPoleCone = `  c.fillStyle='rgba(255,232,150,0.13)';
  c.beginPath(); c.moveTo(128,524); c.lineTo(150,524); c.lineTo(238,1010); c.lineTo(40,1010); c.closePath(); c.fill();`;
  const newPoleCone = `  // halo quente na lâmpada + cone volumétrico suave
  var lampHalo=c.createRadialGradient(138,514,4,138,514,72);
  lampHalo.addColorStop(0,'rgba(255,244,185,0.45)');
  lampHalo.addColorStop(1,'rgba(255,232,150,0)');
  c.fillStyle=lampHalo; circle(c,138,514,72); c.fill();
  var coneGrad=c.createLinearGradient(138,524,138,1010);
  coneGrad.addColorStop(0,'rgba(255,236,160,0.28)');
  coneGrad.addColorStop(0.6,'rgba(255,232,150,0.11)');
  coneGrad.addColorStop(1,'rgba(255,232,150,0.03)');
  c.fillStyle=coneGrad;
  c.beginPath(); c.moveTo(128,524); c.lineTo(150,524); c.lineTo(256,1010); c.lineTo(24,1010); c.closePath(); c.fill();`;
  if (!out.includes(oldPoleCone)) throw new Error('Anchor poleCone nao encontrado');
  out = out.replace(oldPoleCone, newPoleCone);

  // Reflexo do poste e do neon BAR no asfalto
  const oldStreetBase = `  c.fillStyle='#333947'; c.fillRect(0,1010,W,270);
  c.fillStyle='#454b5c'; c.fillRect(0,1010,W,16);`;
  const newStreetBase = `  var roadG=c.createLinearGradient(0,1010,0,1280);
  roadG.addColorStop(0,'#2e3442'); roadG.addColorStop(1,'#1e232e');
  c.fillStyle=roadG; c.fillRect(0,1010,W,270);
  c.fillStyle='#4f5669'; c.fillRect(0,1010,W,14);
  c.fillStyle='#3b4152'; c.fillRect(0,1024,W,4);
  // reflexos suaves no asfalto (luz do poste + neon do BAR)
  var refPole=c.createRadialGradient(140,1045,8,140,1045,140);
  refPole.addColorStop(0,'rgba(255,228,140,0.16)'); refPole.addColorStop(1,'rgba(255,228,140,0)');
  c.fillStyle=refPole; c.fillRect(0,1010,300,150);
  if(neonOn){
    var refBar=c.createRadialGradient(580,1050,10,580,1050,155);
    refBar.addColorStop(0,'rgba(255,93,143,0.18)'); refBar.addColorStop(1,'rgba(255,93,143,0)');
    c.fillStyle=refBar; c.fillRect(410,1010,310,160);
  }`;
  if (!out.includes(oldStreetBase)) throw new Error('Anchor streetBase nao encontrado');
  out = out.replace(oldStreetBase, newStreetBase);

  // 2. Feixe volumétrico com partículas de poeira na cela (drawCell)
  const oldCellBeam = `  c.fillStyle='rgba(255,246,190,0.30)';
  c.beginPath(); c.moveTo(478,310); c.lineTo(628,310); c.lineTo(700,880); c.lineTo(430,880); c.closePath(); c.fill();`;
  const newCellBeam = `  var cellBeam=c.createLinearGradient(550,310,550,880);
  cellBeam.addColorStop(0,'rgba(255,246,190,0.34)');
  cellBeam.addColorStop(1,'rgba(255,246,190,0.03)');
  c.fillStyle=cellBeam;
  c.beginPath(); c.moveTo(478,310); c.lineTo(628,310); c.lineTo(700,880); c.lineTo(430,880); c.closePath(); c.fill();
  c.fillStyle='rgba(255,252,220,0.55)';
  for(var dp=0; dp<10; dp++){
    var dpx=480+((dp*43)%160)+Math.sin(now*0.7+dp)*12;
    var dpy=350+((dp*67 + now*14)%460);
    circle(c, dpx, dpy, 1.4+(dp%2)*0.8); c.fill();
  }`;
  if (!out.includes(oldCellBeam)) throw new Error('Anchor cellBeam nao encontrado');
  out = out.replace(oldCellBeam, newCellBeam);

  // 3. Upgrade em drawPerson: profundidade na perna de trás + cel-shading no tronco + contorno nos braços
  const oldLegDraw = `    // idem: contorno preto da calça por baixo, cor por cima
    c.strokeStyle=INK; c.lineWidth=22.5*s;
    c.beginPath(); c.moveTo(hx,hy); c.lineTo(kx,ky); c.lineTo(fx,fy-6*s); c.stroke();
    c.strokeStyle=o.pants; c.lineWidth=17*s;
    c.beginPath(); c.moveTo(hx,hy); c.lineTo(kx,ky); c.lineTo(fx,fy-6*s); c.stroke();
    c.fillStyle='#2c2c34';
    c.beginPath(); c.ellipse(fx+6*s,fy-3*s,14*s,6.5*s,0,0,Math.PI*2); c.fill();
    c.lineWidth=2.6*s; c.strokeStyle=INK; c.stroke();`;
  const newLegDraw = `    // contorno preto da calça por baixo, cor por cima + profundidade na perna traseira
    c.strokeStyle=INK; c.lineWidth=22.5*s;
    c.beginPath(); c.moveTo(hx,hy); c.lineTo(kx,ky); c.lineTo(fx,fy-6*s); c.stroke();
    c.strokeStyle=o.pants; c.lineWidth=17*s;
    c.beginPath(); c.moveTo(hx,hy); c.lineTo(kx,ky); c.lineTo(fx,fy-6*s); c.stroke();
    if(back){
      c.strokeStyle='rgba(0,0,0,0.22)'; c.lineWidth=17*s;
      c.beginPath(); c.moveTo(hx,hy); c.lineTo(kx,ky); c.lineTo(fx,fy-6*s); c.stroke();
    }
    c.fillStyle='#2c2c34';
    c.beginPath(); c.ellipse(fx+6*s,fy-3*s,14*s,6.5*s,0,0,Math.PI*2); c.fill();
    c.lineWidth=2.6*s; c.strokeStyle=INK; c.stroke();
    c.fillStyle='rgba(255,255,255,0.16)';
    c.beginPath(); c.ellipse(fx+5*s,fy-5*s,7*s,2*s,0,0,Math.PI*2); c.fill();`;
  if (!out.includes(oldLegDraw)) throw new Error('Anchor legDraw nao encontrado');
  out = out.replace(oldLegDraw, newLegDraw);

  // Cel-shading no tronco
  const oldTorsoDraw = `  c.fillStyle=o.shirt; rr(c,-27*s,0,54*s,(hipY-shY)+8*s,14*s); c.fill();
  c.lineWidth=3.6*s; c.strokeStyle=INK; c.stroke();`;
  const newTorsoDraw = `  c.fillStyle=o.shirt; rr(c,-27*s,0,54*s,(hipY-shY)+8*s,14*s); c.fill();
  c.save(); rr(c,-27*s,0,54*s,(hipY-shY)+8*s,14*s); c.clip();
  c.fillStyle='rgba(8,14,30,0.16)'; c.fillRect(-27*s,0,15*s,(hipY-shY)+8*s);
  c.fillStyle='rgba(255,255,255,0.12)'; c.fillRect(16*s,0,11*s,(hipY-shY)+8*s);
  c.restore();
  rr(c,-27*s,0,54*s,(hipY-shY)+8*s,14*s); c.lineWidth=3.6*s; c.strokeStyle=INK; c.stroke();`;
  if (!out.includes(oldTorsoDraw)) throw new Error('Anchor torsoDraw nao encontrado');
  out = out.replace(oldTorsoDraw, newTorsoDraw);

  // Contorno nos braços
  const oldArmDraw = `    c.strokeStyle=o.shirt; c.lineWidth=14.5*s;
    c.beginPath(); c.moveTo(sx,sy); c.lineTo(ex,ey); c.stroke();
    c.strokeStyle=o.skin; c.beginPath(); c.moveTo(ex,ey); c.lineTo(hx2,hy2); c.stroke();`;
  const newArmDraw = `    c.strokeStyle=INK; c.lineWidth=19.5*s;
    c.beginPath(); c.moveTo(sx,sy); c.lineTo(ex,ey); c.lineTo(hx2,hy2); c.stroke();
    c.strokeStyle=o.shirt; c.lineWidth=14.5*s;
    c.beginPath(); c.moveTo(sx,sy); c.lineTo(ex,ey); c.stroke();
    c.strokeStyle=o.skin; c.beginPath(); c.moveTo(ex,ey); c.lineTo(hx2,hy2); c.stroke();`;
  if (!out.includes(oldArmDraw)) throw new Error('Anchor armDraw nao encontrado');
  out = out.replace(oldArmDraw, newArmDraw);

  // 4. Vinheta cinematográfica radial em frame()
  const oldVignette = `  var vg=ctx.createLinearGradient(0,H-260,0,H);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.18)');
  ctx.fillStyle=vg; ctx.fillRect(0,H-260,W,260);`;
  const newVignette = `  var rvg=ctx.createRadialGradient(W/2,H*0.46,W*0.36,W/2,H*0.5,H*0.66);
  rvg.addColorStop(0,'rgba(0,0,0,0)'); rvg.addColorStop(1,'rgba(4,8,18,0.28)');
  ctx.fillStyle=rvg; ctx.fillRect(0,0,W,H);`;
  if (!out.includes(oldVignette)) throw new Error('Anchor vignette nao encontrado');
  out = out.replace(oldVignette, newVignette);

  return out;
}

(async () => {
  console.log('Baixando HTML atual de CP art. 4º do R2...');
  const res = await fetch(`${R2_URL}?nocache=${Date.now()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const upgraded = applyUpgrades(html);

  // Valida sintaxe do bloco <script> principal antes de subir
  const scripts = [...upgraded.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
  for (let i = 0; i < scripts.length; i++) {
    new vm.Script(scripts[i][1]);
  }
  console.log(`Sintaxe JS validada (${scripts.length} blocos <script>).`);

  const key = `animacoes/${SLUG}/index.html`;
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_CONFIG.bucket,
      Key: key,
      Body: Buffer.from(upgraded, 'utf8'),
      ContentType: 'text/html; charset=utf-8',
      CacheControl: 'public, max-age=300, must-revalidate',
    })
  );
  console.log(`Upload concluído no R2: ${key}`);
})();
