import { useEffect, useRef, useState } from 'react'
import { AUDIOS } from '../data/article5'

type AudioKey = 'aula' | 'pilula'

interface PlayerState {
  t: number
  playing: boolean
  speed: number
}

const SPEEDS = [1, 1.5, 2]

function fmt(s: number): string {
  const v = Math.floor(s)
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`
}

/**
 * Função 2 — Ouvir: players demonstrativos (a interface e o progresso de
 * escuta; no Atlas final, tocam os arquivos de áudio já produzidos).
 */
export default function Ouvir({ onListened }: { onListened: () => void }) {
  const [players, setPlayers] = useState<Record<AudioKey, PlayerState>>({
    aula: { t: 0, playing: false, speed: 1 },
    pilula: { t: 0, playing: false, speed: 1 },
  })
  const timers = useRef<Partial<Record<AudioKey, ReturnType<typeof setInterval>>>>({})

  useEffect(() => {
    const current = timers.current
    return () => {
      Object.values(current).forEach((t) => {
        if (t) clearInterval(t)
      })
    }
  }, [])

  const toggle = (key: AudioKey) => {
    const total = AUDIOS.find((a) => a.key === key)!.totalSeconds
    setPlayers((prev) => {
      const p = prev[key]
      const playing = !p.playing
      if (playing) {
        onListened()
        timers.current[key] = setInterval(() => {
          setPlayers((cur) => {
            const next = cur[key].t + 5 * cur[key].speed
            if (next >= total) {
              const timer = timers.current[key]
              if (timer) clearInterval(timer)
              return { ...cur, [key]: { ...cur[key], t: total, playing: false } }
            }
            return { ...cur, [key]: { ...cur[key], t: next } }
          })
        }, 250)
      } else {
        const timer = timers.current[key]
        if (timer) clearInterval(timer)
      }
      return { ...prev, [key]: { ...p, playing } }
    })
  }

  const setSpeed = (key: AudioKey, speed: number) => {
    setPlayers((prev) => ({ ...prev, [key]: { ...prev[key], speed } }))
  }

  return (
    <div>
      <p className="lead">
        É o artigo em áudio: a áudio-aula completa, para estudar ouvindo, e a pílula rápida,
        para revisar em poucos minutos. Cerca de 21 minutos no total.
      </p>
      {AUDIOS.map((a) => {
        const p = players[a.key]
        return (
          <div key={a.key} className="player">
            <h3>{a.title}</h3>
            <p>{a.desc}</p>
            <div className="player-row">
              <button
                type="button"
                className="play-btn"
                onClick={() => toggle(a.key)}
                aria-label={p.playing ? `Pausar ${a.title}` : `Ouvir ${a.title}`}
              >
                {p.playing ? '❚❚' : '▶'}
              </button>
              <div className="bar" aria-hidden>
                <i style={{ width: `${(100 * p.t) / a.totalSeconds}%` }} />
              </div>
              <span>
                {fmt(p.t)} / {a.totalLabel}
              </span>
            </div>
            <div className="speeds">
              <span>velocidade</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={p.speed === s ? 'on' : ''}
                  aria-pressed={p.speed === s}
                  onClick={() => setSpeed(a.key, s)}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        )
      })}
      <p className="note">
        Protótipo: os players demonstram a interface e o progresso de escuta. No Atlas final,
        eles tocam os arquivos de áudio já produzidos de cada artigo.
      </p>
    </div>
  )
}
