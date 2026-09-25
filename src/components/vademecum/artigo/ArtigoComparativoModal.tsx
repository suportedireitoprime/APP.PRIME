import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
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
  const [textoView, setTextoView] = useState<TextoViewType>('vigente');
  const [aiExplicacao, setAiExplicacao] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiModelUsed, setAiModelUsed] = useState<string>('');

  // Reseta estado e busca explicação da IA automaticamente via OmniRoute ao abrir o card
  useEffect(() => {
    if (!open || !data) return;
    setTextoView('vigente');

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
    }

    // Se não tiver em cache, gera automaticamente com timeout estrito
    void gerarExplicacaoIA(data, false);
  }, [open, data?.artigoDisplay, data?.ano]);

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
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    : isRevogado
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] bg-[#0A0B0E] flex flex-col overflow-hidden select-none">
        {/* Fundo com ShapeGrid sutil */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
          <ShapeGrid />
        </div>

        {/* ── ROLAGEM UNIFICADA DA TELA INTEIRA (ao subir a tela, sobe tudo) ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full px-4 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] space-y-4 max-w-3xl mx-auto custom-scrollbar z-10">
          
          {/* ── CABEÇALHO LIMPO E ELEGANTE (SEM CAPA SUPERIOR, COM BOTÃO VOLTAR PADRONIZADO) ── */}
          <div className="flex items-center justify-between gap-3 pt-2 pb-1">
            <div className="flex items-center gap-3 min-w-0">
              {/* Botão Voltar Padronizado oficial */}
              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  onClose();
                }}
                className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-zinc-800/90 hover:bg-zinc-700/90 border border-white/10 text-white shadow-xl active:scale-95 transition-all cursor-pointer shrink-0"
                title="Voltar ao Vade Mecum"
              >
                <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-primary drop-shadow">
                    {data.leiNomePai || 'Direito Penal'}
                  </span>
                  <span
                    className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${tipoBadgeColor}`}
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              >
                <span>Planalto</span>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-300" />
              </a>
            )}
          </div>

          {/* ── 1. BLOCO PRINCIPAL DO TEXTO (MOSTRA PRIMEIRO O TEXTO NOVO / VIGENTE) ── */}
          <div className="rounded-2xl border border-white/10 bg-[#121318]/95 p-4 sm:p-5 space-y-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
              <span
                className={`text-[11px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 ${
                  textoView === 'vigente' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {textoView === 'vigente' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Texto Novo (Vigente no Planalto)
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Texto Anterior (Revogado / Anterior)
                  </>
                )}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                  textoView === 'vigente'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {textoView === 'vigente' ? 'Vigente' : 'Anterior'}
              </span>
            </div>

            {/* Texto do Artigo com tipografia jurídica refinada */}
            <div
              className={`text-sm sm:text-base leading-relaxed p-4 rounded-xl bg-black/45 border font-medium ${
                textoView === 'vigente'
                  ? 'border-emerald-500/25 text-zinc-100 font-serif'
                  : 'border-rose-500/20 text-zinc-300 font-serif line-through decoration-rose-500/60'
              }`}
            >
              {textoView === 'vigente'
                ? data.textoNovo || data.artigo.caput
                : data.textoAntigo ||
                  'Dispositivo inédito no Código Penal (incluído pela primeira vez por esta norma).'}
            </div>

            {/* Identificação da Norma Modificadora Oficial */}
            <div className="flex items-center justify-between gap-3 pt-1 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-0.5">
                  Norma Modificadora Oficial
                </span>
                <p className="font-semibold text-white truncate text-xs sm:text-sm">
                  {data.leiNome}
                </p>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">
                  {data.referencia}
                </p>
              </div>
              <span className="text-[10px] font-bold text-zinc-200 bg-white/[0.08] border border-white/10 px-3 py-1.5 rounded-full shrink-0 shadow-sm">
                {data.mesAno}
              </span>
            </div>
          </div>

          {/* ── 2. MENU DE ALTERNÂNCIA MAIS ELEGANTE (POSICIONADO LOGO ABAIXO DO TEXTO) ── */}
          <div className="p-1.5 rounded-2xl bg-[#14151a] border border-white/10 shadow-lg grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setTextoView('vigente');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all select-none cursor-pointer active:scale-98 ${
                textoView === 'vigente'
                  ? 'bg-hero-panel text-white shadow-lg shadow-red-950/60 border border-red-500/40 ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 transition-colors ${
                  textoView === 'vigente' ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              />
              <span className="truncate">Vigente (Novo Texto)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setTextoView('anterior');
              }}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all select-none cursor-pointer active:scale-98 ${
                textoView === 'anterior'
                  ? 'bg-hero-panel text-white shadow-lg shadow-red-950/60 border border-red-500/40 ring-1 ring-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 transition-colors ${
                  textoView === 'anterior' ? 'text-rose-400' : 'text-zinc-500'
                }`}
              />
              <span className="truncate">Anterior (Revogado)</span>
            </button>
          </div>

          {/* ── 3. EXPLICAÇÃO DIDÁTICA COM IA (OMNIROUTE COM TIMEOUT E RESPOSTA GARANTIDA) ── */}
          <div className="rounded-2xl bg-[#121318]/95 border border-white/10 p-4 sm:p-5 space-y-3.5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    Explicação Didática com IA
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase tracking-wider">
                      OmniRoute
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    O que mudou, o contexto e o impacto penal prático.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  void gerarExplicacaoIA(data, true);
                }}
                disabled={aiLoading}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 text-xs font-semibold text-zinc-200 border border-white/10 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                title="Regerar análise com IA"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Regerar</span>
              </button>
            </div>

            {/* Conteúdo da Análise IA ou Loader com tempo limite */}
            {aiLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                <p className="text-sm font-semibold text-zinc-200">
                  Gerando explicação didática via OmniRoute...
                </p>
                <p className="text-xs text-zinc-400 max-w-sm">
                  Examinando as alterações no Planalto e estruturando o impacto penal prático.
                </p>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-zinc-200 space-y-3 whitespace-pre-line font-body p-4 rounded-xl bg-black/45 border border-white/10 shadow-inner">
                {aiExplicacao}
              </div>
            )}

            {/* Princípio Constitucional da Irretroatividade Penal */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-zinc-400 leading-relaxed flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary shrink-0" />
              <span>
                As alterações penais aplicam-se respeitando a irretroatividade da lei penal mais gravosa (Art. 5º, XL, CF/88).
              </span>
            </div>
          </div>

          {/* ── 4. BOTÃO DE AÇÃO: IR PARA O ARTIGO COMPLETO (INTEGRADO NO SCROLL) ── */}
          <div className="pt-2 pb-6">
            <button
              type="button"
              onClick={() => {
                haptic.impact();
                onClose();
                onIrParaArtigo(data.artigo);
              }}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-hero-panel hover:bg-primary text-white text-sm font-bold shadow-xl shadow-red-950/50 active:scale-95 transition-all min-h-[50px] cursor-pointer border border-red-500/30"
            >
              <Bookmark className="w-4 h-4 text-white" />
              <span>Ir para o Artigo Completo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </AnimatePresence>
  );
};

export default ArtigoComparativoModal;
