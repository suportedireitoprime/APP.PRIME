# Diretivas do Projeto & Skills Nativas Incorporadas

## Git & GitHub (Auto-Commit & Push 100% Automático)
- **REGRA SUPREMA DE VERSIONAMENTO:** Toda vez que qualquer alteração no código for finalizada com sucesso (criação, correção, refatoração), você **JÁ DEVE ENVIAR para o GitHub AUTOMATICAMENTE**, sem esperar que o usuário peça. O objetivo é engatilhar a build (Vercel/etc) instantaneamente.
- **Comando no PowerShell:** O PowerShell no Windows não aceita `&&`. Use ponto e vírgula (`;`) para encadear os comandos na mesma linha, exemplo:
  `git add . ; git commit -m "sua descrição" ; git push`
- **Executável Git no Windows:** Se o comando `git` padrão não for localizado no `PATH`, utilize o caminho absoluto da instalação do GitHub Desktop:
  `C:\Users\ext_wpereira\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe add . ; C:\...\git.exe commit -m "..." ; C:\...\git.exe push`

## Ambiente & Comandos de Execução (Windows / PowerShell)
- **Verificação de Tipos TypeScript:** Executar `.\node_modules\.bin\tsc.CMD --noEmit` para validar a ausência de erros de compilação.
- **Build do Projeto:** Executar `.\node_modules\.bin\vite.CMD build` para testar o empacotamento de produção.
- **Servidor de Desenvolvimento:** O servidor Vite deve rodar sempre na porta `8080` (`.\node_modules\.bin\vite.CMD --port 8080 --host`), alinhado com a configuração do Capacitor em `capacitor.config.ts` (`http://10.0.2.2:8080`).

## Arquitetura & Estabilidade (React + Capacitor 8 + Supabase)
- **Prevenção de Tela Branca:**
  - Manter estilos inline de fundo escuro (`background-color: #0D0D0D; color: #FFFFFF`) no `<body>` do `index.html` para evitar relâmpagos brancos durante a hidratação.
  - Certificar-se de que novos componentes principais e rotas sejam protegidos pelo `ErrorBoundary` e que `Suspense` utilize fallbacks visuais adaptados ao tema escuro (`bg-[#0D0D0D]`).
- **Suporte Nativo Mobile & Safe Areas (Android 15 / iOS 18):**
  - Respeitar os insets de tela (status bar e navigation bar) utilizando `env(safe-area-inset-*)` no CSS.
  - Todas as chamadas de plugins nativos (`@capacitor/*`, `@capacitor-community/*`, `@capawesome/*`) devem possuir fallbacks graciosos para a Web/PWA.
- **Integração com Supabase & Operação Offline:**
  - **Deploy Automático:** Sempre que alterar ou criar *Edge Functions* ou configurações do Supabase, a IA DEVE fazer o deploy automaticamente (ex: `.\node_modules\.bin\supabase.cmd functions deploy <nome> --project-ref dnjrgpldcwcpoywamorr` ou via Supabase MCP). Nunca peça para o usuário rodar os comandos no terminal.
  - Utilizar sempre as definições de tipos em `src/integrations/supabase/types.ts`.
  - Reutilizar a camada de persistência com `idb-keyval`, Dexie ou React Query para garantir que a aplicação continue utilizável offline.

## 🎯 Integrador de Skills Nativas (`.agents/skills/`)

### 1. 🚀 Skill Suprema Final (`skill-suprema-final`)
- **Master Overhaul 360°:** Auditoria total de UX, performance, responsividade, acessibilidade e Supabase em todas as rotas e modais da funcionalidade alterada.
- **Safe Area Insets:** Usar fórmulas aditivas `pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))]` nos headers e `pb-[calc(1.25rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]` nos rodapés/botões primários.
- **Scroll Lock Limpo:** Utilizar `useBodyScrollLock(open)` com purga completa de estilos inline em `release()`, impedindo travamento de tela ao fechar modais.

### 2. 📱 Capacitor & Mobile Native Bug Hunter (`capacitor-native-audit` / `mobile-native-bug-hunter`)
- **Proteção Web:** Encapsular chamadas nativas em `Capacitor.isNativePlatform()`.
- **Dimensões de Toque (HIG & Material 3):** Botões com área mínima clicável de **48x48dp (Android) / 44x44pt (iOS)** (`min-h-[48px]`).
- **Feedback Tátil:** Disparar `haptic.selection()` ou `haptic.impact()` em ações interativas.
- **Zero Scroll Horizontal:** Envelopar contêineres com `w-full max-w-full overflow-x-hidden`.

### 3. 📐 Layout Híbrido & Design Desktop (`skill-layout-hibrido` / `desktop-responsive-design`)
- **Tríplice Responsividade:**
  - **Mobile:** Controles na metade inferior ("Thumb Zone"), botões táteis e recuo de safe area.
  - **Tablet:** Transição para grids de 2 colunas e painéis retráteis.
  - **Desktop Widescreen (`lg:`, `xl:`):** Estrutura de 2 a 3 colunas (`max-w-[1600px] mx-auto`), sidebars laterais fixas e **zero rodapé fixo no PC**.
- **Navegação Desktop:** Suporte a atalhos de teclado (`Esc`, `Enter`, setas) e tooltips em botões de ação.

### 4. ⚡ Otimização de Imagens & Carregamento 0ms (`image-optimization`)
- **Above-the-Fold Images:** Capas, pôsteres e banners principais DEVEM usar `loading="eager"`, `fetchPriority="high"` e `decoding="async"`.
- **Prefetching em Memória:** Pré-carregar capas de próximos itens prováveis via `new Image().src = url`.
- **Fallbacks:** Exibir esqueletos e gradientes elegantes; nunca bordas quebradas.

### 5. 🐛 Bug Hunter & Code Auditor (`bug-hunter`)
- **Cleanup no Unmount:** Retornar função de limpeza em `useEffect` para listeners, intervalos e subscrições Supabase.
- **Evitar State Update em Unmounted:** Checar se componente está montado em rotinas assíncronas antes de chamar `setState`.
- **Promessas Flutuantes:** Embrulhar promessas assíncronas em `void asyncFunc().catch(...)`.
- **TypeScript Estrito:** Substituir `any` por tipos concretos/guardas e usar `?.` e `??`.

### 6. 🚀 Performance Optimization (`performance-optimization`)
- **Code Splitting:** Carregar páginas secundárias via `lazy()` e `Suspense`.
- **Memoização:** Usar `React.memo`, `useMemo` e `useCallback` em listas extensas (leis, buscas, questões).
- **Virtualização:** Utilizar `@tanstack/react-virtual` para listas com mais de 50 itens.

### 7. 🎓 UI/UX Gamificada de Aprendizagem (`skill-gamified-learning-ui`)
- **Loop de Aprendizado em 3 Atos:** Fundamentos -> Aprofundamento -> Fixação.
- **Pílulas Expansíveis:** Manter leitura limpa com pílulas expansíveis ("Em português claro", "Ver exemplo").
- **Alto Contraste (WCAG AAA):** Substituir preto absoluto por grafite/zinc profundo (`bg-[#0d0f12]` / `bg-zinc-950`), ícones em branco puro (`text-white`) e cards elevados (`backdrop-blur-md`).
- **Gamificação Viva:** Header com XP/Streak em tempo real e animações de vitória ao concluir etapas.

## Eficiência de Tokens & Desempenho (Padrão Lovable & Antigravity)
- **Busca Direcionada (Progressive Disclosure):** Use `grep_search` e `view_file` com intervalos de linhas delimitados para inspecionar código. Nunca leia arquivos inteiros desnecessariamente.
- **Edição Cirúrgica (`replace_file_content`):** Altere apenas os blocos de código modificados. Evite reescrever arquivos completos.
- **Respostas Enxutas:** Não cole códigos inteiros nas respostas do chat. Use links clicáveis no formato `[arquivo](file:///caminho#L1-L10)`.
- **Economia de Contexto:** Reutilize informações já levantadas nos turnos anteriores para evitar consumo excessivo de tokens de contexto.
- **Prova Real Obrigatória (Double Check):** Toda vez que você alterar um arquivo (especialmente usando `multi_replace_file_content`), você DEVE rodar `tsc.CMD --noEmit` IMEDIATAMENTE após a alteração para verificar se não gerou erros bobos de sintaxe (como "Identifier has already been declared" por duplicação de linhas) ANTES de avisar o usuário que terminou.
- **Validação Prática:** Nunca declare conclusão de tarefa sem rodar `tsc.CMD --noEmit` ou o comando de verificação adequado.

## Validação Estrita de Infraestrutura & UI (Camada de Segurança)
- **Acesso Direto às Chaves do Supabase:** Nós já possuímos acesso total a todas as chaves de API e Secrets do Supabase (estão no ambiente e no dashboard). Sempre que precisar integrar algo (como GitHub Actions, webhooks ou serviços externos) que dependa do Supabase, **nunca peça ao usuário para configurar chaves manualmente**. Utilize a injeção via código (ex: `Deno.env.get("SUPABASE_URL")` via client_payload) para repassar as credenciais de forma oculta e automatizada.
- **Supabase (Buckets, Tabelas e Edge Functions):** NUNCA presuma o nome de um bucket ou tabela baseado no contexto de outros arquivos. Antes de implementar qualquer código que dependa da infraestrutura do Supabase, você DEVE consultar os dados reais usando a tool `call_mcp_tool` (ex: rodando `SELECT id, name FROM storage.buckets;` via `execute_sql`). Se não for possível usar o MCP, faça uma busca exaustiva (grep) por definições estáticas do projeto.
- **Validação Prática com Browser:** Sempre que construir uma nova interface de administração ou fluxo complexo de UI, utilize a tool `browser_subagent` (ou teste manual se necessário) para simular o clique do usuário final, conferindo se os "toasts" de sucesso aparecem e se não ocorrem erros ("Bucket not found", "Unhandled Rejection", etc) antes de considerar a tarefa como concluída.
- **Sincronia com Edge Functions:** Toda vez que for fazer um novo ajuste, criar uma nova funcionalidade (no Frontend) ou realizar uma correção, VERIFIQUE OBRIGATORIAMENTE se é necessário também refletir ou adaptar essa alteração no Supabase (especialmente em Edge Functions) para que as mudanças de interface não quebrem a API e vice-versa.

## Diretivas Lovable (System Prompt)

- **PERFECT ARCHITECTURE:** Always consider whether the code needs refactoring given the latest request. If it does, refactor the code to be more efficient and maintainable. Spaghetti code is your enemy.
- **MAXIMIZE EFFICIENCY:** For maximum efficiency, whenever you need to perform multiple independent operations, always invoke all relevant tools simultaneously. Never make sequential tool calls when they can be combined.
- **BE CONCISE:** You MUST answer concisely with fewer than 2 lines of text (not including tool use or code generation), unless user asks for detail. After editing code, do not write a long explanation, just keep it as short as possible without emojis.
- **COMMUNICATE ACTIONS:** Before performing any changes, briefly inform the user what you will do.

### SEO Requirements:
ALWAYS implement SEO best practices automatically for every page/component.
- **Title tags**: Include main keyword, keep under 60 characters
- **Meta description**: Max 160 characters with target keyword naturally integrated
- **Single H1**: Must match page's primary intent and include main keyword
- **Semantic HTML**: Use semantic tags correctly
- **Image optimization**: All images must have descriptive alt attributes with relevant keywords
- **Performance**: Implement lazy loading for images, defer non-critical scripts
- **Mobile optimization**: Ensure responsive design with proper viewport meta tag

### Coding guidelines
- ALWAYS generate beautiful and responsive designs.
- Use toast components to inform the user.

## PDF Parsing & GitHub Actions
- **Tratamento de Arquivos no GitHub Actions**: Ao criar rotinas (ex: Python/PyMuPDF) em GitHub Actions que processem arquivos pesados ou extraiam JSON (como sumários/TOC), você DEVE envelopar todo o processamento em blocos `try-except`. Se a execução falhar antes do log de erro final, o registro no Supabase ficará eternamente preso em "processando".
- **Download do Google Drive via Script**: Nunca presuma que uma URL compartilhada do Google Drive fará download direto. Use conversores de URL (ex: `drive.google.com/uc?export=download&id=...`) e cheque a assinatura do byte inicial (`%PDF` vs `<html`) para evitar exceções fatais ao carregar em bibliotecas de extração.

## Comunicação e Dinâmica de Feedback
- **Sugestão Pró-Ativa Pós-Tarefa**: Toda vez que a IA finalizar uma tarefa solicitada pelo usuário e concluir a build com sucesso, ela DEVE propor ativamente uma sugestão de melhoria (UI, performance, código, funcionalidade extra) baseada no que observou ao implementar o pedido. O objetivo é criar um ciclo de "tarefa concluída -> sugestão de próximo passo" para que o usuário possa acatar a ideia ou direcionar para outra.
