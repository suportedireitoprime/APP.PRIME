# Plano de Implementação — Retorno e Roteamento de "Bases Jurídicas"

Garantir que a rota e o estado da categoria "Bases Jurídicas" (e demais categorias de `AdminFuncoes`) sejam estritamente respeitados na navegação de ida e volta, retornando para a tela de Bases Jurídicas ao clicar em Voltar nos 3 módulos:
- Mapeamento de Leis (`/admin-mapeamento-leis`)
- Histórico de Atualizações (`/admin-vade-mecum-historico`)
- Narração de Leis (`/admin-narracao-leis`)

---

## 1. Modificações em `src/pages/AdminFuncoes.tsx`
- Integrar `useSearchParams` e `useLocation`:
  - Ler `searchParams.get('cat')` e `location.state?.fromCat` na inicialização e em efeitos de rota.
  - Ao clicar em "Bases Jurídicas" (ou qualquer categoria com submenu), atualizar os parâmetros de URL para `/admin-funcoes?cat=bases-juridicas`.
  - Ao clicar em um item (`item.route`), navegar preservando o estado `{ fromCat: openCat.id }`.
  - Ao clicar no botão de voltar dentro de uma categoria aberta no `AdminFuncoes`, limpar a query `?cat` e retornar ao menu principal de funções.

## 2. Modificações em `src/pages/AdminMapeamentoLeis.tsx`
- Ao voltar do nível raiz do Mapeamento de Leis, navegar para:
  `navigate('/admin-funcoes?cat=bases-juridicas', { state: { fromCat: 'bases-juridicas' } })`

## 3. Modificações em `src/pages/AdminVadeMecumHistorico.tsx`
- No `onBack` do `PageHeader`, navegar para:
  `navigate('/admin-funcoes?cat=bases-juridicas', { state: { fromCat: 'bases-juridicas' } })`

## 4. Modificações em `src/pages/AdminNarracaoLeis.tsx`
- No `onBack` do nível principal, navegar para:
  `navigate('/admin-funcoes?cat=bases-juridicas', { state: { fromCat: 'bases-juridicas' } })`

## 5. Validação
- Executar `tsc --noEmit` para garantir 0 erros de compilação.
- Executar `vite build` para validar empacotamento de produção.
- Auto-commit e push para o GitHub.
