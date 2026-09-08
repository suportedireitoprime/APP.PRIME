-- Migration: Sync 45 Modulos and Aulas de Direito Penal no Aprender

-- 1. Inserir ou atualizar os 45 modulos de Direito Penal
INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('97111d58-8679-4ea4-8542-2243480c194b', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Contra a Família', 'crimes-contra-a-familia', 1, 'Trilha completa e aulas interativas de Crimes Contra a Família')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('1b65fd90-ab8f-4b67-83c0-50f038d6c63e', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Criminologia', 'criminologia', 2, 'Trilha completa e aulas interativas de Criminologia')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('fa9689df-e317-4c53-870a-69a461ae0139', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Teoria do Crime: Fato Típico', 'teoria-do-crime-fato-tipico', 3, 'Conceito analítico de crime, conduta, nexo causal, resultado e tipicidade formal e material.')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('ead16259-2f63-4c8c-9cd3-5b0288db36d6', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Direito Penal do Inimigo', 'direito-penal-do-inimigo', 3, 'Trilha completa e aulas interativas de Direito Penal do Inimigo')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('501bd81d-def9-4cee-beab-b4f7104302ff', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Ilicitude e Culpabilidade', 'ilicitude-e-culpabilidade', 4, 'Estudo completo das causas excludentes de ilicitude (art. 23 do CP) e dos elementos constitutivos da culpabilidade.')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('3f1e602b-a4b9-49a2-8351-15ccae7643fd', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crítica ao Direito Penal do Inimigo', 'critica-ao-direito-penal-do-inimigo', 4, 'Trilha completa e aulas interativas de Crítica ao Direito Penal do Inimigo')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('e27658ba-6458-4c58-97e4-5f4e1136e39c', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Escolas Penais', 'escolas-penais', 5, 'Trilha completa e aulas interativas de Escolas Penais')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('a7b5a762-8e9f-4f77-a536-608a824224d0', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Noções gerais de direito penal', 'livro-19d5f734', 6, 'Trilha completa e aulas interativas de Noções Gerais de Direito Penal')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('0feaae77-b8ed-463e-bfbe-fc487ffabde5', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Princípios penais', 'livro-12993f29', 7, 'Trilha completa e aulas interativas de Princípios Penais')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('f3d09966-ac1c-487a-876c-f6feb12fde38', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Interpretação e Integração da Lei Penal', 'interpretacao-e-integracao-da-lei-penal', 8, 'Trilha completa e aulas interativas de Interpretação e Integração da Lei Penal')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('344a0149-6b02-417e-a985-184c37cf87ec', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Lei penal no espaço e no tempo', 'livro-ad64b231', 9, 'Trilha completa e aulas interativas de Lei Penal no Espaço e no Tempo')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('02a97ce2-b32c-4e84-b546-d74a9c495ae1', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Teoria Geral do Delito', 'teoria-geral-do-delito', 10, 'Trilha completa e aulas interativas de Teoria Geral do Delito')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('f230122c-0ad8-4e67-9909-b6c01960c4e4', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Iter Criminis', 'iter-criminis', 11, 'Trilha completa e aulas interativas de Iter Criminis')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('c3711de4-ae95-449b-b835-dbf9ce819ab1', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Princípio da Insignificância', 'principio-da-insignificancia', 12, 'Trilha completa e aulas interativas de Princípio da Insignificância')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('6cb09d9d-6b6f-41b0-93c0-83449dcd9825', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Teoria do Erro', 'teoria-do-erro', 13, 'Trilha completa e aulas interativas de Teoria do Erro')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('35c55234-1c06-4754-bd03-28503bab1ae2', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Imputabilidade e Concurso de Pessoas', 'imputabilidade-e-concurso-de-pessoas', 15, 'Trilha completa e aulas interativas de Imputabilidade e Concurso de Pessoas')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('ddad8b6e-7935-4b0b-be1e-ea3fdad6c430', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Concurso de Pessoas e Autoria Imediata', 'concurso-de-pessoas-e-autoria-imediata', 16, 'Trilha completa e aulas interativas de Concurso de Pessoas e Autoria Imediata')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('f6477c3f-ab3c-480f-8a35-05548f7623c5', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Teoria da Pena', 'teoria-da-pena', 17, 'Trilha completa e aulas interativas de Teoria da Pena')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('b9f2a190-0f8e-496d-a652-537714618b05', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Funções da Pena', 'funcoes-da-pena', 18, 'Trilha completa e aulas interativas de Funções da Pena')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('5d16e351-8dc5-4ff2-ad51-af76a2e21e8f', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Concurso de Crimes', 'concurso-de-crimes', 19, 'Trilha completa e aulas interativas de Concurso de Crimes')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('e303a937-8081-4721-9a08-4085ff8578df', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Dosimetria da Pena', 'dosimetria-da-pena', 20, 'Trilha completa e aulas interativas de Dosimetria da Pena')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('e75a4ec8-efa7-490e-ad8f-5ca48a41949f', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Suspensão Condicional da Pena e Livramento Condicional', 'suspensao-condicional-da-pena-e-livramento-condicional', 21, 'Trilha completa e aulas interativas de Suspensão Condicional da Pena e Livramento Condicional')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('3d940085-dd05-48e1-9aa0-a6f87dfef1bd', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Efeitos da Condenação e Reabilitação', 'efeitos-da-condenacao-e-reabilitacao', 22, 'Trilha completa e aulas interativas de Efeitos da Condenação e Reabilitação')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('512e4d36-3437-4e6f-a137-a76e4cf63a3a', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Medidas de Segurança', 'medidas-de-seguranca', 23, 'Trilha completa e aulas interativas de Medidas de Segurança')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('cc871b48-d0ad-4141-91bb-f69db3eac19d', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Extinção da Punibilidade e Prescrição', 'extincao-da-punibilidade-e-prescricao', 24, 'Trilha completa e aulas interativas de Extinção da Punibilidade e Prescrição')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('59d5c2aa-1991-4f7f-ae0e-7c5a6780fe5a', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Prescrição penal', 'livro-c4b859ca', 25, 'Trilha completa e aulas interativas de Prescrição Penal')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('b7c02e12-1516-4fa2-a3e2-e4d8880fa522', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Contra a Pessoa', 'crimes-contra-a-pessoa', 26, 'Trilha completa e aulas interativas de Crimes Contra a Pessoa')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('910d157c-130c-4a0f-857c-1c44af570a79', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Contra a Vida', 'crimes-contra-a-vida', 27, 'Trilha completa e aulas interativas de Crimes Contra a Vida')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('487e58dc-773e-4ae6-a4fd-e3b23f88dcbc', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Contra a Honra', 'crimes-contra-a-honra', 28, 'Trilha completa e aulas interativas de Crimes Contra a Honra')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('aeff9482-0cfa-4281-8c72-ac566267c290', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Contra o Patrimônio', 'crimes-contra-o-patrimonio', 29, 'Trilha completa e aulas interativas de Crimes contra o Patrimônio')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('c565ff20-aaaf-4e16-aeea-a3008ef98e4b', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes contra a Dignidade Sexual', 'crimes-contra-a-dignidade-sexual', 30, 'Trilha completa e aulas interativas de Crimes contra a Dignidade Sexual')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('9fd9a6d8-1afd-44f1-b603-c291b2ebae93', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Direito Penal Sexual - Teoria Geral e Reflexos Típicos', 'direito-penal-sexual-teoria-geral-e-reflexos-tipicos', 31, 'Trilha completa e aulas interativas de Direito Penal Sexual - Teoria Geral e Reflexos Típicos')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('cafb4fa0-dcac-4416-91ce-452c942c3b71', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Contra a Organização do Trabalho', 'crimes-contra-a-organizacao-do-trabalho', 32, 'Trilha completa e aulas interativas de Crimes Contra a Organização do Trabalho')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('629652e6-aba3-4738-b78d-bea7efb33e47', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Contra a Propriedade Imaterial', 'crimes-contra-a-propriedade-imaterial', 33, 'Trilha completa e aulas interativas de Crimes Contra a Propriedade Imaterial')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('5c4a8eb5-bc84-4f29-a374-548d6319ddd6', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes praticados por Funcionário Público contra a Administração', 'crimes-praticados-por-funcionario-publico-contra-a-administracao', 34, 'Trilha completa e aulas interativas de Crimes praticados por Funcionário Público contra a Administração')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('42889d38-b28b-470b-8641-94870be5821a', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Praticados por Particular Contra a Administração em Geral e Estrangeira', 'crimes-praticados-por-particular-contra-a-administracao-em-geral-e-estrangeira', 35, 'Trilha completa e aulas interativas de Crimes Praticados por Particular Contra a Administração em Geral e Estrangeira')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('49be78d6-a154-47a3-9753-278e7538d47d', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Contra o Sentimento Religioso', 'crimes-contra-o-sentimento-religioso', 36, 'Trilha completa e aulas interativas de Crimes Contra o Sentimento Religioso')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('52c7acfa-4ff2-4b3c-a0b6-dfb6a2d320e4', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Praticados em Licitações e Contratos Administrativos', 'crimes-praticados-em-licitacoes-e-contratos-administrativos', 37, 'Trilha completa e aulas interativas de Crimes Praticados em Licitações e Contratos Administrativos')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('5ff9f542-6914-4c03-b4fe-2efd4bde59ed', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Contra a Fé Pública', 'crimes-contra-a-fe-publica', 38, 'Trilha completa e aulas interativas de Crimes Contra a Fé Pública')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('b13caaf4-d46f-4fb7-ad0f-e3d5e976db97', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Crimes Contra a Administração da Justiça', 'crimes-contra-a-administracao-da-justica', 39, 'Trilha completa e aulas interativas de Crimes Contra a Administração da Justiça')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('d4d768f3-0b7b-48c5-aef3-b08753e5c4ab', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Lei de Drogas', 'lei-de-drogas', 40, 'Trilha completa e aulas interativas de Lei de Drogas')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('98bd1910-bd08-4f44-923a-3495afe06e33', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Estatuto do Desarmamento', 'estatuto-do-desarmamento', 41, 'Trilha completa e aulas interativas de Estatuto do Desarmamento')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('285b888f-fd5f-4923-a255-5d21dc1a4bbf', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Legislação Penal Extravagante', 'legislacao-penal-extravagante', 42, 'Trilha completa e aulas interativas de Legislação Penal Extravagante')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('b67efd02-980d-468e-a714-7898da88f383', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Responsabilidade Penal da Pessoa Jurídica', 'responsabilidade-penal-da-pessoa-juridica', 43, 'Trilha completa e aulas interativas de Responsabilidade Penal da Pessoa Jurídica')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('89374b8e-60f2-48e2-b1e1-99184f4927c9', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Classificação e espécie das infrações penais', 'classificacao-e-especie-das-infracoes-penais', 44, 'Trilha completa e aulas interativas de Classificação e espécie das infrações penais')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

INSERT INTO public.aprender_modulos (id, area_id, titulo, slug, ordem, resumo)
VALUES ('84536719-e760-476e-846d-a632ae7b9387', '892fe81f-e205-4cbd-b931-20582a8658c1', 'Preâmbulo Constitucional e Princípios Fundamentais', 'preambulo-constitucional-e-principios-fundamentais', 51, 'Trilha completa e aulas interativas de Preâmbulo Constitucional e Princípios Fundamentais')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, slug = EXCLUDED.slug, ordem = EXCLUDED.ordem, resumo = EXCLUDED.resumo;

-- 2. Inserir aulas publicadas dos modulos
INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('c62a0cac-1087-4c33-a8f1-f136291acdb6', '59d5c2aa-1991-4f7f-ae0e-7c5a6780fe5a', 'livro-c4b859ca-1-2cc6c5', 'Introdução à Prescrição Penal', 'Compreender a natureza, os fundamentos e as espécies da prescrição como limite ao poder punitivo estatal.', 35, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('3ea89fd2-8545-459d-9691-b918aa5a40d9', 'a7b5a762-8e9f-4f77-a536-608a824224d0', 'livro-19d5f734-1-e4a4f5', 'Direito Penal: Conceitos Fundamentais e Funções', 'Compreender a natureza, a função protetiva e a estrutura do Direito Penal como sistema de controle social.', 35, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('6bedc897-3ae3-423d-9637-65cb0a0fe0ea', '97111d58-8679-4ea4-8542-2243480c194b', 'crimes-contra-a-familia-fundamentos', 'Fundamentos de Crimes Contra a Família', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Contra a Família.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('edd353df-ac20-4a27-a4ff-a40f9d976443', '1b65fd90-ab8f-4b67-83c0-50f038d6c63e', 'criminologia-fundamentos', 'Fundamentos de Criminologia', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Criminologia.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('5acfe29c-58bb-40c9-a070-b4422161592e', '3f1e602b-a4b9-49a2-8351-15ccae7643fd', 'critica-ao-direito-penal-do-inimigo-fundamentos', 'Fundamentos de Crítica ao Direito Penal do Inimigo', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crítica ao Direito Penal do Inimigo.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('4ea27adf-9343-43d1-9383-9f141983a50f', 'f230122c-0ad8-4e67-9909-b6c01960c4e4', 'iter-criminis-fundamentos', 'Fundamentos de Iter Criminis', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Iter Criminis.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('ea9d92d5-9ce9-4c9d-9544-2613348d8cd9', 'c3711de4-ae95-449b-b835-dbf9ce819ab1', 'principio-da-insignificancia-fundamentos', 'Fundamentos de Princípio da Insignificância', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Princípio da Insignificância.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('548d7ed4-d4e4-43c3-8392-2244553df7f4', '6cb09d9d-6b6f-41b0-93c0-83449dcd9825', 'teoria-do-erro-fundamentos', 'Fundamentos de Teoria do Erro', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Teoria do Erro.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('4dfef20b-d672-4bf4-b09f-60da62546989', '49be78d6-a154-47a3-9753-278e7538d47d', 'crimes-contra-o-sentimento-religioso-fundamentos', 'Fundamentos de Crimes Contra o Sentimento Religioso', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Contra o Sentimento Religioso.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('a22264c0-5773-40b0-8ede-df3fd89ed57b', '52c7acfa-4ff2-4b3c-a0b6-dfb6a2d320e4', 'crimes-praticados-em-licitacoes-e-contratos-administrativos-fundamentos', 'Fundamentos de Crimes Praticados em Licitações e Contratos Administrativos', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Praticados em Licitações e Contratos Administrativos.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('cf79399a-8d31-4811-a584-6d940093b0f1', '5ff9f542-6914-4c03-b4fe-2efd4bde59ed', 'crimes-contra-a-fe-publica-fundamentos', 'Fundamentos de Crimes Contra a Fé Pública', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Contra a Fé Pública.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('94d42d94-2920-4985-a328-d75f71affba2', 'b13caaf4-d46f-4fb7-ad0f-e3d5e976db97', 'crimes-contra-a-administracao-da-justica-fundamentos', 'Fundamentos de Crimes Contra a Administração da Justiça', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Contra a Administração da Justiça.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('e46d9fc2-56ec-4fe5-b13c-89019cfa1450', 'ead16259-2f63-4c8c-9cd3-5b0288db36d6', 'direito-penal-do-inimigo-fundamentos', 'Fundamentos de Direito Penal do Inimigo', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Direito Penal do Inimigo.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('d52a9e56-208e-4665-a3ca-c1df0909e4f9', 'e27658ba-6458-4c58-97e4-5f4e1136e39c', 'escolas-penais-fundamentos', 'Fundamentos de Escolas Penais', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Escolas Penais.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('2944614a-cc66-4c8a-b4b6-ad37460efb3f', '0feaae77-b8ed-463e-bfbe-fc487ffabde5', 'livro-12993f29-fundamentos', 'Fundamentos de Princípios penais', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Princípios penais.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('453f1a5c-6285-45d8-b0e6-6eddb9f1cb7a', 'f3d09966-ac1c-487a-876c-f6feb12fde38', 'interpretacao-e-integracao-da-lei-penal-fundamentos', 'Fundamentos de Interpretação e Integração da Lei Penal', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Interpretação e Integração da Lei Penal.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('edfcfe82-e7de-4395-abaa-8ff7d274f7f0', '344a0149-6b02-417e-a985-184c37cf87ec', 'livro-ad64b231-fundamentos', 'Fundamentos de Lei penal no espaço e no tempo', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Lei penal no espaço e no tempo.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('6326c6a3-0710-4ae0-ae96-ac43e93e7886', '02a97ce2-b32c-4e84-b546-d74a9c495ae1', 'teoria-geral-do-delito-fundamentos', 'Fundamentos de Teoria Geral do Delito', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Teoria Geral do Delito.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('ef419462-ed34-4b30-8103-a09d033d8fc3', '35c55234-1c06-4754-bd03-28503bab1ae2', 'imputabilidade-e-concurso-de-pessoas-fundamentos', 'Fundamentos de Imputabilidade e Concurso de Pessoas', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Imputabilidade e Concurso de Pessoas.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('32812bfc-593b-4d15-a6f5-490b2761d56e', 'ddad8b6e-7935-4b0b-be1e-ea3fdad6c430', 'concurso-de-pessoas-e-autoria-imediata-fundamentos', 'Fundamentos de Concurso de Pessoas e Autoria Imediata', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Concurso de Pessoas e Autoria Imediata.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('5a44b13a-51b1-4ffe-93fe-f20f6a30d3a1', 'f6477c3f-ab3c-480f-8a35-05548f7623c5', 'teoria-da-pena-fundamentos', 'Fundamentos de Teoria da Pena', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Teoria da Pena.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('95d9f409-fb0c-4a77-9b34-810dd5ff1f80', 'b9f2a190-0f8e-496d-a652-537714618b05', 'funcoes-da-pena-fundamentos', 'Fundamentos de Funções da Pena', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Funções da Pena.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('60723daf-37e2-43c4-a42e-bd8baa51b9b3', '5d16e351-8dc5-4ff2-ad51-af76a2e21e8f', 'concurso-de-crimes-fundamentos', 'Fundamentos de Concurso de Crimes', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Concurso de Crimes.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('8b5ba077-2da8-4d14-9a6f-40184cce91bb', 'e303a937-8081-4721-9a08-4085ff8578df', 'dosimetria-da-pena-fundamentos', 'Fundamentos de Dosimetria da Pena', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Dosimetria da Pena.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('6dbd4ac7-52fa-42d2-ac98-5e58ed632587', 'e75a4ec8-efa7-490e-ad8f-5ca48a41949f', 'suspensao-condicional-da-pena-e-livramento-condicional-fundamentos', 'Fundamentos de Suspensão Condicional da Pena e Livramento Condicional', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Suspensão Condicional da Pena e Livramento Condicional.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('6a1ff505-27b7-4d0a-9a2d-ba77ba91c241', '3d940085-dd05-48e1-9aa0-a6f87dfef1bd', 'efeitos-da-condenacao-e-reabilitacao-fundamentos', 'Fundamentos de Efeitos da Condenação e Reabilitação', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Efeitos da Condenação e Reabilitação.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('66f5634c-b9d7-4c5e-849f-d35c5a7ba506', '512e4d36-3437-4e6f-a137-a76e4cf63a3a', 'medidas-de-seguranca-fundamentos', 'Fundamentos de Medidas de Segurança', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Medidas de Segurança.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('bc58f88f-cab3-408e-95d3-25a9a4c45e2d', 'cc871b48-d0ad-4141-91bb-f69db3eac19d', 'extincao-da-punibilidade-e-prescricao-fundamentos', 'Fundamentos de Extinção da Punibilidade e Prescrição', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Extinção da Punibilidade e Prescrição.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('723ce140-12d9-4631-b09f-35c3a94e7787', 'b7c02e12-1516-4fa2-a3e2-e4d8880fa522', 'crimes-contra-a-pessoa-fundamentos', 'Fundamentos de Crimes Contra a Pessoa', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Contra a Pessoa.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('ede414d0-479d-433a-9672-48be4bc82213', '910d157c-130c-4a0f-857c-1c44af570a79', 'crimes-contra-a-vida-fundamentos', 'Fundamentos de Crimes Contra a Vida', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Contra a Vida.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('bd4d8fa8-a729-407b-9df9-c36d1614b89c', '98bd1910-bd08-4f44-923a-3495afe06e33', 'estatuto-do-desarmamento-fundamentos', 'Fundamentos de Estatuto do Desarmamento', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Estatuto do Desarmamento.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('be6eb6e5-1c63-4fe0-adbe-eb64a0482c5b', '487e58dc-773e-4ae6-a4fd-e3b23f88dcbc', 'crimes-contra-a-honra-fundamentos', 'Fundamentos de Crimes Contra a Honra', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Contra a Honra.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('1e89034c-9eb7-485f-9924-b766b086e83b', 'c565ff20-aaaf-4e16-aeea-a3008ef98e4b', 'crimes-contra-a-dignidade-sexual-fundamentos', 'Fundamentos de Crimes contra a Dignidade Sexual', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes contra a Dignidade Sexual.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('fd7ba0bd-d1a2-45e1-9a2c-d70fe0d973ff', 'cafb4fa0-dcac-4416-91ce-452c942c3b71', 'crimes-contra-a-organizacao-do-trabalho-fundamentos', 'Fundamentos de Crimes Contra a Organização do Trabalho', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Contra a Organização do Trabalho.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('c1a11bd2-f909-4652-981d-d54ee74faaa7', '5c4a8eb5-bc84-4f29-a374-548d6319ddd6', 'crimes-praticados-por-funcionario-publico-contra-a-administracao-fundamentos', 'Fundamentos de Crimes praticados por Funcionário Público contra a Administração', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes praticados por Funcionário Público contra a Administração.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('f4524708-b482-4818-b6ea-f4ce312271ae', 'aeff9482-0cfa-4281-8c72-ac566267c290', 'crimes-contra-o-patrimonio-fundamentos', 'Fundamentos de Crimes Contra o Patrimônio', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Contra o Patrimônio.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('8e848aec-8683-44dd-97b4-42aa0d1b17b1', '9fd9a6d8-1afd-44f1-b603-c291b2ebae93', 'direito-penal-sexual-teoria-geral-e-reflexos-tipicos-fundamentos', 'Fundamentos de Direito Penal Sexual - Teoria Geral e Reflexos Típicos', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Direito Penal Sexual - Teoria Geral e Reflexos Típicos.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('924b27f9-c5dd-47d2-8a7e-95419c17efa1', '629652e6-aba3-4738-b78d-bea7efb33e47', 'crimes-contra-a-propriedade-imaterial-fundamentos', 'Fundamentos de Crimes Contra a Propriedade Imaterial', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Contra a Propriedade Imaterial.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('e4a56e5b-6ebe-4af3-b8fb-ebe402ac2ecf', '42889d38-b28b-470b-8641-94870be5821a', 'crimes-praticados-por-particular-contra-a-administracao-em-geral-e-estrangeira-fundamentos', 'Fundamentos de Crimes Praticados por Particular Contra a Administração em Geral e Estrangeira', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Crimes Praticados por Particular Contra a Administração em Geral e Estrangeira.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('a054c787-a378-40b4-a193-826bfa315cca', 'd4d768f3-0b7b-48c5-aef3-b08753e5c4ab', 'lei-de-drogas-fundamentos', 'Fundamentos de Lei de Drogas', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Lei de Drogas.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('844fb56b-4e7f-429c-9624-dee7aab8c3e3', '285b888f-fd5f-4923-a255-5d21dc1a4bbf', 'legislacao-penal-extravagante-fundamentos', 'Fundamentos de Legislação Penal Extravagante', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Legislação Penal Extravagante.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('c69845d2-2511-4a20-9be7-af184b05d111', 'b67efd02-980d-468e-a714-7898da88f383', 'responsabilidade-penal-da-pessoa-juridica-fundamentos', 'Fundamentos de Responsabilidade Penal da Pessoa Jurídica', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Responsabilidade Penal da Pessoa Jurídica.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('10a20c51-8d94-40fe-816c-0e0f3a3be4b7', '89374b8e-60f2-48e2-b1e1-99184f4927c9', 'classificacao-e-especie-das-infracoes-penais-fundamentos', 'Fundamentos de Classificação e espécie das infrações penais', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Classificação e espécie das infrações penais.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('d64c703a-dab1-4264-a5d3-8781c7629eda', '84536719-e760-476e-846d-a632ae7b9387', 'preambulo-constitucional-e-principios-fundamentais-fundamentos', 'Fundamentos de Preâmbulo Constitucional e Princípios Fundamentais', 'Compreender a estrutura normativa, conceitos chave e aplicabilidade jurídica de Preâmbulo Constitucional e Princípios Fundamentais.', 15, 1, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('c5aa6ede-c098-4405-8847-05150c72abbe', '49be78d6-a154-47a3-9753-278e7538d47d', 'crimes-contra-o-sentimento-religioso-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Contra o Sentimento Religioso', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Contra o Sentimento Religioso.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('4985e79e-0b1d-4ae6-b1c5-a0bd7f92cb9c', '97111d58-8679-4ea4-8542-2243480c194b', 'crimes-contra-a-familia-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Contra a Família', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Contra a Família.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('9ef0c39b-98be-45de-8da5-80b6e4d11ac1', '5ff9f542-6914-4c03-b4fe-2efd4bde59ed', 'crimes-contra-a-fe-publica-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Contra a Fé Pública', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Contra a Fé Pública.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('7a41fcbf-74df-4e51-8409-ae8ea9f43b8a', '1b65fd90-ab8f-4b67-83c0-50f038d6c63e', 'criminologia-pratica', 'Aspectos Práticos e Jurisprudência: Criminologia', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Criminologia.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('3937a97b-44aa-4351-81d4-6914cecf15db', 'ead16259-2f63-4c8c-9cd3-5b0288db36d6', 'direito-penal-do-inimigo-pratica', 'Aspectos Práticos e Jurisprudência: Direito Penal do Inimigo', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Direito Penal do Inimigo.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('0e3c757a-b26e-4fed-a0a9-3ac20b384b78', 'd4d768f3-0b7b-48c5-aef3-b08753e5c4ab', 'lei-de-drogas-pratica', 'Aspectos Práticos e Jurisprudência: Lei de Drogas', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Lei de Drogas.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('41693fb3-8fec-4b45-9066-f5c9508c6c9c', '3f1e602b-a4b9-49a2-8351-15ccae7643fd', 'critica-ao-direito-penal-do-inimigo-pratica', 'Aspectos Práticos e Jurisprudência: Crítica ao Direito Penal do Inimigo', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crítica ao Direito Penal do Inimigo.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('b86e2378-412b-48a5-8344-45b66be87710', 'e27658ba-6458-4c58-97e4-5f4e1136e39c', 'escolas-penais-pratica', 'Aspectos Práticos e Jurisprudência: Escolas Penais', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Escolas Penais.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('17a491e5-c77f-4b79-84f1-f3667c83fd29', 'b13caaf4-d46f-4fb7-ad0f-e3d5e976db97', 'crimes-contra-a-administracao-da-justica-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Contra a Administração da Justiça', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Contra a Administração da Justiça.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('7e50af6e-ce6f-415f-abdb-5a7982765c22', 'b67efd02-980d-468e-a714-7898da88f383', 'responsabilidade-penal-da-pessoa-juridica-pratica', 'Aspectos Práticos e Jurisprudência: Responsabilidade Penal da Pessoa Jurídica', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Responsabilidade Penal da Pessoa Jurídica.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('70f70192-50bd-4d8d-85b7-51aa4cf1ba44', '98bd1910-bd08-4f44-923a-3495afe06e33', 'estatuto-do-desarmamento-pratica', 'Aspectos Práticos e Jurisprudência: Estatuto do Desarmamento', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Estatuto do Desarmamento.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('588dbc58-43aa-4b9d-80d2-3f1ced1c5e1a', 'ddad8b6e-7935-4b0b-be1e-ea3fdad6c430', 'concurso-de-pessoas-e-autoria-imediata-pratica', 'Aspectos Práticos e Jurisprudência: Concurso de Pessoas e Autoria Imediata', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Concurso de Pessoas e Autoria Imediata.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('e82dfe8d-a816-4a51-aafd-e32b93da8afc', 'f6477c3f-ab3c-480f-8a35-05548f7623c5', 'teoria-da-pena-pratica', 'Aspectos Práticos e Jurisprudência: Teoria da Pena', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Teoria da Pena.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('36b46769-7253-41fe-bfd8-d56684b509c2', 'b9f2a190-0f8e-496d-a652-537714618b05', 'funcoes-da-pena-pratica', 'Aspectos Práticos e Jurisprudência: Funções da Pena', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Funções da Pena.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('2b653794-d9d2-4e88-82c4-7b781b2b2c73', '5d16e351-8dc5-4ff2-ad51-af76a2e21e8f', 'concurso-de-crimes-pratica', 'Aspectos Práticos e Jurisprudência: Concurso de Crimes', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Concurso de Crimes.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('431a0145-dc4b-456d-98c5-172cfe48136b', 'e303a937-8081-4721-9a08-4085ff8578df', 'dosimetria-da-pena-pratica', 'Aspectos Práticos e Jurisprudência: Dosimetria da Pena', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Dosimetria da Pena.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('837c37e9-53df-4352-9a28-413707106ed6', 'e75a4ec8-efa7-490e-ad8f-5ca48a41949f', 'suspensao-condicional-da-pena-e-livramento-condicional-pratica', 'Aspectos Práticos e Jurisprudência: Suspensão Condicional da Pena e Livramento Condicional', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Suspensão Condicional da Pena e Livramento Condicional.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('f3299d5b-191f-489c-add6-95d04be1936e', '3d940085-dd05-48e1-9aa0-a6f87dfef1bd', 'efeitos-da-condenacao-e-reabilitacao-pratica', 'Aspectos Práticos e Jurisprudência: Efeitos da Condenação e Reabilitação', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Efeitos da Condenação e Reabilitação.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('56cdd59f-b51f-4a42-8ca0-8038027c96fb', '512e4d36-3437-4e6f-a137-a76e4cf63a3a', 'medidas-de-seguranca-pratica', 'Aspectos Práticos e Jurisprudência: Medidas de Segurança', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Medidas de Segurança.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('95e54fec-5a56-48a5-bb99-b16103fc588f', 'cc871b48-d0ad-4141-91bb-f69db3eac19d', 'extincao-da-punibilidade-e-prescricao-pratica', 'Aspectos Práticos e Jurisprudência: Extinção da Punibilidade e Prescrição', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Extinção da Punibilidade e Prescrição.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('1a7d44f4-4432-4aea-87e7-d8b6ad21cdbe', '84536719-e760-476e-846d-a632ae7b9387', 'preambulo-constitucional-e-principios-fundamentais-pratica', 'Aspectos Práticos e Jurisprudência: Preâmbulo Constitucional e Princípios Fundamentais', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Preâmbulo Constitucional e Princípios Fundamentais.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('516be9b7-0a73-4e47-a2bb-f96cfdcb9fdf', '285b888f-fd5f-4923-a255-5d21dc1a4bbf', 'legislacao-penal-extravagante-pratica', 'Aspectos Práticos e Jurisprudência: Legislação Penal Extravagante', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Legislação Penal Extravagante.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('cd6fee9c-e108-4fe7-aab6-0f31da8afb6a', '52c7acfa-4ff2-4b3c-a0b6-dfb6a2d320e4', 'crimes-praticados-em-licitacoes-e-contratos-administrativos-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Praticados em Licitações e Contratos Administrativos', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Praticados em Licitações e Contratos Administrativos.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('c15012a9-38af-4e17-a199-2c6eae3277d2', '89374b8e-60f2-48e2-b1e1-99184f4927c9', 'classificacao-e-especie-das-infracoes-penais-pratica', 'Aspectos Práticos e Jurisprudência: Classificação e espécie das infrações penais', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Classificação e espécie das infrações penais.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('3a3f91af-0570-4374-bd15-8a555f53815a', 'b7c02e12-1516-4fa2-a3e2-e4d8880fa522', 'crimes-contra-a-pessoa-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Contra a Pessoa', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Contra a Pessoa.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('6e23c957-6fd9-4ffc-a686-7850770fb000', '487e58dc-773e-4ae6-a4fd-e3b23f88dcbc', 'crimes-contra-a-honra-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Contra a Honra', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Contra a Honra.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('aef69565-2c24-4f13-baff-366fe554043e', 'c565ff20-aaaf-4e16-aeea-a3008ef98e4b', 'crimes-contra-a-dignidade-sexual-pratica', 'Aspectos Práticos e Jurisprudência: Crimes contra a Dignidade Sexual', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes contra a Dignidade Sexual.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('ca973cdb-fe90-470c-9eca-e83274db10fe', 'cafb4fa0-dcac-4416-91ce-452c942c3b71', 'crimes-contra-a-organizacao-do-trabalho-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Contra a Organização do Trabalho', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Contra a Organização do Trabalho.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('0c23067a-5795-4c36-beff-3cf9d3a72c7e', '0feaae77-b8ed-463e-bfbe-fc487ffabde5', 'livro-12993f29-pratica', 'Aspectos Práticos e Jurisprudência: Princípios penais', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Princípios penais.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('816d6993-404b-416a-9b3c-7e2f00ca1a51', '5c4a8eb5-bc84-4f29-a374-548d6319ddd6', 'crimes-praticados-por-funcionario-publico-contra-a-administracao-pratica', 'Aspectos Práticos e Jurisprudência: Crimes praticados por Funcionário Público contra a Administração', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes praticados por Funcionário Público contra a Administração.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('9b4725d2-fa9a-4bf7-9e01-fd4d2cd9903d', 'f3d09966-ac1c-487a-876c-f6feb12fde38', 'interpretacao-e-integracao-da-lei-penal-pratica', 'Aspectos Práticos e Jurisprudência: Interpretação e Integração da Lei Penal', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Interpretação e Integração da Lei Penal.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('3422d562-d1e2-4ca5-bc1c-21e10f90fd06', '910d157c-130c-4a0f-857c-1c44af570a79', 'crimes-contra-a-vida-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Contra a Vida', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Contra a Vida.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('bb4febb8-18ac-49f0-ae21-f0bf3c0474f1', '344a0149-6b02-417e-a985-184c37cf87ec', 'livro-ad64b231-pratica', 'Aspectos Práticos e Jurisprudência: Lei penal no espaço e no tempo', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Lei penal no espaço e no tempo.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('d225515d-ff66-4a2a-bda8-8e99d50b725a', 'aeff9482-0cfa-4281-8c72-ac566267c290', 'crimes-contra-o-patrimonio-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Contra o Patrimônio', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Contra o Patrimônio.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('0a3b9ecb-879f-4087-b958-537db89cf7ca', '02a97ce2-b32c-4e84-b546-d74a9c495ae1', 'teoria-geral-do-delito-pratica', 'Aspectos Práticos e Jurisprudência: Teoria Geral do Delito', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Teoria Geral do Delito.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('3a4f3610-36f2-4d69-a421-998609782276', 'f230122c-0ad8-4e67-9909-b6c01960c4e4', 'iter-criminis-pratica', 'Aspectos Práticos e Jurisprudência: Iter Criminis', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Iter Criminis.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('b063d53e-bb99-467f-acc7-f1cf3111f39d', 'c3711de4-ae95-449b-b835-dbf9ce819ab1', 'principio-da-insignificancia-pratica', 'Aspectos Práticos e Jurisprudência: Princípio da Insignificância', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Princípio da Insignificância.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('d1253768-39f9-46d0-abf2-72b0bbe1f85b', '6cb09d9d-6b6f-41b0-93c0-83449dcd9825', 'teoria-do-erro-pratica', 'Aspectos Práticos e Jurisprudência: Teoria do Erro', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Teoria do Erro.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('ade172ff-325d-4a60-9e75-5b800ffd119c', '9fd9a6d8-1afd-44f1-b603-c291b2ebae93', 'direito-penal-sexual-teoria-geral-e-reflexos-tipicos-pratica', 'Aspectos Práticos e Jurisprudência: Direito Penal Sexual - Teoria Geral e Reflexos Típicos', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Direito Penal Sexual - Teoria Geral e Reflexos Típicos.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('8bdd4016-f109-4929-9d78-8359862460f6', '35c55234-1c06-4754-bd03-28503bab1ae2', 'imputabilidade-e-concurso-de-pessoas-pratica', 'Aspectos Práticos e Jurisprudência: Imputabilidade e Concurso de Pessoas', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Imputabilidade e Concurso de Pessoas.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('7940a1e0-07f7-479c-a2d7-f4319bd82304', '629652e6-aba3-4738-b78d-bea7efb33e47', 'crimes-contra-a-propriedade-imaterial-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Contra a Propriedade Imaterial', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Contra a Propriedade Imaterial.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

INSERT INTO public.aprender_aulas (id, modulo_id, slug, titulo, objetivo, duracao_est_min, ordem, status)
VALUES ('e52b2a29-0346-4cda-b739-6aca3b65389a', '42889d38-b28b-470b-8641-94870be5821a', 'crimes-praticados-por-particular-contra-a-administracao-em-geral-e-estrangeira-pratica', 'Aspectos Práticos e Jurisprudência: Crimes Praticados por Particular Contra a Administração em Geral e Estrangeira', 'Analisar a jurisprudência dominante do STF e STJ e a resolução de casos complexos em Crimes Praticados por Particular Contra a Administração em Geral e Estrangeira.', 20, 2, 'published')
ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, objetivo = EXCLUDED.objetivo, status = EXCLUDED.status;

