---
name: bug-hunter
description: Realiza auditoria profunda de código, caça de bugs, vazamento de memória (memory leaks), tratamento de exceções e verificação de tipagem TypeScript no projeto. Use quando o usuário pedir para caçar bugs, auditar componentes, encontrar erros ou verificar estabilidade do app.
---

# Skill: Bug Hunter & Code Auditor

Esta skill é ativada para auditar o código do projeto, identificar vulnerabilidades de runtime, prevenir vazamentos de memória e garantir alta estabilidade no app React/TypeScript.

## 🎯 Lista de Verificação de Auditoria (Checklist)

### 1. Memory Leaks e Event Listeners em React
- **useEffect Unsubscribes:** Todo listener de eventos (`window.addEventListener`), subscrição do Supabase (`supabase.channel().subscribe()`) ou intervalo (`setInterval`/`setTimeout`) DEVE retornar uma função de limpeza (*cleanup function*) no `useEffect`.
- **State Updates após Unmount:** Garantir que rotinas assíncronas (como chamadas `fetch` ou promessas longas) verifiquem se o componente ainda está montado (`isMounted.current`) antes de chamar `setState()`.

### 2. Tratamento de Exceções e Erros Silenciosos
- **Catch Bloco Vazio:** Nenhum bloco `try/catch` deve engolir exceções em silêncio sem registrar log útil (`console.error`) ou notificar o usuário (`toast.error`).
- **Promessas Flutuantes:** Funções assíncronas chamadas dentro de handlers de eventos ou em `useEffect` devem ter `.catch()` ou estarem embrulhadas em `void asyncFunc().catch(...)`.

### 3. Tipagem e Nulabilidade no TypeScript
- **Uso de `any`:** Substituir `any` por tipos concretos ou `unknown` com guardas de tipo (*type guards*).
- **Acesso Seguro a Propriedades:** Usar *optional chaining* (`?.`) e *nullish coalescing* (`??`) para evitar erros do tipo `Cannot read properties of undefined`.

### 4. Segurança e Integridade Supabase
- **RLS e Permissões:** Verificar se chamadas ao Supabase lidam com `error` retornado pela query antes de consumir `data`.
- **Tratamento de Sessão:** Garantir que dados sensíveis de perfil dependam de validações de autenticação seguras.

## 🛠️ Procedimento de Execução
1. Executar verificação de tipos: `pnpm exec tsc --noEmit`.
2. Rodar linters e testes se disponíveis (`pnpm test` ou `pnpm lint`).
3. Inspecionar o componente ou arquivo-alvo buscando cada um dos 4 pontos acima.
4. Apresentar um relatório claro dos bugs encontrados com links para as linhas afetadas e propor as correções cirúrgicas via `replace_file_content`.
