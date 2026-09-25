# Tarefas — Roteamento e Retorno de Bases Jurídicas

- [x] **1. Ajustar `AdminFuncoes.tsx` com `useSearchParams` e URL sync**
  - [x] Sincronizar `openCat` com `searchParams.get('cat')` e `location.state?.fromCat`
  - [x] Atualizar `handleClick` para repassar `state: { fromCat: openCat.id }`
  - [x] Ajustar `onBack` da categoria aberta para limpar a query `?cat`
- [x] **2. Ajustar `onBack` em `AdminMapeamentoLeis.tsx`**
  - [x] Retornar para `/admin-funcoes?cat=bases-juridicas` com state
- [x] **3. Ajustar `onBack` em `AdminVadeMecumHistorico.tsx`**
  - [x] Retornar para `/admin-funcoes?cat=bases-juridicas` com state
- [x] **4. Ajustar `onBack` em `AdminNarracaoLeis.tsx`**
  - [x] Retornar para `/admin-funcoes?cat=bases-juridicas` com state
- [x] **5. Validação e Auto-Commit**
  - [x] Checagem de TypeScript (`tsc --noEmit` com 0 erros)
  - [x] Build do projeto (`vite build` com código 0)
  - [ ] Auto-commit e push para o GitHub
