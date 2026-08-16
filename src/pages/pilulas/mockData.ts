export const DECKS_PILULAS = [
  {
    id: 'stf',
    titulo: 'Supremo Tribunal Federal',
    descricao: 'Entenda a estrutura, as funções e conheça os ministros da Suprema Corte.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Supremo_Tribunal_Federal_%28Brasil%29.jpg',
    quantidade: 3,
  },
  {
    id: 'penal',
    titulo: 'Direito Penal Essencial',
    descricao: 'Conceitos fundamentais de dolo, culpa, ilicitude e muito mais.',
    imagem: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Scale_of_justice_2.jpg',
    quantidade: 3,
  }
];

export const MOCK_PILULAS_DATA: Record<string, { id: string; title: string; subtitle: string; image: string; text: string }[]> = {
  stf: [
    {
      id: 'stf-1',
      title: 'Supremo Tribunal Federal',
      subtitle: 'O guardião da Constituição',
      image: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Supremo_Tribunal_Federal_%28Brasil%29.jpg',
      text: 'O STF é a mais alta instância do Poder Judiciário brasileiro. Sua principal função é zelar pela Constituição Federal, atuando como o guardião dos princípios fundamentais da República.',
    },
    {
      id: 'stf-2',
      title: 'Composição da Corte',
      subtitle: 'Como os ministros são escolhidos',
      image: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Plen%C3%A1rio_do_Supremo_Tribunal_Federal.jpg',
      text: 'O STF é composto por 11 Ministros, nomeados pelo Presidente da República após aprovação por maioria absoluta do Senado Federal. Devem ter entre 35 e 70 anos e notável saber jurídico.',
    },
    {
      id: 'stf-3',
      title: 'Presidente Atual',
      subtitle: 'A liderança da Suprema Corte',
      image: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Supremo_Tribunal_Federal_do_Brasil_em_Bras%C3%ADlia.jpg',
      text: 'A presidência do STF tem mandato de dois anos, seguindo tradicionalmente a ordem de antiguidade entre os ministros que ainda não exerceram o cargo.',
    }
  ],
  penal: [
    {
      id: 'penal-1',
      title: 'Dolo vs Culpa',
      subtitle: 'A intenção por trás do ato',
      image: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Pres%C3%ADdio_Central_de_Porto_Alegre.jpg',
      text: 'No Dolo, o agente quer o resultado ou assume o risco de produzi-lo. Na Culpa, o resultado ocorre por imprudência, negligência ou imperícia, sem a intenção do agente.',
    },
    {
      id: 'penal-2',
      title: 'Excludentes de Ilicitude',
      subtitle: 'Quando uma ação não é crime',
      image: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Pal%C3%A1cio_da_Justi%C3%A7a_-_Bras%C3%ADlia.jpg',
      text: 'São causas que afastam o crime: Estado de Necessidade, Legítima Defesa, Estrito Cumprimento de Dever Legal e Exercício Regular de Direito.',
    },
    {
      id: 'penal-3',
      title: 'Princípio da Insignificância',
      subtitle: 'O crime de bagatela',
      image: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Carro_Pol%C3%ADcia_Civil_RS.jpg',
      text: 'Também chamado de Princípio da Bagatela, afasta a tipicidade material do crime quando a lesão ao bem jurídico é ínfima, como pequenos furtos sem violência.',
    }
  ]
};
