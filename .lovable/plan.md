## Objetivo

Trazer a função **Lei Seca** do projeto linkado para este app, 100% na mesma mecânica (matérias → leis → partes → lições com exercícios, estrelas e progresso), com card novo na home, tela por áreas do Direito, barra de progresso, menu de rodapé no padrão de Resumos e lembretes.

## O que existe no projeto de origem (mecânica a replicar)

- Tabelas `lei_seca_trilhas`, `lei_seca_licoes`, `lei_seca_progresso`, `lei_seca_jobs`.
- Edge functions `lei-seca-estruturar` (quebra a lei em lições por título/capítulo), `lei-seca-gerar` (gera os exercícios com IA) e `lei-seca-auto-worker` (geração automática em lote).
- Front: `src/lib/leiSeca.ts`, `leiSecaMaterias.tsx` (agrupa leis por matéria: Penal, Civil, Estatutos…), `leiSecaPrefetch.ts`; hooks `useLeiSecaFavoritos`, `useLeiSecaRecentes`, `useLeiSecaResumoGlobal`; componentes `ExercicioRunner`, `ArtigoComentarioSlide`, `ExplicacaoModal`, `ExplicacoesList`, `ExplicacoesMarqueeCarousel`, `LeiSecaMateriaSheet`, `LeiSecaTrilhaIcons`; páginas `LeiSecaIndex`, `LeiSecaTrilha`, `LeiSecaParte`, `LeiSecaPlayer`; som de acerto.
- 12 tipos de exercício (completar, sim/não, ligar, organizar, achar o erro, qual artigo, qual inciso, classificar, caça-palavra, prazo, pena, alternativas).

## Única adaptação técnica necessária

No projeto de origem cada lei é uma tabela própria (ex.: `"CP - Código Penal"`). Aqui o texto legal está em `vade_mecum_leis` / `vade_mecum_artigos` (159 leis, 24.425 artigos). Então `lei_seca_trilhas.tabela_lei` passa a ser `lei_id` (referência ao Vade Mecum), e as funções de estruturar/gerar e o carregamento de artigos leem de `vade_mecum_artigos`. O resto da mecânica é idêntico.

## Passos

1. **Banco** — migration criando `lei_seca_trilhas`, `lei_seca_licoes`, `lei_seca_progresso`, `lei_seca_jobs` (mesmas colunas/índices/RLS do original: leitura pública das trilhas/lições, progresso só do próprio usuário), trigger de `updated_at` e seed das leis mais cobradas (CF, CP, CPP, LEP, CC, CPC, CLT, CDC, CTN, ECA, 8.112, LINDB, LGPD, Maria da Penha, Drogas…) apontando para os `lei_id` que já existem no Vade Mecum deste app.
2. **Edge functions** — portar `lei-seca-estruturar`, `lei-seca-gerar` e `lei-seca-auto-worker` lendo os artigos de `vade_mecum_artigos` e usando o Lovable AI para gerar os exercícios (mesmo formato e validação do original).
3. **Front (cópia fiel)** — `src/lib/leiSeca.ts`, `leiSecaMaterias.tsx`, `leiSecaPrefetch.ts`, os 3 hooks, os 7 componentes de `src/components/lei-seca/`, as 4 páginas e o som de acerto; rotas `/lei-seca`, `/lei-seca/:slug`, `/lei-seca/:slug/:parte`, `/lei-seca/:slug/:parte/licao/:id` e as regras de voltar/ocultar header do player.
4. **Tela por áreas** — home da Lei Seca lista **Áreas do Direito** (ex.: Direito Penal → Código Penal, CPP, Lei de Execução Penal, Lei de Drogas…). Ao tocar na área abre a folha com as leis, cada uma com **barra de progresso** e status concluído; dentro da lei, a linha do tempo das lições (trilha vertical) igual ao original.
5. **Menu de rodapé** — novo `LeiSecaBottomNav` no mesmo padrão visual do `ResumosBottomNav`, com **Início, Ranking, Favoritos e Lembretes**, exibido só nas telas da Lei Seca (nunca no player de lição).
6. **Progresso na base** — todo progresso (estrelas, melhor pontuação, tentativas, concluída) salvo em `lei_seca_progresso` pelo ID do usuário; favoritos e recentes sincronizados via o `user_sync_items` já usado no app, para não zerar ao trocar de conta/dispositivo.
7. **Lembretes** — tela de lembretes da Lei Seca com: lembrete **diário** (usuário escolhe o horário) e lembrete **de retomada da trilha** em andamento, usando a infraestrutura de push/lembretes já existente no app.
8. **Desempenho** — mesmo padrão já aplicado em Videoaulas/Resumos: cache com TTL, hidratação síncrona, prefetch no `onPointerDown` dos cards e pré-carregamento dos chunks da Lei Seca em idle após o login.
9. **Card na home** — novo card **Lei Seca** na aba "Em Alta", logo abaixo de Dicionário, apontando para `/lei-seca`.

## Detalhes técnicos

- Exercícios continuam em `jsonb` na lição, com status `pendente/processando/pronto/erro` e geração sob demanda + worker em background.
- Leitura dos artigos: `vade_mecum_artigos` filtrada por `lei_id` e faixa de artigos (o campo `partes.filtro` com `art_min`/`art_max` do original é mantido).
- Nenhuma tela existente é alterada além da inclusão do card na lista "Em Alta".
