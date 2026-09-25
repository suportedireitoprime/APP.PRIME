import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Loader2,
  Scale,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import type { ArtigoLei } from '@/data/mockData';
import { executeAiTask } from '@/services/aiGatewayService';
import { haptic } from '@/lib/nativeHaptics';

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

type TabType = 'comparativo' | 'explicacao' | 'dispositivo';

export const ArtigoComparativoModal: React.FC<ArtigoComparativoModalProps> = ({
  open,
  onClose,
  data,
  onIrParaArtigo,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('comparativo');
  const [aiExplicacao, setAiExplicacao] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiModelUsed, setAiModelUsed] = useState<string>('');

  // Reseta aba e busca explicação da IA ao abrir novo artigo
  useEffect(() => {
    if (!open || !data) return;
    setActiveTab('comparativo');

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

    // Se não tiver cache, gera automaticamente via OmniRoute
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] bg-[#0E0F12] flex flex-col overflow-hidden select-none">
        {/* Topo / Header Fixo com Safe Area */}
        <div className="shrink-0 bg-[#121318] border-b border-zinc-800/80 px-4 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-3 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 border border-white/10 flex items-center justify-center text-white transition-all shrink-0 cursor-pointer"
              title="Voltar ao Vade Mecum"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-lg sm:text-xl font-black text-white tracking-wide truncate">
                  {data.artigoDisplay}
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  {data.tipo}
                </span>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] tracking-widest">
                  {data.mesAno}
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {data.leiNomePai || 'Código Penal'} • {data.leiNome}
              </p>
            </div>
          </div>

          {/* Link externo para a lei no Planalto se houver */}
          {data.linkLei && (
            <a
              href={data.linkLei}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-300 hover:bg-blue-500/25 border border-blue-500/30 text-xs font-semibold transition-all shrink-0 cursor-pointer"
            >
              <span>Ver Lei no Planalto</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {/* Menu de Alternância (Tabs) */}
        <div className="shrink-0 bg-[#121318]/70 border-b border-zinc-800/80 px-4 py-2">
          <div className="max-w-4xl mx-auto grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-2xl border border-white/[0.05]">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setActiveTab('comparativo');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all select-none cursor-pointer ${
                activeTab === 'comparativo'
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Scale className="w-4 h-4 shrink-0" />
              <span className="truncate">Comparativo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setActiveTab('explicacao');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all select-none cursor-pointer ${
                activeTab === 'explicacao'
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
              <span className="truncate">Explicação IA</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setActiveTab('dispositivo');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all select-none cursor-pointer ${
                activeTab === 'dispositivo'
                  ? 'bg-primary text-white shadow-md shadow-primary/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="truncate">Dispositivo</span>
            </button>
          </div>
        </div>

        {/* Corpo com Scroll do Conteúdo */}
        <div className="flex-1 overflow-y-auto px-4 py-5 max-w-4xl w-full mx-auto space-y-5 custom-scrollbar">
          {activeTab === 'comparativo' && (
            <div className="space-y-4">
              {/* Card da Norma Modificadora */}
              <div className="p-4 rounded-2xl bg-[#14151b] border border-zinc-800 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                    Norma Modificadora Oficial
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {data.mesAno}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {data.leiNome}
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  {data.referencia}
                </p>
              </div>

              {/* Grid Comparativo dos Textos: Novo vs Antigo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Texto Antigo (Revogado / Anterior) */}
                <div className="rounded-2xl border border-rose-500/25 bg-[#170e10] p-4 space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Texto Antigo (Revogado / Anterior)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                      Anterior
                    </span>
                  </div>
                  <div className="text-xs sm:text-[13px] text-zinc-300 font-serif leading-relaxed line-through decoration-rose-500/60 p-3 rounded-xl bg-black/30 border border-rose-500/15">
                    {data.textoAntigo || 'Dispositivo inédito no Código Penal (incluído pela primeira vez por esta lei).'}
                  </div>
                </div>

                {/* Texto Novo (Vigente no Planalto) */}
                <div className="rounded-2xl border border-emerald-500/30 bg-[#0e1713] p-4 space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Texto Novo (Vigente no Planalto)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      Vigente
                    </span>
                  </div>
                  <div className="text-xs sm:text-[13px] text-white font-serif leading-relaxed p-3 rounded-xl bg-black/40 border border-emerald-500/20 font-medium">
                    {data.textoNovo || data.artigo.caput}
                  </div>
                </div>
              </div>

              {/* Informação adicional sobre o princípio da anterioridade */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-zinc-400 leading-relaxed flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span>
                  As alterações penais aplicam-se respeitando o princípio constitucional da irretroatividade da lei penal mais gravosa (Art. 5º, XL, CF/88).
                </span>
              </div>
            </div>
          )}

          {activeTab === 'explicacao' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#14151b] border border-zinc-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-primary/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      Análise Jurídica com IA
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 uppercase">
                        OmniRoute
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Entenda o que mudou, o contexto e o impacto penal prático.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => gerarExplicacaoIA(data, true)}
                  disabled={aiLoading}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 text-xs font-semibold text-zinc-200 border border-white/10 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  title="Atualizar análise com IA"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Regerar</span>
                </button>
              </div>

              {/* Box de Explicação */}
              <div className="p-5 rounded-2xl bg-[#101116] border border-zinc-800/90 shadow-md">
                {aiLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                    <p className="text-sm font-semibold text-zinc-200">
                      Consultando tutor jurídico OmniRoute...
                    </p>
                    <p className="text-xs text-zinc-400 max-w-sm">
                      Examinando as diferenças entre a redação anterior e o novo texto vigente.
                    </p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-zinc-200 space-y-3 whitespace-pre-line font-body">
                    {aiExplicacao}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dispositivo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#14151b] border border-zinc-800 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                  Dispositivo no Código
                </span>
                <p className="font-serif text-sm sm:text-base text-zinc-100 leading-relaxed p-4 rounded-xl bg-black/40 border border-white/[0.05]">
                  {data.artigo.caput}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé Fixo com Botão "Ir para o Artigo" */}
        <div className="shrink-0 bg-[#121318] border-t border-zinc-800/80 px-4 py-3 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] flex items-center justify-between gap-3 shadow-2xl">
          <div className="hidden sm:block text-xs text-zinc-400">
            Deseja ler o artigo completo com grifos e anotações?
          </div>

          <button
            type="button"
            onClick={() => {
              haptic.impact();
              onClose();
              onIrParaArtigo(data.artigo);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl bg-hero-panel hover:bg-primary text-white text-sm font-bold shadow-lg shadow-red-950/40 active:scale-95 transition-all min-h-[48px] cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Ir para o Artigo Completo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ArtigoComparativoModal;
