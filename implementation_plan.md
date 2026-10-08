# Plano de Implementação: Estatísticas de Simulados

## 1. Banco de Dados (Supabase)
Criaremos uma nova migration `supabase/migrations/XXXXXXXXXXXXX_create_simulados_estatisticas.sql` para registrar o histórico e as respostas de simulados resolvidos pelos usuários.
- Tabela `user_simulados_historico`:
  - `id` (uuid, PK)
  - `user_id` (uuid, FK auth.users)
  - `simulado_id` (uuid, FK simulados)
  - `total_questoes` (int)
  - `acertos` (int)
  - `status` (em_andamento, finalizado)
  - `started_at`, `completed_at`
- Tabela `user_simulados_respostas`:
  - `id` (uuid, PK)
  - `historico_id` (uuid, FK user_simulados_historico)
  - `questao_id` (uuid, FK simulado_questions)
  - `disciplina` (text)
  - `assunto` (text)
  - `acertou` (boolean)
  - `created_at`

Após criar a migration, executarei o deploy no Supabase com script ou CLI usando as chaves de `.env`.

## 2. Modificar o Fluxo de Resolução
No componente `src/pages/FerramentasSimuladosResolver.tsx`:
- Quando o usuário inicia o simulado, criar um registro em `user_simulados_historico` (se não existir um em andamento).
- Na função `handleRegistrar(questaoId, alternativa, acertou)`, salvar a resposta na tabela `user_simulados_respostas` e atualizar os `acertos` no histórico.
- Quando o usuário finaliza, marcar o status como finalizado.

## 3. Criar Tela de Estatísticas
- Criar a página `src/pages/FerramentasSimuladosEstatisticas.tsx` para exibir:
  - Total de simulados feitos.
  - Taxa média de acertos.
  - Tabela/Lista mostrando desempenho por disciplina e assunto.
  - Histórico de simulados recentes finalizados.

## 4. Ajustes Finais e Rotas
- Registrar a nova rota em `AppRoutes.tsx` como `/simulados/estatisticas`.
- Em `src/pages/FerramentasSimulados.tsx`, alterar o botão "Estatísticas" para redirecionar para a nova página (removendo o `toast.info('Estatísticas em breve!')`).
- Rodar `tsc.CMD --noEmit`.
- Commitar e realizar o push para o GitHub.
