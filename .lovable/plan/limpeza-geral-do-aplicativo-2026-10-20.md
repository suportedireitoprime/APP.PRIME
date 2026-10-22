# Limpeza geral do aplicativo

Objetivo: remover tudo que não é usado, sem mudar nada que o usuário vê ou faz no app.

## Etapa 1 — Análise (relatório antes de apagar)
Gerar um relatório com:
- Arquivos de código que nenhuma tela usa (componentes, páginas, hooks, serviços)
- Funções, exportações e importações não usadas dentro de arquivos vivos
- Pacotes instalados que o código não importa
- Imagens, sons e arquivos em `public/` e `src/assets/` sem nenhuma referência
- Restos da migração: scripts de teste, pastas `scratch`, documentos soltos, arquivos de Electron/Capacitor que não rodam aqui, código de Dropbox/armazenamento antigo que foi substituído pelo R2
- Páginas duplicadas (versões "v2", "old", "backup") e rotas que apontam para telas que ninguém acessa

O relatório é apresentado a você com números e a lista do que será removido.

## Etapa 2 — Remoção segura (em lotes)
1. Arquivos órfãos e pacotes sem uso
2. Imagens/arquivos sem referência
3. Código morto dentro dos arquivos (importações, variáveis, ramos que nunca rodam)
4. Marcações `@ts-nocheck` desnecessárias onde o arquivo já compila limpo

Após cada lote: o app precisa compilar sem erros e as 330 páginas continuam abrindo (mesma varredura usada antes).

## O que NÃO será mexido
- Telas, rotas e comportamento visíveis
- Banco de dados, usuários e conteúdo
- Funções do servidor (edge functions) — apenas listadas no relatório, removidas só com sua confirmação
- A camada que faz o app rodar aqui (compatibilidade de rotas, carregamento do app)

## Detalhes técnicos
- Ferramentas: `knip` (arquivos/exports/deps não usados) + `ts-prune`/busca por referências para assets; varredura Playwright das rotas de `src/AppRoutes.tsx` como regressão.
- Entradas consideradas vivas: `src/routes/**`, `src/AppRoutes.tsx`, `src/App.tsx`, imports dinâmicos (`lazyWithRetry`, `routePrefetch`) e caminhos montados por string (verificados manualmente antes de apagar).
- Pacotes removidos com `bun remove`; nunca `react-router-dom` (é um alias).
