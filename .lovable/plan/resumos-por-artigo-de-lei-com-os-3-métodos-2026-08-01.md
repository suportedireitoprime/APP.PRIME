# Resumos por artigo de lei (com os 3 métodos)

Hoje, na aba **Leis** dos Resumos Jurídicos, tocar numa lei leva o usuário para o Vade Mecum. Vamos transformar esse caminho em um fluxo de resumos: lei → lista de artigos → resumo gerado por IA nos três métodos (Conceitos, Cornell e Feynman).

## Fluxo desejado

```text
Leis  →  Direito Penal  →  Código Penal  →  Art. 1º  →  Leitor de resumo
                                                        [Conceitos | Cornell | Feynman]
```

1. Tocar numa área (ex.: Direito Penal) abre o painel de leis (já existe).
2. Tocar numa lei (ex.: Código Penal) passa a abrir um painel de 90% com **todos os artigos** daquela lei, com busca e rolagem.
3. Tocar num artigo abre o leitor de resumos já existente.
   - Se já existe resumo salvo para aquele artigo, abre instantâneo.
   - Se não existe, mostra estado "gerando resumo…" e a IA gera o resumo de **Conceitos** a partir do texto oficial do artigo.
   - Em seguida Cornell e Feynman são gerados (em segundo plano) e ficam salvos em cache, então na próxima vez tudo abre na hora.
4. Favoritar, copiar, enviar e baixar PDF continuam funcionando igual aos demais resumos.

## Detalhes técnicos

**Banco**
- Migration adicionando `tabela_codigo text` e `numero_artigo text` em `public.resumos_juridicos`, com índice único parcial em (`tabela_codigo`, `numero_artigo`) para evitar duplicidade e permitir o lookup de cache. Leitura pública já existente é mantida.

**Edge function nova: `gerar-resumo-artigo`**
- Entrada validada: `tabela_codigo` (validado contra a allowlist `_shared/leis-tabelas.ts`), `numero_artigo`, `area`, `lei_nome`.
- Se já houver linha em `resumos_juridicos` para o par (tabela, artigo), retorna do cache.
- Caso contrário: lê o texto do artigo (caput, incisos, parágrafos) da tabela da lei — mesma estratégia de casamento de número usada em `gerar-resumo` — e chama o Lovable AI Gateway (`google/gemini-3.6-flash`) pedindo JSON com `markdown`, `exemplos` e `termos`.
- Salva em `resumos_juridicos` (area = área jurídica, tema = nome da lei, subtema = `Art. X`) e devolve a linha completa.
- Trata 429 e 402 do gateway com mensagem clara no app.

**Metodologias**
- Reaproveita a função `gerar-metodologia` já existente (Cornell/Feynman com cache em `resumo_metodologias`) — nenhuma mudança no leitor além de disparar as duas gerações logo após o resumo de Conceitos ficar pronto.

**Frontend**
- `src/lib/leiArtigos.ts` (novo): busca paginada dos artigos de uma tabela de lei (número, rótulo, prévia do caput).
- `src/components/resumos-juridicos/LeiArtigosSheet.tsx` (novo): painel 90% no mesmo padrão do Vade Mecum (alça, cabeçalho com ícone/nome da lei, busca com microfone, lista de artigos em cartões).
- `src/pages/resumos-juridicos/ResumosJuridicosAreas.tsx`: no clique da lei, abrir esse painel em vez de `navigate(leiPath(lei))`.
- `src/components/resumos-juridicos/ResumoJuridicoReaderSheet.tsx`: aceitar abrir em modo "gerando", exibindo skeleton/loader enquanto o resumo do artigo é criado, e pré-disparar Cornell e Feynman.
