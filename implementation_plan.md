# Plano de Implementação — Filtros Avançados, Imagens Ampliadas sem Fundo Branco e Cache Instantâneo a 0ms

Atender rigorosamente aos 3 pontos solicitados pelo usuário nos áudios:
1. **Data Vigente e Filtros em Concursos (`/concursos`)**:
   - Por padrão, abrir marcando a data vigente de hoje (`todayYMD`).
   - Implementar os 3 menus de alternância/filtros: **Cargos / Carreiras**, **Dias faltantes para encerrar** (urgência/prazo) e **Salário**.
2. **Navegação a 0ms sem Loading**:
   - Manter cache em memória a nível de módulo compartilhado para editais, garantindo que ao alternar entre "Radar de Concursos" e "Ver Todos" os cards apareçam instantaneamente a 0ms sem loading/flicker.
3. **Imagens das Profissões sem Fundo Branco e Significativamente Maiores**:
   - Remover contêiner circular branco (`bg-white rounded-full border`).
   - Aumentar expressivamente as dimensões da ilustração 3D para `w-20 h-20 sm:w-24 sm:h-24` (ou mais), aplicando drop-shadow natural e deixando o personagem se destacar diretamente no card escuro.

---

## Detalhamento das Alterações

### 1. `src/pages/RadarConcursos.tsx`
- **Imagens das Profissões**:
  - Remover `bg-white rounded-full flex items-center justify-center p-1.5 shrink-0 shadow-md border border-border/50`.
  - Substituir por contêiner transparente ampliado: `w-20 h-20 sm:w-24 sm:h-24 -ml-2 -mt-1 flex items-center justify-center shrink-0`.
  - A imagem recebe `w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] group-hover:scale-110 transition-transform duration-300`.
  - No modal de edital, remover também o círculo branco e exibir o avatar ampliado com drop-shadow cinematográfico.
- **Cache de Latência Zero (0ms)**:
  - Definir `let memoryConcursosCache: ConcursoItem[] = [];` no módulo.
  - Inicializar `useState(() => memoryConcursosCache)` e `loading` como `false` se o cache já tiver itens.
  - Atualizar o cache silenciosamente em background sem exibir spinner quando já houver dados.

### 2. `src/pages/Concursos.tsx`
- **Data Vigente Padrão**:
  - `dataFiltro` inicializado com `todayYMD` (data de hoje).
  - Caso hoje não contenha editais naquele instante, o seletor visual exibe o botão HOJE selecionado com facilidade para alternar para outros dias ou limpar.
- **Menus de Filtros**:
  - Menu 1: **Cargos / Carreiras** (Todos os Cargos ou filtro por uma das 14 carreiras categorizadas).
  - Menu 2: **Dias Faltantes / Prazo** (Todos, Encerrando em até 3 dias, Encerrando esta semana ≤ 7 dias, Mais de 7 dias).
  - Menu 3: **Salário** (Todos, + R$ 3.000, + R$ 5.000, + R$ 10.000, + R$ 15.000).
- **Lista de Editais**:
  - Renderizar a thumbnail do card da lista sem esticar ou cortar, utilizando `object-contain p-2` com a nova ilustração da profissão.
- **Cache 0ms**:
  - Compartilhar dados em memória para abertura instantânea.

---

## Validação e Verificação
1. `.\node_modules\.bin\tsc.CMD --noEmit` para validação estrita de tipos TypeScript.
2. `.\node_modules\.bin\vite.CMD build` para testar o bundle de produção.
3. `git add . ; git commit ... ; git push` automático.
