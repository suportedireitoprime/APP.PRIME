# Padronizar safe-area (barra de status e barra de navegação) no app nativo

## O que está acontecendo

O app já tem um sistema de safe-area funcionando: o plugin `@capacitor-community/safe-area` publica as variáveis `--sai-top/right/bottom/left` no `:root`, e há utilitários `.pt-safe` / `.pb-safe` no `index.css`. O `#root` já reserva a barra inferior.

O problema é de adoção, não de infraestrutura: a landing page não usa nada disso. O cabeçalho dela (`src/pages/Landing.tsx`, nav `absolute top-0` com apenas `pt-5`) e o herói (`HeroTribunal.tsx`) ignoram a safe-area, então o logo e o título "Direito Prime · Estudos Jurídicos" ficam sob a barra de status. O bloco final da landing termina com `pb-14` sem reservar a barra de navegação inferior.

O início do app funciona porque passa por componentes que já aplicam a regra (`AppHeader`, `PageHeader` do Vade Mecum, `BottomNav`). Fora desses, há dezenas de telas com cabeçalho próprio (`top-0` fixo/absoluto/sticky) sem safe-area — Radar 360, Lembretes, Configurações, Blog, Termos, Privacidade, telas de Admin, players e vários sheets.

## O que será feito

### 1. Primitivas únicas (fonte da verdade)

- Adicionar no `index.css` utilitários compostos, para não repetir `calc()` espalhado:
  - `.pt-safe-header` — `calc(var(--sai-top, env(safe-area-inset-top, 0px)) + 0.875rem)` e `min-height: calc(5rem + safe-top)`, replicando exatamente o padrão já usado no `PageHeader` do Vade Mecum.
  - `.pb-safe-nav` — reserva a barra inferior + espaçamento base.
  - `.px-safe` — insets laterais (paisagem / telas curvas).
- Criar `src/components/layout/SafeAreaScreen.tsx`: wrapper simples que aplica topo/base/laterais de forma opcional, para telas que não usam `PageHeader`/`AppHeader`.

### 2. Corrigir a landing page (problema relatado)

- Nav da landing: aplicar o padding de topo com safe-area, mantendo o espaçamento visual atual como piso (`max(safe-top, 1.25rem)`), para não mudar o visual no navegador desktop.
- `HeroTribunal`: deslocar o conteúdo do topo pela mesma medida, para o logo e o título nunca entrarem sob a barra de status.
- Bloco final da landing: reservar a barra de navegação inferior.

### 3. Aplicar o padrão em todas as telas

Varredura completa nos arquivos com cabeçalho `top-0` próprio e sem safe-area (levantados na auditoria), aplicando `pt-safe-header`/`SafeAreaScreen` no topo e `pb-safe-nav` nos rodapés/barras de ação fixas. Grupos:

- Radar: `Radar360`, `Radares`, `RadarProposicoes`, `RadarVotacoes`, `RadarRankings`, `RadarDeputados`, `RadarDeputadoDetalhe`, `RadarPLDetalhe`, `PLAnaliseSheet`
- Lembretes: `Lembretes`, `MeusLembretes`, `LembreteSheet`, `LembreteCard`, `LeiSecaLembretes`
- Institucional/config: `Configuracoes`, `Blog`, `Novidades`, `Termos`, `Privacidade`, `DesktopPromo`, `TestePush`
- Legislação/estados: `LegislacaoEstadual`, `LeiEstadualView`, `EstadoDetalhe`, `PraticarLei`, `LeiSecaPlayer`
- Pessoal: `Livros`, `Leis`, `Filmes`, `Anotacoes`
- Aprender/Resumos: `AprenderArea`, `ResumosJuridicosTemas`, `ResumosJuridicosSubtemas`
- Sheets/overlays: `VisuaisJuridicosSheet`, `MentorOverlay`, `VideoaulaSheet`, `JurisprudenciaSheet`, `TrialTimelineSheet`, `CancelarAssinaturaSheet`, `ObraDetailSheet`, `UserDossieSheet`
- Barras de ação fixas (rodapé): `QuestaoAcoesBar`, `VideoaulaAcoesBar`, `SessaoRunner`, `PeticaoInicialEditor`
- Admin: `AdminLocais`, `AdminBibliotecaLeisGeral`, `AdminNarracaoApresentacao`, `AdminDesignImagens`, `BibliotecaEditar`, `AssistenteHorus`, `PlanosAtivos`

Telas desktop-only (`IndexDesktop`, `DesktopSidebar`, `DesktopTopHeader`, `DesktopNewsSidebar`, `DesktopPageLayout`) recebem apenas os insets, sem alterar o layout desktop.

### 4. Verificação

- Conferir no preview mobile (393x813) que nada regride visualmente na web, já que os paddings usam `max(safe-area, valor atual)`.
- Checar a landing e uma amostra das telas ajustadas com simulação de inset de topo/base.

## Notas técnicas

- Nenhuma mudança em lógica de negócio, dados ou plugins nativos; apenas CSS/JSX de apresentação.
- Sem uso de `@capacitor/status-bar` (removido de propósito no projeto) — tudo continua via CSS + `@capacitor-community/safe-area`.
- Padrão único: sempre `var(--sai-*, env(safe-area-inset-*, 0px))`, porque no WebView Android o `env()` puro não é propagado.
- Após a aprovação, o app nativo precisa de `git pull` + `npx cap sync` para refletir o build.
