import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Qualidade adaptativa do globo 3D + medidor de FPS.
 *
 * Ideia: medir o FPS real com requestAnimationFrame (barato: só conta
 * quadros, sem desenhar nada) e, se o aparelho não segurar, baixar a
 * qualidade sozinho — antes de travar. O usuário também pode forçar o
 * "Modo leve" a qualquer momento; a escolha fica salva em localStorage.
 *
 * Níveis (do mais pesado ao mais leve):
 * - high:   DPR até 2 no desktop / 1.5 no celular, tudo ligado.
 * - medium: DPR até 1.5, sem Sparkles/nebulosa, pó reduzido.
 * - low:    DPR 1, sem nuvens, sem pó, sem avião, estrelas reduzidas.
 * - lite:   DPR 1, sem antialias, sem nuvens/pó/avião/halo, esferas
 *           com menos segmentos. É o "Modo leve" manual.
 */
export type QualityLevel = 'high' | 'medium' | 'low' | 'lite'

export interface QualityConfig {
  /** Teto do devicePixelRatio do Canvas. */
  dprCap: number
  antialias: boolean
  clouds: boolean
  dust: boolean
  dustCount: number
  plane: boolean
  halo: boolean
  /** Segmentos da esfera da Terra (largura × altura). */
  earthSegments: [number, number]
  starFar: number
  starNear: number
}

export const QUALITY_CONFIG: Record<QualityLevel, QualityConfig> = {
  high: { dprCap: 2, antialias: true, clouds: true, dust: true, dustCount: 90, plane: true, halo: true, earthSegments: [48, 32], starFar: 300, starNear: 120 },
  medium: { dprCap: 1.5, antialias: true, clouds: true, dust: true, dustCount: 60, plane: true, halo: true, earthSegments: [48, 32], starFar: 220, starNear: 90 },
  low: { dprCap: 1, antialias: false, clouds: false, dust: false, dustCount: 0, plane: false, halo: true, earthSegments: [32, 24], starFar: 140, starNear: 60 },
  lite: { dprCap: 1, antialias: false, clouds: false, dust: false, dustCount: 0, plane: false, halo: false, earthSegments: [32, 24], starFar: 100, starNear: 40 },
}

const LITE_KEY = 'atlas-juridico-lite-mode-v1'
const FPS_WINDOW_MS = 2000
const LOW_FPS = 45
const GOOD_FPS = 56

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768
}

export function useAdaptiveQuality() {
  const [lite, setLiteState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LITE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [autoLevel, setAutoLevel] = useState<QualityLevel>(() =>
    isMobileDevice() ? 'medium' : 'high',
  )
  const [fps, setFps] = useState(0)
  const [autoDropped, setAutoDropped] = useState(false)
  const lowStreak = useRef(0)
  const goodStreak = useRef(0)
  const levelRef = useRef(autoLevel)
  levelRef.current = autoLevel

  const setLite = useCallback((value: boolean) => {
    setLiteState(value)
    try {
      localStorage.setItem(LITE_KEY, value ? '1' : '0')
    } catch {
      // Sem armazenamento: vale só para a sessão.
    }
  }, [])

  // Mede o FPS com um rAF próprio (só timestamps — não desenha nada).
  useEffect(() => {
    let raf = 0
    let frames = 0
    let windowStart = performance.now()
    let stopped = false
    const tick = (now: number) => {
      if (stopped) return
      frames += 1
      const elapsed = now - windowStart
      if (elapsed >= FPS_WINDOW_MS) {
        const measured = Math.round((frames * 1000) / elapsed)
        setFps(measured)
        frames = 0
        windowStart = now
        // Só o modo automático baixa/sobe: o Modo leve manual manda sempre.
        if (!lite) {
          const level = levelRef.current
          const order: QualityLevel[] = ['high', 'medium', 'low']
          const idx = order.indexOf(level)
          if (measured < LOW_FPS && idx < order.length - 1) {
            lowStreak.current += 1
            goodStreak.current = 0
            if (lowStreak.current >= 2) {
              lowStreak.current = 0
              setAutoLevel(order[idx + 1])
              setAutoDropped(true)
            }
          } else if (measured >= GOOD_FPS && idx > 0) {
            goodStreak.current += 1
            lowStreak.current = 0
            if (goodStreak.current >= 5) {
              goodStreak.current = 0
              setAutoLevel(order[idx - 1])
            }
          } else {
            lowStreak.current = 0
            goodStreak.current = 0
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [lite])

  const quality: QualityLevel = lite ? 'lite' : autoLevel
  const isMobile = isMobileDevice()
  const dprCap = Math.min(
    QUALITY_CONFIG[quality].dprCap,
    isMobile ? 1.5 : 2,
  )

  return { fps, quality, lite, setLite, autoDropped, dprCap, config: QUALITY_CONFIG[quality] }
}
