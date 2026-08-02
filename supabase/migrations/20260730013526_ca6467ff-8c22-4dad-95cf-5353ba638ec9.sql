ALTER TABLE public.aprender_blocos DROP CONSTRAINT IF EXISTS aprender_blocos_tipo_check;
ALTER TABLE public.aprender_blocos ADD CONSTRAINT aprender_blocos_tipo_check CHECK (tipo = ANY (ARRAY[
  'leitura','pergunta','flashcard','conexao','citacao','artigo_lei','tabela',
  'mapa_mental','mapa_conceitual','infografico','linha_tempo','destaque',
  'fluxograma','ordenacao','cena_animada','checkpoint','recapitulacao'
]));