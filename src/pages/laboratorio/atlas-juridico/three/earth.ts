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
  // Gradiente oceânico profundo com variação de fossas e plataforma continental
  const g = x.createLinearGradient(0, 0, 0, 1024)
  g.addColorStop(0, '#0d223f')
  g.addColorStop(0.2, '#143864')
  g.addColorStop(0.38, '#1b4d8a')
  g.addColorStop(0.5, '#1e589c')
  g.addColorStop(0.62, '#1b4d8a')
  g.addColorStop(0.8, '#143864')
  g.addColorStop(1, '#0d223f')
  x.fillStyle = g
  x.fillRect(0, 0, 2048, 1024)

  // Correntes oceânicas e ondulações sutis de água
  for (let o = 0; o < 320; o++) {
    const cy = Math.random() * 1024
    const opacity = (0.015 + Math.random() * 0.035) * (1 - Math.abs(cy - 512) / 700)
    x.fillStyle = `rgba(100, 180, 255, ${opacity})`
    x.beginPath()
    x.ellipse(
      Math.random() * 2048,
      cy,
      35 + Math.random() * 140,
      5 + Math.random() * 14,
      Math.random() * 0.4 - 0.2,
      0,
      Math.PI * 2,
    )
    x.fill()
  }

  // Linhas de grade lat/lon cartográficas de alta precisão
  x.strokeStyle = 'rgba(217, 169, 44, 0.09)'
  x.lineWidth = 1.2
  for (let i = 1; i < 24; i++) {
    x.beginPath()
    x.moveTo((i * 2048) / 24, 0)
    x.lineTo((i * 2048) / 24, 1024)
    x.stroke()
  }
  for (let j = 1; j < 12; j++) {
    x.strokeStyle = j === 6 ? 'rgba(240, 201, 78, 0.16)' : 'rgba(217, 169, 44, 0.08)'
    x.lineWidth = j === 6 ? 1.8 : 1.0
    x.beginPath()
    x.moveTo(0, (j * 1024) / 12)
    x.lineTo(2048, (j * 1024) / 12)
    x.stroke()
  }

  // Função auxiliar para desenhar continentes com contornos geográficos precisos
  const drawPolygon = (pts: [number, number][], fill: string) => {
    x.fillStyle = fill
    x.beginPath()
    pts.forEach(([px, py], idx) => {
      if (idx === 0) x.moveTo(px, py)
      else x.lineTo(px, py)
    })
    x.closePath()
    x.fill()
  }

  // Paleta de relevo terrestre realista com tons cartográficos nobres
  const SHELF = 'rgba(40, 160, 225, 0.38)' // Plataforma costeira rasa turquesa
  const SHELF_DEEP = 'rgba(20, 85, 165, 0.45)'
  const LAND = '#bfa168'
  const LAND2 = '#a38446'
  const LAND3 = '#d4bb82'
  const HIGHLAND = '#8c6d32'

  // ==========================================
  // CONTORNOS GEOGRÁFICOS REAIS (Espaço 2048 x 1024)
  // X = ((lon + 180) / 360) * 2048 | Y = ((90 - lat) / 180) * 1024
  // ==========================================

  // 1. AMÉRICA DO SUL (incluindo Brasil com o saliente do Nordeste e a Bacia Amazônica)
  const southAmerica: [number, number][] = [
    [574, 460], // Panamá / Colômbia Norte
    [620, 442], // Punta Gallinas (Venezuela / Colômbia)
    [675, 455], // Caracas / Delta do Orinoco
    [735, 508], // Foz do Amazonas / Amapá
    [825, 545], // Cabo de São Roque / Recife (Nordeste brasileiro saliente)
    [805, 595], // Bahia / Salvador
    [775, 645], // Rio de Janeiro / Santos
    [725, 680], // Santa Catarina / Rio Grande do Sul
    [685, 715], // Montevidéu / Buenos Aires (Rio da Prata)
    [665, 770], // Patagônia Argentina
    [640, 825], // Terra do Fogo / Cabo Horn
    [615, 755], // Chile Sul / Fiordes
    [605, 680], // Chile Central / Valparaíso
    [570, 580], // Peru Sul / Arequipa
    [558, 532], // Punta Pariñas (Peru Norte)
    [566, 515], // Golfo de Guayaquil (Equador)
    [572, 475], // Colômbia Pacífico
  ]

  // 2. AMÉRICA DO NORTE E CENTRAL (Alaska, Canadá, EUA, Golfo do México, Califórnia)
  const northAmerica: [number, number][] = [
    [70, 145],   // Estreito de Bering / Alaska Oeste
    [135, 108],  // Point Barrow / Alaska Norte
    [240, 115],  // Mackenzie / Canadá Ártico
    [340, 155],  // Grande Lago dos Ursos / Territórios do Noroeste
    [480, 115],  // Ilhas Árticas
    [580, 165],  // Baía de Hudson Oeste
    [530, 240],  // Baía de Hudson Sul
    [610, 205],  // Labrador / Quebec
    [700, 235],  // Terra Nova / São Lourenço
    [650, 280],  // Nova Inglaterra / Boston
    [605, 310],  // Chesapeake / Nova York
    [565, 370],  // Flórida (Península sul)
    [520, 345],  // Golfo do México / Nova Orleans
    [480, 360],  // Texas / Rio Grande
    [515, 395],  // Península de Yucatán
    [540, 435],  // Honduras / Nicarágua
    [565, 455],  // Costa Rica / Panamá
    [510, 430],  // Guatemala / Chiapas
    [440, 410],  // México Pacífico / Acapulco
    [395, 375],  // Cabo San Lucas (Baja California)
    [355, 315],  // Baja Califórnia Norte / Tijuana
    [330, 290],  // Califórnia / San Francisco
    [315, 230],  // Seattle / Vancouver
    [230, 185],  // Golfo do Alaska
    [150, 195],  // Península do Alaska / Ilhas Aleutas
  ]

  // 3. EUROPA (Ibérica, França, Ilhas Britânicas, Escandinávia, Itália, Bálcãs)
  const europe: [number, number][] = [
    [968, 295],  // Cabo da Roca (Portugal / Espanha)
    [992, 308],  // Gibraltar
    [1020, 295], // Valência / Catalunha
    [1015, 250], // Golfo da Biscaia (França)
    [1025, 220], // Bretanha / Canal da Mancha
    [1080, 215], // Países Baixos / Dinamarca
    [1110, 155], // Noruega Fiordes
    [1165, 105], // Cabo Norte (Ártico)
    [1180, 150], // Finlândia / Mar Báltico
    [1200, 180], // São Petersburgo / Báltico Leste
    [1240, 230], // Ucrânia / Bacia do Dnieper
    [1220, 260], // Crimeia / Mar Negro
    [1155, 295], // Grécia / Atenas / Peloponeso
    [1105, 275], // Itália (Península da Bota)
    [1055, 255], // Costa Azul / Marselha
  ]

  // 4. ÁFRICA (Saara, Golfo da Guiné, Chifre da África, Cabo da Boa Esperança, Madagascar)
  const africa: [number, number][] = [
    [985, 312],  // Tânger / Marrocos
    [930, 400],  // Mauritânia
    [920, 430],  // Dakar / Senegal (Extremo Oeste)
    [965, 480],  // Libéria / Costa do Marfim
    [1035, 485], // Gana / Togo / Nigéria
    [1065, 520], // Camarões / Gabão
    [1085, 580], // Angola
    [1098, 640], // Namíbia
    [1130, 710], // Cabo da Boa Esperança (África do Sul)
    [1195, 685], // Durban / Moçambique Sul
    [1240, 600], // Moçambique / Beira
    [1255, 530], // Tanzânia / Zanzibar
    [1275, 480], // Quênia / Mombaça
    [1318, 445], // Chifre da África / Somália (Extremo Leste)
    [1270, 410], // Djibuti / Eritreia
    [1225, 370], // Mar Vermelho / Sudão / Egito
    [1185, 335], // Delta do Nilo / Alexandria
    [1110, 315], // Líbia / Trípoli
    [1085, 300], // Tunísia (Cap Bon)
    [1035, 310], // Argélia / Oran
  ]

  // 5. ÁSIA (Oriente Médio, Índia, Sudeste Asiático, China, Coreia, Sibéria, Kamchatka)
  const asia: [number, number][] = [
    [1225, 330], // Levante / Síria / Turquia
    [1280, 340], // Mesopotâmia / Golfo Pérsico
    [1295, 395], // Península Arábica (Omã / Iêmen)
    [1360, 350], // Irã / Paquistão
    [1410, 385], // Índia Oeste (Gujarat)
    [1465, 470], // Índia Sul (Cabo Comorim)
    [1525, 385], // Índia Leste (Kolkata / Delta do Ganges)
    [1580, 440], // Mianmar / Tailândia
    [1610, 485], // Malásia / Península Malaia
    [1650, 440], // Vietnã / Indochina
    [1685, 380], // Hong Kong / Cantão
    [1720, 335], // Xangai / Rio Yangtze
    [1745, 300], // Península da Coreia
    [1720, 240], // Manchúria / Vladivostok
    [1850, 210], // Mar de Okhotsk
    [1935, 190], // Península de Kamchatka
    [2015, 135], // Península de Chukchi / Estreito de Bering
    [1820, 110], // Sibéria Ártica Leste
    [1620, 100], // Península de Taimyr
    [1430, 105], // Nova Zembla / Sibéria Ocidental
    [1360, 170], // Montes Urais
    [1300, 240], // Cazaquistão / Mar Cáspio
  ]

  // 6. AUSTRÁLIA
  const australia: [number, number][] = [
    [1725, 600], // Kimberley / Noroeste australiano
    [1790, 575], // Golfo de Carpentária / Darwin
    [1840, 580], // Península de Cape York
    [1875, 640], // Queensland / Grande Barreira de Corais
    [1885, 700], // Sydney / Nova Gales do Sul
    [1840, 728], // Melbourne / Estreito de Bass
    [1775, 730], // Grande Baía Australiana
    [1685, 695], // Perth / Sudoeste
    [1675, 640], // Costa Oeste Australiana
  ]

  // 7. GROENLÂNDIA
  const greenland: [number, number][] = [
    [760, 105],
    [870, 95],
    [910, 140],
    [860, 195],
    [790, 230],
    [735, 180],
  ]

  // 8. ANTÁRTIDA (Polo Sul e Península Antártica apontando para América do Sul)
  const antarctica: [number, number][] = [
    [0, 920],
    [400, 910],
    [620, 855],  // Península Antártica
    [660, 890],
    [900, 915],
    [1400, 910],
    [1800, 905],
    [2048, 920],
    [2048, 1024],
    [0, 1024],
  ]

  const allContinents = [
    southAmerica,
    northAmerica,
    europe,
    africa,
    asia,
    australia,
    greenland,
    antarctica,
  ]

  // Camada 1: Plataforma costeira rasa (turquesa oceânica realista ao redor da costa)
  x.lineJoin = 'round'
  x.lineWidth = 26
  x.strokeStyle = SHELF_DEEP
  allContinents.forEach((poly) => {
    x.beginPath()
    poly.forEach(([px, py], idx) => {
      if (idx === 0) x.moveTo(px, py)
      else x.lineTo(px, py)
    })
    x.closePath()
    x.stroke()
  })

  x.lineWidth = 14
  x.strokeStyle = SHELF
  allContinents.forEach((poly) => {
    x.beginPath()
    poly.forEach(([px, py], idx) => {
      if (idx === 0) x.moveTo(px, py)
      else x.lineTo(px, py)
    })
    x.closePath()
    x.fill()
    x.stroke()
  })

  // Camada 2: Sombra sutil de relevo costeiro
  x.save()
  x.translate(3, 4)
  allContinents.forEach((poly) => drawPolygon(poly, 'rgba(5, 16, 32, 0.45)'))
  x.restore()

  // Camada 3: Solo dos continentes (Formato real)
  allContinents.forEach((poly) => drawPolygon(poly, LAND))

  // Camada 4: Relevo interno e planaltos dourados
  allContinents.forEach((poly) => {
    x.save()
    x.beginPath()
    poly.forEach(([px, py], idx) => {
      if (idx === 0) x.moveTo(px, py)
      else x.lineTo(px, py)
    })
    x.closePath()
    x.clip()

    // Gradiente de relevo e cordilheiras internas
    const cx = poly.reduce((acc, p) => acc + p[0], 0) / poly.length
    const cy = poly.reduce((acc, p) => acc + p[1], 0) / poly.length

    const grad = x.createRadialGradient(cx, cy, 10, cx, cy, 180)
    grad.addColorStop(0, LAND3)
    grad.addColorStop(0.6, LAND2)
    grad.addColorStop(1, LAND)
    x.fillStyle = grad
    x.fill()

    x.restore()
  })

  // Grandes ilhas do mundo: Grã-Bretanha, Japão, Madagascar, Indonésia, Nova Zelândia, Cuba
  const majorIslands: { center: [number, number]; rx: number; ry: number; rot: number }[] = [
    { center: [1005, 205], rx: 22, ry: 38, rot: -0.3 }, // Grã-Bretanha
    { center: [970, 215], rx: 14, ry: 20, rot: -0.2 },  // Irlanda
    { center: [1295, 625], rx: 24, ry: 65, rot: 0.35 }, // Madagascar
    { center: [1810, 310], rx: 16, ry: 50, rot: 0.6 },  // Honshu (Japão)
    { center: [1825, 255], rx: 20, ry: 22, rot: 0.1 },  // Hokkaido
    { center: [1610, 520], rx: 42, ry: 18, rot: -0.5 }, // Sumatra
    { center: [1670, 560], rx: 45, ry: 14, rot: 0.1 },  // Java
    { center: [1690, 500], rx: 32, ry: 35, rot: 0 },    // Bornéu
    { center: [1765, 520], rx: 55, ry: 28, rot: -0.1 }, // Papua Nova Guiné
    { center: [2010, 745], rx: 14, ry: 40, rot: -0.4 }, // Nova Zelândia
    { center: [520, 385], rx: 38, ry: 12, rot: -0.25 }, // Cuba
    { center: [1115, 280], rx: 15, ry: 12, rot: 0 },    // Sicília
    { center: [1100, 110], rx: 30, ry: 18, rot: 0 },    // Islândia
  ]

  majorIslands.forEach(({ center: [ix, iy], rx, ry, rot }) => {
    // Brilho de plataforma rasa
    x.fillStyle = SHELF
    x.beginPath()
    x.ellipse(ix, iy, rx * 1.45, ry * 1.35, rot, 0, Math.PI * 2)
    x.fill()
    // Solo da ilha
    x.fillStyle = LAND
    x.beginPath()
    x.ellipse(ix, iy, rx, ry, rot, 0, Math.PI * 2)
    x.fill()
    // Núcleo
    x.fillStyle = LAND3
    x.beginPath()
    x.ellipse(ix, iy, rx * 0.6, ry * 0.6, rot, 0, Math.PI * 2)
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

  // Faixas atmosféricas tropicais e subtropicais sutis e translúcidas
  for (let b = 0; b < 4; b++) {
    const cy = 50 + b * 45
    for (let s = 0; s < 14; s++) {
      const cx = (s * W) / 14 + Math.sin(s + b) * 14
      const r = 12 + Math.random() * 18
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r)
      g.addColorStop(0, 'rgba(255,255,255,0.32)')
      g.addColorStop(0.5, 'rgba(255,255,255,0.12)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      x.fillStyle = g
      x.beginPath()
      x.ellipse(cx, cy, r * 2.0, r * 0.55, 0.12 * Math.sin(b), 0, Math.PI * 2)
      x.fill()
    }
  }

  // Cúmulos e cirros dispersos leves (para não cobrir os continentes)
  for (let i = 0; i < 90; i++) {
    const cx = Math.random() * W
    const cy = 25 + Math.random() * (H - 50)
    const r = 5 + Math.random() * 15
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(255,255,255,0.40)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.15)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g
    x.beginPath()
    x.ellipse(cx, cy, r * 1.6, r * 0.45, (Math.random() - 0.5) * 0.3, 0, Math.PI * 2)
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
