# Tarefas - Ajuste de Último Acesso e Otimização da Lista de Usuários

- [x] Investigação e Diagnóstico <!-- id: 0 -->
  - [x] Identificar causa de "Nunca acessou" (ignorado `last_sign_in_at` e `created_at`) <!-- id: 0.1 -->
  - [x] Identificar causa de "fica só carregando" (serialização de requisições + renderização de 7.7k nós DOM simultâneos) <!-- id: 0.2 -->
  - [x] Identificar falha no downgrade de Juliete (RLS em profiles e falta da ação no RPC de admin) <!-- id: 0.3 -->
- [x] Atualização do Backend (Edge Functions & RPCs) <!-- id: 1 -->
  - [x] Adicionar suporte à ação 'downgrade' no RPC `admin_gerenciar_usuario` com SECURITY DEFINER <!-- id: 1.1 -->
  - [x] Adicionar suporte ao parâmetro `since` na Edge Function `admin-list-users` para sincronização incremental rápida <!-- id: 1.2 -->
  - [x] Criar e executar Edge Function `admin-asaas-overdue` para auditar todos os inadimplentes mensais > 3 dias no Asaas <!-- id: 1.3 -->
  - [x] Rebaixar Juliete e demais usuários inadimplentes pendentes para o plano gratuito <!-- id: 1.4 -->
- [x] Otimização e Cache no Frontend (`src/pages/AdminUsuarios.tsx` & `UserDossieSheet.tsx`) <!-- id: 2 -->
  - [x] Implementar cache persistente em IndexedDB (`idb-keyval`) para abertura em 0ms <!-- id: 2.1 -->
  - [x] Sincronização incremental em segundo plano apenas dos usuários mais recentes <!-- id: 2.2 -->
  - [x] Botão de sincronização manual com feedback visual <!-- id: 2.3 -->
  - [x] Integrar ação de downgrade de `UserDossieSheet` ao RPC administrativo <!-- id: 2.4 -->
- [x] Validação e Auditoria <!-- id: 3 -->
  - [x] Checagem de TypeScript com `tsc.CMD --noEmit` <!-- id: 3.1 -->
  - [x] Build com `vite.CMD build` <!-- id: 3.2 -->
  - [x] Commit e Push automático no Git <!-- id: 3.3 -->
