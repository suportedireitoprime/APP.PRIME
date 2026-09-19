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
    return originalRemoveChild.apply(this, arguments as any) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('[DOM Guard] Ignorada tentativa de inserção com nó de referência órfão:', referenceNode);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments as any) as T;
  };
}

export {};
