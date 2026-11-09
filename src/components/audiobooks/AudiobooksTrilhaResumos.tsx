import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Check,
  Headphones,
  Clock,
  Search,
  X,
  Volume2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';
import {
  AUDIOBOOKS_CATALOGO,
  AudiobookLivro,
} from '@/data/audiobooksCatalogo';
import {
  hasResumoDisponivel,
  getResumoForLivro,
  AUDIOBOOKS_RESUMOS_MAP,
} from '@/data/audiobooksResumosMap';
import { GalaxyBackground } from '@/components/questoes/GalaxyBackground';
import { assetUrl } from '@/lib/assetUrl';

// ── MAPEAMENTO DAS 42 CAPAS LOCAIS BUNDLED (0MS LATÊNCIA, ZERO TELA PRETA) ──
const AUDIOBOOK_COVER_FILES: Record<string, string> = {
  '1984': '1984_manual.jpg',
  'a-arte-da-guerra': 'a_arte_da_guerra_manual.jpg',
  'a-era-dos-direitos': 'a_era_dos_direitos_manual.jpg',
  'a-estrada-para-o-carater': 'fundamentos-da-lei.webp',
  'a-luta-pelo-direito': 'a_luta_pelo_direito_manual.jpg',
  'a-meta': 'a_meta_um_processo_de_melhoria_continua_manual.jpg',
  'a-republica': 'a_republica_manual.jpg',
  'a-riqueza-das-nacoes': 'a_riqueza_das_nacoes.jpg',
  'a-teoria-das-formas-de-governo': 'a_teoria_das_formas_de_governo_manual.jpg',
  'acesso-a-justica': 'acesso_a_justica_manual.jpg',
  'admiravel-mundo-novo': 'cp_artigos_v2.webp',
  'as-21-irrefutaveis-leis-da-lideranca': 'estrutura-do-estado.webp',
  'blink': 'historia-da-legislacao.webp',
  'comece-pelo-porque': 'hero-advogados-tribunal.webp',
  'como-as-democracias-morrem': 'como_as_democracias_morrem_manual.jpg',
  'comunicacao-nao-violenta': 'fundamentos-da-lei.webp',
  'dos-delitos-e-das-penas': 'dos_delitos_e_das_penas_manual.jpg',
  'eles-os-juizes-vistos-por-nos-os-advogados': 'eles_os_juizes_vistos_por_nos_os_advogados_manual.jpg',
  'etica-a-nicomaco': 'etica_a_nicomaco_manual.jpg',
  'filosofia-do-direito': 'filosofia_do_direito.jpg',
  'introducao-ao-estudo-do-direito': 'introducao_ao_estudo_do_direito.jpg',
  'justica': 'justica_o_que_e_fazer_a_coisa_certa_manual.jpg',
  'licoes-preliminares-de-direito': 'licoes_preliminares_de_direito.jpg',
  'o-advogado-do-diabo': 'o_advogado_do_diabo.jpg',
  'o-caso-dos-exploradores-de-cavernas': 'o_caso_dos_exploradores_de_cavernas_manual.jpg',
  'o-caso-dos-irmaos-naves': 'vademecum-judge.webp',
  'o-contrato-social': 'o_contrato_social_manual.jpg',
  'o-espirito-das-leis': 'o_espirito_das_leis_manual.jpg',
  'o-futuro-da-democracia': 'o_futuro_da_democracia_manual.jpg',
  'o-leviata': 'o_leviata_manual.jpg',
  'o-monge-e-o-executivo': 'o_monge_e_o_executivo_manual.jpg',
  'o-mundo-assombrado-pelos-demonios': 'o_mundo_assombrado_pelos_demonios_manual.jpg',
  'o-mundo-de-sofia': 'o_mundo_de_sofia_manual.jpg',
  'o-principe': 'o_principe_manual.jpg',
  'o-processo': 'o_processo_manual.jpg',
  'o-que-e-direito': 'o_que_e_direito_primeiros_passos_manual.jpg',
  'o-ultimo-dia-de-um-condenado': 'o_ultimo_dia_de_um_condenado_manual.jpg',
  'os-7-habitos-das-pessoas-altamente-eficazes': 'socrates-themis-hero.webp',
  'sobre-a-liberdade': 'sobre_a_liberdade_manual.jpg',
  'teoria-pura-do-direito': 'teoria_pura_do_direito_manual.jpg',
  'vigiar-e-punir': 'vigiar_e_punir_nascimento_da_prisao_manual.jpg',
  'virando-a-propria-mesa': 'virando_a_propria_mesa_manual.jpg',
};

function resolveAudiobookCover(slug: string, remoteUrl?: string): string {
  const filename = AUDIOBOOK_COVER_FILES[slug];
  if (filename) {
    const localBundled = assetUrl(filename);
    if (localBundled) return localBundled;
  }
  if (remoteUrl && /^https?:\/\//i.test(remoteUrl)) {
    return assetUrl(remoteUrl);
  }
  return assetUrl('fundamentos-da-lei.webp');
}

export interface TrilhaResumoItem {
  livro: AudiobookLivro;
  slug: string;
  numero: number;
  badgeLabel: string;
  duracao: string;
  descricao: string;
  coverImage: string;
  isConcluido: boolean;
  isEmAndamento: boolean;
}

interface AudiobooksTrilhaResumosProps {
  onPlayResumo: (livro: AudiobookLivro, capituloIndex?: number) => void;
  onSelectLivro?: (livro: AudiobookLivro) => void;
}

export const AudiobooksTrilhaResumos: React.FC<AudiobooksTrilhaResumosProps> = ({
  onPlayResumo,
  onSelectLivro,
}) => {
  const [busca, setBusca] = useState('');
  const [livroSelecionado, setLivroSelecionado] = useState<TrilhaResumoItem | null>(null);

  // Armazena e lê progresso do usuário no Supabase / local
  const [lidosManual, setLidosManual] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('audiobooks_resumos_concluidos');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleConcluido = useCallback((slug: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    haptic.impact();
    setLidosManual((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      try {
        localStorage.setItem('audiobooks_resumos_concluidos', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);

  // Monta a lista completa de obras da trilha
  const livrosTrilha = useMemo<TrilhaResumoItem[]>(() => {
    const list: TrilhaResumoItem[] = [];
    const handledSlugs = new Set<string>();

    // 1. Livros do catálogo oficial que possuem resumo
    AUDIOBOOKS_CATALOGO.forEach((livro) => {
      if (hasResumoDisponivel(livro)) {
        const resumoInfo = getResumoForLivro(livro);
        const slug = resumoInfo?.slug || livro.id;
        if (!handledSlugs.has(slug)) {
          handledSlugs.add(slug);
          const num = list.length + 1;
          const coverImage = resolveAudiobookCover(slug, livro.capaUrl);
          const isConcluido = lidosManual.has(slug);

          list.push({
            livro,
            slug,
            numero: num,
            badgeLabel: `OBRA ${String(num).padStart(2, '0')}`,
            duracao: resumoInfo?.duracaoFormatada || livro.duracaoTotalFormatada || '~35 min',
            descricao: resumoInfo?.descricao || livro.descricao || 'Resumo analítico aprofundado.',
            coverImage,
            isConcluido,
            isEmAndamento: false,
          });
        }
      }
    });

    // 2. Entradas do mapa geral para completar as 42 obras clássicas
    Object.entries(AUDIOBOOKS_RESUMOS_MAP).forEach(([slug, info]) => {
      if (!handledSlugs.has(slug)) {
        handledSlugs.add(slug);
        const num = list.length + 1;
        const coverImage = resolveAudiobookCover(slug);
        const isConcluido = lidosManual.has(slug);

        const virtualLivro: AudiobookLivro = {
          id: slug,
          titulo: info.titulo,
          autor: info.autor,
          capaUrl: coverImage,
          ano: 2024,
          status: 'disponivel',
          descricao: info.descricao || 'Resumo analítico aprofundado.',
          duracaoTotalFormatada: info.duracaoFormatada || '~35 min',
          totalCapitulos: info.capitulos?.length || 1,
          capitulos: [],
          resumoAudioUrl: info.audioUrl,
          resumoSrtUrl: info.srtUrl,
          resumoDuracaoFormatada: info.duracaoFormatada || '~35 min',
        };

        list.push({
          livro: virtualLivro,
          slug,
          numero: num,
          badgeLabel: `OBRA ${String(num).padStart(2, '0')}`,
          duracao: info.duracaoFormatada || '~35 min',
          descricao: info.descricao || 'Resumo analítico aprofundado.',
          coverImage,
          isConcluido,
          isEmAndamento: false,
        });
      }
    });

    // Determina o nó ativo ("isEmAndamento"): a primeira obra não concluída
    const primeiroIncompletoIndex = list.findIndex((item) => !item.isConcluido);
    if (primeiroIncompletoIndex !== -1) {
      list[primeiroIncompletoIndex].isEmAndamento = true;
    } else if (list.length > 0) {
      list[0].isEmAndamento = true;
    }

    return list;
  }, [lidosManual]);

  // Filtro por busca
  const livrosFiltrados = useMemo(() => {
    if (!busca.trim()) return livrosTrilha;
    const q = busca.toLowerCase().trim();
    return livrosTrilha.filter(
      (item) =>
        item.livro.titulo.toLowerCase().includes(q) ||
        item.livro.autor.toLowerCase().includes(q)
    );
  }, [livrosTrilha, busca]);

  const totalObras = livrosTrilha.length;
  const concluidosCount = useMemo(() => {
    return livrosTrilha.filter((item) => item.isConcluido).length;
  }, [livrosTrilha]);

  const progressoPct = totalObras > 0 ? Math.round((concluidosCount / totalObras) * 100) : 0;

  // Alternância serpentina da Trilha (Padrão Questões / Druno)
  const getOffsetPercent = (index: number) => {
    const cycle = index % 4;
    switch (cycle) {
      case 0: return 50; // Centro
      case 1: return 28; // Esquerda
      case 2: return 72; // Direita
      case 3: return 50; // Centro
      default: return 50;
    }
  };

  const NODE_HEIGHT = 220;

  return (
    <div className="relative w-full flex flex-col min-h-full pb-24 select-none font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
      {/* ── FUNDO CÓSMICO GALÁXIA COM ESTRELAS (PADRÃO QUESTÕES) ── */}
      <GalaxyBackground />

      <div className="relative z-10 w-full max-w-[540px] md:max-w-[640px] mx-auto px-2 sm:px-6">
        {/* ── CARD SUPERIOR DE PROGRESSO DA TRILHA (ESTILO QUESTÕES) ── */}
        <div className="flex flex-col gap-2.5 mb-5 p-3.5 sm:p-4 rounded-2xl bg-[#17122B]/85 border border-white/10 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[#7C3AED]/20 text-[#DDD6FE] border border-[#7C3AED]/30 shadow-inner shrink-0">
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-[#DDD6FE]" />
              </div>
              <div className="min-w-0">
                <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-xs sm:text-sm font-bold uppercase tracking-wider text-white truncate">
                  Trilha de Resumos
                </p>
                <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[10px] sm:text-[11px] text-zinc-300">
                  {concluidosCount} de {totalObras} concluídos ({progressoPct}%)
                </p>
              </div>
            </div>

            {/* Campo de Busca Rápida Integrado */}
            <div className="relative shrink-0 w-36 xs:w-44 sm:w-48">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar obra..."
                className="w-full h-8 pl-8 pr-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-zinc-400 text-[11px] font-['Plus_Jakarta_Sans',system-ui,sans-serif] focus:outline-none focus:border-[#7C3AED] transition-colors"
              />
            </div>
          </div>

          {/* Barra de Progresso Oficial (Neon Roxo / Magenta) */}
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(progressoPct, 1)}%`,
                background: 'linear-gradient(90deg, #7C3AED, #A855F7, #C084FC)',
                boxShadow: '0 0 10px rgba(124, 58, 237, 0.8)',
              }}
            />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            TRILHA ESPACIAL COM LIVROS 3D SOBRE PEDESTAIS (PADRÃO QUESTÕES)
        ════════════════════════════════════════════════════════════════ */}
        <div className="relative w-full py-4 select-none">
          {/* Pista Central Serpenteante (SVG Road contínua que conecta os nós) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <filter id="road-glow-purple" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {livrosFiltrados.map((item, idx) => {
              if (idx === livrosFiltrados.length - 1) return null;
              const y1 = idx * NODE_HEIGHT + 110;
              const y2 = (idx + 1) * NODE_HEIGHT + 110;
              const x1 = getOffsetPercent(idx);
              const x2 = getOffsetPercent(idx + 1);
              const midY = (y1 + y2) / 2;

              return (
                <g key={`road-${item.slug}-${idx}`}>
                  {/* Pista Asfaltada Translúcida */}
                  <path
                    d={`M ${x1}% ${y1} C ${x1}% ${midY}, ${x2}% ${midY}, ${x2}% ${y2}`}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeWidth="36"
                    strokeLinecap="round"
                  />

                  {/* Linha Guia Pontilhada Central com Neon */}
                  <path
                    d={`M ${x1}% ${y1} C ${x1}% ${midY}, ${x2}% ${midY}, ${x2}% ${y2}`}
                    fill="none"
                    stroke={item.isConcluido ? "#10B981" : "#A855F7"}
                    strokeWidth="3"
                    strokeDasharray="8 8"
                    strokeLinecap="round"
                    filter="url(#road-glow-purple)"
                  />

                  {/* Pérola de Trilha no Ponto Médio */}
                  <circle
                    cx={`${(x1 + x2) / 2}%`}
                    cy={midY}
                    r={item.isConcluido ? "4" : "3"}
                    fill={item.isConcluido ? "#34D399" : "#C084FC"}
                    filter="url(#road-glow-purple)"
                  />
                </g>
              );
            })}
          </svg>

          {/* Nós da Trilha: Livros 3D em Pé sobre Pedestais Elípticos */}
          <div className="relative z-10 flex flex-col">
            {livrosFiltrados.map((item, idx) => {
              const xPercent = getOffsetPercent(idx);

              return (
                <div
                  key={item.slug}
                  className="w-full relative flex items-center justify-center"
                  style={{ height: `${NODE_HEIGHT}px` }}
                >
                  {/* Contêiner do Nó posicionado horizontalmente pela curva da estrada */}
                  <div
                    className="relative flex flex-col items-center cursor-pointer transition-transform duration-300 active:scale-95 group"
                    style={{
                      marginLeft: `${(xPercent - 50) * 1.55}%`,
                    }}
                    onClick={() => {
                      haptic.impact();
                      setLivroSelecionado(item);
                    }}
                  >
                    {/* ── BALÃO FLUTUANTE "CONTINUAR" / "OUVIR" (PADRÃO DRUNO) ── */}
                    {item.isEmAndamento && (
                      <div className="absolute -top-11 z-30 flex flex-col items-center animate-bounce">
                        <div className="px-3.5 py-1 rounded-full bg-[#1A0E2A] border-2 border-[#7C3AED] text-[#DDD6FE] font-['Plus_Jakarta_Sans',system-ui,sans-serif] font-black text-[11px] uppercase tracking-wider shadow-[0_0_20px_rgba(124,58,237,0.85)] backdrop-blur-md">
                          CONTINUAR
                        </div>
                        <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-[#7C3AED]" />
                      </div>
                    )}

                    {/* ── LIVRO 3D EM PÉ (COM PÁGINAS FÍSICAS E LOMBADA REALÍSTICA) ── */}
                    <div className="relative w-[90px] xs:w-[100px] sm:w-[112px] h-[130px] xs:h-[146px] sm:h-[162px] rounded-2xl z-20 transition-all duration-300 group-hover:-translate-y-2">
                      {/* Páginas Físicas na Lateral Direita */}
                      <div
                        className="absolute top-1.5 bottom-1.5 -right-2 w-2 rounded-r-[3px] bg-gradient-to-r from-amber-50 to-zinc-200 border-r border-t border-b border-black/40 shadow-sm pointer-events-none z-0"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
                        }}
                      />

                      {/* Lombada 3D na Lateral Esquerda */}
                      <div className="absolute top-0 bottom-0 left-0 w-2.5 rounded-l-2xl bg-gradient-to-r from-black/60 to-transparent pointer-events-none z-20" />

                      {/* Capa Principal com Borda Neon e Sombra Real */}
                      <div
                        className={cn(
                          'relative w-full h-full rounded-2xl overflow-hidden border transition-all duration-300 shadow-2xl flex flex-col justify-center items-center p-2',
                          item.isConcluido
                            ? 'border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.55)] ring-1 ring-emerald-300/40'
                            : item.isEmAndamento
                            ? 'border-[#A855F7] shadow-[0_0_28px_rgba(168,85,247,0.7)] ring-1 ring-[#C084FC]/60'
                            : 'border-white/15 bg-zinc-900/90 group-hover:border-purple-400/50'
                        )}
                        style={{ backgroundColor: '#130F24' }}
                      >
                        {/* Imagem de Capa do Livro (Full-bleed com fallback garantido) */}
                        <img
                          src={item.coverImage}
                          alt={item.livro.titulo}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = assetUrl('fundamentos-da-lei.webp');
                          }}
                          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Vinheta suave e reflexo diagonal */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-white/[0.18] pointer-events-none" />
                        <div className="absolute inset-0 rounded-2xl border border-white/10 pointer-events-none" />

                        {/* Botão Central: Checkmark / Play com Pulso */}
                        <div className="relative z-10 flex items-center justify-center">
                          {item.isConcluido ? (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.7)] border-2 border-emerald-200">
                              <Check className="w-5 h-5 stroke-[3]" />
                            </div>
                          ) : item.isEmAndamento ? (
                            <div className="relative flex items-center justify-center">
                              <div className="absolute inset-0 rounded-full bg-[#7C3AED] blur-md opacity-75 animate-ping scale-110" />
                              <div className="relative w-11 h-11 rounded-full bg-white text-[#7C3AED] flex items-center justify-center shadow-[0_0_22px_rgba(255,255,255,0.95)] border-2 border-white transition-transform duration-300 group-hover:scale-110">
                                <Play className="w-5 h-5 fill-current translate-x-0.5" />
                              </div>
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-black/60 text-white/90 border border-white/25 flex items-center justify-center backdrop-blur-md shadow-lg group-hover:scale-105 transition-transform">
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ── PEDESTAL 3D ELÍPTICO SOB O LIVRO (PADRÃO DRUNO) ── */}
                    <div className="relative -mt-4 w-32 xs:w-36 sm:w-40 h-8 xs:h-9 z-10 pointer-events-none flex items-center justify-center">
                      <div
                        className={cn(
                          'absolute inset-0 rounded-[50%] blur-md transition-all duration-300',
                          item.isConcluido
                            ? 'bg-emerald-500/50 scale-105'
                            : item.isEmAndamento
                            ? 'bg-[#7C3AED]/70 scale-110'
                            : 'bg-[#1E1635]/60'
                        )}
                      />
                      <div
                        className={cn(
                          'relative w-full h-full rounded-[50%] border transition-all duration-300 shadow-xl overflow-hidden flex items-center justify-center',
                          item.isConcluido
                            ? 'bg-gradient-to-b from-emerald-500 via-emerald-700 to-emerald-950 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                            : item.isEmAndamento
                            ? 'bg-gradient-to-b from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] border-[#DDD6FE] shadow-[0_0_30px_rgba(124,58,237,0.85)]'
                            : 'bg-gradient-to-b from-[#251E3D] via-[#1B152F] to-[#0E0B19] border-white/10 shadow-lg'
                        )}
                      >
                        <div className="w-[84%] h-[74%] rounded-[50%] border border-white/20 bg-black/10" />
                      </div>
                    </div>

                    {/* ── RÓTULO ABAIXO DO PEDESTAL (PADRÃO PLUS JAKARTA SANS) ── */}
                    <div className="mt-2 text-center max-w-[155px] sm:max-w-[180px] space-y-1 flex flex-col items-center">
                      <span
                        className={cn(
                          "font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-colors inline-block",
                          item.isConcluido
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : item.isEmAndamento
                            ? 'bg-[#7C3AED]/25 text-[#DDD6FE] border-[#8B5CF6]/40 shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                            : 'bg-white/5 text-zinc-400 border-white/10'
                        )}
                      >
                        {item.badgeLabel}
                      </span>

                      <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[12.5px] sm:text-[13.5px] font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-200 transition-colors drop-shadow-sm px-1">
                        {item.livro.titulo}
                      </p>

                      <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-medium text-zinc-400 font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
                        {item.isConcluido ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Concluído
                          </span>
                        ) : (
                          <span className="truncate">{item.duracao} • {item.livro.autor}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {livrosFiltrados.length === 0 && (
              <div className="py-16 text-center text-zinc-400 text-xs font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
                Nenhuma obra encontrada na trilha.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MODAL DE DETALHES DO RESUMO AO TOCAR NA TRILHA (PADRÃO DRUNO)
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {livroSelecionado && (
          <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
            onClick={() => setLivroSelecionado(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#161228] border border-white/15 p-5 sm:p-6 shadow-2xl space-y-4 font-['Plus_Jakarta_Sans',system-ui,sans-serif]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                {/* Capa 3D Miniatura */}
                <div className="relative w-20 h-28 rounded-xl overflow-hidden shadow-xl border border-white/15 shrink-0 bg-black/60">
                  <img
                    src={livroSelecionado.coverImage}
                    alt={livroSelecionado.livro.titulo}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = assetUrl('fundamentos-da-lei.webp');
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Título e Autor */}
                <div className="min-w-0 flex-1">
                  <span className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-[10px] font-extrabold uppercase tracking-wider text-purple-300 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 inline-block mb-1">
                    {livroSelecionado.badgeLabel}
                  </span>
                  <h3 className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-base font-bold text-white leading-tight">
                    {livroSelecionado.livro.titulo}
                  </h3>
                  <p className="font-['Plus_Jakarta_Sans',system-ui,sans-serif] text-xs text-zinc-400 mt-0.5">
                    {livroSelecionado.livro.autor}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-300" />
                      {livroSelecionado.duracao}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px] font-semibold flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-emerald-400" />
                      Áudio + SRT
                    </span>
                  </div>
                </div>

                {/* Botão Fechar */}
                <button
                  type="button"
                  onClick={() => setLivroSelecionado(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Descrição Analítica */}
              <p className="text-xs text-zinc-300 leading-relaxed bg-black/30 p-3 rounded-2xl border border-white/5 font-['Plus_Jakarta_Sans',system-ui,sans-serif]">
                {livroSelecionado.descricao}
              </p>

              {/* Botões de Ação */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    onPlayResumo(livroSelecionado.livro);
                    setLivroSelecionado(null);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] text-white font-['Plus_Jakarta_Sans',system-ui,sans-serif] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(124,58,237,0.65)] hover:shadow-[0_0_32px_rgba(124,58,237,0.85)] active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Ouvir Resumo Agora
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toggleConcluido(livroSelecionado.slug);
                    setLivroSelecionado((prev) =>
                      prev ? { ...prev, isConcluido: !prev.isConcluido } : null
                    );
                  }}
                  className={cn(
                    "w-full py-2.5 px-4 rounded-xl border text-xs font-['Plus_Jakarta_Sans',system-ui,sans-serif] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
                    livroSelecionado.isConcluido
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"
                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                  )}
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  {livroSelecionado.isConcluido
                    ? 'Concluído (Toque para reabrir)'
                    : 'Marcar como Concluído'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
