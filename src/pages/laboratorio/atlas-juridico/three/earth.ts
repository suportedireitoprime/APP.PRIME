import * as THREE from 'three'

/**
 * Texturas procedurais do globo (portadas do protótipo HTML, que as
 * desenhava num canvas 2D). Nada é baixado da internet: o globo funciona
 * offline, o que importa para o Atlas e para a versão nativa.
 *
 * PERFORMANCE — por que este arquivo mudou:
 * - Antes, cada `earthTexture()` gerava um canvas NOVO de 2048×1024, e
 *   ele era chamado 3 vezes (globo central + 2 mini-globos), ou seja,
 *   ~6 megapixels desenhados e 3 texturas de 8 MB na GPU. Agora todas as
 *   texturas são singletons com cache por módulo: a primeira chamada
 *   desenha, as demais reutilizam a mesma instância.
 * - Resolução adequada: a Terra é desenhada em 1024×512. O globo ocupa
 *   no máximo ~500 px na tela, então 1024 px já é 2× a tela — 2048 px
 *   só gastava memória e tempo de upload para a GPU sem ganho visível.
 *   O desenho original foi feito para 2048×1024 e é escalado com
 *   `ctx.scale()`, então os continentes ficam idênticos.
 * - Nuvens caíram de 1024×512 para 512×256 pelo mesmo motivo.
 */

/** Converte latitude/longitude em ponto na esfera de raio `r`. */
export function latLon(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180
  const th = ((lon + 180) * Math.PI) / 180
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(th),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(th),
  )
}

interface CachedTexture {
  texture: THREE.CanvasTexture
  canvas: HTMLCanvasElement
}

const earthCache = new Map<number, CachedTexture>()
let cloudCache: CachedTexture | null = null
let starCache: THREE.CanvasTexture | null = null
let glowCache: THREE.CanvasTexture | null = null
let earthDataUrl: string | null = null

function drawEarthCanvas(W: number, H: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')!
  // Todo o desenho foi calibrado para 2048×1024; escala para o tamanho real.
  const s = W / 2048
  x.save()
  x.scale(s, s)
  // A partir daqui, coordenadas no espaço 2048×1024.
  const g = x.createLinearGradient(0, 0, 0, 1024)
  g.addColorStop(0, '#16355c')
  g.addColorStop(0.28, '#1d5fae')
  g.addColorStop(0.5, '#2273c4')
  g.addColorStop(0.72, '#1d5fae')
  g.addColorStop(1, '#16355c')
  x.fillStyle = g
  x.fillRect(0, 0, 2048, 1024)
  for (let o = 0; o < 260; o++) {
    x.fillStyle = `rgba(255,255,255,${0.015 + Math.random() * 0.03})`
    x.beginPath()
    x.ellipse(
      Math.random() * 2048,
      Math.random() * 1024,
      30 + Math.random() * 130,
      6 + Math.random() * 16,
      Math.random() * 0.6 - 0.3,
      0,
      Math.PI * 2,
    )
    x.fill()
  }
  x.strokeStyle = 'rgba(255,255,255,0.07)'
  x.lineWidth = 1.5
  for (let i = 1; i < 24; i++) {
    x.beginPath()
    x.moveTo((i * 2048) / 24, 0)
    x.lineTo((i * 2048) / 24, 1024)
    x.stroke()
  }
  for (let j = 1; j < 12; j++) {
    x.beginPath()
    x.moveTo(0, (j * 1024) / 12)
    x.lineTo(2048, (j * 1024) / 12)
    x.stroke()
  }
  const blob = (cx: number, cy: number, pts: number[][], fill: string) => {
    x.fillStyle = fill
    x.beginPath()
    pts.forEach((p, idx) => {
      const px = cx + p[0] * 2
      const py = cy + p[1] * 2
      if (idx === 0) x.moveTo(px, py)
      else x.lineTo(px, py)
    })
    x.closePath()
    x.fill()
  }
  const LAND = '#c9a86a'
  const LAND2 = '#b8934f'
  const LAND3 = '#dcc084'
  const continents: [number, number, number[][]][] = [
    [430, 240, [[0, -70], [55, -58], [72, -12], [42, 28], [58, 82], [26, 152], [2, 122], [-14, 42], [-46, 12], [-42, -46]]],
    [430, 600, [[0, -42], [36, -22], [32, 42], [6, 88], [-22, 42], [-27, -16]]],
    [1040, 260, [[0, -58], [46, -42], [42, 10], [62, 46], [32, 98], [6, 132], [-16, 62], [-37, 22], [-27, -32]]],
    [1400, 220, [[0, -62], [92, -48], [124, 0], [82, 36], [114, 72], [42, 62], [0, 26], [-42, 12], [-32, -36]]],
    [1660, 640, [[0, -32], [58, -16], [48, 26], [0, 38], [-38, 12]]],
    [900, 170, [[0, -30], [60, -38], [95, -18], [70, 14], [20, 26], [-30, 10], [-45, -16]]],
  ]
  continents.forEach((ct) => blob(ct[0] + 7, ct[1] + 9, ct[2], 'rgba(6,24,48,0.45)'))
  continents.forEach((ct) => blob(ct[0], ct[1], ct[2], LAND))
  continents.forEach((ct) => {
    blob(ct[0] + 6, ct[1] + 4, ct[2].map((p) => [p[0] * 0.55, p[1] * 0.55]), LAND3)
    blob(ct[0] - 4, ct[1] - 2, ct[2].map((p) => [p[0] * 0.3, p[1] * 0.3]), LAND2)
  })
  x.fillStyle = LAND
  const islands: [number, number][] = [
    [760, 300], [790, 330], [620, 470], [1180, 430], [1230, 470], [1560, 430],
    [1620, 470], [980, 120], [350, 180], [520, 690], [1750, 560], [1800, 600],
  ]
  islands.forEach((p) => {
    x.beginPath()
    x.ellipse(p[0], p[1], 12 + Math.random() * 16, 7 + Math.random() * 9, Math.random(), 0, Math.PI * 2)
    x.fill()
  })
  // Calotas polares
  x.fillStyle = 'rgba(240,246,252,0.92)'
  x.beginPath()
  x.moveTo(0, 0)
  for (let px = 0; px <= 2048; px += 64) x.lineTo(px, 26 + Math.sin(px * 0.011) * 13 + Math.random() * 8)
  x.lineTo(2048, 0)
  x.closePath()
  x.fill()
  x.beginPath()
  x.moveTo(0, 1024)
  for (let qx = 0; qx <= 2048; qx += 64) x.lineTo(qx, 1024 - 30 - Math.cos(qx * 0.009) * 12 - Math.random() * 8)
  x.lineTo(2048, 1024)
  x.closePath()
  x.fill()
  x.restore()
  return c
}

/** Textura da Terra em cache (1024×512 por padrão — ver o comentário do topo). */
export function earthTexture(width = 1024): THREE.CanvasTexture {
  const cached = earthCache.get(width)
  if (cached) return cached.texture
  const canvas = drawEarthCanvas(width, width / 2)
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  earthCache.set(width, { texture: t, canvas })
  return t
}

/** A mesma textura da Terra como data URL, para os mini-globos em CSS. */
export function earthTextureDataURL(): string {
  if (earthDataUrl) return earthDataUrl
  const cached = earthCache.get(1024) ?? null
  const canvas = cached ? cached.canvas : drawEarthCanvas(1024, 512)
  if (!cached) {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    earthCache.set(1024, { texture: t, canvas })
  }
  earthDataUrl = canvas.toDataURL('image/png')
  return earthDataUrl
}

export function cloudTexture(): THREE.CanvasTexture {
  if (cloudCache) return cloudCache.texture
  const W = 512
  const H = 256
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d')!
  x.clearRect(0, 0, W, H)
  for (let i = 0; i < 140; i++) {
    const cx = Math.random() * W
    const cy = 20 + Math.random() * (H - 40)
    const r = 7 + Math.random() * 23
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(255,255,255,0.55)')
    g.addColorStop(0.6, 'rgba(255,255,255,0.22)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g
    x.beginPath()
    x.ellipse(cx, cy, r * 1.7, r * 0.55, 0, 0, Math.PI * 2)
    x.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  cloudCache = { texture: t, canvas: c }
  return t
}

/** Sprite radial branco, usado para estrelas, brilhos e pó dourado. */
export function starSpriteTexture(): THREE.CanvasTexture {
  if (starCache) return starCache
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 64, 64)
  starCache = new THREE.CanvasTexture(c)
  return starCache
}

/** Disco de luz dourada no chão, sob a mão da Têmis. */
export function glowDiscTexture(): THREE.CanvasTexture {
  if (glowCache) return glowCache
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const x = c.getContext('2d')!
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(240,201,78,0.5)')
  g.addColorStop(0.55, 'rgba(240,201,78,0.16)')
  g.addColorStop(1, 'rgba(240,201,78,0)')
  x.fillStyle = g
  x.fillRect(0, 0, 256, 256)
  glowCache = new THREE.CanvasTexture(c)
  return glowCache
}
