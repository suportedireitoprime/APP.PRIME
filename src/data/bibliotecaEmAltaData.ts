import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { readLeituraProgress, formatDuration } from '@/lib/leituraProgress';
import { directImg } from '@/lib/cdnImg';
import coverCpArtigos from '@/assets/covers/cp_artigos_v2.webp';
import coverSobreALiberdade from '@/assets/covers/sobre_a_liberdade_manual.webp';
import coverOEspiritoDasLeis from '@/assets/covers/o_espirito_das_leis_manual.webp';
import coverAArteDaGuerra from '@/assets/covers/a_arte_da_guerra_manual.webp';
import coverALutaPeloDireito from '@/assets/covers/a_luta_pelo_direito_manual.webp';

export interface LivroEmAltaRanking {
  posicao: number;
  livro: LivroNormalizado;
  horasLidas: number;
  leitoresAtivos: number;
  percentualConclusao: number;
  categoriaBadge: string;
  destaqueBadge?: string;
  avaliacao: number;
  avaliacoesCount: number;
  tendencia: string;
  tempoPessoalMs?: number;
}

export const LIVROS_EM_ALTA_BASE: LivroEmAltaRanking[] = [
  {
    posicao: 1,
    horasLidas: 842,
    leitoresAtivos: 3840,
    percentualConclusao: 96,
    categoriaBadge: 'Teoria do Direito',
    destaqueBadge: '🔥 1º Mais Acessado',
    avaliacao: 4.9,
    avaliacoesCount: 1420,
    tendencia: '+28% esta semana',
    livro: {
      id: 144,
      titulo: 'Teoria Pura do Direito',
      autor: 'Hans Kelsen',
      sobre: 'A obra mais influente do positivismo jurídico moderno, estabelecendo a estrutura escalonada das normas e a Grundnorm.',
      capa: directImg(coverCpArtigos, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1XFuOCvzSjk_XWO4xGaWwNqWG_6MsxYYl/view?usp=drive_link',
      area: 'Teoria do Direito',
      colecaoId: 'classicos',
      paginas: 432,
      minutosLeitura: 520,
    },
  },
  {
    posicao: 2,
    horasLidas: 735,
    leitoresAtivos: 3420,
    percentualConclusao: 99,
    categoriaBadge: 'Introdução ao Direito',
    destaqueBadge: '⚡ Clássico Imbatível',
    avaliacao: 5.0,
    avaliacoesCount: 1280,
    tendencia: '+32% esta semana',
    livro: {
      id: 139,
      titulo: 'O Caso dos Exploradores de Cavernas',
      autor: 'Lon L. Fuller',
      sobre: 'Dilema moral e jurídico magistral sobre jusnaturalismo versus juspositivismo diante de situação limite de sobrevivência.',
      capa: directImg(coverALutaPeloDireito, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Filosofia Jurídica',
      colecaoId: 'classicos',
      paginas: 159,
      minutosLeitura: 190,
    },
  },
  {
    posicao: 3,
    horasLidas: 689,
    leitoresAtivos: 3190,
    percentualConclusao: 94,
    categoriaBadge: 'Direito Constitucional',
    destaqueBadge: '🏛️ Consulta Diária',
    avaliacao: 4.9,
    avaliacoesCount: 980,
    tendencia: '+19% esta semana',
    livro: {
      id: 'cf88-consolidada',
      titulo: 'Constituição Federal e Direitos Fundamentais',
      autor: 'Direito Prime Editorial',
      sobre: 'Texto constitucional integral com jurisprudência do STF, notas remissivas e súmulas vinculantes consolidadas.',
      capa: directImg(coverOEspiritoDasLeis, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1XFuOCvzSjk_XWO4xGaWwNqWG_6MsxYYl/view?usp=drive_link',
      area: 'Constitucional',
      colecaoId: 'areas',
      paginas: 380,
      minutosLeitura: 460,
    },
  },
  {
    posicao: 4,
    horasLidas: 564,
    leitoresAtivos: 2780,
    percentualConclusao: 97,
    categoriaBadge: 'Direito Penal',
    destaqueBadge: '⚖️ Criminologia Essencial',
    avaliacao: 4.8,
    avaliacoesCount: 750,
    tendencia: '+15% esta semana',
    livro: {
      id: 140,
      titulo: 'Dos Delitos e das Penas',
      autor: 'Cesare Beccaria',
      sobre: 'O tratado iluminista que humanizou o sistema penal ocidental e aboliu a tortura jurídica.',
      capa: directImg(coverALutaPeloDireito, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Penal',
      colecaoId: 'classicos',
      paginas: 184,
      minutosLeitura: 220,
    },
  },
  {
    posicao: 5,
    horasLidas: 512,
    leitoresAtivos: 2390,
    percentualConclusao: 95,
    categoriaBadge: 'Filosofia do Direito',
    destaqueBadge: '🛡️ Defesa de Direitos',
    avaliacao: 4.9,
    avaliacoesCount: 680,
    tendencia: '+21% esta semana',
    livro: {
      id: 142,
      titulo: 'A Luta pelo Direito',
      autor: 'Rudolf von Ihering',
      sobre: 'Um manifesto apaixonado demonstrando que o direito não é mera teoria, mas conquista viva forjada no combate.',
      capa: directImg(coverALutaPeloDireito, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Filosofia do Direito',
      colecaoId: 'classicos',
      paginas: 140,
      minutosLeitura: 180,
    },
  },
  {
    posicao: 6,
    horasLidas: 478,
    leitoresAtivos: 2110,
    percentualConclusao: 91,
    categoriaBadge: 'Teoria do Estado',
    destaqueBadge: '👑 Separação dos Poderes',
    avaliacao: 4.8,
    avaliacoesCount: 590,
    tendencia: '+11% esta semana',
    livro: {
      id: 143,
      titulo: 'O Espírito das Leis',
      autor: 'Montesquieu',
      sobre: 'Fundamento moderno da separação tripartite de poderes (Executivo, Legislativo e Judiciário) e freios e contrapesos.',
      capa: directImg(coverOEspiritoDasLeis, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Constitucional',
      colecaoId: 'classicos',
      paginas: 520,
      minutosLeitura: 620,
    },
  },
  {
    posicao: 7,
    horasLidas: 445,
    leitoresAtivos: 1980,
    percentualConclusao: 93,
    categoriaBadge: 'Exame de Ordem',
    destaqueBadge: '🎯 Top OAB 1ª Fase',
    avaliacao: 4.9,
    avaliacoesCount: 810,
    tendencia: '+35% esta semana',
    livro: {
      id: 'oab-1fase-estrategia',
      titulo: 'Gabaritando a 1ª Fase da OAB',
      autor: 'Corpo Docente OAB Prime',
      sobre: 'Metodologia cirúrgica dos artigos mais cobrados pela FGV com resolução comentada de questões chave.',
      capa: directImg(coverCpArtigos, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1XFuOCvzSjk_XWO4xGaWwNqWG_6MsxYYl/view?usp=drive_link',
      area: 'OAB',
      colecaoId: 'oab',
      paginas: 340,
      minutosLeitura: 410,
    },
  },
  {
    posicao: 8,
    horasLidas: 412,
    leitoresAtivos: 1820,
    percentualConclusao: 90,
    categoriaBadge: 'Filosofia Política',
    destaqueBadge: '🗽 Liberdade Individual',
    avaliacao: 4.7,
    avaliacoesCount: 540,
    tendencia: '+9% esta semana',
    livro: {
      id: 138,
      titulo: 'Sobre a Liberdade',
      autor: 'John Stuart Mill',
      sobre: 'Ensaio indispensável sobre a tolerância, pluralismo de ideias e proteção da individualidade contra a tirania da maioria.',
      capa: directImg(coverSobreALiberdade, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Filosofia Política',
      colecaoId: 'classicos',
      paginas: 210,
      minutosLeitura: 260,
    },
  },
  {
    posicao: 9,
    horasLidas: 388,
    leitoresAtivos: 1690,
    percentualConclusao: 94,
    categoriaBadge: 'Prática & Estratégia',
    destaqueBadge: '⚔️ Tática Forense',
    avaliacao: 4.9,
    avaliacoesCount: 620,
    tendencia: '+16% esta semana',
    livro: {
      id: 'arte-da-guerra-juridica',
      titulo: 'A Arte da Guerra no Tribunal',
      autor: 'Sun Tzu & Especialistas Forenses',
      sobre: 'Princípios milenares de estratégia aplicados à condução de audiências, negociação e sustentação oral.',
      capa: directImg(coverAArteDaGuerra, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Liderança & Estratégia',
      colecaoId: 'lideranca',
      paginas: 195,
      minutosLeitura: 240,
    },
  },
  {
    posicao: 10,
    horasLidas: 356,
    leitoresAtivos: 1540,
    percentualConclusao: 92,
    categoriaBadge: 'Oratória & Retórica',
    destaqueBadge: '🎙️ Sustentação Oral',
    avaliacao: 4.8,
    avaliacoesCount: 490,
    tendencia: '+14% esta semana',
    livro: {
      id: 'oratoria-forense-elite',
      titulo: 'Oratória Forense e Persuasão Jurídica',
      autor: 'Mestres da Tribuna',
      sobre: 'Técnicas de inflexão de voz, persuasão aristotélica, postura corporal e controle de ansiedade em sustentações orais.',
      capa: directImg(coverALutaPeloDireito, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Oratória',
      colecaoId: 'oratoria',
      paginas: 220,
      minutosLeitura: 270,
    },
  },
  {
    posicao: 11,
    horasLidas: 334,
    leitoresAtivos: 1460,
    percentualConclusao: 91,
    categoriaBadge: 'Ética e Justiça',
    destaqueBadge: '🏛️ Obras Imortais',
    avaliacao: 4.8,
    avaliacoesCount: 430,
    tendencia: '+8% esta semana',
    livro: {
      id: 141,
      titulo: 'Ética a Nicômaco',
      autor: 'Aristóteles',
      sobre: 'O tratado de justiça distributiva e comutativa que fundamenta a teoria da equidade no Direito.',
      capa: directImg(coverOEspiritoDasLeis, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Filosofia Jurídica',
      colecaoId: 'classicos',
      paginas: 290,
      minutosLeitura: 360,
    },
  },
  {
    posicao: 12,
    horasLidas: 310,
    leitoresAtivos: 1380,
    percentualConclusao: 95,
    categoriaBadge: 'Língua Portuguesa',
    destaqueBadge: '✍️ Redação Forense',
    avaliacao: 4.9,
    avaliacoesCount: 510,
    tendencia: '+18% esta semana',
    livro: {
      id: 'portugues-forense-descomplicado',
      titulo: 'Português Forense sem Segredos',
      autor: 'Prof. Antônio Carlos & Equipe',
      sobre: 'Elimine o juridiquês vazio, pontuação em peças complexas, concordância e argumentação elegante.',
      capa: directImg(coverSobreALiberdade, 320),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Português Forense',
      colecaoId: 'portugues',
      paginas: 260,
      minutosLeitura: 310,
    },
  },
];

/**
 * Retorna o ranking consolidado enriquecido com dados de leitura locais do usuário.
 */
export function getLivrosEmAlta(filtro: 'todos' | 'semana' | 'classicos' | 'oab' = 'todos'): LivroEmAltaRanking[] {
  let progressosLocais: ReturnType<typeof readLeituraProgress> = [];
  try {
    progressosLocais = readLeituraProgress(0);
  } catch {
    /* fallback seguro para SSR / offline */
  }

  const progMap = new Map<string, number>();
  progressosLocais.forEach((p) => {
    if (p.snap?.id && p.readTimeMs) {
      progMap.set(String(p.snap.id), p.readTimeMs);
    }
  });

  const list = LIVROS_EM_ALTA_BASE.map((item) => {
    const tempoPessoal = progMap.get(String(item.livro.id));
    return {
      ...item,
      tempoPessoalMs: tempoPessoal,
    };
  });

  if (filtro === 'classicos') {
    return list.filter((i) => i.livro.colecaoId === 'classicos');
  }
  if (filtro === 'oab') {
    return list.filter((i) => i.livro.colecaoId === 'oab' || i.categoriaBadge.includes('OAB'));
  }
  if (filtro === 'semana') {
    return [...list].sort((a, b) => {
      const numA = parseInt(a.tendencia.replace(/\D/g, '') || '0', 10);
      const numB = parseInt(b.tendencia.replace(/\D/g, '') || '0', 10);
      return numB - numA;
    });
  }

  return list;
}

export function formatHorasColetivas(horas: number): string {
  return `${horas.toLocaleString('pt-BR')}h`;
}
