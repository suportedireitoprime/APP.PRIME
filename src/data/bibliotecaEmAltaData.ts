import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { readLeituraProgress } from '@/lib/leituraProgress';
import { directImg } from '@/lib/cdnImg';

// Importação das capas originais e exatas de cada obra em WebP
import coverTeoriaPura from '@/assets/covers/teoria_pura_do_direito_manual.webp';
import coverExploradores from '@/assets/covers/o_caso_dos_exploradores_de_cavernas_manual.webp';
import coverConstituicao from '@/assets/covers/hero-vademecum-constituicao.webp';
import coverDelitos from '@/assets/covers/dos_delitos_e_das_penas_manual.webp';
import coverLutaPeloDireito from '@/assets/covers/a_luta_pelo_direito_manual.webp';
import coverEspiritoDasLeis from '@/assets/covers/o_espirito_das_leis_manual.webp';
import coverOab from '@/assets/thumbnails/oab-primeira-fase-thumb.webp';
import coverSobreALiberdade from '@/assets/covers/sobre_a_liberdade_manual.webp';
import coverArteDaGuerra from '@/assets/covers/a_arte_da_guerra_manual.webp';
import coverProcesso from '@/assets/covers/o_processo_manual.webp';
import coverPrincipe from '@/assets/covers/o_principe_manual.webp';
import coverContratoSocial from '@/assets/covers/o_contrato_social_manual.webp';
import coverVigiar from '@/assets/covers/vigiar_e_punir_nascimento_da_prisao_manual.webp';
import coverRepublica from '@/assets/covers/a_republica_manual.webp';

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
      capa: directImg(coverTeoriaPura, 340),
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
      capa: directImg(coverExploradores, 340),
      link: null,
      download: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-caso-dos-exploradores-de-cavernas/o-caso-dos-exploradores-de-cavernas-versao-clara.pdf',
      downloadEscura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-caso-dos-exploradores-de-cavernas/o-caso-dos-exploradores-de-cavernas-versao-escura.pdf',
      versoesPdf: {
        clara: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-caso-dos-exploradores-de-cavernas/o-caso-dos-exploradores-de-cavernas-versao-clara.pdf',
        escura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-caso-dos-exploradores-de-cavernas/o-caso-dos-exploradores-de-cavernas-versao-escura.pdf',
      },
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
      capa: directImg(coverConstituicao, 340),
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
      capa: directImg(coverDelitos, 340),
      link: null,
      download: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/dos-delitos-e-das-penas/dos-delitos-e-das-penas-versao-clara.pdf',
      downloadEscura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/dos-delitos-e-das-penas/dos-delitos-e-das-penas-versao-escura.pdf',
      versoesPdf: {
        clara: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/dos-delitos-e-das-penas/dos-delitos-e-das-penas-versao-clara.pdf',
        escura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/dos-delitos-e-das-penas/dos-delitos-e-das-penas-versao-escura.pdf',
      },
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
      capa: directImg(coverLutaPeloDireito, 340),
      link: null,
      download: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-luta-pelo-direito/a-luta-pelo-direito-versao-clara.pdf',
      downloadEscura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-luta-pelo-direito/a-luta-pelo-direito-versao-escura.pdf',
      versoesPdf: {
        clara: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-luta-pelo-direito/a-luta-pelo-direito-versao-clara.pdf',
        escura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-luta-pelo-direito/a-luta-pelo-direito-versao-escura.pdf',
      },
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
      capa: directImg(coverEspiritoDasLeis, 340),
      link: null,
      download: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-espirito-das-leis/o-espirito-das-leis-versao-clara.pdf',
      downloadEscura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-espirito-das-leis/o-espirito-das-leis-versao-escura.pdf',
      versoesPdf: {
        clara: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-espirito-das-leis/o-espirito-das-leis-versao-clara.pdf',
        escura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-espirito-das-leis/o-espirito-das-leis-versao-escura.pdf',
      },
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
      capa: directImg(coverOab, 340),
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
      capa: directImg(coverSobreALiberdade, 340),
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
      capa: directImg(coverArteDaGuerra, 340),
      link: null,
      download: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-arte-da-guerra/a-arte-da-guerra-versao-clara.pdf',
      downloadEscura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-arte-da-guerra/a-arte-da-guerra-versao-escura.pdf',
      versoesPdf: {
        clara: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-arte-da-guerra/a-arte-da-guerra-versao-clara.pdf',
        escura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-arte-da-guerra/a-arte-da-guerra-versao-escura.pdf',
      },
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
    categoriaBadge: 'Direito e Literatura',
    destaqueBadge: '🏛️ Processo e Absurdo',
    avaliacao: 4.8,
    avaliacoesCount: 490,
    tendencia: '+14% esta semana',
    livro: {
      id: 'o-processo-kafka',
      titulo: 'O Processo',
      autor: 'Franz Kafka',
      sobre: 'A obra-prima sobre o labirinto burocrático e a angústia diante de acusações arbitrárias de um poder invisível.',
      capa: directImg(coverProcesso, 340),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Clássicos',
      colecaoId: 'classicos',
      paginas: 280,
      minutosLeitura: 320,
    },
  },
  {
    posicao: 11,
    horasLidas: 334,
    leitoresAtivos: 1460,
    percentualConclusao: 91,
    categoriaBadge: 'Teoria Política',
    destaqueBadge: '👑 Realismo Político',
    avaliacao: 4.8,
    avaliacoesCount: 430,
    tendencia: '+8% esta semana',
    livro: {
      id: 'o-principe-maquiavel',
      titulo: 'O Príncipe',
      autor: 'Nicolau Maquiavel',
      sobre: 'O tratado sobre o poder, a virtù, a fortuna e a manutenção do Estado na ciência política clássica.',
      capa: directImg(coverPrincipe, 340),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Filosofia Política',
      colecaoId: 'classicos',
      paginas: 170,
      minutosLeitura: 210,
    },
  },
  {
    posicao: 12,
    horasLidas: 310,
    leitoresAtivos: 1380,
    percentualConclusao: 95,
    categoriaBadge: 'Contratualismo',
    destaqueBadge: '✍️ Vontade Geral',
    avaliacao: 4.9,
    avaliacoesCount: 510,
    tendencia: '+18% esta semana',
    livro: {
      id: 'o-contrato-social-rousseau',
      titulo: 'O Contrato Social',
      autor: 'Jean-Jacques Rousseau',
      sobre: 'A teoria da soberania popular, a igualdade civil e os fundamentos do pacto social democrático.',
      capa: directImg(coverContratoSocial, 340),
      link: null,
      download: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-contrato-social/o-contrato-social-versao-clara.pdf',
      downloadEscura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-contrato-social/o-contrato-social-versao-escura.pdf',
      versoesPdf: {
        clara: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-contrato-social/o-contrato-social-versao-clara.pdf',
        escura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/o-contrato-social/o-contrato-social-versao-escura.pdf',
      },
      area: 'Filosofia Jurídica',
      colecaoId: 'classicos',
      paginas: 220,
      minutosLeitura: 260,
    },
  },
  {
    posicao: 13,
    horasLidas: 295,
    leitoresAtivos: 1310,
    percentualConclusao: 93,
    categoriaBadge: 'Criminologia & Poder',
    destaqueBadge: '👁️ O Panóptico',
    avaliacao: 4.9,
    avaliacoesCount: 480,
    tendencia: '+12% esta semana',
    livro: {
      id: 'vigiar-e-punir-foucault',
      titulo: 'Vigiar e Punir: O Nascimento da Prisão',
      autor: 'Michel Foucault',
      sobre: 'A genealogia do sistema penitenciário moderno, a microfísica do poder e o modelo disciplinar da sociedade.',
      capa: directImg(coverVigiar, 340),
      link: null,
      download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
      area: 'Criminologia',
      colecaoId: 'classicos',
      paginas: 310,
      minutosLeitura: 380,
    },
  },
  {
    posicao: 14,
    horasLidas: 280,
    leitoresAtivos: 1240,
    percentualConclusao: 94,
    categoriaBadge: 'Filosofia Clássica',
    destaqueBadge: '🏛️ O Ideal de Justiça',
    avaliacao: 4.8,
    avaliacoesCount: 410,
    tendencia: '+10% esta semana',
    livro: {
      id: 'a-republica-platao',
      titulo: 'A República',
      autor: 'Platão',
      sobre: 'O diálogo socrático sobre a justiça, a pólis ideal, a alegoria da caverna e o filósofo-governante.',
      capa: directImg(coverRepublica, 340),
      link: null,
      download: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-republica/a-republica-versao-clara.pdf',
      downloadEscura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-republica/a-republica-versao-escura.pdf',
      versoesPdf: {
        clara: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-republica/a-republica-versao-clara.pdf',
        escura: 'https://pub-9cd49875afe549788617b01e97309a55.r2.dev/classicos/a-republica/a-republica-versao-escura.pdf',
      },
      area: 'Filosofia Clássica',
      colecaoId: 'classicos',
      paginas: 440,
      minutosLeitura: 530,
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
