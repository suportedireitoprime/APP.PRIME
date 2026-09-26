import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  StickyNote, 
  History, 
  Radar, 
  Clock, 
  Scale, 
  FileText, 
  ExternalLink, 
  Trash2, 
  Loader2, 
  ScanEye, 
  Users, 
  ChevronRight, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { supabase } from '@/integrations/supabase/client';
import { getLeiByTabela, LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { getRecentes, type LeiRecente } from '@/lib/leisRecentes';
import VadeMecumFavoritos from '@/pages/VadeMecumFavoritos';
import RadarLegislacaoContent from '@/components/vademecum/outros/RadarLegislacaoContent';

export type QuickActionType = 'favoritos' | 'anotacoes' | 'historico' | 'radares';

interface VadeMecumQuickActionSheetProps {
  activeSheet: QuickActionType | null;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────
// Conteúdo 1: Minhas Anotações Globais
// ─────────────────────────────────────────────────────────────
const VadeMecumAnotacoesContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [anotacoes, setAnotacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarAnotacoes = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAnotacoes([]);
        return;
      }

      const { data, error } = await supabase
        .from('artigos_anotacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setAnotacoes(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar anotações:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarAnotacoes();
  }, [carregarAnotacoes]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptic.impact();
    try {
      await supabase.from('artigos_anotacoes').delete().eq('id', id);
      setAnotacoes(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.warn('Erro ao deletar anotação:', err);
    }
  };

  const handleOpenArtigo = (item: any) => {
    haptic.selection();
    const lei = getLeiByTabela(item.tabela_codigo);
    const numArt = item.numero_artigo || (item.artigo_id ? String(item.artigo_id).split('::')[1] : '');
    onClose();
    if (lei && numArt) {
      navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${leiToSlug(lei)}/${encodeURIComponent(numArt)}`);
    } else if (lei) {
      navigate(`/legislacao/${tipoToSlug(lei.tipo)}/${leiToSlug(lei)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-xs text-zinc-400">Carregando anotações...</p>
      </div>
    );
  }

  if (anotacoes.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-3 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <StickyNote className="w-8 h-8 text-amber-500/80" />
        </div>
        <p className="text-white text-base font-bold">Nenhuma anotação criada</p>
        <p className="text-zinc-400 text-xs max-w-xs leading-relaxed">
          Ao estudar qualquer lei no Vade Mecum, você pode grifar trechos ou tocar no botão de anotações para salvar suas reflexões aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-8">
      <div className="text-xs font-semibold text-zinc-400 px-1 flex items-center justify-between">
        <span>{anotacoes.length} {anotacoes.length === 1 ? 'anotação salva' : 'anotações salvas'}</span>
      </div>

      {anotacoes.map((item, i) => {
        const lei = getLeiByTabela(item.tabela_codigo);
        const numArt = item.numero_artigo || (item.artigo_id ? String(item.artigo_id).split('::')[1] : null);
        const dataFormatada = item.updated_at || item.created_at
          ? new Date(item.updated_at || item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          : null;

        return (
          <motion.div
            key={item.id || i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => handleOpenArtigo(item)}
            className="group relative p-4 rounded-2xl bg-[#14151a] hover:bg-[#181920] border border-white/10 hover:border-amber-500/40 transition-all cursor-pointer shadow-lg shadow-black/40 flex flex-col gap-2.5 active:scale-[0.99]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25 text-xs font-bold font-mono">
                  {numArt ? `Art. ${numArt}` : 'Artigo'}
                </span>
                {lei && (
                  <span className="text-xs font-semibold text-zinc-300 truncate max-w-[200px]">
                    {lei.nome}
                  </span>
                )}
                {dataFormatada && (
                  <span className="text-[11px] text-zinc-500 font-mono ml-auto">
                    {dataFormatada}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  aria-label="Excluir anotação"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="w-7 h-7 rounded-lg bg-white/[0.05] group-hover:bg-amber-500/20 flex items-center justify-center text-zinc-400 group-hover:text-amber-400 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {item.anotacao}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Conteúdo 2: Histórico de Acessos e Alterações
// ─────────────────────────────────────────────────────────────
const VadeMecumHistoricoContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'recentes' | 'alteracoes'>('recentes');
  const [recentes, setRecentes] = useState<LeiRecente[]>([]);
  const [alteracoes, setAlteracoes] = useState<any[]>([]);
  const [loadingAlteracoes, setLoadingAlteracoes] = useState(false);

  useEffect(() => {
    setRecentes(getRecentes());
  }, []);

  useEffect(() => {
    if (tab === 'alteracoes' && alteracoes.length === 0) {
      setLoadingAlteracoes(true);
      supabase
        .from('vademecum_historico_alteracoes')
        .select(`
          id,
          lei_id,
          resumo_ia,
          data_alteracao,
          criado_em,
          lei:vade_mecum_leis(nome, tipo, tabela_nome)
        `)
        .order('criado_em', { ascending: false })
        .limit(25)
        .then(({ data, error }) => {
          if (!error && data) setAlteracoes(data);
          setLoadingAlteracoes(false);
        })
        .catch(() => setLoadingAlteracoes(false));
    }
  }, [tab, alteracoes.length]);

  const handleOpenRecente = (r: LeiRecente) => {
    haptic.selection();
    onClose();
    const slug = leiToSlug({ id: r.leiId, nome: r.nome });
    const base = `/legislacao/${tipoToSlug(r.tipo)}/${slug}`;
    navigate(r.artigoNumero ? `${base}/${encodeURIComponent(r.artigoNumero)}` : base);
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Abas */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setTab('recentes');
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'recentes' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Acessados ({recentes.length})
        </button>
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setTab('alteracoes');
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            tab === 'alteracoes' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Mudanças nas Leis
        </button>
      </div>

      {tab === 'recentes' && (
        <div className="space-y-2.5">
          {recentes.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Clock className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-white text-sm font-bold">Nenhum histórico recente</p>
              <p className="text-zinc-400 text-xs">As leis que você consultar aparecerão aqui.</p>
            </div>
          ) : (
            recentes.map((r, i) => (
              <div
                key={i}
                onClick={() => handleOpenRecente(r)}
                className="p-3.5 rounded-xl bg-[#14151a] hover:bg-[#181920] border border-white/10 hover:border-primary/40 transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{r.nome}</p>
                  <p className="text-xs text-zinc-400 truncate">{r.descricao || r.tipo}</p>
                  {r.artigoNumero && (
                    <span className="inline-block mt-1 text-[11px] font-mono text-primary font-bold">
                      Art. {r.artigoNumero}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'alteracoes' && (
        <div className="space-y-3">
          {loadingAlteracoes ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            </div>
          ) : alteracoes.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <History className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-white text-sm font-bold">Nenhuma alteração recente mapeada</p>
            </div>
          ) : (
            alteracoes.map((item, i) => (
              <div
                key={item.id || i}
                className="p-4 rounded-xl bg-[#14151a] border border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-primary">{item.lei?.nome || 'Legislação'}</span>
                  <span className="text-zinc-500 font-mono text-[11px]">
                    {item.data_alteracao ? new Date(item.data_alteracao).toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{item.resumo_ia}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Conteúdo 3: Radares Legislativos
// ─────────────────────────────────────────────────────────────
const VadeMecumRadaresContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState<'cp' | 'hub'>('cp');

  return (
    <div className="space-y-4 pb-8">
      {/* Alternância rápida entre o Radar de PLs e o Hub de Radares */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/10 max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setSubTab('cp');
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            subTab === 'cp' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Radar Código Penal (PLs)
        </button>
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            setSubTab('hub');
          }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            subTab === 'hub' ? 'bg-primary text-white shadow-md' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Todos os Radares
        </button>
      </div>

      {subTab === 'cp' ? (
        <RadarLegislacaoContent
          leiNome="Código Penal"
          navigate={navigate}
          onSelectArtigoNumero={(num) => {
            const clean = (num || '').replace(/[^0-9]/g, '');
            onClose();
            navigate(`/legislacao/codigos/codigo-penal/${clean}`);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div
            onClick={() => {
              haptic.selection();
              onClose();
              navigate('/radar-360');
            }}
            className="p-5 rounded-2xl bg-gradient-to-br from-[#161820] to-[#101115] border border-white/10 hover:border-primary/50 transition-all cursor-pointer shadow-lg space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
              <ScanEye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors">
                Radar 360 (Leis & DOU)
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Monitoramento contínuo de publicações no Diário Oficial e Planalto, com análises de impacto geradas por Inteligência Artificial.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary pt-1">
              <span>Acessar Radar 360</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </div>
          </div>

          <div
            onClick={() => {
              haptic.selection();
              onClose();
              navigate('/radar/deputados');
            }}
            className="p-5 rounded-2xl bg-gradient-to-br from-[#161820] to-[#101115] border border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer shadow-lg space-y-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                Deputados Federais (513)
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Acompanhe o perfil, gastos parlamentares, presença e projetos de lei apresentados por cada deputado federal.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 pt-1">
              <span>Explorar Parlamentares</span>
              <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL: SHEET DESLIZANTE DE BAIXO PRA CIMA
// ─────────────────────────────────────────────────────────────
export const VadeMecumQuickActionSheet: React.FC<VadeMecumQuickActionSheetProps> = ({
  activeSheet,
  onClose,
}) => {
  const titles: Record<QuickActionType, { title: string; subtitle: string }> = {
    favoritos: { title: 'Meus Favoritos', subtitle: 'Artigos e leis salvas para consulta' },
    anotacoes: { title: 'Minhas Anotações', subtitle: 'Fichamentos e grifos anotados' },
    historico: { title: 'Histórico & Recentes', subtitle: 'Leis consultadas e alterações recentes' },
    radares: { title: 'Radares Legislativos', subtitle: 'Projetos de Lei e monitoramento do Congresso' },
  };

  return (
    <AnimatePresence>
      {activeSheet && (
        <>
          {/* Backdrop Escuro com Blur */}
          <motion.div
            key={`${activeSheet}-backdrop`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[99] bg-black/80 backdrop-blur-md"
          />

          {/* Painel que desliza de baixo para cima cobrindo a tela */}
          <motion.div
            key={activeSheet}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-0 z-[100] h-[100dvh] max-h-[100dvh] bg-[#0d0d0d] flex flex-col shadow-2xl lg:max-w-[820px] lg:mx-auto pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))]"
            style={{ willChange: 'transform' }}
          >
            {/* Header da Tela Deslizante com Botão Voltar Padrão 48x48 / 52x52 */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onClose();
                }}
                aria-label="Voltar para o Vade Mecum"
                className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.4} />
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="font-display text-base sm:text-lg font-bold text-white truncate">
                  {titles[activeSheet].title}
                </h1>
                <p className="text-xs text-zinc-400 truncate">
                  {titles[activeSheet].subtitle}
                </p>
              </div>
            </div>

            {/* Conteúdo com Scroll Nativo e Safe Area Bottom */}
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(2rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] overscroll-contain">
              {activeSheet === 'favoritos' && <VadeMecumFavoritos />}
              {activeSheet === 'anotacoes' && <VadeMecumAnotacoesContent onClose={onClose} />}
              {activeSheet === 'historico' && <VadeMecumHistoricoContent onClose={onClose} />}
              {activeSheet === 'radares' && <VadeMecumRadaresContent onClose={onClose} />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VadeMecumQuickActionSheet;
