import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { MARKERS } from '../data/article5'
import { cloudTexture, earthTexture, glowDiscTexture, latLon, starSpriteTexture } from '../three/earth'
import PlanetNav from './PlanetNav'
import type { QualityConfig } from '../hooks/useAdaptiveQuality'
import type { FocusRequest, FunctionId } from '../types'

const R = 1.6
const CAM_TARGET = new THREE.Vector3(0, -0.68, 0)
const SEGMENT_LENGTH = 603.19 / 5

interface AtlasGlobeProps {
  focusRequest: FocusRequest | null
  onFocusDone: (id: FunctionId) => void
  onMarkerClick: (id: FunctionId, el: HTMLElement) => void
  pulseId: FunctionId | null
  progressSegments: boolean[]
  progressPct: number
  reducedMotion: boolean
  currentArticle: number
  onTravel: (target: number) => void
  config: QualityConfig
  dprCap: number
}

function buildFingerGroup(
  angleDeg: number,
  tubeR: number,
  tipY: number,
  reach: number,
  material: THREE.Material,
  nailMaterial: THREE.Material,
): THREE.Group {
  const grp = new THREE.Group()
  const a = (angleDeg * Math.PI) / 180
  const dx = Math.sin(a)
  const dz = Math.cos(a)
  const P = (rad: number, y: number, zOff = 0) =>
    new THREE.Vector3(dx * rad, y, dz * rad + zOff)

  const points = [
    P(0.42, -1.6),
    P(0.95, -1.52),
    P(1.38, -1.28),
    P(reach, -0.92),
    P(reach + 0.03, -0.52),
    P(reach - 0.1, tipY),
  ]
  const curve = new THREE.CatmullRomCurve3(points)
  const knuckle = points[3]
  const tip = points[5]

  // Tubo do dedo
  const tubeGeo = new THREE.TubeGeometry(curve, 12, tubeR, 8, false)
  const tubeMesh = new THREE.Mesh(tubeGeo, material)
  grp.add(tubeMesh)

  // Articulação (knuckle)
  const knuckleGeo = new THREE.SphereGeometry(tubeR * 1.18, 12, 12)
  const knuckleMesh = new THREE.Mesh(knuckleGeo, material)
  knuckleMesh.position.copy(knuckle)
  grp.add(knuckleMesh)

  // Ponta
  const tipGeo = new THREE.SphereGeometry(tubeR * 1.02, 12, 12)
  const tipMesh = new THREE.Mesh(tipGeo, material)
  tipMesh.position.copy(tip)
  grp.add(tipMesh)

  // Unha dourada
  const nailGeo = new THREE.SphereGeometry(tubeR * 0.72, 10, 10)
  const nailMesh = new THREE.Mesh(nailGeo, nailMaterial)
  nailMesh.position.set(
    tip.x + Math.sin(a) * tubeR * 0.55,
    tip.y + 0.012,
    tip.z + Math.cos(a) * tubeR * 0.55,
  )
  nailMesh.scale.set(1, 0.55, 1.25)
  grp.add(nailMesh)

  return grp
}

function buildThemisHand(glowTex: THREE.Texture): THREE.Group {
  const hand = new THREE.Group()

  const statueMat = new THREE.MeshStandardMaterial({
    color: 0xd8b36a,
    metalness: 0.88,
    roughness: 0.3,
  })
  const statueDarkMat = new THREE.MeshStandardMaterial({
    color: 0xa87f35,
    metalness: 0.85,
    roughness: 0.42,
  })
  const nailMat = new THREE.MeshStandardMaterial({
    color: 0xf3e2b3,
    metalness: 0.6,
    roughness: 0.25,
  })
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd9a92c,
    metalness: 0.9,
    roughness: 0.28,
  })
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0x9a7420,
    metalness: 0.85,
    roughness: 0.38,
  })
  const gemMat = new THREE.MeshStandardMaterial({
    color: 0xb3352c,
    metalness: 0.3,
    roughness: 0.12,
    emissive: 0x4d0d08,
    emissiveIntensity: 0.7,
  })

  // Palma principal
  const palm1 = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), statueMat)
  palm1.position.set(0, -1.66, -0.08)
  palm1.scale.set(1.18, 0.4, 1.02)
  hand.add(palm1)

  // Base da palma
  const palm2 = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 18), statueMat)
  palm2.position.set(0, -1.82, -0.28)
  palm2.scale.set(1.05, 0.5, 0.9)
  hand.add(palm2)

  // 5 Dedos esculpidos em bronze sustentando a terra
  hand.add(buildFingerGroup(-50, 0.135, -0.34, 1.56, statueMat, nailMat))
  hand.add(buildFingerGroup(-17, 0.155, -0.1, 1.58, statueMat, nailMat))
  hand.add(buildFingerGroup(16, 0.16, -0.04, 1.58, statueMat, nailMat))
  hand.add(buildFingerGroup(49, 0.145, -0.26, 1.56, statueMat, nailMat))
  hand.add(buildFingerGroup(112, 0.17, -0.62, 1.5, statueMat, nailMat))

  // Pulso
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.58, 1.05, 24), statueMat)
  wrist.position.set(0, -2.28, -0.52)
  wrist.rotation.set(0.5, 0, 0)
  hand.add(wrist)

  // Pulseira de ouro superior
  const b1 = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.055, 12, 32), goldMat)
  b1.position.set(0, -2.14, -0.4)
  b1.rotation.set(Math.PI / 2 - 0.5, 0, 0)
  hand.add(b1)

  // Pulseira de bronze
  const b2 = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.035, 12, 32), bronzeMat)
  b2.position.set(0, -2.3, -0.47)
  b2.rotation.set(Math.PI / 2 - 0.5, 0, 0)
  hand.add(b2)

  // Rubi cravado no bracelete
  const ruby = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), gemMat)
  ruby.position.set(0, -2.08, 0.14)
  ruby.scale.set(1, 0.8, 1)
  hand.add(ruby)

  // Manga da toga da deusa da justiça
  const toga = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.02, 0.9, 24, 1, true), statueDarkMat)
  toga.position.set(0, -2.82, -0.72)
  toga.rotation.set(0.5, 0, 0)
  hand.add(toga)

  // Borda inferior da toga em ouro
  const togaRim = new THREE.Mesh(new THREE.TorusGeometry(0.99, 0.045, 12, 32), goldMat)
  togaRim.position.set(0, -3.12, -0.92)
  togaRim.rotation.set(Math.PI / 2 - 0.5, 0, 0)
  hand.add(togaRim)

  // Disco de luz dourada no pedestal
  const glowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 4.6),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false }),
  )
  glowPlane.position.set(0, -2.92, 0)
  glowPlane.rotation.set(-Math.PI / 2, 0, 0)
  hand.add(glowPlane)

  return hand
}

export default function AtlasGlobe({
  focusRequest,
  onFocusDone,
  onMarkerClick,
  pulseId,
  progressSegments,
  progressPct,
  reducedMotion,
  currentArticle,
  onTravel,
  config,
  dprCap,
}: AtlasGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const markerEls = useRef<Partial<Record<FunctionId, HTMLButtonElement | null>>>({})
  const [ready, setReady] = useState(false)
  const [webglFailed, setWebglFailed] = useState(false)

  // Rastreamento de interação e coordenadas esféricas
  const sphericalRef = useRef({ theta: 0.25, phi: 1.32, radius: 6.4 })
  const targetRef = useRef({ theta: 0.25, phi: 1.32, radius: 6.4 })
  const baseRadiusRef = useRef(6.4)
  const lastInteractRef = useRef(0)
  const draggingRef = useRef(false)
  const boostUntilRef = useRef(0)
  const focusTweenRef = useRef<gsap.core.Tween | null>(null)

  // Referências Three.js para o loop
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  // Mesh refs para animação dentro do requestAnimationFrame
  const globeRef = useRef<THREE.Group | null>(null)
  const wireRef = useRef<THREE.Mesh | null>(null)
  const cloudsRef = useRef<THREE.Mesh | null>(null)
  const handRef = useRef<THREE.Group | null>(null)
  const ringGroupRef = useRef<THREE.Group | null>(null)
  const ring1Ref = useRef<THREE.Mesh | null>(null)
  const atmoRef = useRef<THREE.Mesh | null>(null)
  const atmoGoldRef = useRef<THREE.Mesh | null>(null)
  const starFarRef = useRef<THREE.Points | null>(null)
  const starNearRef = useRef<THREE.Points | null>(null)
  const dustRef = useRef<THREE.Points | null>(null)
  const riseDustRef = useRef<{ points: THREE.Points; data: { pos: Float32Array; speed: Float32Array; reset: (i: number, rnd: boolean) => void } } | null>(null)
  const haloRef = useRef<THREE.Sprite | null>(null)
  const glintRef = useRef<THREE.PointLight | null>(null)
  const brazilRingRef = useRef<THREE.Mesh | null>(null)
  const brazilGlowRef = useRef<THREE.Sprite | null>(null)
  const planeOrbitRef = useRef<THREE.Group | null>(null)
  const planeRef = useRef<THREE.Group | null>(null)
  const linkRef = useRef<THREE.Line | null>(null)
  const haloDotsRef = useRef<(THREE.Mesh | null)[]>([])

  // Posições estáticas pré-calculadas
  const markerPos = useMemo(() => MARKERS.map((m) => latLon(m.lat, m.lon, R * 1.01)), [])
  const brazil = useMemo(
    () => ({
      ring: latLon(-14, -52, R * 1.03),
      dot: latLon(-14, -52, R * 1.02),
      glow: latLon(-14, -52, R * 1.06),
      pos: latLon(-14, -52, R * 1.03),
    }),
    [],
  )
  const brazilRingQuat = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        brazil.ring.clone().normalize(),
      ),
    [brazil],
  )

  // Setup Vanilla Three.js
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: config.antialias,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      setWebglFailed(true)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap))
    renderer.setClearColor(0x000000, 0)
    rendererRef.current = renderer

    const width = container.clientWidth || 400
    const height = container.clientHeight || 400
    renderer.setSize(width, height)

    const camera = new THREE.PerspectiveCamera(42, width / Math.max(height, 1), 0.1, 100)
    camera.position.set(0.6, 0.9, 4.6)
    cameraRef.current = camera

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0x8fb4e8, 0.7)
    scene.add(ambientLight)

    const hemiLight = new THREE.HemisphereLight(0xbcd6ff, 0x2a1f08, 0.55)
    scene.add(hemiLight)

    const dir1 = new THREE.DirectionalLight(0xfff1cf, 1.9)
    dir1.position.set(4, 2.5, 3.5)
    scene.add(dir1)

    const dir2 = new THREE.DirectionalLight(0xd9a92c, 1.1)
    dir2.position.set(-4, -1.5, -3)
    scene.add(dir2)

    const dir3 = new THREE.DirectionalLight(0x6aa6e8, 0.5)
    dir3.position.set(-3, 1.5, 4)
    scene.add(dir3)

    const pointLight = new THREE.PointLight(0xf0c94e, 1.5, 9, 1.6)
    pointLight.position.set(0, -2.1, 1.1)
    scene.add(pointLight)

    const glintLight = new THREE.PointLight(0xffe9a8, 1.3, 13, 1.4)
    glintRef.current = glintLight
    scene.add(glintLight)

    // Texturas
    const earthTex = earthTexture()
    const cloudTex = cloudTexture()
    const starTex = starSpriteTexture()
    const glowTex = glowDiscTexture()

    // 1. Globo e Marcadores
    const globeGroup = new THREE.Group()
    globeRef.current = globeGroup
    scene.add(globeGroup)

    const [ew, eh] = config.earthSegments
    const earthGeo = new THREE.SphereGeometry(R, ew, eh)
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.36,
      metalness: 0.2,
      emissive: 0x0a1a30,
      emissiveIntensity: 0.35,
    })
    const earthMesh = new THREE.Mesh(earthGeo, earthMat)
    globeGroup.add(earthMesh)

    const wireGeo = new THREE.SphereGeometry(R * 1.012, 24, 16)
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x9fc2ee, wireframe: true, transparent: true, opacity: 0.07 })
    const wireMesh = new THREE.Mesh(wireGeo, wireMat)
    wireRef.current = wireMesh
    globeGroup.add(wireMesh)

    if (config.clouds) {
      const cloudsGeo = new THREE.SphereGeometry(R * 1.025, 32, 24)
      const cloudsMat = new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, opacity: 0.75, depthWrite: false, roughness: 1 })
      const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat)
      cloudsRef.current = cloudsMesh
      globeGroup.add(cloudsMesh)
    }

    // Brasil aceso
    const brRingGeo = new THREE.RingGeometry(0.085, 0.125, 40)
    const brRingMat = new THREE.MeshBasicMaterial({ color: 0xf0c94e, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })
    const brRingMesh = new THREE.Mesh(brRingGeo, brRingMat)
    brRingMesh.position.copy(brazil.ring)
    brRingMesh.quaternion.copy(brazilRingQuat)
    brazilRingRef.current = brRingMesh
    globeGroup.add(brRingMesh)

    const brDotGeo = new THREE.SphereGeometry(0.032, 14, 14)
    const brDotMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 })
    const brDotMesh = new THREE.Mesh(brDotGeo, brDotMat)
    brDotMesh.position.copy(brazil.dot)
    globeGroup.add(brDotMesh)

    const brGlowMat = new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, color: 0xf0c94e, opacity: 0.75 })
    const brGlowSprite = new THREE.Sprite(brGlowMat)
    brGlowSprite.position.copy(brazil.glow)
    brGlowSprite.scale.set(0.55, 0.55, 1)
    brazilGlowRef.current = brGlowSprite
    globeGroup.add(brGlowSprite)

    // Pontos dourados dos marcadores
    MARKERS.forEach((m, i) => {
      const p = markerPos[i]
      const grp = new THREE.Group()

      const dMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), new THREE.MeshBasicMaterial({ color: 0xf0c94e }))
      dMesh.position.copy(p)
      grp.add(dMesh)

      const hMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xf0c94e, transparent: true, opacity: 0.3, depthWrite: false }),
      )
      hMesh.position.copy(p)
      haloDotsRef.current[i] = hMesh
      grp.add(hMesh)

      globeGroup.add(grp)
    })

    // 2. Atmosfera
    const atmoGeo = new THREE.SphereGeometry(R * 1.16, 32, 24)
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x3f7fd1, transparent: true, opacity: 0.13, side: THREE.BackSide, depthWrite: false })
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat)
    atmoRef.current = atmoMesh
    scene.add(atmoMesh)

    const atmoGoldGeo = new THREE.SphereGeometry(R * 1.07, 32, 24)
    const atmoGoldMat = new THREE.MeshBasicMaterial({ color: 0xf0c94e, transparent: true, opacity: 0.05, side: THREE.BackSide, depthWrite: false })
    const atmoGoldMesh = new THREE.Mesh(atmoGoldGeo, atmoGoldMat)
    atmoGoldRef.current = atmoGoldMesh
    scene.add(atmoGoldMesh)

    // 3. Mão de Têmis
    const handGroup = buildThemisHand(glowTex)
    handRef.current = handGroup
    scene.add(handGroup)

    // 4. Astrolábio
    const ringGrp = new THREE.Group()
    ringGroupRef.current = ringGrp
    const r1Geo = new THREE.TorusGeometry(R * 1.24, 0.014, 12, 128)
    const r1Mat = new THREE.MeshStandardMaterial({ color: 0xd9a92c, metalness: 0.9, roughness: 0.28 })
    const r1Mesh = new THREE.Mesh(r1Geo, r1Mat)
    r1Mesh.rotation.set(Math.PI / 2.25, 0.35, 0)
    ring1Ref.current = r1Mesh
    ringGrp.add(r1Mesh)
    scene.add(ringGrp)

    // 5. Estrelas e Poeira
    const makeStarGeo = (count: number, rMin: number, rMax: number) => {
      const geo = new THREE.BufferGeometry()
      const arr = new Float32Array(count * 3)
      for (let s = 0; s < count; s++) {
        const v = new THREE.Vector3().randomDirection().multiplyScalar(rMin + Math.random() * (rMax - rMin))
        arr[s * 3] = v.x
        arr[s * 3 + 1] = v.y
        arr[s * 3 + 2] = v.z
      }
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
      return geo
    }

    const starFarPts = new THREE.Points(
      makeStarGeo(config.starFar, 13, 24),
      new THREE.PointsMaterial({ size: 0.2, map: starTex, transparent: true, depthWrite: false, color: 0xcfe0f5, opacity: 0.85 }),
    )
    starFarRef.current = starFarPts
    scene.add(starFarPts)

    const starNearPts = new THREE.Points(
      makeStarGeo(config.starNear, 7.5, 11),
      new THREE.PointsMaterial({ size: 0.3, map: starTex, transparent: true, depthWrite: false, color: 0xffe9a8, opacity: 0.9 }),
    )
    starNearRef.current = starNearPts
    scene.add(starNearPts)

    const dustGeo = new THREE.BufferGeometry()
    const dustArr = new Float32Array(130 * 3)
    for (let d = 0; d < 130; d++) {
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * 6.4,
        (Math.random() - 0.5) * 6.8 - 0.4,
        (Math.random() - 0.5) * 6.4,
      )
      if (v.length() < 2.15) v.setLength(2.15 + Math.random())
      dustArr[d * 3] = v.x
      dustArr[d * 3 + 1] = v.y
      dustArr[d * 3 + 2] = v.z
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustArr, 3))
    const dustPts = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({ size: 0.09, map: starTex, transparent: true, depthWrite: false, color: 0xf0c94e, opacity: 0.85 }),
    )
    dustRef.current = dustPts
    scene.add(dustPts)

    // Poeira Dourada Ascendente (RiseDust)
    if (config.dust && !reducedMotion) {
      const count = config.dustCount
      const pos = new Float32Array(count * 3)
      const speed = new Float32Array(count)
      const reset = (i: number, randomY: boolean) => {
        const ang = Math.random() * Math.PI * 2
        const rad = 0.35 + Math.random() * 1.9
        pos[i * 3] = Math.cos(ang) * rad
        pos[i * 3 + 1] = randomY ? -2.7 + Math.random() * 5.2 : -2.7 + Math.random() * 0.5
        pos[i * 3 + 2] = Math.sin(ang) * rad
        speed[i] = 0.2 + Math.random() * 0.45
      }
      for (let i = 0; i < count; i++) reset(i, true)
      const rdGeo = new THREE.BufferGeometry()
      rdGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const rdPts = new THREE.Points(
        rdGeo,
        new THREE.PointsMaterial({ size: 0.075, map: starTex, transparent: true, depthWrite: false, color: 0xffd95e, opacity: 0.9 }),
      )
      riseDustRef.current = { points: rdPts, data: { pos, speed, reset } }
      scene.add(rdPts)
    }

    // Halo luminoso respirando atrás do globo
    if (config.halo) {
      const hMat = new THREE.SpriteMaterial({ map: starTex, transparent: true, depthWrite: false, color: 0xf0c94e, opacity: 0.65 })
      const hSpr = new THREE.Sprite(hMat)
      hSpr.position.set(0, -0.4, -2.6)
      hSpr.scale.set(8.6, 8.6, 1)
      haloRef.current = hSpr
      scene.add(hSpr)
    }

    // Avião em órbita com linha de voo
    let linkLineObj: THREE.Line | null = null
    const linkGeo = new THREE.BufferGeometry()
    linkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(21 * 3), 3))

    if (config.plane) {
      const orbitPts: THREE.Vector3[] = []
      for (let i = 0; i <= 90; i++) {
        const a = (i / 90) * Math.PI * 2
        orbitPts.push(new THREE.Vector3(Math.cos(a) * 2.85, 0, Math.sin(a) * 2.85))
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPts)
      const orbitLine = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: 0xf0c94e, transparent: true, opacity: 0.22 }))

      const planeOrbit = new THREE.Group()
      planeOrbit.rotation.set(-0.85, 0, -0.3)
      planeOrbit.add(orbitLine)
      planeOrbitRef.current = planeOrbit

      const planeGrp = new THREE.Group()
      const planeFus = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.02, 0.36, 12), new THREE.MeshStandardMaterial({ color: 0xf3e9d2, metalness: 0.35, roughness: 0.45 }))
      planeFus.rotation.set(Math.PI / 2, 0, 0)
      planeGrp.add(planeFus)

      const planeNose = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf3e9d2, metalness: 0.35, roughness: 0.45 }))
      planeNose.position.set(0, 0, 0.18)
      planeGrp.add(planeNose)

      const planeWing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.09), new THREE.MeshStandardMaterial({ color: 0xd9a92c, metalness: 0.9, roughness: 0.28 }))
      planeWing.position.set(0, 0, 0.03)
      planeGrp.add(planeWing)

      const planeTail = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.01, 0.06), new THREE.MeshStandardMaterial({ color: 0xd9a92c, metalness: 0.9, roughness: 0.28 }))
      planeTail.position.set(0, 0, -0.17)
      planeGrp.add(planeTail)

      const planeFin = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.07, 0.06), new THREE.MeshStandardMaterial({ color: 0xd9a92c, metalness: 0.9, roughness: 0.28 }))
      planeFin.position.set(0, 0.035, -0.17)
      planeGrp.add(planeFin)

      planeRef.current = planeGrp
      planeOrbit.add(planeGrp)
      scene.add(planeOrbit)

      linkLineObj = new THREE.Line(linkGeo, new THREE.LineBasicMaterial({ color: 0xffd95e, transparent: true, opacity: 0.55 }))
      linkRef.current = linkLineObj
      scene.add(linkLineObj)
    }

    setReady(true)

    // Ajuste de raio base inicial
    const updateSize = () => {
      if (!container || !renderer || !camera) return
      const w = container.clientWidth
      const h = container.clientHeight
      if (w < 2 || h < 2) return
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()

      const a = w / Math.max(h, 1)
      let r = a < 0.75 ? 7.5 : a < 1.05 ? 6.5 : 5.8
      if (a >= 1.05 && h < 560) r = 6.7
      sphericalRef.current.radius = r
      targetRef.current.radius = r
      baseRadiusRef.current = r
    }
    updateSize()

    const ro = new ResizeObserver(updateSize)
    ro.observe(container)

    // Controles por toque e mouse
    const pointers = new Map<number, { x: number; y: number }>()
    let lastX = 0
    let lastY = 0
    let pinchDist = 0

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (pointers.size === 1) {
        draggingRef.current = true
        lastX = e.clientX
        lastY = e.clientY
      }
      if (pointers.size === 2) {
        const arr = [...pointers.values()]
        pinchDist = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y)
      }
      lastInteractRef.current = performance.now()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      lastInteractRef.current = performance.now()

      if (pointers.size === 2) {
        const arr = [...pointers.values()]
        const d = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y)
        if (pinchDist > 0) {
          targetRef.current.radius = THREE.MathUtils.clamp(
            targetRef.current.radius - (d - pinchDist) * 0.008,
            3.1,
            9.2,
          )
        }
        pinchDist = d
        return
      }

      if (!draggingRef.current) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      targetRef.current.theta -= dx * 0.0055
      targetRef.current.phi = THREE.MathUtils.clamp(targetRef.current.phi - dy * 0.0055, 0.25, Math.PI - 0.25)
    }

    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId)
      if (pointers.size === 0) draggingRef.current = false
      lastInteractRef.current = performance.now()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      targetRef.current.radius = THREE.MathUtils.clamp(targetRef.current.radius + e.deltaY * 0.0035, 3.1, 9.2)
      lastInteractRef.current = performance.now()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Vetores temporários pré-alocados para o loop
    const v3 = new THREE.Vector3()
    const posNorm = new THREE.Vector3()
    const camDir = new THREE.Vector3()
    const mid = new THREE.Vector3()
    const bw = new THREE.Vector3()
    const tw = new THREE.Vector3()
    const centerVec = new THREE.Vector3()
    const sphObj = new THREE.Spherical(6.4, 1.32, 0.25)
    const linkCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3())
    const linkPts = Array.from({ length: 21 }, () => new THREE.Vector3())

    // Loop de Animação
    let animId: number
    let lastTime = performance.now()
    let isVisible = true

    const onVisibilityChange = () => {
      isVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate)
      if (!isVisible) return

      const delta = Math.min((currentTime - lastTime) / 1000, 0.05)
      lastTime = currentTime
      const nowMs = currentTime
      const t = currentTime / 1000

      const sph = sphericalRef.current
      const tgt = targetRef.current

      // Auto rotação suave quando inativo
      if (!draggingRef.current && nowMs - lastInteractRef.current > 2500 && !reducedMotion) {
        tgt.theta += 0.0016
      }
      if (nowMs < boostUntilRef.current && !reducedMotion) {
        tgt.theta += 0.02
      }

      // Interpolação suave independente de framerate
      const k = 1 - Math.pow(0.001, delta)
      sph.theta += (tgt.theta - sph.theta) * k
      sph.phi += (tgt.phi - sph.phi) * k
      sph.radius += (tgt.radius - sph.radius) * k

      sphObj.radius = sph.radius
      sphObj.phi = sph.phi
      sphObj.theta = sph.theta
      camera.position.setFromSpherical(sphObj).add(CAM_TARGET)
      camera.lookAt(CAM_TARGET)

      const globeY = globeRef.current?.position.y ?? 0

      // Animações rotacionais
      if (wireRef.current) wireRef.current.rotation.y = t * 0.01
      if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.016
      if (ringGroupRef.current) ringGroupRef.current.rotation.y = t * 0.02
      if (ring1Ref.current) ring1Ref.current.rotation.y = t * 0.14
      if (dustRef.current) dustRef.current.rotation.y = t * 0.012
      if (starFarRef.current) starFarRef.current.rotation.y = -sph.theta * 0.05 + t * 0.0022
      if (starNearRef.current) {
        starNearRef.current.rotation.y = -sph.theta * 0.13 + t * 0.004
        starNearRef.current.rotation.x = -sph.phi * 0.03
      }

      // Poeira subindo
      if (riseDustRef.current) {
        const rd = riseDustRef.current
        const arr = rd.points.geometry.getAttribute('position').array as Float32Array
        const count = rd.data.speed.length
        for (let i = 0; i < count; i++) {
          const y = arr[i * 3 + 1] + rd.data.speed[i] * delta
          if (y > 2.6) {
            rd.data.reset(i, false)
            arr[i * 3] = rd.data.pos[i * 3]
            arr[i * 3 + 1] = rd.data.pos[i * 3 + 1]
            arr[i * 3 + 2] = rd.data.pos[i * 3 + 2]
          } else {
            arr[i * 3 + 1] = y
            arr[i * 3] += Math.sin(t * 0.9 + i * 1.7) * 0.1 * delta
          }
        }
        rd.points.geometry.getAttribute('position').needsUpdate = true
      }

      // Halo pulsante
      if (haloRef.current) {
        const breathe = 0.5 + 0.5 * Math.sin(t * 0.55)
        haloRef.current.material.opacity = 0.45 + 0.3 * breathe
        const s = 8.3 + 0.55 * breathe
        haloRef.current.scale.set(s, s, 1)
        mid.copy(camera.position).sub(CAM_TARGET).normalize()
        haloRef.current.position.copy(CAM_TARGET).addScaledVector(mid, -3.1)
        haloRef.current.position.y += globeY - 0.3
      }

      // Luz glint
      if (glintRef.current) {
        glintRef.current.position.set(
          Math.cos(t * 0.35) * 3.6,
          1.7 + Math.sin(t * 0.5) * 0.7,
          Math.sin(t * 0.35) * 3.6,
        )
      }

      // Ponto do Brasil pulsante
      if (brazilRingRef.current) {
        brazilRingRef.current.scale.setScalar(1 + 0.28 * Math.sin(t * 2))
        ;(brazilRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.35 * Math.sin(t * 2)
      }
      if (brazilGlowRef.current) {
        brazilGlowRef.current.material.opacity = 0.5 + 0.35 * Math.sin(t * 2)
      }

      // Avião em órbita
      if (planeRef.current && planeOrbitRef.current) {
        const planeA = -t * 0.24 + 2.4
        planeRef.current.position.set(Math.cos(planeA) * 2.85, 0, Math.sin(planeA) * 2.85)
        planeRef.current.rotation.y = -planeA + Math.PI
        if (linkRef.current) {
          bw.copy(brazil.pos)
          bw.y += globeY
          planeRef.current.getWorldPosition(tw)
          mid.copy(bw).add(tw).multiplyScalar(0.5)
          const lift = bw.distanceTo(tw) * 0.22 + 0.25
          mid.normalize().multiplyScalar(mid.length() + lift)
          linkCurve.v0.copy(bw)
          linkCurve.v1.copy(mid)
          linkCurve.v2.copy(tw)
          const attr = linkGeo.getAttribute('position') as THREE.BufferAttribute
          for (let i = 0; i < 21; i++) {
            linkCurve.getPoint(i / 20, linkPts[i])
            attr.setXYZ(i, linkPts[i].x, linkPts[i].y, linkPts[i].z)
          }
          attr.needsUpdate = true
        }
      }

      // Respiração do conjunto 3D
      if (!reducedMotion) {
        const bob = Math.sin(t * 0.55) * 0.045
        if (globeRef.current) globeRef.current.position.y = bob
        if (cloudsRef.current) cloudsRef.current.position.y = bob
        if (atmoRef.current) atmoRef.current.position.y = bob
        if (atmoGoldRef.current) atmoGoldRef.current.position.y = bob
        if (ringGroupRef.current) ringGroupRef.current.position.y = bob
        if (handRef.current) handRef.current.position.y = bob * 0.45
      }

      // Projeção dos Marcadores DOM na tela
      const w = container.clientWidth
      const h = container.clientHeight
      camDir.copy(camera.position).sub(CAM_TARGET).normalize()
      const camDist = camera.position.distanceTo(CAM_TARGET)
      const radiusPx = (R * h) / (2 * Math.tan(THREE.MathUtils.degToRad(21)) * camDist)
      centerVec.set(0, globeY, 0).project(camera)
      const cx = (centerVec.x * 0.5 + 0.5) * w
      const cy = (-centerVec.y * 0.5 + 0.5) * h

      MARKERS.forEach((m, i) => {
        const chip = markerEls.current[m.id]
        if (!chip) return
        const halo = haloDotsRef.current[i]
        if (halo) halo.scale.setScalar(1 + 0.25 * Math.sin(t * 2.4 + i))

        const pos = markerPos[i]
        v3.copy(pos)
        v3.y += globeY
        v3.project(camera)
        posNorm.copy(pos).normalize()
        const facing = posNorm.dot(camDir)
        let sx = (v3.x * 0.5 + 0.5) * w
        let sy = (-v3.y * 0.5 + 0.5) * h
        const behind = facing < 0.18

        if (behind) {
          const dx = sx - cx
          const dy = sy - cy
          const len = Math.hypot(dx, dy) || 1
          sx = cx + (dx / len) * (radiusPx + 4)
          sy = cy + (dy / len) * (radiusPx + 4)
        }

        const hw = (chip.offsetWidth || 90) / 2
        const hh = (chip.offsetHeight || 36) / 2
        sx = Math.max(hw + 4, Math.min(w - hw - 4, sx))
        sy = Math.max(hh + 4, Math.min(h - hh - 34, sy))

        chip.style.left = `${sx}px`
        chip.style.top = `${sy}px`
        chip.classList.toggle('behind', behind)
        chip.style.zIndex = String(behind ? 5 : 10 + Math.round(facing * 10))
      })

      renderer.render(scene, camera)
    }

    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('wheel', onWheel)
      renderer.dispose()
    }
  }, [config, dprCap, reducedMotion, markerPos, brazil, brazilRingQuat])

  // Tween de foco para o marcador clicado
  useEffect(() => {
    if (!focusRequest) return
    const marker = MARKERS.find((m) => m.id === focusRequest.id)
    if (!marker) return

    const dir = latLon(marker.lat, marker.lon, 1).normalize()
    const phiT = THREE.MathUtils.clamp(Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1)), 0.4, Math.PI - 0.4)
    const thetaT = Math.atan2(dir.x, dir.z)
    const delta = ((thetaT - targetRef.current.theta + Math.PI * 3) % (Math.PI * 2)) - Math.PI

    lastInteractRef.current = performance.now()

    if (reducedMotion) {
      targetRef.current.theta += delta
      targetRef.current.phi = phiT
      sphericalRef.current.theta = targetRef.current.theta
      sphericalRef.current.phi = phiT
      onFocusDone(focusRequest.id)
      return
    }

    focusTweenRef.current?.kill()
    const tween = gsap.to(targetRef.current, {
      theta: targetRef.current.theta + delta,
      phi: phiT,
      radius: baseRadiusRef.current * 0.88,
      duration: 1.05,
      ease: 'power3.inOut',
      onComplete: () => {
        if (focusRequest.id === 'praticar') boostUntilRef.current = performance.now() + 1400
        onFocusDone(focusRequest.id)
        gsap.to(targetRef.current, { radius: baseRadiusRef.current, duration: 0.8, ease: 'power2.out' })
      },
    })
    focusTweenRef.current = tween

    return () => {
      tween.kill()
      focusTweenRef.current = null
    }
  }, [focusRequest, reducedMotion, onFocusDone])

  const handleMarkerClick = (id: FunctionId) => (e: React.MouseEvent<HTMLButtonElement>) => {
    onMarkerClick(id, e.currentTarget)
  }

  return (
    <div className="stage" ref={containerRef} aria-label="Globo terrestre 3D segurado pela mão de Têmis">
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {!webglFailed && !ready && (
        <div className="globe-loading" aria-live="polite">
          Carregando o globo…
        </div>
      )}

      {/* Anel de progresso em 5 trechos ao redor do globo */}
      <svg className="progress-ring" viewBox="0 0 200 200" aria-hidden="true">
        <circle className="pr-track" cx="100" cy="100" r="96" />
        {progressSegments.map((on, i) => (
          <circle
            key={i}
            className={`pr-seg${on ? ' on' : ''}`}
            cx="100"
            cy="100"
            r="96"
            strokeDasharray={`${SEGMENT_LENGTH - 8} ${603.19 - (SEGMENT_LENGTH - 8)}`}
            strokeDashoffset={-i * SEGMENT_LENGTH}
            transform="rotate(-90 100 100)"
          />
        ))}
      </svg>
      <span className="sr-only" aria-live="polite">
        {progressPct}% estudado
      </span>

      {/* Marcadores flutuantes posicionados pela câmera 3D */}
      {MARKERS.map((m) => (
        <button
          key={m.id}
          type="button"
          ref={(el) => {
            markerEls.current[m.id] = el
          }}
          className={`gmarker${pulseId === m.id ? ' popped' : ''}`}
          aria-label={`Abrir a função ${m.label} do artigo 5º do Código Penal`}
          onClick={handleMarkerClick(m.id)}
        >
          <span className="dot" aria-hidden />
          {m.label}
        </button>
      ))}

      {/* Planetas vizinhos (mini-globos) nas laterais do palco */}
      <PlanetNav currentArticle={currentArticle} onTravel={onTravel} />

      <p className="hint">Arraste para girar · toque numa função para ver a prévia</p>
      {webglFailed && (
        <p className="globe-error" role="alert">
          O globo 3D não carregou neste aparelho. As sete funções continuam disponíveis no menu de rodapé, aqui embaixo.
        </p>
      )}
    </div>
  )
}
