// @ts-nocheck
import { memo, useState } from 'react';
import { ScrollText, BookMarked, Landmark, Scale, Briefcase, Car, Users, Search, Target, Shield, Coins, Heart, ShieldAlert, Plane, Trees, Flame } from 'lucide-react';
import HomeCard from '@/components/vademecum/home/HomeCard';
import HomeEmAltaCarousel from '@/components/vademecum/home/carousel/HomeEmAltaCarousel';
import HomeVadeMecumRecenteBanner from '@/components/vademecum/home/HomeVadeMecumRecenteBanner';
import { AREA_CATS, Cat, AreaCat } from './homeSectionsData';
import { LEIS_CATALOG } from '@/data/leisCatalog';

interface HomeTabEmAltaProps {
  onOpenCategory: (cat: Cat | AreaCat) => void;
  onSelectRadar: (id: string) => void;
  onOpenLei?: (id: string) => void;
  onOpenJurisprudencia?: () => void;
}

function getAreaDisplayLabel(label: string): string {
  return label.replace(/^Direito (do |da |de |dos |das )?/i, '').trim();
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
      {/* Botão da Última Lei Acessada (Continuar Leitura) */}
      <div className="pt-1">
        <HomeVadeMecumRecenteBanner onOpenLei={onOpenLei} />
      </div>

      {/* 1. CARROSSEL DE LEIS EM ALTA */}
      <HomeEmAltaCarousel onOpenLei={onOpenLei} />

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
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-secondary/60 text-muted-foreground border border-border/50 hover:bg-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-1">
          <h3 className="font-display text-foreground text-[18px] font-bold uppercase flex items-center gap-2 tracking-widest">
            <span className="w-1 h-5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
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
          {activeTab === 'todas' && AREA_CATS.map((c, i) => {
            const displayLabel = getAreaDisplayLabel(c.label);
            return (
              <HomeCard
                key={c.id}
                icon={c.icon}
                label={displayLabel}
                color={c.color}
                titleClassName="font-card text-foreground font-semibold text-[14.5px] sm:text-[15.5px] uppercase tracking-[0.04em] leading-snug line-clamp-1"
                delay={i * 0.03}
                onClick={() => onOpenCategory({ ...c, label: displayLabel })}
                data-track="home_card_click"
                data-track-name={displayLabel}
                data-track-section="legislacao"
              />
            );
          })}

          {activeTab === 'jurisprudencia' && [
            { id: 'juri-stf-vinc', label: 'Súmulas Vinculantes', icon: ScrollText, color: '#EC4899' },
            { id: 'juri-stf', label: 'Súmulas STF', icon: ScrollText, color: '#EC4899' },
            { id: 'juri-stj', label: 'Súmulas STJ', icon: ScrollText, color: '#EC4899' },
          ].map((c, i) => (
            <HomeCard
              key={c.id}
              icon={c.icon}
              label={c.label}
              color={c.color}
              titleClassName="font-card text-foreground font-semibold text-[14.5px] sm:text-[15.5px] uppercase tracking-[0.04em] leading-snug line-clamp-1"
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
            
            if (lei.tipo === 'estatuto') {
              if (lei.id === 'eca') {
                displayLabel = 'ECA';
              } else if (lei.id === 'epd') {
                displayLabel = 'PCD';
              } else {
                displayLabel = lei.nome.replace(/^Estatuto (da|do|de|dos|das|nacional da) /i, '').trim();
              }
            }

            return (
              <HomeCard
                key={lei.id}
                icon={LawIcon}
                label={displayLabel}
                color={lei.iconColor || '#38BDF8'}
                titleClassName="font-card text-foreground font-semibold text-[14.5px] sm:text-[15.5px] uppercase tracking-[0.04em] leading-snug line-clamp-1 min-h-[22px] flex items-center"
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
    </div>
  );
};

export default memo(HomeTabEmAlta);
