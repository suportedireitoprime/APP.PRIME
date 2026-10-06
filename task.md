# Tarefa: Corrigir exibição da lista de artigos no Mobile Nativo (CDC, CC e CPC)

- [ ] Fase 1: Criar plano de implementação (`implementation_plan.md`) <!-- id: 1 -->
- [ ] Fase 2: Robustecer `src/services/lawsBundle.ts` <!-- id: 2 -->
  - [ ] Adicionar dicionário estático síncrono `STATIC_TABELA_TO_SLUG` para todas as leis catalogadas (garantindo resolução 0ms para CDC, CC, CPC, CP, CF, etc.)
  - [ ] Remover `{ cache: 'force-cache' }` de `loadManifest` e `loadBundledLei` (incompatível com Android WebView AssetLoader)
  - [ ] Implementar URLs resilientes (`/laws-bundle/${slug}.json`, `laws-bundle/${slug}.json` e origin)
  - [ ] Permitir que `loadBundledLei` opere de forma independente de `loadManifest`
- [ ] Fase 3: Eliminar Race Condition e Premature Empty State em `src/hooks/domain/useLeiArtigos.ts` <!-- id: 3 -->
  - [ ] Importar `getBundleSlugForTabela` e `loadBundledLei` de forma direta e carregar bundle em 0ms
  - [ ] Não sobrescrever `artigos` com `[]` e não finalizar `loadingArtigos = false` se `fetchArtigosInstant` retornar vazio enquanto o carregamento do bundle ainda está em andamento
  - [ ] Aumentar tempo de skeleton e garantir fallback gracioso
- [ ] Fase 4: Otimizar Virtualização e Prevenir Telas Vazias em `LeiArtigosVirtualList.tsx` <!-- id: 4 -->
  - [ ] Remover `initialOffset` desincronizado de `virtualOffsetCache` que renderizava itens fora da viewport
  - [ ] Proteger `translateY` com `Math.max(0, ...)` contra valores negativos
  - [ ] Adicionar skeleton visual elegante quando `loadingArtigos && visibleArtigos.length === 0`
- [ ] Fase 5: Validação de Tipos e Build <!-- id: 5 -->
  - [ ] Executar `.\node_modules\.bin\tsc.CMD --noEmit`
- [ ] Fase 6: Versionamento Automático e Commit <!-- id: 6 -->
  - [ ] Executar `git add . ; git commit -m "..." ; git push`
