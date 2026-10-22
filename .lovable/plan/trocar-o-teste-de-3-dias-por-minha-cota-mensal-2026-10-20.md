# Trocar o teste de 3 dias por "Minha Cota" mensal

## Como vai funcionar para o usuário gratuito
- Ao se cadastrar, não ganha mais 3 dias liberados. Ganha uma **cota mensal** que se renova a cada 30 dias, contados a partir do cadastro.
- Assinantes (Asaas, Play, Apple, vitalícios) continuam sem limite nenhum.

| Função | Por mês |
|---|---|
| Audioaulas | 10 |
| Audioleis | 10 |
| Artigos (abrir explicação/conteúdo) | 10 |
| Favoritar artigo | 10 |
| Livros da biblioteca | 2 |
| Aulas (Aprender) | 10 |
| Lições (Lei Seca) | 10 |
| Videoaulas | 10 |
| Mapas mentais | 10 |
| Demais funções (questões, flashcards, simulados, resumos, me explique, petição, grifos, anotações, blog etc.) | 10 cada |
| Dicionário, consultar leis (Vade Mecum), notícias | Livre, sem limite |

- Repetir o mesmo item não gasta de novo (ouvir a mesma audioaula duas vezes conta 1).
- Quando acaba a cota de uma função, aparece um aviso: "Você usou suas 10 audioaulas deste mês. Renova em X dias, ou assine para liberar tudo." As outras funções continuam funcionando.

## Novo item no menu: "Minha Cota"
- Fica logo abaixo de "Assistente Hórus", com um anel de 0 a 100% mostrando quanto da cota total já foi usada (assinante vê "Ilimitado").
- Ao tocar, abre uma tela com cada função: barra de progresso, "3 de 10 usados", e a data de renovação. No topo vem um botão para assinar.

## Retirar o teste de 3 dias
Retiro do app tudo o que fala do teste: o aviso de boas-vindas do teste, "Seu teste de 3 dias acabou", os lembretes de teste, os textos na ajuda de login e nas telas premium, e os cartões de teste no painel admin. Tudo isso vira a linguagem da cota. Quem está no meio do teste hoje passa direto para a cota.

## Detalhes técnicos
- Reaproveitar o que já existe: tabelas `feature_limits` (configuração) e `feature_usage` (registro de uso) e o hook `useFeatureLimit`.
- Atualizar os valores das linhas em `feature_limits` (run_sql) e adicionar as chaves que faltam: `audioaula`, `audiolei`, `artigo_read`, `artigo_favorito`, `livro` (2), `aula`, `licao`, `videoaula`, `mapa_mental`. Todas com `period: monthly` e limite 10, exceto `livro`. Remover os limites de `noticia_read` e consulta de lei.
- O período mensal passa a ser contado a partir do dia do cadastro (ciclos de 30 dias), não do dia 1º; ajustar `periodStart` em `useFeatureLimit`.
- O registro de uso é único por (usuário, função, item, período) via `ref_key`, para que repetições não gastem cota.
- Colocar a checagem e o registro (`consume`) nos pontos de entrada: player de audioaulas, player de audioleis, abertura de artigo, favoritar, leitor de livros, aula do Aprender, lição da Lei Seca, videoaula, mapa mental.
- `useSubscription`: remover o ramo de teste (`isTrial`, `trial_ends_at`, 3 dias). Remover/simplificar `TrialWelcomeModal`, `trialReminders` e `isTrialExpired` em `PremiumGate`/`useFeatureLimit`.
- Nova página `src/pages/MinhaCota.tsx` + rota `/minha-cota` (+ arquivo de rota stub) + item no `SideMenu.tsx`.
- Testes vitest: cálculo do ciclo de 30 dias, percentual total, livro limitado a 2, mesmo item não conta duas vezes, assinante ilimitado.
- Também ficam sem limite: as narrações por voz dentro do Vade Mecum, para que consultar as leis continue totalmente livre (só Audioleis tem cota).
