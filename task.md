# Correção de Explicações IA do Vade Mecum e Exibição Completa do Código Penal

- [x] 1. Diagnóstico e Purga de Cache de Explicações IA (Art. 4º, Código Penal, Código Civil):
  - [x] Sanitizar `aiCacheLocal.ts` para rejeitar e deletar automaticamente erros salvos (`prepayment credits`, `429`, `consegui gerar uma resposta`).
  - [x] Implementar rotina de purga para apagar todas as explicações salvas do Código Penal e Código Civil no `localStorage` e `artigo_ai_cache`.
  - [x] Proteger `useArtigoCommentsAndAi.ts` para nunca salvar mensagens de erro de IA no cache ou no Supabase.
  - [x] Corrigir Edge Function `assistente-juridica` para retornar HTTP 503 com `{ error: ... }` quando a API falhar, impedindo que erros sejam tratados como respostas válidas.
  - [x] Fazer deploy da Edge Function `assistente-juridica` no Supabase (`dnjrgpldcwcpoywamorr`).
- [x] 2. Correção da Virtualização de Artigos (Exibição após Artigo 11 no Código Penal):
  - [x] Substituir `useWindowVirtualizer` por `useVirtualizer` com `getScrollElement: () => document.getElementById('root') || document.body` em `LeiArtigosVirtualList.tsx`.
  - [x] Ajustar cálculo de `scrollMargin` e posicionamento para rastrear o elemento correto de rolagem (`#root`).
  - [x] Verificar e padronizar outros virtualizadores (`DecretoView`, `LeiOrdinariaView`, `SumulaView`, `LeiOrdinariaDetail`) para `useVirtualizer` com `#root` como scroll container e `scrollMargin`.
- [x] 3. Validação e Entrega:
  - [x] Executar `.\node_modules\.bin\tsc.CMD --noEmit` para garantir ausência de erros TypeScript.
  - [x] Executar auto-commit e push automático para o GitHub.

