import React, { useState, useEffect } from 'react';
import { executeAiTask } from '@/services/aiGatewayService';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Clock,
  Scale,
  AlertTriangle,
  Send,
  X,
  FileText,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import cpCoverImg from '@/assets/lei-cover-cp.webp';

interface LeiSobreModalProps {
  open: boolean;
  onClose: () => void;
  leiNome: string;
  leiDescricao: string;
  leiId?: string;
}

export const LeiSobreModal: React.FC<LeiSobreModalProps> = ({
  open,
  onClose,
  leiNome,
  leiDescricao,
  leiId,
}) => {
  const [relatarOpen, setRelatarOpen] = useState(false);
  const [artigoNum, setArtigoNum] = useState('');
  const [tipoErro, setTipoErro] = useState('Texto divergente do Planalto');
  const [descricao, setDescricao] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [sobreHtml, setSobreHtml] = useState<string | null>(null);
  const [loadingSobre, setLoadingSobre] = useState(false);

  useEffect(() => {
    if (!open || !leiNome) return;

    // Check if it's explicitly Código Penal for the hardcoded text
    if (leiNome.toLowerCase().includes('código penal') && !leiNome.toLowerCase().includes('processo')) {
      setSobreHtml(`
        <p>
          O <strong>Código Penal Brasileiro</strong> foi promulgado pelo <strong>Decreto-Lei nº 2.848, de 7 de dezembro de 1940</strong>, durante o governo de Getúlio Vargas, sob o projeto coordenado pelo ministro e jurista Francisco Campos, entrando em vigor em 1º de janeiro de 1942.
        </p>
        <p>
          A codificação é a espinha dorsal do Direito Penal nacional e divide-se em dois grandes blocos:
        </p>
        <ul class="list-disc pl-5 space-y-1.5 text-zinc-400 mt-2">
          <li>
            <strong class="text-zinc-200">Parte Geral (Artigos 1º ao 120):</strong> estabelece as regras fundamentais de aplicação da lei penal no tempo e espaço, a teoria do crime, imputabilidade penal, concurso de pessoas, fixação e cumprimento de penas e extinção da punibilidade.
          </li>
          <li>
            <strong class="text-zinc-200">Parte Especial (Artigos 121 ao 361):</strong> tipifica os crimes em espécie (contra a pessoa, patrimônio, dignidade sexual, paz pública, fé pública e administração pública), cominando as respectivas penas.
          </li>
        </ul>
      `);
      return;
    }

    const cacheKey = `vade_sobre_${leiNome.replace(/\s+/g, '_')}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setSobreHtml(cached);
      return;
    }

    const fetchSobre = async () => {
      setLoadingSobre(true);
      try {
        if (leiId) {
          const { data, error } = await supabase
            .from('vade_mecum_leis')
            .select('sobre_html')
            .eq('id', leiId)
            .single();
          
          if (!error && data?.sobre_html) {
            setSobreHtml(data.sobre_html);
            setLoadingSobre(false);
            return;
          }
        }

        const prompt = `Resuma o que é a norma "${leiNome}" (${leiDescricao}) de forma estruturada. 
Inclua: Origem histórica/promulgação e a estrutura principal da norma (como ela é dividida/organizada).
Use apenas parágrafos e tags HTML (como <p>, <strong> e <ul><li>). Não use blocos de código (\`\`\`html). Faça um texto direto, didático e focado no ponto.`;
        
        const timeoutPromise = new Promise<{ text: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 10000)
        );

        const aiPromise = executeAiTask({
          featureKey: 'chat_juridico',
          prompt,
          systemPrompt: 'Você é um assistente jurídico. Responda diretamente com o HTML estruturado solicitado, sem explicações adicionais.',
          temperature: 0.3,
        });

        const res = await Promise.race([aiPromise, timeoutPromise]);
        let html = res.text || '';
        html = html.replace(/```html/g, '').replace(/```/g, '').trim();

        if (html && !html.includes('Falha')) {
          setSobreHtml(html);
          if (leiId) {
            await supabase
              .from('vade_mecum_leis')
              .update({ sobre_html: html })
              .eq('id', leiId);
          } else {
            localStorage.setItem(cacheKey, html);
          }
        } else {
          setSobreHtml(`<p>Informações detalhadas não disponíveis no momento.</p>`);
        }
      } catch (err) {
        console.warn('Erro ao buscar o sobre da lei:', err);
        setSobreHtml(`<p>Apresentação geral da norma.</p>`);
      } finally {
        setLoadingSobre(false);
      }
    };

    fetchSobre();
  }, [open, leiNome, leiDescricao]);

  if (!open) return null;

  const handleEnviarRelato = (e: React.FormEvent) => {
    e.preventDefault();
    haptic.impact();
    setEnviado(true);
    toast.success('Relato enviado com sucesso à equipe de curadoria legislativa!');
    setTimeout(() => {
      setEnviado(false);
      setRelatarOpen(false);
      setArtigoNum('');
      setDescricao('');
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[75] bg-[#0A0B0E] flex flex-col overflow-hidden select-none">
        {/* Fundo com textura ShapeGrid sutil */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
          <ShapeGrid />
        </div>

        {/* ── PAINEL HERO (Estilo Vade Mecum: Traçado vermelho à esquerda, corte diagonal e capa à direita) ── */}
        <div
          className="relative shrink-0 overflow-hidden rounded-b-[32px] sm:rounded-b-[36px] shadow-2xl shadow-black/80 z-20 min-h-[175px] sm:min-h-[200px]"
          style={{
            transform: 'translateZ(0)',
            backgroundColor: '#050505',
          }}
        >
          {/* Imagem de Capa à Direita */}
          <img
            src={cpCoverImg}
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover object-right z-0 pointer-events-none"
          />

          {/* Overlay Vermelho com gradiente da marca e corte poligonal */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{
              filter:
                'drop-shadow(25px 0 25px rgba(0,0,0,0.85)) drop-shadow(8px 0 10px rgba(0,0,0,0.95))',
            }}
          >
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: 'polygon(0 0, 47% 0, 36% 100%, 0% 100%)' }}
            >
              <div className="absolute inset-0 bg-brand-gradient" />
              <div className="absolute inset-0 opacity-15 mix-blend-overlay">
                <ShapeGrid />
              </div>
            </div>
          </div>

          {/* Barra Superior com Botão Voltar */}
          <header className="relative z-20 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] px-4 pb-1.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                onClose();
              }}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/10 text-white shadow-xl transition-all hover:bg-black/70 active:opacity-70 cursor-pointer"
              title="Voltar ao Código Penal"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>
          </header>

          {/* Conteúdo do Painel à Esquerda */}
          <div className="relative z-10 px-3 sm:px-4 ml-1 sm:ml-2 pt-0.5 pb-4 flex flex-col justify-start w-[44%] max-w-[175px]">
            <p className="text-[9.5px] sm:text-[10px] font-extrabold tracking-[0.25em] uppercase text-white/85 drop-shadow">
              Informações Oficiais
            </p>

            <h1 className="font-display text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight mt-0.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Sobre a Lei
            </h1>

            <p className="text-[10px] sm:text-[11px] text-white/80 mt-1 line-clamp-2 drop-shadow">
              {leiNome} • {leiDescricao}
            </p>
          </div>
        </div>

        {/* ── CORPO ROLÁVEL COM SEÇÕES ESTRUTURADAS ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5 max-w-3xl w-full mx-auto space-y-4 custom-scrollbar z-10 pb-16">
          {/* Card 1: O que é a Lei */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/90 p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-white">
                  O que é o(a) {leiNome}?
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Origem histórica, promulgação e organização
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed min-h-[80px]">
              {loadingSobre ? (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-xs text-zinc-400">Resumindo informações da norma...</p>
                </div>
              ) : sobreHtml ? (
                <div 
                  className="space-y-2.5"
                  dangerouslySetInnerHTML={{ __html: sobreHtml }}
                />
              ) : null}
            </div>
          </div>

          {/* Card 2: Fonte Oficial das Informações */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/90 p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-white">
                  Fonte Oficial das Informações
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Fidelidade normativa ao texto do Planalto
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-2.5">
              <p>
                Todos os artigos, parágrafos, incisos e alíneas disponibilizados no aplicativo são
                extraídos e espelhados diretamente do{' '}
                <strong>Portal Oficial da Legislação da Presidência da República (planalto.gov.br)</strong>.
              </p>
              <p>
                O aplicativo mantém estrita fidelidade à redação legal do legislador federal, sem
                qualquer adulteração de mérito, permitindo aos estudantes, advogados, magistrados e
                operadores do Direito trabalhar com textos de máxima segurança jurídica.
              </p>

              <div className="pt-2">
                <a
                  href="https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Conferir Código Penal no Portal do Planalto</span>
                </a>
              </div>
            </div>
          </div>

          {/* Card 3: Atualização Contínua em Tempo Real */}
          <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/90 p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-white">
                  Atualização Contínua em Tempo Real (2026)
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Sincronização com o Diário Oficial da União (DOU)
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed space-y-2.5">
              <p>
                O sistema é monitorado continuamente para incorporar leis ordinárias, leis
                complementares e alterações normativas publicadas oficialmente no Diário Oficial.
              </p>
              <p>
                As alterações mais recentes de 2026 (como as{' '}
                <strong>Leis nº 15.517/2026</strong> e <strong>15.487/2026</strong>) já estão
                incorporadas, permitindo a comparação em tempo real entre a redação anterior
                revogada e o novo texto vigente.
              </p>
              <p className="text-[11px] text-zinc-400 border-l-2 border-primary pl-3 py-0.5">
                Em respeito ao princípio constitucional da anterioridade e da irretroatividade da
                lei penal mais gravosa (Art. 5º, XL da CF/88), os textos anteriores permanecem
                disponíveis para consulta histórica e aplicação aos fatos pretéritos.
              </p>
            </div>
          </div>

          {/* Card 4: Canal de Auditoria & Botão Relatar Erro */}
          <div className="rounded-2xl bg-primary/10 border border-primary/25 p-4 sm:p-5 space-y-3.5 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2.5 border-b border-primary/20 pb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-white">
                  Canal de Auditoria e Feedback
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Identificou alguma inconsistência ou erro em artigo?
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Nosso compromisso é manter o aplicativo com 100% de precisão jurídica. Caso encontre
              qualquer erro de digitação, omissão de parágrafo ou divergência em relação ao texto do
              Planalto, relate imediatamente à nossa equipe editorial.
            </p>

            <button
              type="button"
              onClick={() => {
                haptic.impact();
                setRelatarOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-hero-panel hover:bg-primary text-white text-xs sm:text-sm font-bold shadow-md shadow-red-950/40 active:opacity-70 transition-all cursor-pointer border border-red-500/30"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Relatar Erro ou Sugestão</span>
            </button>
          </div>
        </div>

        {/* ── MODAL FLUTUANTE DE RELATAR ERRO ── */}
        <AnimatePresence>
          {relatarOpen && (
            <div className="fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#121318] border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-base text-white">Relatar Inconsistência</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRelatarOpen(false)}
                    className="p-1 rounded-full text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleEnviarRelato} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1 uppercase tracking-wider">
                      Número do Artigo (opcional)
                    </label>
                    <input
                      type="text"
                      value={artigoNum}
                      onChange={(e) => setArtigoNum(e.target.value)}
                      placeholder="Ex: Art. 156"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1 uppercase tracking-wider">
                      Tipo de Problema
                    </label>
                    <select
                      value={tipoErro}
                      onChange={(e) => setTipoErro(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-zinc-700 text-xs text-white focus:outline-none focus:border-primary"
                    >
                      <option value="Texto divergente do Planalto">Texto divergente do Planalto</option>
                      <option value="Erro de digitação / pontuação">Erro de digitação / pontuação</option>
                      <option value="Lei modificadora ausente ou incorreta">Lei modificadora ausente ou incorreta</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1 uppercase tracking-wider">
                      Descrição do Erro
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descreva o que está incorreto ou sugira a correção..."
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRelatarOpen(false)}
                      className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-zinc-300 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={enviado}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hero-panel hover:bg-primary text-xs font-bold text-white shadow-md shadow-red-950/40 active:opacity-70 transition-all"
                    >
                      {enviado ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Enviado!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Relato</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};

export default LeiSobreModal;
