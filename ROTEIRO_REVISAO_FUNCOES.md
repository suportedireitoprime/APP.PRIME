# Roteiro de revisao das funcoes do APP.PRIME

Objetivo: revisar o aplicativo por blocos, uma funcao por vez, procurando bugs, lentidao, problemas de layout mobile/tablet/desktop, inconsistencias com Supabase e oportunidades de melhoria.

Fluxo recomendado para cada bloco:

1. Abrir a rota no preview local.
2. Testar em desktop e mobile.
3. Ver console/erros de TypeScript.
4. Conferir chamadas Supabase quando houver.
5. Pedir ajuste ao Antigravity ou aplicar ajuste direto no codigo.
6. Rodar verificacao (`tsc`, build ou teste focado).
7. Marcar status aqui.

## Prioridade 1 - experiencia principal do aluno

| Status | Bloco | Rotas principais | Arquivos principais |
| --- | --- | --- | --- |
| Pendente | Home / entrada do app | `/` | `src/pages/Index.tsx`, `src/pages/IndexMobile.tsx`, `src/pages/IndexDesktop.tsx` |
| Em andamento | Resumos juridicos | `/resumos-juridicos`, `/resumos-juridicos/:area`, `/resumos-juridicos/:area/:tema` | `src/pages/resumos-juridicos/*`, `src/components/resumos/*` |
| Pendente | Vade Mecum / legislacao | `/vade-mecum`, `/legislacao/:tipo/:leiSlug/:artigoNumero` | `src/pages/VadeMecum*.tsx`, `src/pages/CategoriaLegislacao.tsx` |
| Pendente | Lei Seca | `/lei-seca`, `/lei-seca/:slug/:parte/licao/:id` | `src/pages/LeiSeca/*` |
| Pendente | Questoes | `/questoes`, `/questoes/praticar`, `/questoes/simulado`, `/questoes/revisar` | `src/pages/Questoes*.tsx`, `src/hooks/useQuestoes*.ts` |
| Pendente | Aprender / aulas | `/aprender`, `/aprender/area/:slug`, `/aprender/aula/:aulaId` | `src/pages/Aprender*.tsx`, `src/components/aprender/*` |
| Pendente | Flashcards | `/flashcards`, `/flashcards/estudar`, `/flashcards/revisar`, `/flashcards/decks` | `src/pages/Flashcards*.tsx` |
| Pendente | Videoaulas | `/videoaulas`, `/videoaulas/:catalogo/:area/:videoId` | `src/pages/Videoaulas*.tsx`, `src/components/videoaulas/*` |
| Pendente | Biblioteca | `/biblioteca`, `/bibliotecas/:colecaoId`, `/biblioteca-offline` | `src/pages/Bibliotecas*.tsx`, `src/components/biblioteca/*` |
| Pendente | Audioaulas | `/audioaulas`, `/audioaulas/:area` | `src/pages/Audioaulas.tsx`, `src/components/audioaulas/*` |

## Prioridade 2 - ferramentas e recursos de apoio

| Status | Bloco | Rotas principais | Arquivos principais |
| --- | --- | --- | --- |
| Pendente | Ferramentas | `/ferramentas` | `src/pages/Ferramentas.tsx` |
| Pendente | Me explique | `/me-explique`, `/ferramentas/me-explique` | `src/pages/MeExplique.tsx`, `src/components/meExplique/*` |
| Pendente | Dicionario juridico | `/ferramentas/dicionario` | `src/pages/DicionarioJuridicoPage.tsx`, `src/hooks/useDicionarioJuridico.ts` |
| Pendente | Peticao inicial | `/ferramentas/peticao-inicial`, `/ferramentas/peticao-inicial/:id` | `src/pages/PeticaoInicial*.tsx` |
| Pendente | Locais juridicos | `/ferramentas/locais` | `src/pages/LocaisJuridicos.tsx`, `src/components/locais/*` |
| Pendente | Jurisprudencia | `/jurisprudencia`, `/jurisprudencia/:slugLei/:numeroArtigo` | `src/pages/Jurisprudencia*.tsx` |
| Pendente | Sumulas / informativos / teses | `/jurisprudencia/sumulas-*`, `/jurisprudencia/informativos-*`, `/jurisprudencia/teses-*` | `src/pages/SumulasTribunal.tsx`, `src/pages/InformativosTribunal.tsx`, `src/pages/TesesTribunal.tsx` |
| Pendente | Tematica juridica | `/tematica-juridica` | `src/pages/TematicaJuridica.tsx` |
| Pendente | Radares legislativos | `/radares`, `/radar-360`, `/radar/*` | `src/pages/Radares.tsx`, `src/pages/Radar*.tsx` |
| Pendente | Grafo / visuais juridicos | `/grafo-artigos`, `/visuais/:formato/*` | `src/pages/GrafoArtigos.tsx`, `src/pages/VisualJuridico.tsx` |

## Prioridade 3 - conta, assinatura e vida do usuario

| Status | Bloco | Rotas principais | Arquivos principais |
| --- | --- | --- | --- |
| Pendente | Login / onboarding | `/auth`, `/onboarding`, `/reset-password` | `src/pages/Auth.tsx`, `src/pages/Onboarding.tsx`, `src/pages/ResetPassword.tsx` |
| Pendente | Perfil e configuracoes | `/perfil`, `/configuracoes`, `/ajustes/seguranca` | `src/pages/Perfil.tsx`, `src/pages/Configuracoes.tsx`, `src/pages/Seguranca.tsx` |
| Pendente | Assinatura / planos | `/assinatura`, `/planos/ativos` | `src/pages/Assinatura.tsx`, `src/pages/PlanosAtivos.tsx`, `src/components/planos/*` |
| Pendente | Meu espaco | `/meu-espaco`, `/pessoal/*` | `src/pages/MeuEspaco.tsx`, `src/pages/pessoal/*` |
| Pendente | Lembretes | `/lembretes`, `/lembretes/*` | `src/pages/CentralLembretes.tsx`, `src/pages/lembretes/*` |
| Pendente | Downloads / offline | `/meus-downloads`, `/modo-offline`, `/modo-offline/*` | `src/pages/ModoOffline*.tsx`, `src/services/offline*` |
| Pendente | Suporte e opiniao | `/suporte`, `/opiniao`, `/suporte-publico` | `src/pages/Suporte.tsx`, `src/pages/Opiniao.tsx`, `src/pages/SuportePublico.tsx` |

## Prioridade 4 - conteudo e operacao admin

| Status | Bloco | Rotas principais | Arquivos principais |
| --- | --- | --- | --- |
| Pendente | Admin aprender / questoes | `/admin-aprender`, `/admin-questoes` | `src/pages/AdminAprender*.tsx`, `src/pages/AdminQuestoes.tsx` |
| Pendente | Admin jurisprudencia / pesquisas | `/admin-jurisprudencia`, `/admin/pesquisas-prontas` | `src/pages/AdminJurisprudencia.tsx`, `src/pages/AdminPesquisasProntas.tsx` |
| Pendente | Admin biblioteca / leis | `/admin-biblioteca-*`, `/admin-buscador-leis` | `src/pages/AdminBiblioteca*.tsx`, `src/pages/AdminBuscadorLeis.tsx` |
| Pendente | Admin audio / narracao / boletins | `/admin-audioaulas`, `/admin-narracao*`, `/admin-boletins` | `src/pages/AdminAudioaulas.tsx`, `src/pages/AdminNarracao*.tsx`, `src/pages/AdminBoletins.tsx` |
| Pendente | Admin push / lembretes | `/admin-push`, `/admin-lembretes` | `src/pages/AdminPush*.tsx`, `src/pages/AdminLembretes*.tsx` |
| Pendente | Admin monitoramento | `/admin-monitor`, `/admin-monitoramento`, `/admin-monitor-apis`, `/admin-monitor-usuarios` | `src/pages/AdminMonitor*.tsx` |
| Pendente | Admin comercial / assinatura | `/admin-assinantes`, `/admin-funcoes-assinantes`, `/admin-concorrentes` | `src/pages/AdminAssinantes.tsx`, `src/pages/AdminFuncoesAssinantes.tsx`, `src/pages/AdminConcorrentes*.tsx` |
| Pendente | Admin lojas / desktop / build | `/admin-lojas`, `/admin-desktop`, `/admin-transferencia-app` | `src/pages/AdminPassoAPassoLojas.tsx`, `src/pages/AdminDesktop.tsx`, `src/pages/AdminTransferenciaApp.tsx` |

## Bloco atual

Bloco em andamento: Resumos juridicos.

Primeiro checklist:

- [ ] Revisar `ResumosJuridicosAreas.tsx` no preview.
- [ ] Revisar `ResumosJuridicosTemas.tsx` no preview.
- [ ] Conferir se a migration Supabase proposta e realmente necessaria.
- [ ] Rodar `tsc --noEmit`.
- [ ] Corrigir bugs de layout/performance.
- [ ] Validar desktop e mobile.
