import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import {
  Crown, X, Volume2, Sparkles, BookOpen, MessageCircle, Scale, PlayCircle,
  Network, Bell, Download, StickyNote, Highlighter, FileText, Layers,
  HelpCircle, Map, Radar, Newspaper, Library, GraduationCap, Bot, ChevronLeft,
  Gavel, Check, ShieldCheck, NotebookPen,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { BENEFICIOS_PREMIUM } from '@/lib/premiumBeneficios';


export type PremiumFeatureKey =
  | 'narracao' | 'explicacao' | 'exemplo' | 'termos' | 'perguntar'
  | 'jurisprudencia' | 'videoaula' | 'grafo' | 'mapa_mental' | 'lembretes'
  | 'baixar' | 'anotacoes' | 'grifo' | 'flashcards' | 'questoes'
  | 'praticar' | 'favorito'
  | 'radar' | 'blog' | 'biblioteca' | 'aprender' | 'horus'
  | 'audioaula' | 'resumo' | 'resumo_download' | 'lei_seca'
  | 'questao_funcoes' | 'videoaula_funcoes'
  | 'chat_juridico' | 'chat_web' | 'chat_anexo' | 'default';


/** `pitch` = argumento de persuasão específico da área (o que a pessoa ganha ao assinar). */
type FeatureInfo = { title: string; description: string; pitch: string; icon: LucideIcon };

const FEATURES: Record<PremiumFeatureKey, FeatureInfo> = {
  narracao:      { title: 'Ouvir sem interrupções', description: 'Escute qualquer artigo com narração ilimitada, do início ao fim.', pitch: 'Estude no trânsito, na academia ou na fila do fórum — a lei lida em voz humana, quantas vezes quiser.', icon: Volume2 },
  explicacao:    { title: 'Explicações ilimitadas', description: 'A IA destrincha qualquer artigo em linguagem clara.', pitch: 'Nunca mais trave em um dispositivo confuso: explicação com base doutrinária na hora, sem limite diário.', icon: Sparkles },
  exemplo:       { title: 'Exemplos práticos ilimitados', description: 'Veja a norma aplicada em casos do dia a dia.', pitch: 'Fixe o conteúdo com casos concretos — o que a banca e o cliente realmente perguntam.', icon: BookOpen },
  termos:        { title: 'Termos jurídicos explicados', description: 'Traduza o vocabulário técnico do artigo.', pitch: 'Domine o juridiquês: cada termo do dispositivo explicado em segundos.', icon: BookOpen },
  perguntar:     { title: 'Pergunte à IA sobre o artigo', description: 'Tire dúvidas específicas com a assistente jurídica.', pitch: 'Uma assistente jurídica de plantão dentro do artigo: pergunte à vontade, 24 horas por dia.', icon: MessageCircle },
  jurisprudencia:{ title: 'Jurisprudência do STF e STJ', description: 'Súmulas, temas e acórdãos ligados ao artigo.', pitch: 'Cite o tribunal certo na petição e na prova — entendimento atualizado ao lado da lei.', icon: Scale },
  videoaula:     { title: 'Videoaulas sem limite', description: 'Aulas em vídeo artigo por artigo.', pitch: 'Um curso completo acoplado ao Vade Mecum, sem restrição diária.', icon: PlayCircle },
  grafo:         { title: 'Grafo de conexões', description: 'Veja como o artigo conversa com todo o ordenamento.', pitch: 'Enxergue o sistema jurídico inteiro: remissões, correlações e as pegadinhas de prova.', icon: Network },
  mapa_mental:   { title: 'Mapas mentais ilimitados', description: 'Mapas gerados pela IA para revisão rápida.', pitch: 'Revise um capítulo inteiro em 5 minutos na véspera da prova.', icon: Map },
  lembretes:     { title: 'Lembretes por local e horário', description: 'Alertas de estudo por hora ou geolocalização.', pitch: 'Sua rotina de estudo no automático — o app te cobra no horário certo.', icon: Bell },
  baixar:        { title: 'Baixar artigos em PDF', description: 'Lei seca ou comentada, em PDF ou imagem.', pitch: 'Leve seu material para a audiência e para o offline, com os seus grifos e anotações.', icon: Download },
  anotacoes:     { title: 'Anotações pessoais', description: 'Anote em cada artigo e sincronize entre aparelhos.', pitch: 'Monte o seu Vade Mecum comentado — anotações salvas para sempre, em qualquer aparelho.', icon: StickyNote },
  grifo:         { title: 'Grifos ilimitados', description: 'Grife por toque, voz, foto ou com a IA.', pitch: 'Marque o que a banca cobra e volte direto ao ponto na revisão.', icon: Highlighter },
  flashcards:    { title: 'Flashcards ilimitados', description: 'Cartões gerados automaticamente pela IA.', pitch: 'Repetição espaçada com a lei que você acabou de ler — memorização de verdade.', icon: Layers },
  questoes:      { title: 'Questões OAB e concursos', description: 'Questões geradas de qualquer conteúdo.', pitch: 'Treine no padrão das bancas a partir do artigo que você está estudando agora.', icon: HelpCircle },
  praticar:      { title: 'Praticar sem limite', description: 'Questões e flashcards de qualquer artigo.', pitch: 'Teoria e prática no mesmo lugar: leia, responda, corrija e evolua.', icon: Layers },
  favorito:      { title: 'Favoritos ilimitados', description: 'Salve quantos artigos quiser.', pitch: 'Sua biblioteca pessoal de dispositivos essenciais, sempre a um toque.', icon: Highlighter },
  radar:         { title: 'Radar Legislativo', description: 'Projetos de lei em tempo real com análise da IA.', pitch: 'Saiba da mudança antes do cliente perguntar e antes do edital sair.', icon: Radar },
  blog:          { title: 'Blogger Jurídico completo', description: 'Todos os artigos exclusivos, sem limite.', pitch: 'Conteúdo autoral atualizado para argumentar melhor e escrever melhor.', icon: Newspaper },
  biblioteca:    { title: 'Biblioteca completa', description: 'No plano gratuito você lê 1 livro por mês.', pitch: 'Acervo profissional liberado: leitura nativa, PDF, folheada, offline e no desktop.', icon: Library },
  aprender:      { title: 'Trilha Aprender ilimitada', description: 'Trilhas guiadas sem limite diário.', pitch: 'Do zero ao avançado com um caminho pronto — sem adivinhar por onde começar.', icon: GraduationCap },
  horus:         { title: 'Horus 24h no WhatsApp', description: 'Assistente jurídica pessoal no seu WhatsApp.', pitch: 'Consulta jurídica na palma da mão, a qualquer hora, sem nem abrir o app.', icon: Bot },
  chat_juridico: { title: 'Chat Jurídico ilimitado', description: 'No plano gratuito é 1 interação por dia.', pitch: 'Pesquise teses, estruture peças e tire dúvidas sem contar mensagens.', icon: MessageCircle },
  chat_web:      { title: 'Pesquisar na internet', description: 'Busca em tempo real dentro do Chat Jurídico.', pitch: 'Jurisprudência e notícias atualizadas no minuto em que você precisa.', icon: Sparkles },
  chat_anexo:    { title: 'Enviar áudio, PDF e fotos', description: 'Analise documentos e áudios no Chat Jurídico.', pitch: 'Suba o processo, o contrato ou a foto do edital e receba a análise pronta.', icon: FileText },
  audioaula:     { title: 'Audioaulas sem limite', description: 'No plano gratuito é 1 por dia, até 5 no mês.', pitch: 'Transforme o deslocamento em hora de estudo: todo o acervo de aulas em áudio, sem contagem.', icon: Volume2 },
  resumo:        { title: 'Resumos sem limite', description: 'No plano gratuito você abre 1 resumo por dia.', pitch: 'Cornell, Feynman e mapas mentais de qualquer matéria, quantas vezes precisar.', icon: NotebookPen },
  resumo_download: { title: 'Baixar resumos', description: 'Exportar em PDF é exclusivo de assinantes.', pitch: 'Leve o resumo impresso para a audiência, para a prova e para o offline.', icon: Download },
  lei_seca:      { title: 'Lei Seca sem limite', description: 'No plano gratuito é 1 prática por dia.', pitch: 'Percorra a trilha da lei inteira, artigo por artigo, sem parar no meio do caminho.', icon: Gavel },
  questao_funcoes: { title: 'Funções da questão', description: 'Comentário, mini-aula, resumos, termos e pegadinhas.', pitch: 'Entenda por que errou: comentário da banca, teoria e pegadinhas em cada questão.', icon: MessageCircle },
  videoaula_funcoes: { title: 'Funções da videoaula', description: 'Flashcards, resumos, lei seca, termos e questões da aula.', pitch: 'Cada aula vira material de estudo completo — sem assistir duas vezes para fixar.', icon: PlayCircle },

  default:       { title: 'Funcionalidade Premium', description: 'Recurso exclusivo para assinantes.', pitch: 'Libere o Direito Prime completo e estude sem nenhum limite.', icon: Crown },
};

interface PremiumGateProps {
  open: boolean;
  onClose: () => void;
  /** Chave da funcionalidade — mostra ícone, título e descrição personalizados. */
  feature?: PremiumFeatureKey;
  /** Override manual (opcional). */
  title?: string;
  description?: string;
  /** Texto extra tipo "Você já usou 1 de 1 narração hoje" */
  usageLabel?: string;
}

const PremiumGate = ({
  open,
  onClose,
  feature = 'default',
  title,
  description,
  usageLabel,
}: PremiumGateProps) => {
  const navigate = useNavigate();
  const info = FEATURES[feature] ?? FEATURES.default;
  const Icon = info.icon;
  const shownTitle = title ?? info.title;
  const shownDesc = description ?? info.description;
  const [showBenefits, setShowBenefits] = useState(false);
  useEffect(() => { if (!open) setShowBenefits(false); }, [open]);

  // Mensalidade do plano anual — a App Store exige o patamar de R$ 19,90.
  const isIOS = useMemo(() => Capacitor.getPlatform() === 'ios', []);
  const mensalidade = isIOS ? '19,90' : '16,66';
  const totalAnual = isIOS ? 'total R$ 238,80/ano' : 'total R$ 199,90/ano';
  const economia = isIOS ? '33%' : '44%';

  const ctaLabel = 'Começar 3 dias grátis';
  const goToCheckout = () => {
    setShowBenefits(false);
    onClose();
    navigate('/assinatura?plano=anual&trial=1');
  };

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10050]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[10051] flex items-center justify-center px-5 py-6 pointer-events-none"
          >
            <div className="relative w-full max-w-[352px] max-h-[86dvh] overflow-y-auto overscroll-contain bg-card border border-primary/25 rounded-[28px] shadow-2xl shadow-black/60 pointer-events-auto">
              {/* Faixa superior — mesmo vermelho do rodapé do início, em degradê bordô */}
              <div
                className="relative py-3 px-6 flex items-center justify-center overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, hsl(var(--brand-burgundy-deep)) 0%, hsl(var(--brand-burgundy-bright)) 55%, hsl(var(--primary)) 100%)',
                }}
              >
                {/* Imagens vazadas (marca d'água jurídica) */}
                <Gavel className="absolute -left-3 -top-2 w-20 h-20 text-primary-foreground/10 rotate-[-18deg] pointer-events-none" />
                <Scale className="absolute -right-4 -bottom-5 w-20 h-20 text-primary-foreground/10 pointer-events-none" />
                <span className="relative text-[10px] font-extrabold tracking-[0.22em] uppercase text-primary-foreground">
                  Direito Prime · Premium
                </span>
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-primary-foreground/15 transition-colors"
                >
                  <X className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>

              <div className="relative px-6 pt-6 pb-6 flex flex-col items-center text-center overflow-hidden">
                {/* Marca d'água vazada de fundo */}
                <Scale className="absolute -bottom-10 -right-10 w-48 h-48 text-primary/[0.07] pointer-events-none" />

                {/* Ícone da função */}
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/40"
                  style={{
                    background:
                      'linear-gradient(160deg, hsl(var(--brand-burgundy-mid)) 0%, hsl(var(--primary)) 100%)',
                  }}
                >
                  <Icon className="w-8 h-8 text-primary-foreground" />
                </div>

                <h3 className="relative font-display text-[22px] leading-tight text-foreground mb-2 tracking-wide">
                  {shownTitle}
                </h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed mb-3">
                  {shownDesc}
                </p>

                {/* Persuasão específica da área */}
                <p className="relative text-[13px] text-foreground/90 leading-snug bg-primary/[0.08] border border-primary/25 rounded-xl px-3.5 py-2.5 mb-4">
                  {info.pitch}
                </p>

                {usageLabel && (
                  <div className="relative text-[11px] text-primary bg-primary/10 border border-primary/30 rounded-lg py-1.5 px-3 mb-4">
                    {usageLabel}
                  </div>
                )}

                {/* Preço — mensalidade em destaque */}
                <div className="relative w-full rounded-2xl border border-primary/25 bg-secondary/40 px-4 py-3.5 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Plano anual
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground bg-primary rounded-full px-2 py-0.5">
                      -{economia}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-muted-foreground text-sm font-medium">R$</span>
                    <span className="text-foreground text-[40px] font-bold leading-none tracking-tight">{mensalidade}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/90 mt-1.5">
                    12x de R$ {mensalidade} · {totalAnual}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-[11px] font-semibold text-primary">
                    <Check className="w-3.5 h-3.5" />
                    3 dias grátis · cancele quando quiser
                  </div>
                </div>

                <button
                  onClick={goToCheckout}
                  className="relative w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-light transition-all active:scale-[0.98] shadow-lg shadow-primary/25 mb-2.5"
                >
                  {ctaLabel}
                </button>

                <button
                  onClick={() => setShowBenefits(true)}
                  className="relative w-full py-3 rounded-xl border border-border bg-secondary/50 text-foreground font-semibold text-sm hover:bg-secondary transition-colors active:scale-[0.98] mb-3"
                >
                  Ver tudo que desbloqueia
                </button>

                <button
                  onClick={() => { onClose(); navigate('/assinatura'); }}
                  className="relative text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-border pb-0.5"
                >
                  Ver outros planos
                </button>

                <p className="relative mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground/80">
                  <ShieldCheck className="w-3 h-3" />
                  Pagamento pela {isIOS ? 'App Store' : 'Google Play'} · sem fidelidade
                </p>
              </div>
            </div>
          </motion.div>

          {/* Camada de benefícios */}
          <AnimatePresence>
            {showBenefits && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed inset-x-0 bottom-0 z-[10052] max-h-[88dvh] mx-auto w-full md:max-w-[600px] bg-card border-t border-border md:border-x rounded-t-3xl overflow-hidden flex flex-col"
              >
                <div
                  className="relative py-3 px-4 flex items-center gap-2 shrink-0 overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(var(--brand-burgundy-deep)) 0%, hsl(var(--primary)) 100%)',
                  }}
                >
                  <Scale className="absolute -right-3 -bottom-5 w-20 h-20 text-primary-foreground/10 pointer-events-none" />
                  <button
                    onClick={() => setShowBenefits(false)}
                    aria-label="Voltar"
                    className="relative p-1.5 rounded-full hover:bg-primary-foreground/15 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-primary-foreground" />
                  </button>
                  <span className="relative flex-1 text-center text-[10px] font-extrabold tracking-[0.2em] uppercase text-primary-foreground">
                    Tudo que você desbloqueia
                  </span>
                  <button
                    onClick={() => { setShowBenefits(false); onClose(); }}
                    aria-label="Fechar"
                    className="relative p-1.5 rounded-full hover:bg-primary-foreground/15 transition-colors"
                  >
                    <X className="w-4 h-4 text-primary-foreground" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-3 max-w-md mx-auto w-full">
                  {BENEFICIOS_PREMIUM.map((b) => {
                    const BIcon = b.icon;
                    return (
                      <div key={b.title} className="flex gap-3 items-start">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <BIcon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight">{b.title}</p>
                          <p className="text-xs text-muted-foreground leading-snug mt-0.5">{b.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="shrink-0 border-t border-border px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-card max-w-md mx-auto w-full">
                  <button
                    onClick={goToCheckout}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-light transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                  >
                    {ctaLabel} · R$ {mensalidade}/mês
                  </button>
                  <button
                    onClick={() => { setShowBenefits(false); onClose(); navigate('/assinatura'); }}
                    className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ver outros planos
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );


  return createPortal(content, document.body);
};

export default PremiumGate;
