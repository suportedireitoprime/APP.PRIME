---
name: desktop-fluidez-extrema
description: Especialista em otimização de renderização e animações React/Framer Motion para fluidez absoluta (60-120fps) no Desktop. Elimina travamentos, layout thrashing e quedas de frame.
---

# 🚀 Skill: Desktop Fluidez Extrema (Zero Lag & 120fps)

Esta skill define as regras definitivas de ouro para transformar interfaces React web/desktop (especialmente aquelas que usam listas pesadas, modais e Framer Motion) em experiências hiper fluidas, responsivas e sem nenhum tipo de engasgo (jank).

## 1. Regras de Renderização (React)
- **Componentes Puros:** Listas, Grids e Cards que não mudam de estado constantemente DEVEM ser envelopados com `React.memo()`. Ex: `export default memo(MeuCard);`
- **Isolamento de Estado:** Não coloque estados que mudam frequentemente (ex: posição de scroll, hover styles controlados via JS) na raiz da página. Isole-os em componentes folha (leaf components).
- **Callback Estabilidade:** Funções passadas para itens de lista devem sempre utilizar `useCallback` para não quebrar a memoização.

## 2. Framer Motion & Animações Otimizadas
- **Priorize Transform e Opacity:** NUNCA anime `width`, `height`, `top`, `left`, `margin` ou `padding`. Isso causa **Layout Thrashing** (recálculo completo de geometria pelo browser). Anime **apenas** `scale`, `x`, `y` e `opacity`.
- **Layout Animations Cuidadosas:** O atributo `layout` do Framer Motion é pesado se usado em listas imensas. Restrinja o `layoutId` apenas aos elementos visíveis na tela.
- **Hardware Acceleration:** Para animações intensas, force a renderização na GPU usando `will-change: transform, opacity` no CSS ou a propriedade `willChange` do Framer Motion.
- **Molas (Springs) mais Rígidas para Desktop:** Telas grandes parecem lentas com molas soltas. Use `stiffness: 400, damping: 35` ao invés dos padrões do mobile.

## 3. Imagens e Pintura (Painting)
- **Containment CSS:** Use `contain: content` ou `contain: paint` em grids e sidebars grandes. Isso diz ao navegador: "Se o conteúdo dentro dessa div mudar, você não precisa recalcular o resto da página".
- **Eager vs Lazy:** Apenas a Hero image principal da tela deve ser `loading="eager"`. Todos os cards de livros, coleções e avatares abaixo da dobra devem ter `loading="lazy"` e `decoding="async"`.
- **Blur e Filtros:** Efeitos de `backdrop-blur` são os maiores causadores de perda de frames em scroll no macOS/Windows se aplicados em elementos muito grandes e transparentes sobrepostos a vídeos/imagens. Otimize a área de desfoque ou aplique um `transform: translateZ(0)` para isolar a camada.

## 4. Scroll e Virtualização
- **Overscroll Behavior:** Aplique `overscroll-contain` em barras laterais e listas isoladas para que a página inteira não trave ou tente dar "bounce" quando o mouse chegar ao fim da rolagem.
- **Listeners Passivos:** Se houver um `window.addEventListener('scroll', ...)`, garanta a flag `{ passive: true }` para não bloquear a thread principal (embora no React hooks customizados já devam fazer isso).

## 5. Checklist de Aplicação por Módulo (Biblioteca)
Ao aplicar essa skill em uma rota, verifique:
1. [ ] A grid principal da tela está usando `memo` nos cards filhos?
2. [ ] As imagens da grid estão em tamanho otimizado (`240w` via Supabase Image Transform) com `loading="lazy"`?
3. [ ] Houve quebra de layout ao abrir/fechar modais? Se sim, a culpa pode ser da rolagem ou animação do Framer Motion sem `transform`.
4. [ ] Efeitos de hover nos cards estão limitados ao CSS (`group-hover:scale-105`) e não gerenciados por `onMouseEnter`/`setState`?
