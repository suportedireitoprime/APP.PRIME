import capaDosDelitos from '@/assets/covers/dos_delitos_e_das_penas_manual.webp';
import capaVigiarEPunir from '@/assets/covers/vigiar_e_punir_nascimento_da_prisao_manual.webp';
import capaCpArtigos from '@/assets/covers/cp_artigos_v2.webp';
import capaOProcesso from '@/assets/covers/o_processo_manual.webp';
import capaTeoriaPura from '@/assets/covers/teoria_pura_do_direito_manual.webp';
import capaVademecumJudge from '@/assets/covers/vademecum-judge.webp';
import capaAdvogadosTribunal from '@/assets/covers/hero-advogados-tribunal.webp';
import capaSocratesThemis from '@/assets/covers/socrates-themis-hero.webp';
import capaALutaPeloDireito from '@/assets/covers/a_luta_pelo_direito_manual.webp';
import capaOEspiritoDasLeis from '@/assets/covers/o_espirito_das_leis_manual.webp';
import capaHistoriaLegislacao from '@/assets/covers/historia-da-legislacao.webp';
import capaFundamentosDaLei from '@/assets/covers/fundamentos-da-lei.webp';
import capaEstruturaEstado from '@/assets/covers/estrutura-do-estado.webp';
import capaEticaNicomaco from '@/assets/covers/etica_a_nicomaco_manual.webp';
import capaOPrincipe from '@/assets/covers/o_principe_manual.webp';
import capaAcessoJustica from '@/assets/covers/acesso_a_justica_manual.webp';
import capaSobreLiberdade from '@/assets/covers/sobre_a_liberdade_manual.webp';
import capaExploradoresCavernas from '@/assets/covers/o_caso_dos_exploradores_de_cavernas_manual.webp';

export const CURATED_BOOK_COVERS = [
  capaDosDelitos,
  capaVigiarEPunir,
  capaCpArtigos,
  capaOProcesso,
  capaTeoriaPura,
  capaVademecumJudge,
  capaAdvogadosTribunal,
  capaSocratesThemis,
  capaALutaPeloDireito,
  capaOEspiritoDasLeis,
  capaHistoriaLegislacao,
  capaFundamentosDaLei,
  capaEstruturaEstado,
  capaEticaNicomaco,
  capaOPrincipe,
  capaAcessoJustica,
  capaSobreLiberdade,
  capaExploradoresCavernas,
];

export interface TrilhaItem {
  key: string;
  titulo: string;
  ordemStr: string;
  badgeLabel: string;
  displayTotal: number;
  displayConcluidas: number;
  displayPct: number;
  coverImage: string;
  isConcluido: boolean;
  isEmAndamento: boolean;
  isBloqueado: boolean;
  onClick: () => void;
}
