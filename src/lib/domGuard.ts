/**
 * DOM Immunity Guard
 * 
 * Previne falhas catastróficas do React (NotFoundError: Failed to execute 'removeChild' on 'Node' / 'insertBefore')
 * causadas por extensões do navegador (Google Translate, Grammarly, etc.) ou race conditions
 * no ciclo de desmontagem de Portals da Radix UI / Framer Motion.
 */

if (typeof window !== 'undefined' && typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child && child.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[DOM Guard] Ignorada tentativa de remover nó órfão do DOM:', child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[DOM Guard] Ignorada tentativa de inserção com nó de referência órfão:', referenceNode);
      }
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

// Ignora erros inofensivos do ResizeObserver que podem derrubar a tela (ErrorBoundary)
if (typeof window !== 'undefined') {
  const isResizeObserverLoopErr = (msg: string | Event) => {
    if (typeof msg === 'string') return msg.includes('ResizeObserver loop limit exceeded') || msg.includes('ResizeObserver loop completed with undelivered notifications');
    if (msg instanceof ErrorEvent) return msg.message.includes('ResizeObserver loop');
    return false;
  };
  
  window.addEventListener('error', (e) => {
    if (isResizeObserverLoopErr(e)) {
      e.stopImmediatePropagation();
    }
  });

  // Intercepta os erros de ResizeObserver que chegam pelo console.error / window.onerror e impede que subam para o ErrorBoundary do React
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && isResizeObserverLoopErr(args[0])) {
      return;
    }
    originalError.call(console, ...args);
  };
}

export {};
