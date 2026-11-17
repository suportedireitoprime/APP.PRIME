import type { ProgressSummary } from '../types'

/** Função 7 — Meu Estudo: painel de progresso do artigo. */
export default function MeuEstudo({ summary }: { summary: ProgressSummary }) {
  const checklist = [
    { key: 'texto', done: summary.checks.texto, label: 'Ler os 3 blocos e marcar os trechos como lidos' },
    { key: 'ouvir', done: summary.checks.ouvir, label: 'Ouvir a áudio-aula ou a pílula do artigo' },
    { key: 'assistir', done: summary.checks.assistir, label: 'Abrir uma videoaula ou pílula da Lousa Animada' },
    { key: 'praticar', done: summary.checks.praticar, label: 'Responder às 5 questões do artigo' },
    { key: 'flash', done: summary.checks.flash, label: 'Virar os 6 flashcards' },
  ]

  return (
    <div>
      <p className="lead">
        É o seu painel neste artigo: quanto você já leu, ouviu, respondeu e memorizou — e o que
        ainda falta para fechar os 100%.
      </p>

      <div className="stat-grid">
        <div className="stat">
          <b>
            {summary.readCount}/{summary.readTotal}
          </b>
          <span>trechos marcados como lidos</span>
        </div>
        <div className="stat">
          <b>{summary.quizScore}</b>
          <span>questões acertadas</span>
        </div>
        <div className="stat">
          <b>
            {summary.fcCount}/{summary.fcTotal}
          </b>
          <span>flashcards virados</span>
        </div>
      </div>

      <p>
        Domínio do art. 5º do CP:
      </p>
      <p className="big-pct">{summary.pct}%</p>
      <div className="bar" aria-hidden>
        <i style={{ width: `${summary.pct}%` }} />
      </div>
      <p className="lead">— o mesmo percentual enche o anel dourado ao redor do globo.</p>

      <ul className="check-list">
        {checklist.map((item) => (
          <li key={item.key} className={item.done ? 'done' : ''}>
            <span className="ck" aria-hidden>
              {item.done ? '✓' : '○'}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>

      <p className="note">
        Protótipo: o progresso vale para este navegador. No Atlas final, ele fica salvo por
        artigo e alimenta a revisão espaçada.
      </p>
    </div>
  )
}
