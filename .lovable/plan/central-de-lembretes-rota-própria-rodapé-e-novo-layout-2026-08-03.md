# Central de Lembretes — rota própria, rodapé e novo layout

Hoje já existe `/lembretes` (Central), mas ela é só uma lista agregada, sem navegação própria, sem rodapé e sem como criar um lembrete livre ("estudar tal coisa às 20h"). Também não existe lembrete de videoaulas nem de resumos.

## O que será feito

### 1. Rotas próprias de Lembretes
Um bloco de rotas dedicado, com a Central como raiz:

```text
/lembretes                -> Central (visão geral: tudo que está ativo)
/lembretes/leitura        -> lembretes de leitura (livros/biblioteca)
/lembretes/videoaulas     -> lembretes de videoaulas
/lembretes/resumos        -> lembretes de resumos
/lembretes/questoes       -> lembretes de questões para praticar
/lembretes/meus           -> lembretes livres ("lembrar de...", com data/hora)
/lembretes/local          -> por geolocalização (já existe)
/lembretes/preferencias   -> canais, horários e permissões (já existe)
```
As telas antigas (`/meus-lembretes`, `/questoes/lembretes`, `/lei-seca/lembretes`, `/central-lembretes`) continuam funcionando e redirecionam para as novas rotas, para não quebrar links, notificações e deep links.

### 2. Menu de rodapé (igual ao dos Resumos)
Novo `LembretesBottomNav` no mesmo padrão visual do rodapé dos Resumos (pílula ativa, ícones grandes, safe-area), com 5 abas:

`Tudo` · `Leitura` · `Videoaulas` · `Questões` · `Meus`

Presente em todas as telas de Lembretes, ocultando-se quando um sheet estiver aberto.

### 3. Layout novo da Central
- Cabeçalho com contador em destaque (ativos / total) e atalho para preferências.
- Faixa de resumo com "Próximo lembrete" (o mais próximo do horário atual) em cartão destacado.
- Chips de filtro (Todos / Ativos / Inativos) em linha rolável, mais compactos que os três botões atuais.
- Cartões agrupados por função com ícone colorido, horário legível em pílula, dias da semana e switch para ativar/desativar direto na lista (sem precisar entrar na função).
- Estado vazio com sugestões de cada tipo de lembrete.
- Botão flutuante `+` abre um sheet de criação: escolher o tipo (leitura, videoaulas, resumos, questões, local, livre) e ir direto ao formulário.

### 4. Lembretes livres, de videoaulas e de resumos
- **Livres**: título, descrição opcional, data/hora e recorrência (única, diária, semanal, mensal) — reaproveitando os avisos pessoais já existentes, agora dentro da Central.
- **Videoaulas e resumos**: novo tipo de lembrete recorrente (horário + dias da semana), podendo apontar para uma área/tema específico ou ser genérico ("assistir videoaula hoje").
- Todos entram na Central e nas notificações locais/push já usadas pelo app.

## Detalhes técnicos
- Nova tabela `lembretes_conteudo` no Cloud (tipo: `videoaulas` | `resumos` | `geral`, título, referência opcional, horário, dias da semana, ativo), com RLS por `auth.uid()` e grants para `authenticated`/`service_role`.
- Lembretes livres usam a tabela `avisos` já existente (data/hora + recorrência), passando a ser exibidos e criados pela Central.
- Novo hook `useLembretes` centraliza a leitura de `user_reminders`, `location_reminders`, `reading_reminders`, `questoes_lembretes`, `lei_seca_lembretes`, `avisos` e `lembretes_conteudo`, normalizando tudo no mesmo formato de item e permitindo toggle de ativo por tipo.
- `CentralLembretes.tsx` refatorado; novos componentes em `src/components/lembretes/` (`LembretesBottomNav`, `LembreteCard`, `NovoLembreteSheet`, `ProximoLembreteCard`).
- Agendamento das notificações locais reaproveita o serviço nativo já existente; os novos tipos entram no mesmo tick de disparo.
- Cores, tipografia e tokens semânticos do app (bordô), sem cores fixas.
