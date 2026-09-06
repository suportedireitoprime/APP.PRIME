import { Component, ErrorInfo, ReactNode } from 'react';
import { WifiOff } from 'lucide-react';
import { recordException } from '@/lib/nativeCrashlytics';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  private isChunkError(message: string): boolean {
    return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \d+ failed|Failed to load module script/i.test(message);
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const isChunkLoadFailed = this.isChunkError(error?.message || '');

    if (isChunkLoadFailed) {
      const reloadCount = parseInt(sessionStorage.getItem('chunk_reload') || '0', 10);
      if (reloadCount < 1) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
        return;
      }
    } else {
      sessionStorage.removeItem('chunk_reload');
    }

    void recordException(error, {
      source: 'react.ErrorBoundary',
      componentStack: (info.componentStack || '').slice(0, 500),
    });
  }

  reset = () => {
    if (this.isChunkError(this.state.error?.message || '')) {
      window.location.reload();
    } else {
      this.setState({ error: null });
    }
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    // Item 53: Intercepta navegação em rota não cacheada durante ausência de internet
    const isOffline = typeof navigator !== 'undefined' && (!navigator.onLine || /NetworkError|Failed to fetch|offline/i.test(error.message));

    if (isOffline) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0D0D0D] text-white p-6 text-center gap-5">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-2">
            <WifiOff className="w-8 h-8" strokeWidth={1.75} />
          </div>
          <div className="space-y-2 max-w-sm">
            <h1 className="text-xl font-bold tracking-tight text-white">Sem conexão com a internet</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Esta tela precisa de conexão com a internet para ser carregada pela primeira vez. Conecte-se e tente novamente.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs pt-2">
            <button
              type="button"
              onClick={this.reset}
              className="w-full py-3 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-95 active:scale-95 transition-all"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/'; }}
              className="w-full py-3 px-5 rounded-xl bg-white/10 text-white font-medium text-sm hover:bg-white/15 active:scale-95 transition-all"
            >
              Ir para o Início
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#0D0D0D] text-[#FFFFFF] p-6 gap-4">
        <h1 className="text-2xl font-semibold">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          O app encontrou um erro inesperado. A ocorrência já foi registrada.
        </p>
        <pre className="text-xs bg-muted p-3 rounded max-w-full overflow-auto max-h-40">
          {error.message}
        </pre>
        <button
          onClick={this.reset}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm"
        >
          Tentar novamente
        </button>
      </div>
    );
  }
}
