# Resumos com 3 métodos: Conceitos, Cornell e Feynman

Hoje o leitor de resumo tem só um tipo de conteúdo (Resumo/Exemplos/Termos). A ideia é ter um menu de alternância no topo com três métodos, abrindo sempre em **Conceitos** (o que já existe), e mais **Cornell** e **Feynman**, no mesmo estilo do projeto vinculado.

## Como vai funcionar

- No leitor do resumo (painel que abre de baixo pra cima), primeiro seletor: **Conceitos | Cornell | Feynman**.
- **Conceitos** continua igual, com as sub-abas atuais (Resumo, Exemplos, Termos).
- **Cornell**: quadro em duas colunas — Palavras-chave / Perguntas de revisão à esquerda, Anotações à direita, e uma faixa de Resumo-síntese embaixo.
- **Feynman**: 4 passos numerados — Conceito, Explicação Simples, Lacunas, Analogias (+ revisão final quando houver).
- Visual seguindo o vermelho oficial do app (o mesmo já usado no leitor), não a cor dourada do projeto de origem.
- Se o método ainda não existe para aquele subtema, aparece um botão "Gerar com IA"; depois de gerado fica salvo e abre instantâneo para todos.
- Os botões atuais (favoritar, copiar, enviar por WhatsApp, PDF) passam a respeitar o método ativo: copiar/enviar/PDF exportam o conteúdo do método que está na tela.

## Detalhes técnicos

- Nova tabela `resumo_metodologias` (id, resumo_id → `resumos_juridicos`, metodo `cornell|feynman`, conteudo jsonb, timestamps), com GRANTs, RLS de leitura pública e escrita só via service role; índice único (resumo_id, metodo).
- Nova edge function `gerar-metodologia`: recebe resumo_id + metodo, usa o Lovable AI Gateway (google/gemini-3-flash-preview) com JSON estruturado no mesmo formato do projeto vinculado (Cornell: palavras_chave, perguntas, anotacoes, resumo_geral; Feynman: conceito, explicacao_simples, lacunas, analogias, revisao_final) e grava na tabela.
- Novos componentes `src/components/resumos-juridicos/CornellView.tsx` e `FeynmanView.tsx` (adaptados dos `Metodologia*View` do projeto vinculado, sem o wrapper próprio deles, já que o leitor atual tem a barra de ações).
- `ResumoJuridicoReaderSheet.tsx`: estado `metodo` ('conceitos' por padrão), seletor de largura total, busca das metodologias por resumo, estado de geração, e as ações reaproveitando o texto do método ativo.
- `resumoPdf.ts` ganha suporte a exportar Cornell/Feynman em PDF ABNT (capa + seções), reutilizando a estrutura existente.
- Os conteúdos não podem ser copiados do banco do outro projeto (bancos separados), então são gerados por IA sob demanda e ficam em cache no nosso banco.
