import { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, BookOpen, Landmark, Gavel, FileText, ArrowRight, Play, Sparkles, LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { getRecentes, LeiRecente } from '@/lib/leisRecentes';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath, tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';
import { getLeiColor } from '@/lib/leiTheme';

interface HomeVadeMecumRecenteBannerProps {
  onOpenLei?: (id: string) => void;
}

const getIconForLei = (id?: string, tipo?: string): LucideIcon => {
  if (!id) return Scale;
  const cleanId = id.toLowerCase();
  if (cleanId === 'cf88' || cleanId.includes('constitui')) return Landmark;
  if (cleanId === 'cp' || cleanId === 'cpp') return Gavel;
  if (cleanId === 'cc' || cleanId === 'cpc') return Scale;
  if (tipo === 'codigo') return FileText;
  return BookOpen;
};

const HomeVadeMecumRecenteBanner = ({ onOpenLei }: HomeVadeMecumRecenteBannerProps) => {
  const navigate = useNavigate();
  const [ultimaLei, setUltimaLei] = useState<LeiRecente | null>(null);
  const [ultimoArtigo, setUltimoArtigo] = useState<string | null>(null);

  const carregarUltima = useCallback(() => {
    try {
      const recentes = getRecentes();
      if (recentes && recentes.length > 0) {
        const top = recentes[0];
        setUltimaLei(top);

        const salvo =
          localStorage.getItem(`ultimo_artigo_numero_${top.tabela_nome || top.leiId}`) ||
          localStorage.getItem(`ultimo_artigo_numero_${top.leiId}`);
        setUltimoArtigo(salvo || null);
      } else {
        setUltimaLei(null);
        setUltimoArtigo(null);
      }
    } catch {
      setUltimaLei(null);
    }
  }, []);

  useEffect(() => {
    carregarUltima();
    window.addEventListener('recentes-updated', carregarUltima);
    window.addEventListener('storage', carregarUltima);
    window.addEventListener('focus', carregarUltima);
    return () => {
      window.removeEventListener('recentes-updated', carregarUltima);
      window.removeEventListener('storage', carregarUltima);
      window.removeEventListener('focus', carregarUltima);
    };
  }, [carregarUltima]);

  const handleClick = () => {
    haptic.selection();

    if (!ultimaLei) {
      // Se não tiver recente, navega para o primeiro código de referência
      const targetCf = LEIS_CATALOG.find((l) => l.id === 'cf88');
      if (targetCf) navigate(leiPath(targetCf));
      return;
    }

    if (onOpenLei) {
      onOpenLei(ultimaLei.leiId);
      return;
    }

    const targetLei = LEIS_CATALOG.find(
      (l) =>
        l.id.toLowerCase() === ultimaLei.leiId?.toLowerCase() ||
        l.tabela_nome?.toLowerCase() === ultimaLei.tabela_nome?.toLowerCase()
    );

    const base = targetLei
      ? leiPath(targetLei)
      : `/legislacao/${tipoToSlug(ultimaLei.tipo)}/${leiToSlug({ id: ultimaLei.leiId, nome: ultimaLei.nome })}`;

    navigate(ultimoArtigo ? `${base}/${encodeURIComponent(ultimoArtigo)}` : base);
  };

  const IconeLei = getIconForLei(ultimaLei?.leiId, ultimaLei?.tipo);

  // Nome e detalhes para exibição
  const catalogItem = ultimaLei ? LEIS_CATALOG.find((l) => l.id === ultimaLei.leiId) : null;
  const displayNome = catalogItem?.nome || ultimaLei?.nome || 'Constituição Federal & Códigos';

  const displayTag = ultimaLei ? 'CONTINUAR LEITURA' : 'VADE MECUM LEGISLAÇÃO';

  const displaySubtitulo = ultimaLei
    ? ultimoArtigo
      ? `Parou no Artigo ${ultimoArtigo} · Clique para retomar`
      : ultimaLei.descricao || 'Consulte os artigos e jurisprudência'
    : 'Consulte a CF/88, Códigos, Estatutos e Súmulas';

  // Banner de Continuar Leitura em verde esmeralda alinhado à identidade visual do Vade Mecum
  const themeColor = '#10b981';

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      className="w-full max-w-lg mx-auto bg-zinc-900/90 hover:bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500/60 p-1.5 pl-2.5 pr-2 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(16,185,129,0.18)] flex items-center justify-between backdrop-blur-xl group cursor-pointer transition-all active:scale-[0.98] relative overflow-hidden"
    >
      {/* Glow suave no fundo da cápsula */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Ícone circular em badge esmeralda */}
      <div className="flex items-center gap-2.5 min-w-0 z-10 flex-1">
        <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
          <IconeLei className="w-4.5 h-4.5" strokeWidth={1.8} />
        </div>

        {/* Textos da Cápsula */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              {displayTag}
            </span>
            {ultimoArtigo && (
              <span className="text-[10px] text-zinc-400 font-mono">
                · Art. {ultimoArtigo}
              </span>
            )}
          </div>
          <p className="font-serif italic text-[13px] sm:text-[14px] font-bold text-white truncate drop-shadow-sm leading-tight mt-0.5">
            {displayNome}
          </p>
        </div>
      </div>

      {/* Botão de Ação Circular Esmeralda (Play / Retomar) */}
      <div className="w-8 h-8 rounded-full bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-md shadow-emerald-400/30 group-hover:bg-emerald-300 group-hover:scale-105 active:scale-95 transition-all shrink-0 z-10 ml-2">
        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
      </div>
    </motion.button>
  );
};

export default memo(HomeVadeMecumRecenteBanner);

