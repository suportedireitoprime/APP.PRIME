import { rr, shadow, drawPerson, drawBigFace, drawHand, PersonRenderOptions } from '../personagens/personagensRenderer';
import { CHARS } from '../personagens/personagensData';
import { clamp, lerp } from '../narracao/narracaoData';

const W = 720;
const H = 960;
const FEET = 748;

export function sign(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, text: string, bg: string, fg: string, fs: number = 19) {
  ctx.save();
  shadow(ctx, x + w / 2, y + 36, w * 0.4, 0.12);
  ctx.fillStyle = bg;
  rr(ctx, x, y, w, 38, 7);
  ctx.fill();
  ctx.strokeStyle = '#191203';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.font = 'bold ' + fs + 'px Georgia,serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + 26);
  ctx.restore();
}

export function baseStore(ctx: CanvasRenderingContext2D, floorY: number, nowT: number = 0) {
  const g = ctx.createLinearGradient(0, 0, 0, floorY);
  g.addColorStop(0, '#efe0bd');
  g.addColorStop(1, '#f6ead0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, floorY);

  ctx.fillStyle = '#c2a06b';
  ctx.fillRect(0, floorY, W, H - floorY);
  ctx.fillStyle = '#b28c55';
  ctx.fillRect(0, floorY, W, 8);

  ctx.strokeStyle = 'rgba(110,82,40,.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(60 + i * 120, floorY + 16);
    ctx.lineTo(30 + i * 130, H);
    ctx.stroke();
  }
  for (const fy of [0.25, 0.5, 0.78]) {
    const yy = floorY + (H - floorY) * fy;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.lineTo(W, yy);
    ctx.stroke();
  }

  // Lâmpadas no teto
  ctx.fillStyle = '#8a6f45';
  for (let i = 0; i < 4; i++) ctx.fillRect(30 + i * 180, 26, 130, 11);
  ctx.fillStyle = 'rgba(255,246,200,.95)';
  for (let i = 0; i < 4; i++) {
    rr(ctx, 48 + i * 180, 44, 94, 12, 6);
    ctx.fill();
  }

  // Fachos de luz
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = '#fff2b0';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(80 + i * 240, 60);
    ctx.lineTo(150 + i * 240, 60);
    ctx.lineTo(210 + i * 240, 900);
    ctx.lineTo(10 + i * 240, 900);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function shelf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  ctx.save();
  shadow(ctx, x + w / 2, y + h + 6, w * 0.5, 0.16);
  ctx.fillStyle = '#8a4b2a';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#a05a33';
  ctx.fillRect(x, y, w, 14);
  ctx.strokeStyle = '#5e3018';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  const cols = ['#c94f42', '#e0a51f', '#3e7d4e', '#2e5f8a', '#e8e3d5', '#7a4a8c', '#d97b2f', '#4a9e8f'];
  const rows = 3;
  const rh = h / rows;

  for (let s = 0; s < rows; s++) {
    const sy = y + 16 + s * rh;
    ctx.fillStyle = '#6e3a20';
    ctx.fillRect(x + 6, sy + rh - 16, w - 12, 9);
    const n = Math.max(2, Math.floor(w / 40));
    for (let i = 0; i < n; i++) {
      const px = x + 12 + i * ((w - 24) / n);
      const c = cols[(seed + i + s * 3) % cols.length];
      const ph = rh - 46 - ((seed * 7 + i * 13 + s * 5) % 14);
      ctx.fillStyle = c;
      rr(ctx, px, sy + rh - 16 - ph, (w - 24) / n - 8, ph, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.fillRect(px + 3, sy + rh - 16 - ph + 4, (w - 24) / n - 14, 8);
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(px - 1, sy + rh - 12, (w - 24) / n - 4, 11);
      ctx.fillStyle = '#7a2c1c';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('R$' + (3 + ((seed + i + s) % 9)) + ',99', px + ((w - 24) / n - 8) / 2, sy + rh - 3);
    }
  }
  ctx.restore();
}

export function camIcon(ctx: CanvasRenderingContext2D, x: number, y: number, s: number = 1, nowT: number = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = '#39424f';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(0, -12);
  ctx.stroke();

  ctx.fillStyle = '#20262f';
  rr(ctx, -24, -12, 48, 20, 6);
  ctx.fill();
  ctx.fillStyle = '#39424f';
  ctx.beginPath();
  ctx.arc(15, 0, 6.5, 0, 6.29);
  ctx.fill();
  ctx.fillStyle = '#9fd8ff';
  ctx.beginPath();
  ctx.arc(15, 0, 3.2, 0, 6.29);
  ctx.fill();

  ctx.fillStyle = Math.sin(nowT * 3.2) > 0 ? '#ff3b30' : '#7a1610';
  ctx.beginPath();
  ctx.arc(-14, -6, 3.4, 0, 6.29);
  ctx.fill();
  ctx.restore();
}

export function cart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  shadow(ctx, 30, 66, 46, 0.22);
  ctx.strokeStyle = '#5b6472';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(0, 0, 64, 42);
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.lineTo(-14, -16);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(6, 14);
  ctx.lineTo(58, 14);
  ctx.moveTo(6, 28);
  ctx.lineTo(58, 28);
  ctx.stroke();

  ctx.fillStyle = '#39424f';
  ctx.beginPath();
  ctx.arc(8, 52, 6.5, 0, 6.29);
  ctx.arc(56, 52, 6.5, 0, 6.29);
  ctx.fill();

  ctx.fillStyle = '#c94f42';
  ctx.fillRect(7, 7, 20, 15);
  ctx.fillStyle = '#3e7d4e';
  ctx.fillRect(31, 10, 24, 12);
  ctx.fillStyle = '#e0a51f';
  ctx.fillRect(16, -8, 22, 14);
  ctx.restore();
}

export function doors(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string, bg?: string) {
  ctx.save();
  shadow(ctx, x + w / 2, y + h + 4, w * 0.55, 0.2);
  ctx.fillStyle = '#5b7a94';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(190,225,245,.65)';
  ctx.fillRect(x + 8, y + 8, w / 2 - 12, h - 16);
  ctx.fillRect(x + w / 2 + 4, y + 8, w / 2 - 12, h - 16);

  ctx.strokeStyle = '#33424f';
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 8, y + 8, w / 2 - 12, h - 16);
  ctx.strokeRect(x + w / 2 + 4, y + 8, w / 2 - 12, h - 16);

  ctx.fillStyle = bg || '#1b2a4a';
  rr(ctx, x + w / 2 - 86, y - 40, 172, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y - 18);
  ctx.restore();
}

export function burst(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color?: string, rot: number = 0, fs: number = 44, nowT: number = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const sc = 0.8 + 0.25 * Math.abs(Math.sin(nowT * 2.4));
  ctx.scale(sc, sc);

  ctx.font = `900 ${fs}px 'Comic Sans MS',Verdana,sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#191203';
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = color || '#ffd94d';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

export function prod(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string, label?: string) {
  ctx.save();
  ctx.fillStyle = c;
  rr(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillRect(x + 4, y + 5, w - 8, h * 0.3);
  ctx.fillStyle = '#7a2c1c';
  ctx.font = 'bold ' + Math.max(9, w * 0.22) + 'px sans-serif';
  ctx.textAlign = 'center';
  if (label) ctx.fillText(label, x + w / 2, y + h * 0.68);
  ctx.restore();
}

export function telestrate(ctx: CanvasRenderingContext2D, kind: number, t01: number) {
  ctx.save();
  ctx.strokeStyle = '#ffd94d';
  ctx.lineWidth = 5;
  ctx.setLineDash([12, 9]);
  ctx.lineDashOffset = -t01 * 140;
  ctx.fillStyle = 'rgba(255,217,77,.10)';

  const dot = (x: number, y: number, n: string) => {
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, 6.29);
    ctx.fill();
    ctx.fillStyle = '#191203';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(n, x, y + 5);
  };

  if (kind === 0) {
    ctx.beginPath();
    ctx.ellipse(360, 430, 215, 165, 0, 0, 6.29);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    dot(150, 250, '1');
  } else if (kind === 1) {
    ctx.beginPath();
    ctx.ellipse(360, 420, 185, 265, 0, 0, 6.29);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#ff5147';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(255, 690);
    ctx.lineTo(465, 560);
    ctx.moveTo(465, 690);
    ctx.lineTo(255, 560);
    ctx.stroke();
    dot(360, 140, '2');
  } else if (kind === 2) {
    ctx.beginPath();
    ctx.ellipse(360, 470, 215, 320, 0, 0, 6.29);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    dot(120, 180, '3');
  } else if (kind === 3) {
    ctx.beginPath();
    ctx.ellipse(360, 580, 225, 140, -0.06, 0, 6.29);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    dot(96, 120, '4');
  }
  ctx.restore();
}

export function drawPanel(
  ctx: CanvasRenderingContext2D,
  p: number,
  t01: number,
  nowT: number = 0,
  curAudio: { charId: string | null; text: string; startedAt: number; dur: number } | null = null,
  heads: Record<string, { x: number; y: number }> = {},
  onBalloonJob?: (job: { x: number; y: number; text: string; prog: number }) => void
) {
  const L = (a: number, b: number) => lerp(a, b, clamp(t01, 0, 1));

  const P = (id: string, x: number, gy: number, o: PersonRenderOptions = {}) => {
    const isSpk = curAudio && curAudio.charId === id;
    if (isSpk && curAudio) {
      const prog = clamp((performance.now() - curAudio.startedAt) / (curAudio.dur * 1000), 0, 1);
      const ch = CHARS[id];
      const scale = o.scale || 1;
      const headTop = gy - (86 + 56 + 34) * (ch ? ch.h / 1.75 : 1) * scale - 14;
      onBalloonJob?.({
        x,
        y: headTop,
        text: curAudio.text,
        prog: clamp(prog * 1.15, 0, 1),
      });
    }
    drawPerson(ctx, id, x, gy, o, nowT, heads);
  };

  const faceBalloon = (id: string, x: number, y: number) => {
    if (curAudio && curAudio.charId === id) {
      const prog = clamp((performance.now() - curAudio.startedAt) / (curAudio.dur * 1000), 0, 1);
      onBalloonJob?.({ x, y, text: curAudio.text, prog: clamp(prog * 1.15, 0, 1) });
    }
  };

  switch (p) {
    case 0: {
      baseStore(ctx, 560, nowT);
      sign(ctx, 215, 86, 290, 'SUPERMERCADO', '#1b2a4a', '#f5d97e', 22);
      sign(ctx, 508, 150, 196, 'OFERTAS', '#b3372f', '#fff', 16);
      shelf(ctx, 18, 215, 180, 345, 3);
      shelf(ctx, 522, 215, 180, 345, 11);
      doors(ctx, 268, 300, 184, 252, 'ENTRADA • SAÍDA');
      camIcon(ctx, 96, 150, 1, nowT);
      camIcon(ctx, 624, 150, 1, nowT);
      cart(ctx, 566, 648, 1.05);
      P('amanda', 308, FEET, { scale: 1.5, expr: 'feliz' });
      P('fernando', 428, FEET, { scale: 1.5, expr: 'feliz', pose: 'cesta' });
      burst(ctx, 'OAB XLI • Q57', 360, 660, '#fff', 0, 30, nowT);
      break;
    }
    case 1: {
      ctx.fillStyle = '#e9d6ab';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#8a6f45';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(360, 120);
        ctx.lineTo(20 + i * 230, 0);
        ctx.lineTo(150 + i * 230, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,246,200,.95)';
      for (let i = 0; i < 3; i++) {
        rr(ctx, 90 + i * 220, 60, 120, 16, 8);
        ctx.fill();
      }
      ctx.fillStyle = '#c2a06b';
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(210, 430);
      ctx.lineTo(510, 430);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(110,82,40,.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(105, 690);
      ctx.lineTo(0, 900);
      ctx.moveTo(615, 690);
      ctx.lineTo(W, 900);
      ctx.moveTo(360, 430);
      ctx.lineTo(360, H);
      ctx.stroke();

      doors(ctx, 238, 120, 244, 330, 'ENTRADA • SAÍDA');
      sign(ctx, 40, 180, 150, 'PADARIA', '#b3372f', '#fff', 14);
      sign(ctx, 545, 180, 150, 'AÇOUGUE', '#1b2a4a', '#f5d97e', 14);

      const wx = L(-30, 0);
      P('amanda', 268 + wx, 905, { scale: 2.6, walk: 1, phase: nowT * 7, expr: 'feliz' });
      P('fernando', 468 + wx, 905, { scale: 2.6, walk: 1, phase: nowT * 7 + 1, pose: 'cesta', expr: 'neutro' });
      burst(ctx, 'VRUMM!', 86, 470, '#ffd94d', -0.14, 34, nowT);
      break;
    }
    case 2: {
      ctx.fillStyle = '#d9c193';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(110,82,40,.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 60 + i * 110);
        ctx.lineTo(W, 60 + i * 110);
        ctx.stroke();
      }
      for (const sx of [36, 492]) {
        ctx.fillStyle = '#8a4b2a';
        rr(ctx, sx, 90, 192, 780, 10);
        ctx.fill();
        ctx.strokeStyle = '#5e3018';
        ctx.lineWidth = 3;
        ctx.stroke();
        const cols = ['#c94f42', '#e0a51f', '#3e7d4e', '#2e5f8a', '#e8e3d5', '#7a4a8c'];
        for (let r2 = 0; r2 < 9; r2++)
          for (let i2 = 0; i2 < 4; i2++) {
            ctx.fillStyle = cols[(r2 + i2 + sx) % 6];
            rr(ctx, sx + 14 + i2 * 44, 112 + r2 * 84, 34, 58, 4);
            ctx.fill();
          }
      }
      sign(ctx, 258, 26, 204, 'CORREDOR 3 — VISTA DE CIMA', '#1b2a4a', '#f5d97e', 13);
      const ay = L(300, 470);
      const fy2 = L(390, 545);

      for (const [id, yy, sd] of [
        ['amanda', ay, -1],
        ['fernando', fy2, 1],
      ] as [string, number, number][]) {
        const c = CHARS[id];
        ctx.fillStyle = 'rgba(20,16,8,.3)';
        ctx.beginPath();
        ctx.ellipse(360 + sd * 36, yy + 16, 44, 17, 0, 0, 6.29);
        ctx.fill();
        ctx.fillStyle = c.top;
        ctx.beginPath();
        ctx.ellipse(360 + sd * 30, yy, 40, 30, sd * 0.3, 0, 6.29);
        ctx.fill();
        ctx.fillStyle = c.skin;
        ctx.beginPath();
        ctx.arc(360 + sd * 30, yy - 6, 24, 0, 6.29);
        ctx.fill();
        ctx.fillStyle = c.hair;
        ctx.beginPath();
        ctx.arc(360 + sd * 30, yy - 10, 24, Math.PI, 6.29);
        ctx.fill();
        if (id === 'fernando') {
          ctx.fillStyle = c.cap || '#22304d';
          ctx.beginPath();
          ctx.arc(360 + sd * 30, yy - 10, 25, Math.PI, 6.29);
          ctx.fill();
        }
        ctx.fillStyle = c.skin;
        ctx.beginPath();
        ctx.arc(360 + sd * 30 - 34, yy + 16, 10, 0, 6.29);
        ctx.arc(360 + sd * 30 + 34, yy + 16, 10, 0, 6.29);
        ctx.fill();
        heads[id] = { x: 360 + sd * 30, y: yy - 30 };
      }

      ctx.save();
      ctx.translate(408, ay + 58);
      ctx.strokeStyle = '#5b6472';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 58, 38);
      ctx.fillStyle = '#c94f42';
      ctx.fillRect(6, 6, 18, 13);
      ctx.fillStyle = '#3e7d4e';
      ctx.fillRect(28, 8, 22, 11);
      ctx.restore();

      camIcon(ctx, 360, 120, 1.2, nowT);
      burst(ctx, 'CLAC CLAC', 120, 860, '#fff', 0.08, 30, nowT);
      break;
    }
    case 3: {
      baseStore(ctx, 600, nowT);
      shelf(ctx, 60, 120, 600, 470, 7);
      sign(ctx, 228, 64, 264, 'PRATELEIRA — BEBIDAS', '#1b2a4a', '#f5d97e', 16);
      prod(ctx, 300, 300, 120, 170, '#e0a51f', 'R$ 49');
      prod(ctx, 440, 318, 86, 140, '#2e5f8a', '');
      prod(ctx, 180, 318, 86, 140, '#c94f42', '');

      ctx.save();
      ctx.strokeStyle = '#ffd94d';
      ctx.lineWidth = 5;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.ellipse(360, 385, 86, 110, 0, 0, 6.29);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      const reach = 0.55 + 0.3 * Math.sin(Math.min(1, t01 * 1.6) * Math.PI);
      ctx.save();
      ctx.strokeStyle = '#b3372f';
      ctx.lineWidth = 64;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(120, 960);
      ctx.lineTo(lerp(180, 320, reach), lerp(760, 430, reach));
      ctx.stroke();

      ctx.strokeStyle = CHARS.amanda.skin;
      ctx.lineWidth = 40;
      ctx.beginPath();
      ctx.moveTo(lerp(150, 318, reach), lerp(800, 436, reach));
      ctx.lineTo(lerp(185, 336, reach), lerp(742, 424, reach));
      ctx.stroke();
      ctx.restore();

      drawHand(ctx, lerp(190, 342, reach), lerp(730, 420, reach), CHARS.amanda.skin, 0.5);

      ctx.save();
      ctx.globalAlpha = 0.92;
      P('fernando', 668, 700, { scale: 1.25, expr: 'tenso', look: [-1, 0] });
      ctx.restore();
      burst(ctx, 'É ESSE!', 566, 210, '#ffd94d', 0.1, 36, nowT);
      break;
    }
    case 4: {
      ctx.fillStyle = '#e9d6ab';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c2a06b';
      ctx.fillRect(0, 700, W, 260);
      shelf(ctx, 500, 60, 190, 420, 5);

      ctx.save();
      ctx.translate(330, 470);
      ctx.rotate(Math.sin(nowT * 1.4) * 0.02);
      ctx.fillStyle = '#54341b';
      rr(ctx, -190, -30, 380, 300, 26);
      ctx.fill();
      ctx.fillStyle = '#6e4525';
      rr(ctx, -190, -30, 380, 300, 26);
      ctx.fill();
      ctx.fillStyle = '#3a2410';
      ctx.beginPath();
      ctx.ellipse(0, -18, 178, 44, 0, 0, 6.29);
      ctx.fill();
      ctx.strokeStyle = '#8a6f45';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, -44, 86, Math.PI, 0);
      ctx.stroke();

      prod(ctx, -60, -120, 86, 120, '#e0a51f', 'R$ 49');
      prod(ctx, 28, -96, 70, 100, '#c94f42', '');
      prod(ctx, -140, -84, 64, 92, '#2e5f8a', '');
      ctx.restore();

      const dip = Math.sin(Math.min(1, t01 * 1.4) * Math.PI) * 36;
      ctx.save();
      ctx.strokeStyle = CHARS.amanda.skin;
      ctx.lineWidth = 34;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(60, 120);
      ctx.lineTo(268, 300 + dip);
      ctx.stroke();
      ctx.restore();
      drawHand(ctx, 278, 312 + dip, CHARS.amanda.skin, 0.4);

      ctx.save();
      ctx.strokeStyle = CHARS.fernando.skin;
      ctx.lineWidth = 34;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(660, 110);
      ctx.lineTo(452, 290 + dip * 0.7);
      ctx.stroke();
      ctx.restore();
      drawHand(ctx, 442, 300 + dip * 0.7, CHARS.fernando.skin, -0.4);

      prod(ctx, 300, 190 + dip, 74, 104, '#3e7d4e', '');
      burst(ctx, 'SHHH…', 120, 180, '#7ec8ff', -0.12, 52, nowT);
      burst(ctx, 'CLIC!', 548, 640, '#ffd94d', 0.1, 46, nowT);

      ctx.fillStyle = '#1b2a4a';
      rr(ctx, 150, 806, 420, 64, 12);
      ctx.fill();
      ctx.fillStyle = '#f5d97e';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TOTAL ESCONDIDO: ± R$ 2.000', 360, 846);
      break;
    }
    case 5: {
      baseStore(ctx, 620, nowT);
      shelf(ctx, 24, 150, 180, 430, 9);
      shelf(ctx, 516, 150, 180, 430, 4);
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#f6ead0';
      ctx.fillRect(204, 120, 312, 560);
      ctx.restore();

      drawBigFace(ctx, 'fernando', 360, 430, 165, 'medo', nowT, curAudio, heads);
      faceBalloon('fernando', 360, 180);
      burst(ctx, 'GLUP!', 580, 760, '#7ec8ff', 0.08, 40, nowT);

      ctx.fillStyle = '#1b2a4a';
      rr(ctx, 196, 806, 328, 60, 12);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CORAÇÃO DISPARADO…', 360, 844);
      break;
    }
    case 6: {
      ctx.fillStyle = '#0c1017';
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      rr(ctx, 26, 26, W - 52, H - 52, 18);
      ctx.clip();
      baseStore(ctx, 520, nowT);
      shelf(ctx, 30, 190, 190, 330, 3);
      shelf(ctx, 500, 190, 190, 330, 11);
      ctx.fillStyle = 'rgba(120,220,160,.13)';
      ctx.fillRect(0, 0, W, H);
      P('amanda', 300, 700, { scale: 1.35, pose: 'bag', bagFull: true, expr: 'tenso' });
      P('fernando', 428, 700, { scale: 1.35, expr: 'tenso', look: [-1, 0] });
      cart(ctx, 560, 610, 0.9);

      ctx.fillStyle = 'rgba(0,0,0,.16)';
      for (let yy = 40; yy < H; yy += 7) ctx.fillRect(0, yy, W, 2);
      const vg = ctx.createRadialGradient(360, 480, 240, 360, 480, 620);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,.5)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      ctx.strokeStyle = '#39424f';
      ctx.lineWidth = 5;
      rr(ctx, 26, 26, W - 52, H - 52, 18);
      ctx.stroke();

      ctx.fillStyle = Math.sin(nowT * 3.4) > 0 ? '#ff3b30' : '#5c130e';
      ctx.beginPath();
      ctx.arc(66, 70, 11, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = '#ff5147';
      ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('REC', 88, 79);
      ctx.fillStyle = '#cfe3ff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('CAM 03 • CORREDOR', 44, 916);
      ctx.textAlign = 'right';
      ctx.fillText('AO VIVO', 676, 79);
      burst(ctx, 'BIP!', 600, 180, '#7ee2a0', 0.06, 34, nowT);
      break;
    }
    case 7: {
      ctx.fillStyle = '#1d2534';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#232b3a';
      rr(ctx, 36, 44, 648, 430, 12);
      ctx.fill();
      ctx.fillStyle = '#2e3850';
      ctx.fillRect(36, 44, 648, 42);
      ctx.fillStyle = '#f5d97e';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('MONITORAMENTO — AO VIVO', 54, 72);

      for (let r2 = 0; r2 < 2; r2++)
        for (let c2 = 0; c2 < 3; c2++) {
          const mx = 54 + c2 * 212;
          const my = 102 + r2 * 176;
          ctx.fillStyle = '#0c1017';
          rr(ctx, mx, my, 196, 158, 8);
          ctx.fill();
          ctx.fillStyle = '#31435f';
          ctx.fillRect(mx + 7, my + 7, 182, 112);
          ctx.fillStyle = '#c9b18a';
          ctx.fillRect(mx + 7, my + 92, 182, 27);
          ctx.fillStyle = '#8a4b2a';
          ctx.fillRect(mx + 16, my + 30, 38, 62);
          ctx.fillRect(mx + 142, my + 30, 38, 62);
          const px = mx + 84 + Math.sin(nowT * 1.3 + c2) * 16;
          ctx.fillStyle = '#b3372f';
          ctx.beginPath();
          ctx.arc(px, my + 62, 8, 0, 6.29);
          ctx.fill();
          ctx.fillRect(px - 6, my + 70, 12, 22);
          ctx.fillStyle = '#2e5f8a';
          ctx.beginPath();
          ctx.arc(px + 28, my + 62, 8, 0, 6.29);
          ctx.fill();
          ctx.fillRect(px + 22, my + 70, 12, 22);
          ctx.fillStyle = Math.sin(nowT * 3.2 + c2) > 0 ? '#ff3b30' : '#7a1610';
          ctx.beginPath();
          ctx.arc(mx + 15, my + 16, 3.6, 0, 6.29);
          ctx.fill();
          ctx.fillStyle = '#cfe3ff';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('CAM 0' + (r2 * 3 + c2 + 1), mx + 24, my + 19);
          ctx.fillStyle = '#8fa3bf';
          ctx.font = '10px sans-serif';
          ctx.fillText('CORREDOR ' + (r2 * 3 + c2 + 1) + ' • REC', mx + 9, my + 140);
        }

      ctx.fillStyle = '#171d29';
      ctx.fillRect(60, 486, 600, 18);

      ctx.fillStyle = '#141a26';
      ctx.beginPath();
      ctx.ellipse(215, 905, 215, 190, 0, Math.PI, 6.29);
      ctx.fill();
      ctx.fillStyle = CHARS.chefe.skin;
      ctx.beginPath();
      ctx.arc(215, 742, 74, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = '#141a26';
      ctx.beginPath();
      ctx.ellipse(215, 706, 76, 40, 0, Math.PI, 6.29);
      ctx.fill();
      ctx.fillStyle = '#26355c';
      rr(ctx, 60, 838, 310, 122, 30);
      ctx.fill();
      ctx.fillStyle = '#f5d97e';
      ctx.fillRect(96, 884, 120, 10);

      P('operador', 540, FEET, { scale: 1.45, pose: 'screen', expr: 'surpresa', tag: t01 < 0.5 });
      burst(ctx, 'ALI!', 470, 560, '#ffd94d', -0.08, 36, nowT);
      break;
    }
    case 8: {
      baseStore(ctx, 560, nowT);
      const off = -((t01 * 140) % 240);
      for (let i2 = -1; i2 < 4; i2++) shelf(ctx, 40 + i2 * 240 + off, 170, 205, 390, i2 + 6);
      sign(ctx, 430, 96, 220, 'CORREDOR 5', '#1b2a4a', '#f5d97e', 16);
      camIcon(ctx, 120, 140, 1, nowT);

      ctx.strokeStyle = 'rgba(27,42,74,.35)';
      ctx.lineWidth = 4;
      for (let i2 = 0; i2 < 4; i2++) {
        ctx.beginPath();
        ctx.moveTo(30 + i2 * 60, 640 + i2 * 36);
        ctx.lineTo(110 + i2 * 60, 640 + i2 * 36);
        ctx.stroke();
      }

      P('amanda', 252, FEET, { scale: 1.55, walk: 1, phase: nowT * 7, pose: 'cart', bagFull: true, expr: 'tenso' });
      P('fernando', 470, FEET, { scale: 1.55, walk: 1, phase: nowT * 7 + 2, expr: 'tenso', look: [1, 0] });
      cart(ctx, 300, 662, 1.15);
      P('chefe', 660, FEET, { scale: 1.55, walk: 1, phase: nowT * 7.5, expr: 'serio' });
      burst(ctx, 'TOC TOC TOC', 120, 850, '#fff', 0, 28, nowT);
      break;
    }
    case 9: {
      baseStore(ctx, 430, nowT);
      shelf(ctx, 16, 120, 170, 320, 3);
      shelf(ctx, 534, 120, 170, 320, 11);
      doors(ctx, 520, 140, 170, 300, 'SAÍDA →', '#b3372f');

      ctx.fillStyle = 'rgba(255,246,200,.5)';
      ctx.beginPath();
      ctx.ellipse(330, 300, 240, 300, 0, 0, 6.29);
      ctx.fill();

      P('chefe', 330, 918, { scale: 2.9, pose: 'point', expr: 'serio' });

      ctx.fillStyle = CHARS.amanda.top;
      ctx.beginPath();
      ctx.ellipse(96, 930, 86, 110, 0, Math.PI, 6.29);
      ctx.fill();
      ctx.fillStyle = CHARS.amanda.skin;
      ctx.beginPath();
      ctx.arc(96, 838, 40, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = CHARS.amanda.hair;
      for (let i2 = 0; i2 < 6; i2++) {
        ctx.beginPath();
        ctx.arc(66 + i2 * 12, 812, 13, 0, 6.29);
        ctx.fill();
      }

      ctx.fillStyle = CHARS.fernando.top;
      ctx.beginPath();
      ctx.ellipse(636, 930, 86, 110, 0, Math.PI, 6.29);
      ctx.fill();
      ctx.fillStyle = CHARS.fernando.skin;
      ctx.beginPath();
      ctx.arc(636, 838, 40, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = CHARS.fernando.cap || '#22304d';
      ctx.beginPath();
      ctx.arc(636, 820, 42, Math.PI, 6.29);
      ctx.fill();

      burst(ctx, 'PARADOS AÍ!', 120, 240, '#ff5147', -0.08, 44, nowT);
      break;
    }
    case 10: {
      baseStore(ctx, 620, nowT);
      shelf(ctx, 24, 150, 180, 430, 5);
      shelf(ctx, 516, 150, 180, 430, 9);
      drawBigFace(ctx, 'amanda', 330, 420, 160, 'surpresa', nowT, curAudio, heads);
      faceBalloon('amanda', 330, 170);

      ctx.save();
      ctx.globalAlpha = 0.95;
      P('fernando', 636, FEET, { scale: 1.3, expr: 'medo', pose: 'up' });
      ctx.restore();
      burst(ctx, '?!', 580, 180, '#ffd94d', 0.12, 54, nowT);
      break;
    }
    case 11: {
      ctx.fillStyle = '#232b3a';
      ctx.fillRect(0, 0, W, 470);
      ctx.fillStyle = '#6e4525';
      ctx.fillRect(0, 470, W, 490);
      ctx.fillStyle = '#845731';
      ctx.fillRect(0, 470, W, 16);

      ctx.save();
      ctx.translate(178, 300);
      ctx.rotate(-0.05 + Math.sin(nowT * 1.6) * 0.015);
      ctx.fillStyle = '#101623';
      rr(ctx, -14, -168, 28, 60, 8);
      ctx.fill();
      ctx.fillStyle = '#fffdf6';
      rr(ctx, -118, -110, 236, 300, 16);
      ctx.fill();
      ctx.strokeStyle = '#1b2a4a';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#1b2a4a';
      rr(ctx, -118, -110, 236, 52, 16);
      ctx.fill();
      ctx.fillStyle = '#f5d97e';
      ctx.font = 'bold 21px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SEGURANÇA', 0, -76);

      ctx.fillStyle = CHARS.chefe.skin;
      ctx.beginPath();
      ctx.arc(0, 6, 44, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = '#26355c';
      ctx.beginPath();
      ctx.ellipse(0, 66, 52, 30, 0, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = '#1d2433';
      ctx.font = 'bold 25px sans-serif';
      ctx.fillText('SEG. CARLOS', 0, 132);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#5b6472';
      ctx.fillText('Chefe de segurança', 0, 158);
      ctx.restore();

      prod(ctx, 420, 330, 64, 96, '#c94f42', '');
      prod(ctx, 496, 318, 64, 108, '#e0a51f', 'R$ 49');
      prod(ctx, 572, 336, 64, 90, '#3e7d4e', '');
      prod(ctx, 452, 238, 58, 84, '#2e5f8a', '');
      prod(ctx, 540, 246, 58, 80, '#7a4a8c', '');

      ctx.fillStyle = '#fff3c4';
      rr(ctx, 404, 452, 292, 40, 8);
      ctx.fill();
      ctx.fillStyle = '#7a2c1c';
      ctx.font = 'bold 17px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRODUTOS RECUPERADOS', 550, 478);

      P('advogada', 520, FEET, { scale: 1.5, pose: 'talk', expr: 'serio', tag: t01 < 0.45 });
      burst(ctx, 'TUDO AQUI.', 120, 660, '#fff', -0.06, 32, nowT);
      break;
    }
    case 12: {
      baseStore(ctx, 560, nowT);
      shelf(ctx, 18, 190, 180, 370, 3);
      shelf(ctx, 522, 190, 180, 370, 11);
      shelf(ctx, 268, 205, 184, 300, 7);
      sign(ctx, 248, 86, 224, 'CORREDOR 4', '#1b2a4a', '#f5d97e', 16);
      camIcon(ctx, 360, 140, 1, nowT);

      P('cliente1', 120, 690, { scale: 1.15, expr: 'surpresa' });
      P('cliente2', 612, 690, { scale: 1.15, expr: 'surpresa' });
      P('chefe', 238, FEET, { scale: 1.55, pose: 'point', expr: 'serio' });
      P('amanda', 408, FEET, { scale: 1.5, expr: 'medo', pose: 'up', bagFull: true });
      P('fernando', 516, FEET, { scale: 1.5, expr: 'medo', pose: 'up' });
      cart(ctx, 600, 660, 0.95);
      break;
    }
    case 13: {
      ctx.fillStyle = '#1d2534';
      ctx.fillRect(0, 0, W, H);
      for (let i2 = 0; i2 < 3; i2++) {
        const mx = 44 + i2 * 218;
        ctx.fillStyle = '#0c1017';
        rr(ctx, mx, 60, 198, 150, 9);
        ctx.fill();
        ctx.fillStyle = '#31435f';
        ctx.fillRect(mx + 7, 67, 184, 104);
        ctx.fillStyle = '#c9b18a';
        ctx.fillRect(mx + 7, 140, 184, 31);
        ctx.fillStyle = '#8a4b2a';
        ctx.fillRect(mx + 16, 86, 34, 54);
        ctx.fillRect(mx + 148, 86, 34, 54);
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.arc(mx + 16, 78, 3.6, 0, 6.29);
        ctx.fill();
        ctx.fillStyle = '#cfe3ff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('CAM 0' + (i2 + 1), mx + 26, 81);
      }

      ctx.save();
      ctx.translate(360, 470);
      ctx.rotate(-0.015);
      shadow(ctx, 0, 190, 240, 0.3);
      ctx.fillStyle = '#fffdf6';
      rr(ctx, -252, -190, 504, 380, 14);
      ctx.fill();
      ctx.strokeStyle = '#b98a1c';
      ctx.lineWidth = 5;
      ctx.stroke();

      ctx.fillStyle = '#1b2a4a';
      rr(ctx, -252, -190, 504, 64, 14);
      ctx.fill();
      ctx.fillStyle = '#f5d97e';
      ctx.font = 'bold 27px Georgia,serif';
      ctx.textAlign = 'center';
      ctx.fillText('SÚMULA 567 — STJ', 0, -148);

      ctx.fillStyle = '#1d2433';
      ctx.font = '19px sans-serif';
      const lines = [
        'Sistema de vigilância por',
        'monitoramento eletrônico, por si só,',
        'NÃO torna impossível',
        'a configuração do crime de furto.',
      ];
      lines.forEach((ln, i2) => ctx.fillText(ln, 0, -84 + i2 * 36));

      ctx.fillStyle = '#b3372f';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('VIGIAR ≠ IMPOSSIBILITAR', 0, 120);
      ctx.restore();

      P('operador', 180, FEET, { scale: 1.45, pose: 'screen', expr: 'serio' });
      P('chefe', 520, FEET, { scale: 1.5, expr: 'serio' });
      break;
    }
    case 14: {
      baseStore(ctx, 600, nowT);
      shelf(ctx, 24, 300, 190, 320, 3);
      shelf(ctx, 506, 300, 190, 320, 11);

      ctx.save();
      ctx.translate(360, 120);
      ctx.fillStyle = '#20262f';
      ctx.beginPath();
      ctx.ellipse(0, 0, 150, 86, 0, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = '#39424f';
      ctx.beginPath();
      ctx.ellipse(0, 16, 104, 58, 0, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = '#9fd8ff';
      ctx.beginPath();
      ctx.arc(0, 26, 30, 0, 6.29);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-10, 16, 9, 0, 6.29);
      ctx.fill();

      ctx.fillStyle = Math.sin(nowT * 3.2) > 0 ? '#ff3b30' : '#7a1610';
      ctx.beginPath();
      ctx.arc(-118, -24, 9, 0, 6.29);
      ctx.fill();

      ctx.strokeStyle = 'rgba(159,216,255,.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-60, 80);
      ctx.lineTo(-190, 560);
      ctx.moveTo(60, 80);
      ctx.lineTo(190, 560);
      ctx.stroke();
      ctx.restore();

      P('amanda', 268, FEET, { scale: 1.45, pose: 'bag', bagFull: true, expr: 'tenso' });
      P('fernando', 428, FEET, { scale: 1.45, expr: 'tenso' });
      P('chefe', 600, FEET, { scale: 1.45, pose: 'point', expr: 'serio' });
      burst(ctx, 'DE OLHO!', 96, 300, '#7ec8ff', -0.08, 34, nowT);
      break;
    }
    case 15: {
      baseStore(ctx, 520, nowT);
      shelf(ctx, 18, 190, 170, 330, 3);
      shelf(ctx, 532, 190, 170, 330, 11);
      doors(ctx, 255, 170, 210, 330, 'SAÍDA →', '#b3372f');

      ctx.save();
      ctx.strokeStyle = '#b3372f';
      ctx.lineWidth = 7;
      ctx.setLineDash([16, 10]);
      ctx.beginPath();
      ctx.moveTo(40, 690);
      ctx.lineTo(680, 690);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#b3372f';
      ctx.font = 'bold 19px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NINGUÉM ATRAVESSOU ESTA LINHA', 360, 668);
      ctx.restore();

      P('amanda', 268, FEET, { scale: 1.5, expr: 'tenso', bagFull: true });
      P('fernando', 392, FEET, { scale: 1.5, expr: 'tenso' });
      P('chefe', 540, FEET, { scale: 1.5, expr: 'serio' });
      burst(ctx, 'PAROU AQUI.', 110, 300, '#fff', -0.06, 32, nowT);
      break;
    }
    case 16: {
      baseStore(ctx, 600, nowT);
      shelf(ctx, 24, 140, 170, 430, 3);
      shelf(ctx, 526, 140, 170, 430, 11);
      doors(ctx, 500, 120, 180, 300, 'SAÍDA →', '#b3372f');

      ctx.save();
      ctx.translate(330, 470);
      ctx.scale(2.5, 2.5);
      ctx.translate(-32, -10);
      ctx.strokeStyle = '#5b6472';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(0, 0, 64, 42);
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(-14, -16);
      ctx.stroke();
      ctx.fillStyle = '#39424f';
      ctx.beginPath();
      ctx.arc(8, 52, 6.5, 0, 6.29);
      ctx.arc(56, 52, 6.5, 0, 6.29);
      ctx.fill();
      ctx.restore();

      prod(ctx, 238, 318, 84, 110, '#c94f42', '');
      prod(ctx, 330, 300, 84, 128, '#e0a51f', 'R$ 49');
      prod(ctx, 422, 322, 84, 106, '#3e7d4e', '');
      prod(ctx, 282, 232, 76, 96, '#2e5f8a', '');
      prod(ctx, 372, 222, 76, 100, '#7a4a8c', '');

      ctx.fillStyle = '#1b2a4a';
      rr(ctx, 150, 600, 420, 66, 12);
      ctx.fill();
      ctx.fillStyle = '#f5d97e';
      ctx.font = 'bold 25px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TOTAL: ± R$ 2.000 EM PRODUTOS', 360, 642);

      P('amanda', 120, FEET, { scale: 1.4, expr: 'tenso', bagFull: true });
      P('fernando', 612, FEET, { scale: 1.4, expr: 'tenso' });
      burst(ctx, 'E AGORA?', 360, 140, '#ffd94d', 0, 40, nowT);
      break;
    }
  }
}
