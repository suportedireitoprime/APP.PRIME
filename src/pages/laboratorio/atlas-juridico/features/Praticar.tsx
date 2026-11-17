import { useState } from 'react'
import { FLASHCARDS, QUIZ } from '../data/article5'

interface PraticarProps {
  onQuizAnswer: (right: boolean) => void
  onResetQuiz: () => void
  onToggleFlashcard: (idx: number, flipped: boolean) => void
  fcSeen: Set<number>
}

/** Função 5 — Praticar: quiz com gabarito comentado + flashcards. */
export default function Praticar({
  onQuizAnswer,
  onResetQuiz,
  onToggleFlashcard,
  fcSeen,
}: PraticarProps) {
  const [qi, setQi] = useState(0)
  const [locked, setLocked] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [finished, setFinished] = useState(false)
  const [rightCount, setRightCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [flipped, setFlipped] = useState<Set<number>>(new Set())

  const item = QUIZ[qi]

  const answer = (i: number) => {
    if (locked) return
    setLocked(true)
    setPicked(i)
    const right = i === item.right
    if (right) setRightCount((c) => c + 1)
    setAnsweredCount((c) => c + 1)
    onQuizAnswer(right)
  }

  const next = () => {
    if (qi < QUIZ.length - 1) {
      setQi(qi + 1)
      setLocked(false)
      setPicked(null)
    } else {
      setFinished(true)
    }
  }

  const restart = () => {
    setQi(0)
    setLocked(false)
    setPicked(null)
    setFinished(false)
    setRightCount(0)
    setAnsweredCount(0)
    onResetQuiz()
  }

  const flip = (i: number) => {
    const nextFlipped = new Set(flipped)
    const willFlip = !nextFlipped.has(i)
    if (willFlip) nextFlipped.add(i)
    else nextFlipped.delete(i)
    setFlipped(nextFlipped)
    onToggleFlashcard(i, willFlip)
  }

  const resultText =
    rightCount >= 4
      ? 'Parabéns! Domínio forte do artigo — vale revisar só os trechos que você ainda não marcou como lidos.'
      : rightCount >= 3
        ? 'Bom caminho. Refaça as questões erradas depois de reler o bloco correspondente (§ 1º ou § 2º) na tela Texto.'
        : 'Hora de revisar: volte aos 3 blocos na tela Texto — caput, § 1º e § 2º — e tente de novo.'

  return (
    <div>
      <p className="lead">
        É a hora de testar o que você estudou: questões só deste artigo, com gabarito comentado
        na hora, e flashcards para memorizar. Cerca de 12 minutos.
      </p>

      {finished ? (
        <div>
          <p className="lead">
            <strong>Resultado</strong>
          </p>
          <p>
            Você acertou {rightCount} de {QUIZ.length} questões do art. 5º do CP.
          </p>
          <p className="qexp show">{resultText}</p>
          <button type="button" className="quiz-next" onClick={restart}>
            Refazer o quiz
          </button>
        </div>
      ) : (
        <div>
          <p className="lead">
            QUESTÃO {qi + 1} DE {QUIZ.length}
          </p>
          <p>
            <strong>{item.q}</strong>
          </p>
          {item.opts.map((opt, i) => (
            <button
              key={opt}
              type="button"
              className={`qopt${locked && i === item.right ? ' right' : ''}${locked && i === picked && i !== item.right ? ' wrong' : ''}`}
              disabled={locked}
              onClick={() => answer(i)}
            >
              {'ABCD'[i]}) {opt}
            </button>
          ))}
          {locked && (
            <p className="qexp show">
              {(picked === item.right ? '✓ Correto. ' : '✗ Não foi dessa vez. ') + item.exp}
            </p>
          )}
          <p className="lead">
            Acertos: {rightCount} de {answeredCount}
          </p>
          <button type="button" className="quiz-next" disabled={!locked} onClick={next}>
            {qi === QUIZ.length - 1 ? 'Ver resultado' : 'Próxima questão'}
          </button>
        </div>
      )}

      <h3>Flashcards do art. 5º do CP</h3>
      <p className="lead">
        Toque num cartão para virar e ver a resposta. {fcSeen.size}/{FLASHCARDS.length} virados.
      </p>
      <div className="fc-grid">
        {FLASHCARDS.map((fc, i) => (
          <button
            key={fc.front}
            type="button"
            className={`fc${flipped.has(i) ? ' flipped' : ''}`}
            aria-label={`Flashcard ${fc.front} — tocar para virar`}
            aria-pressed={flipped.has(i)}
            onClick={() => flip(i)}
          >
            <span className="k">{fc.tag}</span>
            {flipped.has(i) ? fc.back : fc.front}
            {!flipped.has(i) && (
              <span style={{ display: 'block', marginTop: 10, fontSize: '.78rem', color: 'var(--ink2)' }}>
                toque para virar
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
