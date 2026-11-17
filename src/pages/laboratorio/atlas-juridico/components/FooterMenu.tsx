import { memo, type ReactNode } from 'react'
import { FUNCTIONS } from '../data/article5'
import type { FunctionId } from '../types'

const ICONS: Record<FunctionId, ReactNode> = {
  texto: (
    <svg viewBox="0 0 24 24">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  ),
  ouvir: (
    <svg viewBox="0 0 24 24">
      <path d="M4 13a8 8 0 0 1 16 0" />
      <path d="M3 13h3v7H3zM18 13h3v7h-3z" />
    </svg>
  ),
  assistir: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9l5 3-5 3z" />
    </svg>
  ),
  entender: (
    <svg viewBox="0 0 24 24">
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M4 19a2 2 0 0 1 2-2h13" />
    </svg>
  ),
  praticar: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
  aprofundar: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  ),
  estudo: (
    <svg viewBox="0 0 24 24">
      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
    </svg>
  ),
}

interface FooterMenuProps {
  /** Função atualmente aberta (destaca a pílula). */
  activeId: FunctionId | null
  /** Tocar aqui NÃO abre a tela direto: pede o foco do globo primeiro. */
  onRequest: (id: FunctionId, el: HTMLElement) => void
}

/**
 * Menu de rodapé: 7 pílulas flutuantes meio brancas, translúcidas.
 * O clique passa por `onRequest` — o App gira o globo até centralizar o
 * marcador da função, dá o pulso dourado e só depois abre a prévia.
 *
 * Memoizado: as props só mudam quando outra função é aberta, então o
 * rodapé não re-renderiza a cada quadro do globo nem a cada tick do
 * progresso — antes, cada mudança de estado do App o redesenhava.
 */
function FooterMenu({ activeId, onRequest }: FooterMenuProps) {
  return (
    <nav className="dock" aria-label="Funções do artigo">
      {FUNCTIONS.map((f) => (
        <button
          key={f.id}
          type="button"
          className={activeId === f.id ? 'active' : ''}
          aria-label={`Abrir a função ${f.label}`}
          onClick={(e) => onRequest(f.id, e.currentTarget)}
        >
          <span className="ico" aria-hidden>
            {ICONS[f.id]}
          </span>
          {f.label}
        </button>
      ))}
    </nav>
  )
}

export default memo(FooterMenu)
