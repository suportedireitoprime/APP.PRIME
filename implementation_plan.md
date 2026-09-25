# Plano de Implementação — Ordem dos Filtros no Card Online

Reordenar os botões de filtro no modal de usuários Online em `AdminHojeCards.tsx` para seguir rigorosamente a sequência solicitada pelo usuário:
1. **Gratuitos** (ou Gratuito)
2. **Assinantes**
3. **Todos**

---

## 1. Alterações em `src/components/admin/AdminHojeCards.tsx`
- Alterar o estado inicial de `filtroUser` para `'gratuitos'`.
- Reordenar o array de abas de filtro em `(open === 'online' || open === 'online5m')`:
  - De: `(['todos', 'gratuitos', 'assinantes'] as const)`
  - Para: `(['gratuitos', 'assinantes', 'todos'] as const)`
- Ajustar labels dos botões garantindo exibição de "Gratuitos", "Assinantes" e "Todos".

## 2. Validação
- Validar tipos com `tsc --noEmit`.
- Validar empacotamento com `vite build`.
- Auto-commit e push para o GitHub.
