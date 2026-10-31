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
  // ─────────────────────────────────────────────────────────────────────────────
  'penal-01-01': {
    aulaId: 'penal-01-01',
    titulo: 'Crimes Contra a Família (Bigamia)',
    flashcards: [
      {
        id: 'fc-penal-01-01',
        pergunta: 'Qual é o bem jurídico tutelado no crime de bigamia (art. 235 do Código Penal)?',
        resposta: 'Tutela-se a instituição da família, mais especificamente o princípio da monogamia, pilar da ordem matrimonial civil brasileira.',
        artigoLei: 'Art. 235 do Código Penal',
        dicaPratica: 'A família matrimonial monogâmica possui proteção constitucional (art. 226 da CF).'
      },
      {
        id: 'fc-penal-01-02',
        pergunta: 'Quem é o sujeito ativo e passivo na figura do caput do art. 235?',
        resposta: 'No caput, o sujeito ativo é a pessoa já casada civilmente (crime próprio). Os sujeitos passivos são o Estado e o cônjuge do primeiro casamento, além do segundo cônjuge se estava de boa-fé.',
        artigoLei: 'Art. 235, caput, CP',
        exemplo: 'Marcos, casado com Ana, celebra novo casamento com Bruna. Marcos comete o crime do caput.'
      },
      {
        id: 'fc-penal-01-03',
        pergunta: 'Qual é o crime cometido pela pessoa solteira que contrai casamento com pessoa casada sabendo do impedimento?',
        resposta: 'Responde pela figura equiparada do § 1º do art. 235 do CP ("Aquele que, não sendo casado, contrai casamento com pessoa casada, conhecendo essa circunstância"). Trata-se de hipótese expressa de exceção à teoria monista.',
        artigoLei: 'Art. 235, § 1º, CP',
        dicaPratica: 'Se a pessoa solteira desconhecia o estado de casada do parceiro, é vítima inocente e sua conduta é atípica por erro de tipo (art. 20 do CP).'
      },
      {
        id: 'fc-penal-01-04',
        pergunta: 'Quando se consuma o crime de bigamia e cabe tentativa?',
        resposta: 'Consuma-se no momento exato em que a celebração do segundo casamento é concluída perante o celebrante (juiz de paz) após a manifestação de vontade recíproca. A tentativa é plenamente admissível (ex.: cerimônia interrompida antes da declaração do juiz por voz de prisão).',
        artigoLei: 'Art. 14, II e Art. 235 do CP'
      },
      {
        id: 'fc-penal-01-05',
        pergunta: 'A união estável prévia impede novo casamento civil ou caracteriza bigamia se houver novo relacionamento?',
        resposta: 'NÃO configura crime de bigamia! O tipo penal exige casamento civil anterior válido. A união estável, embora entidade familiar reconhecida constitucionalmente, não preenche o elemento normativo "casamento". Punir geraria analogia in malam partem proibida no Direito Penal.',
        artigoLei: 'Princípio da Legalidade Estrita (art. 5º, XXXIX da CF)',
        dicaPratica: 'Tema campeão de pegadinhas na FGV/OAB e concursos públicos!'
      },
      {
        id: 'fc-penal-01-06',
        pergunta: 'Qual o efeito da anulação civil do PRIMEIRO casamento sobre o crime de bigamia?',
        resposta: 'Se o primeiro casamento for anulado por motivo que não a própria bigamia, o crime de bigamia deixa de existir, operando-se a anulação do fato criminoso retroativamente (o agente passa a ser considerado solteiro à época das segundas núpcias).',
        artigoLei: 'Art. 235, § 2º do CP',
        exemplo: 'Se o 1º casamento foi declarado nulo por incompetência absoluta da autoridade celebrante, não havia casamento válido anterior.'
      },
      {
        id: 'fc-penal-01-07',
        pergunta: 'O que ocorre se apenas o SEGUNDO casamento for declarado nulo?',
        resposta: 'Se o segundo casamento for declarado nulo em razão de outro vício (ex.: coação ou impedimento absoluto distinto), o crime ainda persiste se o agente contraiu o vínculo de má-fé, exceto se a nulidade retirar qualquer eficácia jurídica civil da celebração.',
        artigoLei: 'Art. 235, § 2º do CP'
      },
      {
        id: 'fc-penal-01-08',
        pergunta: 'O casamento puramente religioso (sem registro público civil) pode gerar o crime de bigamia?',
        resposta: 'NÃO. Para fins penais, exige-se casamento com efeitos civis (ou religioso registrado em cartório no prazo legal). Celebração religiosa clandestina ou sem efeito civil não preenche a elementar do tipo.',
        artigoLei: 'Código Civil arts. 1.515 e 1.516 / CP art. 235'
      },
      {
        id: 'fc-penal-01-09',
        pergunta: 'Se o agente contrai casamento acreditando sinceramente que seu primeiro cônjuge faleceu em naufrágio (sem morte presumida declarada), qual a tese defensiva?',
        resposta: 'Erro de tipo essencial escusável (art. 20, caput, do CP). O agente erra sobre a elementar normativa "sendo casado", afastando o dolo e tornando o fato atípico, uma vez que não existe previsão de bigamia culposa.',
        artigoLei: 'Art. 20, caput, do CP',
        dicaPratica: 'Como não há modalidade culposa no art. 235, o erro de tipo exclui a tipicidade.'
      },
      {
        id: 'fc-penal-01-10',
        pergunta: 'Qual é a ação penal no crime de bigamia?',
        resposta: 'Ação penal pública incondicionada, promovida privativamente pelo Ministério Público por se tratar de crime contra o interesse público da organização da família e da fé pública matrimonial.',
        artigoLei: 'Art. 100, § 1º do CP'
      }
    ],
    questoes: [
      {
        id: 'q-penal-01-01',
        tipo: 'introdutoria',
        tema: 'Direito Penal · Crimes Contra a Família',
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
        comentario: 'Eduardo é casado e contraiu novo casamento (art. 235, caput). Juliana, por sua vez, desconhecia o estado de casado de Eduardo (erro de tipo, art. 20 do CP), o que afasta o dolo e qualquer tipicidade, restando como vítima inocente da farsa.',
        fundamentoLegal: 'Art. 20 c/c art. 235, § 1º do Código Penal'
      },
      {
        id: 'q-penal-01-03',
        tipo: 'definicao',
        tema: 'Direito Penal · Condições do Casamento Anterior',
        enunciado: 'Nos termos do art. 235, § 2º do Código Penal, caso o primeiro casamento de quem contraiu segundas núpcias venha a ser anulado por vício de consentimento por sentença cível definitiva, qual é a consequência na esfera penal?',
        alternativas: [
          { letra: 'A', texto: 'A pena da bigamia é reduzida de metade em face do arrependimento posterior.' },
          { letra: 'B', texto: 'Considera-se inexistente o crime de bigamia, uma vez que a anulação do primeiro casamento extingue o pressuposto material do tipo.' },
          { letra: 'C', texto: 'O crime subsiste inalterado, pois a consumação já havia se perfectibilizado no ato do segundo casamento.' },
          { letra: 'D', texto: 'O agente passa a responder pelo crime de falsidade ideológica em substituição à bigamia.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O § 2º do art. 235 dispõe expressamente: "Anulado por qualquer motivo o primeiro casamento, ou o outro por motivo que não a bigamia, considera-se inexistente o crime". Trata-se de hipótese legal de atipicidade superveniente do fato.',
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
        comentario: 'O Direito Penal é regido pela estrita legalidade e tipicidade cerrada. A elementar normativa "sendo casado" exige celebração de casamento civil válido anterior. A união estável, por mais solene que seja, não preenche esse elemento, e equipará-la para fins de punição criminal violaria a vedação constitucional de analogia prejudicial ao réu.',
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
        tema: 'Direito Penal · Casamento Religioso',
        enunciado: 'Um ministro de confissão religiosa celebra o matrimônio religioso de uma pessoa já casada no civil, sem qualquer subsequente inscrição no Registro Civil das Pessoas Naturais. Do ponto de vista penal:',
        alternativas: [
          { letra: 'A', texto: 'O casamento religioso puro sem efeitos civis não configura o crime de bigamia.' },
          { letra: 'B', texto: 'Há bigamia consumada no instante da bênção nupcial pelo princípio da fé pública.' },
          { letra: 'C', texto: 'O padre ou pastor responderá como coautor do crime de bigamia necessariamente.' },
          { letra: 'D', texto: 'Aplica-se ao caso a pena do art. 235 atenuada de um terço.' }
        ],
        respostaCorreta: 'A',
        comentario: 'O casamento meramente religioso, despido de valor civil (não registrado no prazo legal), não cria sociedade conjugal com validade jurídica de direito positivo. Portanto, não tipifica bigamia.',
        fundamentoLegal: 'Art. 235 do CP e art. 1.515 do Código Civil'
      }
    ]
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AULA 02: INDUZIMENTO A ERRO ESSENCIAL E OCULTAÇÃO DE IMPEDIMENTO (ART. 236)
  // ─────────────────────────────────────────────────────────────────────────────
  'penal-01-02': {
    aulaId: 'penal-01-02',
    titulo: 'Induzimento a Erro Essencial e Ocultação de Impedimento',
    flashcards: [
      {
        id: 'fc-penal-02-01',
        pergunta: 'Quais são os dois núcleos da conduta incriminada no art. 236 do Código Penal?',
        resposta: '1) "Induzir a erro essencial" (fazer crer falsamente em uma qualidade inexistente ou ocultar aspecto essencial da pessoa); e 2) "Ocultar impedimento que não seja casamento anterior".',
        artigoLei: 'Art. 236, caput, do Código Penal',
        dicaPratica: 'Se o impedimento ocultado for de casamento anterior, o crime será Bigamia (art. 235) e não o art. 236!'
      },
      {
        id: 'fc-penal-02-02',
        pergunta: 'Qual é a indispensável condição objetiva de procedibilidade/punibilidade do art. 236?',
        resposta: 'O trânsito em julgado da sentença cível que anula o casamento (parágrafo único: "A ação penal não pode ser intentada senão depois de transitar em julgado a sentença que, por motivo de erro ou impedimento, anule o casamento").',
        artigoLei: 'Art. 236, parágrafo único, CP',
        dicaPratica: 'Sem a sentença cível anulatória definitiva, o Ministério Público ou o ofendido sequer podem propor a ação penal!'
      },
      {
        id: 'fc-penal-02-03',
        pergunta: 'Qual é a espécie de ação penal cabível no crime do art. 236 do Código Penal?',
        resposta: 'Ação penal de iniciativa PRIVADA personalíssima promovida pelo cônjuge enganado.',
        artigoLei: 'Art. 236, parágrafo único, CP',
        dicaPratica: 'Apenas o cônjuge vítima do erro ou do impedimento tem legitimidade ativa para a queixa-crime.'
      },
      {
        id: 'fc-penal-02-04',
        pergunta: 'A partir de quando se conta o prazo decadencial de 6 meses para oferecer queixa no crime do art. 236?',
        resposta: 'Conta-se da data do TRÂNSITO EM JULGADO da sentença cível que anular o casamento, e não da data da celebração ou da descoberta da fraude.',
        artigoLei: 'Art. 236, parágrafo único c/c art. 38 do CPP'
      },
      {
        id: 'fc-penal-02-05',
        pergunta: 'O que se entende por "erro essencial sobre a pessoa" para efeitos do art. 236?',
        resposta: 'São as hipóteses elencadas pelo art. 1.557 do Código Civil: identidade, honra e boa fama, defeito físico irremediável ou moléstia grave e transmissível prévia capaz de pôr em risco a saúde do outro ou da prole.',
        artigoLei: 'Art. 1.557 do Código Civil / Art. 236 do CP',
        exemplo: 'Ocultar deliberadamente ser portador de moléstia venérea incurável e contagiosa antes de se casar.'
      },
      {
        id: 'fc-penal-02-06',
        pergunta: 'Qual a diferença entre a ocultação de impedimento do art. 236 e a bigamia do art. 235?',
        resposta: 'A bigamia pune a ocultação do impedimento de ser previamente casado. O art. 236 abrange TODOS os demais impedimentos matrimoniais (parentesco, afinidade, crime doloso contra ex-cônjuge - art. 1.521 do CC), ressalvado expressamente o casamento anterior.',
        artigoLei: 'Art. 236 ("impedimento que não seja casamento anterior")'
      },
      {
        id: 'fc-penal-02-07',
        pergunta: 'Se os noivos celebram casamento e, posteriormente, decidem se divorciar em vez de anular o casamento, haverá processo penal pelo art. 236?',
        resposta: 'NÃO. O divórcio dissolve o vínculo de um casamento válido; não anula. Sem sentença anulatória transitada em julgado, a condição de procedibilidade jamais se perfectibiliza e o crime não poderá ser processado.',
        artigoLei: 'Art. 236, parágrafo único, CP'
      },
      {
        id: 'fc-penal-02-08',
        pergunta: 'Um terceiro (como pai ou amigo) que ajuda a omitir o impedimento pode responder pelo crime do art. 236?',
        resposta: 'Sim, na qualidade de partícipe (art. 29 do CP), desde que o cônjuge autor realize o casamento e se cumpra a condição de anulação civil transitada em julgado.',
        artigoLei: 'Art. 29 c/c art. 236 do CP'
      },
      {
        id: 'fc-penal-02-09',
        pergunta: 'O que é a ocultação de impedimento resultante de crime (art. 1.521, VII do Código Civil)?',
        resposta: 'É a hipótese em que o nubente oculta ter sido condenado por homicídio doloso consumado ou tentado contra o cônjuge do outro com quem pretende se casar.',
        artigoLei: 'Art. 1.521, VII do CC / Art. 236 do CP'
      },
      {
        id: 'fc-penal-02-10',
        pergunta: 'Qual o elemento subjetivo do tipo do art. 236 do CP?',
        resposta: 'Exige-se o DOLO (vontade livre e consciente de induzir em erro essencial ou ocultar o impedimento da outra parte nubente). A conduta meramente culposa é atípica.',
        artigoLei: 'Art. 18, I do Código Penal'
      }
    ],
    questoes: [
      {
        id: 'q-penal-02-01',
        tipo: 'definicao',
        tema: 'Direito Penal · Condição Objetiva de Procedibilidade',
        enunciado: 'Nos termos expressos do Código Penal, o crime de induzimento a erro essencial e ocultação de impedimento (art. 236) subordina o início da ação penal a qual requisito específico?',
        alternativas: [
          { letra: 'A', texto: 'À autorização expressa do Procurador-Geral de Justiça.' },
          { letra: 'B', texto: 'Ao trânsito em julgado da sentença cível que, por motivo de erro ou impedimento, anule o casamento.' },
          { letra: 'C', texto: 'À decretação cautelar de separação de corpos no juízo de família.' },
          { letra: 'D', texto: 'Ao laudo pericial atestando a enfermidade grave do réu.' }
        ],
        respostaCorreta: 'B',
        comentario: 'O parágrafo único do art. 236 do CP é textual: "A ação penal não pode ser intentada senão depois de transitar em julgado a sentença que, por motivo de erro ou impedimento, anule o casamento". Essa é uma clássica condição de procedibilidade.',
        fundamentoLegal: 'Art. 236, parágrafo único, do Código Penal'
      },
      {
        id: 'q-penal-02-02',
        tipo: 'introdutoria',
        tema: 'Direito Penal · Ação Penal Privada',
        enunciado: 'Sobre a titularidade da ação penal no crime do art. 236 do Código Penal (induzimento a erro essencial e ocultação de impedimento), assinale a opção correta:',
        alternativas: [
          { letra: 'A', texto: 'É pública incondicionada privativa do Ministério Público.' },
          { letra: 'B', texto: 'É pública condicionada à representação de qualquer parente até o 2º grau.' },
          { letra: 'C', texto: 'É de iniciativa privada personalíssima, cabendo exclusivamente ao cônjuge enganado.' },
          { letra: 'D', texto: 'É pública subsidiária da privada no prazo decadencial de 30 dias.' }
        ],
        respostaCorreta: 'C',
        comentario: 'O crime do art. 236 do CP é um dos raros exemplos de ação penal privada personalíssima no ordenamento brasileiro. Apenas o cônjuge vítima do induzimento ou ocultação pode oferecer queixa-crime.',
        fundamentoLegal: 'Art. 236, parágrafo único, do Código Penal'
      },
      {
        id: 'q-penal-02-03',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Prazo Decadencial',
        enunciado: 'Patrícia casou-se com Guilherme em janeiro de 2024. Em junho de 2024, descobriu que Guilherme havia ocultado ser irmão biológico de seu pai (impedimento de parentesco por consanguinidade). Patrícia ajuizou ação anulatória, obtendo sentença de procedência transitada em julgado em 10 de outubro de 2025. O prazo para Patrícia ajuizar a queixa-crime criminal contra Guilherme expira em:',
        alternativas: [
          { letra: 'A', texto: '6 meses contados da celebração do casamento (julho de 2024).' },
          { letra: 'B', texto: '6 meses contados do conhecimento do fato por Patrícia (dezembro de 2024).' },
          { letra: 'C', texto: '6 meses contados do trânsito em julgado da sentença anulatória civil (abril de 2026).' },
          { letra: 'D', texto: 'O crime prescreve imediatamente no dia seguinte ao trânsito da decisão cível.' }
        ],
        respostaCorreta: 'C',
        comentario: 'A decadência do direito de queixa no art. 236 inicia o seu cômputo da data em que transita em julgado a sentença anulatória, pois até aquele momento a vítima estava impedida por lei de ajuizar a queixa (art. 236, p. único c/c art. 38 do CPP).',
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
        comentario: 'O art. 236 do CP ressalva expressamente em seu texto: "ocultando impedimento que NÃO seja casamento anterior". Portanto, havendo casamento anterior válido, o tipo especial e prevalente é a Bigamia (art. 235 do CP).',
        fundamentoLegal: 'Art. 235 e Art. 236 do Código Penal'
      },
      {
        id: 'q-penal-02-05',
        tipo: 'caso_pratico',
        tema: 'Direito Penal · Divórcio x Anulação',
        enunciado: 'Thiago casou-se com Flávia omitindo que fora condenado definitivamente por estupro de vulnerável no passado. Após 3 meses de casados, Flávia descobre a ficha criminal de Thiago. Magoada, Flávia opta por ajuizar imediatamente um divórcio consensual em cartório extrajudicial para se livrar do vínculo com rapidez. Três meses após o divórcio, Flávia contrata advogado para oferecer queixa-crime contra Thiago com base no art. 236 do CP. Nessa situação:',
        alternativas: [
          { letra: 'A', texto: 'A queixa-crime deve ser rejeitada, pois ausente a condição de procedibilidade indispensável (sentença que anule o casamento).' },
          { letra: 'B', texto: 'A queixa deve ser recebida normalmente, pois o divórcio tem os mesmos efeitos práticos de uma anulação.' },
          { letra: 'C', texto: 'O Ministério Público deve assumir o polo ativo da demanda como ação incondicionada.' },
          { letra: 'D', texto: 'Thiago deve ser condenado com perdão judicial facultativo.' }
        ],
        respostaCorreta: 'A',
        comentario: 'O divórcio dissolve um casamento válido; não anula o matrimônio. O parágrafo único do art. 236 exige expressamente sentença judicial transitada em julgado que declare NULO ou ANULE o casamento. Na falta dela, falta condição de procedibilidade da ação penal.',
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
        comentario: 'O erro essencial tem contornos jurídicos estritos definidos no art. 1.557 do Código Civil, abarcando identidade, honra, defeito físico irremediável ou moléstia grave e transmissível preexistente ao enlace.',
        fundamentoLegal: 'Art. 1.557 do Código Civil e Art. 236 do Código Penal'
      }
    ]
  }
};
