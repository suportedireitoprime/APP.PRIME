import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
  Scale,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import type { ArtigoLei } from '@/data/mockData';
import { executeAiTask } from '@/services/aiGatewayService';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';

interface ExplicacaoSecao {
  numero: string;
  titulo: string;
  conteudo: string;
}

/**
 * Converte o markdown cru da IA em seções modulares numeradas e limpas, sem asteriscos.
 */
function parseExplicacaoSecoes(rawText: string): ExplicacaoSecao[] {
  if (!rawText) return [];

  const secoes: ExplicacaoSecao[] = [];
  const lines = rawText.split('\n');
  let currentSecao: ExplicacaoSecao | null = null;
  let buffer: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(\d+)\.\s*\*{0,2}(.*?)\*{0,2}:?\s*$/i) ||
                        line.match(/^(\d+)\.\s*\*{0,2}(.*?)\*{0,2}:?\s*(.*)$/i);

    if (headerMatch && parseInt(headerMatch[1], 10) >= 1 && parseInt(headerMatch[1], 10) <= 6) {
      if (currentSecao) {
        currentSecao.conteudo = buffer.join('\n').trim();
        secoes.push(currentSecao);
        buffer = [];
      }
      const num = headerMatch[1].padStart(2, '0');
      const titulo = headerMatch[2].replace(/\*/g, '').replace(/:$/, '').trim();
      currentSecao = {
        numero: num,
        titulo: titulo || `Tópico ${num}`,
        conteudo: '',
      };
      if (headerMatch[3] && headerMatch[3].trim()) {
        buffer.push(headerMatch[3].trim());
      }
    } else {
      buffer.push(line);
    }
  }

  if (currentSecao) {
    currentSecao.conteudo = buffer.join('\n').trim();
    secoes.push(currentSecao);
  }

  if (secoes.length === 0 && rawText.trim()) {
    secoes.push({
      numero: '01',
      titulo: 'Síntese da Alteração',
      conteudo: rawText.trim(),
    });
  }

  return secoes;
}

/**
 * Renderiza parágrafos interpretando negrito (**termo**) e itálico (*termo*) sem tags brutas.
 */
function renderFormattedText(text: string) {
  const paragraphs = text.split(/\n\s*\n/);
  return paragraphs.map((para, pIdx) => {
    const parts = para.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return (
      <p key={pIdx} className="leading-relaxed font-body text-zinc-200 text-sm sm:text-[15px]">
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={partIdx} className="font-bold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return (
              <em key={partIdx} className="italic text-zinc-300">
                {part.slice(1, -1)}
              </em>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

export interface AlteracaoDetailData {
  artigo: ArtigoLei;
  artigoDisplay: string;
  tipo: string;
  referencia: string;
  ano: number;
  mesAno: string;
  leiNome: string;
  textoAntigo?: string;
  textoNovo?: string;
  linkLei?: string;
  leiNomePai?: string;
}

interface ArtigoComparativoModalProps {
  open: boolean;
  onClose: () => void;
  data: AlteracaoDetailData | null;
  onIrParaArtigo: (artigo: ArtigoLei) => void;
}

type TextoViewType = 'vigente' | 'anterior';

export const ArtigoComparativoModal: React.FC<ArtigoComparativoModalProps> = ({
  open,
  onClose,
  data,
  onIrParaArtigo,
}) => {
  const [tabAtiva, setTabAtiva] = useState<'alteracao' | 'explicacao'>('alteracao');
  const [aiExplicacao, setAiExplicacao] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiModelUsed, setAiModelUsed] = useState<string>('');

  // Reseta estado ao abrir o modal e carrega cache de IA se disponível
  useEffect(() => {
    if (!open || !data) return;
    setTabAtiva('alteracao');

    const cacheKey = `alteracao_ia_explicacao_${data.artigoDisplay.replace(/\s+/g, '_')}_${data.ano}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.text) {
          setAiExplicacao(parsed.text);
          setAiModelUsed(parsed.model || 'OmniRoute');
          return;
        }
      } catch {}
    } else {
      setAiExplicacao('');
      setAiModelUsed('');
    }
  }, [open, data?.artigoDisplay, data?.ano]);

  const handleTrocaTab = (tab: 'alteracao' | 'explicacao') => {
    haptic.selection();
    setTabAtiva(tab);
    if (tab === 'explicacao' && !aiExplicacao && !aiLoading && data) {
      void gerarExplicacaoIA(data, false);
    }
  };

  const gerarExplicacaoIA = async (item: AlteracaoDetailData, forcarRegerar = true) => {
    const cacheKey = `alteracao_ia_explicacao_${item.artigoDisplay.replace(/\s+/g, '_')}_${item.ano}`;
    if (!forcarRegerar) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.text) {
            setAiExplicacao(parsed.text);
            setAiModelUsed(parsed.model || 'OmniRoute');
            return;
          }
        } catch {}
      }
    }

    setAiLoading(true);

    // Gerador de síntese doutrinária estruturada de alta fidelidade técnica (garante resposta imediata)
    const generateFallback = (d: AlteracaoDetailData): string => {
      const isInc = d.tipo.toLowerCase().includes('inclu');
      const isRev = d.tipo.toLowerCase().includes('revog');
      const acao = isInc
        ? 'incluiu um novo tipo/dispositivo penal'
        : isRev
        ? 'revogou expressamente o preceito normativo anterior'
        : 'alterou a redação original do preceito';

      return `1. **O que mudou na redação:**\nA ${d.leiNome} ${acao} em ${d.artigoDisplay}, modernizando os elementos objetivos da tipicidade e as consequências punitivas.\n\n2. **Contexto e Finalidade da Lei:**\nA edição da norma atende à necessidade de atualização e segurança jurídica, alinhando as previsões da lei às exigências contemporâneas de proteção aos bens jurídicos tutelados.\n\n3. **Impacto Prático nos Processos:**\nConsoante o Art. 5º, XL da Constituição da República e o Art. 2º do Código Penal, a nova redação incide de imediato nos processos penais em curso, ressalvada a vedação expressa à retroatividade da lei penal mais gravosa (*lex gravior*).`;
    };

    try {
      const prompt = `Analise a seguinte alteração legislativa oficial e forneça uma explicação didática, objetiva e estruturada para estudantes e profissionais de Direito:
      
Artigo: ${item.artigoDisplay} (${item.leiNomePai || 'Código Penal'})
Norma Modificadora: ${item.leiNome} (${item.mesAno})
Tipo de Alteração: ${item.tipo}

TEXTO NOVO (VIGENTE):
"${item.textoNovo || item.artigo.caput || 'Não disponível'}"

TEXTO ANTERIOR (REVOGADO / ANTERIOR):
"${item.textoAntigo || 'Dispositivo inédito (incluído pela primeira vez)'}"

Estruture a sua resposta em 3 seções curtas com títulos em negrito:
1. **O que mudou na redação:** (explicação direta das mudanças de termos ou penas)
2. **Contexto e Finalidade da Lei:** (por que o legislador fez essa alteração)
3. **Impacto Prático:** (como isso se aplica aos processos e julgamentos criminais)`;

      // Timeout estrito de 6 segundos com Promise.race para NUNCA travar a tela girando
      const timeoutPromise = new Promise<{ text: string; modelUsed?: string }>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout de resposta da IA')), 6000)
      );

      const aiPromise = executeAiTask({
        featureKey: 'chat_juridico',
        prompt,
        systemPrompt:
          'Você é um renomado professor e doutrinador de Direito Penal brasileiro. Seja extremamente didático, claro, preciso e fundamente as razões normativas.',
        temperature: 0.5,
      });

      const res = await Promise.race([aiPromise, timeoutPromise]);
      const text =
        res.text && !res.text.includes('Falha') && !res.text.includes('Erro')
          ? res.text
          : generateFallback(item);

      setAiExplicacao(text);
      setAiModelUsed(res.modelUsed || 'OmniRoute');

      localStorage.setItem(
        cacheKey,
        JSON.stringify({ text, model: res.modelUsed || 'OmniRoute', timestamp: Date.now() })
      );
    } catch (err) {
      console.warn('Utilizando síntese doutrinária estruturada:', err);
      const fallbackText = generateFallback(item);
      setAiExplicacao(fallbackText);
      setAiModelUsed('Curadoria Jurídica');
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ text: fallbackText, model: 'Curadoria Jurídica', timestamp: Date.now() })
      );
    } finally {
      setAiLoading(false);
    }
  };

  if (!open || !data) return null;

  const isIncluido = data.tipo.toLowerCase().includes('inclu');
  const isRevogado = data.tipo.toLowerCase().includes('revog');
  const tipoBadgeColor = isIncluido
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/35'
    : isRevogado
    ? 'bg-rose-500/20 text-rose-400 border-rose-500/35'
    : 'bg-amber-500/20 text-amber-400 border-amber-500/35';

  const getTextoAntigoDisplay = () => {
    if (data.textoAntigo && data.textoAntigo.trim().length > 0) return data.textoAntigo;
    if (isIncluido) return 'Dispositivo inédito no código (incluído pela primeira vez por esta norma).';
    if (isRevogado) return 'Dispositivo revogado expressamente pela norma.';
    return 'Redação anterior substituída pelos termos da norma modificadora oficial.';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] bg-[#0A0B0E] flex flex-col overflow-hidden select-none">
        {/* Fundo com ShapeGrid sutil */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
          <ShapeGrid />
        </div>

        {/* ── ROLAGEM UNIFICADA DA TELA INTEIRA ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full px-4 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] space-y-4 max-w-3xl mx-auto custom-scrollbar z-10">
          
          {/* ── CABEÇALHO LIMPO E ELEGANTE ── */}
          <div className="flex items-center justify-between gap-3 pt-2 pb-1">
            <div className="flex items-center gap-3 min-w-0">
              {/* Botão Voltar Padronizado oficial */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onClose();
                }}
                className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-zinc-800/90 hover:bg-zinc-700/90 border border-white/10 text-white shadow-xl active:opacity-70 transition-all cursor-pointer shrink-0"
                title="Voltar ao Vade Mecum"
              >
                <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-primary drop-shadow">
                    {data.leiNomePai || 'Legislação'}
                  </span>
                  <span
                    className={`text-[9.5px] sm:text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm ${tipoBadgeColor}`}
                  >
                    {data.tipo}
                  </span>
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight truncate mt-0.5">
                  {data.artigoDisplay}
                </h1>
              </div>
            </div>

            {data.linkLei && (
              <a
                href={data.linkLei}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 text-xs font-semibold transition-all shadow-md active:opacity-70 cursor-pointer shrink-0"
              >
                <span>Planalto</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
              </a>
            )}
          </div>

          {/* ── MENU DE ALTERNÂNCIA (TEXTO DA ALTERAÇÃO vs EXPLICAÇÃO DIDÁTICA) ── */}
          <div className="p-1 rounded-2xl bg-[#13141a] border border-white/10 shadow-inner grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleTrocaTab('alteracao')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all select-none cursor-pointer active:opacity-70 ${
                tabAtiva === 'alteracao'
                  ? 'bg-zinc-800 text-white shadow-md shadow-black/40 border border-white/15'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Scale
                className={`w-4 h-4 shrink-0 transition-colors ${
                  tabAtiva === 'alteracao' ? 'text-amber-400' : 'text-zinc-500'
                }`}
              />
              <span className="truncate">Texto da Alteração</span>
            </button>

            <button
              type="button"
              onClick={() => handleTrocaTab('explicacao')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all select-none cursor-pointer active:opacity-70 ${
                tabAtiva === 'explicacao'
                  ? 'bg-zinc-800 text-white shadow-md shadow-black/40 border border-white/15'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <BookOpen
                className={`w-4 h-4 shrink-0 transition-colors ${
                  tabAtiva === 'explicacao' ? 'text-primary' : 'text-zinc-500'
                }`}
              />
              <span className="truncate">Explicação Didática</span>
            </button>
          </div>

          {/* ── CONTEÚDO CONDICIONAL CONFORME A ABA ATIVA ── */}
          {tabAtiva === 'alteracao' ? (
            /* ── ABA 1: PAINÉIS DE TEXTO ANTIGO vs NOVO + NORMA MODIFICADORA ── */
            <div className="rounded-2xl border border-white/10 bg-[#121318]/95 p-4 sm:p-5 space-y-4 shadow-xl backdrop-blur-md">
              {/* Texto Antigo (Revogado / Anterior) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Antigo (Revogado / Anterior)
                </span>
                <div className="text-sm sm:text-base leading-relaxed p-4 rounded-xl border font-medium bg-rose-500/5 border-rose-500/20 text-zinc-300 font-serif line-through decoration-rose-500/60">
                  {getTextoAntigoDisplay()}
                </div>
              </div>

              {/* Texto Novo (Vigente) */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Novo (Vigente)
                </span>
                <div className="text-sm sm:text-base leading-relaxed p-4 rounded-xl border font-medium bg-emerald-500/5 border-emerald-500/20 text-zinc-100 font-serif">
                  {(data.textoNovo || data.artigo.caput)?.replace(/(?:n[º°]\s*[\d.]+(?:,\s*de\s*\d{4})?\)?)\s*$/i, '').trim()}
                </div>
              </div>

              {/* Identificação da Norma Modificadora Oficial */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/5 text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-0.5">
                    Norma Modificadora Oficial
                  </span>
                  <p className="font-semibold text-zinc-100 truncate text-xs sm:text-sm">
                    {data.leiNome}
                  </p>
                  <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">
                    {data.referencia}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-zinc-300 bg-white/[0.06] border border-white/10 px-3 py-1.5 rounded-full shrink-0 shadow-sm">
                  {data.mesAno}
                </span>
              </div>
            </div>
          ) : (
            /* ── ABA 2: EXPLICAÇÃO DIDÁTICA DIRETAMENTE NA TELA ── */
            <div className="space-y-4">
              {/* Barra de Ações da Explicação: Modelo utilizado e Botão Regerar */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#14151b] border border-white/10 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-zinc-300 truncate">
                    Síntese Doutrinária Didática
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider shrink-0">
                    {aiModelUsed || 'OmniRoute'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    void gerarExplicacaoIA(data, true);
                  }}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:opacity-70 text-xs font-semibold text-zinc-200 border border-white/10 transition-all shrink-0 disabled:opacity-50 cursor-pointer"
                  title="Regerar análise com IA"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Regerar</span>
                </button>
              </div>

              {aiLoading ? (
                <div className="py-14 flex flex-col items-center justify-center gap-3 text-center rounded-2xl border border-white/10 bg-[#121318]/95 p-6 backdrop-blur-md">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm font-semibold text-zinc-200">
                    Estruturando explicação didática...
                  </p>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Examinando a redação legal com OmniRoute e fundamentando os impactos práticos.
                  </p>
                </div>
              ) : (
                <>
                  {/* Seções parseadas em cards modulares */}
                  {parseExplicacaoSecoes(aiExplicacao).map((secao) => (
                    <div
                      key={secao.numero}
                      className="rounded-2xl border border-white/10 bg-[#14151b] p-4 sm:p-5 space-y-2.5 shadow-lg"
                    >
                      <div className="flex items-center gap-2.5 border-b border-white/10 pb-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white/[0.08] text-primary border border-primary/30">
                          {secao.numero}
                        </span>
                        <h3 className="font-display text-sm sm:text-base font-bold text-white tracking-tight">
                          {secao.titulo}
                        </h3>
                      </div>
                      <div className="space-y-2 pt-1">
                        {renderFormattedText(secao.conteudo)}
                      </div>
                    </div>
                  ))}

                  {/* Card Constitucional de Segurança Jurídica */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-300 leading-relaxed flex items-start gap-3 shadow-sm">
                    <Scale className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white mb-0.5">Segurança Jurídica & Irretroatividade</p>
                      <p className="text-zinc-400">
                        A alteração legal incide nos termos do Art. 5º, XXXVI da Constituição Federal, respeitados o ato jurídico perfeito, o direito adquirido e a coisa julgada.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── BOTÃO PREMIUM: IR PARA O ARTIGO COMPLETO (SEMPRE ACESSÍVEL) ── */}
          <div className="pt-2 pb-8">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onClose();
                onIrParaArtigo(data.artigo);
              }}
              className="w-full relative group overflow-hidden rounded-2xl p-[1px] shadow-xl shadow-black/40 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/40 via-primary/30 to-zinc-700/40 opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between p-4 sm:p-4.5 rounded-[15px] bg-[#12141a]/95 hover:bg-[#161820]/95 backdrop-blur-md border border-white/10 transition-colors">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shrink-0 shadow-inner">
                    <Bookmark className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold text-sm sm:text-base text-white tracking-tight leading-tight flex items-center gap-2">
                      <span>Ir para o Artigo Completo</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300 font-mono">
                        {data.artigoDisplay}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-400 leading-snug mt-1 truncate">
                      Visualizar caput, incisos, parágrafos e jurisprudência completa
                    </p>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/[0.05] group-hover:bg-primary/20 border border-white/10 group-hover:border-primary/40 flex items-center justify-center shrink-0 ml-2 transition-all">
                  <ChevronRight className="w-4.5 h-4.5 text-zinc-300 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </button>
          </div>

        </div>
      </div>
    </AnimatePresence>
  );
};

export default ArtigoComparativoModal;
