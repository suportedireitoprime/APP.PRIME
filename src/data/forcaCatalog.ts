export interface ForcaWord {
  word: string;
  hint: string;
}

export interface ForcaArticle {
  id: string;
  title: string;
  description: string;
  phases: ForcaWord[];
}

export interface ForcaLaw {
  id: string;
  name: string;
  articles: ForcaArticle[];
}

export interface ForcaArea {
  id: string;
  name: string;
  laws: ForcaLaw[];
}

export const forcaCatalog: ForcaArea[] = [
  {
    id: 'direito-penal',
    name: 'Direito Penal',
    laws: [
      {
        id: 'codigo-penal',
        name: 'Código Penal (CP)',
        articles: [
          {
            id: 'art-121',
            title: 'Art. 121 - Homicídio',
            description: 'Matar alguém.',
            phases: [
              { word: 'HOMICIDIO', hint: 'Crime de matar alguém.' },
              { word: 'QUALIFICADO', hint: 'Quando o crime é cometido por motivo fútil ou torpe.' },
              { word: 'CULPOSO', hint: 'Quando não há intenção de matar.' },
              { word: 'PRIVILEGIADO', hint: 'Cometido sob o domínio de violenta emoção.' },
              { word: 'RECLUSAO', hint: 'Tipo de pena privativa de liberdade.' },
            ]
          },
          {
            id: 'art-155',
            title: 'Art. 155 - Furto',
            description: 'Subtrair, para si ou para outrem, coisa alheia móvel.',
            phases: [
              { word: 'FURTO', hint: 'Subtração sem violência ou grave ameaça.' },
              { word: 'COISA MOVEL', hint: 'Objeto do crime.' },
              { word: 'REPOUSO NOTURNO', hint: 'Causa de aumento de pena.' },
              { word: 'ABUSO DE CONFIANCA', hint: 'Uma das qualificadoras do crime.' },
              { word: 'FAMELICO', hint: 'Furto cometido em estado de necessidade para saciar a fome.' },
            ]
          }
        ]
      },
      {
        id: 'lei-maria-penha',
        name: 'Lei Maria da Penha',
        articles: [
          {
            id: 'art-7',
            title: 'Art. 7º - Formas de Violência',
            description: 'Tipos de violência doméstica e familiar contra a mulher.',
            phases: [
              { word: 'FISICA', hint: 'Ofensa à integridade ou saúde corporal.' },
              { word: 'PSICOLOGICA', hint: 'Dano emocional e diminuição da autoestima.' },
              { word: 'SEXUAL', hint: 'Conduta que a constranja a presenciar, manter ou participar de relação não desejada.' },
              { word: 'PATRIMONIAL', hint: 'Retenção, subtração ou destruição de bens.' },
              { word: 'MORAL', hint: 'Conduta que configure calúnia, difamação ou injúria.' },
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'direito-constitucional',
    name: 'Direito Constitucional',
    laws: [
      {
        id: 'cf-88',
        name: 'Constituição Federal',
        articles: [
          {
            id: 'art-5',
            title: 'Art. 5º - Direitos e Deveres',
            description: 'Direitos e garantias fundamentais.',
            phases: [
              { word: 'IGUALDADE', hint: 'Todos são iguais perante a lei.' },
              { word: 'LIBERDADE', hint: 'Direito de ir, vir e ficar.' },
              { word: 'PROPRIEDADE', hint: 'Direito de possuir bens, atendida a função social.' },
              { word: 'HABEAS CORPUS', hint: 'Remédio para garantir a liberdade de locomoção.' },
              { word: 'HABEAS DATA', hint: 'Remédio para garantir o conhecimento de informações relativas à pessoa do impetrante.' },
            ]
          }
        ]
      }
    ]
  }
];
