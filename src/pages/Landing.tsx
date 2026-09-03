import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, GraduationCap, Scale, FileText, BookOpen, Sparkles,
  Smartphone, Headphones, ChevronDown,
} from 'lucide-react';
import { trackStartJourney } from '@/lib/fbPixel';
import {pickAsset, srcOf } from '@/lib/assetUrl';
import { useHideSplashScreen } from '@/hooks/useHideSplashScreen';

import logoAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import logoBundled from '@/assets/bundled/logo-direitoprime-v2.webp';
import HeroTribunal from '@/components/landing/HeroTribunal';
import AppShowcase from '@/components/landing/AppShowcase';
const appLogo = pickAsset(logoBundled, srcOf(logoAsset));

const UNIVERSITIES = ['USP', 'UNICAMP', 'UFRJ', 'UFMG', 'UFRGS', 'UnB', 'UFSC', 'UFPR', 'PUC-RS', 'FGV Direito', 'Mackenzie', 'PUC-SP', 'UERJ', 'UFC', 'UFPE'];

const FEATURES = [
  { icon: GraduationCap, label: 'Aprovação na Faculdade', desc: 'Resumos, aulas e simulados para você tirar nota alta e nunca mais pegar DP.' },
  { icon: Scale, label: 'OAB 1ª Fase', desc: 'Questões comentadas, vade mecum atualizado e treino focado em aprovação.' },
  { icon: FileText, label: 'OAB 2ª Fase', desc: 'Peças práticas, recursos e tudo que você precisa para cruzar a linha de chegada.' },
  { icon: Sparkles, label: 'Flashcards e Mapas Mentais', desc: 'Memorize o que importa com método ativo, sem decoreba e com fixação real.' },
  { icon: BookOpen, label: 'Biblioteca Jurídica Completa', desc: 'Códigos, leis, súmulas e doutrina em um só lugar, sempre atualizado.' },
];

const FAQ_ITEMS = [
  { q: 'O app é gratuito?', a: 'Sim, você pode começar grátis e explorar diversas funções. Para acesso ilimitado a todos os recursos (Vade Mecum completo, biblioteca, IA sem limites, etc.), há um plano Premium acessível.' },
  { q: 'Serve para faculdade e OAB?', a: 'Sim. O conteúdo cobre desde o básico da graduação até OAB 1ª e 2ª fase, com resumos, questões, videoaulas e simulados.' },
  { q: 'O conteúdo é atualizado?', a: 'Sim. A legislação vem direto do site oficial (Planalto) e nossos resumos, questões e súmulas são revisados constantemente pela nossa equipe.' },
  { q: 'Funciona no celular e no computador?', a: 'Sim. Você pode usar no navegador do celular, tablet ou computador. Também temos versão instalável (PWA) que funciona offline em muitos recursos.' },
  { q: 'Como funciona a IA?', a: 'A assistente jurídica fica disponível 24h. Ela tira dúvidas, explica artigos, ajuda em trabalhos e prepara para provas, sempre com precisão e contexto.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, o cancelamento é imediato e sem taxas. Você mantém acesso até o fim do período pago.' },
];

const TESTIMONIALS = [
  { nome: 'Marina Alves', papel: 'Estudante · 6º semestre', texto: 'Consegui organizar toda a minha rotina de estudos. Os resumos e flashcards mudaram minhas notas.' },
  { nome: 'Rafael Souza', papel: 'Aprovado OAB 1ª fase', texto: 'As questões comentadas e o vade mecum atualizado foram decisivos na minha aprovação.' },
  { nome: 'Camila Ferreira', papel: 'Concurseira', texto: 'Tudo em um só lugar. Não preciso mais abrir cinco sites diferentes para estudar.' },
  { nome: 'Thiago Lima', papel: 'Advogado', texto: 'Uso no dia a dia do escritório para consultar legislação comentada. Rápido e confiável.' },
];

const FaqItem = ({ item, index }: { item: { q: string; a: string }; index: number }) => {
  const [open, setOpen] = useState(false);
  const faqId = `faq-item-${index}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={open}
        aria-controls={faqId}
        aria-label={`Pergunta: ${item.q}`}
      >
        <span className="text-foreground text-sm font-semibold flex-1">{item.q}</span>
        <ChevronDown
          className="w-4 h-4 text-primary flex-shrink-0 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={faqId}
            role="region"
            aria-label={item.q}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

import { Capacitor } from '@capacitor/core';

const Landing = () => {
  const navigate = useNavigate();

  // SEO & Título dinâmico da Landing Page
  useEffect(() => {
    document.title = 'Direito Prime - A Plataforma Definitiva de Estudos Jurídicos';
  }, []);

  // Se estiver rodando nativo no Android ou iOS, abre a Landing 100% Nativa (Compose/SwiftUI)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      import('@/plugins/NativeAuthPlugin').then(({ NativeAuth }) => {
        NativeAuth.openLanding().then((res) => {
          if (res?.success) {
            navigate('/');
          }
        }).catch(() => {});
      }).catch(() => {});
    }
  }, [navigate]);

  const handleStart = useCallback((origem: string) => {
    trackStartJourney(origem);
    if (Capacitor.isNativePlatform()) {
      import('@/plugins/NativeAuthPlugin').then(({ NativeAuth }) => {
        NativeAuth.openAuth({ mode: 'signup' }).then((res) => {
          if (res?.success) navigate('/');
        }).catch(() => navigate('/auth'));
      }).catch(() => navigate('/auth'));
      return;
    }
    navigate('/auth');
  }, [navigate]);

  const handleConhecer = useCallback(() => {
    document.getElementById('conhecer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <main role="main" className="min-h-[100dvh] w-full bg-background overflow-x-hidden relative">
      {/* ───── HERO ───── */}
      <div className="relative">
        {/* Navbar sobre o hero */}
        <nav
          className="absolute top-0 inset-x-0 z-30 px-4 lg:px-8"
          style={{ paddingTop: 'calc(1.25rem + var(--sai-top))' }}
        >
          <div className="flex flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
            <Link to="/landing" className="flex items-center gap-3 min-w-0">
              <div className="relative shine-effect rounded-full overflow-hidden bg-background/40 h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 shrink-0 flex items-center justify-center">
                <img src={appLogo} alt="Direito Prime" width={80} height={80} loading="eager" decoding="async" className="h-full w-full object-contain drop-shadow-2xl" />
                <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.3)' }} />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-foreground font-semibold uppercase whitespace-nowrap text-[17px] sm:text-xl lg:text-2xl font-display" style={{ letterSpacing: '0.13em', textShadow: '0 2px 12px rgba(0,0,0,0.7)' }}>Direito Prime</span>
                <span className="uppercase whitespace-nowrap text-[10px] sm:text-[12px] lg:text-[13px] font-medium text-foreground/70" style={{ letterSpacing: '0.2em', textShadow: '0 2px 10px rgba(0,0,0,0.7)' }}>Estudos Jurídicos</span>
              </div>
            </Link>

            <Link
              to="/suporte-publico"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.96] shrink-0 backdrop-blur-md"
              style={{
                background: 'hsl(0 0% 100% / 0.14)',
                border: '1px solid hsl(0 0% 100% / 0.28)',
                color: 'hsl(40 25% 97%)',
                boxShadow: '0 2px 14px rgba(0,0,0,0.28)',
              }}
            >
              <Headphones className="w-4 h-4" style={{ color: 'hsl(350 78% 62%)' }} />
              <span>Suporte</span>
            </Link>

          </div>
        </nav>

        <HeroTribunal onAcessar={() => handleStart('hero')} onConhecer={handleConhecer} />
      </div>

      <div className="relative z-10 flex flex-col">


        {/* Marquee universidades */}
        <div className="relative z-10 bg-background/60 py-3">
          <p className="text-center text-[9px] uppercase tracking-widest mb-3 text-foreground/85">
            Domine as matérias da faculdade de Direito
          </p>
          <div
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
            }}
          >
            <div className="dp-marquee gap-8">
              {[...UNIVERSITIES, ...UNIVERSITIES].map((uni, i) => (
                <span key={`${uni}-${i}`} className="flex items-center gap-2 text-muted-foreground text-sm font-semibold shrink-0 pr-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/80 inline-block" />
                  {uni}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD PERSUASIVO ── */}
      <div className="bg-background px-6 lg:px-12 pt-10 pb-2">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl px-6 py-5 relative overflow-hidden border border-primary/20"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--background) / 0.85) 100%)' }}
          >
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
              style={{
                background: 'linear-gradient(to bottom, transparent, hsl(var(--primary)), hsl(var(--primary-light)), hsl(var(--primary)), transparent)',
                boxShadow: '0 0 10px 4px hsl(var(--primary) / 0.6), 0 0 22px 8px hsl(var(--primary) / 0.3)',
              }}
            />
            <p className="text-foreground font-black text-[17px] leading-snug mb-2 font-legal">
              O que é Direito Prime?
            </p>
            <p className="text-muted-foreground text-[13px] leading-relaxed">
              O Direito Prime nasce para guiar você do primeiro contato com o Direito até o nível avançado. Quando há direção, há progresso. Aqui o{' '}
              <span className="font-bold text-primary">conteúdo certo encontra sua dedicação</span>{' '}
              e transforma estudo em conquista.
            </p>
          </div>
        </div>
      </div>

      <AppShowcase onAcessar={() => handleStart('showcase')} />

      {/* ───── RECURSOS ───── */}
      <section id="recursos" className="bg-background px-6 lg:px-12 pt-12 pb-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-foreground text-center mb-2 font-legal">Feito para cada etapa da sua jornada</h2>
          <p className="text-center text-muted-foreground text-sm mb-8">Da graduação à aprovação</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-2xl p-4 flex gap-3 items-start bg-card border border-border"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/15 border border-primary/25">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-foreground font-bold text-sm mb-1">{f.label}</p>
                  <p className="text-muted-foreground text-[13px] leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── DEPOIMENTOS ───── */}
      <section className="bg-background px-6 lg:px-12 pt-12 pb-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-foreground text-center mb-2 font-legal">Quem estuda com a gente</h2>
          <p className="text-center text-muted-foreground text-sm mb-8">Histórias reais de quem já está no caminho</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {TESTIMONIALS.map((t, i) => (
              <motion.figure
                key={t.nome}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="rounded-2xl p-5 bg-card border border-border"
              >
                <blockquote className="text-foreground/85 text-[13px] leading-relaxed mb-3">“{t.texto}”</blockquote>
                <figcaption className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                    {t.nome.charAt(0)}
                  </div>
                  <div className="leading-tight">
                    <p className="text-foreground text-sm font-semibold">{t.nome}</p>
                    <p className="text-muted-foreground text-[11px]">{t.papel}</p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <div className="bg-background px-6 lg:px-12 pt-10 pb-14">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="h-px mb-10 mx-auto max-w-[200px]"
              style={{ background: 'linear-gradient(to right, transparent, hsl(var(--primary) / 0.6), transparent)' }}
            />
            <h2 className="text-2xl font-black text-foreground text-center mb-2 font-legal">Perguntas frequentes</h2>
            <p className="text-center text-muted-foreground text-sm mb-10">Tire suas dúvidas antes de começar</p>

            <div className="flex flex-col gap-3 mb-10">
              {FAQ_ITEMS.map((item, i) => (
                <FaqItem key={item.q} item={item} index={i} />
              ))}
            </div>

            <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleStart('final_cta')}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-base font-extrabold text-primary-foreground bg-primary transition-all active:scale-[0.97]"
                style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.35)' }}
              >
                <Smartphone className="w-5 h-5" />
                Acessar App
              </button>
              <Link
                to="/auth"
                className="w-full py-4 rounded-2xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors border border-border text-center"
              >
                Já sou aluno →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Rodapé */}
      <footer
        className="bg-background border-t border-border px-6 lg:px-12 pt-8"
        style={{ paddingBottom: 'calc(2rem + var(--sai-bottom))' }}
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-3 text-center">
          <img src={appLogo} alt="Direito Prime" className="w-10 h-10 object-contain" />
          <p className="text-muted-foreground text-xs">© 2026 Direito Prime · Estudos Jurídicos · Todos os direitos reservados</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/termos" className="hover:text-primary">Termos</Link>
            <Link to="/privacidade" className="hover:text-primary">Privacidade</Link>
            <Link to="/auth" className="hover:text-primary">Entrar</Link>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
