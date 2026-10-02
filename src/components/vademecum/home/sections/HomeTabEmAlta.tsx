import { memo, Suspense, useState } from 'react';
import { ChevronRight, ScrollText, BookMarked, Landmark, Scale, Briefcase, Car, Users, Search, Target, Shield, Coins, Heart, ShieldAlert, Plane, Trees, Flame } from 'lucide-react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import HomeCard from '@/components/vademecum/home/HomeCard';
import HomeAtalhosLeisCarousel from '@/components/vademecum/home/carousel/HomeAtalhosLeisCarousel';
import { AREA_CATS, RADAR_CATS, Cat, AreaCat } from './homeSectionsData';
import { LEIS_CATALOG } from '@/data/leisCatalog';

const AprendaSobreLeis = lazyWithRetry(() => import('@/components/vademecum/outros/AprendaSobreLeis'));

interface HomeTabEmAltaProps {
  onOpenCategory: (cat: Cat | AreaCat) => void;
  onSelectRadar: (id: string) => void;
  onOpenLei?: (id: string) => void;
  onOpenJurisprudencia?: () => void;
}

function getAreaDisplayLabel(label: string): string {
  if (label.startsWith('Direito')) return label;
  if (label === 'Trabalho') return 'Direito do Trabalho';
  if (label === 'Consumidor') return 'Direito do Consumidor';
  if (label === 'Criança, Idoso e PCD') return label;
  return `Direito ${label}`;
}

const getLawIcon = (id: string) => {
  if (id === 'cf88') return Landmark;
  if (id === 'cp' || id === 'cpp') return ShieldAlert;
  if (id === 'cc' || id === 'cpc') return Users;
  if (id === 'clt') return Briefcase;
  if (id === 'cdc') return Search;
  if (id === 'ctn') return Coins;
  if (id === 'ctb') return Car;
  if (id === 'ce') return Target;
  if (id === 'eca') return Heart;
  if (id === 'ei' || id === 'epd') return Users;
  if (id === 'cpm' || id === 'cppm') return Shield;
  if (id === 'cflor' || id === 'cagua' || id === 'cmin') return Trees;
  if (id === 'cba') return Plane;
  if (id === 'ccom') return Briefcase;
  if (id === 'ctel') return Flame;
  return BookMarked;
};

const HomeTabEmAlta = ({ onOpenCategory, onSelectRadar, onOpenLei, onOpenJurisprudencia }: HomeTabEmAltaProps) => {
  const [activeTab, setActiveTab] = useState('todas');

  return (
    <div className="space-y-6 pb-8">
      {/* 1. CARROSSEL DE ATALHOS/FAVORITOS DE LEIS */}
      <HomeAtalhosLeisCarousel onOpenLei={onOpenLei || (() => {})} />

      {/* 2. LEGISLAÇÃO BRASILEIRA — ÁREAS DO DIREITO (COM ABAS) */}
      <section className="space-y-3 px-1 pt-2">
        {/* Menu de Alternância (Tabs) */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 -mr-4 pr-6">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'codigo', label: 'Códigos' },
            { id: 'estatuto', label: 'Estatutos' },
            { id: 'jurisprudencia', label: 'Jurisprudência' },
            { id: 'lei-ordinaria', label: 'Leis Ordinárias' },
            { id: 'lei-especial', label: 'Penal Especial' },
            { id: 'decreto', label: 'Decretos' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-5 py-2.5 rounded-full text-[14px] font-display font-bold uppercase tracking-wide flex items-center justify-center whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-secondary/60 text-muted-foreground border border-border/50 hover:bg-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-1">
          <h3 className="font-display text-foreground text-[18px] font-bold uppercase flex items-center gap-2 tracking-widest">
            <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
            <span className="truncate">
              {activeTab === 'todas' ? 'Legislação' : 
               activeTab === 'codigo' ? 'Códigos' :
               activeTab === 'estatuto' ? 'Estatutos' :
               activeTab === 'jurisprudencia' ? 'Jurisprudência' :
               activeTab === 'lei-ordinaria' ? 'Leis Ordinárias' :
               activeTab === 'lei-especial' ? 'Penal Especial' : 'Decretos'}
            </span>
          </h3>
          <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3 truncate mt-0.5">
            {activeTab === 'todas' && 'Consulte as leis e normas organizadas por ramo do Direito'}
            {activeTab === 'codigo' && 'Principais códigos jurídicos brasileiros.'}
            {activeTab === 'estatuto' && 'Estatutos de proteção e garantias.'}
            {activeTab === 'jurisprudencia' && 'Súmulas STF, STJ e Vinculantes.'}
            {activeTab === 'lei-ordinaria' && 'Consolidações e leis federais.'}
            {activeTab === 'lei-especial' && 'Legislação penal extravagante.'}
            {activeTab === 'decreto' && 'Regulamentações executivas federais.'}
          </p>
        </div>

        <div className="h-[1.5px] bg-border/70 w-full mb-2" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4 min-h-[200px] content-start">
          {activeTab === 'todas' && AREA_CATS.map((c) => {
            const displayLabel = getAreaDisplayLabel(c.label);
            return (
              <HomeCard
                key={c.id}
                icon={c.icon}
                label={displayLabel}
                sublabel={c.sublabel}
                color={c.color}
                delay={0}
                solidColor={true}
                hideChevron={true}
                hideWatermark={true}
                titleClassName="font-sans font-medium text-[13.5px] xs:text-[14px] leading-tight text-white/95 break-words"
                onClick={() => onOpenCategory({ ...c, label: displayLabel })}
                data-track="home_card_click"
                data-track-name={displayLabel}
                data-track-section="legislacao"
              />
            );
          })}

          {activeTab === 'jurisprudencia' && [
            { id: 'juri-stf-vinc', label: 'Súmulas Vinculantes', sublabel: 'STF', icon: ScrollText, color: '#EC4899' },
            { id: 'juri-stf', label: 'Súmulas STF', sublabel: 'Supremo Tribunal Federal', icon: ScrollText, color: '#EC4899' },
            { id: 'juri-stj', label: 'Súmulas STJ', sublabel: 'Superior Tribunal de Justiça', icon: ScrollText, color: '#EC4899' },
          ].map((c, i) => (
            <HomeCard
              key={c.id}
              icon={c.icon}
              label={c.label}
              sublabel={c.sublabel}
              color={c.color}
              delay={i * 0.04}
              onClick={() => onOpenJurisprudencia?.()}
              data-track="home_card_click"
              data-track-name={c.label}
              data-track-section="jurisprudencia"
            />
          ))}

          {activeTab !== 'todas' && activeTab !== 'jurisprudencia' && LEIS_CATALOG.filter(l => l.tipo === activeTab).map((lei, i) => {
            const LawIcon = getLawIcon(lei.id);
            
            let displayLabel = lei.sigla || lei.nome;
            let displaySublabel = lei.nome;
            
            if (lei.tipo === 'estatuto') {
              if (lei.id === 'eca') {
                displayLabel = 'ECA';
              } else if (lei.id === 'epd') {
                displayLabel = 'PCD';
              } else {
                displayLabel = lei.nome.replace(/^Estatuto (da|do|de|dos|das|nacional da) /i, '').trim();
              }
              displaySublabel = lei.descricao;
            }

            return (
              <HomeCard
                key={lei.id}
                icon={LawIcon}
                label={displayLabel}
                sublabel={displaySublabel}
                color={lei.iconColor || '#38BDF8'}
                inlineTitle={true}
                delay={i * 0.03}
                onClick={() => onOpenLei?.(lei.id)}
                data-track="home_card_click"
                data-track-name={lei.sigla || lei.nome}
                data-track-section={activeTab}
              />
            );
          })}
        </div>
      </section>

      {/* 3. APRENDA SOBRE AS LEIS */}
      <div className="pt-4 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        <Suspense fallback={<div className="h-32 bg-muted/20 animate-pulse rounded-xl mx-4 mt-8" />}>
          <AprendaSobreLeis titleClassName="px-4 sm:px-6 md:px-8 lg:px-12" />
        </Suspense>
      </div>

      {/* 4. OUTRAS NORMAS (RADARES) */}
      <div className="pt-2">
        <div className="mb-4">
          <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1 h-5 rounded-full bg-primary" />
            OUTRAS NORMAS
          </h3>
          <p className="font-body text-sm text-muted-foreground mt-1 ml-3">
            Acompanhe publicações diárias, radares e boletins jurídicos
          </p>
        </div>
        <div className="space-y-2.5">
          {RADAR_CATS.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => onSelectRadar(c.id)}
                data-track="home_radar_cat_click"
                className="w-full flex items-center gap-3 px-4 py-5 min-h-[76px] rounded-2xl bg-secondary border border-border/60 shadow-sm transition focus-visible:outline-none"
              >
                <Icon
                  className="w-8 h-8 shrink-0"
                  style={{ color: c.color }}
                  strokeWidth={1.15}
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-display text-foreground text-[15.5px] font-bold leading-tight truncate">
                    {c.label}
                  </p>
                  <p className="font-body text-muted-foreground text-[12px] leading-tight truncate mt-0.5">
                    {c.sublabel}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(HomeTabEmAlta);
