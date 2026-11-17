import { useState } from 'react'
import { VIDEOS } from '../data/article5'

/** Função 3 — Assistir: videoaula + pílulas da Lousa Animada. */
export default function Assistir({ onWatched }: { onWatched: () => void }) {
  const [opened, setOpened] = useState<string | null>(null)

  const open = (title: string) => {
    onWatched()
    setOpened(title)
  }

  return (
    <div>
      <p className="lead">
        É o artigo em vídeo: a videoaula completa e as pílulas da Lousa Animada, uma para cada
        ponto que mais cai. Cerca de 44 minutos no total.
      </p>
      {VIDEOS.map((v) => (
        <div key={v.title} className="video-card">
          <div className="thumb" aria-hidden>
            ▶
          </div>
          <div>
            <span className="dur">
              {v.duration} · {v.kind}
            </span>
            <h3>{v.title}</h3>
            <p>{v.desc}</p>
          </div>
          <button type="button" onClick={() => open(v.title)}>
            {opened === v.title ? 'Aberto ✓' : 'Assistir agora'}
          </button>
        </div>
      ))}
      {opened && (
        <p className="note" role="status">
          Você abriu: {opened}. No Atlas final, o vídeo toca aqui dentro desta tela.
        </p>
      )}
      <p className="note">
        Protótipo: os cartões mostram onde cada vídeo mora dentro do artigo. No Atlas final,
        o vídeo abre aqui mesmo, sem sair desta tela.
      </p>
    </div>
  )
}
