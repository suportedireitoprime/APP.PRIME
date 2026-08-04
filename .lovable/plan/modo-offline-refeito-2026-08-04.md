# Modo Offline refeito

## 1. Topo colado (sem painel vermelho estranho)

O painel vermelho arredondado com margens sai. No lugar entra um cabeçalho full-bleed:

- Colado no topo, sem margens laterais, sem borda/arredondamento superior (só as pontas de baixo arredondadas).
- Botão de voltar (48px) dentro do próprio painel — a `PageHeader` separada deixa de existir nessa tela.
- Título "Estude mesmo sem internet" e texto de apoio em branco, com ícone de nuvem/download em branco.
- Só desktop mantém o layout de página atual.

## 2. Ícones sem fundo

Nos cards de categoria e nas seções, remover os quadradinhos coloridos de fundo — fica apenas o ícone colorido, maior (26-28px).

## 3. Armazenamento removido

O bloco "Armazenamento" com barra de quota sai por completo. O tamanho ocupado passa a aparecer discretamente dentro de cada categoria ("3 itens · 42 MB") e a limpeza de arquivos fica dentro de cada subpágina.

## 4. Mais categorias de download

A lista de categorias passa a cobrir tudo que dá para usar offline:

| Categoria | O que baixa | Estado mostrado |
|---|---|---|
| Leis e artigos | Texto das leis (já offline) + narrações em áudio | nº de leis · nº de áudios baixados |
| Audioaulas | Áudio de cada aula, por área | nº baixadas · MB |
| Leis cantadas | Faixas de áudio | nº baixadas · MB |
| Apresentações narradas | Áudio + imagens dos slides | nº baixadas · MB |
| Livros e PDFs | Biblioteca | nº baixados · MB |
| Resumos e mapas mentais | PDFs gerados/salvos | nº baixados |
| Anotações e grifos | Já ficam no aparelho | "sempre disponível" |

Cada categoria abre uma subpágina de seleção com botão "Baixar tudo" (com aviso de tamanho estimado antes de começar) e "Remover todos". Audioaulas, leis cantadas e apresentações usam o serviço nativo de áudio offline que já existe (`audioOffline`), então tocam no player nativo sem internet depois de baixadas — nada vem embutido no app, o download é sempre escolha do usuário.

## 5. Como a pessoa sabe o que já está disponível offline

Padrão único de sinalização, para não haver dúvida:

- Selo verde "Disponível offline" quando o item já está no aparelho; contorno cinza "Baixar" quando não está.
- Barra de progresso no próprio item enquanto baixa, com opção de cancelar.
- Nas telas de origem (Audioaulas, Leis cantadas, Apresentações, Biblioteca) o mesmo selo aparece no card do item.
- Quando o app está sem internet, itens não baixados ficam esmaecidos com etiqueta "precisa de internet", e um aviso fixo no topo do Modo Offline indica "Você está offline — mostrando só o que está baixado".

## 6. Três blocos de "o que funciona"

Substituem o único bloco vermelho atual; todos recolhíveis:

1. **Verde — "Funciona sem internet"**: leis e artigos, anotações e grifos, favoritos, o que já foi baixado, questões já carregadas.
2. **Amarelo — "Funciona offline depois de baixar"**: audioaulas, leis cantadas, narrações, apresentações, livros e PDFs, resumos em PDF.
3. **Vermelho — "Não funciona sem internet"**: IA jurídica, videoaulas do YouTube, radar legislativo, notícias e boletins, jurisprudência nova, conta e assinatura, gerar novas narrações.

## Detalhes técnicos

- `src/lib/offlineFeatures.ts`: além de `RECURSOS_ONLINE`, adicionar `RECURSOS_OFFLINE_SEMPRE` e `RECURSOS_OFFLINE_APOS_DOWNLOAD`; o componente de bloco recolhível vira reutilizável (`BlocoRecursos`) com variantes verde/amarelo/vermelho.
- `src/pages/ModoOffline.tsx`: reescrito — cabeçalho full-bleed próprio (sem `PageHeader`/`HorusSectionHero`), grade de categorias sem fundo de ícone, remoção do bloco de armazenamento, três blocos de recursos.
- Novas subpáginas `src/pages/ModoOfflineAudioaulas.tsx`, `ModoOfflineLeisCantadas.tsx`, `ModoOfflineApresentacoes.tsx` (rotas em `App.tsx`), reusando `baixarAudioOffline`/`removerAudioOffline`/`listarAudiosOffline`.
- Novo componente compartilhado `src/components/offline/ItemDownloadRow.tsx` (selo, progresso, baixar/remover) usado nas subpáginas e nos cards de Audioaulas/Leis cantadas.
- Novo hook `src/hooks/useDownloadsOffline.ts` agregando contagem/bytes por categoria (áudios via índice nativo, PDFs via `bibliotecaPdfCache`, narrações via Dexie) para alimentar os metadados dos cards.
- Nada de nova tabela no banco: todo o estado de download é local no aparelho.
