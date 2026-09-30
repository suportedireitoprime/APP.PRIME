# Plano de Implementação: Ocultar Locais Jurídicos para o Usuário

## 🎯 Objetivo
Ocultar a opção "LOCAIS JURÍDICOS" (Fóruns, cartórios e delegacias) da seção "OUTROS DESTAQUES" na tela de Ferramentas, garantindo que não seja mais exibida para o usuário final nem no mobile nem no desktop.

## 🛠️ Alterações
1. `src/config/desktopTools.ts`:
   - Remover ou filtrar o item com `id: 'locais'` dos grupos de ferramentas disponíveis para o usuário.
2. `src/components/ferramentas/FerramentasSecondaryList.tsx`:
   - Adicionar trava de segurança no filtro `secondaryTools` excluindo explicitamente `t.id !== 'locais'`.

## 🧪 Validação
- `tsc --noEmit` para garantir integridade de tipagem.
- Commit e push automático no repositório.
