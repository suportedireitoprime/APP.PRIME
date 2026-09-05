import React, { useState, useEffect, useRef, memo } from 'react';
import { Layers, Clock, Eye, Quote, Lightbulb, ScrollText } from 'lucide-react';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { useHomeCuriosidades } from '@/hooks/useHomeCuriosidades';

const TIME_KEY = 'tempo_no_app_segundos';
const DAILY_GOAL_SECONDS = 60 * 60; // 1h/dia para o anel de progresso

export type CardItem =
  | {
      type: 'stat';
      icon: React.ElementType;
      label: string;
      getValue: () => string;
      subtitle: string;
    }
  | {
      type: 'quote';
      icon: React.ElementType;
      label: string;
      frase: string;
      autor: string;
    }
  | {
      type: 'curiosity';
      icon: React.ElementType;
      label: string;
      texto: string;
    }
  | {
      type: 'termo';
      icon: React.ElementType;
      label: string;
      termo: string;
      significado: string;
    }
  | {
      type: 'db-curiosity';
      icon: React.ElementType;
      label: string;
      texto: string;
      cor: string;
      imagem_url: string | null;
    };

export const PHILOSOPHER_QUOTES = [
  { frase: 'Onde não há lei, não há liberdade.', autor: 'Aristóteles' },
  { frase: 'A justiça é a alma da sociedade.', autor: 'Platão' },
  { frase: 'A justiça é a constante vontade de dar a cada um o que lhe é devido.', autor: 'Ulpiano' },
  { frase: 'A lei deve ser a razão do governo.', autor: 'Montesquieu' },
  { frase: 'Justiça é a virtude que ordena a sociedade.', autor: 'Cícero' },
  { frase: 'Sem justiça, o Estado não passa de uma grande quadrilha.', autor: 'Santo Agostinho' },
  { frase: 'O direito é a vontade geral manifestada nas leis.', autor: 'Rousseau' },
  { frase: 'A liberdade consiste em fazer tudo o que as leis permitem.', autor: 'Montesquieu' },
  { frase: 'A injustiça em qualquer lugar é uma ameaça à justiça em todo lugar.', autor: 'Martin Luther King' },
  { frase: 'A justiça atrasada não é justiça, senão injustiça qualificada e manifesta.', autor: 'Rui Barbosa' },
  { frase: 'O direito não socorre aos que dormem.', autor: 'Brocardo latino' },
  { frase: 'Dura lex, sed lex — a lei é dura, mas é a lei.', autor: 'Ulpiano' },
  { frase: 'Fiat justitia, ruat caelum — faça-se justiça, ainda que caiam os céus.', autor: 'Sêneca' },
  { frase: 'Todo poder emana do povo.', autor: 'Rousseau' },
  { frase: 'O homem é um animal político por natureza.', autor: 'Aristóteles' },
  { frase: 'A pena deve ser proporcional ao crime.', autor: 'Beccaria' },
  { frase: 'É melhor prevenir os crimes do que puni-los.', autor: 'Cesare Beccaria' },
  { frase: 'Não há crime sem lei anterior que o defina.', autor: 'Feuerbach' },
  { frase: 'A liberdade de um termina onde começa a do outro.', autor: 'John Stuart Mill' },
  { frase: 'A propriedade é um roubo.', autor: 'Proudhon' },
];

export const LEGAL_CURIOSITIES = [
  { texto: 'A Constituição Federal de 1988 é a 7ª da história do Brasil.' },
  { texto: 'O Código Civil brasileiro atual tem 2.046 artigos e entrou em vigor em 2003.' },
  { texto: 'A OAB foi criada em 1930, meses antes da Revolução.' },
  { texto: 'O Código Penal vigente foi sancionado em 1940 por Getúlio Vargas.' },
  { texto: 'O STF foi criado em 1891, junto com a primeira República.' },
  { texto: 'A Lei Maria da Penha leva o nome da farmacêutica Maria da Penha Maia Fernandes.' },
  { texto: 'A CLT foi assinada em 1º de maio de 1943 e ainda está em vigor.' },
  { texto: 'A Constituição de 1988 é chamada de "Constituição Cidadã" por Ulysses Guimarães.' },
  { texto: 'Habeas Corpus significa literalmente "que tenhas o teu corpo".' },
  { texto: 'O Brasil já teve 7 Constituições: 1824, 1891, 1934, 1937, 1946, 1967 e 1988.' },
  { texto: 'A Lei Áurea (1888) tem apenas 2 artigos — uma das mais curtas do Brasil.' },
  { texto: 'O júri popular está previsto na Constituição desde 1822.' },
  { texto: 'O Código de Defesa do Consumidor é de 1990 (Lei 8.078).' },
  { texto: 'A Lei da Ficha Limpa (2010) surgiu por iniciativa popular com 1,6 milhão de assinaturas.' },
  { texto: 'O voto feminino no Brasil foi conquistado em 1932.' },
  { texto: 'A pena de morte é proibida no Brasil, salvo em caso de guerra declarada.' },
  { texto: 'O Marco Civil da Internet (Lei 12.965/2014) foi pioneiro no mundo.' },
  { texto: 'O Estatuto da Criança e do Adolescente (ECA) é de 1990.' },
  { texto: 'A Lei de Introdução às Normas do Direito Brasileiro (LINDB) é de 1942.' },
  { texto: 'O CPC atual entrou em vigor em 2016, substituindo o de 1973.' },
  { texto: 'Rui Barbosa é chamado de "Águia de Haia" por sua atuação na Conferência da Paz de 1907.' },
  { texto: 'A LGPD (Lei Geral de Proteção de Dados) entrou em vigor em 2020.' },
  { texto: 'O Tribunal do Júri no Brasil julga apenas crimes dolosos contra a vida.' },
  { texto: 'A Lei Seca brasileira (Lei 11.705/2008) reduziu em 40% as mortes no trânsito.' },
  { texto: 'A Constituição de 1824 foi outorgada por Dom Pedro I e durou 65 anos.' },
];

export const TERMOS_JURIDICOS = [
  { termo: 'Ab initio', significado: 'Desde o início.' },
  { termo: 'Ad hoc', significado: 'Para uma finalidade específica.' },
  { termo: 'Data venia', significado: 'Com o devido respeito.' },
  { termo: 'De cujus', significado: 'Pessoa falecida cuja sucessão se discute.' },
  { termo: 'Erga omnes', significado: 'Que produz efeitos contra todos.' },
  { termo: 'Ex tunc', significado: 'Efeito retroativo, desde então.' },
  { termo: 'Ex nunc', significado: 'Efeito a partir de agora, sem retroagir.' },
  { termo: 'Habeas Data', significado: 'Ação para acessar/corrigir informações pessoais em registros públicos.' },
  { termo: 'In dubio pro reo', significado: 'Na dúvida, decide-se em favor do réu.' },
  { termo: 'Inter partes', significado: 'Efeito que vale apenas entre as partes envolvidas.' },
  { termo: 'Litispendência', significado: 'Existência de duas ações idênticas em curso.' },
  { termo: 'Mandado de Segurança', significado: 'Ação que protege direito líquido e certo contra ato de autoridade.' },
  { termo: 'Nulla poena sine lege', significado: 'Não há pena sem lei anterior que a defina.' },
  { termo: 'Pacta sunt servanda', significado: 'Os pactos devem ser cumpridos.' },
  { termo: 'Res judicata', significado: 'Coisa julgada — decisão da qual não cabe mais recurso.' },
  { termo: 'Sub judice', significado: 'Assunto que ainda está sendo julgado.' },
  { termo: 'Ubi lex non distinguit', significado: 'Onde a lei não distingue, não cabe ao intérprete distinguir.' },
  { termo: 'Vacatio legis', significado: 'Período entre a publicação e a entrada em vigor da lei.' },
  { termo: 'Amicus curiae', significado: '"Amigo da corte" — terceiro que auxilia o tribunal.' },
  { termo: 'Bis in idem', significado: 'Punir alguém duas vezes pelo mesmo fato.' },
  { termo: 'Caput', significado: 'Cabeça do artigo — parte principal antes dos parágrafos.' },
  { termo: 'Culpa in vigilando', significado: 'Culpa por falta de vigilância.' },
  { termo: 'Dolo', significado: 'Vontade consciente de praticar o ato ilícito.' },
  { termo: 'Fumus boni iuris', significado: 'Fumaça do bom direito — plausibilidade do direito alegado.' },
  { termo: 'Periculum in mora', significado: 'Perigo na demora — risco de dano pelo atraso.' },
];

export const RotatingStatCard = ({ wide = false }: { wide?: boolean } = {}) => {
  const { items: dbCuriosidades } = useHomeCuriosidades();
  const [seconds, setSeconds] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const raw = Number(localStorage.getItem(TIME_KEY) || '0');
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  });
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;

  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    const persist = setInterval(() => {
      try { localStorage.setItem(TIME_KEY, String(secondsRef.current)); } catch {}
    }, 5000);
    const flush = () => { try { localStorage.setItem(TIME_KEY, String(secondsRef.current)); } catch {} };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('beforeunload', flush);
    return () => {
      clearInterval(tick);
      clearInterval(persist);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, []);

  const totalMinutes = Math.floor(seconds / 60);
  const displayTime =
    totalMinutes < 60
      ? `${totalMinutes}:${(seconds % 60).toString().padStart(2, '0')}`
      : `${Math.floor(totalMinutes / 60)}h ${(totalMinutes % 60).toString().padStart(2, '0')}min`;
  const pct = Math.min(100, (seconds / DAILY_GOAL_SECONDS) * 100);

  const totalLeis = LEIS_CATALOG.length.toLocaleString('pt-BR');

  const [artigosVistos, setArtigosVistos] = useState(() => {
    if (typeof window === 'undefined') return 0;
    return Number(localStorage.getItem('artigos_vistos') || '0');
  });
  useEffect(() => {
    const sync = () => setArtigosVistos(Number(localStorage.getItem('artigos_vistos') || '0'));
    const t = setInterval(sync, 3000);
    window.addEventListener('focus', sync);
    return () => { clearInterval(t); window.removeEventListener('focus', sync); };
  }, []);

  const artigosSubtitle =
    artigosVistos === 0
      ? 'Abra um artigo para começar'
      : artigosVistos < 10
        ? 'Bom começo, continue!'
        : artigosVistos < 50
          ? 'Você está evoluindo 🔥'
          : artigosVistos < 200
            ? 'Estudante dedicado'
            : 'Referência em conhecimento';

  const baseItems: CardItem[] = [
    {
      type: 'stat',
      icon: Layers,
      label: 'Leis no acervo',
      getValue: () => totalLeis,
      subtitle: 'sempre atualizadas',
    },
    {
      type: 'stat',
      icon: Clock,
      label: 'Tempo de estudo',
      getValue: () => displayTime,
      subtitle: 'meta diária 1h',
    },
    {
      type: 'stat',
      icon: Eye,
      label: 'Artigos visualizados',
      getValue: () => artigosVistos.toLocaleString('pt-BR'),
      subtitle: artigosSubtitle,
    },
    ...PHILOSOPHER_QUOTES.map((q): CardItem => ({
      type: 'quote',
      icon: Quote,
      label: 'Pensamento jurídico',
      frase: q.frase,
      autor: q.autor,
    })),
    ...LEGAL_CURIOSITIES.map((c): CardItem => ({
      type: 'curiosity',
      icon: Lightbulb,
      label: 'Curiosidade jurídica',
      texto: c.texto,
    })),
    ...TERMOS_JURIDICOS.map((t): CardItem => ({
      type: 'termo',
      icon: ScrollText,
      label: 'Termo jurídico',
      termo: t.termo,
      significado: t.significado,
    })),
    ...dbCuriosidades.map((c): CardItem => ({
      type: 'db-curiosity',
      icon: Lightbulb,
      label: 'Curiosidade',
      texto: c.texto,
      cor: c.cor,
      imagem_url: c.imagem_url,
    })),
  ];

  const items = baseItems;

  const IDX_KEY = 'home_stat_card_idx';
  const [idx, setIdx] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const raw = Number(localStorage.getItem(IDX_KEY) || '0');
    const next = (Number.isFinite(raw) ? raw : 0) % baseItems.length;
    try { localStorage.setItem(IDX_KEY, String((next + 1) % baseItems.length)); } catch {}
    return next;
  });
  useEffect(() => {
    const it = setInterval(() => setIdx((i) => {
      const n = (i + 1) % items.length;
      try { localStorage.setItem(IDX_KEY, String((n + 1) % items.length)); } catch {}
      return n;
    }), 10000);
    return () => clearInterval(it);
  }, [items.length]);

  const renderCard = (item: CardItem, i: number, keyed = false) => {
    const Icon = item.icon;
    const isStat = item.type === 'stat';
    const isTempo = isStat && item.label === 'Tempo de estudo';
    const isDbCur = item.type === 'db-curiosity';
    const accent = isDbCur ? item.cor : undefined;
    return (
      <div
        key={keyed ? i : undefined}
        className={`relative ${wide ? 'min-h-[160px]' : 'w-[220px] sm:w-[245px] md:w-[280px] lg:w-[300px] aspect-[4/3.6]'} rounded-2xl bg-[#212121]/95 border border-white/10 p-3.5 sm:p-4 md:p-5 backdrop-blur-md overflow-hidden shadow-xl shadow-black/40`}
        style={isDbCur ? { borderColor: `${accent}55` } : undefined}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/15 via-white/[0.03] to-transparent pointer-events-none"
          style={isDbCur ? { background: `linear-gradient(135deg, ${accent}20, transparent 60%)` } : undefined}
        />
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
        {isDbCur && item.imagem_url ? (
          <img
            src={item.imagem_url}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-contain object-right opacity-[0.28] pointer-events-none mix-blend-screen"
          />
        ) : (
          <Icon className="absolute -right-3 -bottom-3 w-24 h-24 text-primary/[0.06] pointer-events-none" strokeWidth={1.5} />
        )}

        <div className="relative h-full flex flex-col">
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 shrink-0">
              {isTempo ? (
                <>
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none"
                      stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${pct * 0.97} 100`}
                      style={{ transition: 'stroke-dasharray 0.8s linear' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </>
              ) : isDbCur ? (
                <div
                  className="w-full h-full rounded-xl border flex items-center justify-center"
                  style={{ background: `${accent}22`, borderColor: `${accent}55` }}
                >
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
              ) : (
                <div className="w-full h-full rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              )}
            </div>
            <p
              className="font-body text-white/70 text-[10px] uppercase tracking-[0.14em] leading-tight flex-1 min-w-0"
              style={isDbCur ? { color: `${accent}dd` } : undefined}
            >
              {item.label}
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-center min-w-0 mt-1">
            {isStat ? (
              <>
                <p className="font-display text-white text-[26px] sm:text-[28px] font-bold leading-none tabular-nums truncate">
                  {item.getValue()}
                </p>
                <p className="font-body text-white/60 text-[11px] leading-snug mt-1.5 line-clamp-2">
                  {item.subtitle}
                </p>
              </>
            ) : item.type === 'quote' ? (
              <div className="space-y-1">
                <p className="font-body text-white text-[13px] sm:text-[14px] leading-snug line-clamp-3">
                  “{item.frase}”
                </p>
                <p className="font-body text-primary/80 text-[11px] leading-tight">
                  — {item.autor}
                </p>
              </div>
            ) : item.type === 'termo' ? (
              <div className="space-y-1">
                <p className="font-display text-primary text-[15px] sm:text-[16px] font-bold leading-tight truncate">
                  {item.termo}
                </p>
                <p className="font-body text-white/85 text-[11.5px] leading-snug line-clamp-3">
                  {item.significado}
                </p>
              </div>
            ) : item.type === 'db-curiosity' ? (
              <p
                className="font-body text-white text-[13px] sm:text-[14px] leading-snug line-clamp-4 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]"
                style={{ textShadow: `0 0 20px ${accent}22` }}
              >
                {item.texto}
              </p>
            ) : (
              <p className="font-body text-white text-[13px] sm:text-[14px] leading-snug line-clamp-4">
                {item.texto}
              </p>
            )}
          </div>

          <div className="flex items-end justify-between gap-2 mt-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <ScrollText className="w-3 h-3 text-primary/70 shrink-0" />
              <p className="font-body text-white/50 text-[9px] sm:text-[10px] leading-tight truncate">
                {totalLeis} leis disponíveis
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (wide) {
    const looped = [...items, ...items];
    return (
      <div
        className="-mx-4 pl-10 pr-4 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingLeft: '2.5rem', scrollPaddingRight: '1rem' }}
      >
        {looped.map((item, i) => (
          <div key={i} className="snap-start shrink-0 w-[82%]">
            {renderCard(item, i)}
          </div>
        ))}
      </div>
    );
  }

  const current = items[idx];
  return (
    <div key={idx} className="animate-in fade-in slide-in-from-right-3 duration-500">
      {renderCard(current, idx)}
    </div>
  );
};

export default memo(RotatingStatCard);
