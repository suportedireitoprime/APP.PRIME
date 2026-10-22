# Refazer a tela "Assinantes Asaas"

## O que muda para você
1. **Abre instantâneo**: a lista fica guardada no aparelho depois da primeira carga. Ao abrir de novo, aparece na hora e atualiza sozinha em segundo plano (um pequeno indicador "atualizando…" no topo, sem travar a tela). O botão de recarregar continua para forçar.
2. **Cards de categoria no topo** (com contagem e soma de valores):
   - Vitalícios
   - Anuais
   - Mensais
   - Todos
   Tocar em um card abre a tela só daquela categoria (com botão de voltar). Dentro dela: busca por nome/e-mail e abas "Ativos / Vencendo / Cancelados".
3. **Cada assinante vira um cartão** (no celular) com: nome, e-mail (com copiar), plano, valor, forma de pagamento, data da compra e **vencimento**:
   - Mensal/Anual: próximo vencimento + "vence em X dias" (amarelo se faltar 7 dias ou menos, vermelho se vencido).
   - Vitalício: "Sem vencimento".
   No computador continua uma tabela, mas com a coluna Vencimento.
4. **Novos assinantes sempre aparecem**: a cada abertura busca as novidades do Asaas; assinaturas novas com primeiro pagamento confirmado entram automaticamente. Também passo a incluir assinaturas semestrais (hoje somem por não serem mensal nem anual) e mostro "Aguardando 1º pagamento" em vez de esconder quem acabou de assinar e ainda não pagou (fica na aba própria, fora da contagem de ativos).
5. **Responsivo**: sem rolagem lateral no celular; cards em grade 2x2 no celular, 4 lado a lado no computador.

## Detalhes técnicos
- `src/pages/AdminAssinantesAsaas.tsx` reescrito; categoria na URL (`?plano=vitalicio|anual|mensal|todos`) para o voltar funcionar.
- Busca via `useQuery` (chave `['admin-asaas']`, `staleTime` 2 min) + cache persistido em `localStorage` (`placeholderData` lido do cache salvo, com data da última atualização). Mesma chamada `admin-asaas-proxy`, páginas de customers/subscriptions/payments em paralelo.
- Classificação extraída para `src/lib/asaasClassificar.ts` (ciclo MONTHLY/SEMIANNUALLY/YEARLY + descrição; vencimento = `nextDueDate`; parcelado anual = data 1ª parcela + 12 meses) com testes vitest para: vitalício sem vencimento, mensal com dias até vencer, semestral classificado, assinatura sem pagamento marcada "aguardando".
- Limite atual de 1.000 registros por tipo aumentado para 3.000 para não cortar assinantes novos.
