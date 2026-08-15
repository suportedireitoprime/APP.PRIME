import { BiografiaData } from '@/types/biografia';

export const aristotelesData: BiografiaData = {
  id: 'aristoteles',
  categoriaId: 'filosofos',
  nome: 'Aristóteles',
  subtitulo: 'O Estagirita, fundador do Liceu e sistematizador da Justiça Comutativa e Distributiva.',
  imagemUrl: '/biografias/aristoteles-capa.jpg',
  epoca: 'Antiguidade Clássica',
  ordemEpoca: 3,
  datasVida: '(384 a.C. – 322 a.C.)',
  tabs: [
    {
      id: 'historia',
      label: 'História',
      conteudo_md: `
## O Estagirita e o Realismo Filosófico

Nascido em Estagira (Macedônia) em 384 a.C., Aristóteles foi filho de Nicômaco, médico do rei da Macedônia. Essa origem ligada à medicina moldou sua visão de mundo, fazendo-o valorizar profundamente a biologia, a observação da natureza e o estudo empírico das coisas — contrastando com a abstração puramente teórica que dominava a filosofia anterior.

Aos 17 anos, Aristóteles foi enviado a Atenas para estudar na Academia de Platão, onde permaneceu por cerca de 20 anos. Ele foi o aluno mais brilhante de Platão, mas sua mente científica gradualmente o afastou do Idealismo do mestre. Enquanto Platão acreditava que a verdade estava no "Mundo das Ideias" (inacessível aos sentidos), Aristóteles cravou que a verdade deve ser extraída deste próprio mundo material, através da observação, da lógica e da categorização.

## A Tutoria de Alexandre, o Grande, e o Liceu

Após a morte de Platão, Aristóteles deixou Atenas e viajou pela Ásia Menor, aprofundando seus estudos empíricos, especialmente em biologia marinha. Em 343 a.C., foi convocado pelo rei Filipe II da Macedônia para ser o preceptor de seu filho adolescente, que entraria para a história como Alexandre, o Grande. Aristóteles ensinou literatura, política e ética ao futuro conquistador.

Ao retornar a Atenas em 335 a.C., já sob o império macedônico, Aristóteles fundou sua própria escola: o **Liceu**. Os estudantes do Liceu ficaram conhecidos como "peripatéticos" (os que passeiam), pois Aristóteles tinha o hábito de dar suas aulas caminhando pelos bosques da escola. Ali, ele criou o primeiro grande esforço de sistematização de todo o conhecimento humano, dividindo os saberes em física, biologia, ética, política, lógica e retórica.

## O Exílio e o Fim da Vida

Com a morte súbita de Alexandre em 323 a.C., um forte sentimento anti-macedônico eclodiu em Atenas. Devido às suas estreitas ligações com a corte da Macedônia, Aristóteles foi acusado de "impiedade" (a mesma acusação que matara Sócrates). Para evitar que Atenas "pecasse duas vezes contra a filosofia", Aristóteles exilou-se voluntariamente na ilha de Eubeia, onde morreu de problemas estomacais no ano seguinte, aos 62 anos.
      `
    },
    {
      id: 'obras',
      label: 'Principais Obras',
      conteudo_md: `
A obra de Aristóteles é o alicerce do pensamento ocidental moderno. Suas investigações definiram o vocabulário e a estrutura do Direito, da ciência e da lógica por mais de dois milênios.

* **Ética a Nicômaco:** A obra definitiva sobre o comportamento humano, a virtude e a justiça. Nela, Aristóteles formula a teoria da "Justa Medida" (ou Justo Meio), argumentando que a virtude está no equilíbrio entre o excesso e a falta (por exemplo, a coragem é o meio-termo entre a covardia e a temeridade). É neste livro que ele estabelece a divisão clássica da Justiça.
* **Política:** A continuidade natural de sua Ética. Para Aristóteles, o homem é um "animal político" (*Zoon Politikon*) que só atinge sua plenitude vivendo na Pólis (cidade-Estado). Ele analisa as formas de governo (Monarquia, Aristocracia, Politeia) e suas formas corrompidas (Tirania, Oligarquia, Democracia/Demagogia).
* **Retórica:** O primeiro tratado a sistematizar as técnicas de persuasão humana, estabelecendo o tripé da argumentação: o *Ethos* (a credibilidade do orador), o *Pathos* (o apelo emocional à plateia) e o *Logos* (o argumento lógico e racional).
* **Órganon:** O conjunto de suas obras sobre Lógica. Aristóteles foi o inventor da Lógica formal, estabelecendo o conceito de Silogismo, essencial para a hermenêutica e subsunção jurídica modernas (Premissa Maior, Premissa Menor e Conclusão).
      `
    },
    {
      id: 'tabela',
      label: 'Aristóteles vs Platão',
      tabela: {
        oponenteNome: 'Platão (Idealismo)',
        items: [
          {
            topico: 'Onde reside a Verdade?',
            personagem: 'Realismo Empírico. A verdade e a "forma" das coisas estão dentro das próprias coisas no mundo físico. Conhece-se através da experiência (sentidos).',
            oponente: 'A verdade perfeita reside exclusivamente no Mundo das Ideias (Inteligível). O mundo físico é apenas uma cópia pálida e enganosa.'
          },
          {
            topico: 'Conceito de Justiça',
            personagem: 'É uma virtude prática e social, baseada na equidade e na proporcionalidade (dar a cada um o que é seu na medida de seus méritos ou perdas).',
            oponente: 'A Justiça é a harmonia absoluta da alma e do Estado, onde cada classe (filósofos, guerreiros, artesãos) cumpre estritamente sua função.'
          },
          {
            topico: 'Governo Ideal',
            personagem: 'A Politeia (uma mescla de oligarquia e democracia focada no bem comum) gerida por uma classe média forte, que evita os extremos de riqueza e pobreza.',
            oponente: 'O reinado do Filósofo-Rei. Apenas os dotados de sabedoria superior e sem interesses materiais seriam capazes de governar com justiça.'
          },
          {
            topico: 'O Papel da Lei',
            personagem: 'A Lei é a razão livre da paixão. Ela é indispensável, superior aos governantes e deve ser complementada pela "Equidade" quando for rígida demais.',
            oponente: 'Na República ideal governada pelo sábio, as leis escritas seriam quase desnecessárias, pois o Filósofo-Rei tomaria sempre a decisão perfeita.'
          }
        ]
      }
    },
    {
      id: 'direito',
      label: 'A Matemática da Justiça',
      conteudo_md: `
## O Fundamento da Justiça no Direito Moderno

Se o Direito contemporâneo utiliza réguas de compensação e punição proporcional, devemos isso a Aristóteles. Em sua "Ética a Nicômaco", ele foi o primeiro pensador a dissecar a Justiça não apenas como uma virtude moral interna, mas como uma **fórmula matemática de convivência social**.

Ele dividiu a Justiça Particular em duas categorias práticas que guiam nossos códigos civis e penais até hoje:

### Justiça Distributiva (Proporcionalidade)
Aplica-se à relação entre o Estado (o todo) e os indivíduos (as partes). Como distribuir bens, honrarias, cargos ou fardos (como impostos)? Aristóteles definiu que a distribuição deve seguir o princípio geométrico do mérito: "tratar os desiguais na medida de suas desigualdades". Aquele que contribui mais para a pólis deve receber uma fatia maior. (É o embrião da capacidade contributiva no Direito Tributário e do princípio da isonomia material).

### Justiça Comutativa / Corretiva (Aritmética)
Aplica-se às relações privadas entre indivíduos (contratos, delitos). Aqui o mérito das pessoas não importa (não importa se um homem é rico e o outro é pobre; se um é bom e o outro mau). O papel do juiz é puramente aritmético: se A roubou ou causou dano a B, houve um ganho ilícito para A e uma perda para B. A Justiça Corretiva age para restaurar o equilíbrio perfeito, tirando o excesso de A para devolver a B. (É a essência da Responsabilidade Civil Objetiva e Subjetiva).

## A Equidade: A Régua de Lesbos
Aristóteles percebeu um defeito crônico nas leis escritas: elas são gerais e universais, mas os casos da vida real são únicos e complexos. Ao aplicar uma lei rígida a um caso peculiar, a própria lei pode se tornar uma grande injustiça (*Summum jus, summa injuria*). 

Para corrigir essa rigidez legislativa, Aristóteles elaborou o conceito de **Equidade** (*Epiqueia*). Ele a comparou à "Régua de chumbo de Lesbos" (usada pelos pedreiros gregos): diferente de uma régua reta de madeira, a régua de chumbo podia se curvar e adaptar aos contornos irregulares das pedras. A Equidade é, portanto, a adaptação inteligente da lei genérica à irregularidade e concretude do caso humano, um princípio basilar que guia a margem de discricionariedade e a humanização das decisões judiciais de nossos juízes hoje.
      `
    },
    {
      id: 'linha_do_tempo',
      label: 'Timeline',
      timeline: [
        { ano: '384 a.C.', evento: 'Nascimento em Estagira', detalhe: 'Nasce no norte da Grécia. Seu pai, Nicômaco, era o médico da corte do rei Amintas III da Macedônia.' },
        { ano: '367 a.C.', evento: 'A Academia de Platão', detalhe: 'Aos 17 anos, viaja para Atenas para ingressar na Academia. Torna-se o aluno mais brilhante de Platão.' },
        { ano: '343 a.C.', evento: 'Tutoria de Alexandre', detalhe: 'Convidado por Filipe II, torna-se o preceptor do jovem Alexandre (futuro "Alexandre, o Grande"), forjando uma aliança histórica.' },
        { ano: '335 a.C.', evento: 'Fundação do Liceu', detalhe: 'Retorna a Atenas e funda sua própria escola, onde cria o sistema de classificação das ciências (Lógica, Ética, Política, Biologia).' },
        { ano: '323 a.C.', evento: 'Fuga de Atenas', detalhe: 'Com a morte de Alexandre, um sentimento anti-macedônico domina Atenas. Acusado de impiedade, ele exila-se em Eubeia.' },
        { ano: '322 a.C.', evento: 'Falecimento', detalhe: 'Morre um ano após seu exílio, deixando o maior e mais diversificado acervo de pesquisa da Antiguidade Clássica.' }
      ]
    }
  ]
};
