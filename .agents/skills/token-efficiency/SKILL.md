---
name: token-efficiency
description: Diretrizes de alta performance para o Antigravity: otimização de tokens, economia de contexto, respostas sintéticas e edição cirúrgica de código (padrão Lovable). Use sempre para evitar estouro de limite de tokens e acelerar a execução das tarefas.
---

# Skill de Eficiência de Tokens e Alta Performance (Estilo Lovable)

Esta skill estabelece o fluxo de trabalho de alta eficiência para o **Antigravity**, focado em economizar contexto, reduzir drasticamente o consumo de tokens e responder de forma rápida e precisa.

## 1. Revelação Progressiva (Progressive Disclosure)
- **Busca Direcionada:** Em vez de abrir arquivos inteiros, use `grep_search` para localizar a linha exata do código.
- **Visualização Focada:** Use `view_file` especificando `StartLine` e `EndLine` para ler apenas o trecho necessário (máximo 80 a 150 linhas por chamada). Evite ler arquivos de mais de 300 linhas de uma só vez sem necessidade.
- **Não Recarregar Arquivos Imutáveis:** Não releia arquivos que você já inspecionou no mesmo turno.

## 2. Edição Cirúrgica de Código (Surgical Edits)
- **Prefira `replace_file_content`:** Sempre substitua apenas o bloco exato de linhas que precisa ser alterado.
- **Evite Sobrescrever Arquivos Inteiros:** Sobrescrever um arquivo de 500 linhas consome milhares de tokens de saída inutilmente. Edições cirúrgicas consomem menos de 200 tokens.
- **Evite Múltiplas Chamadas Paralelas para o Mesmo Arquivo:** Faça edições contíguas e consolidadas.

## 3. Respostas Naturais e Sintéticas (Sem Duplicação de Código)
- **Não Repita Trechos no Chat:** Quando concluir uma alteração, informe ao usuário o que foi feito de forma concisa. **Não cole o código alterado na resposta do chat** — em vez disso, forneça o link clicável para o arquivo (ex: `[MobileHomeSections.tsx](file:///c:/path/to/file#L100)`).
- **Sem Explicações Prolixas:** Mantenha as respostas explicativas objetivas, diretas e estruturadas em tópicos.

## 4. Gerenciamento de Memória e Estado
- **Decomposição em Micro-etapas:** Execute tarefas complexas em etapas lógicas curtas e verifique o resultado a cada passo.
- **Preservação de Contexto:** Reutilize as descobertas obtidas nos passos anteriores sem re-executar pesquisas idênticas.

## 5. Verificação Rápida
- Ao verificar código TypeScript, utilize verificações incrementais (`tsc --noEmit`) para validar o tipo antes de concluir.
