import type { ReactNode } from 'react'
import { FUNCTION_LABELS, NEIGHBORS } from '../data/article5'
import type { FunctionId } from '../types'

interface FunctionSheetProps {
  openId: FunctionId | null
  orderLabel: string
  /** Artigo que o globo central está mostrando (5 = conteúdo completo). */
  currentArticle: number
  onClose: () => void
  /** Botão do rodapé da tela: vai direto para a função, sem prévia. */
  onOpenFunction: (id: FunctionId) => void
  /** Voltar viajando para o art. 5º (só aparece fora do art. 5º). */
  onTravelBack: () => void
  children: ReactNode
}

/**
 * Tela da função: abre de baixo para cima, com "← Voltar" em cima e o
 * botão "Praticar" no rodapé. O conteúdo (children) vem das features.
 */
export default function FunctionSheet({
  openId,
  orderLabel,
  currentArticle,
  onClose,
  onOpenFunction,
  onTravelBack,
  children,
}: FunctionSheetProps) {
  const isOpen = openId !== null
  const primaryTarget: FunctionId = openId === 'praticar' ? 'estudo' : 'praticar'
  const primaryLabel = openId === 'praticar' ? 'Ver meu estudo' : 'Praticar'

  return (
    <section
      className={`sheet${isOpen ? ' open' : ''}`}
      aria-hidden={!isOpen}
      aria-label={openId ? `Função ${FUNCTION_LABELS[openId]}` : undefined}
    >
      {openId && (
        <>
          <header className="sheet-head">
            <button type="button" className="back-btn" onClick={onClose}>
              ← Voltar
            </button>
            <div className="meta">
              <small>Função {orderLabel}</small>
              <strong>{FUNCTION_LABELS[openId]}</strong>
            </div>
          </header>

          <div className="sheet-body">
            {currentArticle !== 5 ? (
              <div>
                <p className="lead">
                  Você pousou no {NEIGHBORS[currentArticle].label} —{' '}
                  {NEIGHBORS[currentArticle].name}. O conteúdo completo deste artigo ainda não
                  foi carregado neste projeto: só o art. 5º tem texto, questões e flashcards.
                </p>
                <p className="lead">
                  A viagem entre planetas já funciona. Volte para o art. 5º para continuar
                  estudando, ou aguarde o conteúdo dos artigos vizinhos.
                </p>
                <button type="button" className="quiz-next" onClick={onTravelBack}>
                  Voltar ao Art. 5º — Territorialidade
                </button>
              </div>
            ) : (
              children
            )}
          </div>

          <footer className="sheet-foot">
            <button type="button" className="primary" onClick={() => onOpenFunction(primaryTarget)}>
              {primaryLabel}
            </button>
            <button type="button" className="ghost" onClick={onClose}>
              Voltar ao globo
            </button>
          </footer>
        </>
      )}
    </section>
  )
}
