import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import gsap from 'gsap'
import { MARKERS } from '../data/article5'
import { cloudTexture, earthTexture, glowDiscTexture, latLon, starSpriteTexture } from '../three/earth'
import PlanetNav from './PlanetNav'
import { ICONS } from './FooterMenu'
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
  knuckleMaterial: THREE.Material,
): THREE.Group {
  const grp = new THREE.Group()
  const a = (angleDeg * Math.PI) / 180
  const dx = Math.sin(a)
  const dz = Math.cos(a)
  const P = (rad: number, y: number, zOff = 0) =>
    new THREE.Vector3(dx * rad, y, dz * rad + zOff)

  // Curva anatômica da mão em concha sustentando a esfera
  const points = [
    P(0.40, -1.60),
    P(0.85, -1.48),
    P(1.22, -1.24), // Articulação proximal (MCP)
    P(reach, -0.92), // Articulação média (PIP)
    P(reach + 0.04, -0.52), // Articulação distal (DIP)
    P(reach - 0.08, tipY), // Polpa da ponta do dedo
  ]
  const curve = new THREE.CatmullRomCurve3(points)
  const knuckle1 = points[2]
  const knuckle2 = points[3]
  const knuckle3 = points[4]
  const tip = points[5]

  // Corpo do dedo em bronze polido com conicidade
  const tubeGeo = new THREE.TubeGeometry(curve, 16, tubeR, 12, false)
  const tubeMesh = new THREE.Mesh(tubeGeo, material)
  grp.add(tubeMesh)

  // Articulação proximal (MCP)
  const k1Geo = new THREE.SphereGeometry(tubeR * 1.15, 12, 12)
  const k1Mesh = new THREE.Mesh(k1Geo, knuckleMaterial)
  k1Mesh.position.copy(knuckle1)
  k1Mesh.scale.set(1.1, 0.9, 1.1)
  grp.add(k1Mesh)

  // Articulação média (PIP)
  const k2Geo = new THREE.SphereGeometry(tubeR * 1.18, 12, 12)
  const k2Mesh = new THREE.Mesh(k2Geo, knuckleMaterial)
  k2Mesh.position.copy(knuckle2)
  k2Mesh.scale.set(1.12, 0.92, 1.12)
  grp.add(k2Mesh)

  // Articulação distal (DIP)
  const k3Geo = new THREE.SphereGeometry(tubeR * 1.08, 12, 12)
  const k3Mesh = new THREE.Mesh(k3Geo, knuckleMaterial)
  k3Mesh.position.copy(knuckle3)
  grp.add(k3Mesh)

  // Polpa tátil do dedo apoiada na Terra
  const pulpGeo = new THREE.SphereGeometry(tubeR * 1.04, 14, 14)
  const pulpMesh = new THREE.Mesh(pulpGeo, material)
  pulpMesh.position.copy(tip)
  pulpMesh.scale.set(1.1, 0.95, 1.2)
  grp.add(pulpMesh)

  // Unha dourada esculpida em ouro clássico
  const nailGeo = new THREE.SphereGeometry(tubeR * 0.72, 12, 12)
  const nailMesh = new THREE.Mesh(nailGeo, nailMaterial)
  nailMesh.position.set(
    tip.x + Math.sin(a) * tubeR * 0.52,
    tip.y + 0.015,
    tip.z + Math.cos(a) * tubeR * 0.52,
  )
  nailMesh.scale.set(1, 0.45, 1.3)
  grp.add(nailMesh)

  return grp
}

function buildThemisHand(glowTex: THREE.Texture): THREE.Group {
  const hand = new THREE.Group()

  // Material bronze nobre dourado (estátua de Têmis)
  const statueMat = new THREE.MeshStandardMaterial({
    color: 0xdeb972,
    metalness: 0.88,
    roughness: 0.22,
    emissive: 0x221706,
    emissiveIntensity: 0.25,
  })
  const knuckleMat = new THREE.MeshStandardMaterial({
    color: 0xd4a858,
    metalness: 0.90,
    roughness: 0.26,
    emissive: 0x281905,
    emissiveIntensity: 0.28,
  })
  const statueDarkMat = new THREE.MeshStandardMaterial({
    color: 0x8a6422,
    metalness: 0.84,
    roughness: 0.36,
  })
  const nailMat = new THREE.MeshStandardMaterial({
    color: 0xffe8b5,
    metalness: 0.82,
    roughness: 0.14,
    emissive: 0x3d2b06,
    emissiveIntensity: 0.25,
  })
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xf5bf38,
    metalness: 0.94,
    roughness: 0.18,
    emissive: 0x472f05,
    emissiveIntensity: 0.35,
  })
  const bronzeMat = new THREE.MeshStandardMaterial({
    color: 0xad8224,
    metalness: 0.9,
    roughness: 0.28,
  })
  const rubyMat = new THREE.MeshStandardMaterial({
    color: 0xd92b20,
    metalness: 0.2,
    roughness: 0.08,
    emissive: 0x7a0c06,
    emissiveIntensity: 0.95,
  })
  const sapphireMat = new THREE.MeshStandardMaterial({
    color: 0x2472d9,
    metalness: 0.2,
    roughness: 0.08,
    emissive: 0x06225a,
    emissiveIntensity: 0.95,
  })

  // 1. Palma principal esculpida
  const palm1 = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), statueMat)
  palm1.position.set(0, -1.66, -0.08)
  palm1.scale.set(1.18, 0.42, 1.05)
  hand.add(palm1)

  // 2. Base do calcanhar da palma
  const palm2 = new THREE.Mesh(new THREE.SphereGeometry(0.72, 24, 18), statueMat)
  palm2.position.set(0, -1.82, -0.28)
  palm2.scale.set(1.05, 0.5, 0.9)
  hand.add(palm2)

  // 3. Eminência Tenar (almofada anatômica carnuda do polegar)
  const thenar = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), statueMat)
  thenar.position.set(-0.52, -1.62, 0.22)
  thenar.scale.set(1.15, 0.75, 1.25)
  hand.add(thenar)

  // 4. Eminência Hipotenar (almofada lateral externa da mão)
  const hypothenar = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), statueMat)
  hypothenar.position.set(0.52, -1.65, 0.16)
  hypothenar.scale.set(1.1, 0.7, 1.2)
  hand.add(hypothenar)

  // 5. Cinco dedos esculpidos em bronze com anatomia clássica
  // Polegar
  hand.add(buildFingerGroup(-52, 0.150, -0.32, 1.55, statueMat, nailMat, knuckleMat))
  // Indicador
  hand.add(buildFingerGroup(-18, 0.160, -0.08, 1.58, statueMat, nailMat, knuckleMat))
  // Médio (mais alto)
  hand.add(buildFingerGroup(15, 0.165, -0.02, 1.59, statueMat, nailMat, knuckleMat))
  // Anelar
  hand.add(buildFingerGroup(48, 0.150, -0.24, 1.56, statueMat, nailMat, knuckleMat))
  // Mínimo
  hand.add(buildFingerGroup(112, 0.170, -0.60, 1.51, statueMat, nailMat, knuckleMat))

  // 6. Pulso e antebraço escultural
  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.58, 1.05, 32), statueMat)
  wrist.position.set(0, -2.28, -0.52)
  wrist.rotation.set(0.5, 0, 0)
  hand.add(wrist)

  // 7. Bracelete grego de ouro superior com friso
  const b1 = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.055, 16, 40), goldMat)
  b1.position.set(0, -2.14, -0.4)
  b1.rotation.set(Math.PI / 2 - 0.5, 0, 0)
  hand.add(b1)

  // 8. Gemas preciosas cravadas em pontos cardeais no bracelete de Têmis
  const ruby1 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), rubyMat)
  ruby1.position.set(0, -2.08, 0.15)
  hand.add(ruby1)

  const ruby2 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), rubyMat)
  ruby2.position.set(0, -2.20, -0.95)
  hand.add(ruby2)

  const sapphire1 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), sapphireMat)
  sapphire1.position.set(0.54, -2.14, -0.4)
  hand.add(sapphire1)

  const sapphire2 = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), sapphireMat)
  sapphire2.position.set(-0.54, -2.14, -0.4)
  hand.add(sapphire2)

  // 9. Segundo bracelete frisado de bronze nobre
  const b2 = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.035, 16, 40), bronzeMat)
  b2.position.set(0, -2.3, -0.47)
  b2.rotation.set(Math.PI / 2 - 0.5, 0, 0)
  hand.add(b2)

  // 10. Manga da toga clássica com pregas esculpidas
  const toga = new THREE.Mesh(new THREE.CylinderGeometry(0.60, 1.05, 0.95, 32, 1, true), statueDarkMat)
  toga.position.set(0, -2.82, -0.72)
  toga.rotation.set(0.5, 0, 0)
  hand.add(toga)

  // 11. Borda de ouro entalhada na terminação da toga
  const togaBorder = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 12, 32), goldMat)
  togaBorder.position.set(0, -2.48, -0.58)
  togaBorder.rotation.set(Math.PI / 2 - 0.5, 0, 0)
  hand.add(togaBorder)

  // 12. Disco de pedestal de luz dourada
  const glowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 4.8),
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
  const progressRingRef = useRef<SVGSVGElement | null>(null)
  const markerEls = useRef<Partial<Record<FunctionId, HTMLButtonElement | null>>>({})
  const [ready, setReady] = useState(false)
  const [webglFailed, setWebglFailed] = useState(false)

  // Rastreamento de interação e coordenadas esféricas
  const sphericalRef = useRef({ theta: 0.25, phi: 1.32, radius: 11.5 })
  const targetRef = useRef({ theta: 0.25, phi: 1.32, radius: 11.5 })
  const baseRadiusRef = useRef(11.5)
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
  // ringGroupRef e ring1Ref removidos (astrolábio deletado)
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
  // planeOrbitRef, planeRef, linkRef removidos (avião deletado)
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

    // Iluminação cinematográfica
    const ambientLight = new THREE.AmbientLight(0x8fb4e8, 0.55)
    scene.add(ambientLight)

    const hemiLight = new THREE.HemisphereLight(0xbcd6ff, 0x2a1f08, 0.65)
    scene.add(hemiLight)

    const dir1 = new THREE.DirectionalLight(0xfff1cf, 2.1)
    dir1.position.set(4, 2.5, 3.5)
    scene.add(dir1)

    const dir2 = new THREE.DirectionalLight(0xd9a92c, 1.3)
    dir2.position.set(-4, -1.5, -3)
    scene.add(dir2)

    const dir3 = new THREE.DirectionalLight(0x6aa6e8, 0.6)
    dir3.position.set(-3, 1.5, 4)
    scene.add(dir3)

    // Rim light azulada para contorno da Terra
    const rimLight = new THREE.DirectionalLight(0x4488cc, 0.8)
    rimLight.position.set(-2, 0, -4)
    scene.add(rimLight)

    const pointLight = new THREE.PointLight(0xf0c94e, 1.8, 9, 1.6)
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
      roughness: 0.42,
      metalness: 0.15,
      emissive: 0x0a1a30,
      emissiveIntensity: 0.3,
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
      const cloudsMat = new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, opacity: 0.42, depthWrite: false, roughness: 1 })
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

    // 2. Atmosfera realista com dispersão Rayleigh azul e halo dourado sutil
    const atmoGeo = new THREE.SphereGeometry(R * 1.18, 32, 24)
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x3d8be8,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat)
    atmoRef.current = atmoMesh
    scene.add(atmoMesh)

    const atmoGoldGeo = new THREE.SphereGeometry(R * 1.09, 32, 24)
    const atmoGoldMat = new THREE.MeshBasicMaterial({
      color: 0xf0c94e,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const atmoGoldMesh = new THREE.Mesh(atmoGoldGeo, atmoGoldMat)
    atmoGoldRef.current = atmoGoldMesh
    scene.add(atmoGoldMesh)

    // 3. Mão de Têmis
    const handGroup = buildThemisHand(glowTex)
    handRef.current = handGroup
    scene.add(handGroup)

    // 4. Estrelas e Poeira
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
      new THREE.PointsMaterial({ size: 0.22, map: starTex, transparent: true, depthWrite: false, color: 0xd8e8ff, opacity: 0.9 }),
    )
    starFarRef.current = starFarPts
    scene.add(starFarPts)

    const starNearPts = new THREE.Points(
      makeStarGeo(config.starNear, 7.5, 11),
      new THREE.PointsMaterial({ size: 0.35, map: starTex, transparent: true, depthWrite: false, color: 0xffe9a8, opacity: 0.95 }),
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
      let r = 5.8
      if (a < 0.55) {
        r = 13.2
      } else if (a < 0.75) {
        r = 11.2
      } else if (a < 1.05) {
        r = 8.2
      } else {
        r = h < 560 ? 6.8 : 5.8
      }
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
            3.2,
            18.0,
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
      targetRef.current.radius = THREE.MathUtils.clamp(targetRef.current.radius + e.deltaY * 0.0035, 3.2, 18.0)
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
    const centerVec = new THREE.Vector3()
    const sphObj = new THREE.Spherical(6.4, 1.32, 0.25)

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

      // Respiração do conjunto 3D
      if (!reducedMotion) {
        const bob = Math.sin(t * 0.55) * 0.045
        if (globeRef.current) globeRef.current.position.y = bob
        if (cloudsRef.current) cloudsRef.current.position.y = bob
        if (atmoRef.current) atmoRef.current.position.y = bob
        if (atmoGoldRef.current) atmoGoldRef.current.position.y = bob
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

      if (progressRingRef.current) {
        const ringPx = radiusPx * 2.34
        progressRingRef.current.style.width = `${ringPx}px`
        progressRingRef.current.style.height = `${ringPx}px`
        progressRingRef.current.style.left = `${cx}px`
        progressRingRef.current.style.top = `${cy}px`
        progressRingRef.current.style.transform = 'translate(-50%, -50%)'
      }

      // Margens de segurança dinâmicas para evitar colisão com barra de status e navegação inferior
      const topSafe = h < 768 ? 130 : 90
      const bottomSafe = h < 768 ? 120 : 65

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
        sy = Math.max(hh + topSafe, Math.min(h - hh - bottomSafe, sy))

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
      <svg ref={progressRingRef} className="progress-ring" viewBox="0 0 200 200" aria-hidden="true">
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
          <span className="gmarker-ico" aria-hidden>
            {ICONS[m.id]}
          </span>
          <span>{m.label}</span>
        </button>
      ))}

      {/* Planetas vizinhos (mini-globos) nas laterais do palco */}
      <PlanetNav currentArticle={currentArticle} onTravel={onTravel} />

      {webglFailed && (
        <p className="globe-error" role="alert">
          O globo 3D não carregou neste aparelho. As sete funções continuam disponíveis no menu de rodapé, aqui embaixo.
        </p>
      )}
    </div>
  )
}
