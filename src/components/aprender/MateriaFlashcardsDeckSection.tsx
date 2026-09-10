import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Layers, ArrowRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { areaIconFor, getAreaThemePalette, hexToRgb } from '@/lib/areasDireitoIcons';
import type { ModuloItem } from '@/hooks/useAprenderAreaModulesMap';
import type { AprenderArea } from '@/types/aprender';
import { cn } from '@/lib/utils';

interface MateriaFlashcardsDeckSectionProps {
  area: AprenderArea;
  modulos: ModuloItem[];
  overrideTotal: number;
  overrideConcluidas: number;
  overridePct: number;
  onOpenArea: () => void;
  onOpenModulo?: (modulo: ModuloItem | { id: string; titulo: string }) => void;
}

/** Tópicos curriculares canônicos para garantir que toda matéria tenha um deck completo (6 a 7 cards em leque) */
export const CANONICAL_AREA_TOPICS: Record<string, string[]> = {
  'direito-ambiental': [
    'Direito dos Desastres',
    'Unidades de Conservação',
    'Responsabilidade Ambiental',
    'Áreas de Preservação Permanente e Reserva Legal',
    'Licenciamento Ambiental',
    'Tópicos em Direito Ambiental',
    'Introdução ao Direito Ambiental',
  ],
  'direito-administrativo': [
    'Processo Administrativo',
    'Administração Pública',
    'Improbidade Administrativa',
    'Agentes Públicos',
    'Poderes Administrativos',
    'Atos Administrativos',
    'Licitações e Contratos',
  ],
  'direito-civil': [
    'Pessoas no Código Civil',
    'Direito das Sucessões',
    'Direito Notarial',
    'Direito do Consumidor',
    'Registro de Imóveis',
    'Negócio Jurídico',
    'Direito de Propriedade',
    'Casamento e União Estável',
  ],
  'direito-constitucional': [
    'Poder Constituinte',
    'Funções Essenciais à Justiça',
    'Ministério Público',
    'Direitos e Garantias Fundamentais',
    'Organização do Estado',
    'Controle de Constitucionalidade',
    'Ordem Social e Econômica',
  ],
  'direito-penal': [
    'Crimes Contra a Pessoa',
    'Crimes Contra o Patrimônio',
    'Crimes Contra a Dignidade Sexual',
    'Teoria Geral do Crime',
    'Aplicação da Lei Penal',
    'Penas e Medidas de Segurança',
    'Extinção da Punibilidade',
  ],
  'direito-processual-civil': [
    'Normas Fundamentais & Competência',
    'Petição Inicial & Tutelas Provisórias',
    'Audiência e Fase Instrutória',
    'Sentença e Coisa Julgada',
    'Sistema Recursal (Apelação, Agravos)',
    'Execução & Cumprimento de Sentença',
  ],
  'direito-processual-penal': [
    'Inquérito Policial & Investigação',
    'Ação Penal Pública e Privada',
    'Competência e Jurisdição Penal',
    'Provas no Processo Penal',
    'Prisão Preventiva, Cautelares e Liberdade',
    'Recursos Criminais & Habeas Corpus',
  ],
  'direito-tributario': [
    'Competência Tributária',
    'Processo Tributário',
    'Ação Declaratória Tributária',
    'Sistema Tributário Nacional',
    'Princípios e Imunidades',
    'Crédito e Obrigação Tributária',
    'Execução Fiscal',
  ],
  'direito-do-trabalho': [
    'Organização Sindical',
    'LGPD nas Relações Trabalhistas',
    'Reforma Trabalhista',
    'Contrato de Trabalho',
    'Jornada e Horas Extras',
    'Remuneração e Salário',
    'Extinção do Contrato',
  ],
  'direito-empresarial': [
    'Teoria da Empresa & Empresário',
    'Sociedades Limitadas e Anônimas (S/A)',
    'Títulos de Crédito & Contratos Empresariais',
    'Recuperação Judicial e Falência',
    'Propriedade Industrial & Marcas',
    'Direito Societário & Governança',
  ],
  'direitos-humanos': [
    'Teoria Geral dos Direitos Humanos',
    'Declaração Universal (DUDH) de 1948',
    'Sistema Interamericano & Pacto de San José',
    'Proteção Constitucional dos Direitos',
    'Jurisprudência da Corte IDH',
    'Grupos Vulneráveis e Minorias',
  ],
  'direito-previdenciario': [
    'Seguridade Social: Princípios e Fontes',
    'Regime Geral de Previdência Social (RGPS)',
    'Segurados, Dependentes e Filiação',
    'Benefícios e Aposentadorias',
    'Pensão por Morte e Auxílios',
    'Custeio Previdenciário e Reforma',
  ],
  'direito-financeiro': [
    'Atividade Financeira do Estado',
    'Orçamento Público: PPA, LDO e LOA',
    'Lei de Responsabilidade Fiscal (LRF)',
    'Receitas e Despesas Públicas',
    'Dívida Pública e Precatórios',
    'Controle da Execução Orçamentária',
  ],
  'direito-desportivo': [
    'Princípios do Direito Desportivo',
    'Lei Pelé e Lei Geral do Esporte',
    'Justiça Desportiva e STJD',
    'Contrato de Trabalho do Atleta',
    'Doping e Controle Antidopagem',
    'Sociedade Anônima do Futebol (SAF)',
  ],
  'direito-processual-do-trabalho': [
    'Princípios e Competência da JT',
    'Petição Inicial e Procedimentos',
    'Audiência Trabalhista e Provas',
    'Sistema Recursal Trabalhista',
    'Execução Trabalhista',
    'Processos Coletivos de Trabalho',
  ],
  'direito-concorrencial': [
    'Introdução ao Direito Concorrencial',
    'Estrutura do Sistema Brasileiro (CADE)',
    'Infrações contra a Ordem Econômica',
    'Controle de Concentrações Empresariais',
    'Acordos de Leniência e TCC',
    'Análise de Mercado Relevante',
  ],
  'direito-urbanistico': [
    'Princípios do Direito Urbanístico',
    'Estatuto da Cidade e Plano Diretor',
    'Instrumentos de Política Urbana',
    'Regularização Fundiária (REURB)',
    'Parcelamento do Solo Urbano',
    'Função Social da Propriedade Urbana',
  ],
  'direito-internacional-publico': [
    'Fontes do DIP e Tratados Internacionais',
    'Sujeitos de Direito Internacional',
    'Imunidade de Jurisdição e Soberania',
    'Solução Pacífica de Controvérsias',
    'Organizações Internacionais e ONU',
    'Direito Internacional Humanitário',
  ],
  'direito-internacional-privado': [
    'Introdução e Objeto do DIPRI',
    'Elementos de Conexão e LINDB',
    'Competência Internacional',
    'Homologação de Decisão Estrangeira',
    'Cooperação Jurídica Internacional',
    'Contratos Internacionais e Arbitragem',
  ],
  'lei-penal-especial': [
    'Lei de Drogas (Lei 11.343/06)',
    'Crimes Hediondos (Lei 8.072/90)',
    'Estatuto do Desarmamento',
    'Lei Maria da Penha (Lei 11.340/06)',
    'Abuso de Autoridade (Lei 13.869/19)',
    'Organizações Criminosas (Lei 12.850/13)',
  ],
  'portugues': [
    'Compreensão e Interpretação Textual',
    'Concordância Verbal e Nominal',
    'Regência e Emprego da Crase',
    'Pontuação e Coesão Textual',
    'Ortografia e Acentuação Gráfica',
    'Redação Oficial',
  ],
  'pratica-profissional': [
    'Ética e Estatuto da Advocacia',
    'Prerrogativas da Advocacia',
    'Honorários Advocatícios',
    'Elaboração de Peças Processuais',
    'Técnicas de Audiência',
    'Gestão e Prática Jurídica',
  ],
  'revisao-oab': [
    'Ética e Estatuto da OAB',
    'Direito Constitucional Estratégico',
    'Direito Civil & Processo Civil',
    'Direito Penal & Processo Penal',
    'Direito do Trabalho & Administrativo',
    'Resolução de Questões Chave',
  ],
  'teoria-e-filosofia-do-direito': [
    'Conceito de Direito e Justiça',
    'Jusnaturalismo e Positivismo Jurídico',
    'Teoria Pura do Direito (Kelsen)',
    'Pós-positivismo e Teoria dos Princípios',
    'Hermenêutica e Interpretação Jurídica',
    'Moral, Eficácia e Validade da Norma',
  ],
};

/** Posição visual em leque (deck 3D) com profundidade e perspectiva */
const getSlot = (diff: number) => {
  switch (diff) {
    case 0:
      return { x: 0, y: 0, rotate: 0, scale: 1.05, opacity: 1, z: 50 };
    case 1:
      return { x: 68, y: 8, rotate: 8, scale: 0.9, opacity: 0.9, z: 40 };
    case 2:
      return { x: 120, y: 18, rotate: 15, scale: 0.76, opacity: 0.65, z: 30 };
    case 3:
      return { x: 158, y: 28, rotate: 22, scale: 0.65, opacity: 0.35, z: 20 };
    case -1:
      return { x: -68, y: 8, rotate: -8, scale: 0.9, opacity: 0.9, z: 40 };
    case -2:
      return { x: -120, y: 18, rotate: -15, scale: 0.76, opacity: 0.65, z: 30 };
    case -3:
      return { x: -158, y: 28, rotate: -22, scale: 0.65, opacity: 0.35, z: 20 };
    default:
      if (diff > 0) return { x: 180, y: 35, rotate: 26, scale: 0.55, opacity: 0, z: 10 };
      return { x: -180, y: 35, rotate: -26, scale: 0.55, opacity: 0, z: 10 };
  }
};

export const MateriaFlashcardsDeckSection: React.FC<MateriaFlashcardsDeckSectionProps> = memo(({
  area,
  modulos,
  overrideTotal,
  overrideConcluidas,
  overridePct,
  onOpenArea,
}) => {
  const [ativo, setAtivo] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);

  const iconInfo = useMemo(() => areaIconFor(area.slug), [area.slug]);
  const AreaIcon = iconInfo?.Icon;
  const accentColor = iconInfo?.color || '#10b981';
  const palette = useMemo(() => getAreaThemePalette(area.slug || area.nome), [area.slug, area.nome]);

  // Nome essencial da matéria para a tag do topo (ex: "Administrativo", "Penal", "Civil")
  const nomeMateriaTag = useMemo(() => {
    if (!area?.nome) return '';
    return area.nome
      .replace(/^Direito\s+(do\s+|da\s+|de\s+)?/i, '')
      .replace(/^Direitos\s+/i, '')
      .trim();
  }, [area?.nome]);

  const { r, g, b } = useMemo(() => hexToRgb(palette.primary), [palette.primary]);

  // Botão na mesma paleta do fundo do card, em tom um pouco mais escuro para integrar perfeitamente ao design
  const enterButtonBg = useMemo(() => {
    const topR = Math.round(r * 0.32);
    const topG = Math.round(g * 0.32);
    const topB = Math.round(b * 0.32);
    const btmR = Math.round(r * 0.14);
    const btmG = Math.round(g * 0.14);
    const btmB = Math.round(b * 0.14);
    return `linear-gradient(180deg, rgba(${topR}, ${topG}, ${topB}, 0.95) 0%, rgba(${btmR}, ${btmG}, ${btmB}, 0.98) 100%)`;
  }, [r, g, b]);

  // Lista de cards/tópicos que compõem o deck desta matéria (garante sempre 6 a 7 cards em leque)
  const deckCards = useMemo(() => {
    const list: Array<{ id: string; titulo: string; resumo?: string | null; ordem: number; moduloRef?: any }> = [];

    // 1. Módulos reais já cadastrados na matéria
    if (modulos && modulos.length > 0) {
      modulos.forEach((m, idx) => {
        list.push({
          id: m.id,
          titulo: m.titulo,
          resumo: m.resumo,
          ordem: idx + 1,
          moduloRef: m,
        });
      });
    }

    // 2. Se tiver menos de 6 cards, complementa com tópicos canônicos para garantir o deck em leque
    if (list.length < 6) {
      const canonical = CANONICAL_AREA_TOPICS[area.slug] || [
        `Fundamentos de ${area.nome}`,
        `Princípios & Regras Gerais`,
        `Legislação & Normas Aplicadas`,
        `Jurisprudência & Súmulas`,
        `Casos Práticos & OAB`,
        `Temas Avançados & Atualizações`,
      ];

      const existingTitles = new Set(list.map((c) => c.titulo.toLowerCase().trim()));
      canonical.forEach((title) => {
        if (list.length < 7 && !existingTitles.has(title.toLowerCase().trim())) {
          list.push({
            id: `${area.id}-topic-${list.length + 1}`,
            titulo: title,
            resumo: `Trilha de ${area.nome}`,
            ordem: list.length + 1,
          });
        }
      });
    }

    return list;
  }, [modulos, area]);

  const total = deckCards.length;

  // Carrossel com sequência animada automática de cards (um por um)
  useEffect(() => {
    if (isDragging || isHovered || total <= 1) return;

    const interval = setInterval(() => {
      setAtivo((prev) => (prev + 1) % total);
    }, 3800);

    return () => clearInterval(interval);
  }, [isDragging, isHovered, total]);

  const handlePrev = useCallback(() => {
    try { haptic.selection(); } catch {}
    setAtivo((i) => (i - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    try { haptic.selection(); } catch {}
    setAtivo((i) => (i + 1) % total);
  }, [total]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      isSwipingRef.current = false;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;
    if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwipingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = (e.changedTouches[0]?.clientX || 0) - touchStartRef.current.x;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (isSwipingRef.current || Math.abs(deltaX) > 24) {
      const velocityX = deltaX / Math.max(deltaTime, 1);
      if (deltaX < -22 || velocityX < -0.28) {
        handleNext();
      } else if (deltaX > 22 || velocityX > 0.28) {
        handlePrev();
      }
      setIsDragging(true);
      setTimeout(() => setIsDragging(false), 120);
    } else {
      setIsDragging(false);
    }
  }, [handleNext, handlePrev]);

  const activeCard = deckCards[ativo] || deckCards[0];

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full space-y-2.5 sm:space-y-3 relative py-2 border-b border-white/[0.08] last:border-b-0"
    >
      {/* Cabeçalho da Matéria (clicar vai direto para a lista) */}
      <div 
        onClick={() => {
          try { haptic.selection(); } catch {}
          onOpenArea();
        }}
        className="flex items-center justify-between gap-3 relative z-10 cursor-pointer group px-1"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div 
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm"
            style={{ backgroundColor: `${accentColor}18` }}
          >
            {AreaIcon ? (
              <AreaIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: accentColor }} strokeWidth={2} />
            ) : (
              <Layers className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: accentColor }} />
            )}
          </div>
          <div className="min-w-0">
            <h3 
              className="text-base sm:text-[17px] font-bold text-white truncate transition-colors group-hover:text-emerald-400"
              style={{
                fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                letterSpacing: '0.025em',
              }}
            >
              {area.nome}
            </h3>
            <p className="text-xs text-muted-foreground">
              {overrideTotal > 0 ? `${overrideTotal.toLocaleString('pt-BR')} flashcards` : 'Trilha disponível'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3D Fanned Deck de Flashcards (sem setas, sem fundo de card) ── */}
      <div className="relative w-full pt-1 pb-1 flex flex-col items-center select-none overflow-x-hidden">
        <div className="relative flex items-center justify-center w-full max-w-[340px] sm:max-w-[400px] h-[225px] sm:h-[245px]">
          {/* Deck de cards interativo */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_, info) => {
              setTimeout(() => setIsDragging(false), 120);
              const isFar = Math.abs(info.offset.x) > 90;
              const isFast = Math.abs(info.velocity.x) > 450;
              const step = isFar && isFast ? 2 : 1;

              if (info.offset.x < -20 || info.velocity.x < -150) {
                setAtivo((i) => (i + step) % total);
              } else if (info.offset.x > 20 || info.velocity.x > 150) {
                setAtivo((i) => (i - step + total) % total);
              }
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
          >
            {deckCards.map((card, i) => {
              let diff = (i - ativo) % total;
              if (diff > total / 2) diff -= total;
              if (diff < -total / 2) diff += total;

              const slot = getSlot(diff);
              const frente = diff === 0;

              if (Math.abs(diff) > 3) return null;

              return (
                <motion.div
                  key={card.id + i}
                  animate={{
                    x: slot.x,
                    y: slot.y,
                    rotate: slot.rotate,
                    scale: slot.scale,
                    opacity: slot.opacity,
                  }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  style={{ zIndex: slot.z }}
                  onClick={(e) => {
                    if (isDragging || isSwipingRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    // Clicar em qualquer card abre a lista da matéria automaticamente
                    try { haptic.impact(); } catch {}
                    onOpenArea();
                  }}
                  className="absolute cursor-pointer will-change-transform"
                >
                  {/* O Card Flashcard em si com identidade visual e paleta idêntica à tela interna */}
                  <div
                    className={cn(
                      "w-[140px] h-[190px] sm:w-[155px] sm:h-[210px] rounded-[22px] p-3.5 sm:p-4 flex flex-col justify-between select-none relative overflow-hidden transition-all duration-300",
                      frente
                        ? "border-2 border-white/40 shadow-2xl"
                        : "border border-white/20 shadow-black/70"
                    )}
                    style={{
                      background: palette.cardGradient,
                      boxShadow: frente
                        ? `${palette.shadow}, 0 20px 45px -10px rgba(0,0,0,0.85)`
                        : '0 10px 24px -5px rgba(0,0,0,0.65)',
                      filter: frente ? 'none' : 'brightness(0.72)',
                    }}
                  >
                    {/* Moldura Interna Chanfrada de Carta de Baralho */}
                    <div className="absolute inset-1 rounded-[16px] border border-white/15 pointer-events-none z-10" />

                    {/* Efeito de Brilho e Acabamento Laminado da Carta */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-10" />

                    {/* Marca d'água / Gravura da Deusa Têmis Vazada na Carta */}
                    <img
                      src="/images/gamificacao/deusa_temis_vazada.webp"
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="pointer-events-none absolute -right-2 -bottom-2 w-[105px] sm:w-[125px] h-[120px] sm:h-[140px] object-contain opacity-35 select-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)] z-0"
                    />

                    {/* Topo do Flashcard: Nome Essencial da Matéria sem 'Direito' (ex: 'Administrativo', 'Penal') */}
                    <div className="flex items-center justify-center w-full relative z-10">
                      <span className="text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md bg-black/45 text-white/95 border border-white/20 shadow-sm text-center leading-none">
                        {nomeMateriaTag}
                      </span>
                    </div>

                    {/* Centro do Flashcard: Título do Tópico sem negrito com tipografia jurídica */}
                    <div className="my-auto py-2 text-center relative z-10 px-0.5">
                      <h4 
                        className="text-xs sm:text-[13px] font-normal leading-snug text-white break-words line-clamp-4 drop-shadow-md"
                        style={{ fontFamily: "'Merriweather', 'Georgia', serif" }}
                      >
                        {card.titulo}
                      </h4>
                    </div>

                    {/* Rodapé do Flashcard: Botão Integrado à Paleta do Fundo em Tom Mais Escuro */}
                    <div className="relative z-10 pt-1.5 border-t border-white/15 flex items-center justify-center w-full">
                      {frente ? (
                        <div
                          style={{
                            background: enterButtonBg,
                            borderColor: 'rgba(255, 255, 255, 0.22)',
                            boxShadow: `0 6px 16px -2px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.18)`,
                          }}
                          className="w-full py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider border hover:brightness-125 active:scale-95 transition-all cursor-pointer select-none"
                        >
                          <span className="drop-shadow-sm">Entrar</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] text-white/95" />
                        </div>
                      ) : (
                        <div className="h-6 w-full" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ── Barra de Progresso Embaixo do Deck (conforme pedido) ── */}
      <div className="pt-2 pb-5 space-y-2 relative z-10 px-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-normal truncate max-w-[70%]">
            <strong className="text-white font-semibold">{activeCard?.titulo || area.nome}</strong>
            {overrideTotal > 0 && ` · ${overrideConcluidas}/${overrideTotal} concluídas`}
          </span>
          <span className="font-bold text-white shrink-0">
            {overridePct}%
          </span>
        </div>

        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full rounded-full transition-all duration-500 shadow-sm"
            style={{ 
              width: `${Math.max(overridePct, overrideConcluidas > 0 ? 5 : 0)}%`,
              backgroundColor: accentColor,
              boxShadow: `0 0 10px ${accentColor}60`,
            }}
          />
        </div>
      </div>
    </div>
  );
});

MateriaFlashcardsDeckSection.displayName = 'MateriaFlashcardsDeckSection';
export default MateriaFlashcardsDeckSection;
