import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import {
  Crown, X, Volume2, Sparkles, BookOpen, MessageCircle, Scale, PlayCircle,
  Network, Bell, Download, StickyNote, Highlighter, FileText, Layers,
  HelpCircle, Map, Radar, Newspaper, Library, GraduationCap, Bot, ChevronLeft,
  Gavel, Check, ShieldCheck, NotebookPen, Heart, Play, Pause, Headphones,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { BENEFICIOS_PREMIUM } from '@/lib/premiumBeneficios';
import { track } from '@/lib/analyticsEvents';
import { logAreaEvent } from '@/lib/appEvents';
import { haptic } from '@/lib/nativeHaptics';
import { useAuth } from '@/hooks/useAuth';
import { isAdminEmail } from '@/lib/adminEmails';
import { shouldBypassAsAdmin, isSimulatingExpired, isDevSimulatorEligible } from '@/lib/devSimulation';
import { useSubscription } from '@/hooks/useSubscription';
import { TrialExpiredModal } from '@/components/TrialExpiredModal';
import { PRECO_MENSAL, PRECO_ANUAL, brl } from '@/lib/precos';
import logoCoruja from '@/assets/logo-coruja.png';
import horusOwlBundled from '@/assets/horus/horus-owl.webp';
import horusOwlAsset from '@/assets/horus/horus-owl.webp.asset.json';
import { pickAsset, srcOf } from '@/lib/assetUrl';

const horusOwl = pickAsset(horusOwlBundled, srcOf(horusOwlAsset));

export type PremiumFeatureKey =
  | 'narracao' | 'explicacao' | 'exemplo' | 'termos' | 'perguntar'
  | 'jurisprudencia' | 'videoaula' | 'grafo' | 'mapa_mental' | 'lembretes'
  | 'baixar' | 'anotacoes' | 'grifo' | 'flashcards' | 'questoes'
  | 'praticar' | 'favorito'
  | 'radar' | 'blog' | 'biblioteca' | 'aprender' | 'horus'
  | 'audioaula' | 'resumo' | 'resumo_download' | 'lei_seca'
  | 'questao_funcoes' | 'videoaula_funcoes'
  | 'chat_juridico' | 'chat_web' | 'chat_anexo' | 'pilulas' | 'default';

/** `pitch` = argumento de persuasão específico da área; `horusQuote` = fala do mascote Horus. */
type FeatureInfo = {
  title: string;
  description: string;
  pitch: string;
  horusQuote: string;
  icon: LucideIcon;
};

const FEATURES: Record<PremiumFeatureKey, FeatureInfo> = {
  narracao: {
    title: 'Narração com Voz Humana',
    description: 'Escute qualquer artigo com narração ilimitada, com voz natural e de alta definição.',
    pitch: 'Estude no trânsito, na academia ou onde quiser — o ordenamento jurídico inteiro narrado para você.',
    horusQuote: 'Quer ouvir a lei com voz humana enquanto faz suas tarefas? No Prime você escuta qualquer artigo sem limites!',
    icon: Volume2,
  },
  explicacao: {
    title: 'Explicações com IA Jurídica',
    description: 'A IA destrincha qualquer artigo em linguagem clara e didática.',
    pitch: 'Nunca mais trave em um dispositivo confuso: explicação com base doutrinária instantânea na hora.',
    horusQuote: 'Dispositivo confuso? Eu explico qualquer artigo para você em linguagem simples e descomplicada no Prime!',
    icon: Sparkles,
  },
  exemplo: {
    title: 'Exemplos Práticos Reais',
    description: 'Veja a norma aplicada em casos do dia a dia e situações reais.',
    pitch: 'Fixe o conteúdo com casos concretos — o que a banca e a prática jurídica cobram.',
    horusQuote: 'Quer ver como a lei se aplica na prática? No Prime você tem exemplos reais e didáticos de cada artigo!',
    icon: BookOpen,
  },
  termos: {
    title: 'Termos Jurídicos Explicados',
    description: 'Traduza o vocabulário técnico e juridiquês de cada artigo.',
    pitch: 'Domine o juridiquês: cada termo do dispositivo explicado em segundos.',
    horusQuote: 'Não deixe termos difíceis travarem seus estudos! Veja o significado instantâneo de cada palavra no Prime.',
    icon: BookOpen,
  },
  perguntar: {
    title: 'Assistente IA 24h no Artigo',
    description: 'Tire dúvidas específicas sobre o artigo com nossa assistente jurídica.',
    pitch: 'Um tutor jurídico dedicado pronto para esclarecer qualquer dúvida na hora.',
    horusQuote: 'Ficou com alguma dúvida sobre este artigo? Pergunte para nossa IA jurídica a qualquer momento no Prime!',
    icon: MessageCircle,
  },
  jurisprudencia: {
    title: 'Jurisprudência do STF e STJ',
    description: 'Súmulas vinculantes, temas de repercussão geral e acórdãos ligados ao artigo.',
    pitch: 'Cite o tribunal certo na petição e na prova — entendimento atualizado ao lado da lei.',
    horusQuote: 'Entenda como os tribunais superiores decidem sobre este artigo. Exclusivo para assinantes Prime!',
    icon: Scale,
  },
  videoaula: {
    title: 'Videoaulas Artigo por Artigo',
    description: 'Aulas didáticas em vídeo para aprofundar seu entendimento.',
    pitch: 'Um curso completo acoplado ao Vade Mecum, direto no ponto sem enrolação.',
    horusQuote: 'Aprenda assistindo! Videoaulas completas gravadas para cada artigo no Prime.',
    icon: PlayCircle,
  },
  grafo: {
    title: 'Grafo de Conexões',
    description: 'Visualize as remissões e relações deste artigo com todo o ordenamento.',
    pitch: 'Enxergue o sistema jurídico de forma visual e conectada.',
    horusQuote: 'Veja como este artigo se conecta com toda a legislação brasileira de forma visual no Prime!',
    icon: Network,
  },
  mapa_mental: {
    title: 'Mapas Mentais com IA',
    description: 'Mapas gerados pela IA para revisão rápida.',
    pitch: 'Revise um capítulo inteiro em 5 minutos na véspera da prova.',
    horusQuote: 'Mapas mentais inteligentes para acelerar sua memorização visual!',
    icon: Map,
  },
  lembretes: {
    title: 'Lembretes Inteligentes',
    description: 'Alertas de estudo por horário ou quando chegar na faculdade/trabalho.',
    pitch: 'Sua rotina de estudo no automático — o app te cobra no momento certo.',
    horusQuote: 'Receba lembretes automáticos para revisar este artigo no momento e local ideais!',
    icon: Bell,
  },
  baixar: {
    title: 'Baixar Artigo em PDF / Imagem',
    description: 'Exporte artigos comentados ou lei seca para imprimir ou estudar offline.',
    pitch: 'Leve seu material para a audiência e para o offline, com os seus grifos e anotações.',
    horusQuote: 'Baixe PDFs formatados e com alta resolução para levar para a audiência ou prova!',
    icon: Download,
  },
  anotacoes: {
    title: 'Anotações Pessoais',
    description: 'Anote em cada artigo e sincronize na nuvem entre aparelhos.',
    pitch: 'Monte o seu Vade Mecum comentado — anotações salvas para sempre, em qualquer aparelho.',
    horusQuote: 'Mantenha suas anotações e comentários sincronizados em todos os seus aparelhos para sempre!',
    icon: StickyNote,
  },
  grifo: {
    title: 'Grifos Ilimitados',
    description: 'Destaque pontos cruciais por toque manual, voz, foto ou com a IA.',
    pitch: 'Marque o que a banca cobra e volte direto ao ponto na hora da revisão.',
    horusQuote: 'Destaque o que mais cai nas provas com grifos manuais, por voz, foto ou inteligência artificial!',
    icon: Highlighter,
  },
  flashcards: {
    title: 'Flashcards de Memorização',
    description: 'Cartões inteligentes gerados com algoritmo de repetição espaçada.',
    pitch: 'Memorize prazos, exceções e requisitos legais sem esforço.',
    horusQuote: 'Nunca mais esqueça prazos e regras: use os flashcards do Prime para memorizar!',
    icon: Layers,
  },
  questoes: {
    title: 'Questões OAB e Concursos',
    description: 'Banco de questões com gabarito comentado e estatísticas por artigo.',
    pitch: 'Treine no padrão das bancas a partir do artigo que você está estudando agora.',
    horusQuote: 'Pratique com questões reais de concursos e da OAB ligadas diretamente ao artigo!',
    icon: HelpCircle,
  },
  praticar: {
    title: 'Praticar sem Limites',
    description: 'Questões da OAB e flashcards com repetição espaçada por artigo.',
    pitch: 'Teoria e prática no mesmo lugar: leia o dispositivo, responda e evolua.',
    horusQuote: 'Fixe o conteúdo resolvendo questões reais da OAB e flashcards com repetição espaçada!',
    icon: Layers,
  },
  favorito: {
    title: 'Artigos Favoritos Ilimitados',
    description: 'Guarde seus artigos essenciais em um só lugar para acesso rápido.',
    pitch: 'Sua biblioteca de artigos e leis mais consultadas sempre a um toque de distância.',
    horusQuote: 'Guarde quantos artigos quiser na sua lista VIP de favoritos para acesso instantâneo!',
    icon: Heart,
  },
  radar: {
    title: 'Radar Legislativo',
    description: 'Projetos de lei em tempo real com análise da IA.',
    pitch: 'Saiba da mudança antes do cliente perguntar e antes do edital sair.',
    horusQuote: 'Fique por dentro das últimas alterações legislativas em tempo real no Prime!',
    icon: Radar,
  },
  blog: {
    title: 'Blogger Jurídico Completo',
    description: 'Todos os artigos exclusivos, sem limite.',
    pitch: 'Conteúdo autoral atualizado para argumentar melhor e escrever melhor.',
    horusQuote: 'Artigos jurídicos profundos e análises práticas exclusivas para assinantes Prime!',
    icon: Newspaper,
  },
  biblioteca: {
    title: 'Biblioteca Completa',
    description: 'Acesso irrestrito a centenas de obras, manuais e doutrinas.',
    pitch: 'Acervo profissional liberado: leitura nativa, PDF, folheada, offline e no desktop.',
    horusQuote: 'Acesso ilimitado a toda a nossa biblioteca de livros e manuais doutrinários no Prime!',
    icon: Library,
  },
  aprender: {
    title: 'Trilha Aprender Ilimitada',
    description: 'Trilhas guiadas sem limite diário.',
    pitch: 'Do zero ao avançado com um caminho pronto — sem adivinhar por onde começar.',
    horusQuote: 'Avance nas trilhas de aprendizado gamificadas e conquiste sua aprovação no Prime!',
    icon: GraduationCap,
  },
  horus: {
    title: 'Horus 24h no WhatsApp',
    description: 'Assistente jurídica pessoal no seu WhatsApp.',
    pitch: 'Consulta jurídica na palma da mão, a qualquer hora, sem nem abrir o app.',
    horusQuote: 'Eu estou no seu WhatsApp pronto para responder qualquer dúvida jurídica a qualquer hora!',
    icon: Bot,
  },
  chat_juridico: {
    title: 'Chat Ilimitado',
    description: 'No plano gratuito é 1 interação por dia.',
    pitch: 'Pesquise teses, estruture peças e tire dúvidas sem contar mensagens.',
    horusQuote: 'Pesquise teses e tire dúvidas sem limites comigo no Chat Prime!',
    icon: MessageCircle,
  },
  chat_web: {
    title: 'Pesquisar na Internet',
    description: 'Busca em tempo real dentro do Chat.',
    pitch: 'Jurisprudência e notícias atualizadas no minuto em que você precisa.',
    horusQuote: 'Consulte informações e jurisprudências em tempo real na web através do Prime!',
    icon: Sparkles,
  },
  chat_anexo: {
    title: 'Análise de Documentos com IA',
    description: 'Envie PDFs ou imagens e deixe a IA extrair dados, responder dúvidas e analisar o documento inteiro para você.',
    pitch: 'Leia autos processuais inteiros em segundos. A IA encontra jurisprudências e fundamentos com base no seu documento.',
    horusQuote: 'Precisa analisar uma petição gigante ou documento longo? Me envie e eu destrincho os pontos mais importantes no Prime!',
    icon: FileText,
  },
  pilulas: {
    title: 'Pílulas de Áudio Ilimitadas',
    description: 'Acesse o acervo completo de Pílulas de Áudio dos maiores clássicos jurídicos.',
    pitch: 'Aprenda a essência dos livros e oab em poucos minutos. Uma pílula por dia, onde você estiver.',
    horusQuote: 'Gostou dessa pílula? Assine o Prime para destravar o acervo completo de áudios sem limites!',
    icon: Headphones,
  },
  audioaula: {
    title: 'Audioaulas sem Limite',
    description: 'Todo o acervo de aulas em áudio sem restrições.',
    pitch: 'Transforme o deslocamento em hora de estudo: todo o acervo de aulas em áudio.',
    horusQuote: 'Estude escutando nossas aulas em áudio onde você estiver com o Prime!',
    icon: Volume2,
  },
  resumo: {
    title: 'Resumos Ilimitados',
    description: 'Cornell, Feynman e mapas mentais de qualquer matéria.',
    pitch: 'Resumos esquematizados de alta qualidade para revisão rápida.',
    horusQuote: 'Acesse resumos completos e esquematizados para acelerar sua revisão no Prime!',
    icon: NotebookPen,
  },
  resumo_download: {
    title: 'Baixar Resumos em PDF',
    description: 'Exportar resumos em PDF de alta qualidade.',
    pitch: 'Leve o resumo impresso para a audiência, para a prova e para o offline.',
    horusQuote: 'Baixe todos os resumos em PDF para imprimir ou estudar offline!',
    icon: Download,
  },
  lei_seca: {
    title: 'Lei Seca sem Limite',
    description: 'Percorra a trilha da lei inteira, artigo por artigo.',
    pitch: 'Treinamento completo de leitura ativa da legislação seca.',
    horusQuote: 'Domine a letra da lei com nosso modo de leitura ativa sem limites no Prime!',
    icon: Gavel,
  },
  questao_funcoes: {
    title: 'Funções da Questão',
    description: 'Comentários da banca, mini-aula, teoria e pegadinhas em cada questão.',
    pitch: 'Entenda por que errou: comentário da banca, teoria e pegadinhas.',
    horusQuote: 'Desbloqueie comentários detalhados e explicações de cada questão no Prime!',
    icon: MessageCircle,
  },
  videoaula_funcoes: {
    title: 'Funções da Videoaula',
    description: 'Flashcards, resumos, lei seca, termos e questões da aula.',
    pitch: 'Cada aula vira material de estudo completo — sem assistir duas vezes.',
    horusQuote: 'Tenha acesso ao material de apoio completo acoplado a cada videoaula!',
    icon: PlayCircle,
  },
  default: {
    title: 'Funcionalidade Exclusiva Prime',
    description: 'Esta função faz parte do plano Prime.',
    pitch: 'Libere o Direito Prime completo e estude sem nenhum limite.',
    horusQuote: 'Desbloqueie o potencial completo do Vade Mecum Prime assinando o Prime!',
    icon: Crown,
  },
};

interface PremiumGateProps {
  open: boolean;
  onClose: () => void;
  /** Chave da funcionalidade — mostra ícone, título e descrição personalizados. */
  feature?: PremiumFeatureKey;
  /** Override manual (opcional). */
  title?: string;
  description?: string;
  /** Texto extra de uso (opcional). */
  usageLabel?: string;
}

// URL pública de demonstração de narração com voz humana em estúdio
const SAMPLE_NARRACAO_URL =
  'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/narracoes/CP_CODIGO_PENAL/fatiado/2__completo.wav';

const PremiumGateInner = ({
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
  const { user } = useAuth();

  // Modo de simulação para desenvolvedor (persistido para teste instantâneo)
  const isDev = Boolean(import.meta.env.DEV || isDevSimulatorEligible(user?.email));
  const [devTrialMode, setDevTrialMode] = useState<'eligible' | 'expired'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('direitoprime:dev_trial_state');
      if (saved === 'eligible' || saved === 'expired') return saved;
    }
    return 'expired';
  });

  const setDevState = (state: 'eligible' | 'expired') => {
    haptic.selection();
    setDevTrialMode(state);
    try {
      localStorage.setItem('direitoprime:dev_trial_state', state);
    } catch {}
  };

  // Verifica se o trial expirou ou se o usuário já utilizou os 3 dias
  const calculatedTrialExpired = useMemo(() => {
    if (!user) return false;
    if (isSimulatingExpired(user?.email)) return true;
    if (user.user_metadata?.trial_claimed === true || user.user_metadata?.trial_used === true) {
      return true;
    }
    const createdAt = new Date(user.created_at);
    let trialEndsAt = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    if (user.user_metadata?.trial_ends_at) {
      const metaTrial = new Date(user.user_metadata.trial_ends_at);
      if (!isNaN(metaTrial.getTime())) {
        trialEndsAt = metaTrial;
      }
    } else if (user.user_metadata?.trial_start) {
      const trialStart = new Date(user.user_metadata.trial_start).getTime();
      trialEndsAt = new Date(trialStart + (3 * 24 * 60 * 60 * 1000));
    }

    if (Date.now() > trialEndsAt.getTime()) return true;

    if (typeof localStorage !== 'undefined' && localStorage.getItem('direitoprime:device:trial_claimed')) {
      return true;
    }

    return false;
  }, [user]);

  // Sem teste grátis: o card sempre mostra a mensagem de cota + assinatura.
  const isTrialExpired = true; void calculatedTrialExpired;

  // Player de demonstração de narração
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoCurrentTime, setDemoCurrentTime] = useState('0:00');
  const [demoDuration, setDemoDuration] = useState('0:24');
  const demoAudioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayDemo = () => {
    haptic.selection();
    if (isPlayingDemo) {
      demoAudioRef.current?.pause();
      setIsPlayingDemo(false);
    } else {
      if (!demoAudioRef.current) {
        const audio = new Audio(SAMPLE_NARRACAO_URL);
        audio.ontimeupdate = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setDemoProgress((audio.currentTime / audio.duration) * 100);
            const m = Math.floor(audio.currentTime / 60);
            const s = Math.floor(audio.currentTime % 60);
            setDemoCurrentTime(`${m}:${s < 10 ? '0' : ''}${s}`);
            const dm = Math.floor(audio.duration / 60);
            const ds = Math.floor(audio.duration % 60);
            setDemoDuration(`${dm}:${ds < 10 ? '0' : ''}${ds}`);
          }
        };
        audio.onended = () => {
          setIsPlayingDemo(false);
          setDemoProgress(0);
          setDemoCurrentTime('0:00');
        };
        audio.onerror = () => {
          setIsPlayingDemo(false);
        };
        demoAudioRef.current = audio;
      }
      demoAudioRef.current
        .play()
        .then(() => setIsPlayingDemo(true))
        .catch((e) => {
          console.warn('[PremiumGate] Falha ao tocar demo:', e);
          setIsPlayingDemo(false);
        });
    }
  };

  useEffect(() => {
    if (!open) {
      if (demoAudioRef.current) {
        demoAudioRef.current.pause();
        demoAudioRef.current = null;
      }
      setIsPlayingDemo(false);
      setDemoProgress(0);
      setDemoCurrentTime('0:00');
      setShowBenefits(false);
    } else {
      track('assinatura_aberta', { modal: true, feature });
      logAreaEvent('assinatura_aberta', { modal: true, feature });
    }
  }, [open, feature]);

  // Mensalidade do plano anual (R$ 199,90/ano = R$ 16,66/mês, até 6x com juros)
  const isIOS = useMemo(() => Capacitor.getPlatform() === 'ios', []);
  const [mensalidade, setMensalidade] = useState('16,66');
  const [totalAnual, setTotalAnual] = useState('R$ 199,90/ano');
  const [economia, setEconomia] = useState('44%');

  useEffect(() => {
    if (!open) return;
    const loadPricing = async () => {
      try {
        const { isBillingAvailable, getProducts } = await import('@/lib/billing');
        if (isBillingAvailable()) {
          const prods = await getProducts();
          const anualProd = prods.find((p) => p.productId === 'prime_premium_anual');
          if (anualProd && anualProd.price) {
            const numMatch = anualProd.price.match(/[\d.,]+/);
            if (numMatch) {
              const rawVal = parseFloat(numMatch[0].replace('.', '').replace(',', '.'));
              if (!isNaN(rawVal)) {
                const mensalStr = (rawVal / 12).toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                setMensalidade(mensalStr);
                setTotalAnual(`${anualProd.price}/ano`);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[PremiumGate] Pricing fetch fallback:', err);
      }
    };
    loadPricing();
  }, [open]);

  const handleStartTrial = () => {
    haptic.medium();
    setShowBenefits(false);
    onClose();
    navigate('/assinatura?plano=anual&trial=1');
  };

  const handleGoToPlanos = (plano?: string) => {
    haptic.medium();
    setShowBenefits(false);
    onClose();
    navigate(plano ? `/assinatura?plano=${plano}` : '/assinatura');
  };

  const content = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop Escuro com Blur Suave */}
          <motion.div
            data-premium-gate="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200000] !pointer-events-auto"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          />

          {/* Bottom Sheet Modal Container que sobe de baixo para cima */}
          <motion.div
            data-premium-gate="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 sm:inset-0 sm:m-auto z-[200001] w-full sm:max-w-[460px] h-[90dvh] max-h-[820px] bg-[#0E0F12] border-t sm:border border-white/10 rounded-t-[28px] sm:rounded-[28px] shadow-[0_-16px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-foreground !pointer-events-auto"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Topo do Modal: Pílula de arrasto centralizada e Botão de Fechar Grande */}
            <div className="pt-3 px-5 pb-2 flex items-center justify-between shrink-0 relative z-30">
              {/* Pílula de arrasto Mobile */}
              <div className="flex-1 flex justify-start sm:justify-center">
                <span className="w-12 h-1.5 rounded-full bg-white/20" />
              </div>

              {/* Botão de Fechar Grande, Acessível e Responsivo (48x48dp) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  haptic.selection();
                  onClose();
                }}
                aria-label="Fechar modal"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:scale-90 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer select-none touch-manipulation shrink-0 shadow-sm"
              >
                <X className="w-6 h-6" strokeWidth={2.4} />
              </button>
            </div>

            {/* Conteúdo com rolagem suave e espaçamento refinado */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 pt-1 pb-6 space-y-4">
              {/* CAPA ELEGANTE E EXPLICATIVA */}
              {feature === 'audioaula' ? (
                <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-b from-[#2a080e] via-[#1a080c] to-[#0E0F12] p-5 shadow-2xl text-center">
                  <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/25 rounded-full blur-3xl" />
                  
                  {/* Logo da Coruja com pena e capelo em destaque */}
                  <div className="relative z-10 mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-3 flex items-center justify-center">
                    <img
                      src={logoCoruja}
                      alt="Direito Prime"
                      className="w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)]"
                    />
                  </div>

                  {/* Badge informativa de cota */}
                  <div className="relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary-foreground text-[11px] font-black uppercase tracking-wider mb-2">
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cota Mensal Atingida · 10 de 10 Áudios</span>
                  </div>

                  {/* Título e Explicação clara */}
                  <h2 className="relative z-10 text-xl sm:text-2xl font-serif italic font-bold text-white tracking-tight leading-snug">
                    Você atingiu sua cota de 10 áudio-aulas
                  </h2>
                  <p className="relative z-10 text-xs sm:text-[13px] text-zinc-300/90 mt-2 max-w-sm mx-auto leading-relaxed font-sans">
                    Seu plano gratuito deste mês foi totalmente aproveitado. Para continuar ouvindo agora sem restrições e liberar todo o acervo de áudio e leis, assine o Prime.
                  </p>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shadow-lg shadow-primary/10 mb-2.5">
                    <Icon className="w-7 h-7 text-primary" strokeWidth={2.2} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-display font-black text-white tracking-wide leading-tight">
                    {shownTitle}
                  </h2>
                  <p className="text-xs sm:text-[13px] text-zinc-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    {shownDesc}
                  </p>
                  {usageLabel && (
                    <p className="text-[11.5px] font-semibold text-amber-400/90 mt-2">
                      {usageLabel}
                    </p>
                  )}
                </div>
              )}

              {/* Demonstrador de Áudio (apenas quando não for cota esgotada e for narração) */}
              {feature === 'narracao' && (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Demonstração com Voz Humana</p>
                    <p className="text-[10.5px] text-zinc-400 truncate">Ouça a narração em estúdio</p>
                  </div>
                  <button
                    type="button"
                    onClick={togglePlayDemo}
                    className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary-light active:scale-95 shadow transition-all shrink-0"
                  >
                    {isPlayingDemo ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Ouvir prévia
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* BLOCO DE AÇÃO PRINCIPAL E PLANOS */}
              <div className="space-y-3 pt-1">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleGoToPlanos('anual')}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary via-rose-600 to-primary text-primary-foreground font-display font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Crown className="w-4 h-4 fill-current" />
                    <span>DESBLOQUEAR TODO O CONTEÚDO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      onClose();
                      navigate('/minha-cota');
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-[0.98] border border-white/10 text-zinc-200 font-sans font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>VER MINHA COTA</span>
                  </button>
                </div>

                {/* Cards dos Planos: Mensal na Esquerda, Anual na Direita */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {/* Plano Mensal (Esquerda) */}
                  <div
                    onClick={() => handleGoToPlanos('mensal')}
                    className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98]"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[11px] font-bold uppercase text-white tracking-wider">
                          Mensal
                        </span>
                        <span className="text-[9px] font-semibold text-zinc-400">
                          Flexível
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-black text-white leading-tight">
                        {brl(PRECO_MENSAL)}<span className="text-[11px] font-normal text-zinc-400">/mês</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-2.5 block leading-tight">
                      Sem fidelidade · Cancele quando quiser
                    </span>
                  </div>

                  {/* Plano Anual (Direita - Destaque com preço cheio invertido) */}
                  <div
                    onClick={() => handleGoToPlanos('anual')}
                    className="p-3.5 rounded-xl border border-primary/60 bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98] relative overflow-hidden shadow-lg shadow-primary/10"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[11px] font-bold uppercase text-white tracking-wider">
                          Anual
                        </span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                          -44% OFF
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-black text-white leading-tight">
                        {brl(PRECO_ANUAL)}<span className="text-[11px] font-normal text-zinc-400">/ano</span>
                      </p>
                    </div>
                    <span className="text-[10px] text-amber-300 font-medium mt-2.5 block leading-tight">
                      Parcela em até 6x
                    </span>
                  </div>
                </div>

                {/* Link secundário para benefícios detalhados */}
                <button
                  type="button"
                  onClick={() => {
                    haptic.selection();
                    setShowBenefits(true);
                  }}
                  className="w-full py-1.5 text-center text-[11px] text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1"
                >
                  <span>Ver todos os benefícios incluídos</span>
                  <ChevronLeft className="w-3 h-3 rotate-180" />
                </button>

                {/* Selo Minimalista de Garantia */}
                <p className="text-center text-[10px] text-zinc-500 pt-0.5">
                  Garantia de 7 dias · Cancele quando quiser com 1 clique
                </p>
              </div>
            </div>
          </motion.div>

          {/* Camada de benefícios completos (Drawer) */}
          <AnimatePresence>
            {showBenefits && (
              <motion.div
                data-premium-gate="true"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="fixed inset-x-0 bottom-0 z-[200010] max-h-[88dvh] mx-auto w-full md:max-w-[600px] bg-card border-t border-border md:border-x rounded-t-3xl overflow-hidden flex flex-col shadow-2xl !pointer-events-auto"
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div
                  className="relative py-3.5 px-4 flex items-center gap-2 shrink-0 overflow-hidden"
                  style={{
                    background:
                      'linear-gradient(135deg, hsl(var(--brand-burgundy-deep)) 0%, hsl(var(--primary)) 100%)',
                  }}
                >
                  <Scale className="absolute -right-3 -bottom-5 w-20 h-20 text-primary-foreground/10 pointer-events-none" />
                  <button
                    onClick={() => {
                      haptic.selection();
                      setShowBenefits(false);
                    }}
                    aria-label="Voltar"
                    className="relative p-1.5 rounded-full hover:bg-primary-foreground/15 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-primary-foreground" />
                  </button>
                  <span className="relative flex-1 text-center text-[11px] font-extrabold tracking-[0.2em] uppercase text-primary-foreground">
                    Tudo que você desbloqueia
                  </span>
                  <button
                    onClick={() => {
                      haptic.selection();
                      setShowBenefits(false);
                      onClose();
                    }}
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

                <div className="shrink-0 border-t border-border px-5 pt-3 pb-[max(1rem,var(--sai-bottom))] bg-card max-w-md mx-auto w-full">
                  <button
                    onClick={() => handleGoToPlanos('anual')}
                    className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-light transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4 fill-current" />
                    {isTrialExpired ? 'Desbloquear Todo o Conteúdo' : 'Testar 3 Dias Grátis'} · R$ {mensalidade}/mês
                  </button>
                  <button
                    onClick={() => {
                      haptic.selection();
                      setShowBenefits(false);
                      onClose();
                      navigate('/assinatura');
                    }}
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

/**
 * Nunca mostra o bloqueio/"teste acabou" enquanto a assinatura ainda está sendo
 * confirmada, nem para quem já é assinante.
 */
const PremiumGate = (props: PremiumGateProps) => {
  const { isPremium, loading } = useSubscription();
  if (props.open && (loading || isPremium)) return null;
  return <PremiumGateInner {...props} />;
};

export { PremiumGate };
export default PremiumGate;


