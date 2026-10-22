# Trocar as audioaulas e narrações antigas pelos áudios do R2

## O que encontrei
- **Audioaulas atuais (as antigas):** são 542 aulas com o áudio vindo do **Dropbox** e a capa do Imgur. É isso que aparece hoje na tela de Audioaulas.
- **Narrações dos artigos:** hoje vêm de uma lista no Supabase que aponta para arquivos espalhados entre o Supabase e outros lugares.
- **No seu R2 (pasta `vacatio-midias`), os áudios novos estão assim:**
  - `narracoes/direito-penal/07. Princípios Penais/01. Princípios Penais - Introdução ao Tema.mp3`, ou seja, **área > tema > aula numerada**. As áreas são cerca de 20: Penal, Constitucional, Trabalho, Administrativo, Empresarial, Previdenciário, Direitos Humanos, Filosofia, Português e outras. **Estas são as audioaulas novas.**
  - `narracoes/codigos/cc/Art. 0001.mp3` e pastas parecidas em constituição, estatutos e leis especiais: **a narração de cada artigo**, organizada por lei.
  - As pastas `audioaulas/...` do R2 estão **vazias**, só com a estrutura criada. Por isso vou usar a pasta `narracoes/`.

## O que vou fazer
1. **Apagar as 542 audioaulas antigas** do Dropbox. Antes de apagar, guardo uma cópia de segurança da lista.
2. **Montar o catálogo novo a partir do R2:** cada pasta de área vira uma área, cada subpasta vira um tema, e cada arquivo vira uma aula, com o número e o título tirados do nome do arquivo. O áudio toca direto do R2.
3. **Narração dos artigos:** ligar cada lei do app à pasta dela no R2 (por exemplo, Código Civil para `codigos/cc`) e cada artigo ao seu arquivo (`Art. 0001.mp3`). O botão de ouvir artigo passa a tocar do R2.
4. **Parar de usar o Dropbox e o armazenamento de áudio do Supabase:** troco no app todos os pontos que buscavam áudio nesses lugares para usar o R2.
5. **Botão "Sincronizar com o R2" no painel admin:** quando você colocar áudios novos no R2, um clique atualiza o catálogo, sem mexer em código.
6. **Conferir no fim:** abrir Audioaulas, tocar uma aula de cada área, abrir um artigo do Código Civil e tocar a narração.

## Importante: segurança das chaves do R2
As chaves do R2 estão **escritas dentro do código do repositório**, e qualquer pessoa com acesso ao código consegue ler. Neste projeto elas ainda não estão salvas como segredo. Vou:
- tirar as chaves do código e pedir que você as salve no formulário seguro deste projeto;
- recomendar que você **gere chaves novas no Cloudflare** e desative as antigas, porque as atuais já ficaram expostas.

## Detalhes técnicos
- Banco: backup em `audioaulas_acervo_backup` e depois `DELETE` das linhas atuais. O novo preenchimento usa as mesmas colunas (`area`, `tema`, `sequencia`, `titulo`, `url_audio`) com `url_audio` apontando para a URL pública do R2 (`pub-0c1a...r2.dev`). Os nomes de arquivo com espaço e acento são codificados na URL.
- Sincronização: server function com o admin verificado por `has_role`, que lista o bucket pela API S3 do R2 (assinatura SigV4 via `fetch`, compatível com o Worker) e faz upsert por caminho do arquivo. Para isso, vou criar uma coluna `r2_key` única.
- Narrações: upsert em `narracoes_artigos` (`tabela_nome`, `artigo_numero`, `audio_url`) a partir de `narracoes/{codigos,constituicao,estatutos,leis-especiais,lei-penal-especial}/<slug>/Art. NNNN.mp3`. A tabela de-para entre slug e `tabela_nome` fica num arquivo único do app. Slugs sem lei correspondente aparecem no relatório.
- Código: remover as leituras dos buckets `audios` e `aulas-audio` e as URLs do Dropbox, centralizando em `storageBuckets.ts`.
- Segredos: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` no formulário seguro. Remover os valores fixos do código.
