---
trigger: always_on
---

# Sugestão Proativa Obrigatória Pós-Tarefa

Ao concluir **qualquer** tarefa (criação, correção, refatoração, script ou ajuste visual), inclua sempre ao final da resposta uma seção curta e acionável de **Sugestões de Melhoria** baseada no que foi observado nos arquivos alterados:

1. **Desempenho:** gargalos reais (payload de JSON/imagens, re-renders, queries N+1, filtros pesados na GPU, bundle size).
2. **Bugs / Estabilidade:** riscos de estado stale, vazamentos de memória, falhas offline/rede ou casos de borda.
3. **UX / Produto:** melhorias práticas de fluidez, responsividade, feedback visual ou acessibilidade.

**Regras da sugestão:**
- Seja direto e específico (aponte o arquivo/componente e o ganho concreto, em 1–3 itens no máximo).
- Nunca invente problemas genéricos; cite apenas oportunidades reais observadas durante a execução.
