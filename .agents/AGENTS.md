# Diretivas do Projeto

## Git & GitHub (Auto-Commit & Push)
- Sempre que alterações no código forem finalizadas com sucesso (criação de arquivos, correções, refatorações ou novas funcionalidades), a IA deve automaticamente executar os comandos para enviar as atualizações ao GitHub:
  1. `git add .`
  2. `git commit -m "<descrição das alterações>"`
  3. `git push`
- Isso garante que todas as modificações no projeto fiquem sincronizadas com o GitHub ao término de cada tarefa.

## Eficiência de Tokens & Desempenho (Padrão Lovable)
- **Busca Direcionada (Progressive Disclosure):** Use `grep_search` e `view_file` com intervalos de linhas delimitados para inspecionar código. Nunca leia arquivos inteiros desnecessariamente.
- **Edição Cirúrgica (`replace_file_content`):** Altere apenas os blocos de código modificados. Evite reescrever arquivos completos.
- **Respostas Enxutas:** Não cole códigos inteiros nas respostas do chat. Use links clicáveis no formato `[arquivo](file:///caminho#L1-L10)`.
- **Economia de Contexto:** Reutilize informações já levantadas nos turnos anteriores para evitar consumo excessivo de tokens de contexto.

