# Ajuste de Fluxo Inicial, Botão Acessar Agora e Destravamento de Notificações

- [x] 1. Configurar início do aplicativo na Landing Page:
  - [x] Ajustar `ProtectedRoute` em `AppRoutes.tsx` para redirecionar usuários não autenticados na raiz (`/`) para `/landing`.
- [x] 2. Corrigir navegação do botão "Acessar agora" na Landing Page:
  - [x] Simplificar `handleStart` em `Landing.tsx` para direcionar diretamente para `/auth`.
  - [x] Garantir que na tela de Auth o usuário possa escolher entre criar conta e entrar, com botão de voltar para a Landing funcional.
- [x] 3. Destravar o banner de permissão de notificações:
  - [x] Adicionar timeout de segurança de 3.5s em `useWebPush.ts` para evitar congelamento em `navigator.serviceWorker.ready`.
  - [x] Implementar timeout geral de 6s com `Promise.race` em `ativar()` dentro de `NotificacoesPermissaoStep.tsx`.
  - [x] Corrigir verificação de permissão no Capacitor Firebase Messaging (`permStatus.receive !== 'granted'`).
  - [x] Adicionar botão "Agora não, lembrar mais tarde" para permitir dispensa limpa.
- [x] 4. Validação e Entrega:
  - [x] Executar `.\node_modules\.bin\tsc.CMD --noEmit` para garantir integridade dos tipos.
  - [x] Executar `.\node_modules\.bin\vite.CMD build` para testar empacotamento de produção.
  - [x] Realizar auto-commit e push para o GitHub.
