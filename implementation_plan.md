# Plano de Implementação - Ajustes no Cabeçalho e Busca Flutuante (Resumos Jurídicos)

## 1. Requisitos do Usuário
- **Remover o Logo** do painel hero de Resumos Jurídicos (não precisa mostrar o logo).
- **Remover a Barra de Pesquisa do Topo** (que estava dentro do banner).
- **Adicionar Botão Flutuante de Pesquisa (FAB)**: posicionado no canto inferior direito, moderno, com ícone de pesquisa, sombra premium e feedback tátil, permitindo pesquisar de forma prática sem ocupar espaço no topo.

## 2. Etapas
1. **`ResumosHero.tsx`**:
   - Remover a renderização do logo (`<picture>` / `<img src="/logo-prime.webp" ... />` ou coruja).
   - Ajustar o espaçamento superior e tipografia para manter a harmonia visual.
   - Remover a barra de pesquisa inferior do hero.
2. **`ResumosJuridicosAreas.tsx`**:
   - Inserir o botão flutuante (FAB) no canto inferior direito com suporte à pesquisa (seja abrindo sheet/overlay de busca rápida ou expandindo input flutuante).
   - Permitir filtrar matérias/temas dinamicamente mantendo o estado `q` / `setQ`.
3. **Validação**:
   - Executar `tsc.CMD --noEmit` para garantir zero erros TypeScript.
4. **Versionamento Git**:
   - Auto-commit e push para o GitHub.
