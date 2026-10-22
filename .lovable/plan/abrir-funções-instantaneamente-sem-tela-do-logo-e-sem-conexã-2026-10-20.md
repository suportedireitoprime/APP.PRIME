# Abrir funções instantaneamente (sem tela do logo e sem "Conexão restabelecida")

## Causa
O app inteiro está montado em duas "páginas" separadas: a página inicial e todas as outras. Quando você sai do início para uma função (ou volta), o app é desmontado e carregado do zero. Por isso aparece a tela de abertura com a coruja e o aviso de conexão (o vigia de internet "nasce" de novo a cada recarga e dispara o aviso).

## O que será feito
1. Montar o app uma única vez, na moldura principal do site, para que ele continue vivo durante toda a navegação. As páginas "início" e "demais" passam a só informar o título da aba, sem recarregar nada.
2. Ajustar o aviso de internet para aparecer apenas quando a conexão realmente cair e voltar — nunca ao abrir uma função.
3. Conferir se a tela de abertura (coruja) só aparece na primeira vez que o app abre.

## Verificação
Navegar no preview entre início, audioaulas, Vade Mecum e voltar, confirmando que não aparece mais a tela do logo nem o aviso, e que as páginas abrem na hora.

## Detalhes técnicos
- `src/routes/index.tsx` e `src/routes/$.tsx` renderizam `LegacyAppHost` cada um → troca de rota TanStack remonta tudo. Mover `LegacyAppHost` para `__root.tsx` (client-only, fora do `<Outlet />`) e deixar as rotas com `component: () => null`, mantendo `head()`.
- `OfflineWatcher`: mostrar "Conexão restabelecida" só se houve um evento `offline` anterior (ref `wasOffline`).
- Revisar o splash do `App` para depender de flag de sessão (`sessionStorage`) e não reaparecer em navegação.
