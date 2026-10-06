# Tarefa: Acelerar e Corrigir Carregamento do Modal "Online (Últimos 5 min)"

- [x] Criar plano de implementação detalhado (`implementation_plan.md`) <!-- id: 0 -->
- [x] Pré-popular `rowsCache.current['online5m']` e `rowsCache.current['online']` no `load()` <!-- id: 1 -->
- [x] Garantir que `openCard` monte os dados em cache de forma síncrona a 0ms sem spinner <!-- id: 2 -->
- [x] Evitar que `fetchRows` resete as linhas quando já houver cache (background refresh suave) <!-- id: 3 -->
- [x] Otimizar mapeamento e evitar waterfalls desnecessários <!-- id: 4 -->
- [x] Validar compilação TypeScript com `tsc --noEmit` <!-- id: 5 -->
- [ ] Realizar auto-commit e push para o GitHub <!-- id: 6 -->
