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

// Catálogo dos Códigos
const CATALOGO_CODIGOS: CodigoItem[] = [
  {
    id: 'cf',
    sigla: 'CF/88',
    nome: 'Constituição Federal',
    subtitulo: 'Aprenda a base fundamental do Estado',
    capa: '/pilulas/cf_portrait.webp',
    aulasInfo: '26 aulas',
    rota: '/audioaulas/Direito%20Constitucional'
  },
  {
    id: 'cp',
    sigla: 'CP',
    nome: 'Código Penal',
    subtitulo: 'Ouça a explicação dos artigos penais',
    capa: directImg('https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.webp'),
    aulasInfo: '11 aulas',
    rota: '/audioaulas/Direito%20Penal'
  },
  {
    id: 'cpp',
    sigla: 'CPP',
    nome: 'Código de Processo Penal',
    subtitulo: 'Ritos, provas e procedimentos penais',
    capa: '/pilulas/cpp_portrait.webp',
    aulasInfo: '35 aulas',
    rota: '/audioaulas/Processo%20Penal'
  },
  {
    id: 'cc',
    sigla: 'CC',
    nome: 'Código Civil',
    subtitulo: 'Entenda relações e direitos civis',
    capa: '/pilulas/cc_portrait.webp',
    aulasInfo: 'Acervo de Leis',
    rota: '/audioaulas/Processo%20Civil'
  },
  {
    id: 'cpc',
    sigla: 'CPC',
    nome: 'Código de Processo Civil',
    subtitulo: 'Prazos, recursos e tutela jurisdicional',
    capa: '/assets/direito-civil.webp',
    aulasInfo: '17 aulas',
    rota: '/audioaulas/Processo%20Civil'
  },
  {
    id: 'clt',
    sigla: 'CLT',
    nome: 'Consolidação das Leis do Trabalho',
    subtitulo: 'Direitos, regras e deveres trabalhistas',
    capa: '/pilulas/clt_portrait.webp',
    aulasInfo: '7 aulas',
    rota: '/audioaulas/Direito%20do%20Trabalho'
  },
  {
    id: 'ctn',
    sigla: 'CTN',
    nome: 'Código Tributário Nacional',
    subtitulo: 'Tributos, competência e obrigações',
    capa: '/assets/biblioteca/areas/direito-tributario.webp',
    aulasInfo: 'Legislação em Áudio',
    rota: '/legislacao/ctn'
  },
  {
    id: 'cdc',
    sigla: 'CDC',
    nome: 'Código de Defesa do Consumidor',
    subtitulo: 'Relações de consumo e proteção do consumidor',
    capa: '/assets/biblioteca/areas/direito-civil.webp',
    aulasInfo: 'Legislação em Áudio',
    rota: '/legislacao/cdc'
  },
  {
    id: 'ctb',
    sigla: 'CTB',
    nome: 'Código de Trânsito Brasileiro',
    subtitulo: 'Normas de conduta, infrações e penalidades',
    capa: '/assets/capa-lei-penal-especial.webp',
    aulasInfo: 'Legislação em Áudio',
    rota: '/legislacao/ctb'
  },
  {
    id: 'ce',
    sigla: 'CE',
    nome: 'Código Eleitoral',
    subtitulo: 'Organização, garantias e processo eleitoral',
    capa: '/assets/biblioteca/areas/direito-constitucional.webp',
    aulasInfo: 'Legislação em Áudio',
    rota: '/legislacao/ce'
  }
];

// Catálogo dos Estatutos
const CATALOGO_ESTATUTOS: EstatutoItem[] = [
  {
    id: 'eca',
    sigla: 'ECA',
    nome: 'Estatuto da Criança e do Adolescente',
    subtitulo: 'Lei nº 8.069/1990 — Aulas completas artigo por artigo',
    capa: '/assets/eca-kids.webp',
    aulasInfo: '322 aulas',
    destaque: true,
    rota: '/audioaulas/ECA%20(Crian%C3%A7a%20e%20Adolescente)'
  },
  {
    id: 'eoab',
    sigla: 'EOAB',
    nome: 'Estatuto da Advocacia e da OAB',
    subtitulo: 'Lei nº 8.906/1994 — Ética e prerrogativas',
    capa: '/assets/eoab-woman-fixed.webp',
    aulasInfo: 'Exame OAB & Prática',
    rota: '/legislacao/estatuto-oab'
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
    capa: '/assets/biblioteca/areas/direitos-humanos.webp',
    aulasInfo: 'Direitos Humanos',
    rota: '/legislacao/estatuto-pessoa-deficiencia'
  },
  {
    id: 'eir',
    sigla: 'EIR',
    nome: 'Estatuto da Igualdade Racial',
    subtitulo: 'Lei nº 12.288/2010 — Reparação e igualdade',
    capa: '/assets/biblioteca/areas/direitos-humanos.webp',
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

interface AudioaulasGridAreasProps {
  areas: [string, number][];
}

type ModoVisualizacao = 'hub' | 'areas' | 'codigos' | 'estatutos';

export const AudioaulasGridAreas = React.memo(function AudioaulasGridAreas({ areas }: AudioaulasGridAreasProps) {
  const navigate = useNavigate();
  const [modo, setModo] = useState<ModoVisualizacao>('hub');
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

  const voltarParaHub = useCallback(() => {
    setModo('hub');
    setBusca('');
  }, []);

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
                    onClick={() => { setModo('areas'); setBusca(''); }}
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
                      onClick={() => { setModo('codigos'); setBusca(''); }}
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
                      onClick={() => { setModo('estatutos'); setBusca(''); }}
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
            className="space-y-6"
          >
            {/* Header da Lista */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={voltarParaHub}
                  aria-label="Voltar para o hub"
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

            {/* Grid dos Itens da Lista Selecionada */}
            {modo === 'areas' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {areasFiltradasLista.map(([nome, total]) => {
                  const nomeFormatado = nome.replace(/^Direitos?\s+(do\s+)?/i, '').trim();
                  return (
                    <button
                      key={nome}
                      onClick={() => navigate(`/audioaulas/${encodeURIComponent(nome)}`)}
                      className="group relative aspect-square rounded-2xl overflow-hidden text-left border border-white/10 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 focus-visible:outline-none active:scale-[0.98]"
                    >
                      <CapaOtimizada
                        src={capaDaArea(nome)}
                        alt={nome}
                        animacaoEntrada
                        className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />

                      <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
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
            )}

            {modo === 'codigos' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {codigosFiltrados.map((cod) => (
                  <button
                    key={cod.id}
                    onClick={() => navigate(cod.rota)}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden text-left border border-white/10 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 focus-visible:outline-none active:scale-[0.98]"
                  >
                    <CapaOtimizada
                      src={cod.capa}
                      alt={cod.nome}
                      animacaoEntrada
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                    <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
                      <span className="self-start px-2 py-0.5 rounded-md bg-black/60 text-white font-black text-[11px] tracking-wider border border-white/20 backdrop-blur">
                        {cod.sigla}
                      </span>

                      <div className="min-w-0">
                        <p className="font-bold leading-tight text-white text-xs sm:text-sm line-clamp-2">
                          {cod.nome}
                        </p>
                        {cod.aulasInfo && (
                          <p className="text-[11px] text-primary font-semibold mt-1 flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            {cod.aulasInfo}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {modo === 'estatutos' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {estatutosFiltrados.map((est) => (
                  <button
                    key={est.id}
                    onClick={() => navigate(est.rota)}
                    className={`group relative aspect-[3/4] rounded-2xl overflow-hidden text-left transition-all duration-300 focus-visible:outline-none active:scale-[0.98] ${
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

                    <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
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
                          <p className="text-[11px] text-primary font-bold mt-1 flex items-center gap-1">
                            <Headphones className="w-3 h-3" />
                            {est.aulasInfo}
                          </p>
                        )}
                      </div>
                    </div>
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
