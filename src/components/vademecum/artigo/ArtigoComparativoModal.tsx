import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
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
import vademecumHeroImg from '@/assets/covers/vademecum-judge.webp';

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
        setAiExplicacao(parsed.text || '');
        setAiModelUsed(parsed.model || '');
        return;
      } catch {}
    }

    // Se não tiver em cache, gera automaticamente via OmniRoute
    void gerarExplicacaoIA(data, false);
  }, [open, data?.artigoDisplay, data?.ano]);

  const gerarExplicacaoIA = async (item: AlteracaoDetailData, forcarRegerar = true) => {
    const cacheKey = `alteracao_ia_explicacao_${item.artigoDisplay.replace(/\s+/g, '_')}_${item.ano}`;
    if (!forcarRegerar) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return;
    }

    setAiLoading(true);
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

      const res = await executeAiTask({
        featureKey: 'chat_juridico',
        prompt,
        systemPrompt:
          'Você é um renomado professor e doutrinador de Direito Penal brasileiro. Seja extremamente didático, claro, preciso e fundamente as razões normativas.',
        temperature: 0.5,
      });

      const text = res.text || 'Não foi possível gerar a explicação.';
      setAiExplicacao(text);
      setAiModelUsed(res.modelUsed || 'OmniRoute');

      localStorage.setItem(
        cacheKey,
        JSON.stringify({ text, model: res.modelUsed, timestamp: Date.now() })
      );
    } catch (err) {
      console.error('Falha ao gerar explicação da alteração:', err);
      // Fallback didático instantâneo
      setAiExplicacao(
        `**O que mudou na redação:**\nO dispositivo foi ${item.tipo.toLowerCase()} pela ${item.leiNome}, trazendo nova disciplina para a matéria.\n\n**Contexto e Finalidade:**\nAdequação da legislação penal às diretrizes de segurança jurídica e proporcionalidade punitiva.\n\n**Impacto Prático:**\nAplica-se imediatamente aos fatos presentes e futuros, observando o princípio da anterioridade e a não retroatividade da lei penal mais gravosa (Art. 5º, XL da CF/88).`
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
        {/* Fundo com ShapeGrid global para manter a tonalidade dos quadradinhos pretos */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
          <ShapeGrid />
        </div>

        {/* ── PAINEL HERO (Estilo Vade Mecum: Traçado vermelho à esquerda, corte diagonal e imagem à direita) ── */}
        <div
          className="relative shrink-0 overflow-hidden rounded-b-[32px] sm:rounded-b-[36px] shadow-2xl shadow-black/80 z-20"
          style={{
            transform: 'translateZ(0)',
            backgroundColor: '#050505',
          }}
        >
          {/* Imagem de Capa do Tribunal / Justiça à Direita */}
          <img
            src={vademecumHeroImg}
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none"
          />

          {/* Overlay Vermelho com gradiente da marca e corte poligonal idêntico ao Vade Mecum */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{
              filter:
                'drop-shadow(25px 0 25px rgba(0,0,0,0.85)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))',
            }}
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: 'polygon(0 0, 58% 0, 42% 100%, 0% 100%)' }}
            >
              <div className="absolute inset-0 bg-brand-gradient" />
              <div className="absolute inset-0 opacity-15 mix-blend-overlay">
                <ShapeGrid />
              </div>
            </div>
          </div>

          {/* Cabeçalho do Painel com Botão Voltar e Link Externo */}
          <div className="relative z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10 text-white shadow-xl transition-all hover:bg-black/70 active:scale-95 cursor-pointer"
              title="Voltar ao Vade Mecum"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>

            {data.linkLei && (
              <a
                href={data.linkLei}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white/90 hover:text-white border border-white/15 text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <span>Planalto</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Conteúdo do Painel: Título da Matéria e Identificação do Artigo à Esquerda */}
          <div className="relative z-10 px-4 sm:px-6 pt-1 pb-4 flex flex-col justify-start max-w-[62%] sm:max-w-[55%]">
            <p className="text-[10px] sm:text-xs font-extrabold tracking-[0.25em] uppercase text-white/85 drop-shadow">
              {data.leiNomePai || 'Direito Penal'}
            </p>

            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-tight mt-0.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {data.artigoDisplay}
            </h1>

            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span
                className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm backdrop-blur-sm ${tipoBadgeColor}`}
              >
                {data.tipo}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-black/45 text-white/90 border border-white/15 backdrop-blur-sm truncate max-w-[190px]">
                {data.leiNome}
              </span>
            </div>
          </div>
        </div>

        {/* ── MENU DE ALTERNÂNCIA (Novo / Vigente vs Antigo / Anterior) ── */}
        <div className="shrink-0 bg-[#0E0F14]/90 border-b border-zinc-800/80 px-4 py-2.5 z-10 backdrop-blur-md">
          <div className="max-w-2xl mx-auto grid grid-cols-2 gap-2 p-1 bg-black/50 rounded-2xl border border-zinc-800/80">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setTextoView('vigente');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all select-none cursor-pointer ${
                textoView === 'vigente'
                  ? 'bg-hero-panel text-white shadow-lg shadow-red-950/50 border border-red-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
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
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all select-none cursor-pointer ${
                textoView === 'anterior'
                  ? 'bg-hero-panel text-white shadow-lg shadow-red-950/50 border border-red-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 ${
                  textoView === 'anterior' ? 'text-rose-400' : 'text-zinc-500'
                }`}
              />
              <span className="truncate">Anterior (Revogado)</span>
            </button>
          </div>
        </div>

        {/* ── CORPO COM SCROLL (Texto do Artigo + Explicação IA Automática Embaixo) ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-3xl w-full mx-auto space-y-4 custom-scrollbar z-10">
          {/* Card do Texto Selecionado */}
          <div className="space-y-3">
            {textoView === 'vigente' ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-[#0E1512]/95 p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Texto Novo (Vigente no Planalto)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    Vigente
                  </span>
                </div>
                <div className="text-sm sm:text-base text-zinc-100 font-serif leading-relaxed p-3.5 rounded-xl bg-black/40 border border-emerald-500/20 font-medium">
                  {data.textoNovo || data.artigo.caput}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-rose-500/25 bg-[#170E11]/95 p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Texto Antigo (Revogado / Anterior)
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                    Anterior
                  </span>
                </div>
                <div className="text-sm sm:text-base text-zinc-300 font-serif leading-relaxed line-through decoration-rose-500/60 p-3.5 rounded-xl bg-black/40 border border-rose-500/15">
                  {data.textoAntigo ||
                    'Dispositivo inédito no Código Penal (incluído pela primeira vez por esta lei).'}
                </div>
              </div>
            )}

            {/* Informações da Norma Modificadora Oficial com listra cinza sutil */}
            <div className="p-3.5 rounded-2xl bg-[#121316] border border-zinc-800/80 flex items-center justify-between gap-3 text-xs shadow-sm">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-0.5">
                  Norma Modificadora Oficial
                </span>
                <p className="font-semibold text-white truncate">{data.leiNome}</p>
                <p className="text-[11px] text-zinc-400 truncate font-mono mt-0.5">
                  {data.referencia}
                </p>
              </div>
              <span className="text-[10px] font-bold text-zinc-300 bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-full shrink-0">
                {data.mesAno}
              </span>
            </div>
          </div>

          {/* ── SEÇÃO DE EXPLICAÇÃO IA AUTOMÁTICA OMNIROUTE (POSICIONADA EMBAIXO) ── */}
          <div className="rounded-2xl bg-[#121316] border border-zinc-800/80 p-4 sm:p-5 space-y-3.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
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

            {/* Conteúdo da Análise IA com Loader ou Texto Formatado */}
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
              <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-zinc-200 space-y-3 whitespace-pre-line font-body p-3.5 rounded-xl bg-black/40 border border-zinc-800/80">
                {aiExplicacao}
              </div>
            )}

            {/* Princípio Constitucional da Irretroatividade Penal */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-[11px] text-zinc-400 leading-relaxed flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary shrink-0" />
              <span>
                As alterações penais aplicam-se respeitando a irretroatividade da lei penal mais gravosa (Art. 5º, XL, CF/88).
              </span>
            </div>
          </div>
        </div>

        {/* ── RODAPÉ FIXO COM BOTÃO "IR PARA O ARTIGO COMPLETO" (ESTILO IMAGEM 3) ── */}
        <div className="shrink-0 bg-[#0E0F14]/95 border-t border-zinc-800/80 px-4 py-3 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] flex items-center justify-between gap-3 shadow-2xl z-20 backdrop-blur-md">
          <div className="hidden sm:block text-xs text-zinc-400">
            Deseja ler o artigo completo com grifos, notas e áudio?
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.impact();
              onClose();
              onIrParaArtigo(data.artigo);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-hero-panel hover:bg-primary text-white text-sm font-bold shadow-lg shadow-red-950/50 active:scale-95 transition-all min-h-[48px] cursor-pointer border border-red-500/30"
          >
            <Bookmark className="w-4 h-4 text-white" />
            <span>Ir para o Artigo Completo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ArtigoComparativoModal;
