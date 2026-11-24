import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Video, Headphones, Film, Layers, 
  BookOpen, Sparkles, Flame, Clock, Play, ChevronRight, 
  ArrowRight, CheckCircle2, Bookmark, Trophy, Shield 
} from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import BottomNav from '@/components/vademecum/navigation/BottomNav';
import ShapeGrid from '@/components/ui/ShapeGrid';

export default function AprenderHub() {
  const navigate = useNavigate();
  const [materiaAtiva, setMateriaAtiva] = useState('Todas');

  const materias = [
    'Todas', 'Direito Penal', 'Constitucional', 'Civil', 
    'Processo Penal', 'Trabalho', 'Tributário', 'OAB FGV'
  ];

  const modalidades = [
    {
      id: 'trilhas',
      titulo: 'Aulas em Trilha',
      subtitulo: 'Cronograma linear de alta precisão com 3.003 aulas divididas em 106 módulos oficiais.',
      badge: 'MAIS COMPLETO',
      icone: GraduationCap,
      gradiente: 'from-rose-500/20 via-red-950/40 to-black',
      borda: 'border-rose-500/30 hover:border-rose-500/50',
      iconeCor: 'text-rose-400 bg-rose-500/20',
      rota: '/aulas-em-trilha',
      metricas: '3.003 Aulas · 106 Módulos',
    },
    {
      id: 'videoaulas',
      titulo: 'Videoaulas Esquematizadas',
      subtitulo: 'Aulas em vídeo com lousa digital, slides esquematizados e transcrição sincronizada.',
      badge: 'VÍDEO HD',
      icone: Video,
      gradiente: 'from-amber-500/20 via-orange-950/40 to-black',
      borda: 'border-amber-500/30 hover:border-amber-500/50',
      iconeCor: 'text-amber-400 bg-amber-500/20',
      rota: '/videoaulas',
      metricas: 'Com Lousa & Slides',
    },
    {
      id: 'audioaulas',
      titulo: 'Áudioaulas & Audiobooks',
      subtitulo: 'Aprenda no trânsito, caminhada ou academia. Narração profissional por área do Direito.',
      badge: 'ESTUDO PASSIVO',
      icone: Headphones,
      gradiente: 'from-sky-500/20 via-blue-950/40 to-black',
      borda: 'border-sky-500/30 hover:border-sky-500/50',
      iconeCor: 'text-sky-400 bg-sky-500/20',
      rota: '/audioaulas',
      metricas: 'Narração Humana · 1.5x',
    },
    {
      id: 'lousa-magica',
      titulo: 'Lousa Mágica & Animações 2D',
      subtitulo: 'Conceitos jurídicos complexos desmistificados com cenas animadas em 2D de alta retenção.',
      badge: 'VISUAL INTERATIVO',
      icone: Film,
      gradiente: 'from-emerald-500/20 via-teal-950/40 to-black',
      borda: 'border-emerald-500/30 hover:border-emerald-500/50',
      iconeCor: 'text-emerald-400 bg-emerald-500/20',
      rota: '/admin-laboratorio-aulas',
      metricas: 'Animação 2D · Em 8 min',
    },
    {
      id: 'flashcards-resumos',
      titulo: 'Flashcards & Resumos Didáticos',
      subtitulo: 'Fixação ativa com repetição espaçada e resumos estruturados por doutrinadores renomados.',
      badge: 'MEMORIZAÇÃO',
      icone: Layers,
      gradiente: 'from-purple-500/20 via-violet-950/40 to-black',
      borda: 'border-purple-500/30 hover:border-purple-500/50',
      iconeCor: 'text-purple-400 bg-purple-500/20',
      rota: '/flashcards',
      metricas: 'Repetição Espaçada',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white relative overflow-hidden pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
      {/* Background Padrão com ShapeGrid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShapeGrid />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* ── HEADER DA SALA DE APRENDIZAGEM ── */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                SALA DE APRENDIZAGEM
              </span>
              <span className="text-xs text-zinc-400">100% Aulas & Vídeos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
              Aprender
              <GraduationCap className="w-6 h-6 text-rose-500" />
            </h1>
          </div>

          {/* Gamificação / Streak no Topo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-orange-950/40 border border-orange-500/30 text-orange-400 text-xs font-bold shadow-md">
              <Flame className="w-4 h-4 fill-current animate-pulse" />
              <span>14d ofensiva</span>
            </div>
          </div>
        </div>

        {/* ── CARD "CONTINUAR DE ONDE PAROU" (RETOMADA INSTANTÂNEA) ── */}
        <div 
          onClick={() => {
            try { haptic.impact('heavy'); } catch {};
            navigate('/aulas-em-trilha');
          }}
          className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-zinc-900/90 to-zinc-900/60 border border-rose-500/30 hover:border-rose-500/50 transition-all cursor-pointer group shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 text-rose-400 font-bold font-mono">
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              CONTINUAR AULA EM ANDAMENTO
            </span>
            <span className="text-zinc-400 font-medium">Módulo 4 de 106</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                Direito Penal: Teoria da Tipicidade & Conduta
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                Aula 14 · Elementos subjetivos do tipo (Dolo e Culpa) · 18 minutos restantes
              </p>
            </div>

            <button
              type="button"
              className="px-5 py-2.5 rounded-2xl bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg group-hover:bg-zinc-200 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Retomar Aula</span>
            </button>
          </div>

          {/* Barra de Progresso da Aula */}
          <div className="mt-3.5 w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full w-[65%]" />
          </div>
        </div>

        {/* ── FILTRO DE DISCIPLINAS EM CHIPS ── */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Filtrar por Disciplina
          </span>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            {materias.map((materia) => (
              <button
                key={materia}
                type="button"
                onClick={() => {
                  try { haptic.selection(); } catch {};
                  setMateriaAtiva(materia);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  materiaAtiva === materia
                    ? 'bg-white text-zinc-950 shadow-md'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5'
                }`}
              >
                {materia}
              </button>
            ))}
          </div>
        </div>

        {/* ── GRADE DAS 5 MODALIDADES DE APRENDIZAGEM ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight uppercase tracking-wider text-zinc-300">
              Modalidades de Estudo
            </h2>
            <span className="text-xs text-zinc-500 font-mono">5 Formatos Integrados</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {modalidades.map((mod) => {
              const Icone = mod.icone;
              return (
                <div
                  key={mod.id}
                  onClick={() => {
                    try { haptic.impact('medium'); } catch {};
                    navigate(mod.rota);
                  }}
                  className={`p-4 rounded-3xl bg-gradient-to-br ${mod.gradiente} border ${mod.borda} transition-all cursor-pointer group shadow-lg flex flex-col justify-between`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 rounded-2xl ${mod.iconeCor} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                      <Icone className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-200 border border-white/10">
                      {mod.badge}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                      {mod.titulo}
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed line-clamp-2">
                      {mod.subtitulo}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-3 text-xs">
                    <span className="text-[11px] font-mono text-zinc-400 font-medium">
                      {mod.metricas}
                    </span>
                    <span className="text-rose-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Acessar <ChevronRight className="w-3.5 h-3.5" />
                    </span>
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
