# Tarefas - Ajuste de Último Acesso e Otimização da Lista de Usuários

- [x] Investigação e Diagnóstico <!-- id: 0 -->
  - [x] Identificar causa de "Nunca acessou" (ignorado `last_sign_in_at` e `created_at`) <!-- id: 0.1 -->
  - [x] Identificar causa de "fica só carregando" (serialização de requisições + renderização de 7.7k nós DOM simultâneos) <!-- id: 0.2 -->
- [x] Atualização do Backend (Edge Function `admin-list-users`) <!-- id: 1 -->
  - [x] Ajustar SQL para trazer `last_sign_in_at`, `created_at`, dados de `profiles` e `user_activity_log` consolidados via PostgreSQL em query única <!-- id: 1.1 -->
  - [x] Fazer deploy da Edge Function `admin-list-users` <!-- id: 1.2 -->
- [x] Otimização e Ajuste do Frontend (`src/pages/AdminUsuarios.tsx`) <!-- id: 2 -->
  - [x] Consolidar data de acesso usando a data mais recente (`activity_last_seen_at`, `last_sign_in_at`, `created_at`) eliminando "Nunca acessou" <!-- id: 2.1 -->
  - [x] Implementar paginação virtual/progressiva (exibir 50 por vez com botão "Carregar mais" / scroll infinito) para renderização instantânea (0ms de travamento) <!-- id: 2.2 -->
  - [x] Eliminar requisições seriais secundárias lentas <!-- id: 2.3 -->
- [x] Validação e Auditoria <!-- id: 3 -->
  - [x] Checagem de TypeScript com `tsc.CMD --noEmit` <!-- id: 3.1 -->
  - [x] Build com `vite.CMD build` <!-- id: 3.2 -->
  - [x] Commit e Push automático no Git <!-- id: 3.3 -->
