import { APROFUNDAR, CASO_COMPLETO, CONEXOES } from '../data/article5'

/** Função 6 — Aprofundar: limites, arts. vizinhos e caso completo. */
export default function Aprofundar() {
  return (
    <div>
      <p className="lead">
        É ir além do texto seco: os limites da regra (tratados e imunidades), os artigos
        vizinhos 6º e 7º e um caso prático completo. Cerca de 7 minutos.
      </p>

      {APROFUNDAR.map((card) => (
        <article key={card.title} className="block">
          <div className="kicker">{card.tag}</div>
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </article>
      ))}

      <article className="block">
        <div className="kicker">Caso prático completo — o tiro a bordo</div>
        <p>{CASO_COMPLETO}</p>
      </article>

      <h3>Conexões do artigo</h3>
      <p className="lead">{CONEXOES}</p>
    </div>
  )
}
