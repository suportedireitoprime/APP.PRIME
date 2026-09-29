import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Shield, Landmark, Scale, ChevronRight, Gavel, FileText, ListChecks, Heart, NotebookPen, Radar, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import JurisBlogCarousel from '@/components/vademecum/blog/JurisBlogCarousel';
import HeroOrnaments from '@/components/vademecum/home/HeroOrnaments';
import HomeCard from '@/components/vademecum/home/HomeCard';
import ShapeGrid from '@/components/ui/ShapeGrid';
import jurisprudenciaHeroImg from '@/assets/jurisprudencia-hero-themis.webp';
import VadeMecumQuickActions from '@/components/vademecum/home/chunks/VadeMecumQuickActions';
import VadeMecumSubpage from '@/components/vademecum/outros/VadeMecumSubpage';
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
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }
};

const Jurisprudencia = () => {
  useTrackArea("jurisprudencia_aberta");
  const navigate = useNavigate();

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



  return (
    <VadeMecumSubpage titulo="Jurisprudência" descricao="Súmulas e Teses" headerColorClass="bg-hero-panel" hideBackButton={true}>
      <div className="mb-4 -mt-2">
        <VadeMecumQuickActions />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-4 py-6 space-y-6 lg:max-w-[1500px] lg:px-12 lg:py-10 lg:space-y-10 2xl:px-16"
      >
        {/* Acesso Rápido - Removido (Movido para dentro do painel de topo) */}

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
                  style={{ backgroundColor: 'hsl(var(--secondary))' }}
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
          
          const SectionTitle = ({ title }: { title: string }) => (
            <motion.div variants={itemVariants} className="flex items-center gap-2 px-1 mb-2 mt-4 col-span-full">
              <div className="w-[3px] h-4 bg-primary rounded-full" />
              <h2 className="text-[13px] uppercase tracking-widest text-muted-foreground font-body font-semibold">
                {title}
              </h2>
            </motion.div>
          );
          return (
            <>
              <section className={listClass}>
                <SectionTitle title="Súmulas" />
                {sumulas.map(renderListCard)}
              </section>
              <section className={gridClass}>
                <SectionTitle title="Jurisprudências Prontas" />
                {prontas.map(renderGridCard)}
              </section>
              <section className={gridClass}>
                <SectionTitle title="Informativos" />
                {informativos.map(renderGridCard)}
              </section>
              <section className={gridClass}>
                <SectionTitle title="Jurisprudência em Teses" />
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

    </VadeMecumSubpage>
  );
};

export default Jurisprudencia;
