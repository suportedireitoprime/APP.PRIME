import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Headphones,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Search,
  X,
  BookOpen,
  Scale,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { capaDaArea } from '@/lib/audioaulasHelper';
import { directImg } from '@/lib/cdnImg';
import { CapaOtimizada } from './CapaOtimizada';
import { motion, AnimatePresence } from 'framer-motion';

export interface CodigoItem {
  id: string;
  sigla: string;
  nome: string;
  subtitulo: string;
  capa: string;
  aulasInfo?: string;
  rota: string;
}

export interface EstatutoItem {
  id: string;
  sigla: string;
  nome: string;
  subtitulo: string;
  capa: string;
  aulasInfo?: string;
  destaque?: boolean;
  rota: string;
}

const SUPABASE_STORAGE_CAPAS = 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_areas';

// Catálogo dos Códigos
const CATALOGO_CODIGOS: CodigoItem[] = [
  {
    id: 'cf',
    sigla: 'CF/88',
    nome: 'Constituição Federal',
    subtitulo: 'Aprenda a base fundamental do Estado',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-constitucional.webp`),
    aulasInfo: '26 aulas',
    rota: '/audioaulas/Direito%20Constitucional'
  },
  {
    id: 'cp',
    sigla: 'CP',
    nome: 'Código Penal',
    subtitulo: 'Crimes, penas e tipicidade penal',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-penal.webp`),
    aulasInfo: '11 aulas',
    rota: '/audioaulas/Direito%20Penal'
  },
  {
    id: 'cpp',
    sigla: 'CPP',
    nome: 'Código de Processo Penal',
    subtitulo: 'Ritos, inquérito, provas e procedimentos',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-processual-penal.webp`),
    aulasInfo: '35 aulas',
    rota: '/audioaulas/Processo%20Penal'
  },
  {
    id: 'cc',
    sigla: 'CC',
    nome: 'Código Civil',
    subtitulo: 'Pessoas, bens, obrigações e contratos',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-civil.webp`),
    aulasInfo: 'Acervo de Leis',
    rota: '/audioaulas/Processo%20Civil'
  },
  {
    id: 'cpc',
    sigla: 'CPC',
    nome: 'Código de Processo Civil',
    subtitulo: 'Prazos, recursos e tutela jurisdicional',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-processual-civil.webp`),
    aulasInfo: '17 aulas',
    rota: '/audioaulas/Processo%20Civil'
  },
  {
    id: 'clt',
    sigla: 'CLT',
    nome: 'Consolidação das Leis do Trabalho',
    subtitulo: 'Direitos, regras e deveres trabalhistas',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-do-trabalho.webp`),
    aulasInfo: '7 aulas',
    rota: '/audioaulas/Direito%20do%20Trabalho'
  },
  {
    id: 'cpt',
    sigla: 'CPT',
    nome: 'Processo do Trabalho',
    subtitulo: 'Audiências, dissídios, ritos e execução',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-processual-do-trabalho.webp`),
    aulasInfo: 'Legislação em Áudio',
    rota: '/audioaulas/Processo%20do%20Trabalho'
  },
  {
    id: 'ctn',
    sigla: 'CTN',
    nome: 'Código Tributário Nacional',
    subtitulo: 'Tributos, competência, crédito e obrigações',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-tributario.webp`),
    aulasInfo: 'Legislação em Áudio',
    rota: '/legislacao/ctn'
  },
  {
    id: 'cdc',
    sigla: 'CDC',
    nome: 'Código de Defesa do Consumidor',
    subtitulo: 'Relações de consumo e proteção do consumidor',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-do-consumidor.webp`),
    aulasInfo: 'Legislação em Áudio',
    rota: '/legislacao/cdc'
  },
  {
    id: 'ccom',
    sigla: 'CCOM',
    nome: 'Código Comercial & Empresarial',
    subtitulo: 'Sociedades, títulos de crédito e falência',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-empresarial.webp`),
    aulasInfo: 'Legislação em Áudio',
    rota: '/audioaulas/Direito%20Empresarial'
  },
  {
    id: 'ce',
    sigla: 'CE',
    nome: 'Código Eleitoral',
    subtitulo: 'Organização, garantias e processo eleitoral',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-eleitoral.webp`),
    aulasInfo: 'Legislação em Áudio',
    rota: '/legislacao/ce'
  },
  {
    id: 'adm',
    sigla: 'ADM',
    nome: 'Direito Administrativo',
    subtitulo: 'Licitações, atos administrativos e servidores',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-administrativo.webp`),
    aulasInfo: 'Legislação em Áudio',
    rota: '/audioaulas/Direito%20Administrativo'
  },
  {
    id: 'amb',
    sigla: 'AMB',
    nome: 'Direito Ambiental',
    subtitulo: 'Código Florestal, fauna, flora e crimes ambientais',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-ambiental.webp`),
    aulasInfo: 'Legislação em Áudio',
    rota: '/audioaulas/Direito%20Ambiental'
  },
  {
    id: 'prev',
    sigla: 'PREV',
    nome: 'Direito Previdenciário',
    subtitulo: 'Benefícios, custeio e seguridade social',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-previdenciario.webp`),
    aulasInfo: 'Legislação em Áudio',
    rota: '/audioaulas/Direito%20Previdenciário'
  },
  {
    id: 'int',
    sigla: 'INT',
    nome: 'Direito Internacional',
    subtitulo: 'Tratados, extradição e cooperação internacional',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-internacional.webp`),
    aulasInfo: 'Legislação em Áudio',
    rota: '/audioaulas/Direito%20Internacional'
  },
  {
    id: 'dh',
    sigla: 'DH',
    nome: 'Direitos Humanos',
    subtitulo: 'Pactos, convenções e garantias fundamentais',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direitos-humanos.webp`),
    aulasInfo: 'Legislação em Áudio',
    rota: '/audioaulas/Direitos%20Humanos'
  },
  {
    id: 'ctb',
    sigla: 'CTB',
    nome: 'Código de Trânsito Brasileiro',
    subtitulo: 'Normas de conduta, infrações e penalidades',
    capa: '/assets/capa-lei-penal-especial.webp',
    aulasInfo: 'Legislação em Áudio',
    rota: '/legislacao/ctb'
  }
];

// Catálogo dos Estatutos
const CATALOGO_ESTATUTOS: EstatutoItem[] = [
  {
    id: 'eca',
    sigla: 'ECA',
    nome: 'Estatuto da Criança e do Adolescente',
    subtitulo: 'Lei nº 8.069/1990 — Aulas completas artigo por artigo',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direito-crianca-adolescente-eca.webp`),
    aulasInfo: '322 aulas',
    destaque: true,
    rota: '/audioaulas/ECA%20(Crian%C3%A7a%20e%20Adolescente)'
  },
  {
    id: 'eoab',
    sigla: 'EOAB',
    nome: 'Estatuto da Advocacia e da OAB',
    subtitulo: 'Lei nº 8.906/1994 — Ética e prerrogativas artigo por artigo',
    capa: '/assets/eoab-woman-fixed.webp',
    aulasInfo: '96 aulas',
    destaque: true,
    rota: '/audioaulas/Estatuto%20da%20OAB'
  },
  {
    id: 'ei',
    sigla: 'Estatuto do Idoso',
    nome: 'Estatuto da Pessoa Idosa',
    subtitulo: 'Lei nº 10.741/2003 — Direitos e garantias',
    capa: '/assets/ei-idoso.webp',
    aulasInfo: 'Legislação em Áudio',
    rota: '/legislacao/ei'
  },
  {
    id: 'epd',
    sigla: 'EPD',
    nome: 'Estatuto da Pessoa com Deficiência',
    subtitulo: 'Lei nº 13.146/2015 — Inclusão e acessibilidade',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direitos-humanos.webp`),
    aulasInfo: 'Direitos Humanos',
    rota: '/legislacao/estatuto-pessoa-deficiencia'
  },
  {
    id: 'eir',
    sigla: 'EIR',
    nome: 'Estatuto da Igualdade Racial',
    subtitulo: 'Lei nº 12.288/2010 — Reparação e igualdade',
    capa: directImg(`${SUPABASE_STORAGE_CAPAS}/direitos-humanos.webp`),
    aulasInfo: 'Direitos Fundamentais',
    rota: '/legislacao/estatuto-igualdade-racial'
  },
  {
    id: 'ec',
    sigla: 'Estatuto da Cidade',
    nome: 'Estatuto da Cidade',
    subtitulo: 'Lei nº 10.257/2001 — Política e plano diretor',
    capa: '/assets/biblioteca/areas/direito-urbanistico.webp',
    aulasInfo: 'Direito Urbanístico',
    rota: '/legislacao/estatuto-cidade'
  },
  {
    id: 'ed',
    sigla: 'Desarmamento',
    nome: 'Estatuto do Desarmamento',
    subtitulo: 'Lei nº 10.826/2003 — Registro, posse e porte',
    capa: '/assets/capa-lei-penal-especial.webp',
    aulasInfo: 'Legislação Especial',
    rota: '/legislacao/estatuto-desarmamento'
  }
];

export type ModoVisualizacao = 'hub' | 'areas' | 'codigos' | 'estatutos';

interface AudioaulasGridAreasProps {
  areas: [string, number][];
  modo?: ModoVisualizacao;
  onModoChange?: (modo: ModoVisualizacao) => void;
}

export const AudioaulasGridAreas = React.memo(function AudioaulasGridAreas({
  areas,
  modo: modoProp,
  onModoChange,
}: AudioaulasGridAreasProps) {
  const navigate = useNavigate();
  const [modoInterno, setModoInterno] = useState<ModoVisualizacao>('hub');
  const modo = modoProp !== undefined ? modoProp : modoInterno;
  const [busca, setBusca] = useState('');

  const refCarrosselAreas = useRef<HTMLDivElement>(null);
  const refCarrosselCodigos = useRef<HTMLDivElement>(null);
  const refCarrosselEstatutos = useRef<HTMLDivElement>(null);

  const scrollCarrossel = useCallback((ref: React.RefObject<HTMLDivElement | null>, direcao: 'left' | 'right') => {
    if (!ref.current) return;
    const offset = direcao === 'left' ? -320 : 320;
    ref.current.scrollBy({ left: offset, behavior: 'smooth' });
  }, []);

  // Filtro de áreas tradicionais para o primeiro carrossel (sem misturar com estatutos avulsos)
  const areasTradicionais = useMemo(() => {
    return areas.filter(([nome]) => !/eca|estatuto/i.test(nome));
  }, [areas]);

  // Se o usuário pedir para ver "Todas as Áreas", exibe todas mesmo
  const areasFiltradasLista = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return areas;
    return areas.filter(([nome]) => nome.toLowerCase().includes(q));
  }, [areas, busca]);

  const codigosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return CATALOGO_CODIGOS;
    return CATALOGO_CODIGOS.filter(
      (c) => c.nome.toLowerCase().includes(q) || c.sigla.toLowerCase().includes(q) || c.subtitulo.toLowerCase().includes(q)
    );
  }, [busca]);

  const estatutosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return CATALOGO_ESTATUTOS;
    return CATALOGO_ESTATUTOS.filter(
      (e) => e.nome.toLowerCase().includes(q) || e.sigla.toLowerCase().includes(q) || e.subtitulo.toLowerCase().includes(q)
    );
  }, [busca]);

  const alterarModo = useCallback((novoModo: ModoVisualizacao) => {
    setModoInterno(novoModo);
    onModoChange?.(novoModo);
    setBusca('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [onModoChange]);

  const voltarParaHub = useCallback(() => {
    alterarModo('hub');
  }, [alterarModo]);

  if (areas.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-4 space-y-8 mt-4 lg:px-10 2xl:max-w-[1600px]">
        <div className="rounded-2xl bg-white/[0.04] p-10 text-center border border-white/10">
          <Headphones className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma audioaula publicada ainda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 space-y-10 mt-2 lg:px-10 2xl:max-w-[1600px]">
      <AnimatePresence mode="wait">
        {modo === 'hub' ? (
          <motion.div
            key="modo-hub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-10"
          >
            {/* ═════════════ SEÇÃO 1: ÁREAS DO DIREITO (CARROSSEL) ═════════════ */}
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Scale className="w-4 h-4" />
                    </span>
                    <h2 className="text-[19px] sm:text-[22px] font-black text-white uppercase tracking-widest truncate">
                      Áreas do Direito
                    </h2>
                  </div>
                  <p className="mt-1 text-xs sm:text-[13px] text-zinc-400 line-clamp-1">
                    Mergulhe no conhecimento jurídico através de aulas completas em áudio.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => alterarModo('areas')}
                    className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-primary/20 hover:border-primary/40 transition active:scale-95"
                    aria-label="Ver todas as áreas do direito"
                  >
                    <span>Ver todos</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                  </button>

                  <div className="hidden sm:flex items-center gap-1 pl-1">
                    <button
                      onClick={() => scrollCarrossel(refCarrosselAreas, 'left')}
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                      aria-label="Rolar para esquerda"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => scrollCarrossel(refCarrosselAreas, 'right')}
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                      aria-label="Rolar para direita"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Trilho Carrossel Áreas */}
              <div
                ref={refCarrosselAreas}
                className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-3 pt-1 snap-x scrollbar-none select-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
              >
                {areasTradicionais.map(([nome, total]) => {
                  const nomeFormatado = nome.replace(/^Direitos?\s+(do\s+)?/i, '').trim();
                  return (
                    <button
                      key={nome}
                      onClick={() => navigate(`/audioaulas/${encodeURIComponent(nome)}`)}
                      className="group relative w-[160px] sm:w-[190px] md:w-[210px] aspect-[4/5] shrink-0 snap-start rounded-2xl overflow-hidden text-left border border-white/10 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 focus-visible:outline-none active:scale-[0.98]"
                    >
                      <CapaOtimizada
                        src={capaDaArea(nome)}
                        alt={nome}
                        animacaoEntrada
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

                      <div className="absolute inset-0 p-3 sm:p-3.5 flex flex-col justify-between">
                        <span className="self-start h-8 w-8 sm:h-9 sm:w-9 grid place-items-center rounded-xl bg-primary/90 text-primary-foreground shadow-lg shadow-black/40">
                          <Headphones className="h-4 w-4 sm:h-5 sm:w-5" />
                        </span>

                        <div className="flex items-end justify-between gap-1.5">
                          <div className="min-w-0 pr-1">
                            <p className="font-bold leading-tight text-white text-xs sm:text-sm line-clamp-2">
                              {nomeFormatado}
                            </p>
                            <p className="text-[11px] text-zinc-300 mt-0.5">{total} {total === 1 ? 'aula' : 'aulas'}</p>
                          </div>
                          <span className="shrink-0 h-7 w-7 sm:h-8 sm:w-8 grid place-items-center rounded-full bg-white/20 text-white backdrop-blur group-hover:bg-primary group-hover:text-primary-foreground transition">
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ═════════════ SEÇÃO 2: LEGISLAÇÃO (CÓDIGOS E ESTATUTOS) ═════════════ */}
            <div className="pt-4 border-t border-white/5 space-y-10">
              {/* CABEÇALHO GERAL DE LEGISLAÇÃO */}
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-widest">
                  <BookOpen className="w-3.5 h-3.5" /> Leis & Normas
                </span>
                <h2 className="text-[22px] sm:text-[25px] font-black text-white uppercase tracking-widest">
                  Legislação em Áudio
                </h2>
                <p className="text-xs sm:text-[13px] text-zinc-400 max-w-2xl">
                  Estude códigos e estatutos com aulas narradas artigo por artigo, prontas para ouvir onde e quando quiser.
                </p>
              </div>

              {/* ──────────────── CÓDIGOS (CARROSSEL) ──────────────── */}
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                      <span>Códigos</span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                        {CATALOGO_CODIGOS.length} principais
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => alterarModo('codigos')}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-primary/20 hover:border-primary/40 transition active:scale-95"
                      aria-label="Ver todos os códigos"
                    >
                      <span>Ver todos</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </button>

                    <div className="hidden sm:flex items-center gap-1 pl-1">
                      <button
                        onClick={() => scrollCarrossel(refCarrosselCodigos, 'left')}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                        aria-label="Rolar para esquerda"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => scrollCarrossel(refCarrosselCodigos, 'right')}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                        aria-label="Rolar para direita"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trilho Carrossel Códigos */}
                <div
                  ref={refCarrosselCodigos}
                  className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-3 pt-1 snap-x scrollbar-none select-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                  {CATALOGO_CODIGOS.map((cod) => (
                    <button
                      key={cod.id}
                      onClick={() => navigate(cod.rota)}
                      className="group relative w-[145px] sm:w-[175px] md:w-[195px] aspect-[3/4] shrink-0 snap-start rounded-2xl overflow-hidden text-left border border-white/10 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 focus-visible:outline-none active:scale-[0.98]"
                    >
                      <CapaOtimizada
                        src={cod.capa}
                        alt={cod.nome}
                        animacaoEntrada
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                      <div className="absolute inset-0 p-3 flex flex-col justify-between">
                        <span className="self-start px-2 py-0.5 rounded-md bg-black/60 text-white font-black text-[11px] tracking-wider border border-white/20 backdrop-blur">
                          {cod.sigla}
                        </span>

                        <div className="min-w-0">
                          <p className="font-bold leading-tight text-white text-xs sm:text-sm line-clamp-2">
                            {cod.nome}
                          </p>
                          {cod.aulasInfo && (
                            <p className="text-[10px] sm:text-[11px] text-primary font-semibold mt-1 flex items-center gap-1">
                              <Headphones className="w-3 h-3" />
                              {cod.aulasInfo}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* ──────────────── ESTATUTOS (CARROSSEL) ──────────────── */}
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                      <span>Estatutos</span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10">
                        {CATALOGO_ESTATUTOS.length} disponíveis
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => alterarModo('estatutos')}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-primary/20 hover:border-primary/40 transition active:scale-95"
                      aria-label="Ver todos os estatutos"
                    >
                      <span>Ver todos</span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </button>

                    <div className="hidden sm:flex items-center gap-1 pl-1">
                      <button
                        onClick={() => scrollCarrossel(refCarrosselEstatutos, 'left')}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                        aria-label="Rolar para esquerda"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => scrollCarrossel(refCarrosselEstatutos, 'right')}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                        aria-label="Rolar para direita"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trilho Carrossel Estatutos */}
                <div
                  ref={refCarrosselEstatutos}
                  className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-3 pt-1 snap-x scrollbar-none select-none scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                  {CATALOGO_ESTATUTOS.map((est) => (
                    <button
                      key={est.id}
                      onClick={() => navigate(est.rota)}
                      className={`group relative w-[150px] sm:w-[185px] md:w-[205px] aspect-[3/4] shrink-0 snap-start rounded-2xl overflow-hidden text-left transition-all duration-300 focus-visible:outline-none active:scale-[0.98] ${
                        est.destaque
                          ? 'border-2 border-primary/60 shadow-lg shadow-primary/25 hover:border-primary hover:shadow-2xl hover:shadow-primary/30'
                          : 'border border-white/10 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20'
                      }`}
                    >
                      <CapaOtimizada
                        src={est.capa}
                        alt={est.nome}
                        animacaoEntrada
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

                      <div className="absolute inset-0 p-3 flex flex-col justify-between">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`px-2 py-0.5 rounded-md font-black text-[11px] tracking-wider border backdrop-blur ${
                            est.destaque
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-black/60 text-white border-white/20'
                          }`}>
                            {est.sigla}
                          </span>

                          {est.destaque && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                              <Sparkles className="w-3 h-3 text-rose-400" /> Destaque
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold leading-tight text-white text-xs sm:text-sm line-clamp-2">
                            {est.nome}
                          </p>
                          {est.aulasInfo && (
                            <p className="text-[10px] sm:text-[11px] text-primary font-bold mt-1 flex items-center gap-1">
                              <Headphones className="w-3 h-3" />
                              {est.aulasInfo}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        ) : (
          /* ═════════════ MODO LISTA COMPLETA ("VER TODOS") ═════════════ */
          <motion.div
            key="modo-lista"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-12"
          >
            {/* Header da Lista — Começa no Topo com Único Botão de Voltar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={voltarParaHub}
                  aria-label="Voltar para a home de audioaulas"
                  className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition shrink-0 active:scale-95"
                >
                  <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest">
                    {modo === 'areas' && 'Todas as Áreas do Direito'}
                    {modo === 'codigos' && 'Todos os Códigos'}
                    {modo === 'estatutos' && 'Todos os Estatutos'}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    {modo === 'areas' && `${areasFiltradasLista.length} área(s) com audioaulas disponíveis`}
                    {modo === 'codigos' && `${codigosFiltrados.length} código(s) catalogados`}
                    {modo === 'estatutos' && `${estatutosFiltrados.length} estatuto(s) catalogados`}
                  </p>
                </div>
              </div>

              {/* Campo de Busca Rápida */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Filtrar por nome..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-primary/50 transition"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ───────── LISTA VERTICAL: ÁREAS DO DIREITO ───────── */}
            {modo === 'areas' && (
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {areasFiltradasLista.map(([nome, total]) => {
                  const nomeFormatado = nome.replace(/^Direitos?\s+(do\s+)?/i, '').trim();
                  return (
                    <button
                      key={nome}
                      onClick={() => navigate(`/audioaulas/${encodeURIComponent(nome)}`)}
                      className="group flex items-center justify-between gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-primary/40 hover:bg-white/[0.07] transition-all duration-200 active:scale-[0.99] text-left"
                    >
                      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                        {/* Capa à esquerda */}
                        <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10 shadow-md">
                          <CapaOtimizada
                            src={capaDaArea(nome)}
                            alt={nome}
                            animacaoEntrada
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>

                        {/* Informações ao centro */}
                        <div className="min-w-0">
                          <p className="font-bold text-sm sm:text-base text-white tracking-wide truncate group-hover:text-primary transition-colors">
                            {nomeFormatado}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                            <span className="flex items-center gap-1 text-primary font-medium">
                              <Headphones className="w-3.5 h-3.5 shrink-0" />
                              <span>{total} {total === 1 ? 'aula' : 'aulas'}</span>
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-400 truncate">Direito {nomeFormatado}</span>
                          </div>
                        </div>
                      </div>

                      {/* Seta à direita */}
                      <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 transition">
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ───────── LISTA VERTICAL: CÓDIGOS ───────── */}
            {modo === 'codigos' && (
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {codigosFiltrados.map((cod) => (
                  <button
                    key={cod.id}
                    onClick={() => navigate(cod.rota)}
                    className="group flex items-center justify-between gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-primary/40 hover:bg-white/[0.07] transition-all duration-200 active:scale-[0.99] text-left"
                  >
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      {/* Capa à esquerda com sigla */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10 shadow-md">
                        <CapaOtimizada
                          src={cod.capa}
                          alt={cod.nome}
                          animacaoEntrada
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-black text-white border border-white/20 backdrop-blur">
                          {cod.sigla}
                        </span>
                      </div>

                      {/* Informações ao centro */}
                      <div className="min-w-0">
                        <p className="font-bold text-sm sm:text-base text-white tracking-wide truncate group-hover:text-primary transition-colors">
                          {cod.nome}
                        </p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {cod.subtitulo}
                        </p>
                        {cod.aulasInfo && (
                          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mt-1">
                            <Headphones className="w-3.5 h-3.5 shrink-0" />
                            <span>{cod.aulasInfo}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Seta à direita */}
                    <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 transition">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* ───────── LISTA VERTICAL: ESTATUTOS ───────── */}
            {modo === 'estatutos' && (
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {estatutosFiltrados.map((est) => (
                  <button
                    key={est.id}
                    onClick={() => navigate(est.rota)}
                    className={`group flex items-center justify-between gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl bg-white/[0.04] transition-all duration-200 active:scale-[0.99] text-left ${
                      est.destaque
                        ? 'border-2 border-primary/50 hover:border-primary hover:bg-primary/[0.06] shadow-lg shadow-primary/15'
                        : 'border border-white/5 hover:border-primary/40 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                      {/* Capa à esquerda com sigla */}
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-zinc-900 border border-white/10 shadow-md">
                        <CapaOtimizada
                          src={est.capa}
                          alt={est.nome}
                          animacaoEntrada
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-black text-white border border-white/20 backdrop-blur">
                          {est.sigla}
                        </span>
                      </div>

                      {/* Informações ao centro */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm sm:text-base text-white tracking-wide truncate group-hover:text-primary transition-colors">
                            {est.nome}
                          </p>
                          {est.destaque && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-rose-400" /> Destaque
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {est.subtitulo}
                        </p>
                        {est.aulasInfo && (
                          <div className="flex items-center gap-1.5 text-xs text-primary font-semibold mt-1">
                            <Headphones className="w-3.5 h-3.5 shrink-0" />
                            <span>{est.aulasInfo}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Seta à direita */}
                    <span className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 transition">
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
