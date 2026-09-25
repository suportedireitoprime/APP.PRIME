# Implementation Plan - Refinamento do Mapeamento de Leis e Histórico de Alterações

## Diagnóstico das Demandas do Usuário
1. **Exibição do dispositivo alterado no Histórico de Alterações:**
   - Atualmente, o topo do card exibe apenas `ART. 156` e joga todo o trecho bruto de parênteses dentro de um link azul `(XI - se a subtração for de petróleo... Incluído pela Lei nº 15.517, de 2026)`.
   - O usuário solicitou que seja destacado com clareza o que foi alterado: se foi inciso, alínea, parágrafo ou o artigo todo, iniciando pela alínea/dispositivo e pela ação (ex: `Incluído Inciso XI`, `Revogada Alínea 'b'`, `Redação dada ao § 2º`).
   - A lei modificadora deve ser apresentada de forma limpa como referência (ex: `Lei nº 15.517/2026`).

2. **Cabeçalho poluído e botão grande de Varredura:**
   - O cabeçalho fixo do Histórico possui excesso de caixas e um botão vermelho grande `Varredura Planalto` que quebra o layout responsivo em smartphones e telas estreitas.
   - O usuário pediu explicitamente para remover esse botão volumoso e deixar o cabeçalho limpo e responsivo.

3. **Fluxo de Aprovação e Lista "Todas" (Zerar a Fila):**
   - Ao aprovar uma lei (como o Código Penal), o usuário quer que ela saia da aba principal "Todas" e vá para "Aprovadas".
   - O contador da lista principal deve subtrair as aprovadas (de 17 para 16), permitindo que o usuário trabalhe até zerar a fila de pendências.

---

## Estrutura da Implementação

### 1. Criar Utilitário de Parser Jurídico de Dispositivos (`parseDispositivoAlteracao`)
Em `src/data/leiAlteracoesScraped.ts` (ou utilitário acoplado):
- Identificar a ação: `Incluído`, `Revogado`, `Redação dada`, `Alterado`.
- Identificar o dispositivo:
  - **Alínea:** `Alínea "a"`, `Alínea "b"`, etc. (com prioridade no início da descrição conforme pedido).
  - **Inciso:** algarismos romanos `Inciso XI`, `Inciso IV`, etc.
  - **Parágrafo:** `§ 1º`, `§ 4º`, `Parágrafo Único`.
  - **Caput:** cabeça do artigo.
  - **Artigo:** artigo novo / íntegra.
- Gerar o título de destaque amigável: `Incluído Inciso XI`, `Revogada Alínea "a"`, `Redação dada ao § 2º`.
- Extrair a identificação limpa da lei modificadora (ex: `Lei nº 15.517/2026`) para o link oficial do Planalto, sem poluir o cabeçalho do card com o texto do dispositivo.

### 2. Otimizar Cabeçalho do Histórico em `AdminMapeamentoLeis.tsx`
- Remover o botão vermelho grandalhão `Varredura Planalto` do cabeçalho.
- Reorganizar o header:
  - Botão de voltar `ArrowLeft` padronizado.
  - Título em destaque `Código Penal` e subtítulo com `Decreto-Lei nº 2.848/1940 • Histórico de Alterações`.
  - Badge discreta de `Última alteração: Setembro/2026`.
  - Botão sutil e compacto com ícone `RefreshCw` para re-varrer sem poluir o layout.

### 3. Ajustar Filtros de Abas em `AdminMapeamentoLeis.tsx`
- Atualizar a aba `Todas`:
  - Contar apenas as leis não aprovadas: `counts.aProcessar = leisCat.filter(l => !aprovados[l.id]).length`.
  - Ao filtrar `filtroStatus === 'todas'`, filtrar `!aprovados[l.id]`, fazendo com que a lei aprovada suma da fila principal e o número vá de 17 para 16 até zerar.
  - A lei aprovada aparecerá exclusivamente na aba `Aprovadas ({counts.aprovadas})`.

---

## Validação e Versionamento
- Executar `tsc --noEmit` para garantir ausência de erros de tipagem.
- Executar `vite build` para validação do bundle de produção.
- Git commit e push automático no branch `main`.
