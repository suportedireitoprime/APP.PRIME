import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Play, CheckCircle2, BookOpen, Layers, 
  ExternalLink, ArrowLeft, Headphones, Clock, Check
} from 'lucide-react';

interface AulaItem {
  id: string;
  materia: string;
  titulo: string;
  descricao: string;
  duracaoMedia: string;
  slug: string;
  etapas: number;
  audioQtd: number;
  imagensQtd: number;
  urlHtmlR2: string;
  capaUrl: string;
  status: 'pronto' | 'pendente';
}

const AULAS_CATALOGO: AulaItem[] = [
  {
    id: 'penal-01-01',
    materia: '01. Crimes Contra a Família',
    titulo: 'Aula 01 - Crimes Contra a Família (Bigamia)',
    descricao: 'Estudo aprofundado dos crimes contra o casamento, elementos da bigamia, causas de anulação e jurisprudência aplicada.',
    duracaoMedia: '~25 min de aula',
    slug: 'aula-01-crimes-contra-a-familia',
    etapas: 32,
    audioQtd: 32,
    imagensQtd: 30,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/capa-3x4.webp',
    status: 'pronto'
  },
  {
    id: 'penal-01-02',
    materia: '01. Crimes Contra a Família',
    titulo: 'Aula 02 - Induzimento a Erro Essencial e Ocultação de Impedimento',
    descricao: 'Análise do art. 236 do CP: condutas de erro essencial e impedimento oculto, anulação no cível e condição de procedibilidade.',
    duracaoMedia: '~25 min de aula',
    slug: 'aula-02-induzimento-a-erro-essencial',
    etapas: 32,
    audioQtd: 32,
    imagensQtd: 30,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-02-induzimento-a-erro-essencial/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-02-induzimento-a-erro-essencial/capa-3x4.webp',
    status: 'pronto'
  }
];

const PROGRESSO_STORAGE_KEY = 'aulas_interativas_progresso_v1';

function getStoredProgresso(): Record<string, { etapaAtual: number }> {
  try {
    const raw = localStorage.getItem(PROGRESSO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredProgresso(aulaId: string, etapaAtual: number) {
  try {
    const atual = getStoredProgresso();
    atual[aulaId] = { etapaAtual };
    localStorage.setItem(PROGRESSO_STORAGE_KEY, JSON.stringify(atual));
  } catch {}
}

export default function AdminAulasInterativas() {
  const navigate = useNavigate();
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);
  const [progressoMap, setProgressoMap] = useState<Record<string, { etapaAtual: number }>>(() => getStoredProgresso());

  // Listener para capturar avanço de etapa dentro do iframe da aula
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && (e.data.type === 'AULA_INTERATIVA_PROGRESSO' || e.data.type === 'etapa_changed')) {
        const aulaId = e.data.aulaId || aulaAtiva?.id;
        const etapa = Number(e.data.etapaAtual || e.data.etapa || 1);
        if (aulaId) {
          saveStoredProgresso(aulaId, etapa);
          setProgressoMap(prev => ({ ...prev, [aulaId]: { etapaAtual: etapa } }));
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [aulaAtiva]);

  // Cálculos de progresso por aula e geral
  const calcularProgressoAula = (aula: AulaItem) => {
    const salvo = progressoMap[aula.id];
    const etapaAtual = salvo ? salvo.etapaAtual : 0;
    const porcentagem = aula.etapas > 0 ? Math.min(100, Math.round((etapaAtual / aula.etapas) * 100)) : 0;
    return { etapaAtual, totalEtapas: aula.etapas, porcentagem };
  };

  const totalAulas = AULAS_CATALOGO.length;
  const somaPorcentagens = AULAS_CATALOGO.reduce((acc, aula) => acc + calcularProgressoAula(aula).porcentagem, 0);
  const porcentagemGeral = totalAulas > 0 ? Math.round(somaPorcentagens / totalAulas) : 0;
  const aulasIniciadas = AULAS_CATALOGO.filter(a => (progressoMap[a.id]?.etapaAtual ?? 0) > 0).length;

  const iniciarAula = (aula: AulaItem) => {
    if (!progressoMap[aula.id] || progressoMap[aula.id].etapaAtual === 0) {
      saveStoredProgresso(aula.id, 1);
      setProgressoMap(prev => ({ ...prev, [aula.id]: { etapaAtual: 1 } }));
    }
    setAulaAtiva(aula);
  };

  // Quando a aula estiver aberta: Modo Tela Cheia Imersivo 100% na Temática de Direito Penal
  if (aulaAtiva) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#120409] flex flex-col w-screen h-screen overflow-hidden">
        {/* Cabeçalho Superior Temático (Direito Penal - Vinho/Vermelho/Dourado) */}
        <header
          className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[rgba(226,62,87,0.35)] shrink-0 z-30 shadow-lg shadow-black/60"
          style={{
            background: 'linear-gradient(180deg, #280611 0%, #16040a 100%)',
            paddingTop: 'calc(0.6rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
          }}
        >
          {/* Botão de Voltar Padrão Premium */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setAulaAtiva(null)}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[rgba(46,15,24,0.85)] border border-[rgba(226,62,87,0.45)] flex items-center justify-center shrink-0 text-[#ff8296] hover:bg-[rgba(66,20,34,1)] hover:text-white transition active:scale-95 shadow-md shadow-black/40"
              aria-label="Voltar ao catálogo"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff8296] truncate">
                  DIREITO PENAL · AULA INTERATIVA
                </span>
                <span className="hidden xs:inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                  {aulaAtiva.etapas} Etapas
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white truncate font-serif">
                {aulaAtiva.titulo}
              </h2>
            </div>
          </div>

          {/* Ações da direita: Badge R2 */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> Servido via R2
            </span>
          </div>
        </header>

        {/* Iframe 100% Tela Cheia Sem Sobreposições e Sem Scrollbars */}
        <div className="flex-1 w-full h-full relative overflow-hidden bg-[#120409]">
          <iframe
            src={`${aulaAtiva.urlHtmlR2}?t=${Date.now()}`}
            title={aulaAtiva.titulo}
            className="w-full h-full border-0 absolute inset-0"
            allow="autoplay; clipboard-write; fullscreen"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-20">
      {/* Capa Hero Cinematográfica de Direito Penal (Full Bleed com degradê e bordas arredondadas embaixo) */}
      <div className="relative w-full h-[350px] sm:h-[410px] md:h-[450px] rounded-b-[36px] sm:rounded-b-[44px] overflow-hidden border-b border-[rgba(226,62,87,0.35)] shadow-2xl shadow-black/90">
        {/* Imagem de Fundo (Cena do Perito Criminal / Direito Penal) */}
        <img
          src="https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/direito-penal-hero.jpg"
          alt="Direito Penal"
          className="w-full h-full object-cover object-center scale-[1.02] transform-gpu"
          fetchPriority="high"
          loading="eager"
        />

        {/* Degradê escuro de baixo para cima */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(20,4,9,0.18) 35%, rgba(13,13,13,0.88) 75%, #0D0D0D 100%)'
          }}
        />

        {/* Topo dentro da capa: Botão de Voltar e Gráfico Circular de Progresso */}
        <div
          className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-8 pointer-events-auto"
          style={{
            paddingTop: 'calc(1.25rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
          }}
        >
          {/* Botão de Voltar */}
          <button
            type="button"
            onClick={() => navigate('/admin-funcoes')}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-black/60 backdrop-blur-md border border-[rgba(226,62,87,0.4)] flex items-center justify-center text-[#ff8296] hover:text-white hover:bg-[rgba(46,15,24,0.9)] hover:scale-105 active:scale-95 transition shadow-xl"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          {/* Gráfico Circular de Progresso com Quantidade de Aulas / Matérias */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-black/65 backdrop-blur-md border border-[rgba(226,62,87,0.45)] pl-2.5 pr-3.5 py-1.5 sm:py-2 rounded-2xl sm:rounded-3xl shadow-2xl">
            {/* Gráfico Circular Progress Ring */}
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform-gpu" viewBox="0 0 44 44">
                {/* Track cinza translúcido */}
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  className="stroke-[rgba(255,255,255,0.12)] fill-none"
                  strokeWidth="3.6"
                />
                {/* Anel preenchido com gradiente de Direito Penal */}
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  className="fill-none transition-all duration-700 ease-out"
                  stroke="url(#progressRingGradient)"
                  strokeWidth="3.6"
                  strokeDasharray={113.1}
                  strokeDashoffset={113.1 - (113.1 * Math.min(100, Math.max(0, porcentagemGeral))) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff8296" />
                    <stop offset="100%" stopColor="#c8102e" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Porcentagem no centro do círculo */}
              <span className="absolute text-[11px] sm:text-xs font-black text-white font-sans tracking-tighter">
                {porcentagemGeral}%
              </span>
            </div>

            {/* Quantidade de Matérias / Aulas */}
            <div className="flex flex-col text-left">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#ff8296] leading-none">
                PROGRESSO
              </span>
              <span className="text-xs sm:text-sm font-black text-white tracking-tight mt-1 leading-none">
                {totalAulas} {totalAulas === 1 ? 'Matéria' : 'Aulas'}
              </span>
              <span className="text-[9px] text-[#c9a7ad] font-semibold leading-none mt-1">
                {aulasIniciadas > 0 ? `${aulasIniciadas}/${totalAulas} em curso` : '0 concluídas'}
              </span>
            </div>
          </div>
        </div>

        {/* Parte inferior da capa: Título DIREITO PENAL sobre o degradê */}
        <div className="absolute bottom-0 inset-x-0 z-20 px-5 sm:px-8 pb-7 sm:pb-9 max-w-4xl mx-auto w-full pointer-events-none">
          <span className="inline-block text-[11px] sm:text-xs font-black uppercase tracking-[3px] text-[#ff8296] mb-1 drop-shadow">
            ÁREA DO CONHECIMENTO
          </span>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] font-sans leading-none">
            DIREITO PENAL
          </h1>
          <p className="text-xs sm:text-sm text-[#f8edef]/85 max-w-lg mt-2 leading-relaxed drop-shadow">
            Imersão com narrativa interativa, casos reais, fixação ativa e áudios gravados por especialistas.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Catálogo de Matérias e Aulas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#c9a7ad] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#ff8296]" />
              <span>Matérias e Aulas Disponíveis ({AULAS_CATALOGO.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AULAS_CATALOGO.map((aula) => {
              const progresso = calcularProgressoAula(aula);
              const jaIniciada = progresso.etapaAtual > 0;
              const concluida = progresso.porcentagem === 100;

              return (
                <div
                  key={aula.id}
                  className="group rounded-3xl border border-[rgba(226,62,87,0.25)] hover:border-[rgba(226,62,87,0.5)] p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between shadow-xl shadow-black/40 hover:shadow-red-500/10"
                  style={{ background: 'linear-gradient(180deg, #2e1219 0%, #250d14 100%)' }}
                >
                  <div>
                    <div className="flex gap-4">
                      {/* Capa 3x4 */}
                      <div className="relative w-20 h-28 rounded-2xl overflow-hidden shrink-0 border border-[rgba(212,175,55,0.35)] bg-zinc-950 shadow-md">
                        <img 
                          src={aula.capaUrl} 
                          alt={aula.titulo}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <span className="absolute bottom-1 right-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-[#c8102e] text-white">
                          {aula.etapas}p
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider block truncate text-[#ff8296]">
                          {aula.materia}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-1 group-hover:text-[#ff8296] transition-colors font-serif">
                          {aula.titulo}
                        </h4>

                        {/* Descrição resumida em 2 linhas */}
                        <p className="text-xs text-[#c9a7ad] leading-relaxed line-clamp-2 pt-0.5">
                          {aula.descricao}
                        </p>
                      </div>
                    </div>

                    {/* Barra de Progresso da Matéria */}
                    <div className="mt-3.5 pt-3 border-t border-[rgba(226,62,87,0.18)] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#c9a7ad] font-semibold flex items-center gap-1.5">
                          <span 
                            className={`w-1.5 h-1.5 rounded-full ${
                              concluida ? 'bg-emerald-400' : jaIniciada ? 'bg-[#ff8296]' : 'bg-zinc-600'
                            }`} 
                          />
                          <span>Progresso da Aula</span>
                        </span>
                        <span className="font-extrabold text-[#ff8296]">
                          {progresso.porcentagem}% {jaIniciada ? `(${progresso.etapaAtual}/${aula.etapas} etapas)` : '· Não iniciada'}
                        </span>
                      </div>

                      {/* Track e preenchimento da Barra */}
                      <div className="w-full h-2 rounded-full bg-black/60 border border-white/5 overflow-hidden p-[1px]">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.max(progresso.porcentagem, jaIniciada ? 3 : 0)}%`,
                            background: concluida
                              ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                              : 'linear-gradient(90deg, #c8102e 0%, #ff8296 100%)',
                            boxShadow: jaIniciada ? '0 0 8px rgba(226,62,87,0.4)' : 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[rgba(226,62,87,0.2)] flex items-center justify-between">
                    {/* Tempo médio da aula */}
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#e9cd6d] font-semibold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5 text-[#e9cd6d]" />
                      <span>{aula.duracaoMedia}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => iniciarAula(aula)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition active:scale-95 shadow-lg"
                      style={{
                        background: concluida 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #ff7a8a 0%, #c8102e 100%)',
                        boxShadow: concluida 
                          ? '0 4px 14px rgba(16,185,129,0.4)'
                          : '0 4px 14px rgba(226,62,87,0.4)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      {concluida ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Revisar Aula</span>
                        </>
                      ) : jaIniciada ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Continuar Aula</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Iniciar Aula</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
