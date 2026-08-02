import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { showReminderOverlay, hideReminderOverlay } from '@/lib/floatingReminder';

type DispatchRow = {
  id: string;
  reminder_id: string;
  reminder_type: 'reading' | 'article_time' | 'location' | 'questoes';
  canal: string;
  status: string;
  livro_titulo?: string | null;
  article_titulo?: string | null;
  created_at?: string;
};

type BannerItem = {
  id: string;
  titulo: string;
  subtitulo: string;
  route: string | null;
};

/**
 * Banner que aparece quando um lembrete dispara com o app aberto.
 * Escuta em tempo real inserções em `reminder_dispatch_log` para o user atual
 * e também o evento local `lembrete-in-app` (geofence disparado no device).
 * Treme de tempos em tempos pra chamar atenção e some sozinho depois de 20s.
 */
export function ReminderInAppBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<BannerItem | null>(null);
  const [shake, setShake] = useState(0);

  const mostrar = (b: BannerItem) => {
    setItem(b);
    setShake((n) => n + 1);
    haptic.selection?.();
    // Se o app não está em primeiro plano, mostra o card flutuante (Android)
    // ou a Live Activity (iPhone) por cima do que a pessoa estiver fazendo.
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      void showReminderOverlay({
        id: b.id,
        titulo: b.titulo,
        subtitulo: b.subtitulo,
        deepLink: b.route,
      });
      window.setTimeout(() => { void hideReminderOverlay(b.id); }, 5 * 60_000);
    }
    window.setTimeout(() => setItem((cur) => (cur?.id === b.id ? null : cur)), 20_000);
  };

  // Tremida periódica enquanto o banner estiver visível
  useEffect(() => {
    if (!item) return;
    const t = window.setInterval(() => setShake((n) => n + 1), 3500);
    return () => window.clearInterval(t);
  }, [item]);

  // Evento local (geofence disparado no próprio device)
  useEffect(() => {
    const onLocal = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      mostrar({
        id: `local-${Date.now()}`,
        titulo: d.titulo || '🔔 Lembrete',
        subtitulo: d.mensagem || 'Você chegou no local.',
        route: d.route ?? null,
      });
    };
    window.addEventListener('lembrete-in-app', onLocal);
    return () => window.removeEventListener('lembrete-in-app', onLocal);
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`reminder-dispatch-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reminder_dispatch_log',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as DispatchRow;
          if (!row || row.status !== 'sent') return;

          const titulo =
            row.reminder_type === 'reading'
              ? `📖 Hora de ler${row.livro_titulo ? ` · ${row.livro_titulo}` : ''}`
              : row.reminder_type === 'article_time'
              ? `⏰ Lembrete${row.article_titulo ? ` · ${row.article_titulo}` : ''}`
              : row.reminder_type === 'questoes'
              ? '🎯 Hora de praticar questões'
              : '📍 Lembrete de local';

          const subtitulo =
            row.reminder_type === 'questoes'
              ? 'Bora resolver suas questões agora?'
              : row.canal === 'horus_whatsapp' || row.canal === 'horus'
              ? 'Enviado no WhatsApp pelo Horus'
              : row.canal === 'push'
              ? 'Notificação enviada'
              : 'Lembrete disparado';

          const route =
            row.reminder_type === 'questoes'
              ? '/questoes/praticar'
              : row.reminder_type === 'reading'
              ? '/biblioteca'
              : null;

          mostrar({ id: row.id, titulo, subtitulo, route });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || !item) return null;

  return (
    <div
      className="fixed left-1/2 top-2 z-[80] w-full max-w-[92vw] -translate-x-1/2 px-2 sm:w-[520px]"
      role="status"
      aria-live="polite"
    >
      <motion.div
        key={shake}
        initial={{ opacity: 1, x: 0 }}
        animate={{ x: [0, -8, 8, -6, 6, -3, 3, 0], rotate: [0, -1.2, 1.2, -0.8, 0.8, 0] }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
        className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/15 px-4 py-3 shadow-lg backdrop-blur-md"
      >
        <Bell className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="truncate font-semibold text-foreground">{item.titulo}</p>
          <p className="truncate text-xs text-muted-foreground">{item.subtitulo}</p>
        </div>
        {item.route && (
          <button
            onClick={() => { haptic.selection?.(); const r = item.route!; setItem(null); navigate(r); }}
            className="flex min-h-[44px] items-center gap-1 rounded-full bg-primary px-4 text-[14px] font-bold text-primary-foreground active:scale-[0.98]"
          >
            Ir <ArrowRight className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => setItem(null)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/20 hover:text-foreground"
          aria-label="Dispensar aviso"
        >
          <X className="h-5 w-5" />
        </button>
      </motion.div>
    </div>
  );
}

export default ReminderInAppBanner;
