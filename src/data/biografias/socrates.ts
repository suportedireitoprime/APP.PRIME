import { BiografiaData } from '@/types/biografia';

export const socratesData: BiografiaData = {
  id: 'socrates',
  categoriaId: 'filosofos',
  nome: 'Sócrates de Atenas',
  subtitulo: 'O homem que foi condenado por fazer perguntas e ensinar os jovens a pensar.',
  imagemUrl: 'https://images.unsplash.com/photo-1598980894043-f875f284e36d?q=80&w=600&auto=format&fit=crop', // Estátua de mármore como placeholder
  tabs: [
    {
      id: 'historia',
      label: 'História',
      conteudo_md: `
## O Contexto de Atenas e o Surgimento de Sócrates

Sócrates não deixou uma única linha escrita. Tudo o que sabemos sobre ele nos foi relatado por seus discípulos (principalmente Platão e Xenofonte) ou por seus opositores, como o comediógrafo Aristófanes, que chegou a zombar dele na peça "As Nuvens". Nascido em Atenas (c. 470 a.C.), filho de um escultor (Sofronisco) e de uma parteira (Fenareta), ele viveu o apogeu da democracia ateniense sob o governo de Péricles e também sua decadência após a trágica derrota na Guerra do Peloponeso contra Esparta.

Ele costumava dizer que herdou a profissão da mãe: sua missão não era depositar verdades prontas nas mentes dos jovens, mas sim **ajudá-los a "dar à luz" as suas próprias ideias** — método que ficou conhecido como **Maiêutica** (a arte do parto intelectual). Ele acreditava que o conhecimento já residia dentro da alma humana (Reminiscência), precisando apenas das perguntas corretas para vir à tona.

## O Método Socrático e a Ironia

Diferente dos professores convencionais da época (os sofistas), Sócrates não cobrava por suas aulas. Ele não tinha uma "escola" fechada. Andava pelas ágoras, estádios e mercados de Atenas, geralmente descalço e vestindo o mesmo manto puído o ano inteiro, puxando conversa com qualquer um — de generais a escravos. Ele abordava os mais aclamados intelectuais da cidade e lançava perguntas diretas sobre os valores morais: *"O que é a justiça? O que é a coragem? O que é a piedade?"*.

Quando o interlocutor, cheio de si, respondia com arrogância, Sócrates aplicava a famosa **ironia socrática**. Ele fingia ignorância e concordava superficialmente, para então começar a fazer perguntas sequenciais que levavam o próprio indivíduo a tropeçar em suas contradições lógicas, expondo a fragilidade do seu saber. Essa demolição do ego alheio em praça pública gerava um público fiel de jovens fascinados, mas também criava inimigos poderosos entre os políticos e ricos.

## O Julgamento e a Morte: O Primeiro Mártir do Pensamento Livre

Em 399 a.C., no auge do ressentimento público contra ele (uma Atenas recém derrotada precisava de um bode expiatório), Sócrates foi processado formalmente sob duas acusações graves: **corromper a juventude** e **não acreditar nos deuses da cidade (impietade)**. 

O julgamento, relatado em *A Apologia de Sócrates*, foi o primeiro e talvez o maior teatro jurídico-político da história do Ocidente. Em vez de implorar por misericórdia, levar a esposa chorando ou prometer mudar seu comportamento, Sócrates irritou ainda mais o júri de 500 atenienses. Ele argumentou que a cidade não deveria puni-lo, mas sim **pagar um salário e lhe dar refeições gratuitas** pelo bem que ele fazia ao mantê-los acordados. Ele se comparou a uma "mutuca" (um inseto) enviada pelos deuses para picar o grande, porém preguiçoso, cavalo de Atenas, impedindo-o de adormecer na ignorância.

Como esperado, a arrogância retórica cobrou seu preço: ele foi condenado à morte por ingestão de **cicuta** (um veneno paralisante). Seus amigos mais ricos (incluindo Críton e Platão) subornaram os guardas e prepararam uma rota de fuga. Contudo, em um ato que fundaria as bases do contratualismo e da obediência civil, Sócrates se recusou a fugir. Ele afirmou que se passara a vida usufruindo da proteção das leis de Atenas, fugir agora para salvar a própria vida seria destruir a validade dessas mesmas leis. Ele bebeu o veneno voluntariamente, cercado de amigos, conversando sobre a imortalidade da alma até que o frio atingisse seu coração.
      `
    },
    {
      id: 'obras',
      label: 'Principais Obras',
      conteudo_md: `
> "Eu nada escrevi. E é por não escrever nada que serei lido para sempre."

Sócrates acreditava na superioridade da tradição oral. Para ele, a filosofia só existia no calor do diálogo e na refutação instantânea. Ele desconfiava profundamente da escrita porque textos estáticos são impotentes: "quando questionados, eles apenas repetem sempre a mesma coisa e não podem se defender". Ele via a leitura passiva como um veneno para a memória humana e para a agilidade intelectual.

Felizmente, seu aluno mais devotado e brilhante, Platão, decidiu imortalizá-lo. Platão criou um gênero literário novo, os *Diálogos*, onde Sócrates é invariavelmente o personagem principal encurralando sofistas e pensadores. As obras podem ser divididas pela idade de Platão, mas para iniciar os estudos sobre a visão socrática do mundo e da justiça, as mais importantes são:

* **A Apologia de Sócrates**: O discurso de defesa feito por ele próprio perante o tribunal popular de Atenas. É a transcrição quase jornalística de sua defesa criminal. Nele, Sócrates narra o episódio do Oráculo de Delfos, justifica sua postura ética e faz um desafio direto à autoridade cega.
* **Críton**: O diálogo na prisão. Um tratado sobre a Lei, o Estado e a Moral. É aqui que Sócrates explica aos amigos o porquê de não escapar da morte. Ele invoca a personificação das Leis de Atenas, provando que duas injustiças não fazem uma justiça.
* **Fédon**: Relata as últimas horas de vida de Sócrates. Enquanto o veneno estava sendo preparado, ele discute com seus discípulos, de forma lúcida e bem-humorada, a natureza da alma, a imortalidade e o motivo pelo qual um verdadeiro filósofo não deve temer a morte, pois a vida seria apenas uma preparação para o desprendimento do corpo físico.
* **A República (Livros I e II)**: Embora *A República* inteira seja considerada o suprassumo do pensamento platônico maduro, o início da obra traz o autêntico Sócrates enfrentando o sofista Trasímaco no debate clássico sobre a definição de Justiça e se "a justiça é apenas a conveniência do mais forte".
      `
    },
    {
      id: 'tabela',
      label: 'Sócrates vs Sofistas',
      tabela: {
        oponenteNome: 'Os Sofistas (Advogados da Antiguidade)',
        items: [
          {
            topico: 'O que é a Verdade?',
            personagem: 'Acreditava que a verdade é absoluta e universal, e que ela já está dentro de nós (basta fazer as perguntas certas).',
            oponente: 'Acreditavam no Relativismo. A verdade é aquilo que você conseguir convencer o tribunal a acreditar.'
          },
          {
            topico: 'Qual o papel da Retórica?',
            personagem: 'Um instrumento perigoso se não for guiado pela moral. Falar bem não importa se você estiver defendendo o mal.',
            oponente: 'A ferramenta mais importante do Estado. Vender aulas de oratória era o modelo de negócios deles.'
          },
          {
            topico: 'O propósito do Diálogo',
            personagem: 'Aproximar os dois lados da Sabedoria e da Virtude (Arete). O objetivo é aprender, não "ganhar".',
            oponente: 'Vencer o debate a qualquer custo, mesmo que o argumento seja uma falácia (Eristica).'
          },
          {
            topico: 'Cobrança por aulas',
            personagem: 'Filosofava de graça nas praças. Considerava prostituição intelectual cobrar para ensinar a virtude.',
            oponente: 'Cobravam fortunas (honorários) para ensinar filhos de políticos a discursar no tribunal.'
          }
        ]
      }
    },
    {
      id: 'legado',
      label: 'O Legado Jurídico',
      conteudo_md: `
## O Precedente da Defesa e da Ética Processual

Ao contrário do que vemos nos currículos puramente juspositivistas, a base do pensamento de Sócrates ecoa em quase toda a teoria do processo contemporâneo e da filosofia do Direito Constitucional. O grande paradoxo da sua vida é que o homem mais crítico da democracia ateniense morreu justamente porque decidiu obedecê-la até as últimas consequências.

### A Apologia e o Tribunal como Espaço de Verdade
O julgamento de Sócrates é o marco primário no estudo do **Direito Processual**. Na *Apologia*, temos um vislumbre fascinante do tribunal de júri da Antiguidade (a *Helileia*), sem promotores e advogados formais — as próprias partes deveriam discursar com a ampulheta correndo.
Sócrates inaugura o que poderíamos chamar de **Ética Processual Pura**. Ele recusa o uso de táticas retóricas apelativas. Ele não veste trapos para gerar pena, recusa trazer sua mulher (Xantipa) e os filhos pequenos para chorarem diante dos juízes — algo rotineiro na época. Ele adverte os juízes de que quem decide através das emoções e das lágrimas macula o juramento sagrado do Magistrado de julgar apenas pelos fatos. Ele exige que o Tribunal seja um espaço de revelação da verdade (Aletheia), e não um concurso teatral.

### Contrato Social e Segurança Jurídica
Mais de dois milênios antes de Hobbes, Locke e Rousseau teorizarem sobre o **Contrato Social**, Sócrates rascunhou a sua premissa fundamental nas masmorras atenienses. No diálogo *Críton*, ele explica que um cidadão firma um acordo tácito com o Estado.
*"Fui educado pela cidade, casei-me sob suas leis, criei filhos sob suas regras, e nunca achei suas leis tão ruins a ponto de querer me mudar para Esparta"*. Logo, ele argumenta que o Estado não é um cardápio onde o cidadão escolhe obedecer às leis que o favorecem e desobedecer àquelas que o condenam. Destruir a sentença do juiz (fugindo) é o equivalente moral a destruir o próprio Estado, violando a Segurança Jurídica, o que causaria um mal à sociedade muito maior do que a perda da sua própria vida. A integridade da Lei, para Sócrates, sobrepuja o interesse individual.
      `
    },
    {
      id: 'linha_do_tempo',
      label: 'Timeline',
      timeline: [
        { ano: 'c. 470 a.C.', evento: 'Nascimento', detalhe: 'Nasce em Atenas, filho de Sofronisco (pedreiro/escultor) e Fenareta (parteira).' },
        { ano: '431 - 404 a.C.', evento: 'Guerra do Peloponeso', detalhe: 'Luta como hoplita (soldado de infantaria) por Atenas, destacando-se pela extrema bravura e resistência ao frio e fome.' },
        { ano: 'c. 420 a.C.', evento: 'O Oráculo de Delfos', detalhe: 'Querefonte, seu amigo, pergunta ao Oráculo quem é o homem mais sábio. O Oráculo responde: Sócrates. Ele conclui que só é o mais sábio porque "Sabe que nada sabe".' },
        { ano: '399 a.C.', evento: 'O Julgamento', detalhe: 'Acusado por Meleto, Ânito e Lícon de corromper a juventude e inventar deuses. Condenado por um júri de 500 cidadãos atenienses (280 contra 220).' },
        { ano: '399 a.C.', evento: 'A Morte', detalhe: 'Bebe cicuta na prisão, cercado de amigos, conversando calmamente sobre a imortalidade da alma até os últimos segundos.' }
      ]
    }
  ]
};
