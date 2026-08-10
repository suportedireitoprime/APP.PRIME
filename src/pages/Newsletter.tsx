import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Newspaper, BookOpen, Radar, Bell, Check, Loader2, Send, Film, Video } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { toast } from 'sonner';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { useGoBack } from '@/hooks/useGoBack';

interface Preferencias {
  noticias: boolean;
  leis_do_dia: boolean;
  radar_legislativo: boolean;
  tematica_juridica: boolean;
  boletins_juridicos: boolean;
  leis_monitoradas: string[];
}

const DEFAULT_PREFS: Preferencias = {
  noticias: true,
  leis_do_dia: true,
  radar_legislativo: true,
  tematica_juridica: true,
  boletins_juridicos: true,
  leis_monitoradas: [],
};

const Newsletter = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ativo, setAtivo] = useState(false);
  const [email, setEmail] = useState('');
  const [prefs, setPrefs] = useState<Preferencias>(DEFAULT_PREFS);
  const [subId, setSubId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    loadSubscription();
  }, [user]);

  const loadSubscription = async () => {
    const { data } = await supabase
      .from('newsletter_subscriptions' as any)
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (data) {
      const d = data as any;
      setSubId(d.id);
      setAtivo(d.ativo);
      setEmail(d.email);
      setPrefs(d.preferencias || DEFAULT_PREFS);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      ...(subId ? { id: subId } : {}),
      user_id: user.id,
      email,
      ativo,
      preferencias: prefs,
    };

    const { error } = await supabase
      .from('newsletter_subscriptions' as any)
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      toast.error('Erro ao salvar preferências: ' + error.message);
      console.error('Save error:', error);
    } else {
      toast.success(ativo ? 'Newsletter ativado!' : 'Newsletter desativado');
      if (!subId) loadSubscription();
    }
    setSaving(false);
  };

  const toggleLei = (tabela: string) => {
    setPrefs(p => ({
      ...p,
      leis_monitoradas: p.leis_monitoradas.includes(tabela)
        ? p.leis_monitoradas.filter(l => l !== tabela)
        : [...p.leis_monitoradas, tabela],
    }));
  };

  const TOPICS = [
    { key: 'noticias' as const, label: 'Notícias Jurídicas', desc: 'Principais notícias da Câmara e portais jurídicos', icon: Newspaper, color: 'from-blue-500 to-cyan-600' },
    { key: 'leis_do_dia' as const, label: 'Leis do Dia', desc: 'Resenha diária do DOU — atos e normas publicados', icon: BookOpen, color: 'from-emerald-500 to-green-600' },
    { key: 'radar_legislativo' as const, label: 'Radar Legislativo', desc: 'PLs em tramitação, votação e sanção', icon: Radar, color: 'from-violet-500 to-purple-600' },
    { key: 'tematica_juridica' as const, label: 'Temática Jurídica', desc: 'Recomendação de filmes e séries jurídicas (Sexta)', icon: Film, color: 'from-pink-500 to-rose-600' },
    { key: 'boletins_juridicos' as const, label: 'Boletins Jurídicos', desc: 'Alertas em vídeo de jurisprudência e normas quentes', icon: Video, color: 'from-orange-500 to-amber-600' },
  ];

  const mobileHeader = (
    <PageHeader
      title="Newsletter Diário"
      subtitle="Receba um resumo jurídico no seu e-mail todo dia"
      onBack={() => goBack()}
      leading={
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary" />
        </div>
      }
    />
  );


  if (loading) {
    return (
      <DesktopPageLayout wide activeId="ferramentas" title="Newsletter" subtitle="Carregando..." mobileHeader={mobileHeader}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DesktopPageLayout>
    );
  }

  const content = (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] lg:px-0 space-y-6">
      {/* Toggle ativo */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-foreground">Newsletter Ativo</p>
            <p className="text-[11px] text-muted-foreground">Receber e-mail diário às 7h</p>
          </div>
        </div>
        <button
          onClick={() => setAtivo(!ativo)}
          className={`w-12 h-7 rounded-full transition-colors relative ${ativo ? 'bg-primary' : 'bg-muted'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${ativo ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <label className="text-sm font-display text-foreground">E-mail de envio</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          placeholder="seu@email.com"
        />
      </div>

      {/* Tópicos */}
      <div className={`space-y-3 transition-opacity duration-300 ${!ativo ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
        <h2 className="font-display text-sm font-bold text-foreground">Tópicos do Newsletter</h2>
        {TOPICS.map((topic, i) => {
          const Icon = topic.icon;
          const active = prefs[topic.key];
          return (
            <motion.details
              key={topic.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`group border rounded-xl overflow-hidden transition-all ${active ? 'bg-card border-border' : 'bg-card/50 border-border/50'}`}
            >
              <summary className="flex items-center gap-3 w-full p-3.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${active ? 'bg-primary' : 'bg-muted'}`}>
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-display text-sm font-bold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{topic.label}</p>
                </div>
                
                {/* Switch (chavinha) */}
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    setPrefs(p => ({ ...p, [topic.key]: !active }));
                  }}
                  className={`w-10 h-6 rounded-full transition-colors relative flex shrink-0 items-center ${active ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform ${active ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </summary>
              <div className="px-14 pb-3.5 pt-0 text-[12px] text-muted-foreground">
                {topic.desc}
              </div>
            </motion.details>
          );
        })}
      </div>

      {/* Salvar */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleSave}
        disabled={saving || !email}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-display font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {saving ? 'Salvando...' : 'Salvar Preferências'}
      </motion.button>
    </div>
  );

  return (
    <DesktopPageLayout wide activeId="ferramentas" title="Newsletter Diário" subtitle="Receba um resumo jurídico no seu e-mail" mobileHeader={mobileHeader}>
      {content}
    </DesktopPageLayout>
  );
};

export default Newsletter;
