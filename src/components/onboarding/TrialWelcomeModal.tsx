import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles, 
  GraduationCap, 
  Layers, 
  Compass, 
  WifiOff, 
  ChevronRight, 
  Loader2, 
  Crown,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import primeLogoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import authCourtroomScene from '@/assets/auth-courtroom-scene.webp';

interface Props {
  onDone: () => void;
}

const UNLOCKED_FEATURES = [
  {
    icon: BookOpen,
    title: 'Vade Mecum Inteligente',
    metric: '+150k Artigos',
    desc: 'CF, Códigos e Leis com Áudio Nativo, Notas e Doutrina integrada.',
    badgeColor: 'bg-red-500/20 text-rose-200 border-red-500/30',
  },
  {
    icon: Sparkles,
    title: 'Tutor IA Jurídica Ilimitado',
    metric: 'IA 24 Horas',
    desc: 'Tire dúvidas jurídicas em segundos com fundamentação legal precisa.',
    badgeColor: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
  },
  {
    icon: GraduationCap,
    title: 'Videoaulas & Audioaulas',
    metric: '+2.500 Aulas',
    desc: 'Didática visual e resumos comentados para Faculdade, OAB e Concursos.',
    badgeColor: 'bg-rose-500/20 text-rose-200 border-rose-500/30',
  },
  {
    icon: Layers,
    title: 'Questões & Flashcards',
    metric: '+65k Questões',
    desc: 'Pratique com repetição espaçada, métricas de acertos e gabarito fundamentado.',
    badgeColor: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  },
  {
    icon: Compass,
    title: 'Radar & Jurisprudência',
    metric: 'STF e STJ',
    desc: 'Súmulas, teses vinculantes e alterações legislativas atualizadas em tempo real.',
    badgeColor: 'bg-sky-500/20 text-sky-200 border-sky-500/30',
  },
  {
    icon: WifiOff,
    title: 'Multiplataforma & Modo Offline',
    metric: 'Sem Internet',
    desc: 'Estude no celular, tablet e desktop mesmo sem conexão à rede.',
    badgeColor: 'bg-violet-500/20 text-violet-200 border-violet-500/30',
  },
];

export default function TrialWelcomeModal({ onDone }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const startTrial = async () => {
    haptic.success();
    if (!user) {
      onDone();
      return;
    }
    setLoading(true);
    try {
      // 3 dias de degustação PRO
      const trialEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.auth.updateUser({
        data: { trial_ends_at: trialEndsAt }
      });
      if (error) {
        console.error('Failed to update trial_ends_at:', error);
      }
      try {
        localStorage.setItem('direitoprime:device:trial_claimed', user.id);
        localStorage.setItem('direitoprime:device:trial_claimed_at', String(Date.now()));
        import('idb-keyval').then(({ set }) => {
          set('direitoprime:device:trial_claimed', user.id);
        }).catch(() => {});
      } catch {}

      // Agenda lembretes do término do período
      import('@/lib/trialReminders').then(({ scheduleTrialReminder }) => {
        scheduleTrialReminder('anual').catch(() => {});
      }).catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      onDone();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col w-full h-full min-h-dvh bg-gradient-to-b from-[#8B0E23] via-[#35060E] to-[#0D0507] text-white overflow-y-auto overflow-x-hidden select-none">
      {/* Grid animado padrão do projeto */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-15">
        <ShapeGrid
          speed={0.3}
          squareSize={48}
          direction="diagonal"
          borderColor="rgba(255, 255, 255, 0.08)"
          hoverFillColor="rgba(224, 31, 71, 0.15)"
          shape="square"
          hoverTrailAmount={4}
        />
      </div>

      {/* Imagem de fundo elegante no topo com máscara suave */}
      <div className="absolute top-0 inset-x-0 h-80 sm:h-96 z-0 pointer-events-none overflow-hidden">
        <img
          src={authCourtroomScene}
          alt=""
          className="w-full h-full object-cover opacity-25 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#8B0E23]/40 via-[#8B0E23]/80 to-[#0D0507]" />
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-500/40 rounded-full blur-3xl pointer-events-none" 
        />
      </div>

      {/* Conteúdo Principal com rolagem suave */}
      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 sm:px-6 pt-[calc(1.25rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-36">
        {/* Logo do Direito Prime no topo */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full flex items-center justify-center pt-2 mb-3 pointer-events-none"
        >
          <motion.img
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            src={primeLogoBundled}
            alt="Direito Prime"
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]"
          />
        </motion.div>

        {/* Badge de boas-vindas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="flex items-center justify-center mb-2"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-rose-200 text-[11px] sm:text-xs font-black uppercase tracking-widest shadow-inner">
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Seu Presente de Boas-Vindas</span>
          </div>
        </motion.div>

        {/* Título Principal e Subtítulo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="text-center space-y-2 mb-6"
        >
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-wide uppercase leading-tight drop-shadow-md">
            Acesso ao Aplicativo Completo
          </h1>
          <p className="font-body text-xs sm:text-sm md:text-base text-rose-100/80 max-w-md mx-auto leading-relaxed">
            Desbloqueamos o <b className="text-white font-bold">Direito Prime PRO</b> para você experimentar tudo na prática sem limitações.
          </p>
        </motion.div>

        {/* Barra de resumo de liberação */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          className="mb-4 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-between gap-3 shadow-md"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white/90">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>6 Módulos Premium 100% Desbloqueados</span>
          </div>
          <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
            Degustação Ativa
          </span>
        </motion.div>

        {/* Catálogo de Funções com Métricas */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {UNLOCKED_FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + idx * 0.05, duration: 0.3 }}
                className="group relative bg-black/40 border border-white/10 hover:border-white/20 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3 backdrop-blur-md shadow-lg transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600/40 via-primary/30 to-black/60 border border-red-500/30 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-rose-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <h2 className="font-bold text-xs sm:text-sm text-white/95 leading-tight truncate">
                      {feat.title}
                    </h2>
                    <span className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 rounded border tracking-wider shrink-0 ${feat.badgeColor}`}>
                      {feat.metric}
                    </span>
                  </div>
                  <p className="font-body text-[11px] sm:text-xs text-rose-100/70 leading-snug line-clamp-2">
                    {feat.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Painel Fixo de Ação do Iniciar o Aplicativo */}
      <div className="fixed bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-[#0D0507] via-[#0D0507]/95 to-transparent pb-[calc(1.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
        <div className="max-w-xl mx-auto w-full flex flex-col items-center">
          <Button
            onClick={startTrial}
            disabled={loading}
            className="btn-shine-loop relative overflow-hidden w-full h-14 sm:h-16 rounded-2xl font-display text-base sm:text-lg font-black bg-gradient-to-r from-red-600 via-primary to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-[0_8px_30px_rgba(224,31,71,0.45)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer border border-white/20"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <span>Iniciar 3 Dias Gratuitos</span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </>
            )}
          </Button>

          <p className="font-body text-[11px] sm:text-xs text-rose-200/70 font-semibold uppercase tracking-widest mt-3 text-center">
            Sem cartão de crédito · Sem compromisso
          </p>
        </div>
      </div>
    </div>
  );
}
