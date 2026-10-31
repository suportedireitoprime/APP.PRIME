export interface FlashcardAula {
  id: string;
  pergunta: string;
  resposta: string;
  artigoLei?: string;
  dicaPratica?: string;
  exemplo?: string;
}

export interface AlternativaQuestao {
  letra: 'A' | 'B' | 'C' | 'D';
  texto: string;
}

export interface QuestaoAula {
  id: string;
  tipo: 'definicao' | 'introdutoria' | 'caso_pratico' | 'pegadinha';
  tema: string;
  enunciado: string;
  alternativas: AlternativaQuestao[];
  respostaCorreta: 'A' | 'B' | 'C' | 'D';
  comentario: string;
  fundamentoLegal: string;
}

export interface ConteudoAulaInterativa {
  aulaId: string;
  titulo: string;
  flashcards: FlashcardAula[];
  questoes: QuestaoAula[];
}

export const CONTEUDO_AULAS: Record<string, ConteudoAulaInterativa> = {
  // ─────────────────────────────────────────────────────────────────────────────
  // AULA 01: CRIMES CONTRA A FAMÍLIA (BIGAMIA - ART. 235 DO CP)
  // 18 Flashcards + 12 Questões
  // ─────────────────────────────────────────────────────────────────────────────
  'penal-01-01': {
    aulaId: 'penal-01-01',
    titulo: 'Crimes Contra a Família (Bigamia)',
    flashcards: [
      {
        id: 'fc-penal-01-01',
        pergunta: 'Qual é o bem jurídico tutelado no crime de bigamia (art. 235 do Código Penal)?',
        resposta: 'Tutela-se a instituição da família, mais especificamente o princípio da monogamia matrimonial civil, alçado a garantia fundamental da organização social pela Constituição Federal.',
        artigoLei: 'Art. 235 do Código Penal e art. 226 da CF/88',
        dicaPratica: 'O casamento monogâmico é a base da tutela dos crimes contra o casamento no Título VII do CP.'
      },
      {
        id: 'fc-penal-01-02',
        pergunta: 'Quem é o sujeito ativo e passivo na figura do caput do art. 235?',
        resposta: 'No caput, o sujeito ativo é a pessoa já casada civilmente (crime próprio). Os sujeitos passivos são o Estado (sujeito passivo formal) e o cônjuge do primeiro casamento, além do segundo cônjuge quando de boa-fé.',
        artigoLei: 'Art. 235, caput, CP',
        exemplo: 'Marcos, formalmente casado com Ana, contrai segundas núpcias com Bruna. Marcos comete o crime do caput.'
      },
      {
        id: 'fc-penal-01-03',
        pergunta: 'Qual crime comete a pessoa solteira que contrai casamento com pessoa casada sabendo do vínculo anterior?',
        resposta: 'Responde pela figura típica equiparada do § 1º do art. 235 do CP ("Aquele que, não sendo casado, contrai casamento com pessoa casada, conhecendo essa circunstância"). É exceção pluralista expressa à teoria monista.',
        artigoLei: 'Art. 235, § 1º, CP',
        dicaPratica: 'Se a pessoa solteira ignorava que o parceiro era casado, é vítima inocente e sua conduta é atípica.'
      },
      {
        id: 'fc-penal-01-04',
        pergunta: 'Quando se consuma a bigamia e é admissível a forma tentada?',
        resposta: 'Consuma-se com a declaração solene da autoridade celebrante (juiz de paz) atestando que os nubentes estão casados. A tentativa é plenamente admissível (ex.: autoridade interrompe a celebração por denúncia antes do ato final).',
        artigoLei: 'Art. 14, II c/c art. 235 do CP'
      },
      {
        id: 'fc-penal-01-05',
        pergunta: 'A união estável anterior impede o casamento civil ou gera bigamia se a pessoa casar no civil?',
        resposta: 'NÃO configura crime de bigamia! O tipo penal exige casamento civil anterior válido. A união estável, embora entidade familiar reconhecida constitucionalmente, não preenche a elementar "casado". Punir seria analogia in malam partem proibida.',
        artigoLei: 'Princípio da Legalidade Estrita (art. 5º, XXXIX da CF)',
        dicaPratica: 'Pegadinha recorrente na OAB e concursos de carreiras jurídicas.'
      },
      {
        id: 'fc-penal-01-06',
        pergunta: 'Qual o efeito penal se o PRIMEIRO casamento for anulado por sentença civil definitiva?',
        resposta: 'Considera-se inexistente o crime de bigamia (art. 235, § 2º). A declaração de nulidade ou anulação civil retroage, retirando a condição material de "casado" à época das segundas núpcias.',
        artigoLei: 'Art. 235, § 2º do Código Penal',
        exemplo: 'Primeiro matrimônio anulado por coação moral irresistível de terceiros.'
      },
      {
        id: 'fc-penal-01-07',
        pergunta: 'O que ocorre se apenas o SEGUNDO casamento for declarado nulo no juízo cível?',
        resposta: 'Se o segundo casamento for anulado por motivo que não a própria bigamia (ex.: incapacidade absoluta do celebrante), o crime é considerado inexistente. Mas se anulado justamente por ser bigâmico, o crime persiste intacto.',
        artigoLei: 'Art. 235, § 2º, segunda parte, do CP'
      },
      {
        id: 'fc-penal-01-08',
        pergunta: 'O casamento exclusivamente religioso (sem qualquer registro civil) pode tipificar bigamia?',
        resposta: 'NÃO. O Direito Penal brasileiro tutela o casamento com eficácia civil. Cerimônia meramente religiosa sem registro público competente não gera status matrimonial para fins do art. 235.',
        artigoLei: 'Código Civil arts. 1.515 e 1.516 / Art. 235 do CP'
      },
      {
        id: 'fc-penal-01-09',
        pergunta: 'Como se resolve o caso do agente que casa novamente convicto de que seu cônjuge anterior faleceu?',
        resposta: 'Configura erro de tipo essencial (art. 20 do CP), o qual exclui o dolo. Como a lei não prevê modalidade culposa para a bigamia, a conduta resta atípica.',
        artigoLei: 'Art. 20, caput, do Código Penal',
        dicaPratica: 'Inexistindo previsão culposa no art. 235, o erro de tipo invencível ou vencível sempre afasta o crime.'
      },
      {
        id: 'fc-penal-01-10',
        pergunta: 'Qual é a natureza da ação penal no crime de bigamia?',
        resposta: 'Ação penal pública incondicionada, de competência privativa do Ministério Público, por envolver o interesse social indisponível da ordem matrimonial e familiar.',
        artigoLei: 'Art. 100, § 1º do Código Penal'
      },
      {
        id: 'fc-penal-01-11',
        pergunta: 'Qual a pena cominada para o crime de bigamia no caput e no § 1º?',
        resposta: 'Tanto para o caput (cônjuge búlgaro/casado) quanto para o § 1º (partícipe/solteiro ciente), a pena é de reclusão, de 2 a 6 anos, e multa. Admite fiança em sede policial ou judicial.',
        artigoLei: 'Art. 235, caput e § 1º, CP'
      },
      {
        id: 'fc-penal-01-12',
        pergunta: 'O estrangeiro que casou no exterior sob lei que admite poligamia comete bigamia ao casar no Brasil?',
        resposta: 'SIM! Vigora o princípio da territorialidade mitigada (art. 5º do CP) e a ordem pública brasileira (LINDB, art. 17). O princípio da monogamia é de ordem pública inderrogável em território nacional.',
        artigoLei: 'Art. 5º do CP e art. 17 da LINDB'
      },
      {
        id: 'fc-penal-01-13',
        pergunta: 'A separação de fato ou a separação judicial pendente extingue o dever de monogamia penal?',
        resposta: 'NÃO. Apenas o divórcio definitivo, a anulação do casamento ou a morte (real ou presumida declarada) dissolvem o vínculo matrimonial anterior. A separação de fato mantém a pessoa civilmente casada.',
        artigoLei: 'Art. 1.571 do Código Civil'
      },
      {
        id: 'fc-penal-01-14',
        pergunta: 'Se o oficial do cartório sabe que um dos noivos é casado e mesmo assim realiza o casamento, qual o crime?',
        resposta: 'O oficial de registro público ou juiz de paz responde pelo crime específico do art. 238 do Código Penal (conhecimento prévio de impedimento no casamento), ou coautoria na bigamia se concorreu de forma dolosa direta.',
        artigoLei: 'Art. 238 do Código Penal'
      },
      {
        id: 'fc-penal-01-15',
        pergunta: 'O crime de bigamia prescreve a partir de qual data?',
        resposta: 'A prescrição da pretensão punitiva começa a correr no dia em que o fato se tornou conhecido da autoridade pública (art. 111, IV do CP), em razão da natureza de ocultação do estado civil.',
        artigoLei: 'Art. 111, inciso IV, do Código Penal'
      },
      {
        id: 'fc-penal-01-16',
        pergunta: 'A falsa declaração de estado civil perante o juiz de paz é absorvida pela bigamia?',
        resposta: 'SIM. Pelo princípio da consunção, a falsidade ideológica no processo de habilitação matrimonial é crime-meio indispensável para a consecução da bigamia (crime-fim), restando por ela absorvida.',
        artigoLei: 'Súmula 17 do STJ (aplicação analógica do princípio da consunção)'
      },
      {
        id: 'fc-penal-01-17',
        pergunta: 'Casamento celebrado perante autoridade diplomática estrangeira no exterior tem validade para configurar bigamia?',
        resposta: 'SIM, desde que celebrado de acordo com a lei do local e com eficácia civil, preenche o elemento normativo anterior do tipo penal.',
        artigoLei: 'Art. 7º da LINDB e Art. 235 do CP'
      },
      {
        id: 'fc-penal-01-18',
        pergunta: 'O perdão do primeiro cônjuge ofendido extingue a punibilidade da bigamia?',
        resposta: 'NÃO. Como a ação penal é pública incondicionada, o perdão da vítima é instituto restrito à ação penal privada (art. 107, V do CP), não produzindo qualquer efeito sobre a persecução penal do MP.',
        artigoLei: 'Art. 100, § 1º e Art. 107 do CP'
      }
    ],
    questoes: [
      {
        id: 'q-penal-01-01',
        tipo: 'introdutoria',
        tema: 'Direito Penal · Conceito e Sujeitos',
        enunciado: 'Sobre o crime de bigamia previsto no art. 235 do Código Penal, assinale a afirmativa correta:',
        alternativas: [
          { letra: 'A', texto: 'Trata-se de crime comum quanto ao sujeito ativo no caput, podendo ser praticado por qualquer pessoa, casada ou solteira.' },
          { letra: 'B', texto: 'A pessoa solteira que contrai matrimônio com pessoa casada, conhecendo plenamente essa circunstância, responde pelas penas do § 1º do art. 235 do CP.' },
          { letra: 'C', texto: 'A união estável devidamente registrada em cartório de notas equipara-se ao casamento civil para caracterização de bigamia.' },
          { letra: 'D', texto: 'O crime de bigamia admite modalidade culposa na hipótese de negligência ao consultar certidões cartorárias.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O art. 235, § 1º do CP tipifica expressamente a conduta do nubente que, não sendo casado, contrai casamento com pessoa casada conhecendo essa circunstância. No caput, o crime é próprio (exige ser casado). União estável não tipifica bigamia e não existe modalidade culposa.',
        fundamentoLegal: 'Art. 235, § 1º do Código Penal'
      },
      {
        id: 'q-penal-01-02',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Concurso de Pessoas e Erro de Tipo',
        enunciado: 'Eduardo, formalmente casado com Fernanda no Brasil, conheceu Juliana em outro Estado e a convenceu a se casarem perante o Registro Civil, afirmando categoricamente que era solteiro e apresentando documentos fraudados. A cerimônia matrimonial foi celebrada e consumada. Diante do caso hipotético:',
        alternativas: [
          { letra: 'A', texto: 'Ambos respondem por bigamia na condição de coautores necessários.' },
          { letra: 'B', texto: 'Eduardo responde por bigamia (art. 235, caput), enquanto Juliana não responde por crime algum em virtude de erro de tipo essencial.' },
          { letra: 'C', texto: 'Juliana responde por bigamia culposa por não ter exigido a certidão de casamento averbada.' },
          { letra: 'D', texto: 'O casamento de Eduardo com Juliana é válido até que Fernanda requeira a sua dissolução.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Eduardo é casado e contraiu novo casamento (art. 235, caput). Juliana desconhecia o estado de casado de Eduardo (erro de tipo essencial, art. 20 do CP), o que afasta o dolo e qualquer tipicidade, restando como vítima inocente da farsa.',
        fundamentoLegal: 'Art. 20 c/c art. 235, § 1º do Código Penal'
      },
      {
        id: 'q-penal-01-03',
        tipo: 'definicao',
        tema: 'Direito Penal · Efeitos da Anulação do Casamento',
        enunciado: 'Nos termos do art. 235, § 2º do Código Penal, caso o primeiro casamento de quem contraiu segundas núpcias venha a ser anulado por vício de consentimento por sentença cível definitiva, qual é a consequência na esfera penal?',
        alternativas: [
          { letra: 'A', texto: 'A pena da bigamia é reduzida de metade em face do arrependimento posterior.' },
          { letra: 'B', texto: 'Considera-se inexistente o crime de bigamia, uma vez que a anulação do primeiro casamento extingue retroativamente o pressuposto material do tipo.' },
          { letra: 'C', texto: 'O crime subsiste inalterado, pois a consumação já havia se perfectibilizado no ato do segundo casamento.' },
          { letra: 'D', texto: 'O agente passa a responder pelo crime de falsidade ideológica em substituição à bigamia.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O § 2º do art. 235 dispõe expressamente: "Anulado por qualquer motivo o primeiro casamento, ou o outro por motivo que não a bigamia, considera-se inexistente o crime". Trata-se de hipótese legal de atipicidade material superveniente do fato.',
        fundamentoLegal: 'Art. 235, § 2º do Código Penal'
      },
      {
        id: 'q-penal-01-04',
        tipo: 'pegadinha',
        tema: 'Direito Penal · Limites da Tipicidade Material',
        enunciado: 'Rodrigo e Carla vivem em união estável pública, contínua e duradoura há mais de 8 anos, com escritura pública lavrada em tabelionato de notas. Sem dissolver a união estável, Rodrigo comparece ao cartório de registro civil e contrai casamento com Mariana. Rodrigo praticou o crime de bigamia?',
        alternativas: [
          { letra: 'A', texto: 'Sim, pois a união estável é constitucionalmente equiparada à entidade familiar.' },
          { letra: 'B', texto: 'Sim, desde que a união estável possua pacto de convivência registrado em cartório.' },
          { letra: 'C', texto: 'Não, pois o tipo penal do art. 235 exige vínculo decorrente de casamento civil anterior, sendo vedada a analogia in malam partem.' },
          { letra: 'D', texto: 'Sim, incidindo na causa de aumento de pena do crime continuado.' }
        ],
        respostaCorreta: 'C',
        comentario: 'O Direito Penal é regido pela estrita legalidade e tipicidade cerrada. A elementar normativa "sendo casado" exige celebração de casamento civil válido anterior. A união estável, por mais solene que seja, não preenche esse elemento, e equipará-la para fins de punição criminal violaria a vedação constitucional de analogia in malam partem.',
        fundamentoLegal: 'Art. 5º, XXXIX da CF e Art. 235 do CP'
      },
      {
        id: 'q-penal-01-05',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Iter Criminis e Tentativa',
        enunciado: 'Lucas, casado, comparece ao cartório com Renata para contrair segundo casamento. Durante a cerimônia, quando o juiz de paz indaga a Lucas se aceita casar-se, antes que o celebrante profira a declaração solene, policiais adentram o recinto munidos de mandado e interrompem o ato em razão da descoberta do vínculo anterior. A conduta de Lucas configura:',
        alternativas: [
          { letra: 'A', texto: 'Mero ato preparatório impunível.' },
          { letra: 'B', texto: 'Crime de bigamia consumado, pois os noivos já haviam manifestado a vontade prévia no processo de habilitação.' },
          { letra: 'C', texto: 'Tentativa de bigamia, pois iniciada a execução do ato solene de celebração, esta foi frustrada por circunstâncias alheias à sua vontade.' },
          { letra: 'D', texto: 'Desistência voluntária, pois não houve a assinatura do termo.' }
        ],
        respostaCorreta: 'C',
        comentario: 'O casamento se consuma no momento em que a autoridade celebrante conclui o ato e declara casados os nubentes (art. 1.535 do CC). Se a cerimônia já havia iniciado perante o juiz e foi interrompida antes da declaração por ato policial, houve início dos atos executórios formais obstados por circunstância externa: tentativa de bigamia.',
        fundamentoLegal: 'Art. 14, II c/c art. 235 do CP'
      },
      {
        id: 'q-penal-01-06',
        tipo: 'definicao',
        tema: 'Direito Penal · Casamento Religioso sem Efeito Civil',
        enunciado: 'Um ministro de confissão religiosa celebra o matrimônio religioso de uma pessoa já casada no civil, sem qualquer subsequente inscrição no Registro Civil das Pessoas Naturais. Do ponto de vista penal:',
        alternativas: [
          { letra: 'A', texto: 'O casamento religioso puro sem efeitos civis não configura o crime de bigamia.' },
          { letra: 'B', texto: 'Há bigamia consumada no instante da bênção nupcial pelo princípio da fé pública.' },
          { letra: 'C', texto: 'O padre ou pastor responderá como coautor do crime de bigamia necessariamente.' },
          { letra: 'D', texto: 'Aplica-se ao caso a pena do art. 235 atenuada de um terço.' }
        ],
        respostaCorreta: 'A',
        comentario: 'O casamento meramente religioso, despido de valor civil (não registrado no prazo legal), não cria sociedade conjugal com validade jurídica de direito positivo. Portanto, não preenche a elementar do tipo.',
        fundamentoLegal: 'Art. 235 do CP e art. 1.515 do Código Civil'
      },
      {
        id: 'q-penal-01-07',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Separação de Fato x Casamento',
        enunciado: 'Marcos está separado de fato de sua esposa há mais de 15 anos, não mantendo qualquer contato com ela. Conhecendo Laura, decide casar-se formalmente no cartório sem realizar o divórcio prévio, acreditando que a separação por mais de uma década extingue automaticamente o vínculo conjugal. Assinale a alternativa correta:',
        alternativas: [
          { letra: 'A', texto: 'Marcos não comete crime, pois a separação fática superior a dois anos opera a dissolução tácita da sociedade conjugal.' },
          { letra: 'B', texto: 'Marcos responde pelo crime de bigamia dolosa, pois a separação fática não dissolve o casamento e o desconhecimento da lei é inescusável (erro de proibição direto ou inescusável).' },
          { letra: 'C', texto: 'A conduta é atípica por ausência de lesividade ao patrimônio do casal.' },
          { letra: 'D', texto: 'Marcos comete crime contra a previdência social e não bigamia.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Apenas a morte ou o divórcio dissolvem o vínculo matrimonial. A separação de fato não extingue o estado civil de casado. Crer que o decurso do tempo extingue o dever penal constitui erro de proibição que, em regra, é inescusável (art. 21 do CP), não afastando o dolo da bigamia.',
        fundamentoLegal: 'Art. 21 e Art. 235 do CP; art. 1.571 do CC'
      },
      {
        id: 'q-penal-01-08',
        tipo: 'pegadinha',
        tema: 'Direito Penal · Princípio da Consunção',
        enunciado: 'Para habilitar-se e contrair o segundo casamento proibido, o agente apresenta ao oficial do registro civil uma declaração falsa afirmando sob as penas da lei que é solteiro. Quanto ao concurso entre o falso e a bigamia:',
        alternativas: [
          { letra: 'A', texto: 'Responde por falsidade ideológica em concurso material com a bigamia.' },
          { letra: 'B', texto: 'A falsidade ideológica (crime-meio) resta absorvida pela bigamia (crime-fim) pelo princípio da consunção.' },
          { letra: 'C', texto: 'Responde apenas por estelionato sentimental contra a fazenda pública.' },
          { letra: 'D', texto: 'A bigamia é absorvida pela falsidade ideológica por ter pena mais severa.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A falsidade perpetrada para viabilizar a habilitação nupcial é crime de passagem indispensável para o crime-fim (bigamia). Aplica-se a consunção: o falso é absorvido pela consumação da bigamia.',
        fundamentoLegal: 'Princípio da Consunção / Súmula 17 do STJ analógica'
      },
      {
        id: 'q-penal-01-09',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Prescrição da Pretensão Punitiva',
        enunciado: 'Em 2015, Cláudio contraiu segundo casamento mediante bigamia, mantendo duas famílias em cidades distintas. Somente em 2024 a primeira esposa descobriu a certidão e noticiou à autoridade policial. O prazo prescricional para persecução da bigamia:',
        alternativas: [
          { letra: 'A', texto: 'Começou a correr na data da celebração do segundo casamento em 2015.' },
          { letra: 'B', texto: 'Começa a correr no dia em que o fato se tornou conhecido da autoridade pública competente.' },
          { letra: 'C', texto: 'É imprescritível por se tratar de crime contra a família constitucional.' },
          { letra: 'D', texto: 'Conta-se da data da dissolução do primeiro matrimônio.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O art. 111, IV do Código Penal estipula expressamente que nos crimes de bigamia e nos de falsificação ou alteração de assentamento do registro civil, a prescrição começa a correr da data em que o fato se tornou conhecido da autoridade pública.',
        fundamentoLegal: 'Art. 111, inciso IV, do Código Penal'
      },
      {
        id: 'q-penal-01-10',
        tipo: 'definicao',
        tema: 'Direito Penal · Ação Penal e Perdão',
        enunciado: 'Após a deflagração da ação penal pelo Ministério Público em face de autor de bigamia, a primeira esposa comparece em juízo e declara que perdoa expressamente o réu, requerendo o arquivamento do feito. O magistrado deve:',
        alternativas: [
          { letra: 'A', texto: 'Declarar extinta a punibilidade pelo perdão do ofendido.' },
          { letra: 'B', texto: 'Rejeitar o pedido e prosseguir com a ação penal, haja vista cuidar-se de ação penal pública incondicionada indisponível.' },
          { letra: 'C', texto: 'Conceder indulto presidencial com base na anistia judicial.' },
          { letra: 'D', texto: 'Desclassificar a conduta para infração de menor potencial ofensivo.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A ação penal no crime de bigamia é de iniciativa pública incondicionada (art. 100, § 1º do CP). O perdão do ofendido é causa extintiva privativa de ações penais de iniciativa privada (art. 107, V do CP), sendo irrelevante na esfera pública.',
        fundamentoLegal: 'Art. 100, § 1º e Art. 107, V do Código Penal'
      },
      {
        id: 'q-penal-01-11',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Concurso de Pessoas Solteiro e Casado',
        enunciado: 'Guilherme (casado) e Vanessa (solteira) comparecem juntos ao cartório e casam-se civilmente. Vanessa tinha pleno conhecimento de que Guilherme era casado com Bianca. Nos termos do Código Penal, quais as capitulações jurídicas para Guilherme e Vanessa?',
        alternativas: [
          { letra: 'A', texto: 'Ambos respondem pelo art. 235, caput, em coautoria unificada pela teoria monista.' },
          { letra: 'B', texto: 'Guilherme responde pelo art. 235, caput; Vanessa responde pela figura autônoma do art. 235, § 1º do Código Penal.' },
          { letra: 'C', texto: 'Guilherme responde por bigamia e Vanessa responde por estelionato comum.' },
          { letra: 'D', texto: 'Vanessa não comete crime, pois não tem o dever legal de preservar o matrimônio alheio.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O Código Penal adotou a exceção pluralista à teoria monista no art. 235. O já casado responde pelo caput e a pessoa não casada ciente do impedimento responde pelo § 1º ("aquele que, não sendo casado, contrai casamento com pessoa casada").',
        fundamentoLegal: 'Art. 235, caput e § 1º do Código Penal'
      },
      {
        id: 'q-penal-01-12',
        tipo: 'pegadinha',
        tema: 'Direito Penal · Poligamia no Exterior e LINDB',
        enunciado: 'Cidadão estrangeiro originário de país cuja legislação permite a poligamia contrai primeiro matrimônio em seu país de origem. Ao transferir domicílio para o Brasil, contrai novo casamento civil em território brasileiro perante oficial do cartório nacional. O agente:',
        alternativas: [
          { letra: 'A', texto: 'Não comete crime no Brasil por força da aplicação do estatuto pessoal de sua nacionalidade de origem.' },
          { letra: 'B', texto: 'Responde pelo crime de bigamia no Brasil, visto que o princípio da monogamia é matéria de ordem pública imperativa que afasta leis estrangeiras no território nacional.' },
          { letra: 'C', texto: 'Deve ser compulsoriamente deportado sem persecução criminal prévia.' },
          { letra: 'D', texto: 'Tem o segundo casamento reconhecido como união estável poliafetiva válida.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Aplica-se o princípio da territorialidade (art. 5º do CP) e o art. 17 da LINDB (leis e atos estrangeiros não terão eficácia no Brasil quando ofenderem a ordem pública e os bons costumes). A vedação à bigamia é absoluta no território brasileiro.',
        fundamentoLegal: 'Art. 5º do CP e art. 17 da LINDB'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AULA 02: INDUZIMENTO A ERRO ESSENCIAL E OCULTAÇÃO DE IMPEDIMENTO (ART. 236)
  // 18 Flashcards + 12 Questões
  // ─────────────────────────────────────────────────────────────────────────────
  'penal-01-02': {
    aulaId: 'penal-01-02',
    titulo: 'Induzimento a Erro Essencial e Ocultação de Impedimento',
    flashcards: [
      {
        id: 'fc-penal-02-01',
        pergunta: 'Quais são os dois núcleos da conduta incriminada no art. 236 do Código Penal?',
        resposta: '1) "Induzir a erro essencial" (fazer crer falsamente em qualidade inexistente ou ocultar aspecto essencial da pessoa); e 2) "Ocultar impedimento que não seja casamento anterior".',
        artigoLei: 'Art. 236, caput, do Código Penal',
        dicaPratica: 'Se o impedimento for casamento anterior, o crime é Bigamia (art. 235) e NÃO o art. 236!'
      },
      {
        id: 'fc-penal-02-02',
        pergunta: 'Qual é a indispensável condição objetiva de procedibilidade/punibilidade do art. 236?',
        resposta: 'O trânsito em julgado da sentença cível que anula o casamento (parágrafo único: "A ação penal não pode ser intentada senão depois de transitar em julgado a sentença que, por motivo de erro ou impedimento, anule o casamento").',
        artigoLei: 'Art. 236, parágrafo único, CP',
        dicaPratica: 'Sem a anulação cível definitiva transitada, o processo penal sequer pode ser instaurado!'
      },
      {
        id: 'fc-penal-02-03',
        pergunta: 'Qual é a espécie de ação penal cabível no crime do art. 236 do Código Penal?',
        resposta: 'Ação penal de iniciativa PRIVADA personalíssima promovida pelo cônjuge enganado.',
        artigoLei: 'Art. 236, parágrafo único, CP',
        dicaPratica: 'Apenas o cônjuge vítima do erro ou da ocultação tem legitimidade para oferecer queixa-crime.'
      },
      {
        id: 'fc-penal-02-04',
        pergunta: 'A partir de qual momento se inicia o prazo decadencial de 6 meses para oferecer queixa no art. 236?',
        resposta: 'Conta-se da data do TRÂNSITO EM JULGADO da sentença cível que anula o casamento, e não da celebração ou da descoberta da fraude.',
        artigoLei: 'Art. 236, parágrafo único c/c art. 38 do CPP'
      },
      {
        id: 'fc-penal-02-05',
        pergunta: 'O que se entende por "erro essencial sobre a pessoa" para efeitos do art. 236?',
        resposta: 'São as hipóteses taxativas do art. 1.557 do Código Civil: identidade, honra e boa fama, defeito físico irremediável ou moléstia grave e transmissível prévia capaz de pôr em risco a saúde do outro ou da prole.',
        artigoLei: 'Art. 1.557 do Código Civil / Art. 236 do CP',
        exemplo: 'Ocultar deliberadamente ser portador de moléstia incurável e contagiosa pré-nupcial.'
      },
      {
        id: 'fc-penal-02-06',
        pergunta: 'Qual a diferença entre a ocultação de impedimento do art. 236 e a bigamia do art. 235?',
        resposta: 'A bigamia tutela exclusivamente o casamento anterior. O art. 236 abrange todos os outros impedimentos matrimoniais (parentesco consanguíneo, afinidade, crime contra ex-cônjuge - art. 1.521 do CC), ressalvado expressamente o casamento anterior.',
        artigoLei: 'Art. 236 ("impedimento que não seja casamento anterior")'
      },
      {
        id: 'fc-penal-02-07',
        pergunta: 'Se os cônjuges optarem pelo divórcio consensual em vez da anulação, haverá crime pelo art. 236?',
        resposta: 'NÃO. O divórcio dissolve um casamento válido; não o anula. Sem a sentença anulatória transitada em julgado, a condição de procedibilidade jamais se perfectibiliza e o crime não pode ser processado.',
        artigoLei: 'Art. 236, parágrafo único, CP'
      },
      {
        id: 'fc-penal-02-08',
        pergunta: 'Terceiro (como mãe ou amigo) que auxilia a ocultar o impedimento pode responder penalmente?',
        resposta: 'SIM, na qualidade de partícipe (art. 29 do CP), desde que o casamento seja celebrado e advenha a sentença anulatória civil transitada em julgado.',
        artigoLei: 'Art. 29 c/c art. 236 do CP'
      },
      {
        id: 'fc-penal-02-09',
        pergunta: 'O que é a ocultação de impedimento resultante de crime (art. 1.521, VII do Código Civil)?',
        resposta: 'É a hipótese em que o nubente oculta ter sido condenado definitivamente por homicídio doloso consumado ou tentado contra o cônjuge da pessoa com quem pretende se casar.',
        artigoLei: 'Art. 1.521, VII do CC / Art. 236 do CP'
      },
      {
        id: 'fc-penal-02-10',
        pergunta: 'Qual o elemento subjetivo exigido no crime do art. 236 do Código Penal?',
        resposta: 'Exige-se o DOLO direto ou eventual. Não existe modalidade culposa no art. 236; se a omissão decorreu de mera ignorância de parentesco, o fato é atípico por erro de tipo.',
        artigoLei: 'Art. 18, I do Código Penal'
      },
      {
        id: 'fc-penal-02-11',
        pergunta: 'Quem é o sujeito ativo no induzimento a erro essencial?',
        resposta: 'Crime comum quanto ao induzimento ou ocultação: o sujeito ativo é qualquer dos nubentes que engana o outro perante o matrimônio.',
        artigoLei: 'Art. 236, caput, do CP'
      },
      {
        id: 'fc-penal-02-12',
        pergunta: 'Quem pode ajuizar a queixa-crime se o cônjuge ofendido falecer após o trânsito da anulação?',
        resposta: 'Como a ação penal privada do art. 236 é personalíssima, o direito de queixa NÃO se transmite aos sucessores (CADI do art. 31 do CPP não se aplica aqui). Extingue-se a punibilidade com a morte do ofendido.',
        artigoLei: 'Art. 107, IV do CP e jurisprudência pacífica'
      },
      {
        id: 'fc-penal-02-13',
        pergunta: 'Qual a pena prevista no art. 236 do Código Penal?',
        resposta: 'Detenção, de 6 meses a 2 anos. Por ter pena máxima não superior a 2 anos, é infração de menor potencial ofensivo sujeita aos benefícios da Lei 9.099/95 (Juizados Especiais).',
        artigoLei: 'Art. 236 do CP e art. 61 da Lei 9.099/95'
      },
      {
        id: 'fc-penal-02-14',
        pergunta: 'A prescrição da pretensão punitiva corre durante a tramitação da ação anulatória civil?',
        resposta: 'NÃO corre! O art. 116, I do CP prevê que a prescrição não corre enquanto não resolvida, em outro processo, questão de que dependa o reconhecimento da existência do crime (questão prejudicial heterogênea).',
        artigoLei: 'Art. 116, inciso I, do Código Penal'
      },
      {
        id: 'fc-penal-02-15',
        pergunta: 'A ocultação de impotência coeundi (incapacidade de consumar o ato sexual) pode tipificar o art. 236?',
        resposta: 'SIM, desde que caracterize defeito físico irremediável pré-existente e desconhecido do outro cônjuge nos termos do art. 1.557, III do Código Civil, vindo a ser o casamento anulado judicialmente.',
        artigoLei: 'Art. 1.557, III do CC c/c art. 236 do CP'
      },
      {
        id: 'fc-penal-02-16',
        pergunta: 'O perdão concedido na esfera cível pelo cônjuge prejudicado extingue a persecução penal?',
        resposta: 'SIM. Sendo a ação penal de iniciativa privada personalíssima, a reconciliação, renúncia ou perdão tácito/expresso no cível impede ou extingue a punibilidade penal (art. 107, V do CP).',
        artigoLei: 'Art. 107, V do Código Penal'
      },
      {
        id: 'fc-penal-02-17',
        pergunta: 'Qual a diferença entre impedimento matrimonial e causa suspensiva para fins do art. 236?',
        resposta: 'O art. 236 incrimina apenas a ocultação de IMPEDIMENTO DIRIMENTE (art. 1.521 do CC), que torna o casamento nulo. As causas suspensivas (art. 1.523 do CC) geram apenas regime de separação obrigatória de bens e não configuram crime!',
        artigoLei: 'Arts. 1.521 e 1.523 do CC / Art. 236 do CP'
      },
      {
        id: 'fc-penal-02-18',
        pergunta: 'Quando se dá o momento consumativo do crime do art. 236?',
        resposta: 'A doutrina majoritária entende que o crime se consuma com a celebração do casamento viciado, ficando sua punibilidade e persecução sujeitas à condição resolutiva da sentença anulatória cível transitada.',
        artigoLei: 'Art. 236 do Código Penal'
      }
    ],
    questoes: [
      {
        id: 'q-penal-02-01',
        tipo: 'definicao',
        tema: 'Direito Penal · Condição Objetiva de Procedibilidade',
        enunciado: 'Nos termos expressos do Código Penal, o crime de induzimento a erro essencial e ocultação de impedimento (art. 236) subordina a propositura da ação penal a qual requisito específico?',
        alternativas: [
          { letra: 'A', texto: 'À autorização expressa do Procurador-Geral de Justiça.' },
          { letra: 'B', texto: 'Ao trânsito em julgado da sentença cível que, por motivo de erro ou impedimento, anule o casamento.' },
          { letra: 'C', texto: 'À decretação cautelar de separação de corpos no juízo de família.' },
          { letra: 'D', texto: 'Ao laudo pericial atestando a enfermidade grave do réu.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O parágrafo único do art. 236 do CP é textual: "A ação penal não pode ser intentada senão depois de transitar em julgado a sentença que, por motivo de erro ou impedimento, anule o casamento". Essa é uma clássica condição objetiva de procedibilidade.',
        fundamentoLegal: 'Art. 236, parágrafo único, do Código Penal'
      },
      {
        id: 'q-penal-02-02',
        tipo: 'introdutoria',
        tema: 'Direito Penal · Ação Penal Privada Personalíssima',
        enunciado: 'Sobre a titularidade da ação penal no crime do art. 236 do Código Penal (induzimento a erro essencial e ocultação de impedimento), assinale a opção correta:',
        alternativas: [
          { letra: 'A', texto: 'É pública incondicionada privativa do Ministério Público.' },
          { letra: 'B', texto: 'É pública condicionada à representação de qualquer parente até o 2º grau.' },
          { letra: 'C', texto: 'É de iniciativa privada personalíssima, cabendo exclusivamente ao cônjuge enganado.' },
          { letra: 'D', texto: 'É pública subsidiária da privada no prazo decadencial de 30 dias.' }
        ],
        respostaCorreta: 'C',
        comentario: 'O crime do art. 236 do CP é hipótese de ação penal privada personalíssima no ordenamento brasileiro. Apenas o cônjuge vítima do induzimento ou ocultação pode oferecer queixa-crime, não se transferindo a terceiros.',
        fundamentoLegal: 'Art. 236, parágrafo único, do Código Penal'
      },
      {
        id: 'q-penal-02-03',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Prazo Decadencial',
        enunciado: 'Patrícia casou-se com Guilherme em janeiro de 2024. Em junho de 2024, descobriu que Guilherme havia ocultado ser irmão biológico de seu pai (impedimento de parentesco por consanguinidade). Patrícia ajuizou ação anulatória, obtendo sentença de procedência transitada em julgado em 10 de outubro de 2025. O prazo decadencial para Patrícia ajuizar a queixa-crime contra Guilherme expira em:',
        alternativas: [
          { letra: 'A', texto: '6 meses contados da celebração do casamento (julho de 2024).' },
          { letra: 'B', texto: '6 meses contados do conhecimento do fato por Patrícia (dezembro de 2024).' },
          { letra: 'C', texto: '6 meses contados do trânsito em julgado da sentença anulatória civil (10 de abril de 2026).' },
          { letra: 'D', texto: 'O crime prescreve imediatamente no dia seguinte ao trânsito da decisão cível.' }
        ],
        respostaCorreta: 'C',
        comentario: 'A decadência do direito de queixa no art. 236 inicia seu cômputo da data em que transita em julgado a sentença anulatória, pois até aquele momento a vítima estava impedida por lei de ajuizar a queixa (art. 236, p. único c/c art. 38 do CPP).',
        fundamentoLegal: 'Art. 236, parágrafo único c/c art. 38 do CPP'
      },
      {
        id: 'q-penal-02-04',
        tipo: 'pegadinha',
        tema: 'Direito Penal · Conflito Aparente de Normas (235 vs 236)',
        enunciado: 'Felipe contrai casamento civil com Larissa ocultando deliberadamente que já era formalmente casado perante o Registro Civil com Beatriz. Felipe cometeu o crime de:',
        alternativas: [
          { letra: 'A', texto: 'Induzimento a erro essencial e ocultação de impedimento (art. 236 do CP).' },
          { letra: 'B', texto: 'Bigamia (art. 235 do CP).' },
          { letra: 'C', texto: 'Ambos os crimes em concurso formal imperfeito.' },
          { letra: 'D', texto: 'Crime de estelionato afetivo em concurso material com falsidade.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O art. 236 do CP ressalva expressamente: "ocultando impedimento que NÃO seja casamento anterior". Havendo casamento anterior válido, o tipo especial e exclusivo é a Bigamia (art. 235 do CP).',
        fundamentoLegal: 'Art. 235 e Art. 236 do Código Penal'
      },
      {
        id: 'q-penal-02-05',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Divórcio x Anulação',
        enunciado: 'Thiago casou-se com Flávia omitindo que fora condenado definitivamente por estupro de vulnerável no passado. Após 3 meses de casados, Flávia descobre a ficha criminal de Thiago. Magoada, Flávia opta por ajuizar imediatamente um divórcio consensual para se livrar do vínculo com rapidez. Três meses após o divórcio, Flávia contrata advogado para oferecer queixa-crime contra Thiago com base no art. 236 do CP. Nessa situação:',
        alternativas: [
          { letra: 'A', texto: 'A queixa-crime deve ser rejeitada, pois ausente a condição de procedibilidade indispensável (sentença que anule o casamento).' },
          { letra: 'B', texto: 'A queixa deve ser recebida normalmente, pois o divórcio tem os mesmos efeitos práticos de uma anulação.' },
          { letra: 'C', texto: 'O Ministério Público deve assumir o polo ativo da demanda como ação pública incondicionada.' },
          { letra: 'D', texto: 'Thiago deve ser condenado com perdão judicial facultativo.' }
        ],
        respostaCorreta: 'A',
        comentario: 'O divórcio dissolve um casamento válido; não o anula. O parágrafo único do art. 236 exige expressamente sentença judicial transitada em julgado que declare NULO ou ANULE o casamento. Na sua falta, falta condição da ação penal.',
        fundamentoLegal: 'Art. 236, parágrafo único, do CP e art. 395, II do CPP'
      },
      {
        id: 'q-penal-02-06',
        tipo: 'definicao',
        tema: 'Direito Penal · Elementos do Erro Essencial',
        enunciado: 'Segundo a doutrina e o Código Civil (art. 1.557), constitui erro essencial sobre a pessoa do outro cônjuge capaz de configurar o art. 236 do CP:',
        alternativas: [
          { letra: 'A', texto: 'A mera divergência quanto ao padrão de vida econômico-financeiro dos sogros.' },
          { letra: 'B', texto: 'A ignorância anterior de defeito físico irremediável ou moléstia grave transmissível capaz de pôr em risco a saúde do outro cônjuge ou de sua prole.' },
          { letra: 'C', texto: 'A mudança de time de futebol ou de orientação religiosa após a lua de mel.' },
          { letra: 'D', texto: 'A reprovação em exame da OAB ou concurso público prometido antes do noivado.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O erro essencial tem contornos jurídicos estritos definidos no art. 1.557 do Código Civil, abarcando identidade, honra, defeito físico irremediável ou moléstia grave e transmissível preexistente.',
        fundamentoLegal: 'Art. 1.557 do Código Civil e Art. 236 do Código Penal'
      },
      {
        id: 'q-penal-02-07',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Morte do Cônjuge Ofendido e Legitimidade',
        enunciado: 'Roberto foi vítima de ocultação de impedimento matrimonial ao casar-se com Camila. Após obter a anulação civil do casamento transitada em julgado, Roberto faleceu subitamente de infarto antes de ajuizar a queixa-crime. Os pais de Roberto pretendem ingressar com a queixa-crime criminal contra Camila. Nesse cenário:',
        alternativas: [
          { letra: 'A', texto: 'Os genitores podem ajuizar a ação em até 60 dias com base no rol do art. 31 do CPP.' },
          { letra: 'B', texto: 'Não é possível a propositura da queixa-crime, pois a ação penal do art. 236 é personalíssima, extinguindo-se o direito com a morte da vítima.' },
          { letra: 'C', texto: 'O Ministério Público assume obrigatoriamente a titularidade por sucessão processual.' },
          { letra: 'D', texto: 'Camila deve ser processada perante a Vara da Infância e Juventude.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O crime do art. 236 constitui ação penal privada personalíssima. Com a morte do cônjuge ofendido antes da queixa, extingue-se a punibilidade, sendo inaplicável a sucessão do art. 31 do CPP.',
        fundamentoLegal: 'Art. 236, parágrafo único do CP e art. 107, IV do CP'
      },
      {
        id: 'q-penal-02-08',
        tipo: 'pegadinha',
        tema: 'Direito Penal · Causas Suspensivas x Impedimentos',
        enunciado: 'O noivo oculta de sua futura esposa que é viúvo e que não realizou o inventário dos bens do casamento anterior com partilha aos herdeiros (causa suspensiva do art. 1.523, I do CC). A conduta tipifica o crime do art. 236 do Código Penal?',
        alternativas: [
          { letra: 'A', texto: 'Sim, pois qualquer vício no processo de habilitação constitui crime contra a família.' },
          { letra: 'B', texto: 'Não, pois o art. 236 pune apenas a ocultação de impedimento dirimente (art. 1.521 do CC), não abrangendo meras causas suspensivas da celebração.' },
          { letra: 'C', texto: 'Sim, sujeitando o infrator à perda da herança em favor do Estado.' },
          { letra: 'D', texto: 'Configura o crime de apropriação indébita familiar previdenciária.' }
        ],
        respostaCorreta: 'B',
        comentario: 'As causas suspensivas (art. 1.523 do CC) não impedem a validade intrínseca do casamento, gerando apenas a imposição do regime da separação obrigatória de bens. O tipo do art. 236 exige ocultação de impedimento matrimonial que dê causa à anulação/nulidade.',
        fundamentoLegal: 'Art. 1.521 e 1.523 do CC c/c art. 236 do CP'
      },
      {
        id: 'q-penal-02-09',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Prescrição e Questão Prejudicial',
        enunciado: 'A ação anulatória de casamento fundada em erro essencial demorou 5 anos tramitando na Justiça Cível até o trânsito em julgado. A defesa no processo penal alegou que o crime de detenção de 2 anos já estaria prescrito pelo decurso de tempo desde o casamento. A alegação defensiva procede?',
        alternativas: [
          { letra: 'A', texto: 'Sim, a prescrição da pretensão punitiva é fatal e conta-se ininterruptamente do fato.' },
          { letra: 'B', texto: 'Não, pois o curso da prescrição fica suspenso enquanto não resolvida a questão prejudicial cível heterogênea da qual depende o reconhecimento do crime.' },
          { letra: 'C', texto: 'Sim, cabendo indenização por dano moral ao acusado pela mora do Estado.' },
          { letra: 'D', texto: 'Não, porque os crimes do Código Penal prescrevem em prazo fixo de 20 anos.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O art. 116, I do CP prevê a suspensão do prazo prescricional enquanto não resolvida, em outro processo, questão prejudicial de que dependa o reconhecimento da existência do crime (a sentença de anulação cível).',
        fundamentoLegal: 'Art. 116, inciso I, do Código Penal'
      },
      {
        id: 'q-penal-02-10',
        tipo: 'definicao',
        tema: 'Direito Penal · Procedimento e Lei 9.099/95',
        enunciado: 'Considerando que o art. 236 comina pena de detenção de 6 meses a 2 anos, assinale a consequência processual adequada quanto ao rito e benefícios legais:',
        alternativas: [
          { letra: 'A', texto: 'Adota-se o rito do tribunal do júri popular.' },
          { letra: 'B', texto: 'Constitui infração de menor potencial ofensivo, admitindo a transação penal e a conciliação nos Juizados Especiais Criminais.' },
          { letra: 'C', texto: 'O réu não tem direito a nenhum benefício despenalizador por se tratar de crime contra a família.' },
          { letra: 'D', texto: 'O processo segue o rito ordinário com prisão preventiva obrigatória.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Infrações cuja pena máxima não seja superior a 2 anos submetem-se ao rito sumaríssimo da Lei 9.099/95, comportando conciliação, transação penal (proposta pelo querelante ou MP) e suspensão condicional do processo.',
        fundamentoLegal: 'Art. 61 da Lei 9.099/95 e Art. 236 do CP'
      },
      {
        id: 'q-penal-02-11',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Concurso de Pessoas e Cumplicidade',
        enunciado: 'Márcia ajudou ativamente seu filho Gustavo a ocultar de sua futura noiva que Gustavo era seu irmão unilateral por parte de pai, falsificando certidões de família para que o casamento ocorresse. O casamento foi celebrado e posteriormente anulado no cível com trânsito em julgado. Diante do concurso de pessoas:',
        alternativas: [
          { letra: 'A', texto: 'Márcia está isenta de pena pela escusa absolutória de parentesco.' },
          { letra: 'B', texto: 'Márcia responde como partícipe do crime do art. 236 do Código Penal em concurso com seu filho.' },
          { letra: 'C', texto: 'Apenas Gustavo pode ser punido por ser o cônjuge celebrante.' },
          { letra: 'D', texto: 'A conduta de Márcia é atípica na esfera penal, cabendo apenas reparação cível.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Quem, de qualquer modo, concorre para o crime incide nas penas a este cominadas (art. 29 do CP). O terceiro que auxilia dolosamente na ocultação do impedimento responde como partícipe do art. 236.',
        fundamentoLegal: 'Art. 29 c/c art. 236 do Código Penal'
      },
      {
        id: 'q-penal-02-12',
        tipo: 'pegadinha',
        tema: 'Direito Penal · Renúncia e Perdão do Cônjuge',
        enunciado: 'Após o trânsito em julgado da sentença anulatória do casamento por erro essencial, o cônjuge ofendido reata informalmente a convivência com o ex-consorte e declara em documento assinado que o perdoa de qualquer ofensa, abrindo mão de medidas criminais. Posteriormente, após novo desentendimento, protocola queixa-crime criminal dentro do prazo de 6 meses. O magistrado deve:',
        alternativas: [
          { letra: 'A', texto: 'Receber a queixa, pois o direito penal é indisponível aos particulares.' },
          { letra: 'B', texto: 'Rejeitar a queixa em razão da renúncia tácita/expressa ao direito de queixa, causa de extinção da punibilidade.' },
          { letra: 'C', texto: 'Submeter o processo à mediação de família compulsória.' },
          { letra: 'D', texto: 'Condenar o querelado com diminuição de pena em dois terços.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Na ação penal de iniciativa privada, a renúncia prévia expressa ou tácita ao direito de queixa extingue a punibilidade nos termos do art. 104 e art. 107, V do Código Penal, impedindo a posterior propositura da queixa.',
        fundamentoLegal: 'Art. 104 e Art. 107, inciso V, do Código Penal'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AULA 01: DIREITO ADMINISTRATIVO · ORIGENS DO DIREITO ADMINISTRATIVO
  // 18 Flashcards + 12 Questões (Baseado nas 38 etapas reais)
  // ─────────────────────────────────────────────────────────────────────────────
  'admin-01-01': {
    aulaId: 'admin-01-01',
    titulo: 'Origens do Direito Administrativo',
    flashcards: [
      {
        id: 'fc-admin-01-01',
        pergunta: 'Em qual contexto histórico e país surge formalmente o Direito Administrativo como ramo autônomo?',
        resposta: 'Surge na França, no final do século XVIII e início do século XIX, intimamente associado à consolidação do Estado de Direito pós-Revolução Francesa de 1789.',
        artigoLei: 'Evolução histórica do Estado de Direito francês',
        dicaPratica: 'O Direito Administrativo nasce como instrumento de limitação jurídica do poder estatal e garantia dos cidadãos.'
      },
      {
        id: 'fc-admin-01-02',
        pergunta: 'O que caracteriza o Estado de Direito na relação entre Administração Pública e administrados?',
        resposta: 'A sujeição do próprio Estado à lei, garantindo segurança jurídica aos cidadãos contra arbítrios do soberano e substituindo a vontade pessoal do governante pela supremacia da lei.',
        artigoLei: 'Princípio do Estado Democrático de Direito (art. 1º da CF/88)',
        dicaPratica: 'No absolutismo o Rei não errava ("the King can do no wrong"); no Estado de Direito, o Estado é responsabilizável.'
      },
      {
        id: 'fc-admin-01-03',
        pergunta: 'Quais são os quatro postulados fundamentais do Estado de Direito destacados na gênese administrativa?',
        resposta: '1) Legalidade estrita dos atos estatais; 2) Separação dos Poderes; 3) Reconhecimento e garantia dos direitos fundamentais; 4) Responsabilidade jurídica do Estado por seus atos lesivos.',
        artigoLei: 'Fundamentos constitucionais do Estado de Direito',
        dicaPratica: 'Esses quatro postulados retiraram a imunidade arbitrária da Coroa e criaram o controle dos atos de gestão.'
      },
      {
        id: 'fc-admin-01-04',
        pergunta: 'Qual a distinção essencial entre a Legalidade Privada e a Legalidade Pública?',
        resposta: 'A legalidade privada baseia-se na autonomia da vontade (o particular pode fazer tudo o que a lei não proíbe). A legalidade pública é subordinação estrita (o administrador só pode fazer o que a lei expressamente autoriza ou determina).',
        artigoLei: 'Art. 5º, II e Art. 37, caput da CF/88',
        dicaPratica: 'O administrador público não possui liberdade de escolha subjetiva fora dos limites balizados pela lei.'
      },
      {
        id: 'fc-admin-01-05',
        pergunta: 'O que caracterizava a Administração Pública sob o modelo de Estado Patrimonialista?',
        resposta: 'A completa confusão entre os bens públicos da Coroa e os bens privados do monarca. Cargos públicos eram vendidos, herdados ou concedidos como benesses e favores pessoais.',
        artigoLei: 'Evolução dos modelos de administração pública',
        dicaPratica: 'No patrimonialismo inexiste a noção republicana de res publica (coisa do povo).'
      },
      {
        id: 'fc-admin-01-06',
        pergunta: 'Qual foi a ruptura imposta pelo Modelo Burocrático weberiano sobre o modelo patrimonialista?',
        resposta: 'Instituiu a impessoalidade, hierarquia funcional clara, meritocracia com critérios objetivos de seleção (concursos), separação estrita entre o cargo e a pessoa física e apego à formalidade legal.',
        artigoLei: 'Teoria Burocrática de Max Weber / Art. 37 da CF/88',
        dicaPratica: 'O modelo burocrático nasceu para combater o compadrio e a corrupção patrimonialista.'
      },
      {
        id: 'fc-admin-01-07',
        pergunta: 'Qual a relevância da Lei Francesa de 24 de maio de 1872 na história da jurisdição administrativa?',
        resposta: 'Consagrou a passagem da "justiça retida" para a "justiça delegada", atribuindo ao Conselho de Estado francês competência soberana para julgar os litígios administrativos sem necessidade de chancela do Chefe de Estado.',
        artigoLei: 'Lei de 24 de maio de 1872 (França) - Conselho de Estado',
        dicaPratica: 'Marco da jurisdição contenciosa administrativa autônoma e da independência dos tribunais administrativos franceses.'
      },
      {
        id: 'fc-admin-01-08',
        pergunta: 'Por que se diz que o Direito Administrativo francês original foi construído pela jurisprudência?',
        resposta: 'Porque não nasceu de um Código civil ou penal pronto, mas sim dos acórdãos e precedentes do Conselho de Estado francês (Tribunal de Conflitos e Conseil d’État), que moldaram seus conceitos e prerrogativas.',
        artigoLei: 'Origem jurisprudencial do direito administrativo',
        dicaPratica: 'O célebre caso Blanco (1873) é o exemplo maior dessa construção pretoriana jurisprudencial.'
      },
      {
        id: 'fc-admin-01-09',
        pergunta: 'Qual foi o marco definitivo estabelecido pelo famoso acórdão do Caso Blanco (1873) na França?',
        resposta: 'Reconheceu que a responsabilidade do Estado pelos danos causados pelos serviços públicos não se rege pelas regras gerais do Código Civil privado, mas sim por regras especiais e autônomas do Direito Administrativo.',
        artigoLei: 'Tribunal de Conflitos Francês (Arrêt Blanco, 8 de fevereiro de 1873)',
        dicaPratica: 'O caso Blanco é considerado pela doutrina mundial a certidão de nascimento oficial do Direito Administrativo moderno.'
      },
      {
        id: 'fc-admin-01-10',
        pergunta: 'Por que a Revolução Francesa desconfiava dos juízes civis comuns em relação à Administração Pública?',
        resposta: 'Porque os juízes do Antigo Regime (os Parlamentos judiciais) freavam e sabotavam as reformas populares. Assim, a Lei de 1790 proibiu os juízes comuns de se imiscuírem nos atos da Administração.',
        artigoLei: 'Lei de 16-24 de agosto de 1790 (França)',
        dicaPratica: 'Dessa desconfiança surgiu o sistema de dualidade de jurisdição (tribunal comum vs. tribunal administrativo).'
      },
      {
        id: 'fc-admin-01-11',
        pergunta: 'Qual a diferença entre o sistema de Jurisdição Dual (francês) e o sistema de Jurisdição Una (adotado no Brasil)?',
        resposta: 'Na jurisdição dual há duas ordens judiciais independentes (comum e administrativa). No Brasil vigora a Jurisdição Una (art. 5º, XXXV da CF - sistema inglês): somente o Poder Judiciário tem competência para decidir com força de coisa julgada material.',
        artigoLei: 'Art. 5º, XXXV da CF/88 (Princípio da Inafastabilidade da Jurisdição)',
        dicaPratica: 'As decisões dos órgãos administrativos brasileiros não têm força de coisa julgada judicial.'
      },
      {
        id: 'fc-admin-01-12',
        pergunta: 'Em que consistem as Prerrogativas Públicas concedidas à Administração nas suas origens?',
        resposta: 'São poderes especiais exorbitantes ao direito privado concedidos ao Estado para que ele possa sobrepor o interesse público aos interesses egoísticos individuais (ex.: presunção de veracidade, autoexecutoriedade).',
        artigoLei: 'Regime Jurídico Administrativo',
        dicaPratica: 'Prerrogativas não são privilégios do administrador, mas ferramentas para a defesa da coletividade.'
      },
      {
        id: 'fc-admin-01-13',
        pergunta: 'Qual o contraponto indispensável às prerrogativas públicas estatais no Estado de Direito?',
        resposta: 'As sujeições administrativas: limitações expressas impostas pela lei e pelo controle de legalidade que impedem o Estado de agir arbitrariamente ou ferir os direitos fundamentais dos cidadãos.',
        artigoLei: 'Binômio Prerrogativas e Sujeições',
        dicaPratica: 'O regime jurídico-administrativo equilibra autoridade estatal (prerrogativas) com liberdade cidadã (sujeições).'
      },
      {
        id: 'fc-admin-01-14',
        pergunta: 'Por que delimitar as funções estatais foi crucial para a formação do Direito Administrativo?',
        resposta: 'Para garantir a especialização funcional, previsibilidade das competências e contenção mútua dos poderes, impedindo que a execução administrativa invadisse o mérito legislativo ou o julgamento jurisdicional.',
        artigoLei: 'Teoria da Separação dos Poderes de Montesquieu / Art. 2º da CF/88',
        dicaPratica: 'A função administrativa é típica do Executivo, mas exercida atipicamente pelo Judiciário e Legislativo.'
      },
      {
        id: 'fc-admin-01-15',
        pergunta: 'Qual a relação histórica entre o advento do Serviço Público e o crescimento do Direito Administrativo?',
        resposta: 'Com a evolução do Estado Liberal para o Estado Social (Welfare State), o Estado passou a prestar diretamente serviços de educação, saúde e infraestrutura, expandindo enormemente a atuação administrativa.',
        artigoLei: 'Evolução do Estado de Direito',
        dicaPratica: 'O serviço público substituiu o puro poder de polícia repressivo pelo fomento e prestação positiva aos cidadãos.'
      },
      {
        id: 'fc-admin-01-16',
        pergunta: 'Como o princípio da publicidade administrativa se relaciona com a superação do absolutismo?',
        resposta: 'No absolutismo governava-se sob o manto do segredo de Estado (arcana imperii). Na República, a publicidade é a regra essencial para permitir que o cidadão fiscalize o uso do dinheiro e do poder público.',
        artigoLei: 'Art. 37, caput da CF/88',
        dicaPratica: 'A transparência é a maior vacina contra o renascimento de práticas patrimonialistas.'
      },
      {
        id: 'fc-admin-01-17',
        pergunta: 'O que restou das origens francesas no Direito Administrativo contemporâneo brasileiro?',
        resposta: 'A concepção autônoma do regime jurídico-administrativo, as prerrogativas de autoexecutoriedade e presunção de legitimidade dos atos públicos e o dever de reparação objetiva por danos causados a terceiros.',
        artigoLei: 'Doutrina de Direito Administrativo e art. 37, § 6º da CF/88',
        dicaPratica: 'O Brasil importou o regime material de direito público da França, mas manteve a jurisdição una do modelo anglo-saxão.'
      },
      {
        id: 'fc-admin-01-18',
        pergunta: 'Por que o Direito Administrativo não possui um Código unificado no Brasil até os dias de hoje?',
        resposta: 'Devido à autonomia político-administrativa dos entes federativos (União, Estados, DF e Municípios), que possuem competência concorrente e própria para legislar sobre seus respectivos servidores e estruturas administrativas.',
        artigoLei: 'Art. 18 e Art. 24 da CF/88',
        dicaPratica: 'O Direito Administrativo brasileiro é descentralizado em leis esparsas (Lei 8.112, Lei 8.666/14.133, Lei 9.784, etc.).'
      }
    ],
    questoes: [
      {
        id: 'q-admin-01-01',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Origem Histórica e Estado de Direito',
        enunciado: 'O nascimento do Direito Administrativo como ciência e subsistema jurídico dotado de regras autônomas e derrogatórias do direito privado vincula-se historicamente:',
        alternativas: [
          { letra: 'A', texto: 'Ao apogeu das monarquias absolutistas europeias sob a teoria da imunidade régia.' },
          { letra: 'B', texto: 'À consolidação do Estado de Direito após a Revolução Francesa de 1789, exigindo a submissão do Estado à lei.' },
          { letra: 'C', texto: 'À publicação do Código Civil de Napoleão de 1804 para regular todas as relações jurídicas.' },
          { letra: 'D', texto: 'Ao surgimento das primeiras corporações mercantis na Itália renascentista.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O Direito Administrativo surge com a gênese do Estado de Direito (Revolução Francesa), momento em que os atos da Administração passam a ser subordinados à lei em vez da vontade tirânica do monarca.',
        fundamentoLegal: 'Evolução histórica do Estado de Direito'
      },
      {
        id: 'q-admin-01-02',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Caso Blanco e Autonomia Disciplinar',
        enunciado: 'Na França do século XIX (1873), uma menina chamada Agnès Blanco foi atropelada e ferida por um vagão de tabaco de uma fábrica estatal francesa. Seu pai acionou a Justiça. O Tribunal de Conflitos francês decidiu que:',
        alternativas: [
          { letra: 'A', texto: 'A Administração era imune e não podia indenizar súditos em nenhuma circunstância.' },
          { letra: 'B', texto: 'O caso deveria ser julgado pelas regras especiais do Direito Administrativo, autônomas em relação ao Código Civil privado.' },
          { letra: 'C', texto: 'O operário condutor do vagão responderia pessoalmente sem qualquer vínculo com o Estado.' },
          { letra: 'D', texto: 'Deveria ser aplicada a responsabilidade penal sem repercussão indenizatória patrimonial.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O emblemático Caso Blanco (Arrêt Blanco - 1873) consagrou a autonomia do Direito Administrativo, determinando que os litígios decorrentes dos serviços públicos regem-se por regras especiais de direito público e não pelo direito civil comum.',
        fundamentoLegal: 'Tribunal de Conflitos Francês, Arrêt Blanco (1873)'
      },
      {
        id: 'q-admin-01-03',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Legalidade Pública versus Privada',
        enunciado: 'Sob a ótica dos postulados fundamentais do Direito Administrativo nascido com o Estado de Direito, assinale a opção que reflete a regra da legalidade na Administração Pública:',
        alternativas: [
          { letra: 'A', texto: 'A Administração Pública possui autonomia da vontade e pode praticar tudo o que a lei não proíba expressamente.' },
          { letra: 'B', texto: 'O administrador público subordina-se estritamente à lei, somente podendo agir quando houver expressa autorização ou imposição legal.' },
          { letra: 'C', texto: 'O particular está adstrito à mesma regra da Administração, só podendo agir mediante expressa licença legal.' },
          { letra: 'D', texto: 'A conveniência política do governante afasta a exigência de base legal formal.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A legalidade pública é princípio de subordinação estrita à lei (princípio da indisponibilidade e conformidade legal): enquanto o cidadão pode fazer tudo o que a lei não proíbe, o administrador só atua conforme a lei determina ou autoriza.',
        fundamentoLegal: 'Art. 5º, II e Art. 37, caput da CF/88'
      },
      {
        id: 'q-admin-01-04',
        tipo: 'introdutoria',
        tema: 'Direito Administrativo · Transição do Patrimonialismo para a Burocracia',
        enunciado: 'O modelo de Administração Burocrática consolidado no Estado moderno teve como principal objetivo histórico superar o modelo patrimonialista. Dentre os elementos definidores da burocracia, destaca-se:',
        alternativas: [
          { letra: 'A', texto: 'A hereditariedade e comercialização privada dos cargos públicos.' },
          { letra: 'B', texto: 'A impessoalidade e a separação estrita entre a esfera pública do cargo e o patrimônio pessoal do servidor.' },
          { letra: 'C', texto: 'O livre arbítrio do gestor para conceder privilégios a amigos e aliados políticos.' },
          { letra: 'D', texto: 'A dispensa de concurso público para todas as funções do Estado.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A administração burocrática rompeu com o patrimonialismo justamente ao impor a impessoalidade, o profissionalismo, a hierarquia funcional e a estrita separação entre a coisa pública e o patrimônio particular do agente.',
        fundamentoLegal: 'Teoria Burocrática do Estado de Direito'
      },
      {
        id: 'q-admin-01-05',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Jurisdição Una no Brasil',
        enunciado: 'Um servidor público federal teve sua aposentadoria cancelada por decisão terminativa do Tribunal de Contas e de órgão ministerial recursal administrativo. Inconformado com a ilegalidade do ato, o servidor ajuíza ação perante a Justiça Federal. O órgão público contesta alegando que a matéria já transitou em julgado na via administrativa. O juiz deve:',
        alternativas: [
          { letra: 'A', texto: 'Extinguir o processo sem resolução do mérito, pois o Brasil adota a jurisdição contenciosa administrativa dual.' },
          { letra: 'B', texto: 'Processar e julgar a ação, pois no Brasil vigora o princípio da inafastabilidade da jurisdição una (art. 5º, XXXV da CF).' },
          { letra: 'C', texto: 'Remeter os autos ao Conselho de Estado brasileiro para ratificação.' },
          { letra: 'D', texto: 'Julgar improcedente por presunção absoluta de infalibilidade dos tribunais de contas.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Diferente da França (sistema dual), o Brasil adota o sistema inglês de jurisdição una (art. 5º, XXXV da CF). Decisões administrativas não fazem coisa julgada material perante o Poder Judiciário.',
        fundamentoLegal: 'Art. 5º, inciso XXXV da Constituição Federal de 1988'
      },
      {
        id: 'q-admin-01-06',
        tipo: 'pegadinha',
        tema: 'Direito Administrativo · Lei Francesa de 1872 e Justiça Delegada',
        enunciado: 'A Lei francesa de 24 de maio de 1872 representou um divisor de águas no Conselho de Estado francês porque operou a transição da:',
        alternativas: [
          { letra: 'A', texto: 'Justiça comum para a jurisdição inquisitorial militar.' },
          { letra: 'B', texto: 'Justiça retida para a justiça delegada, outorgando ao Conselho de Estado autonomia para julgar em nome do povo sem chancela do governante.' },
          { letra: 'C', texto: 'Responsabilidade objetiva do Estado para a irresponsabilidade civil da Administração.' },
          { letra: 'D', texto: 'Criação dos juizados de pequenas causas cíveis.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Na justiça retida o Conselho de Estado apenas opinava e o Chefe do Executivo decidia. Com a Lei de 1872 passou à justiça delegada, julgando de forma soberana e definitiva os litígios administrativos.',
        fundamentoLegal: 'Lei de 24 de maio de 1872 (França)'
      },
      {
        id: 'q-admin-01-07',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Regime Jurídico Administrativo',
        enunciado: 'O núcleo conceitual do regime jurídico-administrativo construído desde as origens do Direito Administrativo assenta-se no binômio indissociável de:',
        alternativas: [
          { letra: 'A', texto: 'Liberdade ampla contratual e imunidade de jurisdição.' },
          { letra: 'B', texto: 'Prerrogativas de autoridade pública e sujeições especiais em favor do interesse público.' },
          { letra: 'C', texto: 'Soberania absolutista e segredo de Estado.' },
          { letra: 'D', texto: 'Privatização integral de serviços e desregulamentação.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O regime jurídico-administrativo conjuga prerrogativas (poderes exorbitantes para fazer valer o interesse público) e sujeições (deveres e restrições legais para proteger as liberdades dos cidadãos).',
        fundamentoLegal: 'Doutrina consolidada de Direito Administrativo'
      },
      {
        id: 'q-admin-01-08',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Poder de Polícia e Autoexecutoriedade',
        enunciado: 'Fiscais sanitários municipais flagraram um restaurante comercializando toneladas de carne bovina em avançado estado de decomposição. Com base no poder de polícia originado no regime administrativo, os fiscais apreenderam e inutilizaram a mercadoria de imediato. A atuação dos fiscais:',
        alternativas: [
          { letra: 'A', texto: 'É nula por não ter aguardado prévia autorização judicial de busca e apreensão.' },
          { letra: 'B', texto: 'É legítima com base no atributo da autoexecutoriedade das prerrogativas administrativas de urgência na proteção da saúde pública.' },
          { letra: 'C', texto: 'Viola a presunção de inocência comercial do comerciante.' },
          { letra: 'D', texto: 'Exigia a concordância unânime da vigilância sanitária estadual e federal.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A autoexecutoriedade é uma das prerrogativas clássicas do Direito Administrativo, permitindo à Administração executar diretamente medidas urgentes sem necessidade de recorrer previamente ao Judiciário quando a lei autorizar ou diante de perigo iminente.',
        fundamentoLegal: 'Atributo da autoexecutoriedade do ato administrativo'
      },
      {
        id: 'q-admin-01-09',
        tipo: 'introdutoria',
        tema: 'Direito Administrativo · Codificação do Direito Administrativo',
        enunciado: 'Diferentemente do Direito Penal e do Direito Civil, no Brasil o Direito Administrativo caracteriza-se pela não codificação. Essa ausência de um Código Administrativo único decorre:',
        alternativas: [
          { letra: 'A', texto: 'De omissão inconstitucional do Congresso Nacional que deve ser suprida pelo Supremo Tribunal Federal.' },
          { letra: 'B', texto: 'Da estrutura federativa descentralizada, na qual cada ente político (União, Estados, DF e Municípios) possui competência para organizar sua própria administração.' },
          { letra: 'C', texto: 'Da proibição expressa contida nas cláusulas pétreas da Constituição Federal.' },
          { letra: 'D', texto: 'Do fato de o Brasil não adotar o Direito Administrativo como ramo autônomo.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O pacto federativo confere autonomia a cada ente político para estruturar seus órgãos, regimes de servidores e processos, tornando inviável um código único e exaustivo que regule todos os municípios, estados e a União simultaneamente.',
        fundamentoLegal: 'Art. 18 e Art. 24 da Constituição Federal de 1988'
      },
      {
        id: 'q-admin-01-10',
        tipo: 'pegadinha',
        tema: 'Direito Administrativo · Teoria dos Parlamentos e Separação de Funções',
        enunciado: 'A vedação expressa imposta aos juízes franceses de se intrometerem na administração de Estado (Lei de 1790) deveu-se precipuamente:',
        alternativas: [
          { letra: 'A', texto: 'À inexistência de advogados na França revolucionária.' },
          { letra: 'B', texto: 'Ao receio justificado dos revolucionários de que juízes conservadores paralisassem as transformações sociais em favor da burguesia nascente.' },
          { letra: 'C', texto: 'À subordinação do Judiciário ao Ministério da Fazenda francês.' },
          { letra: 'D', texto: 'À adoção do sistema de júri popular para todos os atos de governo.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Os Parlamentos do Antigo Regime eram compostos pela nobreza de toga e sabotavam decretos reais de reforma. Por isso os revolucionários franceses proibiram terminantemente os juízes comuns de julgarem atos do Executivo.',
        fundamentoLegal: 'História do Constitucionalismo e Direito Público Francês'
      },
      {
        id: 'q-admin-01-11',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Responsabilidade do Estado e Evolução Histórica',
        enunciado: 'Viatura da Polícia Militar, ao perseguir criminosos em alta velocidade, colide contra veículo particular regularmente estacionado na via pública. Considerando a evolução da responsabilidade do Estado desde a superação da imunidade régia absolutista até o art. 37, § 6º da CF/88:',
        alternativas: [
          { letra: 'A', texto: 'O proprietário do carro nada receberá em razão da teoria feudal de que o soberano não comete atos ilícitos.' },
          { letra: 'B', texto: 'O Estado responde objetivamente pelos danos causados pelo agente público no exercício da função, bastando comprovar nexo de causalidade e o dano.' },
          { letra: 'C', texto: 'O lesado é obrigado a provar que o policial agiu com dolo direto para conseguir reparação.' },
          { letra: 'D', texto: 'A responsabilidade do Estado exige prévia ação penal condenatória transitada em julgado contra o motorista da viatura.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O Estado moderno superou a irresponsabilidade da monarquia absolutista e consagra, no art. 37, § 6º da CF, a responsabilidade civil objetiva na modalidade do risco administrativo pelos atos de seus prepostos.',
        fundamentoLegal: 'Art. 37, § 6º da Constituição Federal de 1988'
      },
      {
        id: 'q-admin-01-12',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Função Administrativa e Exercício Atípico',
        enunciado: 'Sobre o exercício das funções estatais no Estado Democrático de Direito contemporâneo, assinale a assertiva correta:',
        alternativas: [
          { letra: 'A', texto: 'Apenas o Poder Executivo exerce função administrativa, sendo terminantemente proibido a outros poderes realizarem atos de gestão.' },
          { letra: 'B', texto: 'Os Poderes Legislativo e Judiciário exercem a função administrativa de forma atípica quando, por exemplo, realizam licitações ou concedem férias a seus servidores.' },
          { letra: 'C', texto: 'O Poder Judiciário só pode praticar atos administrativos mediante autorização prévia do Ministério da Fazenda.' },
          { letra: 'D', texto: 'A função jurisdicional é exercida tipicamente pelo Poder Executivo nos processos disciplinares.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A função administrativa é típica do Poder Executivo, mas é exercida de forma atípica pelo Poder Legislativo e pelo Poder Judiciário na gestão de seu patrimônio, de seu pessoal e na realização de seus contratos administrativos.',
        fundamentoLegal: 'Teoria da Separação de Poderes / Arts. 2º, 96 e 51 da CF/88'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AULA 02: DIREITO ADMINISTRATIVO · DEFINIÇÕES DO DIREITO ADMINISTRATIVO
  // 18 Flashcards + 12 Questões (Baseado nas 38 etapas reais)
  // ─────────────────────────────────────────────────────────────────────────────
  'admin-01-02': {
    aulaId: 'admin-01-02',
    titulo: 'Definições do Direito Administrativo',
    flashcards: [
      {
        id: 'fc-admin-02-01',
        pergunta: 'Por que a doutrina clássica e moderna afirma que definir o Direito Administrativo não é uma tarefa simples?',
        resposta: 'Porque o Direito Administrativo abrange múltiplas facetas: órgãos, agentes, serviços, prerrogativas, poder de polícia e relações com a sociedade, variando o conceito conforme o critério doutrinário adotado.',
        artigoLei: 'Critérios doutrinários de conceituação',
        dicaPratica: 'Nenhum critério isolado esgota a totalidade do ramo; cada um recorta um ângulo do fenômeno administrativo.'
      },
      {
        id: 'fc-admin-02-02',
        pergunta: 'O que sustenta o Critério da "Puissance Publique" (Poder Público Extrovertido)?',
        resposta: 'Sustenta que o Direito Administrativo é o ramo que rege os atos de autoridade do Estado dotados de imperatividade e prerrogativas exorbitantes, excluindo os atos de mera gestão privada.',
        artigoLei: 'Critério da autoridade / Puissance publique',
        dicaPratica: 'Critério insuficiente porque o Estado também pratica atos de gestão e presta serviços sem usar coerção autoritária.'
      },
      {
        id: 'fc-admin-02-03',
        pergunta: 'Em que se baseia o Critério do Serviço Público (Escola de Bordeaux de Léon Duguit)?',
        resposta: 'Define o Direito Administrativo como o conjunto de normas que disciplina a criação, organização e prestação dos serviços públicos aos cidadãos.',
        artigoLei: 'Escola do Serviço Público (Léon Duguit, Gaston Jèze)',
        dicaPratica: 'O critério pecou pelo excesso de abrangência, pois nem toda atividade estatal é estritamente serviço público.'
      },
      {
        id: 'fc-admin-02-04',
        pergunta: 'Qual a deficiência apontada no Critério do Poder Executivo?',
        resposta: 'Definir o Direito Administrativo como o conjunto de leis que disciplina apenas o Poder Executivo é incompleto, pois o Judiciário e o Legislativo também exercem função administrativa atípica.',
        artigoLei: 'Critério do Poder Executivo (critério orgânico restrito)',
        dicaPratica: 'Licitações e gestão de servidores ocorrem em todos os três Poderes da República.'
      },
      {
        id: 'fc-admin-02-05',
        pergunta: 'O que propõe o Critério das Relações Jurídicas?',
        resposta: 'Conceitua o Direito Administrativo a partir do feixe de relações jurídicas travadas entre o Estado e os particulares ou entre diferentes pessoas jurídicas públicas.',
        artigoLei: 'Critério das relações jurídicas',
        dicaPratica: 'Critério genérico demais, pois o direito civil, penal e tributário também disciplinam relações com o Estado.'
      },
      {
        id: 'fc-admin-02-06',
        pergunta: 'O que dita o Critério Teleológico ou Finalístico?',
        resposta: 'Afirma que o Direito Administrativo é o ramo que disciplina as atividades estatais destinadas à consecução direta dos fins do Estado (bem comum e satisfação das necessidades coletivas).',
        artigoLei: 'Critério teleológico',
        dicaPratica: 'Critério muito abrangente e impreciso, pois todo o ordenamento jurídico busca fins sociais do Estado.'
      },
      {
        id: 'fc-admin-02-07',
        pergunta: 'Em que consiste o Critério Negativo ou Residual na definição do Direito Administrativo?',
        resposta: 'Define o Direito Administrativo por exclusão: é todo o direito público que não é Direito Constitucional, não é Direito Processual, não é Direito Penal e não é Direito Tributário.',
        artigoLei: 'Critério residual / negativo',
        dicaPratica: 'Critério útil pedagogicamente, mas insuficiente por dizer o que o ramo NÃO é, em vez de definir o que ele É.'
      },
      {
        id: 'fc-admin-02-08',
        pergunta: 'Qual é o critério preponderantemente adotado pela doutrina majoritária brasileira?',
        resposta: 'É o Critério da Administração Pública, que concebe o Direito Administrativo como o conjunto de princípios e regras que disciplinam a Administração Pública em seus sentidos subjetivo e objetivo.',
        artigoLei: 'Doutrina de Hely Lopes Meirelles, Maria Sylvia Di Pietro e Celso Antônio Bandeira de Mello',
        dicaPratica: 'É o critério mais técnico e completo adotado nos manuais e bancas de concursos.'
      },
      {
        id: 'fc-admin-02-09',
        pergunta: 'O que significa Administração Pública em Sentido Subjetivo, Orgânico ou Formal?',
        resposta: 'Designa o conjunto de órgãos, agentes e pessoas jurídicas públicas que desempenham as funções administrativas (a máquina pública: quem age).',
        artigoLei: 'Sentido subjetivo / orgânico / formal',
        dicaPratica: 'Responde à pergunta: QUEM exerce a função administrativa?'
      },
      {
        id: 'fc-admin-02-10',
        pergunta: 'O que significa Administração Pública em Sentido Objetivo, Material ou Funcional?',
        resposta: 'Designa a própria atividade administrativa desempenhada pelo Estado: prestação de serviços públicos, poder de polícia, fomento e intervenção econômica (a função administrativa em si).',
        artigoLei: 'Sentido objetivo / material / funcional',
        dicaPratica: 'Responde à pergunta: O QUE é feito pelo Estado?'
      },
      {
        id: 'fc-admin-02-11',
        pergunta: 'Como se diferencia a Administração Pública em sentido amplo da Administração Pública em sentido estrito?',
        resposta: 'Em sentido amplo, abrange a função política/governamental (fixação de metas e diretrizes) e a função administrativa de execução. Em sentido estrito, engloba exclusivamente as funções de execução técnica e operacional.',
        artigoLei: 'Dicotomia Governo versus Administração',
        dicaPratica: 'O Governo comanda com discricionariedade política; a Administração executa com subordinação legal.'
      },
      {
        id: 'fc-admin-02-12',
        pergunta: 'Qual a clássica definição doutrinária de Hely Lopes Meirelles para o Direito Administrativo?',
        resposta: '"Conjunto harmônico de princípios jurídicos que regem os órgãos, os agentes e as atividades públicas tendentes a realizar concreta, direta e imediatamente os fins desejados pelo Estado."',
        artigoLei: 'Conceito clássico de Hely Lopes Meirelles',
        dicaPratica: 'Palavras-chave: direta, concreta e imediatamente (a lei é abstrata; a administração concretiza).'
      },
      {
        id: 'fc-admin-02-13',
        pergunta: 'Como Maria Sylvia Zanella Di Pietro define sinteticamente o Direito Administrativo?',
        resposta: 'Como o ramo do direito público que tem por objeto os órgãos, agentes e pessoas jurídicas administrativas que integram a Administração Pública, a atividade jurídica não contenciosa que exerce e os bens de que se utiliza.',
        artigoLei: 'Doutrina de Maria Sylvia Zanella Di Pietro',
        dicaPratica: 'Enfatiza a atividade jurídica não contenciosa (diferente da atividade do Poder Judiciário).'
      },
      {
        id: 'fc-admin-02-14',
        pergunta: 'Por que a atividade administrativa é qualificada como "não contenciosa"?',
        resposta: 'Porque a Administração decide os processos com base na autotutela, mas suas decisões não formam coisa julgada definitiva perante o Poder Judiciário, diferentemente da jurisdição contenciosa.',
        artigoLei: 'Art. 5º, XXXV da CF/88',
        dicaPratica: 'Apenas os juízes e tribunais exercem jurisdição com força de coisa julgada material irrecorrível.'
      },
      {
        id: 'fc-admin-02-15',
        pergunta: 'O que integra a Administração Pública Direta no ordenamento brasileiro?',
        resposta: 'São os órgãos públicos despersonalizados integrantes da estrutura centralizada das próprias pessoas políticas da Federação: União, Estados, Distrito Federal e Municípios.',
        artigoLei: 'Art. 4º, I do Decreto-Lei 200/1967 c/c art. 37 da CF/88',
        dicaPratica: 'Ministérios e Secretarias são órgãos da Administração Direta (não possuem personalidade jurídica própria).'
      },
      {
        id: 'fc-admin-02-16',
        pergunta: 'O que integra a Administração Pública Indireta no Brasil?',
        resposta: 'São as entidades dotadas de personalidade jurídica própria criadas por descentralização administrativa: Autarquias, Fundações Públicas, Empresas Públicas e Sociedades de Economia Mista.',
        artigoLei: 'Art. 37, XIX da CF/88 e Decreto-Lei 200/1967',
        dicaPratica: 'Autarquias são criadas diretamente por lei específica; as estatais e fundações têm sua criação autorizada por lei.'
      },
      {
        id: 'fc-admin-02-17',
        pergunta: 'Qual a finalidade teleológica primordial da atividade administrativa para a sociedade?',
        resposta: 'Atender com probidade, igualdade e eficácia às necessidades e direitos fundamentais da coletividade, garantindo a coesão social e a concretização das promessas constitucionais de cidadania.',
        artigoLei: 'Art. 1º, II e III e Art. 3º da CF/88',
        dicaPratica: 'O Estado existe para a sociedade, e não a sociedade para servir aos caprichos do Estado.'
      },
      {
        id: 'fc-admin-02-18',
        pergunta: 'O Direito Administrativo regula relações puramente internas ou também relações externas do Estado?',
        resposta: 'Regula ambas: as relações internas de organização, hierarquia e disciplina de agentes e órgãos públicos, e as relações externas travadas entre a Administração e os particulares e concessionárias.',
        artigoLei: 'Relações intraorgânicas e extraorgânicas',
        dicaPratica: 'Abrevia tanto o estatuto do servidor público (interno) quanto os contratos de concessão de rodovias (externo).'
      }
    ],
    questoes: [
      {
        id: 'q-admin-02-01',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Sentido Subjetivo vs. Objetivo',
        enunciado: 'Quando a doutrina jurídica emprega a expressão "Administração Pública" grafada em letras maiúsculas para designar o conjunto de órgãos, agentes públicos e pessoas jurídicas encarregadas da função estatal, está utilizando a acepção em sentido:',
        alternativas: [
          { letra: 'A', texto: 'Objetivo, funcional ou material.' },
          { letra: 'B', texto: 'Subjetivo, orgânico ou formal.' },
          { letra: 'C', texto: 'Teleológico ou puramente econômico.' },
          { letra: 'D', texto: 'Processual contencioso estrito.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O sentido subjetivo (orgânico ou formal) refere-se a QUEM realiza a atividade (os órgãos e agentes públicos). Já o sentido objetivo (material ou funcional) diz respeito à ATIVIDADE desenvolvida.',
        fundamentoLegal: 'Doutrina de Direito Administrativo Constitucional'
      },
      {
        id: 'q-admin-02-02',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Sentido Objetivo ou Material',
        enunciado: 'A prestação de serviços públicos de transporte coletivo, a fiscalização sanitária de alimentos (poder de polícia) e a realização de obras de infraestrutura correspondem à Administração Pública em sentido:',
        alternativas: [
          { letra: 'A', texto: 'Subjetivo ou corporativo.' },
          { letra: 'B', texto: 'Objetivo, material ou funcional.' },
          { letra: 'C', texto: 'Diplomático soberano.' },
          { letra: 'D', texto: 'Exclusivamente judicial.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A atividade administrativa em si (serviço público, polícia administrativa, fomento e intervenção) consubstancia a Administração Pública em sentido objetivo, material ou funcional.',
        fundamentoLegal: 'Classificação doutrinária clássica'
      },
      {
        id: 'q-admin-02-03',
        tipo: 'pegadinha',
        tema: 'Direito Administrativo · Critério do Poder Executivo',
        enunciado: 'Candidato a concurso público sustentou em prova discursiva que "o Direito Administrativo é o ramo que disciplina exclusivamente os atos praticados pelo Poder Executivo". De acordo com a doutrina contemporânea, a afirmação:',
        alternativas: [
          { letra: 'A', texto: 'Está perfeita, pois os Poderes Legislativo e Judiciário não praticam atos administrativos sob nenhuma hipótese.' },
          { letra: 'B', texto: 'Está incorreta, pois os Poderes Legislativo e Judiciário também exercem função administrativa atípica ao gerirem seus servidores, orçamento e contratações.' },
          { letra: 'C', texto: 'Só é verdadeira nos regimes parlamentaristas europeus.' },
          { letra: 'D', texto: 'Depende de prévia declaração de constitucionalidade pelo STF.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O critério do Poder Executivo é falho porque todos os Poderes exercem a função administrativa: o Executivo de forma típica, e o Legislativo e Judiciário de forma atípica (ex.: licitações de tribunais, concessão de férias a assessores do Senado).',
        fundamentoLegal: 'Arts. 2º, 51, 52 e 96 da CF/88'
      },
      {
        id: 'q-admin-02-04',
        tipo: 'introdutoria',
        tema: 'Direito Administrativo · Critério da Puissance Publique',
        enunciado: 'O critério da Puissance Publique (Escola da Autoridade Pública) conceituou o Direito Administrativo como o ramo que cuida exclusivamente dos atos de império e coerção do Estado. A principal crítica a essa definição é que:',
        alternativas: [
          { letra: 'A', texto: 'O Estado nunca utiliza prerrogativas de autoridade sobre particulares.' },
          { letra: 'B', texto: 'Desconsidera que a Administração Pública também atua prestando serviços públicos e praticando atos de gestão sem utilizar necessariamente a coerção autoritária.' },
          { letra: 'C', texto: 'A autoridade pública foi abolida após a Segunda Guerra Mundial.' },
          { letra: 'D', texto: 'Confunde o Direito Administrativo com o Direito Internacional Humanitário.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A Puissance Publique focava apenas no poder exorbitante coercitivo (atos de império), ignorando a vasta área em que a Administração atua cooperativamente prestando serviços públicos essenciais, fomento e assistência social aos administrados.',
        fundamentoLegal: 'Evolução doutrinária das escolas de Direito Administrativo'
      },
      {
        id: 'q-admin-02-05',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Atuação Concreta, Direta e Imediata',
        enunciado: 'O Congresso Nacional aprova lei orçamentária abstrata fixando metas de investimento em saúde. Para operacionalizar a lei, a Secretaria Municipal de Saúde adquire vacinas, contrata enfermeiros e inicia a imunização nos postos. A diferença entre a lei aprovada e a atuação dos enfermeiros e fiscais ilustra que o Direito Administrativo realiza os fins do Estado de forma:',
        alternativas: [
          { letra: 'A', texto: 'Abstrata, genérica e mediata.' },
          { letra: 'B', texto: 'Concreta, direta e imediata.' },
          { letra: 'C', texto: 'Hipotética e subordinada ao Tribunal de Haia.' },
          { letra: 'D', texto: 'Revogável por vontade unilateral do particular.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A função legislativa é geral e abstrata. A função administrativa, conforme conceituou Hely Lopes Meirelles, é concreta, direta e imediata, materializando na prática do dia a dia as diretrizes normativas.',
        fundamentoLegal: 'Conceito clássico de Hely Lopes Meirelles'
      },
      {
        id: 'q-admin-02-06',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Governo versus Administração',
        enunciado: 'Na clássica distinção entre Governo e Administração Pública em sentido estrito, é correto afirmar que:',
        alternativas: [
          { letra: 'A', texto: 'Governo e Administração Pública são expressões rigorosamente sinônimas no direito público.' },
          { letra: 'B', texto: 'Governo expressa a atividade política superior de comando, metas e diretrizes; já a Administração é o aparelhamento técnico subordinado responsável por executar essas políticas.' },
          { letra: 'C', texto: 'A Administração comanda politicamente o Estado e o Governo apenas obedece aos servidores de carreira.' },
          { letra: 'D', texto: 'O Governo se extingue a cada mudança de servidores concursados.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Governo = poder político, diretrizes estratégicas e comando estatal (função discricionária de direção). Administração = instrumento técnico neutro, permanente e profissional que executa as políticas públicas em subordinação à lei.',
        fundamentoLegal: 'Distinção doutrinária entre Governo e Administração'
      },
      {
        id: 'q-admin-02-07',
        tipo: 'pegadinha',
        tema: 'Direito Administrativo · Critério Negativo ou Residual',
        enunciado: 'Sobre o Critério Negativo ou Residual utilizado por alguns juristas na tentativa de definir o Direito Administrativo, assinale a opção que descreve com precisão sua metodologia:',
        alternativas: [
          { letra: 'A', texto: 'Consiste em catalogar todas as leis inconstitucionais revogadas pelo Supremo Tribunal Federal.' },
          { letra: 'B', texto: 'Define o Direito Administrativo por exclusão das demais áreas, abrangendo as atividades estatais que não sejam legislação, jurisdição, direito penal ou tributário.' },
          { letra: 'C', texto: 'Determina que a Administração só pode gastar o saldo residual que sobrar das contas bancárias.' },
          { letra: 'D', texto: 'Afirma que o Direito Administrativo só cuida de bens inservíveis ou residuais do patrimônio público.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Pelo critério negativo ou residual, o Direito Administrativo é o ramo residual que resta após excluir as funções legislativa, jurisdicional e os ramos especiais já destacados (penal, tributário, eleitoral).',
        fundamentoLegal: 'Critério doutrinário negativo ou residual'
      },
      {
        id: 'q-admin-02-08',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Órgão Despersonalizado vs. Pessoa Jurídica',
        enunciado: 'Cidadão sofreu lesão causada por buraco em rodovia federal fiscalizada pelo DNIT (Autarquia Federal). Seu advogado propôs ação de reparação civil contra o Ministério dos Transportes. A defesa da União alegou ilegitimidade passiva do Ministério dos Transportes porque:',
        alternativas: [
          { letra: 'A', texto: 'Ministérios não possuem responsabilidade jurídica por danos a cidadãos.' },
          { letra: 'B', texto: 'Ministérios são meros órgãos despersonalizados da Administração Direta, não tendo personalidade jurídica própria para estar em juízo.' },
          { letra: 'C', texto: 'A responsabilidade por rodovias é exclusiva das montadoras de veículos.' },
          { letra: 'D', texto: 'O Ministério dos Transportes foi privatizado pela Lei de Concessões.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Órgãos públicos (como Ministérios e Secretarias) são centros de competência despersonalizados. Quem tem personalidade jurídica para figurar no polo passivo é a pessoa federativa (União) ou a respectiva autarquia responsável (DNIT).',
        fundamentoLegal: 'Teoria do Órgão e art. 37 da CF/88 c/c art. 43 do Código Civil'
      },
      {
        id: 'q-admin-02-09',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Descentralização vs. Desconcentração',
        enunciado: 'A criação de uma Autarquia (como o INSS ou o Banco Central) por meio de lei específica para exercer atividade estatal especializada constitui hipótese de:',
        alternativas: [
          { letra: 'A', texto: 'Desconcentração administrativa interna dentro da mesma pessoa jurídica.' },
          { letra: 'B', texto: 'Descentralização administrativa por serviços, criando uma nova pessoa jurídica autônoma na Administração Indireta.' },
          { letra: 'C', texto: 'Terceirização ilícita de mão de obra para empresas privadas.' },
          { letra: 'D', texto: 'Concentração estatal monocrática.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Descentralização = criação de nova pessoa jurídica autônoma (Administração Indireta). Desconcentração = distribuição interna de competências entre órgãos da mesma pessoa jurídica (órgãos sem personalidade).',
        fundamentoLegal: 'Art. 37, XIX da CF/88 e Decreto-Lei 200/1967'
      },
      {
        id: 'q-admin-02-10',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Atividade Não Contenciosa e Inafastabilidade',
        enunciado: 'Em um processo administrativo disciplinar (PAD), a comissão processante concluiu pela demissão de um servidor público estável por abandono de cargo. O servidor esgotou todos os recursos hierárquicos na via administrativa. É correto afirmar que:',
        alternativas: [
          { letra: 'A', texto: 'A demissão transitou em julgado em definitivo, sendo impossível qualquer controle ou anulação pelo Poder Judiciário.' },
          { letra: 'B', texto: 'O servidor pode submeter a legalidade do ato demissório ao Poder Judiciário, pois a atividade administrativa é não contenciosa e não produz coisa julgada material perante os tribunais.' },
          { letra: 'C', texto: 'O Judiciário só pode analisar o caso se o Presidente da República anuir com a ação.' },
          { letra: 'D', texto: 'A decisão administrativa substitui o juiz natural em matéria de servidores públicos.' }
        ],
        respostaCorreta: 'B',
        comentario: 'No Brasil, a jurisdição é una: decisões de órgãos administrativos não produzem coisa julgada material. Se o servidor demonstrar vício de legalidade ou cerceamento de defesa, o ato de demissão pode ser anulado pela Justiça.',
        fundamentoLegal: 'Art. 5º, XXXV da CF/88 e Súmula Vinculante 21 do STF'
      },
      {
        id: 'q-admin-02-11',
        tipo: 'pegadinha',
        tema: 'Direito Administrativo · Relações Jurídicas Internas e Externas',
        enunciado: 'Quanto ao objeto do Direito Administrativo, assinale a opção que expressa corretamente a abrangência de suas normas:',
        alternativas: [
          { letra: 'A', texto: 'O Direito Administrativo regula unicamente o relacionamento externo entre o Estado e os usuários de serviços públicos.' },
          { letra: 'B', texto: 'O Direito Administrativo abrange tanto as relações internas (estruturação de órgãos, regime jurídico e disciplina de servidores públicos) quanto as relações externas (com administrados, empresas contratadas e delegatárias).' },
          { letra: 'C', texto: 'A disciplina de servidores públicos submete-se exclusivamente ao Direito do Trabalho da CLT.' },
          { letra: 'D', texto: 'Os contratos celebrados pela Administração com empresas construtoras são regidos 100% pelo direito civil comum.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O Direito Administrativo tem amplo alcance: disciplina a máquina estatal internamente (organização, servidores, hierarquia funcional) e externamente (relação com os cidadãos, poder de polícia, contratos públicos e licitações).',
        fundamentoLegal: 'Objeto amplo do Direito Administrativo contemporâneo'
      },
      {
        id: 'q-admin-02-12',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Critério Adotado no Brasil',
        enunciado: 'A síntese doutrinária prevalecente no Brasil define o Direito Administrativo como o ramo do direito público que rege:',
        alternativas: [
          { letra: 'A', texto: 'Os crimes praticados por militares contra a administração da justiça marcial.' },
          { letra: 'B', texto: 'A Administração Pública em seus aspectos orgânico (sujeitos) e material (funções), com seus princípios, prerrogativas e deveres instrumentais em prol do interesse coletivo.' },
          { letra: 'C', texto: 'As relações diplomáticas entre governos estrangeiros e embaixadas.' },
          { letra: 'D', texto: 'A arrecadação exclusiva de impostos sobre grandes fortunas.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O critério da Administração Pública engloba harmonicamente os sujeitos da Administração (órgãos, agentes e entidades) e as atividades exercidas de forma concreta e direta para atender o interesse público sob o império da lei.',
        fundamentoLegal: 'Doutrina brasileira de Direito Administrativo'
      }
    ]
  }
};
