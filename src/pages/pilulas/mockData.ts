export const DECKS_PILULAS = [
  {
    id: 'stf',
    titulo: 'Supremo Tribunal Federal',
    descricao: 'Entenda a estrutura, as funções e conheça os ministros da Suprema Corte.',
    imagem: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop',
    quantidade: 3,
  },
  {
    id: 'penal',
    titulo: 'Direito Penal Essencial',
    descricao: 'Conceitos fundamentais de dolo, culpa, ilicitude e muito mais.',
    imagem: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=800&auto=format&fit=crop',
    quantidade: 3,
  }
];

export const MOCK_PILULAS_DATA: Record<string, { id: string; title: string; image: string; text: string }[]> = {
  stf: [
    {
      id: 'stf-1',
      title: 'Supremo Tribunal Federal',
      image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop',
      text: 'O STF é a mais alta instância do Poder Judiciário brasileiro. Sua principal função é zelar pela Constituição Federal, atuando como o guardião dos princípios fundamentais da República.',
    },
    {
      id: 'stf-2',
      title: 'Composição da Corte',
      image: 'https://images.unsplash.com/photo-1453945619913-79ec89a82c51?q=80&w=800&auto=format&fit=crop',
      text: 'O STF é composto por 11 Ministros, nomeados pelo Presidente da República após aprovação por maioria absoluta do Senado Federal. Devem ter entre 35 e 70 anos e notável saber jurídico.',
    },
    {
      id: 'stf-3',
      title: 'Presidente Atual',
      image: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=800&auto=format&fit=crop',
      text: 'A presidência do STF tem mandato de dois anos, seguindo tradicionalmente a ordem de antiguidade entre os ministros que ainda não exerceram o cargo.',
    }
  ],
  penal: [
    {
      id: 'penal-1',
      title: 'Dolo vs Culpa',
      image: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=800&auto=format&fit=crop',
      text: 'No Dolo, o agente quer o resultado ou assume o risco de produzi-lo. Na Culpa, o resultado ocorre por imprudência, negligência ou imperícia, sem a intenção do agente.',
    },
    {
      id: 'penal-2',
      title: 'Excludentes de Ilicitude',
      image: 'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?q=80&w=800&auto=format&fit=crop',
      text: 'São causas que afastam o crime: Estado de Necessidade, Legítima Defesa, Estrito Cumprimento de Dever Legal e Exercício Regular de Direito.',
    },
    {
      id: 'penal-3',
      title: 'Princípio da Insignificância',
      image: 'https://images.unsplash.com/photo-1453945619913-79ec89a82c51?q=80&w=800&auto=format&fit=crop',
      text: 'Também chamado de Princípio da Bagatela, afasta a tipicidade material do crime quando a lesão ao bem jurídico é ínfima, como pequenos furtos sem violência.',
    }
  ]
};
