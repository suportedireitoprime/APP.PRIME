# Plano de Implementação: Menu de Alternância de Artigos Recentes e Fundo Opaco da Busca

Corrigir a sobreposição e transparência do dropdown de pesquisa, substituindo o fundo transparente por um painel 100% opaco e transformando a exibição de artigos recentes em um menu de alternância rolável (chips horizontais) contendo apenas o artigo abreviado e o número.

---

## 1. Eliminação Total da Transparência (Fundo 100% Sólido)
- **Problema:** O dropdown de busca utilizava classes translúcidas (`bg-[#121216]/98 backdrop-blur-2xl`) dentro de um contêiner `sticky` com outro `backdrop-blur`, causando vazamento de opacidade no browser e deixando o texto de fundo ("PARTE GERAL", "TÍTULO I", etc.) visível e embaralhado sob a caixa de pesquisa.
- **Solução:**
  - Aplicar fundo 100% sólido e opaco `bg-[#0D0D0E]` com borda nítida `border border-zinc-800` e sombra pronunciada `shadow-2xl shadow-black`.
  - Backdrop de foco com escurecimento total do fundo (`fixed inset-0 z-40 bg-black/70`) para isolar visualmente a busca.
  - Elevar o `z-index` do dropdown para `z-[60]` para sobrepor qualquer elemento.

## 2. Menu de Alternância Rolável para Artigos Recentes
- **Estrutura:**
  - Título do bloco: **"ÚLTIMOS ARTIGOS PESQUISADOS"** com ícone `History` e botão de fechar/limpar.
  - Carrossel horizontal rolável (`overflow-x-auto no-scrollbar flex items-center gap-2 py-2 px-1`).
  - Cada item é uma pílula (chip) compacta contendo **somente o artigo abreviado e o número** (ex: `Art. 1º`, `Art. 2º`, `Art. 18`, `Art. 92`, `Art. 121`), conforme pedido explícito do usuário.
  - Sem parágrafos de caput ou blocos verticais poluídos.
  - Ao clicar na pílula, seleciona e abre o artigo instantaneamente via `openArtigoWithRecent`.
  - Fallback elegante: se o usuário ainda não tiver artigos recentes no histórico, exibir sugestões rápidas dos principais artigos da lei.

## 3. Resultados de Busca Estruturados
- Quando o usuário digitar na busca, manter o menu de alternância no topo para acesso rápido e exibir a lista de resultados abaixo com fundo sólido e sem transparência.

## 4. Validação & Versionamento
- Executar `tsc --noEmit` e `vite build`.
- Enviar commit automático e push para o GitHub.
