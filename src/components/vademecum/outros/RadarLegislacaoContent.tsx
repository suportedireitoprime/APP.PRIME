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
    <div className="space-y-4 pb-12 select-none">
      {/* ── CARD EXPLICATIVO EM DESTAQUE NO TOPO (solicitado no áudio) ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/15 via-[#181920] to-[#121316] border border-primary/25 shadow-xl shadow-black/50">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
            <Radar className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <h3 className="font-display text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-2">
              <span>Como funciona o Radar do Código Penal?</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-bold">
                Câmara dos Deputados
              </span>
            </h3>
            <p className="text-xs sm:text-[13px] text-zinc-300 leading-relaxed font-normal">
              Aqui você acompanha em tempo real as <strong>Proposições e Projetos de Lei (PL)</strong> que estão tramitando no Congresso Nacional com potencial direto de alterar, incluir ou revogar dispositivos do Código Penal. Saiba com antecedência <strong>quais artigos podem mudar</strong> e o que cada parlamentar está propondo.
            </p>
          </div>
        </div>

        {/* Rodapé do card informativo com botão de recarregar */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">
              {loading ? 'Consultando Câmara...' : `${proposicoes.length} proposições ativas mapeadas`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.selection();
              loadData(true);
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-primary' : 'text-zinc-400'}`} />
            <span>{refreshing ? 'Atualizando...' : 'Atualizar Dados'}</span>
          </button>
        </div>
      </div>

      {/* ── BARRA DE PESQUISA INTELIGENTE ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar por artigo (ex: 157, 171), deputado ou crime..."
          className="w-full bg-[#121318] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
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
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
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
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-hero-panel text-white border-red-500/40 shadow-md shadow-red-950/40 scale-105'
                  : 'bg-white/[0.05] hover:bg-white/[0.10] text-zinc-400 hover:text-white border-white/10'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* ── CONTAGEM E STATUS DE RESULTADOS ── */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1 pt-1">
        <span>
          Exibindo <strong>{filteredProposicoes.length}</strong> projetos de lei para o Código Penal
        </span>
      </div>

      {/* ── LISTAGEM DETALHADA DAS PROPOSIÇÕES ── */}
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
        <div className="space-y-3.5">
          {filteredProposicoes.map((item, idx) => (
            <motion.div
              key={`${item.id}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-2xl border border-white/10 bg-[#121318]/95 hover:border-primary/40 transition-all p-4 sm:p-5 shadow-xl shadow-black/40 flex flex-col justify-between space-y-3.5 group relative overflow-hidden"
            >
              {/* Faixa lateral decorativa vermelha */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-transparent" />

              {/* 1. TOPO DO CARD: PROPOSIÇÃO, BADGE E ANO */}
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-base sm:text-lg font-bold text-white tracking-tight">
                    {item.proposicaoDisplay}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                    {item.tipoMudanca}
                  </span>
                </div>

                <span className="text-[11px] font-bold text-zinc-400 font-mono">
                  {item.dataDisplay}
                </span>
              </div>

              {/* 2. ARTIGO(S) NA MIRA DA ALTERAÇÃO (DESTAQUE MÁXIMO SOLICITADO NO ÁUDIO) */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-black/40 border border-red-500/30 flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 shrink-0 text-red-400">
                  <Scale className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Artigo(s) na mira:
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.artigosAfetados.map((art, aIdx) => (
                    <span
                      key={aIdx}
                      className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-white/10 text-white border border-white/20 shadow-sm"
                    >
                      {art}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3. PARLAMENTAR PROPONENTE (NOME DO DEPUTADO SOLICITADO NO ÁUDIO) */}
              <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center shrink-0">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white leading-tight">
                    {item.autorNome}
                    {item.autorPartidoUf && (
                      <span className="ml-1.5 text-[11px] font-medium text-zinc-400 font-mono">
                        ({item.autorPartidoUf})
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {item.autorCargo || 'Deputado Federal'} • Proponente na Câmara
                  </p>
                </div>
              </div>

              {/* 4. O QUE ELE QUER FAZER / MUDANÇA PROPOSTA (SOLICITADO NO ÁUDIO) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  O que o projeto quer mudar no Código Penal:
                </span>
                <div className="text-xs sm:text-[13px] leading-relaxed text-zinc-200 p-3 rounded-xl bg-black/40 border border-white/5 font-sans">
                  {item.oQueQuerFazer}
                </div>
              </div>

              {/* 5. FASE DA TRAMITAÇÃO */}
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  {item.situacaoTramitacao}
                </span>
              </div>

              {/* 6. AÇÕES: NAVEGAR PARA O ARTIGO NO APP OU ABRIR NO PORTAL DA CÂMARA */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 flex-wrap">
                {onSelectArtigoNumero && item.artigoPrincipalNumero ? (
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      onSelectArtigoNumero(item.artigoPrincipalNumero!);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold border border-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    <span>Ver Artigo {item.artigoPrincipalNumero}</span>
                  </button>
                ) : (
                  <div />
                )}

                <a
                  href={item.linkCamara}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hero-panel hover:bg-primary text-white text-xs font-bold border border-red-500/30 active:scale-95 transition-all cursor-pointer ml-auto"
                >
                  <span>Ver na Câmara</span>
                  <ExternalLink className="w-3 h-3 text-white" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RadarLegislacaoContent;
export const prefetchRadarData: (..._args: any[]) => Promise<any> = async () => null;
export const buildContextualTitle: (..._args: any[]) => string = () => 'Radar Legislativo';
