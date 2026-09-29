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
import { parseDispositivoAlteracao } from '@/data/leiAlteracoesScraped';

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
// Conteúdo 2: Novidades (Atualizações Legislativas)
// ─────────────────────────────────────────────────────────────

function getBadgeStyle(tipo: string) {
  const t = (tipo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (t.startsWith('revogad') || t.startsWith('vetad') || t.startsWith('suprimid')) {
    return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
  }
  if (t.startsWith('incluid') || t.startsWith('acrescid')) {
    return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  }
  if (t.startsWith('redacao') || t.startsWith('alterad')) {
    return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
  }
  if (t.startsWith('renumerad')) {
    return 'bg-sky-500/20 text-sky-300 border border-sky-500/30';
  }
  if (t.startsWith('vigencia') || t.startsWith('producao')) {
    return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
  }
  return 'bg-primary/20 text-primary border border-primary/30';
}

const VadeMecumHistoricoContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const [filterLei, setFilterLei] = useState<string>('todos');
  const [alteracoes, setAlteracoes] = useState<any[]>([]);
  const [loadingAlteracoes, setLoadingAlteracoes] = useState(false);

  useEffect(() => {
    setLoadingAlteracoes(true);
    supabase
      .from('vademecum_historico_alteracoes')
      .select(`
        id,
        lei_id,
        resumo_ia,
        data_alteracao,
        criado_em,
        artigo_numero,
        tipo_alteracao,
        texto_anterior,
        texto_atual,
        detectado_em,
        lei:vade_mecum_leis(nome, tipo, tabela_nome)
      `)
      .order('criado_em', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) {
           setAlteracoes(data);
        }
        setLoadingAlteracoes(false);
      })
      .catch(() => setLoadingAlteracoes(false));
  }, []);

  const leisDisponiveis = useMemo(() => {
    const nomes = alteracoes.map(a => a.lei?.nome).filter(Boolean);
    return Array.from(new Set(nomes));
  }, [alteracoes]);

  const filtered = useMemo(() => {
    if (filterLei === 'todos') return alteracoes;
    return alteracoes.filter(a => a.lei?.nome === filterLei);
  }, [alteracoes, filterLei]);

  return (
    <div className="space-y-4 pb-8">
      {/* Menu de alternância com as leis */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1">
        <button
          onClick={() => { haptic.selection(); setFilterLei('todos'); }}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
            filterLei === 'todos' ? 'bg-primary/20 text-primary border-primary/50' : 'bg-[#14151a] text-zinc-400 border-white/10 hover:text-zinc-200'
          }`}
        >
          Todos
        </button>
        {leisDisponiveis.map((nome, i) => (
          <button
            key={i}
            onClick={() => { haptic.selection(); setFilterLei(nome); }}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${
              filterLei === nome ? 'bg-primary/20 text-primary border-primary/50' : 'bg-[#14151a] text-zinc-400 border-white/10 hover:text-zinc-200'
            }`}
          >
            {nome}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {loadingAlteracoes ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <History className="w-10 h-10 text-zinc-600 mx-auto" />
            <p className="text-white text-sm font-bold">Nenhuma novidade recente mapeada</p>
          </div>
        ) : (
          filtered.map((item, i) => {
            const ano = item.detectado_em ? new Date(item.detectado_em).getFullYear() : 2026;
            const dispInfo = parseDispositivoAlteracao({
              artigo_numero: item.artigo_numero || '',
              texto_atual: item.texto_atual || '',
              texto_anterior: item.texto_anterior || '',
              tipo_alteracao: item.tipo_alteracao || '',
              ano
            });
            const badgeClass = getBadgeStyle(dispInfo.acaoTexto || item.tipo_alteracao || 'Alteração');
            const dataFormated = item.data_alteracao ? new Date(item.data_alteracao).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('. de ', '/') : '';

            return (
              <div
                key={item.id || i}
                onClick={() => {
                  haptic.selection();
                  onClose();
                  const slug = leiToSlug({ id: item.lei_id, nome: item.lei?.nome || '' });
                  const base = `/legislacao/${tipoToSlug(item.lei?.tipo || 'lei')}/${slug}`;
                  const numClean = (item.artigo_numero || '').replace(/[^0-9]/g, '');
                  navigate(numClean ? `${base}/${numClean}` : base);
                }}
                className="w-full rounded-2xl bg-primary/10 hover:bg-primary/15 border border-primary/25 hover:border-primary/40 p-4 flex flex-col justify-between shadow-xl shadow-black/60 backdrop-blur-md active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="flex items-center justify-between gap-1.5 mb-2 relative z-10">
                  <span className="font-bold text-[13.5px] sm:text-[14.5px] text-white group-hover:text-primary transition-colors flex items-center gap-1 drop-shadow-sm truncate pr-1">
                    {dispInfo.artigoDisplayCompleto || item.artigo_numero || 'Artigo'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full leading-none shrink-0 shadow-sm ${badgeClass}`}>
                    {dispInfo.acaoTexto || 'Alteração'}
                  </span>
                </div>
                <div className="flex-1 relative z-10 mb-2.5">
                  <p className="text-[11px] text-zinc-300 line-clamp-3 leading-relaxed font-normal">
                    {dispInfo.acaoDescritiva ? (
                      <>
                        <span className="font-semibold text-white/95">{dispInfo.acaoDescritiva}: </span>
                        <span>{dispInfo.corpoTexto || dispInfo.descricaoCompleta}</span>
                      </>
                    ) : (
                      dispInfo.descricaoCompleta || item.resumo_ia
                    )}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-primary/20 relative z-10">
                  <span className="truncate max-w-[200px] font-medium text-zinc-300">
                    {item.lei?.nome || 'Legislação'}
                  </span>
                  <span className="font-bold text-zinc-200 shrink-0 ml-1 tracking-wider uppercase">
                    {dataFormated}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


// ─────────────────────────────────────────────────────────────
// Conteúdo 3: Radares Legislativos
// ─────────────────────────────────────────────────────────────
const VadeMecumRadaresContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 pb-8">
      <RadarLegislacaoContent
        leiNome="Código Penal"
        navigate={navigate}
        onSelectArtigoNumero={(num) => {
          const clean = (num || '').replace(/[^0-9]/g, '');
          onClose();
          navigate(`/legislacao/codigos/codigo-penal/${clean}`);
        }}
      />
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
    historico: { title: 'Novidades', subtitle: 'Últimas atualizações legislativas' },
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
            className="fixed inset-0 z-[99] bg-black/80"
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
                className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center active:opacity-70 transition-transform cursor-pointer shrink-0"
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
