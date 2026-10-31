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
  // AULA 01: DIREITO ADMINISTRATIVO · PRINCÍPIOS DA ADMINISTRAÇÃO PÚBLICA (LIMPE)
  // 18 Flashcards + 12 Questões
  // ─────────────────────────────────────────────────────────────────────────────
  'admin-01-01': {
    aulaId: 'admin-01-01',
    titulo: 'Princípios Expressos da Administração Pública (LIMPE)',
    flashcards: [
      {
        id: 'fc-admin-01-01',
        pergunta: 'O que representa o mnemônico LIMPE no art. 37, caput, da Constituição Federal?',
        resposta: 'Representa os cinco princípios expressos que regem a Administração Pública direta e indireta de qualquer dos Poderes da União, Estados, DF e Municípios: Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência.',
        artigoLei: 'Art. 37, caput, da Constituição Federal de 1988',
        dicaPratica: 'São mandamentos nucleares de observância obrigatória por todos os entes da Federação.'
      },
      {
        id: 'fc-admin-01-02',
        pergunta: 'Qual é a diferença fundamental entre a Legalidade para o particular e para a Administração Pública?',
        resposta: 'O particular pode fazer tudo o que a lei não proíbe (art. 5º, II da CF - autonomia da vontade). Já a Administração Pública só pode agir quando houver expressa autorização ou determinação em lei (subordinação estrita à lei).',
        artigoLei: 'Art. 5º, II e Art. 37, caput, da CF/88',
        dicaPratica: 'Na Administração não há autonomia da vontade privada: a lei é o limite máximo e mínimo da conduta pública.'
      },
      {
        id: 'fc-admin-01-03',
        pergunta: 'Quais são as duas facetas primordiais do Princípio da Impessoalidade?',
        resposta: '1ª: Igualdade/Isonomia no tratamento dos administrados (sem perseguições ou favoritismos indevidos); 2ª: Imputação dos atos ao órgão ou entidade estatal, e não à pessoa física do agente público executor.',
        artigoLei: 'Art. 37, caput e § 1º da CF/88',
        dicaPratica: 'Quem age é o Estado (órgão), não o indivíduo titular. Daí a vedação absoluta à autopromoção pessoal.'
      },
      {
        id: 'fc-admin-01-04',
        pergunta: 'O que estabelece o art. 37, § 1º, da CF a respeito da publicidade de programas e obras públicas?',
        resposta: 'A publicidade dos atos, programas, obras, serviços e campanhas dos órgãos públicos deverá ter caráter exclusivamente educativo, informativo ou de orientação social, dela não podendo constar nomes, símbolos ou imagens que caracterizem promoção pessoal.',
        artigoLei: 'Art. 37, § 1º, da CF/88',
        dicaPratica: 'A autopromoção em propaganda oficial viola simultaneamente a Impessoalidade e a Moralidade administrativa.'
      },
      {
        id: 'fc-admin-01-05',
        pergunta: 'Como o Supremo Tribunal Federal consolidou a vedação ao Nepotismo através da Súmula Vinculante 13?',
        resposta: 'Vedou a nomeação de cônjuge, companheiro ou parente em linha reta, colateral ou por afinidade, até o 3º grau, da autoridade nomeante ou de servidor da mesma pessoa jurídica com poder de direção para cargos em comissão ou funções de confiança.',
        artigoLei: 'Súmula Vinculante 13 do STF',
        dicaPratica: 'A proibição decorre diretamente dos princípios da impessoalidade, moralidade, igualdade e eficiência, mesmo sem lei formal ordinária.'
      },
      {
        id: 'fc-admin-01-06',
        pergunta: 'Qual a distinção entre a Moralidade Administrativa e a moralidade comum (subjetiva)?',
        resposta: 'A moralidade administrativa não se confunde com preceitos éticos religiosos ou puramente subjetivos. Trata-se de uma moralidade jurídica institucional, voltada à probidade, boa-fé objetiva, lealdade e honestidade no trato da coisa pública.',
        artigoLei: 'Art. 37, caput e § 4º da CF/88 c/c Lei 8.429/92',
        dicaPratica: 'O ato formalmente legal pode ser anulado por vício de moralidade se comprovado o desvio ético-institucional.'
      },
      {
        id: 'fc-admin-01-07',
        pergunta: 'O Princípio da Publicidade é absoluto no ordenamento jurídico brasileiro?',
        resposta: 'Não. A publicidade é a regra geral da transparência republicana, mas comporta exceções constitucionais taxativas: hipóteses em que o sigilo seja imprescindível à segurança da sociedade e do Estado, ou para resguardar a intimidade e a vida privada.',
        artigoLei: 'Art. 5º, incisos XXXIII e LX, e Art. 37, caput da CF/88',
        dicaPratica: 'A publicidade é requisito de eficácia e de controle dos atos administrativos pelos cidadãos e órgãos de fiscalização.'
      },
      {
        id: 'fc-admin-01-08',
        pergunta: 'Qual princípio explícito foi inserido no art. 37 pela Emenda Constitucional nº 19/1998 (Reforma Administrativa)?',
        resposta: 'O Princípio da Eficiência, que impõe à Administração Pública a busca contínua por produtividade, economicidade, rendimento funcional e qualidade na prestação dos serviços públicos aos cidadãos.',
        artigoLei: 'Art. 37, caput, da CF/88 (redação dada pela EC 19/98)',
        dicaPratica: 'O princípio da eficiência deu ensejo à avaliação especial e periódica de desempenho funcional.'
      },
      {
        id: 'fc-admin-01-09',
        pergunta: 'O Princípio da Eficiência autoriza o administrador público a afastar ou descumprir a Legalidade?',
        resposta: 'De forma alguma. A eficiência jamais se sobrepõe à legalidade estrita. O administrador deve ser eficiente dentro dos limites da lei (eficiência com conformidade legal), sendo vedado atalhos ilícitos em nome de agilidade.',
        artigoLei: 'Art. 37, caput, da CF/88',
        dicaPratica: 'Não existe eficácia administrativa legítima obtida mediante violação de garantias legais e licitatórias.'
      },
      {
        id: 'fc-admin-01-10',
        pergunta: 'Em que consiste o Princípio da Autotutela Administrativa (Súmulas 346 e 473 do STF)?',
        resposta: 'É o poder-dever da Administração de controlar seus próprios atos, podendo anular aqueles eivados de vícios de legalidade (ex tunc) e revogar os inconvenientes ou inoportunos (ex nunc), ressalvados os direitos adquiridos.',
        artigoLei: 'Súmulas 346 e 473 do STF e Art. 53 da Lei 9.784/1999',
        dicaPratica: 'Se a anulação do ato ilegal atingir interesses de terceiros, é obrigatório garantir o prévio contraditório e a ampla defesa.'
      },
      {
        id: 'fc-admin-01-11',
        pergunta: 'O que determina o Princípio da Indisponibilidade do Interesse Público?',
        resposta: 'Determina que os bens, direitos e interesses públicos não pertencem ao administrador público, mas sim à coletividade. O gestor público é apenas um mero curador e guardião, não podendo dispor, renunciar ou transigir fora das hipóteses autorizadas por lei.',
        artigoLei: 'Princípio implícito / Regime Jurídico Administrativo',
        dicaPratica: 'Compõe, juntamente com a supremacia do interesse público, o binômio basilar do Direito Administrativo.'
      },
      {
        id: 'fc-admin-01-12',
        pergunta: 'Qual a prerrogativa conferida pelo Princípio da Supremacia do Interesse Público sobre o Privado?',
        resposta: 'Confere à Administração Pública uma posição de verticalidade sobre o particular nas relações jurídicas regidas pelo direito público, garantindo poderes extrovertidos como a autoexecutoriedade, desapropriação e cláusulas exorbitantes em contratos.',
        artigoLei: 'Regime Jurídico-Administrativo Constitucional',
        dicaPratica: 'A supremacia do interesse público deve sempre respeitar os direitos e garantias fundamentais individuais.'
      },
      {
        id: 'fc-admin-01-13',
        pergunta: 'O que exige o Princípio da Motivação nos atos administrativos vinculados e discricionários?',
        resposta: 'Exige que a autoridade indique expressamente os fundamentos fáticos (acontecimentos reais) e jurídicos (dispositivos de lei) que justificaram a prática do ato administrativo, possibilitando o controle de legitimidade e legalidade.',
        artigoLei: 'Art. 50 da Lei 9.784/1999 e art. 93, IX da CF/88',
        dicaPratica: 'A motivação contextual é indispensável em atos que neguem, limitem ou afetem direitos de administrados.'
      },
      {
        id: 'fc-admin-01-14',
        pergunta: 'Como funciona a Teoria dos Motivos Determinantes no controle dos atos administrativos?',
        resposta: 'A validade do ato administrativo fica irrevogavelmente vinculada aos motivos fáticos e jurídicos alegados pela autoridade ao praticá-lo. Se os motivos forem comprovadamente falsos ou inexistentes, o ato é nulo, mesmo que a motivação fosse originalmente facultativa.',
        artigoLei: 'Jurisprudência uníssona do STJ e STF',
        dicaPratica: 'Se o chefe exonera servidor comissionado alegando "falta de verba" e nomeia outro logo em seguida, o ato é nulo.'
      },
      {
        id: 'fc-admin-01-15',
        pergunta: 'Qual o critério de distinção entre Razoabilidade e Proporcionalidade no controle jurisdicional?',
        resposta: 'A Razoabilidade veda atuações absurdas, desarrazoadas ou que fujam ao bom senso comum. A Proporcionalidade exige a tríplice aferição da medida: adequação (meio apto ao fim), necessidade (menor sacrifício ao cidadão) e proporcionalidade em sentido estrito (custo-benefício justo).',
        artigoLei: 'Art. 2º da Lei 9.784/1999 e Art. 5º, LIV da CF/88',
        dicaPratica: 'Ambos os princípios balizam o poder discricionário impedindo o excesso de poder e o desvio de finalidade.'
      },
      {
        id: 'fc-admin-01-16',
        pergunta: 'Qual é o prazo decadencial para a Administração Pública anular atos que gerem efeitos favoráveis aos destinatários?',
        resposta: 'O direito da Administração de anular os atos administrativos de que decorram efeitos favoráveis para os destinatários decai em 5 (cinco) anos, contados da data em que foram praticados, salvo comprovada má-fé do beneficiário.',
        artigoLei: 'Art. 54 da Lei 9.784/1999',
        dicaPratica: 'Havendo comprovada má-fé do administrado, não incide o prazo decadencial quinquenal.'
      },
      {
        id: 'fc-admin-01-17',
        pergunta: 'O que dita o Princípio da Continuidade do Serviço Público quanto à suspensão de serviços essenciais?',
        resposta: 'Dita que as atividades públicas essenciais não podem sofrer interrupções repentinas. A suspensão por inadimplemento de usuário só é legítima mediante prévio aviso formal, resguardados os serviços essenciais à vida e à saúde coletiva (ex: hospitais e UTIs).',
        artigoLei: 'Art. 6º, § 3º da Lei 8.987/1995',
        dicaPratica: 'O STJ não admite corte de energia de hospitais públicos ou centros de tratamento intensivo por falta de verba.'
      },
      {
        id: 'fc-admin-01-18',
        pergunta: 'A nomeação de cônjuge ou parente para cargos políticos (como Ministros de Estado ou Secretários) viola a Súmula Vinculante 13?',
        resposta: 'Em regra, não. A jurisprudência do STF firmou entendimento de que a restrição da Súmula Vinculante 13 não se aplica indistintamente a cargos de natureza estritamente política, salvo em casos de patente ausência de qualificação técnica ou inequívoco desvio de finalidade.',
        artigoLei: 'Jurisprudência vinculante do STF (Rcl 29.033, Rcl 22.339)',
        dicaPratica: 'Se o parente não possui nenhuma qualificação profissional mínima para a pasta política, incide a nulidade por nepotismo.'
      }
    ],
    questoes: [
      {
        id: 'q-admin-01-01',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Regime Jurídico e Princípio da Legalidade',
        enunciado: 'No regime jurídico-administrativo brasileiro, a legalidade que subordina a atuação dos órgãos e agentes públicos distingue-se daquela aplicável aos particulares pelo seguinte postulado:',
        alternativas: [
          { letra: 'A', texto: 'A Administração pode realizar qualquer ato que não esteja expressamente proibido por lei ordinária.' },
          { letra: 'B', texto: 'A Administração Pública só pode agir quando houver expressa autorização ou determinação na lei (critério de subordinação estrita).' },
          { letra: 'C', texto: 'A vontade do administrador prevalece sobre a lei sempre que visar à satisfação imediata de uma demanda popular.' },
          { letra: 'D', texto: 'Os administrados só podem fazer o que a lei expressamente autorizar de forma tarifada.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Enquanto na esfera privada vigora a autonomia da vontade (art. 5º, II da CF - pode-se fazer tudo o que a lei não proíbe), na Administração Pública vigora o princípio da estrita legalidade: o administrador só pode praticar atos expressamente determinados ou permitidos por lei.',
        fundamentoLegal: 'Art. 37, caput, da CF/88 c/c art. 2º da Lei 9.784/1999'
      },
      {
        id: 'q-admin-01-02',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Princípio da Impessoalidade',
        enunciado: 'A regra constitucional contida no art. 37, § 1º, da CF/88, que proíbe a aposição de nomes, símbolos ou imagens que caracterizem promoção pessoal em propaganda oficial de obras públicas, é desdobramento direto e precípuo do princípio da:',
        alternativas: [
          { letra: 'A', texto: 'Publicidade estrita.' },
          { letra: 'B', texto: 'Impessoalidade.' },
          { letra: 'C', texto: 'Autonomia corporativa.' },
          { letra: 'D', texto: 'Eficiência orçamentária.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O art. 37, § 1º concretiza diretamente a faceta de não-personificação do poder público advinda da Impessoalidade. As realizações são imputadas à pessoa jurídica estatal, jamais à figura individual do governante ou mandatário.',
        fundamentoLegal: 'Art. 37, § 1º, da Constituição Federal de 1988'
      },
      {
        id: 'q-admin-01-03',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Promoção Pessoal e Improbidade',
        enunciado: 'Determinado Prefeito Municipal recém-empossado ordenou que toda a frota de ambulâncias da cidade recebesse adesivos com a sua foto oficial e o slogan utilizado em sua campanha eleitoral vitoriosa. À luz da Constituição Federal e da jurisprudência dominante:',
        alternativas: [
          { letra: 'A', texto: 'A conduta é plenamente válida em homenagem ao princípio da transparência pública.' },
          { letra: 'B', texto: 'A conduta viola expressamente a impessoalidade e a moralidade administrativa, sujeitando o gestor à responsabilização civil e por improbidade.' },
          { letra: 'C', texto: 'O prefeito agiu no exercício de seu poder discricionário soberano, infenso a controle jurisdicional.' },
          { letra: 'D', texto: 'A proibição aplica-se apenas ao Presidente da República, permitindo-se exceções a prefeitos do interior.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A veiculação de slogans de campanha e imagem de mandatário em veículos do patrimônio público afronta flagrantemente o art. 37, § 1º da CF, violando a impessoalidade e a probidade exigida no trato dos recursos municipais.',
        fundamentoLegal: 'Art. 37, § 1º e § 4º da CF/88'
      },
      {
        id: 'q-admin-01-04',
        tipo: 'introdutoria',
        tema: 'Direito Administrativo · Princípio da Eficiência e EC 19/1998',
        enunciado: 'O Princípio da Eficiência foi introduzido expressamente no caput do art. 37 da Constituição Federal pela Emenda Constitucional nº 19/1998. Dentre os instrumentos criados para dar concretude à eficiência no serviço público, destaca-se:',
        alternativas: [
          { letra: 'A', texto: 'A extinção sumária da estabilidade de todos os servidores públicos federais.' },
          { letra: 'B', texto: 'A dispensa universal de licitação para contratações com empresas de inovação.' },
          { letra: 'C', texto: 'A possibilidade de perda do cargo do servidor estável mediante procedimento de avaliação periódica de desempenho, na forma de lei complementar.' },
          { letra: 'D', texto: 'A obrigatoriedade de privatização imediata de todas as empresas públicas deficitárias.' }
        ],
        respostaCorreta: 'C',
        comentario: 'O art. 41, § 1º, III da CF, modificado pela EC 19/98, instituiu a avaliação periódica de desempenho como hipótese constitucional de perda de cargo do servidor estável, assegurada ampla defesa, visando a eficiência do serviço estatal.',
        fundamentoLegal: 'Art. 37, caput e Art. 41, § 1º, inciso III da CF/88'
      },
      {
        id: 'q-admin-01-05',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Nepotismo e Súmula Vinculante 13',
        enunciado: 'O Secretário Municipal de Obras nomeou o cunhado de sua esposa (portanto, irmão de sua companheira, parente colateral por afinidade de 2º grau) para exercer cargo em comissão de diretor técnico de fiscalização na mesma pasta. Diante do enunciado da Súmula Vinculante 13 do STF:',
        alternativas: [
          { letra: 'A', texto: 'A nomeação é válida, pois parentesco por afinidade não gera impedimento de nepotismo.' },
          { letra: 'B', texto: 'A nomeação configura nepotismo vedado, sendo nulo o ato de investidura por violação aos princípios do art. 37 da CF.' },
          { letra: 'C', texto: 'Apenas parentes consanguíneos em linha reta até o 1º grau (pais e filhos) estão abrangidos pelo nepotismo.' },
          { letra: 'D', texto: 'O nepotismo só se aplica se houver prévia condenação criminal transitada em julgado.' }
        ],
        respostaCorreta: 'B',
        comentario: 'A Súmula Vinculante 13 veda a nomeação de parentes em linha reta, colateral ou por afinidade até o 3º grau da autoridade nomeante ou de servidores com poder hierárquico na mesma pessoa jurídica para cargos comissionados ou funções gratificadas.',
        fundamentoLegal: 'Súmula Vinculante nº 13 do STF'
      },
      {
        id: 'q-admin-01-06',
        tipo: 'pegadinha',
        tema: 'Direito Administrativo · Anulação vs. Revogação de Atos',
        enunciado: 'Sobre o controle dos atos administrativos exercido pela própria Administração com esteio no Princípio da Autotutela, assinale a proposição tecnicamente correta:',
        alternativas: [
          { letra: 'A', texto: 'A revogação de atos administrativos decorre de vício de ilegalidade e produz efeitos retroativos (ex tunc).' },
          { letra: 'B', texto: 'A anulação atinge atos ilegais com eficácia retroativa (ex tunc), enquanto a revogação incide sobre atos legais e discricionários por razões de mérito, com eficácia não-retroativa (ex nunc).' },
          { letra: 'C', texto: 'O Poder Judiciário pode revogar atos administrativos do Poder Executivo quando entender que a decisão foi inoportuna.' },
          { letra: 'D', texto: 'Atos vinculados podem ser revogados pelo administrador a qualquer momento por conveniência pública.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Anulação = ato ilegal/ilegítimo, efeito retroativo (ex tunc), pode ser feita pela Administração e pelo Judiciário. Revogação = ato legal e discricionário, razões de mérito (conveniência e oportunidade), efeito prospectivo (ex nunc), privativa da Administração.',
        fundamentoLegal: 'Súmula 473 do STF e art. 53 da Lei 9.784/1999'
      },
      {
        id: 'q-admin-01-07',
        tipo: 'pegadinha',
        tema: 'Direito Administrativo · Exceções à Publicidade',
        enunciado: 'Um cidadão solicitou formalmente com base na Lei de Acesso à Informação o relatório minucioso das rotas de deslocamento e esquemas táticos de blindagem pessoal utilizados pela segurança do Presidente da República. O órgão negou o acesso. O ato de indeferimento:',
        alternativas: [
          { letra: 'A', texto: 'É ilícito, pois na República a publicidade é absoluta e todo documento público deve ser livremente franqueado.' },
          { letra: 'B', texto: 'É legítimo, haja vista que a própria Constituição ressalva o sigilo indispensável à segurança da sociedade e das mais altas autoridades do Estado.' },
          { letra: 'C', texto: 'Configura crime de abuso de autoridade por violar a publicidade do art. 37 da CF.' },
          { letra: 'D', texto: 'Só seria legítimo se o solicitante fosse pessoa estrangeira não residente.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O princípio da publicidade não é absoluto. O art. 5º, XXXIII da CF e a Lei 12.527/2011 (LAI) ressalvam expressamente informações cujo sigilo seja imprescindível à segurança da sociedade e do Estado, além da proteção da intimidade e da vida privada.',
        fundamentoLegal: 'Art. 5º, XXXIII e Art. 37, caput, da CF/88 c/c Lei 12.527/2011'
      },
      {
        id: 'q-admin-01-08',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Cargo Político e Súmula Vinculante 13',
        enunciado: 'O Governador do Estado nomeou seu irmão, profissional com mais de 20 anos de experiência em gestão financeira e doutorado em economia, para exercer o cargo de Secretário Estadual da Fazenda. Segundo a jurisprudência dominante do STF:',
        alternativas: [
          { letra: 'A', texto: 'O ato é automaticamente nulo, pois a vedação da Súmula Vinculante 13 não comporta exceção a nenhum cargo público.' },
          { letra: 'B', texto: 'A vedação da Súmula Vinculante 13, em regra, não alcança cargos de natureza estritamente política (Secretários e Ministros), exceto se comprovada patente incapacidade técnica ou desvio de finalidade.' },
          { letra: 'C', texto: 'Apenas filhos do governante poderiam ser nomeados, sendo proibida a investidura de irmãos.' },
          { letra: 'D', texto: 'O STF equiparou todos os cargos comissionados a cargos de provimento efetivo por concurso.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O STF firmou tese de que a Súmula Vinculante 13 não incide de forma genérica sobre nomeações para cargos políticos (como Ministros de Estado e Secretários Estaduais/Municipais), ressalvada a hipótese de nepotismo cruzado, manifesta inaptidão profissional ou fraude à lei.',
        fundamentoLegal: 'Jurisprudência vinculante do STF (Rcl 29.033-AgR e RE 579.951)'
      },
      {
        id: 'q-admin-01-09',
        tipo: 'definicao',
        tema: 'Direito Administrativo · Autotutela e Devido Processo Legal',
        enunciado: 'Ao constatar que concedeu gratificação salarial em duplicidade a um servidor público por equívoco de interpretação há três anos, a Administração Pública decide anular o ato. Para cumprir o entendimento do STF e a Lei de Processo Administrativo, a Administração deve:',
        alternativas: [
          { letra: 'A', texto: 'Anular o ato de imediato de forma sigilosa sem notificar o servidor afetado.' },
          { letra: 'B', texto: 'Garantir ao servidor previamente o exercício do contraditório e da ampla defesa, haja vista que a anulação afetará sua esfera jurídica patrimonial.' },
          { letra: 'C', texto: 'Aguardar obrigatoriamente uma decisão judicial transitada em julgado.' },
          { letra: 'D', texto: 'Demitir o servidor sumariamente por locupletamento ilícito.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Embora a Administração tenha o poder-dever da autotutela (Súmula 473), o STF e a Lei 9.784/99 (art. 2º) pacificaram que a anulação de ato que produza efeitos favoráveis a terceiro exige instauração prévia de procedimento com contraditório e ampla defesa.',
        fundamentoLegal: 'Súmula Vinculante nº 3 e Tema 138 de Repercussão Geral do STF'
      },
      {
        id: 'q-admin-01-10',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Continuidade do Serviço Público',
        enunciado: 'Concessionária distribuidora de energia elétrica suspendeu abruptamente o fornecimento de luz de um Hospital Municipal de Urgência devido ao atraso de faturas emitidas pelo Município. Considerando o princípio da continuidade dos serviços públicos e a jurisprudência do STJ:',
        alternativas: [
          { letra: 'A', texto: 'O corte é legítimo e irrepreensível, pois o inadimplemento autoriza a interrupção indistinta em qualquer unidade consumidora.' },
          { letra: 'B', texto: 'O corte é ilegítimo, pois o serviço essencial a unidade hospitalar não pode ser interrompido, devendo a cobrança ser realizada pelas vias judiciais ordinárias.' },
          { letra: 'C', texto: 'A concessionária pode expropriar os equipamentos do hospital para abater a dívida.' },
          { letra: 'D', texto: 'O corte só seria indevido se houvesse prévio acordo arbitral homologado.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O STJ consolidou que, em razão do princípio da continuidade do serviço público essencial e da preservação da dignidade da pessoa humana e da saúde pública, é ilegítimo o corte de energia de hospitais, prontos-socorros e UTIs por inadimplemento do ente público.',
        fundamentoLegal: 'Art. 6º, § 3º da Lei 8.987/1995 e Jurisprudência pacificada do STJ'
      },
      {
        id: 'q-admin-01-11',
        tipo: 'pegadinha',
        tema: 'Direito Administrativo · Teoria dos Motivos Determinantes',
        enunciado: 'Uma autoridade pública exonerou servidor ocupante de cargo em comissão de livre nomeação e exoneração ad nutum. Na portaria de desligamento, a autoridade expressou textualmente como motivo: "redução drástica de despesas com pessoal por insuficiência de arrecadação". Posteriormente, restou documentalmente provado que a arrecadação bateu recorde e dois novos assessores foram nomeados no mesmo dia. O servidor exonerado poderá pleitear:',
        alternativas: [
          { letra: 'A', texto: 'Nada, pois cargos em comissão dispensam motivação e seu desligamento é imune a anulação judicial.' },
          { letra: 'B', texto: 'A nulidade da exoneração com base na Teoria dos Motivos Determinantes, haja vista a falsidade inconteste do motivo explicitado pelo gestor.' },
          { letra: 'C', texto: 'Apenas indenização por danos morais na Justiça do Trabalho.' },
          { letra: 'D', texto: 'A sua efetivação automática no serviço público como servidor concursado.' }
        ],
        respostaCorreta: 'B',
        comentario: 'Pela Teoria dos Motivos Determinantes, ainda que o ato prescinda originariamente de motivação (como a exoneração ad nutum), uma vez declarados os motivos pela autoridade, a validade do ato fica vinculada à veracidade desses motivos. Se comprovada a inexistência ou falsidade do motivo, o ato é nulo.',
        fundamentoLegal: 'Jurisprudência consolidada do STF e STJ'
      },
      {
        id: 'q-admin-01-12',
        tipo: 'caso_pratico',
        tema: 'Direito Administrativo · Prazo Decadencial e Má-Fé',
        enunciado: 'Servidor aposentou-se com benefício concedido por ato administrativo homologado. Sete anos após a concessão, a auditoria constatou que o servidor utilizou certidões dolosamente falsificadas por ele próprio para comprovar tempo de contribuição fictício. Diante do prazo de 5 anos do art. 54 da Lei 9.784/1999, a Administração Pública:',
        alternativas: [
          { letra: 'A', texto: 'Decaiu de seu direito de anular o ato, tornando a aposentadoria intangível pela prescrição.' },
          { letra: 'B', texto: 'Pode anular a aposentadoria a qualquer tempo, pois a comprovada má-fé do beneficiário afasta a decadência quinquenal administrativa.' },
          { letra: 'C', texto: 'Deverá pagar um abono pecuniário indenizatório ao servidor.' },
          { letra: 'D', texto: 'Só pode reaver os valores se o servidor renunciar expressamente ao direito adquirido.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O art. 54 da Lei 9.784/1999 ressalva expressamente a "comprovada má-fé": verificada fraude ou conduta dolosa do administrado, não opera a decadência quinquenal, podendo a Administração exercer a autotutela e restabelecer a legalidade.',
        fundamentoLegal: 'Art. 54, caput, da Lei 9.784/1999'
      }
    ]
  }
};
