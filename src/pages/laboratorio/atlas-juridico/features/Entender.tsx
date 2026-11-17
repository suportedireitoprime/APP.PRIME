import { CORNELL, CORNELL_SUMMARY, NAO_CONFUNDA } from '../data/article5'

/** Função 4 — Entender: resumo Cornell, mapa mental e "não confunda". */
export default function Entender() {
  return (
    <div>
      <p className="lead">
        É o artigo explicado de forma curta: resumo Cornell, mapa mental e os pares que mais
        se confundem. Para fixar a ideia, em cerca de 8 minutos.
      </p>

      {CORNELL.map((item) => (
        <div key={item.q} className="qa">
          <strong>{item.q}</strong>
          <p>{item.a}</p>
        </div>
      ))}
      <p className="nc">
        <strong>Resumo:</strong> {CORNELL_SUMMARY}
      </p>

      <div className="mindmap">
        <div className="root">ART. 5º — CP · Territorialidade</div>
        <ul>
          <li>
            Caput — crime no território nacional → lei brasileira
          </li>
          <li>
            § 1º — Brasileiras
            <ul>
              <li>pública: em qualquer lugar</li>
              <li>privada: alto-mar / espaço aéreo</li>
            </ul>
          </li>
          <li>
            § 2º — Estrangeiras
            <ul>
              <li>só privadas, quando no Brasil</li>
              <li>pouso · porto · mar territorial</li>
            </ul>
          </li>
          <li>Vizinhos do artigo: art. 6º (lugar do crime) · art. 7º (extraterritorialidade)</li>
          <li>Temperada: tratados limitam a regra</li>
        </ul>
      </div>

      <h3>Não confunda</h3>
      {NAO_CONFUNDA.map((pair) => (
        <div key={pair.a} className="qa">
          <strong>{pair.a}</strong>
          <p>{pair.b}</p>
        </div>
      ))}
    </div>
  )
}
