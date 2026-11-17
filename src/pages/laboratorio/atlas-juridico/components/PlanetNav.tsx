import { memo } from 'react'
import { ARTICLE_ORDER, NEIGHBORS } from '../data/article5'
import { earthTextureDataURL } from '../three/earth'

/**
 * Planetas vizinhos: mini-globos terrestres DE VERDADE — a mesma textura
 * de continentes do globo central, com nuvens implícitas no desenho,
 * atmosfera em CSS e rotação.
 *
 * PERFORMANCE — por que não é mais Three.js aqui:
 * antes, cada planeta era um <Canvas> próprio do React Three Fiber: 2
 * contextos WebGL a mais (o navegador tem limite de contextos e cada um
 * custa memória e um loop de render), cada um gerando de novo a textura
 * 2048×1024 da Terra. Agora o mini-globo é uma <div> com a textura em
 * cache como background, girando com animação CSS (o navegador anima
 * isso no compositor, quase de graça). Visual igual, custo perto de zero.
 * O globo central continua 3D — é ele que o usuário gira com o dedo.
 */
function MiniGlobe({ label, travelLabel }: { label: string; travelLabel: string }) {
  return (
    <div className="planet-globe-wrapper">
      <span
        className="planet-globe"
        role="img"
        aria-label={`Mini-globo do ${label}`}
        style={{ backgroundImage: `url(${earthTextureDataURL()})` }}
      />
      <span className="planet-tag-inside">{travelLabel}</span>
    </div>
  )
}

interface PlanetNavProps {
  currentArticle: number
  onTravel: (target: number) => void
}

function PlanetNav({ currentArticle, onTravel }: PlanetNavProps) {
  const idx = ARTICLE_ORDER.indexOf(currentArticle)
  const left = NEIGHBORS[ARTICLE_ORDER[(idx - 1 + ARTICLE_ORDER.length) % ARTICLE_ORDER.length]]
  const right = NEIGHBORS[ARTICLE_ORDER[(idx + 1) % ARTICLE_ORDER.length]]

  return (
    <>
      <button
        type="button"
        className="planet planet-left"
        onClick={() => onTravel(left.num)}
        aria-label={`Viajar para o ${left.label} — ${left.name}`}
      >
        <MiniGlobe label={left.label} travelLabel={`← ${left.label}`} />
      </button>

      <button
        type="button"
        className="planet planet-right"
        onClick={() => onTravel(right.num)}
        aria-label={`Viajar para o ${right.label} — ${right.name}`}
      >
        <MiniGlobe label={right.label} travelLabel={`${right.label} →`} />
      </button>
    </>
  )
}

export default memo(PlanetNav)
