import conceitosThumbAsset from '@/assets/thumbnails/conceitos-thumb.webp.asset.json';
import areasThumbAsset from '@/assets/thumbnails/areas-thumb.webp.asset.json';
import oabPrimeiraThumbAsset from '@/assets/thumbnails/oab-primeira-fase-thumb.webp.asset.json';
import oabSegundaThumbAsset from '@/assets/thumbnails/oab-segunda-fase-thumb.webp.asset.json';
import ambientalCapa from '@/assets/thumbnails/ambiental.webp';
import penalCapa from '@/assets/thumbnails/penal.webp';
import processoPenalCapa from '@/assets/thumbnails/processo-penal.webp';
import trabalhoCapa from '@/assets/thumbnails/trabalho.webp';
import administrativoCapa from '@/assets/thumbnails/administrativo.webp';
import consumidorCapa from '@/assets/thumbnails/consumidor.webp';
import civilCapa from '@/assets/thumbnails/civil.webp';
import filosofiaCapa from '@/assets/thumbnails/filosofia.webp';
import fundoConstitucional from '@/assets/fundos-disciplinas/capa-direito-constitucional.webp';
import fundoTributario from '@/assets/fundos-disciplinas/capa-direito-tributario.webp';
import fundoFinanceiro from '@/assets/fundos-disciplinas/capa-direito-financeiro.webp';
import fundoEmpresarial from '@/assets/fundos-disciplinas/capa-direito-empresarial.webp';
import fundoPrevidenciario from '@/assets/fundos-disciplinas/capa-direito-previdenciario.webp';
import fundoProcessualCivil from '@/assets/fundos-disciplinas/capa-direito-processual-civil.webp';
import fundoProcessualTrabalho from '@/assets/fundos-disciplinas/capa-direito-processual-do-trabalho.webp';
import fundoInternacional from '@/assets/fundos-disciplinas/capa-direito-internacional-privado.webp';
import fundoHumanos from '@/assets/fundos-disciplinas/capa-direitos-humanos.webp';
import fundoEca from '@/assets/lei-cover-eca.webp';
import fundoEleitoral from '@/assets/radar/camara-hero.webp';
import fundoDigital from '@/assets/onboarding/story_3_ia.webp';
import fundoColetivos from '@/assets/fundos-disciplinas/capa-direito-urbanistico.webp';
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

/** Retorna a capa específica e exclusiva de cada uma das 21 áreas de videoaulas, sem repetições. */
export function getCapaDaArea(areaNome?: string | null): string {
  if (!areaNome) return administrativoCapa;
  const n = simplificarNomeArea(areaNome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (n.includes('consumidor') || n.includes('cdc')) return consumidorCapa;
  if (n.includes('eleitor')) return fundoEleitoral;
  if (n.includes('crianca') || n.includes('adolescente') || n.includes('eca')) return fundoEca;
  if (n.includes('digital') || n.includes('lgpd') || n.includes('tecnolog')) return fundoDigital;
  if (n.includes('coletiv') || n.includes('difus')) return fundoColetivos;
  if (n.includes('const')) return fundoConstitucional;
  if (n.includes('process') && n.includes('penal')) return processoPenalCapa;
  if (n.includes('process') && (n.includes('trab') || n.includes('trabalhista'))) return fundoProcessualTrabalho;
  if (n.includes('process') && n.includes('civil')) return fundoProcessualCivil;
  if (n.includes('penal')) return penalCapa;
  if (n.includes('trab')) return trabalhoCapa;
  if (n.includes('tribut')) return fundoTributario;
  if (n.includes('finan')) return fundoFinanceiro;
  if (n.includes('empres')) return fundoEmpresarial;
  if (n.includes('ambien')) return ambientalCapa;
  if (n.includes('human')) return fundoHumanos;
  if (n.includes('internac')) return fundoInternacional;
  if (n.includes('previd')) return fundoPrevidenciario;
  if (n.includes('filoso') || n.includes('teoria')) return filosofiaCapa;
  if (n.includes('civil') || n.includes('familia')) return civilCapa;
  if (n.includes('admin')) return administrativoCapa;

  return administrativoCapa;
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
