# Plano de Implementação — Correção da Extração de Leis e Histórico do Planalto (2024–2026)

## Contexto e Diagnóstico
O usuário identificou que, no **Histórico de Alterações do Vade Mecum** (`AdminMapeamentoLeis.tsx`):
1. O Código Civil e outras leis estavam exibindo alterações apenas até **Janeiro de 2023** (14 alterações), omitindo alterações de 2023, 2024, 2025 e 2026.
2. Ao conferir o Planalto (ex: CPP `del3689compilado.htm`), identificou a alteração de **2025** do **Art. 300-A** (`Lei nº 15.280, de 2025`), mas o extrator associou o artigo errado ou não capturou a novidade.

### As 4 Causas Raiz Identificadas
1. **Lógica de identificação do Artigo no Scraper (`supabase/functions/vademecum-scraper/index.ts`)**:
   - Quando uma nova alteração é o próprio caput de um artigo incluído (ex: `<p>Art. 300-A. ... (Incluído pela Lei nº 15.280, de 2025)</p>`), a função `extractArticleData` pulava o parágrafo atual e procurava apenas no `previousElementSibling` (`let prev = startElement.previousElementSibling`), associando a alteração ao artigo anterior (ex: Art. 300 em vez do Art. 300-A)!
   - O regex para número de artigo usava `split(' ')[1]?.replace('.', '')`, que falhava em artigos com sufixos (`300-A`), numerações com milhar (`1.225.`), ou sem espaço.
   - O filtro de detecção de alterações checava apenas `Redação dada pela Lei` ou `Incluído pela Lei`, ignorando gênero feminino (`Incluída pela Lei`), revogações (`Revogado/a pela Lei`), Decretos-Leis, Emendas Constitucionais e Leis Complementares.
   - Deduplicação cega por `item.artigo` sobrescrevia alterações de diferentes anos/dispositivos do mesmo artigo.
   - Dependência estrita do `browserless.io` gerava falha de rede/timeout quando chamado pelo cliente.

2. **Bloqueio de Cache Local no Frontend (`src/pages/AdminMapeamentoLeis.tsx`)**:
   - `handleAbrirHistorico` checava `getScrapedAlteracoes(lei.tabela_nome, lei.id)`. Se encontrasse qualquer dado no `localStorage` (`vade_scrape_data_*`), ele usava o cache estático antigo (de 2023) e **nunca** executava a varredura nova no Planalto.
   - Ausência de botão explícito e claro para "Limpar Cache & Re-escanear do Planalto".

3. **Base de Sementes e Leis Recentes (`src/data/leiAlteracoesScraped.ts`)**:
   - `KNOWN_LEIS_DATAS` não continha as leis de 2023 a 2026 como a Lei 15.280/2025 (CPP Art. 300-A), Lei 14.994/2024 (Pacote Antifeminicídio no CP/CPP/CC), Lei 14.843/2024, Lei 14.836/2024, Lei 14.711/2023 (Marco Legal das Garantias - CC), etc.
   - Sementes ricas só existiam para o Código Penal (`SEED_CP_ALTERACOES`), deixando Código Civil e CPP sem cobertura offline/imediata.

4. **Sincronização no Banco (`handleSincronizarArtigo`)**:
   - O replace numérico `item.artigo.replace(/[^0-9]/g, '')` removia sufixos como `-A` (tornando `Art. 300-A` em `300`), sobrescrevendo artigos indevidos no banco com `%300%`.

---

## Proposta de Solução

### 1. Refatoração Total do Extrator (`supabase/functions/vademecum-scraper/index.ts`)
- Implementar **motor dual híbrido**:
  - **Motor Primário (HTTP Nativo ultrarrápido com Deno)**: Busca o HTML oficial do Planalto via `fetch` direto (com decodificação `windows-1252` e `utf-8` e fallback de variantes de URL), parseia com RegExp/DOM robusto sem depender de Puppeteer/Browserless, retornando em menos de 1 segundo sem risco de quota ou timeout.
  - **Motor Secundário (Puppeteer/Browserless)** como fallback caso o HTML precise de renderização complexa.
- **Identificação precisa de Artigos**:
  - Regex universal: `/^Art\.?\s*(\d+(?:\.\d+)*(?:-[A-Za-z0-9]+)?)/i` que suporta perfeitamente `Art. 300-A`, `Art. 1.225`, `Art. 15-B`, etc.
  - Checar PRIMEIRO se o próprio elemento/parágrafo do dispositivo alterado é o caput do artigo (`Art. 300-A`). Somente se for parágrafo/inciso/alínea, percorrer os nós anteriores para encontrar o artigo-pai!
- **Ampla detecção de termos modificadores**:
  - Casar `Inclu[íi]d[oa]`, `Reda[çc][ãa]o\s+dada`, `Revogad[oa]`, `Acrescid[oa]`, `Vide`, `Vig[êe]ncia` por Lei, Lei Complementar, Decreto-Lei, Emenda Constitucional ou Medida Provisória.
- **Chave de unicidade inteligente**:
  - Deduplicar por `${artigo}_${ano}_${dispositivo}` para não apagar diferentes atualizações ou incisos do mesmo artigo.

### 2. Atualização da Base de Conhecimento e Sementes (`src/data/leiAlteracoesScraped.ts`)
- Adicionar todas as leis recentes no `KNOWN_LEIS_DATAS` (2023 a 2026):
  - Lei 15.280/2025 (Art. 300-A CPP)
  - Lei 14.994/2024 (Feminicídio - CP, CPP, CC)
  - Lei 14.843/2024 (Saidinhas / Exame criminológico)
  - Lei 14.836/2024 (Empate HC)
  - Lei 14.711/2023 (Marco Legal das Garantias - Código Civil)
  - Lei 14.620/2023 (Minha Casa Minha Vida - Código Civil)
  - Leis de 2024 a 2026 correlatas.
- Criar `SEED_CC_ALTERACOES` e `SEED_CPP_ALTERACOES` para que Código Civil e Código de Processo Penal tenham visualização imediata das alterações recentes mesmo antes de acionar a rede.
- Ajustar `getScrapedAlteracoes` para mesclar as novidades recentes sempre no topo, independentemente da data do cache antigo.

### 3. Melhorias na UI de Histórico (`src/pages/AdminMapeamentoLeis.tsx`)
- Adicionar botão com ação clara de **"Forçar Nova Varredura do Planalto"** (com limpeza de cache local para recarregar do zero).
- Exibir badge com o ano mais recente (2025 / 2026) e contagem precisa de alterações.
- Corrigir `handleSincronizarArtigo` para preservar artigos com sufixo (ex: `Art. 300-A`).

---

## Verificação e Entrega
- Compilar com `.\node_modules\.bin\tsc.CMD --noEmit`.
- Build de produção com `.\node_modules\.bin\vite.CMD build`.
- Deploy da Edge Function: `.\node_modules\.bin\supabase.cmd functions deploy vademecum-scraper --project-ref dnjrgpldcwcpoywamorr`.
- Commit e push automático no Git.
