# Plano de Implementação — Fluidez Absoluta e Navegação Instantânea (0ms) no Vade Mecum e Rotas

Eliminar a percepção de engasgo, lentidão, movimento vertical (`translateY`) e elementos inicialmente invisíveis (`opacity: 0`) nas navegações do aplicativo (especialmente Vade Mecum, Constituição, Códigos, Estatutos, Súmulas e subpáginas).

---

## 1. Diagnóstico e Causas Identificadas

1. **Camada de Rota (`PageTransition.tsx` e `index.css`)**:
   - `PageTransition.tsx` aplicava `animate-page-in` em navegações PUSH/REPLACE.
   - `@keyframes page-in` em `index.css` iniciava em `opacity: 0; transform: translateY(4px) scale(0.994)` com duração de 200ms.
   - A rota `/vade-mecum` em `AppRoutes.tsx` não tinha a prop `instant`.

2. **Hub do Vade Mecum (`VadeMecum.tsx` e `MobileHomeSections.tsx`)**:
   - `VadeMecum.tsx` envolvia o conteúdo em `<AnimatePresence mode="wait">` com `<motion.div initial={{ opacity: 0 }} transition={{ duration: 0.15 }}>`.
   - `MobileHomeSections.tsx` envolvia as abas em `<AnimatePresence mode="wait" initial={false}>`, atrasando a troca e montagem das abas.

3. **Abas e Seções do Vade Mecum (`HomeTabEmAlta.tsx`, `HomeTabCategorias.tsx`, `HomeTabAreas.tsx`)**:
   - `HomeTabEmAlta.tsx`: container com `initial={{ opacity: 0, y: 16 }}`; cards de legislação com `initial={{ opacity: 0, scale: 0.95 }}` e `delay={Math.min(i * 0.03, 0.25)}`; radares com `staggerChildren: 0.05, delayChildren: 0.1`.
   - `HomeEmAltaCarousel.tsx`: botões com `initial={{ opacity: 0, y: 6 }}` e `transition={{ delay: Math.min(i * 0.03, 0.2) }}`.
   - `AprendaSobreLeis.tsx`: botões com `initial={{ opacity: 0, y: 8 }}` e `transition={{ delay: Math.min(i * 0.04, 0.2) }}`.
   - `HomeTabCategorias.tsx` e `HomeTabAreas.tsx`: containers com `initial={{ opacity: 0, y: 16 }}` e cards com `delay={i * 0.05}` / `delay={Math.min(i * 0.04, 0.3)}`.

4. **Subpáginas do Vade Mecum (`VadeMecumCodigos.tsx`, `VadeMecumEstatutos.tsx`, `VadeMecumEspeciais.tsx`, `VadeMecumSumulas.tsx`, `VadeMecumFavoritos.tsx`, `VadeMecumRecentes.tsx`)**:
   - Todas usavam `initial="hidden"` com `opacity: 0`, `staggerChildren` (30ms a 100ms) e itens com `y: 8`, `y: 10` ou `x: -10`.

5. **Artigos e Listas de Leis (`ArtigoCard.tsx` e `tailwind.config.ts`)**:
   - `ArtigoCard.tsx` usava `animate-cascade-in` com `animationDelay: cascadeDelay / structuralDelay`.
   - `cascade-in` em `tailwind.config.ts` iniciava com `opacity: 0, transform: translateY(14px)` e `fill-mode: both`.

6. **Outras Ocorrências de Atraso**:
   - `LeiSecaParte.tsx`: `animate-fade-in-up` com delays escalonados.
   - `ResultadoConteudoCard.tsx`: `animationDelay: Math.min(index * 20, 200)ms`.
   - `ForcaRanking.tsx`: delays artificiais na montagem.

---

## 2. Ações Planejadas

### Fase 1: Zero Latência Global na Transição de Rotas
- Ajustar `PageTransition.tsx` para não aplicar animação que inicie com `opacity: 0` ou `translateY`.
- Neutralizar `animate-page-in` em `src/index.css`.
- Adicionar `instant` à rota `/vade-mecum` em `src/AppRoutes.tsx`.

### Fase 2: Eliminar Animações de Entrada no Hub Vade Mecum
- `src/pages/VadeMecum.tsx`: Remover `AnimatePresence mode="wait"` e `motion.div` com `initial={{ opacity: 0 }}`. Renderização direta em elementos estáveis.
- `src/components/vademecum/home/MobileHomeSections.tsx`: Remover `AnimatePresence mode="wait"`. Renderizar abas diretamente.
- `src/components/vademecum/home/sections/HomeTabEmAlta.tsx`: Substituir `motion.div` por `div` padrão, remover delays de cards e stagger de radares.
- `src/components/vademecum/home/carousel/HomeEmAltaCarousel.tsx`: Remover `motion.button` com delay e opacity 0.
- `src/components/vademecum/outros/AprendaSobreLeis.tsx`: Remover `motion.button` com delay e opacity 0.
- `src/components/vademecum/home/sections/HomeTabCategorias.tsx` e `HomeTabAreas.tsx`: Remover motion wrappers e delays de entrada dos cards.

### Fase 3: Subpáginas do Vade Mecum Instantâneas
- `src/pages/VadeMecumCodigos.tsx`: Remover `initial="hidden"`, stagger e translateY de entrada.
- `src/pages/VadeMecumEstatutos.tsx`: Remover `initial="hidden"`, stagger e translateY de entrada.
- `src/pages/VadeMecumEspeciais.tsx`: Remover `initial="hidden"`, stagger e translateY de entrada.
- `src/pages/VadeMecumSumulas.tsx`: Remover `initial="hidden"`, stagger e translateX de entrada.
- `src/pages/VadeMecumFavoritos.tsx`: Remover `initial="hidden"`, stagger e delays de entrada.
- `src/pages/VadeMecumRecentes.tsx`: Remover `initial="hidden"`, stagger e delays de entrada.

### Fase 4: Limpeza de Artigos e Demais Delays
- `src/components/vademecum/artigo/ArtigoCard.tsx`: Remover `animate-cascade-in` e delays em `style`.
- `tailwind.config.ts`: Ajustar keyframe `cascade-in` para não manter `opacity: 0` nem `translateY`.
- `src/pages/LeiSeca/LeiSecaParte.tsx`: Remover `animate-fade-in-up` e `animationDelay`.
- `src/components/vademecum/ui_elements/ResultadoConteudoCard.tsx`: Remover `animationDelay`.

### Fase 5: Validação e Versionamento
- Executar `tsc.CMD --noEmit` para validação rigorosa de tipagem.
- Executar `vite.CMD build` para testar empacotamento de produção.
- Git commit e push automáticos no repositório.
