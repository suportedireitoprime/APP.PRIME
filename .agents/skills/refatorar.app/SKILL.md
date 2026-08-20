---
name: refatorar.app
description: Skill de refatoração super detalhada de código React/TypeScript. Aplica limpeza de código, tipagem estrita, performance, padronização de arquitetura e remoção de débitos técnicos.
---

# 🧹 Skill Suprema de Refatoração (refatorar.app)

Esta skill deve ser aplicada de forma "super mega detalhada" ao refatorar qualquer bloco de código, página ou fluxo inteiro. O objetivo não é apenas mudar por mudar, mas elevar o nível da base de código ao estado da arte, garantindo previsibilidade, performance (zero lag) e código limpo.

## Diretrizes de Refatoração

Quando acionado para usar esta skill, você DEVE aplicar obrigatoriamente os seguintes passos:

### 1. 🔍 Auditoria Profunda
Antes de escrever qualquer código, analise o arquivo com foco em:
- **Variáveis órfãs / Dead Code**: Identifique estados, imports, funções ou props não utilizados e remova-os imediatamente.
- **Tipagem `any`**: Cace qualquer tipo `any` ou implícito. Refatore criando `interfaces` ou `types` sólidos, baseados em Zod ou estritos do TypeScript. 
- **Efeitos Colaterais (useEffect)**: 
  - Falta função de limpeza (cleanup `return () => {}`)?
  - Faltam dependências ou sobram dependências causando re-renders infinitos?
  - O código está chamando `setState` com componente desmontado? (Proteja com `isMounted`).
  - O uso do efeito é justificado? (Evite `useEffect` para coisas que poderiam derivar direto do estado).

### 2. ⚡ Performance & Re-renders (React 18+)
- **Memoização Inteligente**: Use `useMemo` para computações caras de listas grandes e `useCallback` para funções passadas a componentes filhos.
- **Lazy Loading & Suspense**: Verifique se dependências gigantescas (gráficos, modais raras) estão bloqueando a thread principal. Use `lazy()` e `Suspense`.
- **Prevenção de Layout Thrashing**: Junte atualizações de estado ou verifique chamadas excessivas na DOM.

### 3. 🧩 Padronização de Arquitetura e Limpeza Estrutural
- **Early Returns**: Substitua blocos aninhados de `if/else` longos por guard clauses / early returns na raiz da função.
- **Responsabilidade Única (DRY)**: Se um componente tem mais de 200 linhas de lógicas aglomeradas, fatie-o. Extraia lógica de hooks de dados (`useHookX`) e lógicas de UI para subcomponentes menores.
- **Tratamento de Exceções**: Blocos assíncronos que dependem do Supabase/Capacitor devem obrigatoriamente usar `try / catch` robusto, retornando feedback visual (`sonner / toast`) e nunca falhando em silêncio.

### 4. 💅 Refinamento Estético & Acessibilidade
- Garanta que o uso das classes do Tailwind esteja consistente (sem declarações duplicadas ou conflitantes como `flex grid`).
- Cheque uso de `prefers-reduced-motion` ao aplicar Framer Motion.
- Converta eventos sintéticos soltos em `onClick` ou `onTouchStart` padronizados, suportando áreas de clique de 48px.

### Workflow de Execução
Ao receber o comando "aplique a skill refatorar.app no componente X":
1. Leia todo o escopo do código usando leitura precisa.
2. Identifique gargalos e code-smells na resposta.
3. Produza o arquivo refatorado **completo** (via tool calls, sem inventar código e sem cortar blocos úteis).
4. Rode a build ou validação (`tsc.CMD --noEmit`) para garantir que a refatoração não gerou erros do TypeScript.
