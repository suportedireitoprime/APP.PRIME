import { useEffect } from 'react'
import type { Preview } from '../types'

interface PreviewCardProps {
  preview: Preview | null
  onClose: () => void
  /** Botão principal do card: abre a tela inteira da função. */
  onConfirm: (id: Preview['id']) => void
}

/**
 * Card flutuante de prévia: aparece ANTES da tela cheia, explicando o
 * que a função é, o que tem dentro e quanto tempo leva. Nasce crescendo
 * do ponto tocado (classe `born`) e fecha no ✕, no fundo ou no Esc.
 */
export default function PreviewCard({ preview, onClose, onConfirm }: PreviewCardProps) {
  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [preview, onClose])

  return (
    <>
      <div
        className={`pv-backdrop${preview ? ' show' : ''}`}
        aria-hidden={!preview}
        onClick={onClose}
      />
      <div
        className={`pv-card${preview ? ' show born' : ''}`}
        role="dialog"
        aria-hidden={!preview}
        aria-label={preview ? `Prévia da função ${preview.title}` : undefined}
      >
        {preview && (
          <>
            <button type="button" className="pv-close" onClick={onClose} aria-label="Fechar prévia">
              ✕
            </button>
            <div className="pv-kicker">Função {preview.orderLabel}</div>
            <h2 className="pv-title">{preview.title}</h2>
            <p className="pv-desc">{preview.desc}</p>
            <ul className="pv-list">
              {preview.items.map((item) => (
                <li key={item}>
                  <span className="ck" aria-hidden>
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="pv-time">{preview.time}</p>
            <button type="button" className="pv-cta" onClick={() => onConfirm(preview.id)}>
              {preview.cta}
            </button>
          </>
        )}
      </div>
    </>
  )
}
