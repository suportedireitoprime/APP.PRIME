import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { 
  Sparkles, Play, CheckCircle2, BookOpen, Layers, 
  ExternalLink, ArrowLeft, Headphones, RefreshCw, Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { InteractiveAulaPlayer, AulaData } from '@/components/aulas-interativas/InteractiveAulaPlayer';

// Dados da Aula 01 com carregamento instantâneo a 0ms (Padrão Vacatio)
import aula01Data from '@/data/aulas-interativas/direito-penal-aula-01.json';

interface AulaItem {
  id: string;
  materia: string;
  titulo: string;
  slug: string;
  etapas: number;
  audioQtd: number;
  imagensQtd: number;
  urlHtmlR2: string;
  urlJsonR2: string;
  capaUrl: string;
  status: 'pronto' | 'pendente';
  data: AulaData;
}

const AULAS_CATALOGO: AulaItem[] = [
  {
    id: 'penal-01-01',
    materia: '01. Crimes Contra a Família',
    titulo: 'Aula 01 - Crimes Contra a Família (Bigamia)',
    slug: 'aula-01-crimes-contra-a-familia',
    etapas: 32,
    audioQtd: 32,
    imagensQtd: 30,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/aula.html',
    urlJsonR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/aula.json',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/capa-3x4.webp',
    status: 'pronto',
    data: aula01Data as unknown as AulaData
  }
];

export default function AdminAulasInterativas() {
  const navigate = useNavigate();
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-20">
      {/* Quando a aula estiver ativa: Player Nativo React em Tela Cheia */}
      {aulaAtiva && (
        <InteractiveAulaPlayer
          aula={aulaAtiva.data}
          onClose={() => setAulaAtiva(null)}
          onComplete={() => {
            toast.success('Parabéns! Aula concluída com sucesso!');
            setAulaAtiva(null);
          }}
        />
      )}

      <PageHeader 
        title="Aulas Interativas" 
        onBack={() => navigate('/admin-funcoes')} 
      />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Banner de Apresentação */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-950/60 via-zinc-900 to-zinc-900 border border-red-500/30 shadow-2xl space-y-2.5">
          <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs uppercase tracking-widest">
            <Zap className="w-4 h-4 fill-current" />
            <span>Motor Nativo React · 120fps Fluidez Máxima</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Aulas Interativas do Direito Prime
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl">
            Experiência imersiva 100% nativa sem WebViews lentas: narração fluida sincronizada com áudios no Cloudflare R2, mecânicas interativas (quiz, flashcards 3D, comparador deslizante, hotspots e mapa mental) com responsividade perfeita para mobile e desktop.
          </p>
        </div>

        {/* Catálogo de Aulas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Matérias e Aulas Disponíveis ({AULAS_CATALOGO.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AULAS_CATALOGO.map((aula) => (
              <div
                key={aula.id}
                className="group rounded-3xl bg-zinc-900/80 border border-white/10 hover:border-red-500/40 p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between shadow-xl shadow-black/40 hover:shadow-red-500/10"
              >
                <div className="flex gap-4">
                  {/* Capa 3x4 */}
                  <div className="relative w-20 h-28 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950 shadow-md">
                    <img 
                      src={aula.capaUrl} 
                      alt={aula.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute bottom-1 right-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-red-600/90 text-white">
                      {aula.etapas}p
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block truncate">
                      {aula.materia}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-red-300 transition-colors font-serif">
                      {aula.titulo}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-zinc-400">
                      <span className="inline-flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        <Headphones className="w-3 h-3 text-red-400" />
                        {aula.audioQtd} áudios
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        <Layers className="w-3 h-3 text-amber-400" />
                        {aula.imagensQtd} ilustrações
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Motor React 100% Nativo
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setAulaAtiva(aula);
                      toast.success(`Iniciando ${aula.titulo}`);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white transition shadow-lg shadow-red-600/30 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar Aula</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
