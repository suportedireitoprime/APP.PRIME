import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, GraduationCap, Scale, FileText, BookOpen, Sparkles,
  Smartphone, Headphones, ChevronDown,
} from 'lucide-react';
import { trackStartJourney } from '@/lib/fbPixel';
import {pickAsset, srcOf } from '@/lib/assetUrl';

import logoAsset from '@/assets/logo-vacatio-v2.png.asset.json';
import logoBundled from '@/assets/bundled/logo-vacatio-v2.webp';
import lourosDourados from '@/assets/louros-dourados.webp';
const appLogo = pickAsset(logoBundled, srcOf(logoAsset));
const welcomeHero = '/welcome-hero.webp';
const welcomeHeroWide = '/welcome-hero-wide.jpg';

const UNIVERSITIES = ['USP', 'UNICAMP', 'UFRJ', 'UFMG', 'UFRGS', 'UnB', 'UFSC', 'UFPR', 'PUC-RS', 'FGV Direito', 'Mackenzie', 'PUC-SP', 'UERJ', 'UFC', 'UFPE'];

const FEATURES = [
  { icon: GraduationCap, label: 'Aprovação na Faculdade', desc: 'Resumos, aulas e simulados para você tirar nota alta e nunca mais pegar DP.' },
  { icon: Scale, label: 'OAB 1ª Fase', desc: 'Questões comentadas, vade mecum atualizado e treino focado em aprovação.' },
  { icon: FileText, label: 'OAB 2ª Fase', desc: 'Peças práticas, recursos e tudo que você precisa para cruzar a linha de chegada.' },
  { icon: Sparkles, label: 'Flashcards e Mapas Mentais', desc: 'Memorize o que importa com método ativo — sem decoreba, com fixação real.' },
  { icon: BookOpen, label: 'Biblioteca Jurídica Completa', desc: 'Códigos, leis, súmulas e doutrina em um só lugar, sempre atualizado.' },
];

const FAQ_ITEMS = [
  { q: 'O app é gratuito?', a: 'Sim, você pode começar grátis e explorar diversas funções. Para acesso ilimitado a todos os recursos (Vade Mecum completo, biblioteca, IA sem limites, etc.), há um plano Premium acessível.' },
  { q: 'Serve para faculdade e OAB?', a: 'Sim. O conteúdo cobre desde o básico da graduação até OAB 1ª e 2ª fase, com resumos, questões, videoaulas e simulados.' },
  { q: 'O conteúdo é atualizado?', a: 'Sim. A legislação vem direto do site oficial (Planalto) e nossos resumos, questões e súmulas são revisados constantemente pela nossa equipe.' },
  { q: 'Funciona no celular e no computador?', a: 'Sim. Você pode usar no navegador do celular, tablet ou computador. Também temos versão instalável (PWA) que funciona offline em muitos recursos.' },
  { q: 'Como funciona a IA?', a: 'A assistente jurídica fica disponível 24h. Ela tira dúvidas, explica artigos, ajuda em trabalhos e prepara para provas — tudo com precisão e contexto.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, o cancelamento é imediato e sem taxas. Você mantém acesso até o fim do período pago.' },
];

const TESTIMONIALS = [
  { nome: 'Marina Alves', papel: 'Estudante — 6º semestre', texto: 'Consegui organizar toda a minha rotina de estudos. Os resumos e flashcards mudaram minhas notas.' },
  { nome: 'Rafael Souza', papel: 'Aprovado OAB 1ª fase', texto: 'As questões comentadas e o vade mecum atualizado foram decisivos na minha aprovação.' },
  { nome: 'Camila Ferreira', papel: 'Concurseira', texto: 'Tudo em um só lugar. Não preciso mais abrir cinco sites diferentes para estudar.' },
  { nome: 'Thiago Lima', papel: 'Advogado', texto: 'Uso no dia a dia do escritório para consultar legislação comentada. Rápido e confiável.' },
];

const FaqItem = ({ item, index }: { item: { q: string; a: string }; index: number }) => {
  const [open, setOpen] = useState(false);
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
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5"
        aria-expanded={open}
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

const Landing = () => {
  const navigate = useNavigate();

  const handleStart = useCallback((origem: string) => {
    trackStartJourney(origem);
    navigate('/auth');
  }, [navigate]);

  return (
    <div className="min-h-[100dvh] w-full bg-background overflow-x-hidden relative">
      {/* ───── HERO ───── */}
      <div className="relative min-h-[100dvh] flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden bg-background">
          <div className="relative w-full lg:hidden">
            <img
              src={welcomeHero}
              alt=""
              width={1200}
              height={1600}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full h-auto max-w-none object-cover object-top"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, rgba(0,0,0,0.6) 88%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black 0%, black 70%, rgba(0,0,0,0.6) 88%, transparent 100%)',
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
          </div>
          {/* Desktop: versão horizontal */}
          <div className="relative w-full h-full hidden lg:block">
            <img
              src={welcomeHeroWide}
              alt=""
              width={1920}
              height={1024}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover object-center"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.55) 90%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.55) 90%, transparent 100%)',
              }}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/50 via-40% to-background" />
        </div>

        {/* Navbar */}
        <nav className="relative z-20 px-4 lg:px-8 pt-6 pb-2">
          <div className="flex flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
            <Link to="/landing" className="flex items-center gap-3">
              <div className="relative shine-effect rounded-full overflow-hidden bg-background/40 h-14 w-14 lg:h-16 lg:w-16 flex items-center justify-center">
                <img src={appLogo} alt="Direito Prime" width={64} height={64} loading="eager" decoding="async" className="h-full w-full object-contain drop-shadow-2xl" />
                <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.3)' }} />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-foreground font-semibold uppercase whitespace-nowrap text-[15px] sm:text-base lg:text-lg font-display" style={{ letterSpacing: '0.14em' }}>Direito Prime</span>
                <span className="text-muted-foreground uppercase whitespace-nowrap text-[9px] sm:text-[10px] lg:text-[11px] font-medium" style={{ letterSpacing: '0.22em' }}>Estudos Jurídicos</span>
              </div>
            </Link>

            <Link
              to="/suporte"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all active:scale-[0.96] bg-card text-foreground border border-primary/40 hover:bg-secondary"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.25), 0 0 16px hsl(var(--primary) / 0.18)' }}
            >
              <Headphones className="w-4 h-4 text-primary" />
              <span>Suporte</span>
            </Link>
          </div>
        </nav>

        {/* Conteúdo do hero */}
        <div className="relative z-10 flex-1 flex flex-col items-center px-6 md:px-10 lg:px-12 xl:px-16 pb-6 pt-16 sm:pt-20 max-w-[1100px] mx-auto w-full lg:py-12">
          <div className="w-full mx-auto">
            <div className="mb-6 text-center font-legal" style={{ letterSpacing: '-0.02em' }}>
              <h1
                className="text-[clamp(1.8rem,4.2vw,3.4rem)] font-black text-foreground leading-[1.1] mb-4"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
              >
                Tudo para você{' '}
                <span className="inline text-primary" style={{ textShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}>estudar Direito</span>{' '}
                em um{' '}
                <span className="inline text-primary" style={{ textShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}>só lugar</span>.
              </h1>

              <p
                className="text-foreground/85 text-center text-[clamp(0.95rem,2.2vw,1.15rem)] leading-relaxed mb-2 max-w-xl mx-auto font-legal"
                style={{ letterSpacing: '0.01em', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
              >
                Aulas, resumos, flashcards, questões, audioaulas, vade mecum e muito mais, tudo em um só lugar para você{' '}
                <span className="font-bold text-primary">dominar o Direito</span>.
              </p>

              {/* CTA */}
              <div className="flex flex-col items-center mt-5 mb-6">
                <button
                  onClick={() => handleStart('hero')}
                  className="group relative flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-base font-bold text-primary-foreground transition-all active:scale-[0.97] overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(0 72% 45%))',
                    boxShadow: '0 0 20px hsl(var(--primary) / 0.4), 0 4px 16px rgba(0,0,0,0.4)',
                  }}
                >
                  <span
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.2) 55%, transparent 70%)',
                      animation: 'shimmerSlide 3s ease-in-out infinite',
                    }}
                  />
                  <span className="relative z-10 flex items-center gap-2">
                    Iniciar jornada
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </button>
                <p className="text-foreground text-xs mt-2.5 tracking-wide font-medium">
                  ⭐ +10.000 alunos já estudam com a gente
                </p>
              </div>

              {/* Louros + V */}
              <div className="relative w-full max-w-[280px] md:max-w-[400px] lg:max-w-[420px] mx-auto my-2">
                <img
                  src={lourosDourados}
                  alt=""
                  width={400}
                  height={200}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-contain pointer-events-none select-none"
                  style={{ filter: 'hue-rotate(-42deg) saturate(1.35) drop-shadow(0 0 12px hsl(var(--primary) / 0.35))' }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="flex justify-between w-full -mt-2 px-1">
                    {['Faculdade', 'Concursos'].map((word, i) => (
                      <span
                        key={word}
                        className="text-[clamp(1rem,3.2vw,1.5rem)] font-black text-foreground uppercase whitespace-nowrap font-legal"
                        style={{
                          animation: `neonPulseText 3s ease-in-out ${i}s infinite`,
                          textShadow: '0 0 20px hsl(var(--primary) / 0.5), 0 2px 8px rgba(0,0,0,0.6)',
                        }}
                      >
                        {word}
                      </span>
                    ))}
                  </div>

                  <svg viewBox="0 0 400 36" className="w-[80%] h-8" preserveAspectRatio="none">
                    <line x1="50" y1="0" x2="200" y2="32" stroke="url(#dpLine)" strokeWidth="3.5" style={{ animation: 'lineGlow 3s ease-in-out 0.5s infinite' }} />
                    <line x1="350" y1="0" x2="200" y2="32" stroke="url(#dpLine)" strokeWidth="3.5" style={{ animation: 'lineGlow 3s ease-in-out 1.5s infinite' }} />
                    <defs>
                      <linearGradient id="dpLine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="transparent" />
                        <stop offset="50%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <span
                    className="text-[clamp(1.8rem,7vw,2.6rem)] font-black text-foreground uppercase font-legal"
                    style={{
                      animation: 'neonPulseText 3s ease-in-out 2s infinite',
                      textShadow: '0 0 25px hsl(var(--primary) / 0.6), 0 0 50px hsl(var(--primary) / 0.2), 0 2px 8px rgba(0,0,0,0.6)',
                    }}
                  >
                    OAB
                  </span>
                </div>
              </div>
            </div>

            <p
              className="relative text-center text-[clamp(1.1rem,3.5vw,1.4rem)] font-semibold tracking-wide mb-4 overflow-hidden font-legal text-foreground/90"
              style={{ textShadow: '0 0 12px rgba(255,255,255,0.25)' }}
            >
              <span className="relative z-10">Alcance a excelência nos estudos jurídicos.</span>
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.4) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 55%, transparent 70%)',
                  animation: 'shimmerSlide 3s ease-in-out infinite',
                }}
              />
            </p>
          </div>
        </div>

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

      {/* ───── RECURSOS ───── */}
      <section className="bg-background px-6 lg:px-12 pt-12 pb-4">
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
      <footer className="bg-background border-t border-border px-6 lg:px-12 py-8">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-3 text-center">
          <img src={appLogo} alt="Direito Prime" className="w-10 h-10 object-contain" />
          <p className="text-muted-foreground text-xs">© 2026 Direito Prime — Estudos Jurídicos · Todos os direitos reservados</p>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link to="/termos" className="hover:text-primary">Termos</Link>
            <Link to="/privacidade" className="hover:text-primary">Privacidade</Link>
            <Link to="/auth" className="hover:text-primary">Entrar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
