# Implementation Plan - Distribuição Uniforme do Menu de Rodapé (LeiDetailView)

## Diagnóstico
Na visualização detalhada da legislação (`LeiDetailView.tsx`), a barra de navegação inferior mobile apresentava distribuição assimétrica:
1. O contêiner utilizava `items-end` e `px-1`, gerando desalinhamento vertical e colisão do 4º botão ("Sobre") contra o raio de curvatura superior direito (`rounded-t-3xl`), truncando o texto para "Sob".
2. A falta de dimensões simétricas e `min-w-0 w-full` em cada coluna permitia variação de espaçamento entre as abas.
3. No mobile, a proximidade extrema com a borda direita fazia com que o botão "Sobre" colidisse visualmente com elementos da interface do navegador (como contador de abas `08`).

## Solução Proposta
1. **Distribuição Uniforme dos 4 Botões:**
   - Configurar o grid dos 4 botões com `grid grid-cols-4 items-center justify-items-stretch w-full max-w-lg mx-auto px-2 sm:px-4 py-1.5`.
   - Definir cada item com `w-full min-w-0 flex flex-col items-center justify-center text-center py-1.5 px-0.5 rounded-xl`.
   - Garantir que os rótulos de texto (`Artigos`, `Capítulos`, `Lotes`, `Sobre`) usem `text-[11px] sm:text-[12px] font-medium leading-tight truncate w-full text-center tracking-tight`.
   - Padronizar a pílula animada de seleção ativa (`layoutId="cp-nav-active-pill"`) com espaçamento inset harmônico (`inset-x-0.5 inset-y-0.5 rounded-xl bg-white/10 ring-1 ring-white/20`).
2. **Blindagem e Layout do Rodapé:**
   - Adicionar fundo escuro de alto contraste e elevação (`bg-[#0e0f12]/98 backdrop-blur-xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] pb-[calc(0.5rem+var(--sai-bottom))]`).
   - Evitar truncamento e garantir área de toque confortável (>48px de altura).
3. **Validação:**
   - Compilação sem erros via `tsc --noEmit`.
   - Build de produção via `vite build`.
   - Commit e push automático para o repositório GitHub.
