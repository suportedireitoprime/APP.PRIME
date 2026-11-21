import { CHARS, CharacterConfig } from './personagensData';
import { clamp, visemeFor } from '../narracao/narracaoData';

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, a: number = 0.28) {
  ctx.save();
  ctx.fillStyle = `rgba(20,16,8,${a})`;
  ctx.beginPath();
  ctx.ellipse(x, y, w, w * 0.22, 0, 0, 6.29);
  ctx.fill();
  ctx.restore();
}

export function drawMouth(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, vis: string, open: number) {
  ctx.save();
  ctx.translate(x, y);
  if (vis === 'A') {
    ctx.strokeStyle = '#5e2f23';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();
  } else if (vis === 'F') {
    ctx.fillStyle = '#fff';
    rr(ctx, -w / 2, -3.4, w, 6.8, 2.5);
    ctx.fill();
    ctx.strokeStyle = '#5e2f23';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();
  } else if (vis === 'E') {
    ctx.fillStyle = '#571f1c';
    ctx.beginPath();
    ctx.ellipse(0, 1.5, w * 0.26, 4.6 * open + 1.6, 0, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#c96a5e';
    ctx.beginPath();
    ctx.ellipse(0, 3.6, w * 0.15, 1.7, 0, 0, 6.29);
    ctx.fill();
  } else if (vis === 'B') {
    ctx.fillStyle = '#571f1c';
    ctx.beginPath();
    ctx.ellipse(0, 1, w * 0.4, 2.6 * open + 1, 0, 0, 6.29);
    ctx.fill();
  } else if (vis === 'D') {
    ctx.fillStyle = '#571f1c';
    ctx.beginPath();
    ctx.ellipse(0, 2, w * 0.46, 6.4 * open + 1.4, 0, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-w * 0.34, -2.5, w * 0.68, 3.4);
    ctx.fillStyle = '#d97b6e';
    ctx.beginPath();
    ctx.ellipse(0, 5.4, w * 0.26, 2.4, 0, 0, 6.29);
    ctx.fill();
  } else {
    ctx.fillStyle = '#571f1c';
    ctx.beginPath();
    ctx.ellipse(0, 1.4, w * 0.42, 4.2 * open + 1, 0, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-w * 0.3, -1.6, w * 0.6, 2.6);
  }
  ctx.restore();
}

export function drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, skin: string, ang: number = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, 0, 6.4, 0, 6.29);
  ctx.fill();

  ctx.strokeStyle = skin;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-4.5 + i * 3, 3);
    ctx.lineTo(-5.5 + i * 3.2, 10);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(5.5, -1);
  ctx.lineTo(10, 2.5);
  ctx.stroke();
  ctx.restore();
}

export interface PersonRenderOptions {
  scale?: number;
  walk?: number;
  phase?: number;
  facing?: number;
  pose?: 'neutro' | 'up' | 'point' | 'bag' | 'talk' | 'screen' | 'cesta' | 'cart';
  expr?: 'neutro' | 'medo' | 'surpresa' | 'serio' | 'tenso' | 'feliz';
  look?: [number, number];
  bagSwing?: number;
  bagFull?: boolean;
  tag?: boolean;
  speaking?: boolean;
  viseme?: string;
}

export function drawPerson(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  groundY: number,
  o: PersonRenderOptions = {},
  nowT: number = 0,
  heads: Record<string, { x: number; y: number }> = {}
) {
  const c = CHARS[id];
  if (!c) return;

  const s = (c.h / 1.75) * (o.scale || 1);
  const t = nowT;
  const walk = o.walk || 0;
  const phase = o.phase || 0;
  const facing = o.facing || 1;
  const breathe = 1 + Math.sin(t * 1.7 + x) * 0.008;
  const hipY = groundY - 86 * s;
  const shY = hipY - 56 * s * breathe;
  const headY = shY - 34 * s;

  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(facing, 1);

  // Sombras das pernas
  for (let leg = 0; leg < 2; leg++) {
    const sd = leg ? 1 : -1;
    const phS = phase + leg * Math.PI;
    const fxS = walk ? Math.sin(phS) * 26 * s : sd * 29 * s;
    const liftS = walk ? Math.max(0, Math.cos(phS)) * 11 * s : 0;
    ctx.fillStyle = 'rgba(20,16,8,.30)';
    ctx.beginPath();
    ctx.ellipse(fxS, groundY + 5 - liftS * 0.3, 13 * s, 5 * s, 0, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,16,8,.13)';
    ctx.beginPath();
    ctx.ellipse(fxS + 14 * s, groundY + 7, 20 * s, 5 * s, -0.06, 0, 6.29);
    ctx.fill();
  }

  // Pernas
  for (let leg = 0; leg < 2; leg++) {
    const sd = leg ? 1 : -1;
    const ph = phase + leg * Math.PI;
    const sw = walk ? Math.sin(ph) : 0;
    const lift = walk ? Math.max(0, Math.cos(ph)) * 11 * s : 0;
    const footX = walk ? sw * 26 * s : sd * 29 * s;
    const footY = groundY - lift;
    const kneeX = walk ? footX * 0.45 + (Math.max(0, Math.sin(ph)) * 0.5 + 0.18) * 20 * s : sd * 20 * s;
    const kneeY = (hipY + footY) / 2 + 3 * s;
    const hipX = (walk ? sd * 5 : sd * 11) * s;

    ctx.strokeStyle = c.leg || c.bottom;
    ctx.lineWidth = 12.5 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hipX, hipY);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY - 3 * s);
    ctx.stroke();

    // Sapatos
    ctx.fillStyle = '#241d16';
    ctx.beginPath();
    ctx.ellipse(footX + 4 * s, footY - 1, 9.5 * s, 4.2 * s, 0, 0, 6.29);
    ctx.fill();
    ctx.fillRect(footX - 5.5 * s, footY + 2.2 * s, 19 * s, 2.6 * s);
  }

  // Pescoço
  ctx.fillStyle = c.skin;
  ctx.fillRect(-4.6 * s, shY - 17 * s, 9.2 * s, 20 * s);
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  ctx.fillRect(-4.6 * s, shY - 6 * s, 9.2 * s, 4 * s);

  // Tronco
  ctx.fillStyle = c.top;
  ctx.beginPath();
  ctx.moveTo(-17 * s, shY + 8 * s);
  ctx.quadraticCurveTo(0, shY - 6 * s, 17 * s, shY + 8 * s);
  ctx.lineTo(14.5 * s, hipY + 6 * s);
  ctx.lineTo(-14.5 * s, hipY + 6 * s);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,.14)';
  ctx.fillRect(-15 * s, shY + 16 * s, 5 * s, 34 * s);
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  ctx.fillRect(10 * s, shY + 14 * s, 5 * s, 36 * s);

  if (c.skirt) {
    ctx.fillStyle = c.top;
    ctx.beginPath();
    ctx.moveTo(-15 * s, hipY);
    ctx.lineTo(15 * s, hipY);
    ctx.lineTo(21 * s, hipY + (c.skirtLen || 24) * s + Math.sin(t * 2 + x) * 1.4);
    ctx.lineTo(-21 * s, hipY + (c.skirtLen || 24) * s);
    ctx.closePath();
    ctx.fill();
  }

  if (c.uniform) {
    ctx.fillStyle = '#f5d97e';
    ctx.fillRect(-13 * s, shY + 30 * s, 26 * s, 4.5 * s);
    ctx.fillStyle = '#8a6f45';
    ctx.fillRect(-3.4 * s, shY + 28.6 * s, 6.8 * s, 7.4 * s);
    if (c.badge) {
      ctx.fillStyle = '#f5d97e';
      ctx.beginPath();
      ctx.arc(10 * s, shY + 16 * s, 3.6 * s, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = '#20262f';
      ctx.fillRect(11 * s, shY + 34 * s, 6 * s, 9 * s);
    }
  }

  // Braços
  const pose = o.pose || 'neutro';
  for (const sd of [-1, 1]) {
    const shx = sd * 16 * s;
    const shy = shY + 10 * s;
    let hx: number;
    let hy: number;

    const swing = walk ? Math.sin(phase + (sd > 0 ? Math.PI : 0)) * 15 * s : Math.sin(t * 1.7 + sd) * 1.6 * s;
    if (pose === 'up') {
      hx = sd * 30 * s;
      hy = shY - 38 * s;
    } else if (pose === 'point' && sd > 0) {
      hx = 44 * s;
      hy = shY + 16 * s;
    } else if (pose === 'bag' && sd > 0) {
      hx = 24 * s;
      hy = hipY + 16 * s;
    } else if (pose === 'talk') {
      hx = sd * 26 * s;
      hy = shY + 34 * s + Math.sin(t * 5.2 + sd * 2) * 4.5 * s;
    } else if (pose === 'screen' && sd > 0) {
      hx = 40 * s;
      hy = shY + 2 * s;
    } else if (pose === 'cesta' && sd > 0) {
      hx = 34 * s;
      hy = hipY + 2 * s;
    } else if (pose === 'cart' && sd > 0) {
      hx = 38 * s;
      hy = hipY - 6 * s;
    } else {
      hx = sd * 20 * s + swing * 0.4;
      hy = hipY + 8 * s - Math.abs(swing) * 0.3;
    }

    const ex = (shx + hx) / 2 + sd * 5 * s;
    const ey = (shy + hy) / 2 + 4 * s;
    ctx.strokeStyle = c.top;
    ctx.lineWidth = 9 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shx, shy);
    ctx.lineTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    drawHand(ctx, hx, hy, c.skin, sd * 0.3);
  }

  // Bolsa da Amanda
  if (id === 'amanda') {
    ctx.save();
    ctx.translate(24 * s, hipY + 8 * s);
    ctx.rotate(Math.sin(t * 2.1) * 0.05 + (o.bagSwing || 0));
    ctx.fillStyle = '#6e4525';
    rr(ctx, -7, -2, 30, 26, 5);
    ctx.fill();
    ctx.strokeStyle = '#54341b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(8, -3, 9, Math.PI, 0);
    ctx.stroke();
    if (o.bagFull) {
      ctx.fillStyle = '#c94f42';
      ctx.fillRect(0, -9, 13, 8);
      ctx.fillStyle = '#e0a51f';
      ctx.fillRect(12, -7, 10, 6);
    }
    ctx.restore();
  }

  // Cabeça
  const hy2 = headY;
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.ellipse(0, hy2, 16.5 * s, 19 * s, 0, 0, 6.29);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,.10)';
  ctx.beginPath();
  ctx.ellipse(6 * s, hy2 + 8 * s, 10 * s, 10 * s, 0, 0, 6.29);
  ctx.fill();

  // Cabelo
  ctx.fillStyle = c.hair;
  if (c.hairStyle === 'cacheado') {
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc((-13 + i * 4.4) * s, hy2 - 13 * s, 5.6 * s, 0, 6.29);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(-16 * s, hy2 - 2 * s, 5 * s, 0, 6.29);
    ctx.arc(16 * s, hy2 - 2 * s, 5 * s, 0, 6.29);
    ctx.fill();
  } else if (c.hairStyle === 'rabo') {
    ctx.beginPath();
    ctx.ellipse(0, hy2 - 14 * s, 16.5 * s, 9 * s, 0, Math.PI, 6.29);
    ctx.fill();
    const sw2 = Math.sin(t * 2.4) * 3 * s;
    ctx.beginPath();
    ctx.ellipse(-15 * s + sw2, hy2 + 2 * s, 5.4 * s, 15 * s, 0.25, 0, 6.29);
    ctx.fill();
  } else if (c.hairStyle === 'coque') {
    ctx.beginPath();
    ctx.ellipse(0, hy2 - 14 * s, 16.5 * s, 9 * s, 0, Math.PI, 6.29);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, hy2 - 22 * s, 6.4 * s, 0, 6.29);
    ctx.fill();
  } else if (c.hairStyle === 'black') {
    ctx.beginPath();
    ctx.ellipse(0, hy2 - 12 * s, 17.5 * s, 11 * s, 0, Math.PI, 6.29);
    ctx.fill();
  } else if (c.hairStyle === 'curto') {
    ctx.beginPath();
    ctx.ellipse(0, hy2 - 13.5 * s, 16.5 * s, 8.6 * s, 0, Math.PI, 6.29);
    ctx.fill();
  }

  if (c.cap) {
    ctx.fillStyle = c.cap;
    ctx.beginPath();
    ctx.ellipse(0, hy2 - 14.5 * s, 17 * s, 7.5 * s, 0, Math.PI, 6.29);
    ctx.fill();
    ctx.fillRect(2, hy2 - 15.5 * s, 24 * s, 3.6 * s);
  }

  if (c.headset) {
    ctx.strokeStyle = '#20262f';
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    ctx.arc(0, hy2 - 3 * s, 17.5 * s, 3.4, 5.9);
    ctx.stroke();
    ctx.fillStyle = '#20262f';
    ctx.fillRect(14 * s, hy2 - 2 * s, 4 * s, 7 * s);
    ctx.beginPath();
    ctx.moveTo(16 * s, hy2 + 5 * s);
    ctx.lineTo(8 * s, hy2 + 11 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(7 * s, hy2 + 11.5 * s, 2.2 * s, 0, 6.29);
    ctx.fill();
  }

  // Olhos e Expressão
  const expr = o.expr || 'neutro';
  const blink = Math.sin(t * 0.9 + x * 1.7) > 0.985 ? 0.12 : 1;
  const eyeOpen = expr === 'medo' || expr === 'surpresa' ? 1.25 : expr === 'serio' ? 0.85 : 1;

  for (const sd of [-1, 1]) {
    const ex = sd * 6.4 * s;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(ex, hy2 - 1 * s, 3.6 * s, 3.9 * s * eyeOpen * blink, 0, 0, 6.29);
    ctx.fill();

    const look = o.look || [0, 0];
    ctx.fillStyle = '#2b1c10';
    ctx.beginPath();
    ctx.arc(ex + look[0] * 1.6 * s, hy2 - 1 * s + look[1] * 1.2 * s, 1.9 * s, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex + look[0] * 1.6 * s + 0.6 * s, hy2 - 1.8 * s, 0.7 * s, 0, 6.29);
    ctx.fill();
  }

  // Sobrancelhas
  ctx.strokeStyle = '#3a2413';
  ctx.lineWidth = 2 * s;
  ctx.lineCap = 'round';
  const browY = hy2 - 8.6 * s;
  const browTilt = expr === 'medo' || expr === 'surpresa' ? -2.2 : expr === 'serio' || expr === 'tenso' ? 1.8 : 0;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 6.4 * s - 4.4 * s, browY + (sd > 0 ? browTilt : -browTilt) * s * 0.4);
    ctx.lineTo(sd * 6.4 * s + 4.4 * s, browY - (sd > 0 ? browTilt : -browTilt) * s * 0.4);
    ctx.stroke();
  }

  // Nariz
  ctx.strokeStyle = 'rgba(120,70,40,.5)';
  ctx.lineWidth = 1.4 * s;
  ctx.beginPath();
  ctx.moveTo(0, hy2 + 1 * s);
  ctx.lineTo(-1.4 * s, hy2 + 5.4 * s);
  ctx.stroke();

  if (c.blush) {
    ctx.fillStyle = 'rgba(230,120,110,.4)';
    ctx.beginPath();
    ctx.ellipse(-10.5 * s, hy2 + 6 * s, 3.6 * s, 2.2 * s, 0, 0, 6.29);
    ctx.ellipse(10.5 * s, hy2 + 6 * s, 3.6 * s, 2.2 * s, 0, 0, 6.29);
    ctx.fill();
  }

  if (c.lip) {
    ctx.fillStyle = c.lip;
    ctx.beginPath();
    ctx.ellipse(0, hy2 + 10.6 * s, 5.6 * s, 2.1 * s, 0, 0, 6.29);
    ctx.fill();
  }

  // Boca animada
  const spk = o.speaking;
  const vis = spk ? o.viseme || 'C' : 'X';
  const open = spk ? 0.55 + 0.45 * Math.abs(Math.sin(t * 11 + x)) : expr === 'medo' || expr === 'surpresa' ? 0.8 : 0.18;
  if (!c.lip || spk) {
    drawMouth(ctx, 0, hy2 + 10.6 * s, 11.5 * s, spk ? vis : expr === 'feliz' ? 'B' : 'X', open);
  }
  if (expr === 'feliz' && !spk) {
    ctx.strokeStyle = '#5e2f23';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(0, hy2 + 8.4 * s, 6 * s, 0.25, 2.9);
    ctx.stroke();
  }

  if (c.earring) {
    ctx.fillStyle = '#f5d97e';
    ctx.beginPath();
    ctx.arc(-16 * s, hy2 + 4 * s, 2 * s, 0, 6.29);
    ctx.arc(16 * s, hy2 + 4 * s, 2 * s, 0, 6.29);
    ctx.fill();
  }

  if (expr === 'medo' || expr === 'tenso') {
    ctx.fillStyle = 'rgba(160,210,255,.9)';
    ctx.beginPath();
    ctx.ellipse(15.5 * s, hy2 + 2 * s + ((t * 22) % 7), 1.7 * s, 2.8 * s, 0, 0, 6.29);
    ctx.fill();
  }

  ctx.restore();
  heads[id] = { x, y: headY };

  if (o.tag) {
    ctx.save();
    ctx.font = 'bold 15px sans-serif';
    const label = c.name + ' — ' + c.role;
    const tw = ctx.measureText(label).width + 20;
    const tx = clamp(x, tw / 2 + 8, 720 - tw / 2 - 8);

    ctx.translate(tx, headY - 52 * s);
    ctx.fillStyle = '#fffdf6';
    rr(ctx, -tw / 2, -17, tw, 27, 8);
    ctx.fill();
    ctx.strokeStyle = '#1b2a4a';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#1b2a4a';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 2);

    ctx.strokeStyle = '#1b2a4a';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, 11);
    ctx.lineTo(x - tx, 26 * s);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

export function drawBigFace(
  ctx: CanvasRenderingContext2D,
  id: string,
  cx: number,
  cy: number,
  R: number,
  expr: string,
  nowT: number = 0,
  curAudio: { charId: string | null; text: string; startedAt: number; dur: number } | null = null,
  heads: Record<string, { x: number; y: number }> = {}
) {
  const c = CHARS[id];
  if (!c) return;
  const t = nowT;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = c.skin;
  ctx.beginPath();
  ctx.ellipse(0, 0, R, R * 1.12, 0, 0, 6.29);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,.25)';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = 'rgba(0,0,0,.08)';
  ctx.beginPath();
  ctx.ellipse(R * 0.3, R * 0.34, R * 0.55, R * 0.5, 0, 0, 6.29);
  ctx.fill();

  ctx.fillStyle = c.hair;
  if (c.hairStyle === 'cacheado') {
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(-R * 0.78 + i * R * 0.22, -R * 0.72, R * 0.3, 0, 6.29);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(-R * 0.95, -R * 0.1, R * 0.26, 0, 6.29);
    ctx.arc(R * 0.95, -R * 0.1, R * 0.26, 0, 6.29);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, -R * 0.78, R, R * 0.42, 0, Math.PI, 6.29);
    ctx.fill();
  }

  if (c.cap) {
    ctx.fillStyle = c.cap;
    ctx.beginPath();
    ctx.ellipse(0, -R * 0.82, R * 1.02, R * 0.4, 0, Math.PI, 6.29);
    ctx.fill();
    ctx.fillRect(R * 0.1, -R * 0.88, R * 1.25, R * 0.16);
  }

  const lookX = Math.sin(t * 1.4) * R * 0.05;
  const lookY = expr === 'medo' ? -R * 0.02 : R * 0.02;
  const eOpen = expr === 'medo' || expr === 'surpresa' ? 1.3 : 1;

  for (const sd of [-1, 1]) {
    const ex = sd * R * 0.36;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(ex, -R * 0.05, R * 0.19, R * 0.2 * eOpen, 0, 0, 6.29);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#2b1c10';
    ctx.beginPath();
    ctx.arc(ex + lookX, -R * 0.05 + lookY, R * 0.09, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex + lookX + R * 0.03, -R * 0.1, R * 0.032, 0, 6.29);
    ctx.fill();
  }

  ctx.strokeStyle = '#3a2413';
  ctx.lineWidth = R * 0.07;
  ctx.lineCap = 'round';
  const bt = expr === 'medo' || expr === 'surpresa' ? -R * 0.1 : R * 0.05;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * R * 0.36 - R * 0.2, -R * 0.42 + (sd > 0 ? bt : -bt) * 0.5);
    ctx.lineTo(sd * R * 0.36 + R * 0.2, -R * 0.42 - (sd > 0 ? bt : -bt) * 0.5);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(120,70,40,.5)';
  ctx.lineWidth = R * 0.045;
  ctx.beginPath();
  ctx.moveTo(0, R * 0.02);
  ctx.lineTo(-R * 0.06, R * 0.22);
  ctx.stroke();

  if (c.blush) {
    ctx.fillStyle = 'rgba(230,120,110,.45)';
    ctx.beginPath();
    ctx.ellipse(-R * 0.58, R * 0.24, R * 0.18, R * 0.1, 0, 0, 6.29);
    ctx.ellipse(R * 0.58, R * 0.24, R * 0.18, R * 0.1, 0, 0, 6.29);
    ctx.fill();
  }

  if (expr === 'medo' || expr === 'tenso') {
    ctx.fillStyle = 'rgba(160,210,255,.95)';
    for (let i = 0; i < 3; i++) {
      const dy = (t * 90 + i * 46) % (R * 0.9);
      ctx.beginPath();
      ctx.ellipse(R * 0.88, -R * 0.3 + dy, R * 0.05, R * 0.085, 0, 0, 6.29);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-R * 0.9, -R * 0.2 + ((t * 70 + i * 52) % (R * 0.8)), R * 0.045, R * 0.075, 0, 0, 6.29);
      ctx.fill();
    }
  }

  const spk = curAudio && curAudio.charId === id;
  if (spk) {
    const prog = clamp((performance.now() - curAudio.startedAt) / (curAudio.dur * 1000), 0, 1);
    const vis = visemeFor(curAudio.text[Math.floor(prog * curAudio.text.length)]);
    drawMouth(ctx, 0, R * 0.48, R * 0.5, vis, 0.8);
  } else if (expr === 'surpresa' || expr === 'medo') {
    ctx.fillStyle = '#571f1c';
    ctx.beginPath();
    ctx.ellipse(0, R * 0.5, R * 0.13, R * 0.17, 0, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#d97b6e';
    ctx.beginPath();
    ctx.ellipse(0, R * 0.58, R * 0.07, R * 0.06, 0, 0, 6.29);
    ctx.fill();
  } else if (expr === 'feliz') {
    ctx.strokeStyle = '#5e2f23';
    ctx.lineWidth = R * 0.06;
    ctx.beginPath();
    ctx.arc(0, R * 0.34, R * 0.3, 0.3, 2.84);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#5e2f23';
    ctx.lineWidth = R * 0.055;
    ctx.beginPath();
    ctx.moveTo(-R * 0.16, R * 0.5);
    ctx.quadraticCurveTo(0, R * 0.44, R * 0.16, R * 0.5);
    ctx.stroke();
  }

  if (c.earring) {
    ctx.fillStyle = '#f5d97e';
    ctx.beginPath();
    ctx.arc(-R * 0.97, R * 0.22, R * 0.06, 0, 6.29);
    ctx.arc(R * 0.97, R * 0.22, R * 0.06, 0, 6.29);
    ctx.fill();
  }

  ctx.restore();
  heads[id] = { x: cx, y: cy - R };
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function easeOutBack(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

export function drawBalloon(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, prog: number) {
  if (prog <= 0) return;
  const shown = text.slice(0, Math.max(1, Math.floor(text.length * prog)));
  ctx.save();
  ctx.font = '600 38px sans-serif';
  const lines = wrapText(ctx, shown, 540);
  const lh = 50;
  let mw = 0;
  for (const ln of lines) mw = Math.max(mw, ctx.measureText(ln).width);
  const bw = clamp(mw + 48, 180, 640);
  const bh = 30 + lines.length * lh;
  const bx = clamp(x - bw / 2, 10, 720 - bw - 10);
  const by = clamp(y - bh - 54, 64, 960 - bh - 190);

  ctx.globalAlpha = clamp(prog * 1.6, 0, 1);
  const sc = easeOutBack(clamp(prog * 1.4, 0, 1));
  ctx.translate(bx + bw / 2, by + bh);
  ctx.scale(sc, sc);
  ctx.translate(-bw / 2, -bh);

  ctx.fillStyle = 'rgba(10,14,22,.28)';
  rr(ctx, 5, 7, bw, bh, 18);
  ctx.fill();
  ctx.fillStyle = '#fffdf6';
  rr(ctx, 0, 0, bw, bh, 18);
  ctx.fill();
  ctx.strokeStyle = '#1b2a4a';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#fffdf6';
  ctx.beginPath();
  const txp = clamp(x - bx, 36, bw - 36);
  ctx.moveTo(txp - 13, bh - 1);
  ctx.lineTo(txp + 13, bh - 1);
  ctx.lineTo(clamp(x - bx, 12, bw - 12), bh + 44);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#1b2a4a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(txp - 13, bh - 1);
  ctx.lineTo(clamp(x - bx, 12, bw - 12), bh + 44);
  ctx.lineTo(txp + 13, bh - 1);
  ctx.stroke();

  ctx.fillStyle = '#1d2433';
  ctx.textAlign = 'left';
  lines.forEach((ln, i) => ctx.fillText(ln, 24, 48 + i * lh));
  ctx.restore();
}
