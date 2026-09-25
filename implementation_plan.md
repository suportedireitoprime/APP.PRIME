# Plano de Implementação: Tela Cheia de Histórico e Artigo, Mês/Ano nos Cards e Comparativo com IA OmniRoute

Implementar abertura em tela cheia do Histórico ("Ver todos") e do Leitor de Artigo, adicionar mês/ano aos cards, ajustar espaçamento da tipografia de ano e criar a tela completa de comparativo e explicação didática com IA (OmniRoute) antes de ir para o artigo.

---

## 1. Abertura em Tela Cheia (Histórico e Leitor de Artigo)
- **Histórico "Ver todos" (`LeiDetailView.tsx`):**
  - Ajustar o modal de novidades para ocupar 100% da tela (`fixed inset-0 h-[100dvh] max-h-none rounded-none`), com `pt-[var(--sai-top)]`, subindo até o topo sem sobras.
- **Leitor de Artigo (`ArtigoBottomSheet.tsx`):**
  - Atualizar altura e posicionamento de `h-[90dvh]` para `h-[100dvh] top-0 bottom-0 inset-0 max-h-none rounded-none`, ocupando a tela completa até em cima.

## 2. Exibição de Mês Abreviado / Ano nos Cards e no Scraper
- Em `leiAlteracoesScraped.ts`:
  - Implementar função `extractMesAno` para identificar a data e formatar o mês abreviado com ano (ex: `Jan/2026`, `Out/2024`, `Jan/2024`).
  - Atualizar a semente de Código Penal com as datas reais das leis (Lei 15.358 -> `Jan/2026`, Lei 15.438 -> `Jan/2026`, Lei 14.994 -> `Out/2024`).
- Em `AdminMapeamentoLeis.tsx`:
  - Extrair o mês nos dados raspados das leis.
- Em `LeiHistoricoCarousel.tsx`:
  - Substituir o badge de ano simples por `item.mesAno` (ex: `Jan/2026`).

## 3. Correção de Tipografia nos Títulos de Ano
- Em `NovidadesPanel.tsx`:
  - Ajustar `ANO 2026` para utilizar `font-sans font-extrabold uppercase tracking-widest text-zinc-100`, eliminando letras comprimidas/espremidas e garantindo perfeita legibilidade.

## 4. Tela Completa de Comparativo & Análise com IA (OmniRoute)
- Criar `src/components/vademecum/artigo/ArtigoComparativoModal.tsx`:
  - **Abertura:** Ao clicar em um card do carrossel ou de novidades, abrir esta tela completa de análise.
  - **Menu de Alternância (Tabs):**
    1. **Comparativo (Novo vs Antigo):** Exibe texto novo em destaque esmeralda e texto anterior revogado com efeito tachado.
    2. **Explicação IA (OmniRoute):** Gera explicação didática do que mudou, contexto da norma e impacto prático na aplicação jurídica, integrando com o `executeAiTask` (`chat_juridico` via OmniRoute) com cache em `localStorage`.
    3. **Dispositivo no Código:** Texto integral do artigo.
  - **Ação:** Botão de destaque no rodapé **"Ir para o Artigo Completo"**, que encaminha diretamente para o leitor `ArtigoBottomSheet`.

## 5. Validação & Versionamento
- Checagem com `tsc --noEmit`.
- Build de produção com `vite build`.
- Auto-commit e push para o GitHub.
