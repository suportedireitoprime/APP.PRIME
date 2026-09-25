# Plano de Implementação: Histórico de Alterações Oficial do Planalto e Ajustes Visuais

Ajustar o histórico do Código Penal para consumir exclusivamente os dados reais extraídos da varredura do Planalto, remover as bordas claras dos cards e aumentar o título e o risquinho do cabeçalho para o padrão oficial do início do app.

---

## 1. Dados Reais da Varredura das Leis (Substituição Definitiva do Histórico Antigo)
- **Eliminar Lógica Legada de Regex:** Remover em `LeiHistoricoCarousel.tsx` e `NovidadesPanel.tsx` o parser de regex antigo que varria `artigos.caput` e gerava registros inconsistentes e desatualizados (ex: Art. 121 / 2025, Art. 83 Vigência).
- **Consumir Varredura Oficial do Planalto:**
  - Ler `vade_scrape_data_${tabelaNome}` e `vade_scrape_data_${leiId}` gravados pelo `AdminMapeamentoLeis` (`ScrapedArticleUpdate[]`).
  - Mesclar com alterações salvas no Supabase (`dbAlteracoes` de `legislacao_alteracoes`).
  - Para o Código Penal (`CP_CODIGO_PENAL` / `cp`), fornecer fallback semente estruturado com a lista de alterações reais (iniciando com Art. 92, Ano 2026, Lei nº 15.358/2026) garantindo exibição instantânea mesmo se o cache local estiver vazio.
  - Ordenar por ano decrescente e exibir a contagem real das atualizações.
  - Ao clicar no card, abrir o leitor no artigo correspondente via `onOpenArtigo`.

## 2. Estilo Visual dos Cards de Histórico (Eliminar Bordas Claras)
- Remover `border-white/10` brilhante.
- Aplicar background ultra dark discreto `bg-[#121316] hover:bg-[#17181d]` com bordas quase imperceptíveis `border border-white/[0.03] hover:border-white/[0.08]` e sombras suaves `shadow-lg shadow-black/50`.
- Badges sutis e tipografia refinada.

## 3. Risquinho e Título "HISTÓRICO" Idênticos ao Início do App
- Risquinho: `w-1.5 h-5 rounded-full bg-primary shadow-sm shadow-primary/60 shrink-0`.
- Título: `font-display text-foreground text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest`.
- Badge de contagem: `text-[12px] font-medium tracking-normal text-zinc-400 normal-case`.
- Botão "Ver todos": cápsula translúcida alinhada ao design system da Home.

## 4. Validação & Versionamento
- Executar `tsc --noEmit` e `vite build`.
- Realizar git commit e push automáticos.
