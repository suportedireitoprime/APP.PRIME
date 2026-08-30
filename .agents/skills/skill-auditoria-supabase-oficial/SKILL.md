---
name: skill-auditoria-supabase-oficial
description: "Skill Mestre de Auditoria Oficial do Supabase. Utiliza as regras de segurança, performance e modelagem do plugin supabase-official (oriundo de supabase/agent-skills) para aplicar um pente-fino tabela por tabela."
---

# Auditoria Supabase Oficial

Esta skill coordena a aplicação estrita das práticas oficias do Supabase (contidas no plugin `supabase-official`) para auditar o banco de dados do projeto de forma abrangente, tabela por tabela.

## 1. Escopo da Auditoria
Sempre que acionada, a auditoria deve investigar os seguintes pontos para cada tabela, view ou function:
- **Segurança (RLS):** Toda tabela no esquema `public` deve ter RLS ativado. O uso de `auth.role()` é desencorajado em favor da cláusula `TO` (ex: `TO authenticated`). Políticas de `UPDATE` devem possuir tanto `USING` quanto `WITH CHECK`.
- **Query Performance (Índices):** Deve-se analisar se todas as Foreign Keys (FKs) possuem índices, se há a necessidade de índices compostos e se índices parciais (ex: `WHERE deleted_at IS NULL`) podem ser usados.
- **Funções (RPCs):** Funções `SECURITY DEFINER` não devem ficar expostas no `public` sem uma checagem rigorosa de `auth.uid()`, pois o Postgres concede permissão de execução automática.
- **N+1 e Tipos de Dados:** Identificar se o esquema pode sofrer de consultas N+1 via Supabase Client e verificar se os tipos de dados são eficientes.

## 2. Metodologia de Aplicação
1. **Extração do Schema:** Ler o arquivo ou os arquivos de schema atuais (normalmente em `supabase/migrations/`) para montar a lista completa de tabelas e RLS.
2. **Avaliação (Tabela por Tabela):** Analisar individualmente cada tabela e listar os achados contra as regras do `supabase-postgres-best-practices`.
3. **Walkthrough Final:** Entregar um relatório (Walkthrough.md) contendo os problemas encontrados e o SQL exato recomendado para a correção. Apenas após a aprovação do usuário os arquivos de migração deverão ser criados/alterados.

## 3. Comandos Importantes
- Use a CLI do Supabase (se necessário e instalada localmente) ou scripts `.sql` locais para gerar e testar melhorias.
- Não crie migrations `.sql` diretas sem aprovação; priorize a exibição do SQL sugerido.
