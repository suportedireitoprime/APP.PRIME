import { memo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, BookOpen, Landmark, Gavel, FileText, ArrowRight, LucideIcon } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { getRecentes, LeiRecente } from '@/lib/leisRecentes';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath, tipoToSlug, leiToSlug } from '@/lib/legislacaoSlugs';

const GREEN_COLOR = '#10B981';

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

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClick}
      style={{
        background: `linear-gradient(to right, ${GREEN_COLOR}2A, ${GREEN_COLOR}0A)`,
        borderColor: `${GREEN_COLOR}4D`,
      }}
      className="w-full flex items-center gap-3 px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl border text-left active:scale-[0.98] transition-transform overflow-hidden relative shadow-lg group cursor-pointer"
    >
      {/* Ícone principal à esquerda */}
      <div className="flex items-center justify-center shrink-0 z-10">
        <IconeLei
          className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-sm text-emerald-400 group-hover:scale-105 transition-transform"
          strokeWidth={1.6}
        />
      </div>

      {/* Textos informativos centrais */}
      <div className="flex-1 min-w-0 z-10">
        <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-emerald-400 font-mono">
          {displayTag}
        </p>
        <p className="font-serif italic text-[15px] sm:text-[16px] font-semibold tracking-tight text-white truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)] leading-snug">
          {displayNome}
        </p>
        <p className="text-[11px] font-semibold truncate flex items-center gap-1.5 text-emerald-300/85">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400 shrink-0" />
          <span>{displaySubtitulo}</span>
        </p>
      </div>

      {/* Seta indicativa à direita ampliada */}
      <ArrowRight
        className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 z-10 text-emerald-400 group-hover:translate-x-1 transition-transform"
        strokeWidth={2.4}
      />

      {/* Decoração de fundo — SVG translúcido no lado direito com glow esmeralda */}
      <div
        className="absolute -right-3 -bottom-3 pointer-events-none select-none z-0 overflow-visible flex items-center justify-center"
        style={{
          filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.9)) drop-shadow(0 0 10px ${GREEN_COLOR}40)`,
        }}
      >
        <IconeLei
          className="w-24 h-24 opacity-20 text-emerald-500"
          strokeWidth={1.2}
        />
      </div>
    </motion.button>
  );
};

export default memo(HomeVadeMecumRecenteBanner);

