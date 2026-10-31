import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Play, CheckCircle2, BookOpen, Layers, 
  ArrowLeft, Check, Lock, HelpCircle, Award, 
  RotateCcw, AlertCircle, Unlock
} from 'lucide-react';
import { CONTEUDO_AULAS } from '@/data/aulasInterativasConteudo';
import { ModalRevisarFlashcards } from '@/components/aulas-interativas/ModalRevisarFlashcards';
import { ModalPraticarQuestoes } from '@/components/aulas-interativas/ModalPraticarQuestoes';

interface AulaItem {
  id: string;
  materia: string;
  titulo: string;
  descricao: string;
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
    descricao: 'Estudo aprofundado dos crimes contra o casamento, elementos típicos da bigamia, causas de anulação civil e jurisprudência aplicada dos Tribunais Superiores.',
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
    descricao: 'Análise aprofundada do art. 236 do Código Penal: condutas de induzimento a erro essencial sobre a pessoa e impedimentos dirimentes, condição objetiva de procedibilidade e ação penal privada personalíssima.',
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
const FLASHCARDS_STORAGE_KEY = 'aulas_interativas_flashcards_v1';
const QUESTOES_STORAGE_KEY = 'aulas_interativas_questoes_v1';

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

function getStoredBooleanMap(key: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredBoolean(key: string, id: string, val: boolean) {
  try {
    const obj = getStoredBooleanMap(key);
    obj[id] = val;
    localStorage.setItem(key, JSON.stringify(obj));
  } catch {}
}

export default function AdminAulasInterativas() {
  const navigate = useNavigate();
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);
  const [progressoMap, setProgressoMap] = useState<Record<string, { etapaAtual: number }>>(() => getStoredProgresso());
  const [flashcardsConcluidos, setFlashcardsConcluidos] = useState<Record<string, boolean>>(() => getStoredBooleanMap(FLASHCARDS_STORAGE_KEY));
  const [questoesConcluidas, setQuestoesConcluidas] = useState<Record<string, boolean>>(() => getStoredBooleanMap(QUESTOES_STORAGE_KEY));

  // Modais de Revisão e Prática
  const [modalFlashcardsAula, setModalFlashcardsAula] = useState<AulaItem | null>(null);
  const [modalQuestoesAula, setModalQuestoesAula] = useState<AulaItem | null>(null);
  const [toastAviso, setToastAviso] = useState<string | null>(null);
  const [modoLivreTeste, setModoLivreTeste] = useState(false);

  useEffect(() => {
    if (!toastAviso) return;
    const timer = setTimeout(() => setToastAviso(null), 3500);
    return () => clearTimeout(timer);
  }, [toastAviso]);

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

  // ─────────────────────────────────────────────────────────────────────────────
  // REGRA DO USUÁRIO: O 100% DA AULA SE COMPLETA COM OS 3 PILARES:
  // 1. Aula Interativa (34%) + 2. Flashcards (33%) + 3. Praticar Questões (33%) = 100%
  // ─────────────────────────────────────────────────────────────────────────────
  const calcularProgressoCiclo = (aula: AulaItem) => {
    const salvo = progressoMap[aula.id];
    const etapaAtual = salvo ? salvo.etapaAtual : 0;
    
    // Pilar 1: Aula (vale até 34%)
    const aulaTerminada = etapaAtual >= aula.etapas;
    const pctAula = aulaTerminada 
      ? 34 
      : aula.etapas > 0 
        ? Math.round((etapaAtual / aula.etapas) * 34) 
        : 0;

    // Pilar 2: Flashcards (vale 33%)
    const fcOk = !!flashcardsConcluidos[aula.id];
    const pctFlashcards = fcOk ? 33 : 0;

    // Pilar 3: Praticar / Questões (vale 33%)
    const questoesOk = !!questoesConcluidas[aula.id];
    const pctQuestoes = questoesOk ? 33 : 0;

    const fasesConcluidasCount = (aulaTerminada ? 1 : 0) + (fcOk ? 1 : 0) + (questoesOk ? 1 : 0);
    const cicloCompleto = fasesConcluidasCount === 3;
    const porcentagemTotal = cicloCompleto ? 100 : Math.min(99, pctAula + pctFlashcards + pctQuestoes);

    return {
      etapaAtual,
      totalEtapas: aula.etapas,
      aulaTerminada,
      fcOk,
      questoesOk,
      fasesConcluidasCount,
      porcentagemTotal,
      cicloCompleto
    };
  };

  const totalAulas = AULAS_CATALOGO.length;
  const somaPorcentagensCiclos = AULAS_CATALOGO.reduce((acc, aula) => acc + calcularProgressoCiclo(aula).porcentagemTotal, 0);
  const porcentagemGeral = totalAulas > 0 ? Math.round(somaPorcentagensCiclos / totalAulas) : 0;
  const ciclosFinalizadosCount = AULAS_CATALOGO.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;

  const iniciarAula = (aula: AulaItem) => {
    if (!progressoMap[aula.id] || progressoMap[aula.id].etapaAtual === 0) {
      saveStoredProgresso(aula.id, 1);
      setProgressoMap(prev => ({ ...prev, [aula.id]: { etapaAtual: 1 } }));
    }
    setAulaAtiva(aula);
  };

  const concluirAulaManual = (aulaId: string, totalEtapas: number) => {
    saveStoredProgresso(aulaId, totalEtapas);
    setProgressoMap(prev => ({ ...prev, [aulaId]: { etapaAtual: totalEtapas } }));
    setToastAviso('Fase 1 (Aula) concluída! Fase 2 (Revisar Flashcards) liberada.');
  };

  const abrirRevisarFlashcards = (aula: AulaItem) => {
    const prog = calcularProgressoCiclo(aula);
    const liberado = prog.aulaTerminada || modoLivreTeste;

    if (!liberado) {
      setToastAviso('Complete a aula interativa primeiro para liberar a revisão com Flashcards!');
      return;
    }

    setModalFlashcardsAula(aula);
  };

  const concluirFlashcards = (aulaId: string) => {
    setStoredBoolean(FLASHCARDS_STORAGE_KEY, aulaId, true);
    setFlashcardsConcluidos(prev => ({ ...prev, [aulaId]: true }));
    setToastAviso('Fase 2 (Flashcards) concluída! Fase 3 (Praticar Questões) liberada.');
  };

  const abrirPraticarQuestoes = (aula: AulaItem) => {
    const prog = calcularProgressoCiclo(aula);
    const liberado = (prog.aulaTerminada && prog.fcOk) || modoLivreTeste;

    if (!liberado) {
      setToastAviso('Conclua os Flashcards de revisão primeiro para liberar as Questões práticas!');
      return;
    }

    setModalQuestoesAula(aula);
  };

  const concluirQuestoes = (aulaId: string) => {
    setStoredBoolean(QUESTOES_STORAGE_KEY, aulaId, true);
    setQuestoesConcluidas(prev => ({ ...prev, [aulaId]: true }));
    setToastAviso('Parabéns! 100% da aula concluída (Aula + Flashcards + Questões)!');
  };

  // Quando a aula estiver aberta: Modo Tela Cheia Imersivo 100% na Temática de Direito Penal
  if (aulaAtiva) {
    const progAula = calcularProgressoCiclo(aulaAtiva);

    return (
      <div className="fixed inset-0 z-[100] bg-[#120409] flex flex-col w-screen h-screen overflow-hidden">
        {/* Cabeçalho Superior Temático */}
        <header
          className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-[rgba(226,62,87,0.35)] shrink-0 z-30 shadow-lg shadow-black/60"
          style={{
            background: 'linear-gradient(180deg, #280611 0%, #16040a 100%)',
            paddingTop: 'calc(0.6rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
          }}
        >
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

          <div className="flex items-center gap-2 shrink-0">
            {!progAula.aulaTerminada ? (
              <button
                type="button"
                onClick={() => concluirAulaManual(aulaAtiva.id, aulaAtiva.etapas)}
                className="px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden xs:inline">Concluir Aula</span>
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aula Concluída
              </span>
            )}

            <span className="hidden md:inline-flex text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> Servido via R2
            </span>
          </div>
        </header>

        {/* Iframe 100% Tela Cheia */}
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
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-20 relative">
      {/* Toast Flutuante de Alerta */}
      {toastAviso && (
        <div className="fixed top-5 inset-x-4 max-w-md mx-auto z-[150] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="rounded-2xl bg-black/90 backdrop-blur-md border border-[rgba(226,62,87,0.6)] p-3.5 shadow-2xl flex items-center gap-3 text-white">
            <AlertCircle className="w-5 h-5 text-[#ff8296] shrink-0" />
            <p className="text-xs font-medium leading-snug flex-1">{toastAviso}</p>
          </div>
        </div>
      )}

      {/* Capa Hero Cinematográfica de Direito Penal */}
      <div className="relative w-full h-[350px] sm:h-[410px] md:h-[450px] rounded-b-[36px] sm:rounded-b-[44px] overflow-hidden border-b border-[rgba(226,62,87,0.35)] shadow-2xl shadow-black/90">
        <img
          src="https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/direito-penal-hero.jpg"
          alt="Direito Penal"
          className="w-full h-full object-cover object-center scale-[1.02] transform-gpu"
          fetchPriority="high"
          loading="eager"
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(20,4,9,0.18) 35%, rgba(13,13,13,0.88) 75%, #0D0D0D 100%)'
          }}
        />

        {/* Topo dentro da capa: Botão Voltar e Gráfico Circular do Ciclo Completo */}
        <div
          className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-8 pointer-events-auto"
          style={{
            paddingTop: 'calc(1.25rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/admin-funcoes')}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-black/60 backdrop-blur-md border border-[rgba(226,62,87,0.4)] flex items-center justify-center text-[#ff8296] hover:text-white hover:bg-[rgba(46,15,24,0.9)] hover:scale-105 active:scale-95 transition shadow-xl"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>

          {/* Gráfico Circular de Progresso Completo */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-black/65 backdrop-blur-md border border-[rgba(226,62,87,0.45)] pl-2.5 pr-3.5 py-1.5 sm:py-2 rounded-2xl sm:rounded-3xl shadow-2xl">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90 transform-gpu" viewBox="0 0 44 44">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  className="stroke-[rgba(255,255,255,0.12)] fill-none"
                  strokeWidth="3.6"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  className="fill-none transition-all duration-700 ease-out"
                  stroke="url(#progressRingGradGeneral)"
                  strokeWidth="3.6"
                  strokeDasharray={113.1}
                  strokeDashoffset={113.1 - (113.1 * Math.min(100, Math.max(0, porcentagemGeral))) / 100}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressRingGradGeneral" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ff8296" />
                    <stop offset="100%" stopColor="#c8102e" />
                  </linearGradient>
                </defs>
              </svg>

              <span className="absolute text-[11px] sm:text-xs font-black text-white font-sans tracking-tighter">
                {porcentagemGeral}%
              </span>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#ff8296] leading-none">
                CICLO COMPLETO
              </span>
              <span className="text-xs sm:text-sm font-black text-white tracking-tight mt-1 leading-none">
                {totalAulas} {totalAulas === 1 ? 'Matéria' : 'Aulas'}
              </span>
              <span className="text-[9px] text-[#c9a7ad] font-semibold leading-none mt-1">
                {ciclosFinalizadosCount > 0 ? `${ciclosFinalizadosCount}/${totalAulas} concluídas 100%` : 'Aula · Flashcard · Prática'}
              </span>
            </div>
          </div>
        </div>

        {/* Parte inferior da capa */}
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

            {/* Toggle de Desenvolvedor */}
            <button
              type="button"
              onClick={() => {
                setModoLivreTeste(!modoLivreTeste);
                setToastAviso(!modoLivreTeste ? 'Modo Livre Ativado: Todas as fases liberadas para teste.' : 'Modo Padrão Ativado: Travas progressivas ativadas.');
              }}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 ${
                modoLivreTeste 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              {modoLivreTeste ? <Unlock className="w-3 h-3 text-amber-300" /> : <Lock className="w-3 h-3" />}
              <span>{modoLivreTeste ? 'Modo Livre Ativo' : 'Destravar para Teste'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {AULAS_CATALOGO.map((aula) => {
              const prog = calcularProgressoCiclo(aula);
              const flashcardsLiberados = prog.aulaTerminada || modoLivreTeste;
              const questoesLiberadas = (prog.aulaTerminada && prog.fcOk) || modoLivreTeste;

              const conteudo = CONTEUDO_AULAS[aula.id];
              const totalCards = conteudo?.flashcards.length || 18;
              const totalQuestoes = conteudo?.questoes.length || 12;

              return (
                <div
                  key={aula.id}
                  className="group rounded-3xl border border-[rgba(226,62,87,0.25)] hover:border-[rgba(226,62,87,0.5)] p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between shadow-xl shadow-black/40 hover:shadow-red-500/10"
                  style={{ background: 'linear-gradient(180deg, #2e1219 0%, #250d14 100%)' }}
                >
                  <div className="space-y-3.5">
                    {/* Topo do Card: Capa + Matéria e Título COMPLETOS SEM ABREVIAÇÃO */}
                    <div className="flex gap-4 items-start">
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
                        {/* Matéria Completa Sem Abreviação */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#ff8296]">
                            {aula.materia}
                          </span>
                        </div>

                        {/* Título Completo da Aula Sem Reticências */}
                        <h4 className="text-sm sm:text-base font-bold text-white leading-snug group-hover:text-[#ff8296] transition-colors font-serif">
                          {aula.titulo}
                        </h4>

                        {/* Descrição Completa Sem Reticências */}
                        <p className="text-xs text-[#f8edef]/85 leading-relaxed pt-0.5 font-sans">
                          {aula.descricao}
                        </p>
                      </div>
                    </div>

                    {/* Barra de Progresso Completa (100% = Aula + Flashcards + Questões) */}
                    <div className="pt-3 border-t border-[rgba(226,62,87,0.18)] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#c9a7ad] font-semibold flex items-center gap-1.5">
                          <span 
                            className={`w-2 h-2 rounded-full ${
                              prog.cicloCompleto ? 'bg-emerald-400' : prog.porcentagemTotal > 0 ? 'bg-[#ff8296]' : 'bg-zinc-600'
                            }`} 
                          />
                          <span>Progresso da Aula</span>
                        </span>
                        <span className="font-extrabold text-[#ff8296]">
                          {prog.porcentagemTotal}% · {prog.cicloCompleto ? '100% Concluída' : `${prog.fasesConcluidasCount} de 3 fases`}
                        </span>
                      </div>

                      {/* Barra de Progresso Visual Ponderada */}
                      <div className="w-full h-2.5 rounded-full bg-black/60 border border-white/5 overflow-hidden p-[1px]">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.max(prog.porcentagemTotal, prog.porcentagemTotal > 0 ? 4 : 0)}%`,
                            background: prog.cicloCompleto
                              ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                              : 'linear-gradient(90deg, #c8102e 0%, #ff8296 100%)',
                            boxShadow: prog.porcentagemTotal > 0 ? '0 0 10px rgba(226,62,87,0.5)' : 'none'
                          }}
                        />
                      </div>

                      {/* 3 Pilares do Ciclo com status visual */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px]">
                        <div className={`p-1 rounded-lg text-center font-bold border ${
                          prog.aulaTerminada 
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                            : prog.etapaAtual > 0 
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                              : 'bg-black/30 text-zinc-500 border-white/5'
                        }`}>
                          1. Aula {prog.aulaTerminada ? '✓' : ''}
                        </div>

                        <div className={`p-1 rounded-lg text-center font-bold border ${
                          prog.fcOk 
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                            : flashcardsLiberados 
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                              : 'bg-black/30 text-zinc-500 border-white/5'
                        }`}>
                          2. Revisão {prog.fcOk ? '✓' : !flashcardsLiberados ? '🔒' : ''}
                        </div>

                        <div className={`p-1 rounded-lg text-center font-bold border ${
                          prog.questoesOk 
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                            : questoesLiberadas 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                              : 'bg-black/30 text-zinc-500 border-white/5'
                        }`}>
                          3. Praticar {prog.questoesOk ? '✓' : !questoesLiberadas ? '🔒' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ─────────────────────────────────────────────────────────────
                      RODAPÉ DE AÇÕES: 3 BOTÕES (AULA À ESQUERDA, REVISAR, PRATICAR)
                      SEM TEMPO DA AULA
                  ───────────────────────────────────────────────────────────── */}
                  <div className="mt-4 pt-3.5 border-t border-[rgba(226,62,87,0.2)] grid grid-cols-3 gap-2">
                    {/* Botão 1: Iniciar / Ver Aula (À Esquerda) */}
                    <button
                      type="button"
                      onClick={() => iniciarAula(aula)}
                      className="py-2.5 px-2 rounded-xl text-xs font-bold text-white transition active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                      style={{
                        background: prog.aulaTerminada
                          ? 'linear-gradient(135deg, #2d1017 0%, #1a080d 100%)'
                          : 'linear-gradient(135deg, #ff7a8a 0%, #c8102e 100%)',
                        border: '1px solid rgba(226,62,87,0.5)',
                        boxShadow: prog.aulaTerminada ? 'none' : '0 2px 10px rgba(226,62,87,0.3)'
                      }}
                    >
                      {prog.aulaTerminada ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          <span className="truncate">Ver Aula</span>
                        </>
                      ) : prog.etapaAtual > 0 ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="truncate">Continuar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="truncate">Iniciar</span>
                        </>
                      )}
                    </button>

                    {/* Botão 2: Revisar (Flashcards) */}
                    <button
                      type="button"
                      onClick={() => abrirRevisarFlashcards(aula)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
                        flashcardsLiberados
                          ? prog.fcOk
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border border-amber-400/40 shadow-amber-950/40'
                          : 'bg-black/40 text-zinc-500 border border-white/5 cursor-not-allowed opacity-60'
                      }`}
                      title={!flashcardsLiberados ? 'Conclua a aula para liberar' : 'Revisar flashcards'}
                    >
                      {!flashcardsLiberados ? (
                        <>
                          <Lock className="w-3 h-3 text-zinc-500" />
                          <span className="truncate">Revisar</span>
                        </>
                      ) : prog.fcOk ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          <span className="truncate">Revisar ({totalCards})</span>
                        </>
                      ) : (
                        <>
                          <Layers className="w-3.5 h-3.5" />
                          <span className="truncate">Revisar ({totalCards})</span>
                        </>
                      )}
                    </button>

                    {/* Botão 3: Praticar (Questões) */}
                    <button
                      type="button"
                      onClick={() => abrirPraticarQuestoes(aula)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
                        questoesLiberadas
                          ? prog.questoesOk
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400/40 shadow-emerald-950/40'
                          : 'bg-black/40 text-zinc-500 border border-white/5 cursor-not-allowed opacity-60'
                      }`}
                      title={!questoesLiberadas ? 'Conclua os flashcards para liberar' : 'Praticar questões'}
                    >
                      {!questoesLiberadas ? (
                        <>
                          <Lock className="w-3 h-3 text-zinc-500" />
                          <span className="truncate">Praticar</span>
                        </>
                      ) : prog.questoesOk ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          <span className="truncate">Praticar ({totalQuestoes})</span>
                        </>
                      ) : (
                        <>
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span className="truncate">Praticar ({totalQuestoes})</span>
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

      {/* Modal Interativo de Flashcards */}
      {modalFlashcardsAula && (
        <ModalRevisarFlashcards
          tituloAula={modalFlashcardsAula.titulo}
          flashcards={CONTEUDO_AULAS[modalFlashcardsAula.id]?.flashcards || []}
          onFechar={() => setModalFlashcardsAula(null)}
          onConcluir={() => concluirFlashcards(modalFlashcardsAula.id)}
        />
      )}

      {/* Modal Interativo de Questões */}
      {modalQuestoesAula && (
        <ModalPraticarQuestoes
          tituloAula={modalQuestoesAula.titulo}
          questoes={CONTEUDO_AULAS[modalQuestoesAula.id]?.questoes || []}
          onFechar={() => setModalQuestoesAula(null)}
          onConcluir={() => concluirQuestoes(modalQuestoesAula.id)}
        />
      )}
    </div>
  );
}
