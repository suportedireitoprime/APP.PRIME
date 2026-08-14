import { BiografiaData } from '@/types/biografia';

export const plataoData: BiografiaData = {
  id: 'platao',
  categoriaId: 'filosofos',
  nome: 'Platão',
  subtitulo: 'O arquiteto do Mundo das Ideias e o pai da filosofia política do Ocidente.',
  imagemUrl: '/biografias/platao-capa.jpg',
  epoca: 'Antiguidade Clássica',
  ordemEpoca: 2,
  tabs: [
    {
      id: 'historia',
      label: 'História',
      conteudo_md: `
## De Aristócles a Platão: O Jovem Nobre
Nascido em Atenas (c. 428/427 a.C.) no seio de uma das famílias mais aristocráticas da Grécia, seu nome verdadeiro era Aristócles. O apelido "Platão" (que significa "ombros largos" ou "fronte larga") teria sido dado por seu professor de ginástica, devido ao seu porte atlético. Inicialmente, o jovem nobre parecia destinado à glória na política ateniense ou nas artes, dedicando-se à escrita de tragédias e poesias.

No entanto, por volta dos 20 anos, um encontro mudaria a trajetória de sua vida e do pensamento ocidental: ele conheceu **Sócrates**. Fascinado pela mente afiada, pelas perguntas penetrantes e pela total ausência de ambição material de Sócrates, Platão abandonou suas pretensões políticas e literárias, queimou suas tragédias e tornou-se seu mais devotado discípulo.

## O Trauma do Julgamento e a Fuga de Atenas
O evento mais definidor da vida de Platão ocorreu em 399 a.C.: o julgamento e a condenação à morte de seu mestre. Para Platão, ver a democracia ateniense condenar o "homem mais justo e sábio de seu tempo" à morte por envenenamento (cicuta) foi um trauma indelével. Ele concluiu que um Estado governado pelas paixões cegas das massas e pela retórica de políticos gananciosos estaria sempre fadado à corrupção e à tirania.

Desiludido e correndo risco de perseguição por ser associado a Sócrates, Platão fugiu de Atenas. Ele viajou extensivamente por cerca de 12 anos, passando pelo Egito (onde absorveu conhecimentos matemáticos e místicos), Cirene e a Magna Grécia (sul da Itália e Sicília), onde entrou em contato com os pitagóricos, cujos estudos sobre os números e a harmonia do universo influenciaram profundamente sua visão de que a realidade verdadeira era abstrata e inteligível, e não física.

## A Academia: A Primeira Universidade do Ocidente
Ao retornar a Atenas (c. 387 a.C.), Platão fundou a **Academia** em um bosque dedicado ao herói Academos. Muito mais do que uma escola, a Academia foi a primeira instituição de ensino superior da Europa. Acima de suas portas, diz-se que havia a inscrição: *"Não entre aqui quem não for geômetra"*.

Na Academia, Platão não ensinava verdades prontas, mas sim treinava a mente dos jovens na dialética, na matemática e na filosofia, preparando-os para serem os futuros líderes sábios das cidades gregas. A instituição duraria, de forma contínua ou intermitente, por quase 900 anos, até ser fechada pelo imperador cristão Justiniano em 529 d.C. Foi lá que Platão formou seu mais brilhante aluno e futuro crítico, Aristóteles.

## A Teoria das Ideias e o Mito da Caverna
A espinha dorsal do pensamento de Platão é a sua **Teoria das Ideias (ou Formas)**. Ele argumentava que o mundo em que vivemos (o mundo sensível, captado pelos cinco sentidos) é apenas uma cópia imperfeita, instável e corruptível de uma realidade superior, eterna e perfeita (o Mundo Inteligível).

Essa visão é magistralmente ilustrada no **Mito da Caverna** (Livro VII de A República). Platão compara os seres humanos a prisioneiros acorrentados no fundo de uma caverna escura desde o nascimento. Eles só conseguem ver sombras projetadas na parede por uma fogueira às suas costas, e acreditam que essas sombras são a "realidade". O filósofo é aquele que consegue se libertar das correntes, sair da caverna, enfrentar a dor da luz do Sol (a Ideia do Bem e da Verdade Suprema) e contemplar a verdadeira realidade. Quando ele retorna para libertar os outros prisioneiros, eles o chamam de louco e ameaçam matá-lo (uma clara alusão ao destino de Sócrates).
      `
    },
    {
      id: 'obras',
      label: 'Principais Obras',
      conteudo_md: `
> "Toda a filosofia ocidental não passa de uma série de notas de rodapé às obras de Platão." (Alfred North Whitehead)

Diferente de Sócrates, Platão escreveu muito, e de forma genial. Suas obras quase sempre têm o formato de **diálogos**, com Sócrates geralmente sendo o personagem principal que interroga e destrói os falsos argumentos de seus oponentes. A escolha pelo diálogo não é acidental: reproduz a dialética viva que ele aprendera com Sócrates.

* **A República:** A mais importante e influente de suas obras. Nela, ele tenta definir o que é a Justiça. Platão constrói na teoria um Estado perfeito (a Calípolis), dividindo a sociedade em três classes rigorosas de acordo com o tipo de alma de cada indivíduo: os produtores/artesãos (alma apetitiva), os guerreiros (alma irascível) e, no topo, governando a cidade, os **Reis-Filósofos** (alma racional). É a matriz do pensamento político e utópico ocidental.
* **O Banquete:** Uma obra-prima literária que discute a natureza de Eros (o Amor). Através dos discursos de vários convidados em uma festa em Atenas, Platão eleva o conceito de amor de uma simples atração física para um desejo pela eternidade e, finalmente, para a contemplação do Belo e do Bem em si mesmos (a origem do termo "amor platônico").
* **Fédon:** Narra os últimos momentos de Sócrates na prisão. É onde Platão desenvolve seus argumentos sobre a imortalidade da alma e introduz de forma mais explícita a Teoria das Ideias.
* **Mênon:** Um diálogo fascinante onde Sócrates demonstra que aprender é, na verdade, **lembrar** (Teoria da Anamnese). Fazendo perguntas a um escravo ignorante, Sócrates faz com que o garoto "descubra" sozinho um complexo teorema geométrico, provando que a alma já continha o conhecimento antes de nascer.
* **As Leis:** A última e mais extensa obra de Platão. Escrita quando ele já era mais velho e pragmático (após o fracasso em tentar transformar o tirano Dionísio de Siracusa em um rei-filósofo), o livro é um tratado exaustivo de legislação, onde a rigidez das Leis substitui o ideal inatingível do Rei-Filósofo perfeito.
      `
    },
    {
      id: 'tabela',
      label: 'Platão vs Democracia Ateniense',
      tabela: {
        oponenteNome: 'A Democracia Ateniense',
        items: [
          {
            topico: 'Quem deve governar?',
            personagem: 'Apenas os mais sábios, treinados por décadas na dialética e na filosofia (A Aristocracia do Intelecto: O Rei-Filósofo).',
            oponente: 'A maioria, ou líderes eleitos e sorteados entre cidadãos comuns (muitas vezes ignorantes e guiados por paixões).'
          },
          {
            topico: 'O propósito do Estado',
            personagem: 'Fazer com que a cidade e a alma dos cidadãos reflitam a Justiça perfeita do Mundo das Ideias.',
            oponente: 'Acomodar os interesses conflitantes, buscar a riqueza, expansão naval e satisfação material do povo.'
          },
          {
            topico: 'A Justiça',
            personagem: 'Uma harmonia perfeita onde cada pessoa cumpre a função para a qual sua alma é naturalmente mais apta.',
            oponente: 'Uma convenção social ou o resultado das votações na Assembleia.'
          },
          {
            topico: 'Os Políticos (Sofistas e Demagogos)',
            personagem: 'São como cozinheiros que dão doces a crianças para ganhar popularidade, adoecendo o corpo do Estado a longo prazo.',
            oponente: 'Eram admirados como grandes oradores que protegiam o poder do povo ateniense.'
          }
        ]
      }
    },
    {
      id: 'legado',
      label: 'O Legado Jurídico',
      conteudo_md: `
## O Fundador do Idealismo Jurídico e da Lei como Instrumento de Educação

O legado de Platão para o Direito é incomensurável, pois foi ele o primeiro a estruturar filosoficamente a ideia de um "Direito Ideal" em contraposição ao "Direito Positivo" imperfeito da Terra.

### A Justiça como Harmonia (A República)
Na *República*, Platão define a Justiça não como um conjunto de regras punitivas, mas como uma virtude arquitetônica e estrutural. A Justiça é a **Harmonia**. Ela ocorre quando cada elemento de um sistema cumpre a sua excelência própria. No indivíduo, a Justiça acontece quando a Razão governa as emoções e os apetites. No Estado, a Justiça acontece quando os Reis-Filósofos governam, os guerreiros protegem e os artesãos produzem, sem que uma classe invada a função da outra. Essa macro-visão da justiça influenciou toda a doutrina do Bem Comum que viria a embasar o Direito Público medieval e moderno.

### O Mito do Rei-Filósofo vs. O Império das Leis
Na juventude e maturidade (A República), Platão acreditava que se conseguíssemos produzir governantes absolutamente perfeitos e sábios, as Leis seriam desnecessárias, pois o Rei-Filósofo julgaria cada caso individualmente com sabedoria divina. As leis seriam até mesmo um estorvo, por serem genéricas e rígidas demais para abarcar a complexidade humana.
Entretanto, em sua obra final (As Leis), após tentativas frustradas e perigosas de educar tiranos no mundo real, Platão aceita o peso trágico da imperfeição humana. Ele consolida a doutrina do **Império da Lei**: como deuses e reis-filósofos perfeitos são praticamente impossíveis de encontrar, a única forma de evitar a tirania do homem é **colocar a Lei como soberana absoluta do Estado**, acima de qualquer magistrado. Essa é a gênese do "Rule of Law" (Estado de Direito).

### A Lei como Ferramenta Pedagógica
Diferente da visão moderna de que a lei existe apenas para evitar o dano ao próximo e manter a paz, Platão argumentava (em *As Leis*) que a Lei tem um papel primariamente **educativo e curativo**. Para Platão, a lei ideal não apenas pune, mas ela deve trazer um preâmbulo persuasivo explicando *por que* aquilo é errado. O criminoso, para Platão, é apenas um ignorante da verdadeira virtude, sofrendo de uma "doença da alma". A punição legal deve ser a medicina que purifica a alma e restaura o infrator, fundando assim a teoria da **função reeducativa da pena**, que está presente na execução penal contemporânea.
      `
    },
    {
      id: 'linha_do_tempo',
      label: 'Timeline',
      timeline: [
        { ano: '428/427 a.C.', evento: 'Nascimento', detalhe: 'Nasce em Atenas (como Aristócles), oriundo de influente família da velha aristocracia.' },
        { ano: '407 a.C.', evento: 'O Encontro', detalhe: 'Conhece Sócrates aos 20 anos, abandona a literatura dramática e se consagra à filosofia.' },
        { ano: '399 a.C.', evento: 'Morte de Sócrates', detalhe: 'Testemunha a condenação e execução de seu mestre. Deixa Atenas em exílio voluntário, desiludido com a política.' },
        { ano: 'c. 387 a.C.', evento: 'Fundação da Academia', detalhe: 'Após anos viajando (Egito e Magna Grécia), retorna a Atenas e funda a Academia, a primeira instituição de ensino superior da Europa.' },
        { ano: '367 a.C. e 361 a.C.', evento: 'As Viagens à Sicília', detalhe: 'Tenta colocar em prática o seu ideal político, buscando transformar o tirano de Siracusa (Dionísio II) em um Rei-Filósofo. Fracassa e quase é vendido como escravo.' },
        { ano: '348/347 a.C.', evento: 'Morte', detalhe: 'Morre em Atenas por volta dos 80 anos, deixando o sobrinho Espeusipo no comando da Academia.' }
      ]
    }
  ]
};
