import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Send, Sparkles, MessageCircleWarning, Bug, HelpCircle, Loader2,
  CheckCircle2, X, MessageSquareHeart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';

const TAGS = [
  { id: 'funcionalidade', label: 'Nova Função', icon: Sparkles,           color: 'text-primary'     },
  { id: 'critica',        label: 'Feedback',    icon: MessageCircleWarning, color: 'text-orange-400' },
  { id: 'bug',            label: 'Problema/Bug',icon: Bug,                color: 'text-red-400'     },
  { id: 'duvida',         label: 'Dúvida',      icon: HelpCircle,         color: 'text-sky-400'     },
];

export default function Opiniao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const [comentario, setComentario] = useState('');
  const [email, setEmail] = useState('');
  const [tag, setTag] = useState('funcionalidade');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Imagem muito grande (máx 5MB)'); return; }
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Você precisa estar logado'); return; }
    const texto = comentario.trim();
    if (texto.length < 5)   { toast.error('Escreva pelo menos 5 caracteres'); return; }
    if (texto.length > 2000){ toast.error('Máximo 2000 caracteres'); return; }

    setSending(true);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('feedback-photos')
          .upload(path, photoFile, { upsert: false, contentType: photoFile.type });
        if (upErr) throw upErr;
        photo_url = path;
      }

      const displayName =
        (user.user_metadata as any)?.display_name ??
        (user.user_metadata as any)?.full_name ??
        user.email?.split('@')[0] ?? null;

      const { error } = await supabase.from('app_feedback' as any).insert({
        user_id: user.id,
        email: email.trim() || user.email || null,
        display_name: displayName,
        comentario: texto,
        tag,
        photo_url,
        is_premium: !!isPremium,
        platform: Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'web',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
      });
      if (error) throw error;

      setSent(true);
      setTimeout(() => navigate(-1), 2000);
    } catch (e: any) {
      console.error('[opiniao] erro', e);
      toast.error('Não foi possível enviar. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <PageHeader title="Sua Opinião" onBack={() => navigate(-1)} />

      <main className="flex-1 flex flex-col pt-4">
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center pb-20"
            >
              <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Recebido com Sucesso!</h2>
              <p className="text-muted-foreground font-body max-w-xs">
                Obrigado por nos ajudar a construir um aplicativo cada vez melhor para os seus estudos.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col"
            >
              <div className="px-5 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <MessageSquareHeart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground">Como podemos melhorar?</h1>
                  <p className="text-xs font-body text-muted-foreground mt-0.5">
                    Envie sugestões, dúvidas ou reporte problemas.
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-6">
                
                {/* Tags de recomendação */}
                <section>
                  <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Sobre o quê você quer falar?
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {TAGS.map(t => {
                      const Ic = t.icon;
                      const active = tag === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setTag(t.id)}
                          className={`flex flex-col items-center justify-center gap-2 px-3 py-4 rounded-2xl border transition-all ${
                            active
                              ? 'bg-primary/15 border-primary text-foreground shadow-sm scale-[0.98]'
                              : 'bg-card border-border text-foreground/70 hover:bg-secondary'
                          }`}
                        >
                          <div className={`p-2 rounded-full ${active ? 'bg-primary' : 'bg-secondary'}`}>
                            <Ic className={`w-5 h-5 ${active ? 'text-primary-foreground' : t.color}`} />
                          </div>
                          <span className="text-sm font-body font-medium text-center">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Comentário */}
                <section>
                  <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Sua mensagem
                  </p>
                  <div className="relative">
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      placeholder="Descreva aqui com o máximo de detalhes..."
                      maxLength={2000}
                      rows={5}
                      className="w-full resize-none rounded-2xl bg-card border border-border px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground/50 font-body text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-foreground/70 hover:bg-secondary transition-colors"
                      aria-label="Anexar foto"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  </div>
                  <div className="mt-1.5 flex justify-end">
                    <span className="text-[11px] text-muted-foreground/70 font-body">
                      {comentario.length}/2000
                    </span>
                  </div>
                  
                  {photoPreview && (
                    <div className="mt-3 relative w-32 h-32 rounded-xl overflow-hidden border border-border shadow-sm">
                      <img src={photoPreview} alt="anexo" className="w-full h-full object-cover" />
                      <button
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-black transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </section>

                {/* Email opcional */}
                <section>
                  <p className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    E-mail para retorno <span className="normal-case text-muted-foreground/50 font-normal">(opcional)</span>
                  </p>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={user?.email || 'voce@exemplo.com'}
                    className="w-full rounded-2xl bg-card border border-border px-4 py-3.5 text-foreground placeholder:text-muted-foreground/50 font-body text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
                  />
                </section>
              </div>

              {/* Sticky bottom button */}
              <div className="p-5 border-t border-border bg-background/80 backdrop-blur-lg pb-[calc(1.25rem+var(--safe-bottom))]">
                <button
                  onClick={handleSubmit}
                  disabled={sending || comentario.trim().length < 5}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-body font-bold text-base disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all shadow-md shadow-primary/20"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {sending ? 'Enviando...' : 'Enviar Feedback'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
