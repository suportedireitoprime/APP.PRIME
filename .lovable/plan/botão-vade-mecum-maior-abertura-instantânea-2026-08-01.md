# Botão Vade Mecum maior + abertura instantânea

## 1. Botão central maior (sem mexer no título)

No rodapé (`BottomNav.tsx`), o botão central hoje tem 64px (`w-16 h-16`) posicionado em `-top-7`.

- Aumentar para 72px (`w-[72px] h-[72px]`) e o ícone da balança de 32px para 36px.
- Subir o deslocamento para `-top-9`, de modo que a base do círculo continue exatamente na mesma linha de antes: o rótulo "Vade Mecum" e os demais itens do menu ficam na mesma posição, sem descer nem sobrepor.
- Ajustar apenas o raio da sombra/brilho para acompanhar o novo diâmetro.

## 2. Abertura instantânea

Hoje o clique dispara três atrasos somados:

- o chunk da página só começa a baixar no `onPointerDown`;
- a rota passa por `PageTransition` (animação de entrada) e `Suspense`;
- ao montar, a página carrega hero, carrossel "Aprenda sobre Leis" e seções da home, que fazem requisições antes de aparecer conteúdo.

Correções:

- **Pré-carregar o chunk assim que o rodapé aparece**, em `requestIdleCallback`, em vez de esperar o toque. Inclui também os componentes pesados que a página monta.
- **Navegar imediatamente no `pointerdown`** (com o `click` como fallback), eliminando o atraso de ~100-300ms do toque.
- **Fallback de Suspense com o esqueleto do Vade Mecum** (hero + barra de busca) em vez de tela vazia, para a troca parecer instantânea mesmo quando algo ainda carrega.
- Manter a animação de transição curta nessa rota para não atrasar a pintura.

## Detalhes técnicos

- Arquivos: `src/components/vademecum/BottomNav.tsx` (tamanho, offset, prefetch em idle, navegação no pointerdown) e `src/App.tsx` (fallback do Suspense da rota `/vade-mecum`, se necessário).
- Prefetch via `import('@/pages/VadeMecum.tsx')` dentro de `useEffect` + `requestIdleCallback`, com guarda para rodar uma única vez.
- Nenhuma mudança de dados, rotas ou cores.
