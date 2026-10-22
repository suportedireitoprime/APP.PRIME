# Corrigir o "página não encontrada" e conferir todas as telas

## O que encontrei
- As **333 telas** do repositório estão no projeto, inclusive a lista completa de endereços do app original: Vade Mecum, questões, flashcards, videoaulas, resumos, jurisprudência, aprender, ferramentas, admin, simulados, biblioteca e as demais áreas.
- O erro está no **tradutor de navegação** que criei para o código original funcionar aqui. Ao escolher a tela para um endereço, ele dava preferência à página "não encontrada", que é a regra que aceita qualquer endereço, em vez da página inicial ("/"). Por isso a primeira tela mostra 404, mesmo com a página inicial existindo.
- O mesmo problema pode afetar outros endereços que tenham uma regra genérica parecida, como "/ir/...".

## O que vou fazer
1. Ajustar o tradutor para escolher a tela certa nesta ordem: endereço exato primeiro, depois endereços com partes que variam (por exemplo, o número de um artigo), e a página "não encontrada" só no fim.
2. Abrir a página inicial e conferir que ela mostra a página de apresentação (sem login) em vez do 404.
3. Fazer uma varredura automática pelos 333 endereços do app original e verificar, para cada um, que ele não cai na página "não encontrada". Sem login, as telas protegidas devem levar ao login, o que também conta como certo.
4. Entregar um relatório com a lista de áreas e telas, marcando o que abriu e o que deu problema, e corrigir na hora o que der problema.

## Limitação
Este projeto usa o seu próprio Supabase, então eu não consigo entrar com uma conta para testar o conteúdo das telas depois do login. Vou confirmar que cada endereço leva à tela certa. O conteúdo das telas logadas você confere entrando com o seu usuário.

## Detalhes técnicos
- `src/lib/router-compat.tsx`: em `score()`, contar `*` como negativo (por exemplo, -1000) e fazer o "/" exato vencer qualquer regra genérica. Desempate entre segmentos fixos e com parâmetro como no react-router.
- Varredura feita com Playwright usando os caminhos extraídos de `src/AppRoutes.tsx`, com os parâmetros preenchidos por valores de exemplo, conferindo se o componente NotFound aparece.
