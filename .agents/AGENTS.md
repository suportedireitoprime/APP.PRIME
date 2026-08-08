# Diretivas do Projeto

## Git & GitHub (Auto-Commit & Push)
- Sempre que alterações no código forem finalizadas com sucesso (criação de arquivos, correções, refatorações ou novas funcionalidades), a IA deve automaticamente executar os comandos para enviar as atualizações ao GitHub:
  1. `git add .`
  2. `git commit -m "<descrição detalhada das alterações>"`
  3. `git push`
- **Executável Git no Windows:** Se o comando `git` padrão não for localizado no `PATH`, utilize o caminho absoluto da instalação do GitHub Desktop:
  `C:\Users\ext_wpereira\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe`

## Ambiente & Comandos de Execução (Windows / PowerShell)
- **Verificação de Tipos TypeScript:** Executar `.\node_modules\.bin\tsc.CMD --noEmit` para validar a ausência de erros de compilação.
- **Build do Projeto:** Executar `.\node_modules\.bin\vite.CMD build` para testar o empacotamento de produção.
- **Servidor de Desenvolvimento:** O servidor Vite deve rodar sempre na porta `8080` (`.\node_modules\.bin\vite.CMD --port 8080 --host`), alinhado com a configuração do Capacitor em `capacitor.config.ts` (`http://10.0.2.2:8080`).

## Arquitetura & Estabilidade (React + Capacitor 8 + Supabase)
- **Prevenção de Tela Branca:**
  - Manter estilos inline de fundo escuro (`background-color: #0D0D0D; color: #FFFFFF`) no `<body>` do `index.html` para evitar relâmpagos brancos durante a hidratação.
  - Certificar-se de que novos componentes principais e rotas sejam protegidos pelo `ErrorBoundary` e que `Suspense` utilize fallbacks visuais adaptados ao tema escuro.
- **Suporte Nativo Mobile & Safe Areas (Android 15 / iOS 18):**
  - Respeitar os insets de tela (status bar e navigation bar) utilizando `env(safe-area-inset-*)` no CSS.
  - Todas as chamadas de plugins nativos (`@capacitor/*`, `@capacitor-community/*`, `@capawesome/*`) devem possuir fallbacks graciosos para a Web/PWA.
- **Integração com Supabase & Operação Offline:**
  - Utilizar sempre as definições de tipos em `src/integrations/supabase/types.ts`.
  - Reutilizar a camada de persistência com `idb-keyval`, Dexie ou React Query para garantir que a aplicação continue utilizável offline.
- **Padrão Visual & UX Premium:**
  - Manter o tema escuro elegante (fundo `#0D0D0D`, acentos em vinho e dourado, tipografia Barlow / Bebas Neue).
  - Aplicar micro-animações com `framer-motion` de forma fluida, prevenindo re-renders excessivos.

## Eficiência de Tokens & Desempenho (Padrão Lovable & Antigravity)
- **Busca Direcionada (Progressive Disclosure):** Use `grep_search` e `view_file` com intervalos de linhas delimitados para inspecionar código. Nunca leia arquivos inteiros desnecessariamente.
- **Edição Cirúrgica (`replace_file_content`):** Altere apenas os blocos de código modificados. Evite reescrever arquivos completos.
- **Respostas Enxutas:** Não cole códigos inteiros nas respostas do chat. Use links clicáveis no formato `[arquivo](file:///caminho#L1-L10)`.
- **Economia de Contexto:** Reutilize informações já levantadas nos turnos anteriores para evitar consumo excessivo de tokens de contexto.
- **Validação Prática:** Nunca declare conclusão de tarefa sem rodar `tsc.CMD --noEmit` ou o comando de verificação adequado.

