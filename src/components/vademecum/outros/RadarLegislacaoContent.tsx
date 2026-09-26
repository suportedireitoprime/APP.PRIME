import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, 
  Search, 
  ExternalLink, 
  BookOpen, 
  UserCheck, 
  Clock, 
  Building2, 
  Info, 
  Scale, 
  Sparkles, 
  ShieldAlert, 
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { getProposicoesRadarCP, type ProposicaoRadarCP, SEED_PROPOSICOES_CP } from '@/services/radarCpService';
import { haptic } from '@/lib/nativeHaptics';

interface RadarLegislacaoContentProps {
  leiNome?: string;
  tabelaNome?: string | null;
  navigate?: any;
  onSelectArtigoNumero?: (artigoNumero: string) => void;
}

export const RadarLegislacaoContent: React.FC<RadarLegislacaoContentProps> = ({
  leiNome = 'Código Penal',
  onSelectArtigoNumero,
}) => {
  const [proposicoes, setProposicoes] = useState<ProposicaoRadarCP[]>(SEED_PROPOSICOES_CP);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Todos');

  // Carrega proposições da Câmara dos Deputados
  const loadData = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    try {
      if (forceRefresh) {
        localStorage.removeItem('prime_radar_cp_proposicoes');
      }
      const data = await getProposicoesRadarCP();
      if (data && data.length > 0) {
        setProposicoes(data);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do radar:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lista de tags para filtros rápidos
  const filterTags = ['Todos', 'Art. 157 (Roubo)', 'Art. 171 (Estelionato)', 'Art. 155 (Furto)', 'Art. 129 (Lesão Corporal)', 'Art. 216-B / IA', 'Art. 359 (Estado Democrático)'];

  // Filtra as proposições de acordo com o termo de busca e chip selecionado
  const filteredProposicoes = useMemo(() => {
    return proposicoes.filter(p => {
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term ||
        p.proposicaoDisplay.toLowerCase().includes(term) ||
        p.autorNome.toLowerCase().includes(term) ||
        (p.autorPartidoUf || '').toLowerCase().includes(term) ||
        p.artigosAfetados.some(a => a.toLowerCase().includes(term)) ||
        p.oQueQuerFazer.toLowerCase().includes(term) ||
        p.ementaOficial.toLowerCase().includes(term);

      if (!matchSearch) return false;

      if (selectedTag === 'Todos') return true;
      if (selectedTag.includes('157')) return p.artigosAfetados.some(a => a.includes('157'));
      if (selectedTag.includes('171')) return p.artigosAfetados.some(a => a.includes('171'));
      if (selectedTag.includes('155')) return p.artigosAfetados.some(a => a.includes('155'));
      if (selectedTag.includes('129')) return p.artigosAfetados.some(a => a.includes('129'));
      if (selectedTag.includes('216')) return p.artigosAfetados.some(a => a.includes('216') || a.includes('218') || a.toLowerCase().includes('ia'));
      if (selectedTag.includes('359')) return p.artigosAfetados.some(a => a.includes('359'));

      return true;
    });
  }, [proposicoes, searchTerm, selectedTag]);

  return (
    <div className="space-y-3.5 pb-12 select-none">
      {/* ── CABEÇALHO COMPACTO EM 3 LINHAS (Sem card grandão, minimalista) ── */}
      <div className="flex items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
            <Radar className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
              Radar de Projetos de Lei (PL)
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span>{loading ? 'Consultando...' : `${filteredProposicoes.length} proposições ativas`}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            haptic.selection();
            loadData(true);
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer shrink-0 border border-white/5 active:scale-95"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-primary' : 'text-zinc-400'}`} />
          <span>{refreshing ? 'Atualizando' : 'Atualizar'}</span>
        </button>
      </div>

      {/* ── BARRA DE PESQUISA INTELIGENTE ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por artigo (ex: 157), deputado ou crime..."
          className="w-full bg-[#121318] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── CHIPS DE FILTRO RÁPIDO POR DISPOSITIVO DO CÓDIGO PENAL ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filterTags.map((tag) => {
          const isSelected = selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => {
                haptic.selection();
                setSelectedTag(tag);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-hero-panel text-white border-red-500/40 shadow-sm scale-105'
                  : 'bg-white/[0.05] hover:bg-white/[0.10] text-zinc-400 hover:text-white border-white/10'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* ── LISTAGEM MINIMALISTA E COMPACTA DAS PROPOSIÇÕES ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-zinc-400">Consultando proposições na Câmara dos Deputados...</p>
        </div>
      ) : filteredProposicoes.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#121316] border border-white/10 text-center space-y-2">
          <ShieldAlert className="w-8 h-8 text-zinc-500 mx-auto" />
          <p className="text-sm font-bold text-white">Nenhum projeto encontrado</p>
          <p className="text-xs text-zinc-400">Tente buscar por outro número de artigo ou limpe os filtros.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredProposicoes.map((item, idx) => {
            const artNum = item.artigoPrincipalNumero || (item.artigosAfetados[0] ? item.artigosAfetados[0].replace(/[^0-9]/g, '') : null);

            return (
              <motion.div
                key={`${item.id}-${idx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="rounded-2xl border border-white/10 bg-[#121318] hover:bg-[#16171d] hover:border-primary/40 transition-all p-3.5 sm:p-4 shadow-lg shadow-black/40 flex flex-col gap-2.5 group relative overflow-hidden"
              >
                {/* Linha 1: Foto do Deputado + Título PL + Badge Tipo + Data */}
                <div className="flex items-start gap-3">
                  {/* Foto do Parlamentar */}
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/15 bg-black/40 shrink-0 shadow-md">
                    {item.autorFotoUrl ? (
                      <img
                        src={item.autorFotoUrl}
                        alt={item.autorNome}
                        loading="lazy"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          // Fallback se imagem quebrar
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/[0.06] text-primary">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Informações Principais */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display text-sm sm:text-base font-bold text-white tracking-tight">
                          {item.proposicaoDisplay}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                          {item.tipoMudanca}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 font-mono">
                        {item.dataDisplay}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-zinc-200 mt-0.5 truncate">
                      {item.autorNome}
                      {item.autorPartidoUf && (
                        <span className="ml-1 text-[11px] font-normal text-zinc-400 font-mono">
                          ({item.autorPartidoUf})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Linha 2: Chips dos Artigos Afetados */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Na mira:
                  </span>
                  {item.artigosAfetados.map((art, aIdx) => (
                    <button
                      key={aIdx}
                      type="button"
                      onClick={() => {
                        haptic.selection();
                        if (onSelectArtigoNumero) {
                          onSelectArtigoNumero(art);
                        }
                      }}
                      className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-red-950/40 text-red-300 border border-red-500/30 hover:bg-red-900/60 hover:text-white transition-colors cursor-pointer"
                    >
                      {art}
                    </button>
                  ))}
                </div>

                {/* Linha 3: Resumo Compacto do que muda (2 linhas max) */}
                <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                  {item.oQueQuerFazer}
                </p>

                {/* Linha 4: Situação + Ações compactas */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-zinc-500 truncate min-w-0">
                    <Clock className="w-3 h-3 text-amber-500/80 shrink-0" />
                    <span className="truncate">{item.situacaoTramitacao}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    {onSelectArtigoNumero && artNum && (
                      <button
                        type="button"
                        onClick={() => {
                          haptic.selection();
                          onSelectArtigoNumero(artNum);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-[11px] font-medium border border-white/10 active:scale-95 transition-all cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3 text-primary" />
                        <span>Art. {artNum}</span>
                      </button>
                    )}

                    <a
                      href={item.linkCamara}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-[11px] font-medium border border-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Câmara</span>
                      <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

};

export default RadarLegislacaoContent;
export const prefetchRadarData: (..._args: any[]) => Promise<any> = async () => null;
export const buildContextualTitle: (..._args: any[]) => string = () => 'Radar Legislativo';
