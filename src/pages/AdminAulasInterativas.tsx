import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { 
  Sparkles, Play, CheckCircle2, BookOpen, Layers, 
  ExternalLink, ArrowLeft, Headphones, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';

interface AulaItem {
  id: string;
  materia: string;
  titulo: string;
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
    slug: 'aula-01-crimes-contra-a-familia',
    etapas: 32,
    audioQtd: 32,
    imagensQtd: 30,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/capa-3x4.webp',
    status: 'pronto'
  }
];

export default function AdminAulasInterativas() {
  const navigate = useNavigate();
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-20">
      <PageHeader 
        title="Aulas Interativas" 
        onBack={() => {
          if (aulaAtiva) {
            setAulaAtiva(null);
          } else {
            navigate('/admin-funcoes');
          }
        }} 
      />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {aulaAtiva ? (
          /* Visualizador Interativo da Aula */
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-zinc-900/80 p-3.5 rounded-2xl border border-white/10">
              <button
                onClick={() => setAulaAtiva(null)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-300 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar ao catálogo</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Servido via Cloudflare R2
                </span>
                <a
                  href={aulaAtiva.urlHtmlR2}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white transition hover:bg-white/10"
                  title="Abrir em nova aba"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Container do player interativo */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl h-[84vh] max-h-[920px]">
              <iframe
                src={aulaAtiva.urlHtmlR2}
                title={aulaAtiva.titulo}
                className="w-full h-full border-0"
                allow="autoplay; clipboard-write"
              />
            </div>
          </div>
        ) : (
          /* Lista das Matérias e Aulas */
          <>
            <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900/90 border border-red-500/20 shadow-xl space-y-2">
              <div className="flex items-center gap-2.5 text-red-400 font-bold text-xs uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                <span>Direito Penal · Aulas Prontas</span>
              </div>
              <h2 className="text-xl font-bold font-display text-white">
                Ambiente de Aulas Interativas
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
                Aulas completas com HTML interativo vertical, player lateral de narração por etapa, desafios com pontuação, mapas mentais e ilustrações próprias com áudios e imagens servidos em alta velocidade pelo Cloudflare R2.
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
                    className="group rounded-2xl bg-zinc-900/70 border border-white/10 hover:border-red-500/40 p-4 transition-all duration-300 flex flex-col justify-between shadow-lg shadow-black/30 hover:shadow-red-500/10"
                  >
                    <div className="flex gap-4">
                      {/* Capa 3x4 */}
                      <div className="relative w-20 h-28 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950 shadow-md">
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
                        <h4 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-red-300 transition-colors">
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
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pronta no R2
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setAulaAtiva(aula);
                          toast.success(`Abrindo ${aula.titulo}`);
                        }}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition shadow-md shadow-primary/20 active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Iniciar Aula</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
