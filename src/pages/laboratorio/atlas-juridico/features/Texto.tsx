import { useState } from 'react'
import { BLOCKS, TRECHOS } from '../data/article5'

interface TextoProps {
  read: Set<number>
  onToggleRead: (idx: number) => void
}

/** Função 1 — Texto: texto oficial em 3 blocos + trechos marcáveis. */
export default function Texto({ read, onToggleRead }: TextoProps) {
  const [filter, setFilter] = useState('')
  const shown = TRECHOS.map((t, i) => ({ ...t, idx: i })).filter(
    (t) =>
      !filter ||
      t.label.toLowerCase().includes(filter) ||
      t.text.toLowerCase().includes(filter),
  )

  return (
    <div>
      <p className="lead">
        É a leitura do artigo em si: o texto oficial do art. 5º do CP, dividido em 3 blocos
        curtos, cada um com um “não confunda” e um caso prático. É por aqui que tudo começa.
      </p>

      {BLOCKS.map((b) => (
        <article key={b.kicker} className="block">
          <div className="kicker">{b.kicker}</div>
          <h3>{b.title}</h3>
          <p className="official">{b.official}</p>
          <p>{b.body}</p>
          <p className="nc">
            <strong>Não confunda:</strong> {b.notConfunda}
          </p>
          <p className="case">
            <strong>Caso prático:</strong> {b.case}
          </p>
        </article>
      ))}

      <h3>Trechos para marcar como lidos</h3>
      <p className="lead">
        Toque num trecho para marcá-lo como lido e alimentar o anel de progresso do globo.
      </p>
      <input
        className="search"
        type="search"
        placeholder="Buscar num trecho… (ex.: alto-mar, privada)"
        value={filter}
        onChange={(e) => setFilter(e.target.value.trim().toLowerCase())}
        aria-label="Buscar num trecho do artigo"
      />
      <p className="lead">
        {shown.length} de {TRECHOS.length} trechos · {read.size} lidos
      </p>
      {shown.map((t) => (
        <button
          key={t.idx}
          type="button"
          className={`inciso${read.has(t.idx) ? ' read' : ''}`}
          aria-pressed={read.has(t.idx)}
          onClick={() => onToggleRead(t.idx)}
        >
          <span className="rn">{t.label}</span>
          <span className="tag">LIDO</span>
          {t.text}
        </button>
      ))}
      <p className="note">
        Texto conforme o Código Penal compilado (Planalto). O art. 5º deve ser lido junto com
        o art. 6º (lugar do crime) e o art. 7º (extraterritorialidade).
      </p>
    </div>
  )
}
