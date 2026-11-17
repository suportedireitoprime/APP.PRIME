import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  /** O que mostrar no lugar quando o filho quebra (globo 2D, aviso...). */
  fallback: ReactNode
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * ErrorBoundary para o Canvas 3D (e qualquer filho).
 *
 * Sem ele, um erro dentro do WebGL — driver sem suporte, contexto
 * perdido, textura inválida — derrubava o app inteiro numa tela branca.
 * Com ele, o erro fica contido aqui dentro e o usuário vê o fallback
 * (globo 2D estático + funções no rodapé), nunca tela preta.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    // Log local apenas — nada é enviado para fora.
    console.error('[Atlas] Erro contido pelo ErrorBoundary:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
