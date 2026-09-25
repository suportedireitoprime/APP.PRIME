# Tarefas: Carrossel de Histórico de Artigos Atualizados (Antes da Barra de Pesquisa)

- [x] Criar `src/components/vademecum/artigo/LeiHistoricoCarousel.tsx`: Seção com cabeçalho com risquinho decorativo, título "Histórico", botão "Ver todos" e carrossel horizontal de cards com badges de alteração (Incluído/Alterado/Revogado), data/lei e clique direto <!-- id: 201 -->
- [x] Atualizar `useLeiData.ts`: Carregar `dbAlteracoes` antecipadamente ao selecionar a lei (sem depender de abrir o painel de novidades) <!-- id: 202 -->
- [x] Integrar `LeiHistoricoCarousel` em `LeiDetailView.tsx`: Posicionar antes da barra de pesquisa, conectado com abertura de artigos e painel "Ver todos" <!-- id: 203 -->
- [x] Validar compilação TypeScript (`tsc --noEmit`) <!-- id: 204 -->
- [x] Validar build Vite de produção (`vite build`) <!-- id: 205 -->
- [x] Executar auto-commit e push para o GitHub <!-- id: 206 -->
