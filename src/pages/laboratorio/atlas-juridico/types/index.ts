/** Tipos partilhados do Atlas Jurídico. Nada aqui conhece DOM ou Three.js. */

export type FunctionId =
  | 'texto'
  | 'ouvir'
  | 'assistir'
  | 'entender'
  | 'praticar'
  | 'aprofundar'
  | 'estudo'

export interface FunctionMeta {
  id: FunctionId
  /** Rótulo curto, igual no globo, no rodapé e nas telas. */
  label: string
  /** Posição na ordem das 7 funções (1..7). */
  order: number
}

export interface Preview {
  id: FunctionId
  orderLabel: string
  title: string
  cta: string
  time: string
  desc: string
  items: string[]
}

export interface ArticleBlock {
  kicker: string
  title: string
  /** Texto oficial, transcrito do CP compilado. */
  official: string
  body: string
  notConfunda: string
  case: string
}

export interface Trecho {
  label: string
  text: string
}

export interface QuizQuestion {
  q: string
  opts: string[]
  right: number
  exp: string
}

export interface Flashcard {
  tag: string
  front: string
  back: string
}

export interface NeighborArticle {
  num: number
  label: string
  /** Título correto do CP — verificado contra o texto compilado. */
  name: string
  sub: string
}

export interface MarkerDef {
  id: FunctionId
  label: string
  lat: number
  lon: number
}

/** Foco pedido ao globo: girar até centralizar o marcador da função. */
export interface FocusRequest {
  id: FunctionId
  nonce: number
}

export interface ProgressState {
  read: Set<number>
  quizAnswered: number
  quizRight: number
  fcSeen: Set<number>
  listened: boolean
  watched: boolean
}

export interface ProgressSummary {
  pct: number
  readCount: number
  readTotal: number
  quizScore: string
  fcCount: number
  fcTotal: number
  /** 5 trechos do anel de progresso, na ordem: texto, ouvir, assistir, praticar, flashcards. */
  segments: boolean[]
  checks: Record<'texto' | 'ouvir' | 'assistir' | 'praticar' | 'flash', boolean>
}
