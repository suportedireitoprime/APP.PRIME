import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Search, Shield, Landmark, Scale, ChevronRight, Gavel, FileText, ListChecks, Heart, NotebookPen, Radar, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import JurisBlogCarousel from '@/components/vademecum/JurisBlogCarousel';
import HeroOrnaments from '@/components/vademecum/HeroOrnaments';
import HomeCard from '@/components/vademecum/HomeCard';
import { heroFigures } from '@/assets/hero-figures';
import { assetUrl } from '@/lib/assetUrl';
import { prefetchRoute } from '@/lib/routePrefetch';
import { fetchSumulas } from '@/services/sumulasService';
import { fetchPesquisasProntas } from '@/services/pesquisasProntasService';
import { fetchEdicoes } from '@/services/informativosService';
import { fetchTesesEdicoes } from '@/services/tesesService';
import { track } from '@/lib/analyticsEvents';
import { useTrackArea } from "@/hooks/useTrackArea";

function prefetchTarget(id: string) {
  if (id.startsWith('PRONTAS_')) {
    prefetchRoute('pesquisasProntasLista');
    prefetchRoute('pesquisasProntasTema');
    void fetchPesquisasProntas(id === 'PRONTAS_STF' ? 'STF' : 'STJ').catch(() => {});
    return;
  }
  if (id.startsWith('INFORMATIVOS_')) {
    prefetchRoute('informativosTribunal');
    void fetchEdicoes(id === 'INFORMATIVOS_STF' ? 'STF' : 'STJ').catch(() => {});
    return;
  }
  if (id.startsWith('TESES_')) {
    prefetchRoute('tesesTribunal');
    void fetchTesesEdicoes(id === 'TESES_STF' ? 'STF' : 'STJ').catch(() => {});
    return;
  }
  prefetchRoute('sumulasTribunal');
  void fetchSumulas(id).catch(() => {});
}

// Figuras vazadas com temática de tribunal/julgamento — mesmo padrão do painel
// amarelo do início, porém na paleta verde desta seção.
const JURIS_FIGURE_ALTS = [
  'Juiz com martelo',
  'Advogada argumentando',
  'Martelo do juiz',
  'Balança da justiça',
  'Colonata em perspectiva',
  'Fachada de faculdade',
  'Juramento de advogado',
  'Advogado lendo peça',
  'Cícero',
  'Montesquieu',
  'Escadaria da faculdade',
  'Pergaminho lacrado',
];
const JURIS_FIGURES = JURIS_FIGURE_ALTS
  .map((alt) => heroFigures.find((f) => f.alt === alt))
  .filter((f): f is (typeof heroFigures)[number] => Boolean(f));

// Página dedicada de Jurisprudência: substitui o antigo bottom sheet por uma
// tela cheia com painel verde no topo, barra de busca e cartões de coleção.
const CATEGORIAS = [
  {
    id: 'STF_VINCULANTE',
    label: 'SÚMULAS VINCULANTES',
    desc: 'Vinculantes para todo o Judiciário e Administração',
    icon: Shield,
    tag: 'VINCULANTE',
    color: '#059669', // Emerald
  },
  {
    id: 'STF',
    label: 'SÚMULAS DO STF',
    desc: 'Supremo Tribunal Federal — constitucional',
    icon: Landmark,
    tag: 'STF',
    color: '#0284c7', // Sky
  },
  {
    id: 'STJ',
    label: 'SÚMULAS DO STJ',
    desc: 'Superior Tribunal de Justiça — infraconstitucional',
    icon: Scale,
    tag: 'STJ',
    color: '#d97706', // Amber
  },
  {
    id: 'PRONTAS_STF',
    label: 'PRONTAS — STF',
    desc: 'Coletâneas temáticas do Supremo Tribunal Federal',
    icon: Gavel,
    tag: 'STF · PRONTAS',
    color: '#475569', // Slate
  },
  {
    id: 'PRONTAS_STJ',
    label: 'PRONTAS — STJ',
    desc: 'Coletâneas temáticas do Superior Tribunal de Justiça',
    icon: Gavel,
    tag: 'STJ · PRONTAS',
    color: '#475569', // Slate
  },
  {
    id: 'INFORMATIVOS_STJ',
    label: 'INFORMATIVOS — STJ',
    desc: 'Boletins periódicos com julgados',
    icon: FileText,
    tag: 'STJ · INFORMATIVOS',
    color: '#2563eb', // Blue
  },
  {
    id: 'INFORMATIVOS_STF',
    label: 'INFORMATIVOS — STF',
    desc: 'Boletins periódicos com julgados',
    icon: FileText,
    tag: 'STF · INFORMATIVOS',
    color: '#2563eb', // Blue
  },
  {
    id: 'TESES_STJ',
    label: 'TESES — STJ',
    desc: 'Teses consolidadas do STJ',
    icon: ListChecks,
    tag: 'STJ · TESES',
    color: '#9333ea', // Purple
  },
  {
    id: 'TESES_STF',
    label: 'TESES — STF',
    desc: 'Teses consolidadas do STF',
    icon: ListChecks,
    tag: 'STF · TESES',
    color: '#9333ea', // Purple
  },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Jurisprudencia = () => {
  useTrackArea("jurisprudencia_aberta");
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [coverIndex, setCoverIndex] = useState(() => Math.floor(Math.random() * JURIS_FIGURES.length));

  useEffect(() => {
    if (JURIS_FIGURES.length <= 1) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => setCoverIndex((i) => (i + 1) % JURIS_FIGURES.length), 9000);
    };
    const stop = () => { if (id) { clearInterval(id); id = null; } };
    if (!document.hidden) start();
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // Aquece o cache de TODAS as figuras (são poucas e leves) em idle, para
  // que os slides seguintes apareçam instantaneamente sem "carregando".
  useEffect(() => {
    const w: any = window;
    const idle = w.requestIdleCallback || ((cb: any) => setTimeout(cb, 400));
    const cancel = w.cancelIdleCallback || clearTimeout;
    const handle = idle(() => {
      JURIS_FIGURES.forEach((f) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = assetUrl(f.url);
      });
    });
    return () => cancel(handle);
  }, []);

  const abrir = (id: string) => {
    track('jurisprudencia_category_opened', { category_id: id });
    if (id === 'PRONTAS_STF') {
      navigate('/jurisprudencia/prontas/stf');
      return;
    }
    if (id === 'PRONTAS_STJ') {
      navigate('/jurisprudencia/prontas/stj');
      return;
    }
    if (id === 'INFORMATIVOS_STJ') {
      navigate('/jurisprudencia/informativos-stj');
      return;
    }
    if (id === 'INFORMATIVOS_STF') {
      navigate('/jurisprudencia/informativos-stf');
      return;
    }
    if (id === 'TESES_STJ') {
      navigate('/jurisprudencia/teses-stj');
      return;
    }
    if (id === 'TESES_STF') {
      navigate('/jurisprudencia/teses-stf');
      return;
    }
    const slug =
      id === 'STF_VINCULANTE' ? 'sumulas-vinculantes'
      : id === 'STF' ? 'sumulas-stf'
      : id === 'STJ' ? 'sumulas-stj'
      : '';
    if (slug) navigate(`/jurisprudencia/${slug}`);
  };

  const submitBusca = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    track('jurisprudencia_search_submitted', { query_length: q.length, query_terms: q.split(/\s+/).length });
    navigate(`/jurisprudencia/sumulas-stf?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="w-full min-h-dvh bg-background pb-[calc(env(safe-area-inset-bottom,0px)+5rem)] lg:pb-12">
      {/* Painel verde (mirror do painel amarelo do início) */}
      <div
        className="bg-hero-panel relative overflow-hidden rounded-b-[36px] border-b border-white/10 shadow-2xl shadow-black/60 pt-[calc(var(--sai-top,env(safe-area-inset-top,0px))+0.5rem)]"

        style={{
          background:
            'linear-gradient(150deg, hsl(164 45% 16%) 0%, hsl(158 52% 11%) 55%, hsl(150 45% 7%) 100%)',
        }}
      >
        {/* Ornamentos SVG (mesmo do painel amarelo), tingidos de verde */}
        <div className="absolute inset-0 opacity-70 pointer-events-none [filter:hue-rotate(95deg)_saturate(0.85)]">
          <HeroOrnaments />
        </div>

        {/* Figuras vazadas rotativas com crossfade + Ken Burns (mesmo padrão do painel amarelo) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <AnimatePresence initial={false}>
            {(() => {
              const fig = JURIS_FIGURES[coverIndex % JURIS_FIGURES.length];
              if (!fig) return null;
              const posClass =
                fig.side === 'left'
                  ? 'left-[4%] right-auto origin-bottom-left'
                  : fig.side === 'right'
                  ? 'right-[4%] left-auto origin-bottom-right'
                  : 'left-1/2 -translate-x-1/2 origin-bottom';
              const kenBurnsAnim = (coverIndex % 2 === 0)
                ? 'ken-burns-a 12s ease-in-out infinite alternate'
                : 'ken-burns-b 12s ease-in-out infinite alternate';
              return (
                <motion.img
                  key={coverIndex}
                  src={assetUrl(fig.url)}
                  alt=""
                  aria-hidden
                  loading="eager"
                  decoding="async"
                  // @ts-expect-error non-standard yet-widely-supported hint
                  fetchpriority="high"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.92 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ animation: kenBurnsAnim, willChange: 'transform' }}
                  className={`absolute bottom-2 top-2 h-[calc(100%-16px)] w-auto max-w-[62%] sm:max-w-[52%] lg:max-w-[42%] object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.55)] ${posClass}`}
                />
              );
            })()}
          </AnimatePresence>
        </div>

        {/* Escurecedor para legibilidade */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-emerald-950/25 to-emerald-950/70" />

        {/* Glow decorativo */}
        <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-teal-300/10 blur-3xl pointer-events-none" />

        {/* Header com voltar */}
        <div className="relative flex items-center justify-between px-4 pb-2 lg:hidden">
          <button
            onClick={() => navigate('/')}
            aria-label="Voltar"
            className="w-11 h-11 rounded-full bg-black/25 hover:bg-black/35 backdrop-blur-sm flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="w-11 h-11" />
        </div>


        {/* Hero */}
        <div className="relative px-6 pb-8 pt-6 flex flex-col items-center text-center lg:mx-auto lg:w-full lg:max-w-[1500px] lg:flex-row lg:items-end lg:justify-between lg:gap-12 lg:px-12 lg:pb-12 lg:pt-12 lg:text-left 2xl:px-16">
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative w-[76px] h-[76px] rounded-full p-[2px] bg-[conic-gradient(from_140deg,hsl(158_60%_55%),hsl(168_45%_30%),hsl(150_70%_45%),hsl(158_60%_55%))] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.7)]">
              <div className="w-full h-full rounded-full bg-emerald-950/70 border border-white/15 backdrop-blur-sm flex items-center justify-center">
                <Gavel className="w-8 h-8 text-emerald-200" strokeWidth={2} />
              </div>
            </div>
            <p className="mt-4 font-display uppercase tracking-[0.24em] text-[11px] text-emerald-200/80">
              Coleções
            </p>
            <h1 className="mt-1 font-display uppercase tracking-wider text-white text-[28px] leading-tight font-bold drop-shadow lg:text-[40px]">
              Jurisprudência
            </h1>
            <p className="mt-2 text-white/90 text-[16px] leading-relaxed max-w-md font-body lg:max-w-xl lg:text-[17px]">
              Súmulas vinculantes, do STF, do STJ e coletâneas prontas — em um só lugar.
            </p>
          </div>

          {/* Busca */}
          <form
            onSubmit={submitBusca}
            data-track="jurisprudencia_search_form"
            className="mt-5 w-full max-w-md flex items-center gap-2 rounded-full bg-white/95 pl-4 pr-1 py-1 shadow-lg shadow-emerald-950/30 lg:mt-0 lg:max-w-xl lg:shrink-0"
          >
            <Search className="w-5 h-5 text-emerald-800/70 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar jurisprudência"
              className="flex-1 bg-transparent outline-none text-[16px] text-emerald-950 placeholder:text-emerald-800/50 py-2.5"
            />
            <button
              type="submit"
              className="rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-display uppercase tracking-wider font-bold px-5 min-h-11 transition-colors"
            >
              Buscar
            </button>
          </form>
        </div>

      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-4 py-6 space-y-6 lg:max-w-[1500px] lg:px-12 lg:py-10 lg:space-y-10 2xl:px-16"
      >
        {/* Acesso Rápido */}
        <style>{`
          @keyframes icon-shine-mask {
            0% { -webkit-mask-position: 250% center; mask-position: 250% center; }
            100% { -webkit-mask-position: -250% center; mask-position: -250% center; }
          }
        `}</style>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full">
          {/* Favoritos */}
          <motion.button variants={itemVariants} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/vade-mecum/favoritos')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#1A1D21] border border-border/40 hover:bg-[#23272B] transition-colors w-full group" data-track="quick_access_favoritos">
            <div className="relative w-5 h-5 shrink-0">
              <Heart className="w-5 h-5 absolute inset-0" style={{ color: 'hsl(348,78%,38%)', filter: 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))' }} strokeWidth={1.15} />
              <Heart className="w-5 h-5 absolute inset-0 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ WebkitMaskImage: 'linear-gradient(-60deg, transparent 30%, white 50%, transparent 70%)', WebkitMaskSize: '250% 100%', WebkitMaskRepeat: 'no-repeat', animation: 'icon-shine-mask 1.5s infinite linear' }} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Favoritos</span>
          </motion.button>
          
          {/* Anotações */}
          <motion.button variants={itemVariants} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} onClick={() => toast({ title: 'Em breve', description: 'Suas anotações estarão aqui em breve.' })} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#1A1D21] border border-border/40 hover:bg-[#23272B] transition-colors w-full group" data-track="quick_access_anotacoes">
            <div className="relative w-5 h-5 shrink-0">
              <NotebookPen className="w-5 h-5 absolute inset-0" style={{ color: 'hsl(348,78%,38%)', filter: 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))' }} strokeWidth={1.15} />
              <NotebookPen className="w-5 h-5 absolute inset-0 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ WebkitMaskImage: 'linear-gradient(-60deg, transparent 30%, white 50%, transparent 70%)', WebkitMaskSize: '250% 100%', WebkitMaskRepeat: 'no-repeat', animation: 'icon-shine-mask 1.5s infinite linear' }} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Anotações</span>
          </motion.button>

          {/* Radares */}
          <motion.button variants={itemVariants} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/radares')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#1A1D21] border border-border/40 hover:bg-[#23272B] transition-colors w-full group" data-track="quick_access_radares">
            <div className="relative w-5 h-5 shrink-0">
              <Radar className="w-5 h-5 absolute inset-0" style={{ color: 'hsl(348,78%,38%)', filter: 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))' }} strokeWidth={1.15} />
              <Radar className="w-5 h-5 absolute inset-0 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ WebkitMaskImage: 'linear-gradient(-60deg, transparent 30%, white 50%, transparent 70%)', WebkitMaskSize: '250% 100%', WebkitMaskRepeat: 'no-repeat', animation: 'icon-shine-mask 1.5s infinite linear' }} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Radares</span>
          </motion.button>

          {/* Histórico */}
          <motion.button variants={itemVariants} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/vade-mecum/recentes')} className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-[#1A1D21] border border-border/40 hover:bg-[#23272B] transition-colors w-full group" data-track="quick_access_historico">
            <div className="relative w-5 h-5 shrink-0">
              <History className="w-5 h-5 absolute inset-0" style={{ color: 'hsl(348,78%,38%)', filter: 'saturate(1.35) brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.45))' }} strokeWidth={1.15} />
              <History className="w-5 h-5 absolute inset-0 text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ WebkitMaskImage: 'linear-gradient(-60deg, transparent 30%, white 50%, transparent 70%)', WebkitMaskSize: '250% 100%', WebkitMaskRepeat: 'no-repeat', animation: 'icon-shine-mask 1.5s infinite linear' }} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Histórico</span>
          </motion.button>
        </div>

        {(() => {
          const sumulas = CATEGORIAS.filter(
            (c) => !c.id.startsWith('PRONTAS_') && !c.id.startsWith('INFORMATIVOS_') && !c.id.startsWith('TESES_'),
          );
          const prontas = CATEGORIAS.filter((c) => c.id.startsWith('PRONTAS_'));
          const informativos = CATEGORIAS.filter((c) => c.id.startsWith('INFORMATIVOS_'));
          const teses = CATEGORIAS.filter((c) => c.id.startsWith('TESES_'));
          const renderListCard = (op: typeof CATEGORIAS[number]) => {
            const Icon = op.icon;
            return (
              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                key={op.id}
                onClick={() => {
                  prefetchTarget(op.id);
                  abrir(op.id);
                }}
                data-track="jurisprudencia_category_click"
                data-category-id={op.id}
                className="group w-full h-[96px] flex items-stretch gap-3 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-secondary transition-all text-left overflow-hidden shadow-sm shadow-black/5"
              >
                <div
                  className="relative w-[84px] h-full shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: '#1A1D21' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/40 pointer-events-none" />
                  <Icon className="relative w-8 h-8 drop-shadow-md" style={{ color: op.color }} strokeWidth={2} />
                  <span className="absolute left-1.5 bottom-1.5 px-1.5 py-0.5 rounded-sm bg-black/60 text-white text-[9px] font-body font-bold tracking-wider">
                    {op.tag}
                  </span>
                </div>
                <div className="flex-1 min-w-0 py-2.5 pr-2 flex flex-col justify-center">
                  <p className="font-display text-[15px] font-bold text-foreground leading-snug tracking-wide line-clamp-1">
                    {op.label}
                  </p>
                  <p className="font-body text-[12.5px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                    {op.desc}
                  </p>
                </div>
                <div className="w-10 h-10 mr-3 self-center rounded-full bg-muted/60 border border-border/60 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </motion.button>
            );
          };

          const renderGridCard = (op: typeof CATEGORIAS[number], i: number) => {
            return (
              <HomeCard
                key={op.id}
                icon={op.icon}
                label={op.label}
                sublabel={op.desc}
                color={op.color}
                delay={i * 0.05}
                badge={op.tag}
                solidColor={false}
                onClick={() => {
                  prefetchTarget(op.id);
                  abrir(op.id);
                }}
                data-track="jurisprudencia_category_click"
                data-track-name={op.label}
                data-track-section="jurisprudencia"
              />
            );
          };
          const gridClass = 'grid grid-cols-2 gap-3 lg:gap-4 2xl:grid-cols-3';
          const listClass = 'space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4 2xl:grid-cols-3';
          const tituloClass =
            'px-1 text-[13px] uppercase tracking-widest text-muted-foreground font-body font-semibold col-span-full mb-1 lg:text-[12px]';
          return (
            <>
              <section className={listClass}>
                <motion.p variants={itemVariants} className={tituloClass}>Súmulas</motion.p>
                {sumulas.map(renderListCard)}
              </section>
              <section className={gridClass}>
                <motion.p variants={itemVariants} className={tituloClass}>Jurisprudências prontas</motion.p>
                {prontas.map(renderGridCard)}
              </section>
              <section className={gridClass}>
                <motion.p variants={itemVariants} className={tituloClass}>Informativos</motion.p>
                {informativos.map(renderGridCard)}
              </section>
              <section className={gridClass}>
                <motion.p variants={itemVariants} className={tituloClass}>Jurisprudência em Teses</motion.p>
                {teses.map(renderGridCard)}
              </section>
            </>
          );
        })()}


        <motion.div variants={itemVariants} className="mt-3 rounded-2xl border border-border/60 bg-background/40 p-4">
          <p className="font-display text-[16px] font-bold text-foreground leading-snug">
            O que são súmulas?
          </p>
          <p className="font-body text-[14px] text-muted-foreground leading-relaxed mt-1.5">
            Enunciados que consolidam o entendimento reiterado dos tribunais superiores. As{' '}
            <strong className="text-foreground/90">Vinculantes</strong> obrigam todo o Judiciário
            e a Administração Pública.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Jurisprudencia;