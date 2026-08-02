# Resumos Jurídicos no padrão Vade Mecum

## O que muda

**1. Painel de topo (hero) igual ao Vade Mecum**
- Mesmo formato do painel do Vade Mecum: cantos inferiores arredondados, brilho radial, gradiente escuro na base, botão de voltar, título grande, subtítulo rotativo e barra de pesquisa com botão "PESQUISAR".
- Cor do painel: o ciano do ícone de Resumos no início do app (#22D3EE), em versão escura/profunda para servir de fundo.
- Imagens vazadas (silhuetas translúcidas) ao fundo, alternando a cada alguns segundos como no Vade Mecum. Serão geradas 3 imagens novas no tema de estudo/resumos (livros, cadernos, estudante), em silhueta monocromática para "vazar" no fundo.
- Subtítulos rotativos: "Resumos por Área", "Temas e Subtemas", "Estudo Rápido", "Direto ao Ponto".
- Sem menu de alternância (sem abas).

**2. Lista de áreas com ícones vazados**
- Remove o quadrado colorido de fundo de cada ícone; fica só o ícone em linha (outline), no estilo da tela Aprender, mantendo a cor de cada área.

**3. Menu de rodapé próprio dos Resumos**
- Mesmo visual do rodapé do Vade Mecum (cinza translúcido, pílula animada no item ativo, 5 slots).
- Itens: **Resumos, Favoritos, Recentes, Anotações, Offline**.
- Favoritos e Recentes ganham telas próprias (lista de resumos marcados / abertos recentemente). Anotações e Offline apontam para as telas já existentes do app.

## Detalhes técnicos

- Novo token `bg-hero-panel-cyan` em `src/index.css` (gradiente derivado de #22D3EE).
- Novo componente `src/components/resumos/ResumosHero.tsx` espelhando `VadeMecumHero.tsx`.
- Novo `src/components/resumos/ResumosBottomNav.tsx` espelhando `VadeMecumBottomNav.tsx`.
- 3 imagens geradas em `src/assets/resumos-hero/` (mesmo padrão de asset pointer do Vade Mecum).
- `ResumosJuridicosAreas.tsx`: troca `PageHeader` + input pelo hero; overlay de busca acionado pela barra; ícones sem caixa de fundo.
- Favoritos/Recentes: persistência local (localStorage) por id de resumo, com rotas `/resumos-juridicos/favoritos` e `/resumos-juridicos/recentes` registradas em `App.tsx`.
