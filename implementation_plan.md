# Plano de Implementação — Fase 1: Offline-First Nativo

## Escopo
Otimizar o que já existe para funcionar melhor offline, sem criar funcionalidades novas grandes.

## Itens da Fase 1

### 1. Popular SQLite FTS5 com dados do laws-bundle no boot
- **Arquivo:** `src/services/lawsBundle.ts`
- **O quê:** Após injetar artigos no IndexedDB, também inserir no SQLite nativo (`localDb.ts` → tabela `artigos_cache` + `artigos_fts`)
- **Benefício:** Busca full-text offline instantânea em todas as 160+ leis
- **Risco:** Baixo — SQLite só roda no nativo, web fica com IndexedDB

### 2. Conectar dicionário fallback ao SQLite nativo
- **Arquivo:** `src/services/localDb.ts` + novo serviço
- **O quê:** No boot nativo, popular tabela `dicionario_juridico` a partir do `dicionario_fallback.json`
- **Benefício:** Busca de termos offline sem carregar 963 KB em memória

### 3. Adicionar badges "offline disponível" nos cards de leis
- **Arquivos:** Componentes de listagem do Vade Mecum
- **O quê:** Badge visual (ícone de download ✓) nos cards de leis que estão no bundle local
- **Benefício:** Usuário sabe quais leis funcionam sem internet

### 4. Gerar bundles de flashcards e questões por área/disciplina
- **Arquivos:** Scripts de build / GitHub Actions
- **O quê:** Pré-gerar JSONs `flashcards-cards_{area}.json` e `questoes_{disciplina}.json` para `/public/offline-bundle/`
- **Benefício:** Flashcards e questões funcionam offline imediatamente após instalar

### 5. Melhorar detecção de conectividade e adaptar UI
- **Arquivos:** `useOnlineStatus.ts` + componentes de navegação
- **O quê:** Usar `@capacitor/network` + heartbeat, exibir banner sutil quando offline, adaptar menus
- **Benefício:** UX transparente — usuário nunca vê erro de rede inesperado

## Ordem de execução
1 → 2 → 3 → 5 → 4 (o item 4 depende de infra de build)
