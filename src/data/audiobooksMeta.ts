import type { AudiobookLivro } from './audiobooksCatalogo';

// Catálogo leve (somente metadados — ~32 KB) gerado automaticamente.
// Capítulos, cues e legendas são carregados sob demanda em /data/audiobooks/<id>.json via audiobooksLoader.ts
export const AUDIOBOOKS_CATALOGO_META: AudiobookLivro[] = [
  {
    "id": "o-caso-dos-exploradores-de-cavernas",
    "tableId": 121,
    "status": "disponivel",
    "titulo": "O Caso dos Exploradores de Cavernas",
    "subtitulo": "Um clássico imortal da Filosofia do Direito",
    "autor": "Lon L. Fuller",
    "ano": 1949,
    "descricao": "Cinco exploradores ficam presos em uma caverna isolada por um deslizamento. Diante da fome iminente, sorteiam quem será sacrificado para a sobrevivência dos demais. Resgatados, enfrentam a pena de morte por assassinato.",
    "sinopse": "Publicado na Harvard Law Review em 1949, o livro simula o julgamento dos sobreviventes perante a Suprema Corte de Newgarth, confrontando as maiores correntes do pensamento jurídico mundial: o Positivismo, o Jusnaturalismo, o Formalismo e o Realismo Jurídico.",
    "capaUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capa-do-livro.jpg",
    "totalCapitulos": 8,
    "duracaoTotalSegundos": 6479,
    "duracaoTotalFormatada": "108 min",
    "tags": [
      "Filosofia do Direito",
      "Jusnaturalismo",
      "Positivismo",
      "Clássicos",
      "Harvard Law"
    ],
    "capitulos": []
  },
  {
    "id": "dos-delitos-e-das-penas",
    "tableId": 123,
    "status": "disponivel",
    "titulo": "Dos Delitos e das Penas",
    "subtitulo": "O marco fundador do Direito Penal moderno",
    "autor": "Cesare Beccaria",
    "ano": 1764,
    "descricao": "Marco iluminista que revolucionou a história do Direito Penal, propondo a proporcionalidade das penas, a abolição da tortura, o fim das acusações secretas e o combate à crueldade punitiva em prol da dignidade humana.",
    "sinopse": "Publicado em 1764 na Itália, Dos Delitos e das Penas é a obra mais influente da criminologia e da filosofia penal mundial. Cesare Beccaria desafiou o absolutismo e as práticas arcaicas da época com argumentos irrefutáveis sobre a utilidade da punição, a legalidade, a separação entre pecado e crime, a igualdade perante a lei e a prevenção como o verdadeiro fim das penas.",
    "capaUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/dos-delitos-e-das-penas/capa-do-livro.jpg",
    "totalCapitulos": 42,
    "duracaoTotalSegundos": 16668,
    "duracaoTotalFormatada": "4h 38min",
    "tags": [
      "Direito Penal",
      "Filosofia do Direito",
      "Iluminismo Jurídico",
      "Criminologia",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "50-discursos-que-marcaram-o-mundo-moderno",
    "tableId": 156,
    "status": "disponivel",
    "titulo": "50 Discursos que Marcaram o Mundo Moderno",
    "subtitulo": "Oratória, Liderança e Momentos Decisivos da História",
    "autor": "Andrew Burnet",
    "ano": 2018,
    "descricao": "Uma coletânea magistral dos 50 discursos mais impactantes, revolucionários e transformadores do século XX e início do século XXI, contextualizados com precisão histórica e análise oratória.",
    "sinopse": "Da luta sufragista de Emmeline Pankhurst ao sonho de igualdade de Martin Luther King, dos clamores de resistência de Churchill e De Gaulle às mensagens de Mandela, Malala e Ulysses Guimarães, esta obra reúne as palavras que moldaram a geopolítica, os direitos humanos e a história contemporânea.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/50_discursos_que_marcaram_o_mundo_moderno_manual.jpg",
    "totalCapitulos": 53,
    "duracaoTotalSegundos": 37342,
    "duracaoTotalFormatada": "622 min",
    "tags": [
      "Oratória",
      "História",
      "Direitos Humanos",
      "Liderança",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "o-mundo-de-sofia",
    "tableId": 124,
    "status": "disponivel",
    "titulo": "O Mundo de Sofia",
    "subtitulo": "Romance da História da Filosofia",
    "autor": "Jostein Gaarder",
    "ano": 1991,
    "descricao": "Às vésperas de seu 15º aniversário, Sofia Amundsen começa a receber cartas misteriosas com perguntas existenciais que a levam a um curso fascinante sobre a história do pensamento ocidental, desde os pré-socráticos até a contemporaneidade.",
    "sinopse": "Uma das maiores obras da literatura mundial sobre filosofia e autoconhecimento. Combinando o suspense de um romance policial juvenil com o rigor acadêmico dos grandes pensadores da humanidade, Jostein Gaarder constrói uma jornada inesquecível pelas ideias de Sócrates, Platão, Aristóteles, Descartes, Kant, Hegel, Marx, Darwin e Freud.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_de_sofia_manual.jpg",
    "totalCapitulos": 37,
    "duracaoTotalSegundos": 68605,
    "duracaoTotalFormatada": "19h 03min",
    "tags": [
      "Filosofia",
      "História da Filosofia",
      "Clássicos",
      "Metafísica",
      "Epistemologia",
      "Literatura Mundial"
    ],
    "capitulos": []
  },
  {
    "id": "1984",
    "tableId": 1984,
    "status": "disponivel",
    "titulo": "1984",
    "subtitulo": "O clássico distópico sobre vigilância, poder e controle",
    "autor": "George Orwell",
    "ano": 1949,
    "descricao": "Winston Smith vive sob a vigilância constante do Grande Irmão em um regime totalitário onde o pensamento independente é o pior dos crimes. Uma reflexão profunda sobre controle estatal, manipulação da verdade e liberdade.",
    "sinopse": "Publicado em 1949, 1984 é uma das obras mais influentes do século XX. O romance descreve uma sociedade totalitária governada pelo Partido e personificada pelo Grande Irmão, onde o Ministério da Verdade reescreve a história e a Novilíngua restringe o próprio ato de pensar.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/1984_manual.jpg",
    "totalCapitulos": 26,
    "duracaoTotalSegundos": 43791,
    "duracaoTotalFormatada": "12h 09min",
    "tags": [
      "Clássico",
      "Filosofia Política",
      "Distopia",
      "Liberdade"
    ],
    "capitulos": []
  },
  {
    "id": "como-as-democracias-morrem",
    "tableId": 134,
    "status": "disponivel",
    "titulo": "Como as Democracias Morrem",
    "subtitulo": "Um diagnóstico lúcido sobre a erosão das instituições",
    "autor": "Steven Levitsky e Daniel Ziblatt",
    "ano": 2018,
    "descricao": "Dois professores de Harvard revelam como as democracias contemporâneas deixaram de ruir por golpes militares para serem corroídas por dentro, através da eleição de líderes autoritários que subvertem as próprias leis.",
    "sinopse": "Com base em décadas de pesquisa e exemplos históricos que vão da América Latina à Europa, Levitsky e Ziblatt mostram que a sobrevivência da democracia depende de regras não escritas: tolerância mútua e autocontrole institucional.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/como_as_democracias_morrem_manual.jpg",
    "totalCapitulos": 13,
    "duracaoTotalSegundos": 32316,
    "duracaoTotalFormatada": "8h 58min",
    "tags": [
      "Direito Constitucional",
      "Democracia",
      "Instituições",
      "Política"
    ],
    "capitulos": []
  },
  {
    "id": "crime-e-castigo",
    "tableId": 138,
    "status": "disponivel",
    "titulo": "Crime e Castigo",
    "subtitulo": "O ápice da psicologia criminal e da moral humana",
    "autor": "Fiódor Dostoiévski",
    "ano": 1866,
    "descricao": "Em São Petersburgo, o estudante Rodion Raskólnikov assassina uma velha usurária acreditando ser um homem extraordinário acima da lei, mas é consumido pela culpa e pela perseguição implacável do juiz Porfiri Petróvitch.",
    "sinopse": "Uma das obras-primas da literatura mundial, Crime e Castigo mergulha nas profundezas da consciência, do livre-arbítrio e da redenção moral, sendo estudo obrigatório na Criminologia e na Filosofia do Direito.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/crime_e_castigo_manual.jpg",
    "totalCapitulos": 42,
    "duracaoTotalSegundos": 98281,
    "duracaoTotalFormatada": "27h 18min",
    "tags": [
      "Direito Penal",
      "Criminologia",
      "Clássicos",
      "Filosofia Moral"
    ],
    "capitulos": []
  },
  {
    "id": "direito-penal-do-equilibrio",
    "tableId": 147,
    "status": "disponivel",
    "titulo": "Direito Penal do Equilíbrio",
    "subtitulo": "Teoria e prática entre a intervenção mínima e a proteção eficaz",
    "autor": "Rogério Greco",
    "ano": 2011,
    "descricao": "Um dos maiores penalistas brasileiros propõe um modelo equilibrado para o sistema penal, superando tanto o punitivismo desmedido quanto o abolicionismo ingênuo, fundamentado na dignidade da pessoa humana.",
    "sinopse": "Rogério Greco examina as correntes criminológicas modernas, o princípio da intervenção mínima e a necessidade de tutela aos bens jurídicos fundamentais, trazendo lições essenciais para operadores do direito e concurseiros.",
    "capaUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/direito-penal-do-equilibrio/capa-do-livro.jpg",
    "totalCapitulos": 11,
    "duracaoTotalSegundos": 28152,
    "duracaoTotalFormatada": "7h 49min",
    "tags": [
      "Direito Penal",
      "Criminologia",
      "Garantismo",
      "Doutrina"
    ],
    "capitulos": []
  },
  {
    "id": "eles-os-juizes-vistos-por-nos-os-advogados",
    "tableId": 141,
    "status": "disponivel",
    "titulo": "Eles, os Juízes, Vistos por Nós, os Advogados",
    "subtitulo": "Elogio aos magistrados escrito por um advogado",
    "autor": "Piero Calamandrei",
    "ano": 1935,
    "descricao": "Obra indispensável sobre a relação ética, humana e processual entre advogados e magistrados, escrita com finíssima ironia e profunda sabedoria por um dos maiores processualistas da história.",
    "sinopse": "Piero Calamandrei traça um retrato vivo e sincero da vida nos tribunais, refletindo sobre a discrição dos julgadores, a coragem dos causídicos e a sublime arte de buscar a justiça nos pretórios.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/eles_os_juizes_vistos_por_nos_os_advogados_manual.jpg",
    "totalCapitulos": 17,
    "duracaoTotalSegundos": 10405,
    "duracaoTotalFormatada": "2h 53min",
    "tags": [
      "Deontologia Jurídica",
      "Processo Civil",
      "Advocacia",
      "Magistratura"
    ],
    "capitulos": []
  },
  {
    "id": "etica-a-nicomaco",
    "tableId": 140,
    "status": "disponivel",
    "titulo": "Ética a Nicômaco",
    "subtitulo": "O tratado clássico da virtude e da justiça como meio-termo",
    "autor": "Aristóteles",
    "ano": "séc. IV a.C.",
    "descricao": "O livro seminal de Aristóteles sobre a felicidade (eudaimonia), o justo meio e as virtudes humanas, contendo no Livro V a célebre formulação da justiça distributiva e comutativa que fundamenta todo o Direito Ocidental.",
    "sinopse": "Dedicado ao seu filho Nicômaco, o tratado examina a busca do Sumo Bem e define a virtude como uma disposição de caráter guiada pela prudência. No Livro V, Aristóteles inaugura a teoria geral da justiça.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/etica_a_nicomaco_manual.jpg",
    "totalCapitulos": 12,
    "duracaoTotalSegundos": 34035,
    "duracaoTotalFormatada": "9h 27min",
    "tags": [
      "Filosofia do Direito",
      "Ética",
      "Justiça",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "introducao-ao-estudo-do-direito",
    "tableId": 146,
    "status": "disponivel",
    "titulo": "Introdução ao Estudo do Direito",
    "subtitulo": "Técnica, decisão e dominação no fenômeno jurídico",
    "autor": "Tercio Sampaio Ferraz Júnior",
    "ano": 1988,
    "descricao": "Um dos manuais fundamentais do pensamento jurídico nacional, combinando teoria zetética e dogmática para dissecar as normas, a validade e a interpretação jurídica de forma inovadora.",
    "sinopse": "Tercio Sampaio articula a linguagem do direito, a teoria da norma e o problema da decisão jurídica com rigor conceitual e clareza didática inigualáveis na academia brasileira.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/introducao_ao_estudo_do_direito.jpg",
    "totalCapitulos": 10,
    "duracaoTotalSegundos": 82368,
    "duracaoTotalFormatada": "22h 52min",
    "tags": [
      "Teoria Geral do Direito",
      "Dogmática",
      "Hermenêutica",
      "Graduação"
    ],
    "capitulos": []
  },
  {
    "id": "justica-o-que-e-fazer-a-coisa-certa",
    "tableId": 122,
    "status": "disponivel",
    "titulo": "Justiça: O que é fazer a coisa certa",
    "subtitulo": "Dilemas morais, utilitarismo, libertarianismo e o bem comum",
    "autor": "Michael J. Sandel",
    "ano": 2009,
    "descricao": "Baseado no famoso curso de Harvard, Sandel confronta dilemas éticos contemporâneos através das teorias de Aristóteles, Kant, Bentham, Mill e Rawls para responder: o que é uma sociedade verdadeiramente justa?",
    "sinopse": "Com uma abordagem socrática e envolvente, o autor desafia o leitor a testar suas próprias convicções em debates sobre ações afirmativas, igualdade, livre mercado e moralidade cívica.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/justica_o_que_e_fazer_a_coisa_certa_manual.jpg",
    "totalCapitulos": 12,
    "duracaoTotalSegundos": 39327,
    "duracaoTotalFormatada": "10h 55min",
    "tags": [
      "Filosofia do Direito",
      "Ética",
      "Harvard",
      "Teoria da Justiça"
    ],
    "capitulos": []
  },
  {
    "id": "o-contrato-social",
    "tableId": 129,
    "status": "disponivel",
    "titulo": "O Contrato Social",
    "subtitulo": "Princípios do Direito Político e da Vontade Geral",
    "autor": "Jean-Jacques Rousseau",
    "ano": 1762,
    "descricao": "Marco do Iluminismo e da Teoria Política moderna, sustentando que a soberania reside no povo e que o Estado legítimo nasce da convenção entre cidadãos livres e iguais.",
    "sinopse": "Publicado em 1762, o tratado influenciou decisivamente a Revolução Francesa e a concepção democrática contemporânea ao introduzir os conceitos de Vontade Geral, Soberania Popular e Pacto Social.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_contrato_social_manual.jpg",
    "totalCapitulos": 48,
    "duracaoTotalSegundos": 15035,
    "duracaoTotalFormatada": "4h 10min",
    "tags": [
      "Direito Constitucional",
      "Filosofia Política",
      "Democracia",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "o-leviata",
    "tableId": 126,
    "status": "disponivel",
    "titulo": "O Leviatã",
    "subtitulo": "Matéria, forma e poder de um Estado eclesiástico e civil",
    "autor": "Thomas Hobbes",
    "ano": 1651,
    "descricao": "Um dos pilares da ciência política mundial. Analisa a condição humana no estado de natureza, a guerra de todos contra todos e a criação do poder soberano para garantir a paz e a segurança.",
    "sinopse": "Escrito durante a Guerra Civil Inglesa, Hobbes formula a célebre metáfora do Estado como um monstro bíblico indispensável para superar o medo da morte violenta e instituir a ordem jurídica.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_leviata_manual.jpg",
    "totalCapitulos": 49,
    "duracaoTotalSegundos": 85105,
    "duracaoTotalFormatada": "23h 38min",
    "tags": [
      "Teoria do Estado",
      "Filosofia do Direito",
      "Contratualismo",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "o-monge-e-o-executivo",
    "tableId": 124,
    "status": "disponivel",
    "titulo": "O Monge e o Executivo",
    "subtitulo": "Uma história sobre a essência da liderança e relações humanas",
    "autor": "James C. Hunter",
    "ano": 1998,
    "descricao": "Clássico contemporâneo sobre liderança servidora, ética e inteligência interpessoal, ambientado em um mosteiro beneditino onde executivos aprendem a autoridade fundada no respeito e no serviço.",
    "sinopse": "A jornada de John Daily sob mentoria do lendário Leonard Hoffman revela que a verdadeira liderança não repousa no poder da coerção hierárquica, mas na capacidade de influenciar pessoas com integridade.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_monge_e_o_executivo_manual.jpg",
    "totalCapitulos": 11,
    "duracaoTotalSegundos": 16430,
    "duracaoTotalFormatada": "4h 33min",
    "tags": [
      "Liderança",
      "Ética Profissional",
      "Gestão",
      "Desenvolvimento Pessoal"
    ],
    "capitulos": []
  },
  {
    "id": "o-mundo-assombrado-pelos-demonios",
    "tableId": 136,
    "status": "disponivel",
    "titulo": "O Mundo Assombrado pelos Demônios",
    "subtitulo": "A ciência vista como uma vela no escuro",
    "autor": "Carl Sagan",
    "ano": 1995,
    "descricao": "Um manifesto apaixonado pelo pensamento crítico, pelo ceticismo metodológico e pela busca da verdade baseada em evidências, com ferramentas vitais para a análise probatória no direito.",
    "sinopse": "Carl Sagan apresenta o célebre kit de detecção de mentiras e falácias lógicas, essencial para juristas, magistrados e advogados avaliarem argumentos, laudos periciais e discursos retóricos.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_assombrado_pelos_demonios_manual.jpg",
    "totalCapitulos": 28,
    "duracaoTotalSegundos": 63287,
    "duracaoTotalFormatada": "17h 34min",
    "tags": [
      "Teoria da Prova",
      "Pensamento Crítico",
      "Lógica Jurídica",
      "Ciência"
    ],
    "capitulos": []
  },
  {
    "id": "o-processo",
    "tableId": 135,
    "status": "disponivel",
    "titulo": "O Processo",
    "subtitulo": "A engrenagem kafkiana da burocracia e do arbítrio judicial",
    "autor": "Franz Kafka",
    "ano": 1925,
    "descricao": "Josef K. é detido em sua casa em uma manhã sem ter feito nada de errado. A partir daí, é arrastado por um sistema judicial opaco, inacessível e absurdo, em uma crítica atemporal ao autoritarismo.",
    "sinopse": "Romance seminal da literatura universal que inspirou o conceito de kafkaesco. O livro expõe o pesadelo da violação do devido processo legal e a alienação do cidadão diante do aparato estatal.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_processo_manual.jpg",
    "totalCapitulos": 12,
    "duracaoTotalSegundos": 30155,
    "duracaoTotalFormatada": "8h 22min",
    "tags": [
      "Direito Processual Penal",
      "Garantismo",
      "Literatura Jurídica",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "o-ultimo-dia-de-um-condenado",
    "tableId": 133,
    "status": "disponivel",
    "titulo": "O Último Dia de um Condenado",
    "subtitulo": "O grito humanista de Victor Hugo contra a pena de morte",
    "autor": "Victor Hugo",
    "ano": 1829,
    "descricao": "O diário comovente de um homem anônimo que aguarda no corredor da morte a hora de subir ao cadafalso, retratando a agonia mental e a crueldade institucional da execução capital.",
    "sinopse": "Escrito antes de Os Miseráveis, este manifesto pioneiro pelos Direitos Humanos abalou a Europa do século XIX e consolidou os princípios fundamentais da abolição da pena de morte no Direito Penal moderno.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_ultimo_dia_de_um_condenado_manual.jpg",
    "totalCapitulos": 50,
    "duracaoTotalSegundos": 9288,
    "duracaoTotalFormatada": "2h 34min",
    "tags": [
      "Direito Penal",
      "Direitos Humanos",
      "Pena de Morte",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "sobre-a-liberdade",
    "tableId": 137,
    "status": "disponivel",
    "titulo": "Sobre a Liberdade",
    "subtitulo": "Os limites do poder da sociedade sobre o indivíduo",
    "autor": "John Stuart Mill",
    "ano": 1859,
    "descricao": "A obra canônica do liberalismo político e da defesa irrestrita da liberdade de expressão, formulando o princípio do dano como critério supremo de intervenção estatal na vida privada.",
    "sinopse": "Mill argumenta vigorosamente que o único propósito legítimo para o qual o poder pode ser exercido sobre qualquer membro de uma comunidade civilizada, contra a sua vontade, é evitar dano a outrem.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.jpg",
    "totalCapitulos": 8,
    "duracaoTotalSegundos": 21522,
    "duracaoTotalFormatada": "5h 58min",
    "tags": [
      "Direito Constitucional",
      "Liberdade de Expressão",
      "Filosofia do Direito",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "vigiar-e-punir",
    "tableId": 144,
    "status": "disponivel",
    "titulo": "Vigiar e Punir",
    "subtitulo": "O nascimento da prisão e a sociedade disciplinar",
    "autor": "Michel Foucault",
    "ano": 1975,
    "descricao": "Estudo revolucionário sobre a evolução dos sistemas penais, da passagem dos suplícios públicos à disciplina minuciosa do corpo e ao panoptismo das prisões modernas.",
    "sinopse": "Foucault demonstra como a penalidade moderna deixou de atingir a carne para disciplinar a alma, criando micropoderes e mecanismos de vigilância que moldaram escolas, quartéis, fábricas e tribunais.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/vigiar_e_punir_nascimento_da_prisao_manual.jpg",
    "totalCapitulos": 13,
    "duracaoTotalSegundos": 62765,
    "duracaoTotalFormatada": "17h 26min",
    "tags": [
      "Criminologia",
      "Sociologia Jurídica",
      "Execução Penal",
      "Filosofia"
    ],
    "capitulos": []
  },
  {
    "id": "livro-classico-125",
    "tableId": 125,
    "titulo": "A Arte da Guerra",
    "autor": "Sun Tzu",
    "ano": "séc. V a.C.",
    "descricao": "A obra \"A Arte da Guerra\", atribuída ao célebre general e estrategista chinês Sun Tzu, emerge do turbulento contexto histórico da China Antiga, mais precisamente entre os Períodos ...",
    "sinopse": "A obra \"A Arte da Guerra\", atribuída ao célebre general e estrategista chinês Sun Tzu, emerge do turbulento contexto histórico da China Antiga, mais precisamente entre os Períodos das Primaveras e Outonos (771-476 a.C.) e dos Estados Combatentes (475-221 a.C.). Neste cenário de fragmentação política e beligerância constante, a sobrevivência e a prosperidade dos diversos estados chineses dependiam intrinsecamente da maestria em conduzir conflitos e assegurar a vitória militar. \"A Arte da Guerra\" transcende, assim, a mera compilação de táticas de combate, apresentando-se como um tratado filosófi...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_arte_da_guerra_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-127",
    "tableId": 127,
    "status": "disponivel",
    "titulo": "O que é Direito (Primeiros Passos)",
    "subtitulo": "A dialética social do direito e a crítica ao positivismo dogmático",
    "autor": "Roberto Lyra Filho",
    "ano": 1982,
    "descricao": "O maior clássico introdutório do pensamento jurídico crítico brasileiro, desmistificando o direito dogmático e conectando a norma às lutas sociais.",
    "sinopse": "Roberto Lyra Filho desconstrói a redução do Direito à lei estatal. Demonstra a dialética entre direito e ideologia, as correntes jusnaturalistas e positivistas, e propõe uma sociologia dialética onde o Direito é a positivação histórica da legítima libertação humana.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_que_e_direito_primeiros_passos_manual.jpg",
    "totalCapitulos": 9,
    "duracaoTotalSegundos": 11326,
    "duracaoTotalFormatada": "3h 08min",
    "tags": [
      "Introdução ao Direito",
      "Filosofia Crítica",
      "Sociologia Jurídica",
      "Direito Dialético",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "livro-classico-128",
    "tableId": 128,
    "status": "disponivel",
    "titulo": "Acesso à Justiça",
    "subtitulo": "A clássica obra sobre as ondas renovatórias e a efetividade dos direitos",
    "autor": "Mauro Cappelletti e Bryant Garth",
    "ano": 1978,
    "descricao": "A obra pioneira de Mauro Cappelletti e Bryant Garth que mapeou os obstáculos e as três grandes ondas renovatórias do acesso à justiça no mundo contemporâneo.",
    "sinopse": "Fruto do Projeto de Florença, a obra revolucionou o processo civil mundial ao demonstrar que a igualdade formal perante a lei é insuficiente sem instrumentos práticos de acesso: assistência jurídica aos desfavorecidos (1ª onda), representação dos interesses difusos e coletivos (2ª onda) e enfoque abrangente de acesso e reformas procedimentais (3ª onda).",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/acesso_a_justica_manual.jpg",
    "totalCapitulos": 8,
    "duracaoTotalSegundos": 12745,
    "duracaoTotalFormatada": "3h 32min",
    "tags": [
      "Processo Civil",
      "Acesso à Justiça",
      "Sociologia do Direito",
      "Direitos Coletivos",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "livro-classico-130",
    "tableId": 130,
    "status": "disponivel",
    "titulo": "O Espírito das Leis",
    "subtitulo": "A teoria fundamental da separação dos poderes e o espírito do constitucionalismo",
    "autor": "Montesquieu",
    "ano": "1748",
    "descricao": "A obra monumental de Charles-Louis de Secondat, Barão de Montesquieu, publicada em 1748, que revolucionou a teoria do Estado ao consagrar a tripartição dos poderes em Executivo, Legislativo e Judiciário.",
    "sinopse": "Dividida em 31 livros, 'O Espírito das Leis' estabelece as bases indispensáveis para a compreensão do Direito Constitucional e da Filosofia Política moderna. Montesquieu examina a correlação entre as leis, as formas de governo (República, Monarquia e Despotismo), o clima, a moral social e a preservação inegociável da liberdade política através dos freios e contrapesos.",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg",
    "totalCapitulos": 33,
    "duracaoTotalSegundos": 85702,
    "duracaoTotalFormatada": "23h 48min",
    "tags": [
      "Direito Constitucional",
      "Teoria do Estado",
      "Filosofia do Direito",
      "Separação de Poderes",
      "Iluminismo",
      "Clássicos"
    ],
    "capitulos": []
  },
  {
    "id": "livro-classico-132",
    "tableId": 132,
    "titulo": "O Advogado do Diabo",
    "autor": "Morris West",
    "ano": "1959",
    "descricao": "Publicado em 1963, 'O Advogado do Diabo' de Morris West emerge como um clássico atemporal que transcende a ficção para oferecer uma profunda meditação sobre a fé, a moralidade e a ...",
    "sinopse": "Publicado em 1963, 'O Advogado do Diabo' de Morris West emerge como um clássico atemporal que transcende a ficção para oferecer uma profunda meditação sobre a fé, a moralidade e a busca pela verdade, com ressonâncias significativas para o campo jurídico. A trama se desenrola na pitoresca, porém enigmática, ilha de Montelusa, na Itália, onde o Ceticismo do Monsenhor Merganti, um teólogo enviado pela Santa Sé, é posto à prova ao investigar os supostos milagres e a santidade de um homem local. A atmosfera carregada de tradições ancestrais e superstições da ilha serve como pano de fundo para uma i...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_advogado_do_diabo.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-139",
    "tableId": 139,
    "status": "disponivel",
    "titulo": "A República",
    "subtitulo": "Diálogo socrático sobre a justiça e o Estado ideal",
    "autor": "Platão",
    "ano": "380 a.C.",
    "descricao": "\"A República\", obra monumental de Platão, concebida por volta de 380 a.C., transcende a esfera literária para se consolidar como um dos pilares da filosofia ocidental e um texto de valor inestimável para a teoria política e o Direito.",
    "sinopse": "\"A República\", obra monumental de Platão, concebida por volta de 380 a.C., transcende a esfera literária para se consolidar como um dos pilares da filosofia ocidental e um texto de valor inestimável para o estudo do Direito. Inserida no efervescente cenário da Grécia Antiga, a obra se desdobra em um diálogo socrático onde o mestre Sócrates investiga a essência da justiça, expandindo a reflexão para a estrutura da pólis, as virtudes cardeais, a educação dos guardiões e a célebre alegoria da caverna.",
    "capaUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/a-republica/capa-do-livro.jpg",
    "totalCapitulos": 10,
    "duracaoTotalSegundos": 49021,
    "duracaoTotalFormatada": "13h 37min",
    "tags": [
      "Clássico",
      "Filosofia do Direito",
      "Teoria Política",
      "Grécia Antiga",
      "Direito Constitucional"
    ],
    "capitulos": []
  },
  {
    "id": "livro-classico-143",
    "tableId": 143,
    "titulo": "Virando a Própria Mesa",
    "autor": "Ricardo Semler",
    "ano": "1988",
    "descricao": "O livro \"Virando a Própria Mesa\", de Ricardo Semler, transcende a esfera da gestão empresarial para se posicionar como um marco teórico e prático de profunda relevância para o estu...",
    "sinopse": "O livro \"Virando a Própria Mesa\", de Ricardo Semler, transcende a esfera da gestão empresarial para se posicionar como um marco teórico e prático de profunda relevância para o estudo e a aplicação do Direito, especialmente para estudantes e profissionais da área jurídica. Publicado em um período de efervescência na busca por modelos organizacionais mais humanos e eficientes, a obra narra a experiência transformadora de Semler na Semco, empresa brasileira que, sob sua liderança, rompeu com as estruturas hierárquicas e burocráticas tradicionais. A filosofia central de Semler reside na implementa...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/virando_a_propria_mesa_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-148",
    "tableId": 148,
    "titulo": "A Era dos Direitos",
    "autor": "Norberto Bobbio",
    "ano": "1990",
    "descricao": "A obra \"A Era dos Direitos\", de Norberto Bobbio, é um marco incontornável na teoria dos direitos humanos e fundamentais, oferecendo aos estudantes de Direito uma análise profunda e...",
    "sinopse": "A obra \"A Era dos Direitos\", de Norberto Bobbio, é um marco incontornável na teoria dos direitos humanos e fundamentais, oferecendo aos estudantes de Direito uma análise profunda e multifacetada de um dos pilares do Estado Democrático de Direito. Publicado em um período de intensa reflexão sobre os limites e as possibilidades da proteção dos direitos humanos após os horrores do século XX, o livro se insere no contexto de um \"clássico\" do pensamento jurídico e filosófico, dialogando com as tradições do jusnaturalismo e do positivismo, mas propondo uma abordagem original e crítica. Bobbio, com s...",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_era_dos_direitos_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-150",
    "tableId": 150,
    "titulo": "A Riqueza das Nações",
    "autor": "Adam Smith",
    "ano": null,
    "descricao": "Uma investigação sobre a natureza e as causas da riqueza das nações é a obra mais famosa de Adam Smith....",
    "sinopse": "Uma investigação sobre a natureza e as causas da riqueza das nações é a obra mais famosa de Adam Smith....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_riqueza_das_nacoes.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-151",
    "tableId": 151,
    "titulo": "A Teoria das Formas de Governo",
    "autor": "Norberto Bobbio",
    "ano": null,
    "descricao": "Um clássico sobre a evolução histórica do pensamento político e as formas de governo....",
    "sinopse": "Um clássico sobre a evolução histórica do pensamento político e as formas de governo....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_teoria_das_formas_de_governo_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-153",
    "tableId": 153,
    "titulo": "Lições Preliminares de Direito",
    "autor": "Miguel Reale",
    "ano": null,
    "descricao": "Obra introdutória magistral, essencial para a compreensão dos conceitos fundamentais do Direito....",
    "sinopse": "Obra introdutória magistral, essencial para a compreensão dos conceitos fundamentais do Direito....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/licoes_preliminares_de_direito.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-154",
    "tableId": 154,
    "titulo": "O Futuro da Democracia",
    "autor": "Norberto Bobbio",
    "ano": null,
    "descricao": "Uma análise profunda das promessas não cumpridas da democracia e os desafios contemporâneos do sistema representativo....",
    "sinopse": "Uma análise profunda das promessas não cumpridas da democracia e os desafios contemporâneos do sistema representativo....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_futuro_da_democracia_manual.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-155",
    "tableId": 155,
    "titulo": "O Manual Definitivo para entender a Filosofia do Direito",
    "autor": "Vários Autores",
    "ano": null,
    "descricao": "Um guia prático e direto para compreender as principais correntes filosóficas e pensadores do direito....",
    "sinopse": "Um guia prático e direto para compreender as principais correntes filosóficas e pensadores do direito....",
    "capaUrl": "https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/filosofia_do_direito.jpg",
    "totalCapitulos": 0,
    "tags": [
      "Clássico",
      "Filosofia do Direito"
    ],
    "status": "em_breve",
    "capitulos": []
  },
  {
    "id": "livro-classico-1311",
    "tableId": 1311,
    "status": "disponivel",
    "titulo": "A Revolução dos Bichos",
    "subtitulo": "Uma fábula distópica sobre o poder, o totalitarismo e a corrupção das leis",
    "autor": "George Orwell",
    "ano": 1945,
    "descricao": "A célebre sátira orwelliana sobre os riscos da tirania, a manipulação das leis e a desintegração das garantias constitucionais por regimes autoritários.",
    "sinopse": "Na Granja do Solar, os animais se insurgem contra a tirania humana instaurando o Animalismo e os Sete Mandamentos. Com o tempo, a liderança de Napoleão subverte as normas fundamentais até o lema final: 'Todos os animais são iguais, mas alguns animais são mais iguais que os outros'. Uma lição atemporal para a Teoria do Estado e o Direito Constitucional.",
    "capaUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/a-revolucao-dos-bichos/imagens-de-cena/capitulo-01.png",
    "totalCapitulos": 12,
    "duracaoTotalSegundos": 11518,
    "duracaoTotalFormatada": "3h 12min",
    "tags": [
      "Teoria do Estado",
      "Direito Constitucional",
      "Totalitarismo",
      "Ficção Jurídica",
      "Clássicos"
    ],
    "capitulos": []
  }
];

export const O_CASO_DOS_EXPLORADORES_DE_CAVERNAS_META: AudiobookLivro = {
  "id": "o-caso-dos-exploradores-de-cavernas",
  "tableId": 121,
  "status": "disponivel",
  "titulo": "O Caso dos Exploradores de Cavernas",
  "subtitulo": "Um clássico imortal da Filosofia do Direito",
  "autor": "Lon L. Fuller",
  "ano": 1949,
  "descricao": "Cinco exploradores ficam presos em uma caverna isolada por um deslizamento. Diante da fome iminente, sorteiam quem será sacrificado para a sobrevivência dos demais. Resgatados, enfrentam a pena de morte por assassinato.",
  "sinopse": "Publicado na Harvard Law Review em 1949, o livro simula o julgamento dos sobreviventes perante a Suprema Corte de Newgarth, confrontando as maiores correntes do pensamento jurídico mundial: o Positivismo, o Jusnaturalismo, o Formalismo e o Realismo Jurídico.",
  "capaUrl": "https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audiobooks/o-caso-dos-exploradores-de-cavernas/capa-do-livro.jpg",
  "totalCapitulos": 8,
  "duracaoTotalSegundos": 6479,
  "duracaoTotalFormatada": "108 min",
  "tags": [
    "Filosofia do Direito",
    "Jusnaturalismo",
    "Positivismo",
    "Clássicos",
    "Harvard Law"
  ],
  "capitulos": []
};
