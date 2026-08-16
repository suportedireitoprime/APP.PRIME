export const DECKS_PILULAS = [
  {
    id: 'stf',
    titulo: 'Supremo Tribunal Federal',
    descricao: 'Entenda a estrutura, as funções e conheça os ministros da Suprema Corte.',
    imagem: '/assets/stf-1.jpg',
    quantidade: 3,
  },
  {
    id: 'penal',
    titulo: 'Direito Penal Essencial',
    descricao: 'Conceitos fundamentais de dolo, culpa, ilicitude e muito mais.',
    imagem: '/assets/penal.jpg',
    quantidade: 3,
  }
];

export const MOCK_PILULAS_DATA: Record<string, { id: string; title: string; subtitle: string; image: string; text: string }[]> = {
  stf: [
    {
      id: 'stf-1',
      title: 'Supremo Tribunal Federal',
      subtitle: 'O guardião da Constituição',
      image: '/assets/stf-1.jpg',
      text: 'O STF é a mais alta instância do Poder Judiciário brasileiro. Sua principal função é zelar pela Constituição Federal, atuando como o guardião dos princípios fundamentais da República.',
    },
    {
      id: 'stf-2',
      title: 'Composição da Corte',
      subtitle: 'Como os ministros são escolhidos',
      image: '/assets/stf-2.jpg',
      text: 'O STF é composto por 11 Ministros, nomeados pelo Presidente da República após aprovação por maioria absoluta do Senado Federal. Devem ter entre 35 e 70 anos e notável saber jurídico.',
    },
    {
      id: 'stf-3',
      title: 'Presidente Atual',
      subtitle: 'A liderança da Suprema Corte',
      image: '/assets/stf-3.jpg',
      text: 'A presidência do STF tem mandato de dois anos, seguindo tradicionalmente a ordem de antiguidade entre os ministros que ainda não exerceram o cargo.',
    }
  ],
  penal: [
    {
      id: 'penal-1',
      title: 'Dolo vs Culpa',
      subtitle: 'A intenção por trás do ato',
      image: '/assets/penal-1.jpg',
      text: 'No Dolo, o agente quer o resultado ou assume o risco de produzi-lo. Na Culpa, o resultado ocorre por imprudência, negligência ou imperícia, sem a intenção do agente.',
    },
    {
      id: 'penal-2',
      title: 'Excludentes de Ilicitude',
      subtitle: 'Quando uma ação não é crime',
      image: '/assets/penal-2.jpg',
      text: 'São causas que afastam o crime: Estado de Necessidade, Legítima Defesa, Estrito Cumprimento de Dever Legal e Exercício Regular de Direito.',
    },
    {
      id: 'penal-3',
      title: 'Princípio da Insignificância',
      subtitle: 'O crime de bagatela',
      image: '/assets/penal-3.jpg',
      text: 'Também chamado de Princípio da Bagatela, afasta a tipicidade material do crime quando a lesão ao bem jurídico é ínfima, como pequenos furtos sem violência.',
    }
  ]
};
