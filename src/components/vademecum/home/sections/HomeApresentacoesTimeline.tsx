import React, { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Presentation, Clock, ChevronRight, Play } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { supabase } from '@/integrations/supabase/client';
import { PrimeImage } from '@/components/ui/PrimeImage';
import { getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { cn } from '@/lib/utils';

export interface ApresentacaoItem {
  id: string;
  titulo: string;
  descricao?: string | null;
  capa_url?: string | null;
  total_slides: number;
  area?: string | null;
  tema?: string | null;
  progresso?: number;
}

const FALLBACK_APRESENTACOES: ApresentacaoItem[] = [
  {
    id: 'f-agentes-publicos',
    titulo: 'O QUE SÃO AGENTES PÚBLICOS? DEFINIÇÃO E ESPÉCIES',
    area: 'Direito Administrativo',
    tema: 'Organização Administrativa',
    total_slides: 14,
    progresso: 35,
    capa_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f-teoria-do-crime',
    titulo: 'TEORIA DO CRIME: FATO TÍPICO, ILICITUDE E CULPABILIDADE',
    area: 'Direito Penal',
    tema: 'Parte Geral',
    total_slides: 18,
    progresso: 60,
    capa_url: 'https://images.unsplash.com/photo-1453733197781-704fa5988299?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'f-direitos-fundamentais',
    titulo: 'DIREITOS E GARANTIAS FUNDAMENTAIS NA CF/88',
    area: 'Direito Constitucional',
    tema: 'Artigo 5º da CF',
    total_slides: 22,
    progresso: 15,
    capa_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=600&auto=format&fit=crop&q=80',
  },
];

const HomeApresentacoesTimeline = () => {
  const navigate = useNavigate();
  const [itens, setItens] = useState<ApresentacaoItem[]>(() => {
    try {
      const cached = sessionStorage.getItem('home_apresentacoes_timeline');
      if (cached) return JSON.parse(cached);
    } catch {}
    return FALLBACK_APRESENTACOES;
  });

  useEffect(() => {
    let ativo = true;

    const carregarApresentacoes = async () => {
      try {
        const { data, error } = await supabase
          .from('apresentacoes_narradas')
          .select('id, titulo, descricao, capa_url, total_slides, area, tema, subtema')
          .eq('publicada', true)
          .order('created_at', { ascending: false })
          .limit(4);

        if (!error && data && data.length > 0 && ativo) {
          const formatados: ApresentacaoItem[] = data.map((item: any) => ({
            id: item.id,
            titulo: item.titulo || 'Apresentação Narrada',
            descricao: item.descricao,
            capa_url: item.capa_url,
            total_slides: Number(item.total_slides) || 12,
            area: item.area || 'Direito Geral',
            tema: item.tema,
            progresso: 0,
          }));
          setItens(formatados);
          try {
            sessionStorage.setItem('home_apresentacoes_timeline', JSON.stringify(formatados));
          } catch {}
        }
      } catch {
        // Mantém fallbacks graciosa e silenciosamente
      }
    };

    carregarApresentacoes();

    return () => {
      ativo = false;
    };
  }, []);

  const handleOpenApresentacoes = () => {
    try { haptic.selection(); } catch {}
    navigate('/apresentacoes');
  };

  const handleOpenItem = (item: ApresentacaoItem) => {
    try { haptic.impact(); } catch {}
    // Se for fallback mock, redireciona para a listagem para escolher uma real
    if (item.id.startsWith('f-')) {
      navigate('/apresentacoes');
      return;
    }
    navigate(`/apresentacao/${item.id}`, {
      state: { capa_url: item.capa_url, titulo: item.titulo },
    });
  };

  return (
    <section aria-label="Linha do tempo de apresentações" className="flex flex-col gap-3 pt-6 pb-2">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <h4 className="font-display text-[13px] sm:text-sm font-bold tracking-wider text-white/90 uppercase">
            Linha do tempo recente
          </h4>
          <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
            • Apresentações
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {itens.length > 0 && (
            <span className="text-[11px] text-muted-foreground font-medium">
              {itens.length} {itens.length === 1 ? 'aula' : 'aulas'}
            </span>
          )}
          <button
            type="button"
            onClick={handleOpenApresentacoes}
            className="flex items-center gap-1 text-[11.5px] sm:text-xs font-semibold text-primary hover:text-primary/85 transition-colors cursor-pointer group px-2 py-1 rounded-lg hover:bg-white/[0.04]"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Linha do Tempo Conectada */}
      <div className="relative border-l border-white/10 ml-4 sm:ml-5 pl-4 sm:pl-5 space-y-3">
        {itens.map((item, idx) => {
          const pal = getAreaThemePalette(item.area || 'direito-administrativo');
          const isFirst = idx === 0;

          return (
            <div key={item.id} className="relative group">
              {/* Nó / Ponto da Linha do Tempo */}
              <div
                className={cn(
                  "absolute -left-[21px] sm:-left-[25px] top-[24px] w-2.5 h-2.5 rounded-full transition-all duration-300 group-hover:scale-125",
                  isFirst ? "bg-primary" : "bg-white/20"
                )}
                style={{
                  backgroundColor: isFirst ? pal.primary : undefined,
                  boxShadow: isFirst ? `0 0 0 4px ${pal.primary}25, 0 0 10px ${pal.primary}` : undefined,
                }}
              />

              {/* Card da Apresentação com Capa e Setinha */}
              <div
                onClick={() => handleOpenItem(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenItem(item);
                  }
                }}
                className="p-3 sm:p-3.5 rounded-2xl bg-[#1F1F23]/80 hover:bg-[#28282E] border border-white/5 hover:border-white/15 transition-all cursor-pointer flex items-center gap-3 sm:gap-4 active:scale-[0.99] shadow-sm group-hover:shadow-md"
              >
                {/* Capa da Apresentação (Thumbnail 16:9) */}
                <div className="w-20 h-[52px] sm:w-24 sm:h-[62px] rounded-xl overflow-hidden shrink-0 relative bg-black/60 border border-white/10 shadow-inner">
                  <PrimeImage
                    src={item.capa_url}
                    alt={item.titulo}
                    aspectRatio="16/9"
                    targetWidth={200}
                    priority={idx === 0}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    fallbackIcon={<Presentation className="w-5 h-5 text-primary" />}
                  />
                  {/* Badge sutil de reprodução / slides */}
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                      <Play className="w-3 h-3 ml-0.5 fill-white" />
                    </div>
                  </div>
                </div>

                {/* Conteúdo Textual & Metadados */}
                <div className="flex flex-col min-w-0 flex-1 pr-1">
                  <div className="flex items-center gap-1.5 leading-none mb-1">
                    <span
                      className="text-[10.5px] font-bold tracking-wider uppercase truncate max-w-[140px] sm:max-w-[200px]"
                      style={{ color: pal.primary }}
                    >
                      {item.area}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                    <span className="text-[10px] text-muted-foreground/70 font-medium shrink-0">
                      {item.total_slides} slides
                    </span>
                  </div>

                  <h5 className="text-[12.5px] sm:text-[13.5px] font-bold text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-snug font-display uppercase tracking-wide">
                    {item.titulo}
                  </h5>

                  {/* Mini barra de progresso visual */}
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1.5 max-w-[160px] sm:max-w-[220px]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(8, item.progresso ?? 0)}%`,
                        backgroundColor: pal.primary,
                      }}
                    />
                  </div>
                </div>

                {/* Setinha para o lado indicando lista/navegação */}
                <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.03] group-hover:bg-white/[0.08] transition-all">
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão Inferior 'Ver todas as apresentações' */}
      <button
        type="button"
        onClick={handleOpenApresentacoes}
        className="w-full mt-2 py-3 px-4 rounded-xl bg-[#252528] hover:bg-[#2F2F33] border border-white/5 hover:border-white/10 text-[12px] sm:text-[13px] font-medium text-white/80 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99] group shadow-sm"
      >
        <Presentation className="w-4 h-4 text-primary shrink-0" />
        <span>Ver catálogo completo de Apresentações</span>
        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
      </button>
    </section>
  );
};

export default memo(HomeApresentacoesTimeline);
