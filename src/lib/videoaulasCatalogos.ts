import conceitosThumbAsset from '@/assets/thumbnails/conceitos-thumb.webp.asset.json';
import areasThumbAsset from '@/assets/thumbnails/areas-thumb.webp.asset.json';
import oabPrimeiraThumbAsset from '@/assets/thumbnails/oab-primeira-fase-thumb.webp.asset.json';
import oabSegundaThumbAsset from '@/assets/thumbnails/oab-segunda-fase-thumb.webp.asset.json';
import fundoAdministrativo from '@/assets/fundos-disciplinas/capa-direito-administrativo.webp';
import fundoAmbiental from '@/assets/fundos-disciplinas/capa-direito-ambiental.webp';
import fundoCivil from '@/assets/fundos-disciplinas/capa-direito-civil.webp';
import fundoConstitucional from '@/assets/fundos-disciplinas/capa-direito-constitucional.webp';
import fundoDesportivo from '@/assets/fundos-disciplinas/capa-direito-desportivo.webp';
import fundoTrabalho from '@/assets/fundos-disciplinas/capa-direito-do-trabalho.webp';
import fundoEmpresarial from '@/assets/fundos-disciplinas/capa-direito-empresarial.webp';
import fundoFinanceiro from '@/assets/fundos-disciplinas/capa-direito-financeiro.webp';
import fundoInternacional from '@/assets/fundos-disciplinas/capa-direito-internacional-privado.webp';
import fundoPenal from '@/assets/fundos-disciplinas/capa-direito-penal.webp';
import fundoPrevidenciario from '@/assets/fundos-disciplinas/capa-direito-previdenciario.webp';
import fundoProcessualCivil from '@/assets/fundos-disciplinas/capa-direito-processual-civil.webp';
import fundoProcessualTrabalho from '@/assets/fundos-disciplinas/capa-direito-processual-do-trabalho.webp';
import fundoProcessualPenal from '@/assets/fundos-disciplinas/capa-direito-processual-penal.webp';
import fundoTributario from '@/assets/fundos-disciplinas/capa-direito-tributario.webp';
import fundoUrbanistico from '@/assets/fundos-disciplinas/capa-direito-urbanistico.webp';
import fundoHumanos from '@/assets/fundos-disciplinas/capa-direitos-humanos.webp';
import fundoFilosofia from '@/assets/fundos-disciplinas/capa-teoria-e-filosofia-do-direito.webp';
import fundoPortugues from '@/assets/fundos-disciplinas/capa-portugues-juridico.webp';
import fundoLeiPenalEspecial from '@/assets/fundos-disciplinas/capa-lei-penal-especial.webp';
import fundoPoliticasPublicas from '@/assets/fundos-disciplinas/capa-politicas-publicas.webp';
import fundoFormacaoComplementar from '@/assets/fundos-disciplinas/capa-formacao-complementar.webp';
import fundoConsumidor from '@/assets/paywall/09_justiça_do_consumidor_em_destaque.webp';
import fundoEca from '@/assets/lei-cover-eca.webp';
import fundoEleitoral from '@/assets/radar/camara-hero.webp';
import fundoDigital from '@/assets/onboarding/story_3_ia.webp';
import { srcOf } from '@/lib/assetUrl';

export type CatalogoId = 'iniciante' | 'areas' | 'oab-primeira-fase' | 'oab-segunda-fase';

export type Catalogo = {
  id: CatalogoId;
  titulo: string;
  descricao: string;
  tabela:
    | 'videoaulas_areas_direito'
    | 'videoaulas_oab_primeira_fase'
    | 'videoaulas_oab_segunda_fase'
    | 'videoaulas_iniciante';
  /** Catálogos sem coluna "area" exibem uma lista única de aulas. */
  temAreas: boolean;
  thumbCol: 'thumb' | 'thumbnail';
  /** Capa da trilha (mesma do projeto original). */
  capa: string;
};

export const CATALOGOS: Catalogo[] = [
  {
    id: 'iniciante',
    titulo: 'Para Iniciantes',
    descricao:
      'Fundamentos do Direito explicados do zero, ideal para quem está começando a estudar.',
    tabela: 'videoaulas_iniciante',
    temAreas: false,
    thumbCol: 'thumbnail',
    capa: srcOf(conceitosThumbAsset),
  },
  {
    id: 'areas',
    titulo: 'Áreas do Direito',
    descricao:
      'Aulas organizadas por área: Civil, Penal, Constitucional, Trabalhista e muito mais.',
    tabela: 'videoaulas_areas_direito',
    temAreas: true,
    thumbCol: 'thumb',
    capa: srcOf(areasThumbAsset),
  },
  {
    id: 'oab-primeira-fase',
    titulo: 'OAB 1ª Fase',
    descricao:
      'Preparação completa para a prova objetiva da OAB, com foco nos temas mais cobrados.',
    tabela: 'videoaulas_oab_primeira_fase',
    temAreas: true,
    thumbCol: 'thumbnail',
    capa: srcOf(oabPrimeiraThumbAsset),
  },
  {
    id: 'oab-segunda-fase',
    titulo: 'OAB 2ª Fase',
    descricao:
      'Treinamento para a prova prático-profissional: peças, técnicas e correções comentadas.',
    tabela: 'videoaulas_oab_segunda_fase',
    temAreas: true,
    thumbCol: 'thumbnail',
    capa: srcOf(oabSegundaThumbAsset),
  },
];

export function getCatalogo(id?: string): Catalogo | undefined {
  return CATALOGOS.find((c) => c.id === id);
}

export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Mapa oficial das capas das Aulas Interativas em alta resolução (R2 Cloudflare). */
export const CAPAS_AULAS_INTERATIVAS: Record<string, string> = {
  penal: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-penal.webp',
  civil: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-civil.webp',
  constitucional: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-constitucional.webp',
  administrativo: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-administrativo.webp',
  trabalho: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-do-trabalho.webp',
  'processual-civil': 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-processual-civil.webp',
  'processual-penal': 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-processual-penal.webp',
  tributario: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-tributario.webp',
  empresarial: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-empresarial.webp',
  ambiental: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-ambiental.webp',
  previdenciario: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-previdenciario.webp',
  'processual-trabalho': 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-processual-do-trabalho.webp',
  financeiro: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-financeiro.webp',
  'internacional-privado': 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-internacional-privado.webp',
  urbanistico: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-urbanistico.webp',
  'direitos-humanos': 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direitos-humanos.webp',
  'formacao-complementar': 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/formacao-complementar.webp',
  'lei-penal-especial': 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/lei-penal-especial.webp',
  'politicas-publicas': 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/politicas-publicas.webp',
  portugues: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/portugues.webp',
  filosofia: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/teoria-e-filosofia-do-direito.webp',
  desportivo: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-desportivo.webp',
  consumidor: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-do-consumidor.webp',
  eleitoral: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-eleitoral.webp',
  crianca: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/estatuto-da-crianca-e-do-adolescente.webp',
  digital: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-digital.webp',
};

/** Retorna a capa específica e exclusiva de cada uma das áreas de videoaulas, idêntica às Aulas Interativas. */
export function getCapaDaArea(areaNome?: string | null): string {
  if (!areaNome) return CAPAS_AULAS_INTERATIVAS.constitucional;
  const n = simplificarNomeArea(areaNome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (n.includes('consumidor') || n.includes('cdc')) return CAPAS_AULAS_INTERATIVAS.consumidor || fundoConsumidor;
  if (n.includes('eleitor')) return CAPAS_AULAS_INTERATIVAS.eleitoral || fundoEleitoral;
  if (n.includes('crianca') || n.includes('adolescente') || n.includes('eca')) return CAPAS_AULAS_INTERATIVAS.crianca || fundoEca;
  if (n.includes('digital') || n.includes('lgpd') || n.includes('tecnolog') || n.includes('ia')) return CAPAS_AULAS_INTERATIVAS.digital || fundoDigital;
  if (n.includes('urban') || n.includes('cidade') || n.includes('coletiv') || n.includes('difus')) return CAPAS_AULAS_INTERATIVAS.urbanistico || fundoUrbanistico;
  if (n.includes('const')) return CAPAS_AULAS_INTERATIVAS.constitucional || fundoConstitucional;
  if (n.includes('process') && n.includes('penal')) return CAPAS_AULAS_INTERATIVAS['processual-penal'] || fundoProcessualPenal;
  if (n.includes('process') && (n.includes('trab') || n.includes('trabalhista'))) return CAPAS_AULAS_INTERATIVAS['processual-trabalho'] || fundoProcessualTrabalho;
  if (n.includes('process') && n.includes('civil')) return CAPAS_AULAS_INTERATIVAS['processual-civil'] || fundoProcessualCivil;
  if (n.includes('penal') && n.includes('especial')) return CAPAS_AULAS_INTERATIVAS['lei-penal-especial'] || fundoLeiPenalEspecial;
  if (n.includes('penal') || n.includes('crime')) return CAPAS_AULAS_INTERATIVAS.penal || fundoPenal;
  if (n.includes('trab')) return CAPAS_AULAS_INTERATIVAS.trabalho || fundoTrabalho;
  if (n.includes('tribut')) return CAPAS_AULAS_INTERATIVAS.tributario || fundoTributario;
  if (n.includes('finan')) return CAPAS_AULAS_INTERATIVAS.financeiro || fundoFinanceiro;
  if (n.includes('empres')) return CAPAS_AULAS_INTERATIVAS.empresarial || fundoEmpresarial;
  if (n.includes('ambien')) return CAPAS_AULAS_INTERATIVAS.ambiental || fundoAmbiental;
  if (n.includes('human')) return CAPAS_AULAS_INTERATIVAS['direitos-humanos'] || fundoHumanos;
  if (n.includes('internac')) return CAPAS_AULAS_INTERATIVAS['internacional-privado'] || fundoInternacional;
  if (n.includes('previd')) return CAPAS_AULAS_INTERATIVAS.previdenciario || fundoPrevidenciario;
  if (n.includes('filoso') || n.includes('teoria') || n.includes('etica')) return CAPAS_AULAS_INTERATIVAS.filosofia || fundoFilosofia;
  if (n.includes('desport')) return CAPAS_AULAS_INTERATIVAS.desportivo || fundoDesportivo;
  if (n.includes('portugues')) return CAPAS_AULAS_INTERATIVAS.portugues || fundoPortugues;
  if (n.includes('politic') || n.includes('publicas')) return CAPAS_AULAS_INTERATIVAS['politicas-publicas'] || fundoPoliticasPublicas;
  if (n.includes('formacao') || n.includes('complementar')) return CAPAS_AULAS_INTERATIVAS['formacao-complementar'] || fundoFormacaoComplementar;
  if (n.includes('civil') || n.includes('familia') || n.includes('sucessoes')) return CAPAS_AULAS_INTERATIVAS.civil || fundoCivil;
  if (n.includes('admin')) return CAPAS_AULAS_INTERATIVAS.administrativo || fundoAdministrativo;

  return CAPAS_AULAS_INTERATIVAS.constitucional || fundoConstitucional;
}

/** `mq` (320x180) basta para cards de lista e baixa bem mais rápido que `hq`. */
export function ytThumb(videoId: string, qualidade: 'mq' | 'hq' | 'sd' = 'hq'): string {
  return `https://i.ytimg.com/vi/${videoId}/${qualidade}default.jpg`;
}

export function formatDuracao(segundos?: number | null): string {
  if (!segundos || segundos < 0) return '';
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/** "2ª Fase Civil" -> "Civil" */
export function simplificarNomeArea(area: string): string {
  return area
    .replace(/^2ª\s*Fase\s+/i, '')
    .replace(/^Segunda\s*Fase\s+/i, '')
    .trim();
}

/** Remove ruído de canal/plataforma dos títulos vindos do YouTube. */
export function limparTitulo(titulo: string): string {
  return (
    titulo
      .replace(/\|?\s*Kultivi\b/gi, '')
      .replace(/\|?\s*curso gratuito completo\b/gi, '')
      .replace(/\|?\s*curso gratuito\b/gi, '')
      .replace(/\s+\|\s+/g, ' › ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[›\s|-]+|[›\s|-]+$/g, '')
      .trim() || titulo
  );
}

/**
 * Converte títulos em ALL-CAPS para um formato editorial elegante e altamente legível.
 */
export function formatarTituloEditorial(titulo: string): string {
  if (!titulo) return '';
  const limpo = limparTitulo(titulo);
  const letras = limpo.replace(/[^a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/g, '');
  if (letras.length > 5 && letras === letras.toUpperCase()) {
    const conectivos = new Set([
      'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
      'por', 'para', 'com', 'sem', 'sob', 'sobre', 'a', 'o', 'as', 'os',
      'e', 'ou', 'que', 'se', 'um', 'uma', 'uns', 'umas'
    ]);
    const palavras = limpo.toLowerCase().split(' ');
    const capitalizadas = palavras.map((p, idx) => {
      if (!p) return p;
      if (idx > 0 && conectivos.has(p)) return p;
      return p.charAt(0).toUpperCase() + p.slice(1);
    });
    return capitalizadas.join(' ');
  }
  return limpo;
}
