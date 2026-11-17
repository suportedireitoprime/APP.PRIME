import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AtlasGlobe from './components/AtlasGlobe'
import FooterMenu from './components/FooterMenu'
import PreviewCard from './components/PreviewCard'
import FunctionSheet from './components/FunctionSheet'
import { useAdaptiveQuality } from './hooks/useAdaptiveQuality'
import Texto from './features/Texto'
import Ouvir from './features/Ouvir'
import Assistir from './features/Assistir'
import Entender from './features/Entender'
import Praticar from './features/Praticar'
import Aprofundar from './features/Aprofundar'
import MeuEstudo from './features/MeuEstudo'
import { useProgress } from './hooks/useProgress'
import { ARTICLE_LAW, NEIGHBORS, PREVIEWS } from './data/article5'
import type { FocusRequest, FunctionId } from './types'
import './styles/atlas.css'

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

function spawnRipple(x: number, y: number) {
  const r = document.createElement('span')
  r.className = 'tap-ripple'
  r.style.left = `${x}px`
  r.style.top = `${y}px`
  document.body.appendChild(r)
  window.setTimeout(() => r.remove(), 750)
}

export default function AtlasJuridicoView() {
  const navigate = useNavigate()
  const progress = useProgress()
  const reducedMotion = usePrefersReducedMotion()
  const quality = useAdaptiveQuality()

  const [currentArticle, setCurrentArticle] = useState(5)
  const [traveling, setTraveling] = useState(false)
  const [travelDest, setTravelDest] = useState<number | null>(null)

  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  const pendingPreviewRef = useRef<FunctionId | null>(null)
  const [pulseId, setPulseId] = useState<FunctionId | null>(null)
  const [previewId, setPreviewId] = useState<FunctionId | null>(null)
  const [sheetId, setSheetId] = useState<FunctionId | null>(null)

  const neighbor = NEIGHBORS[currentArticle]
  const activeFx = previewId ?? sheetId

  const requestFunction = useCallback((id: FunctionId, el: HTMLElement) => {
    if (traveling) return
    const rect = el.getBoundingClientRect()
    spawnRipple(rect.left + rect.width / 2, rect.top + rect.height / 2)
    setPreviewId(null)
    setPulseId(null)
    pendingPreviewRef.current = id
    setFocusRequest({ id, nonce: Date.now() })
  }, [traveling])

  const pulseTimerRef = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current)
    },
    [],
  )

  const handleFocusDone = useCallback((id: FunctionId) => {
    if (pendingPreviewRef.current !== id) return
    pendingPreviewRef.current = null
    setPulseId(id)
    if (pulseTimerRef.current !== null) window.clearTimeout(pulseTimerRef.current)
    pulseTimerRef.current = window.setTimeout(() => setPulseId((p) => (p === id ? null : p)), 900)
    setPreviewId(id)
  }, [])

  const confirmPreview = useCallback((id: FunctionId) => {
    setPreviewId(null)
    setSheetId(id)
  }, [])

  const openSheetDirect = useCallback((id: FunctionId) => {
    setPreviewId(null)
    setSheetId(id)
  }, [])

  const closeSheet = useCallback(() => setSheetId(null), [])
  const closePreview = useCallback(() => setPreviewId(null), [])

  useEffect(() => {
    if (!sheetId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sheetId, closeSheet])

  const warpStars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const ang = Math.random() * Math.PI * 2
        const dist = 42 + Math.random() * 55
        return {
          key: i,
          dx: `${Math.cos(ang) * dist}vmax`,
          dy: `${Math.sin(ang) * dist}vmax`,
          delay: `${Math.random() * 1.1}s`,
          gold: i % 3 === 0,
        }
      }),
    [],
  )

  const travelTimersRef = useRef<number[]>([])
  useEffect(
    () => () => {
      travelTimersRef.current.forEach((t) => window.clearTimeout(t))
    },
    [],
  )

  const travelTo = useCallback(
    (target: number) => {
      if (traveling || target === currentArticle || !NEIGHBORS[target]) return
      setTraveling(true)
      setTravelDest(target)
      setPreviewId(null)
      setSheetId(null)
      travelTimersRef.current.push(window.setTimeout(() => setCurrentArticle(target), 1150))
      travelTimersRef.current.push(
        window.setTimeout(() => {
          setTraveling(false)
          setTravelDest(null)
        }, 2150),
      )
    },
    [traveling, currentArticle],
  )

  const preview = previewId ? PREVIEWS[previewId] : null
  const sheetOrderLabel = sheetId ? PREVIEWS[sheetId].orderLabel : ''

  return (
    <div className="atlas-app" data-fx={activeFx ?? undefined}>
      <header className="top">
        <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-1 relative">
          <button
            type="button"
            onClick={() => navigate('/admin-laboratorio-aulas')}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-amber-400/20 flex items-center justify-center text-amber-300 transition-all shadow-lg min-h-[48px]"
            aria-label="Voltar para Laboratório"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
          <div className="kicker flex-1 text-center truncate px-2">
            <span className="hidden sm:inline">Atlas Jurídico · </span>Código Penal
          </div>
          <div className="min-w-[48px] flex items-center justify-end">
            {currentArticle === 5 && (
              <span className="progress-pill-inline">{progress.summary.pct}%</span>
            )}
          </div>
        </div>
        <h1>
          <span className="art">{neighbor.label}</span> — {neighbor.name}
        </h1>
        <p className="sub">{neighbor.sub}</p>
      </header>

      <AtlasGlobe
        focusRequest={focusRequest}
        onFocusDone={handleFocusDone}
        onMarkerClick={requestFunction}
        pulseId={pulseId}
        progressSegments={progress.summary.segments}
        progressPct={progress.summary.pct}
        reducedMotion={reducedMotion}
        currentArticle={currentArticle}
        onTravel={travelTo}
        config={quality.config}
        dprCap={quality.dprCap}
      />

      <FooterMenu activeId={sheetId ?? previewId} onRequest={requestFunction} />

      <PreviewCard preview={preview} onClose={closePreview} onConfirm={confirmPreview} />

      <FunctionSheet
        openId={sheetId}
        orderLabel={sheetOrderLabel}
        currentArticle={currentArticle}
        onClose={closeSheet}
        onOpenFunction={openSheetDirect}
        onTravelBack={() => travelTo(5)}
      >
        {sheetId === 'texto' && (
          <Texto read={progress.state.read} onToggleRead={progress.toggleRead} />
        )}
        {sheetId === 'ouvir' && <Ouvir onListened={progress.markListened} />}
        {sheetId === 'assistir' && <Assistir onWatched={progress.markWatched} />}
        {sheetId === 'entender' && <Entender />}
        {sheetId === 'praticar' && (
          <Praticar
            onQuizAnswer={progress.recordQuizAnswer}
            onResetQuiz={progress.resetQuiz}
            onToggleFlashcard={progress.toggleFlashcard}
            fcSeen={progress.state.fcSeen}
          />
        )}
        {sheetId === 'aprofundar' && <Aprofundar />}
        {sheetId === 'estudo' && <MeuEstudo summary={progress.summary} />}
      </FunctionSheet>

      {/* Viagem pelo espaço entre artigos (Hiperespaço) */}
      <div className={`travel${traveling ? ' active' : ''}`} aria-hidden={!traveling}>
        {traveling && (
          <div className="warp" key={travelDest ?? 'warp'}>
            {warpStars.map((s) => (
              <i
                key={s.key}
                style={
                  {
                    '--dx': s.dx,
                    '--dy': s.dy,
                    animationDelay: s.delay,
                    background: s.gold ? '#ffe9a8' : undefined,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
        {travelDest !== null && (
          <div className="travel-label">
            <small>Viajando pelo espaço…</small>
            <strong>{NEIGHBORS[travelDest].label}</strong>
            <span>{NEIGHBORS[travelDest].name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
