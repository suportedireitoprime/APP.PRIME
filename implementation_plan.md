# Plano de Implementação: Correção da Lista de Artigos no Mobile Nativo (CDC, Código Civil e CPC)

## 1. Diagnóstico e Causa Raiz
Ao abrir o **Código de Defesa do Consumidor (CDC)**, o **Código Civil (CC)** ou o **Código de Processo Civil (CPC)** no aplicativo instalado no Android (Capacitor nativo), as listas de artigos aparecem vazias ou não carregam, enquanto no ambiente web/desktop Antigravity funcionam.

### Causas Identificadas:
1. **Falha do `{ cache: 'force-cache' }` no WebView do Android**:
   No arquivo `src/services/lawsBundle.ts`, as funções `loadManifest()` e `loadBundledLei()` utilizavam `fetch(..., { cache: 'force-cache' })`. No Android WebView com `WebViewAssetLoader` (onde arquivos locais são servidos do APK), requisições com `force-cache` disparam `TypeError: Failed to fetch` porque o loader de assets nativo não implementa cabeçalhos HTTP padrão de cache. Com isso, `loadManifest()` falhava silenciosamente e retornava `null`.
2. **Dependência síncrona de `_slugToId` em `getBundleSlugForTabela`**:
   `getBundleSlugForTabela(tabelaNome)` retornava `null` imediatamente se `_slugToId` ainda não tivesse sido populado por `loadManifest()`. Sem mapeamento estático síncrono, a busca pelo bundle local do CDC, CC e CPC era abortada.
3. **Condição de Corrida (Race Condition) no `useLeiArtigos.ts`**:
   No hook `useLeiArtigos.ts`, um timer de 280ms (`skeletonTimer`) disparava `fetchArtigosInstant(tabelaAtual, 10)`. Se a resposta retornasse vazia (por exemplo, offline ou em rede lenta), o hook executava prematuramente:
   ```ts
   setArtigos([]);
   setLoadedKey(tabelaAtual);
   setLoadingArtigos(false);
   ```
   Isso sobrescrevia o estado do componente como "vazio" e finalizava o loading, impedindo a renderização dos 2.888 artigos do Código Civil ou 1.354 do CPC.
4. **Descompasso de Scroll no Virtualizador (`LeiArtigosVirtualList.tsx`)**:
   O `initialOffset` utilizava `virtualOffsetCache.get(listKey)` sem sincronizar o `scrollTop` real do elemento DOM `#root`. Se houvesse um offset salvo, o virtualizador renderizava itens a milhares de pixels abaixo, deixando os primeiros artigos fora da viewport do usuário. Além disso, não havia skeleton de loading quando `loadingArtigos && visibleArtigos.length === 0`.

---

## 2. Mudanças Propostas

### A. `src/services/lawsBundle.ts`
- Implementar `STATIC_TABELA_TO_SLUG`: mapeamento estático e síncrono entre as tabelas catalogadas e seus slugs (`CDC_CODIGO_DEFESA_CONSUMIDOR` -> `'cdc'`, `CC_CODIGO_CIVIL` -> `'cc'`, `CPC_CODIGO_PROCESSO_CIVIL` -> `'cpc'`).
- Remover `{ cache: 'force-cache' }` de `loadManifest()` e `loadBundledLei()`.
- Criar resolução resiliente de URLs para carregar os JSONs tanto de caminhos absolutos (`/laws-bundle/...`), relativos (`laws-bundle/...`) quanto via `window.location.origin`.
- Garantir que `loadBundledLei(slug)` funcione independentemente de `loadManifest()`.

### B. `src/hooks/domain/useLeiArtigos.ts`
- Importar `getBundleSlugForTabela` e `loadBundledLei` diretamente para carregamento a 0ms sem esperar promises encadeadas de manifest.
- Proteger contra premature empty state: se `fetchArtigosInstant` retornar vazio, NUNCA zerar os artigos e nunca declarar o carregamento concluído enquanto o carregamento do bundle ou do Dexie estiver em processamento.
- Ajustar timing e estados para transição suave de tela.

### C. `src/components/vademecum/artigo/LeiArtigosVirtualList.tsx`
- Corrigir `initialOffset` do virtualizador para iniciar em 0 (alinhado com o DOM `#root`) evitando telas pretas com itens deslocados.
- Proteger `translateY` com `Math.max(0, ...)` prevenindo que itens sejam deslocados para cima do topo.
- Adicionar esqueleto elegante de loading (`loadingArtigos && visibleArtigos.length === 0`).

---

## 3. Plano de Validação
- Executar `.\node_modules\.bin\tsc.CMD --noEmit` para validação rigorosa de tipagem TypeScript.
- Testar parsing e normalização de `cdc.json`, `cc.json` e `cpc.json` no Node.
- Enviar automaticamente para o repositório GitHub via PowerShell:
  `git add . ; git commit -m "fix(vademecum): fix mobile native article list loading for CDC, CC, and CPC" ; git push`
