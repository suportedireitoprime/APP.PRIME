import { memo } from 'react'
import type { QualityLevel } from '../hooks/useAdaptiveQuality'

interface FpsMeterProps {
  fps: number
  quality: QualityLevel
  lite: boolean
  autoDropped: boolean
  visible: boolean
  onHide: () => void
  onToggleLite: () => void
}

const QUALITY_LABEL: Record<QualityLevel, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
  lite: 'Leve',
}

/**
 * Medidor de FPS discreto no canto superior direito.
 * Atualiza no máximo 1× por segundo (o hook só muda o FPS a cada janela
 * de 2 s) e é memoizado: não re-renderiza o resto do app.
 * Clicar no × esconde o medidor; o botão "Modo leve" continua no topo.
 */
function FpsMeter({ fps, quality, lite, autoDropped, visible, onHide, onToggleLite }: FpsMeterProps) {
  if (!visible) return null
  const tone = fps === 0 ? '' : fps >= 50 ? 'good' : fps >= 30 ? 'warn' : 'bad'
  return (
    <div className="fps-meter" role="status" aria-label={`Taxa de quadros: ${fps} por segundo, qualidade ${QUALITY_LABEL[quality]}`}>
      <span className={`fps-value ${tone}`}>{fps === 0 ? '—' : `${fps} FPS`}</span>
      <span className="fps-quality">{QUALITY_LABEL[quality]}</span>
      {autoDropped && !lite && <span className="fps-note" title="O aparelho não segurou a qualidade alta, então o Atlas baixou sozinho para não travar.">auto ↓</span>}
      <button type="button" className="fps-lite" onClick={onToggleLite} aria-pressed={lite}>
        {lite ? 'Modo leve: on' : 'Modo leve'}
      </button>
      <button type="button" className="fps-hide" onClick={onHide} aria-label="Esconder medidor de FPS">
        ✕
      </button>
    </div>
  )
}

export default memo(FpsMeter)
