import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { 
  Sparkles, Play, CheckCircle2, BookOpen, Layers, 
  ExternalLink, ArrowLeft, Headphones
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
      {/* Quando a aula estiver ativa: Modo Tela Cheia Imersivo com o HTML Exato Original */}
      {aulaAtiva && (
        <div className="fixed inset-0 z-50 bg-[#120409] flex flex-col w-screen h-screen">
          {/* Barra superior de navegação discreta */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-2 bg-[#140409]/95 border-b border-[rgba(226,62,87,0.25)] backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setAulaAtiva(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[rgba(226,62,87,0.3)] bg-[rgba(46,15,24,0.6)] text-xs font-bold text-[#f8edef] hover:bg-[rgba(56,18,30,0.8)] transition active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-[#ff8296]" />
                <span>Voltar ao catálogo</span>
              </button>
              <span className="hidden md:inline-block text-xs font-bold text-[#f8edef] truncate font-serif">
                {aulaAtiva.titulo}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Servido via Cloudflare R2
              </span>
              <a
                href={`${aulaAtiva.urlHtmlR2}?t=${Date.now()}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-xl border border-[rgba(226,62,87,0.3)] bg-[rgba(46,15,24,0.6)] text-[#ff8296] hover:text-white transition hover:bg-[rgba(56,18,30,0.8)]"
                title="Abrir em nova aba"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

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
      )}

      <PageHeader 
        title="Aulas Interativas" 
        onBack={() => navigate('/admin-funcoes')} 
      />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Banner de Apresentação com Identidade de Direito Penal */}
        <div 
          className="p-5 sm:p-6 rounded-3xl border border-[rgba(226,62,87,0.35)] shadow-2xl space-y-2.5"
          style={{
            background: 'linear-gradient(135deg, rgba(46,18,25,0.7) 0%, rgba(20,4,9,0.95) 100%)',
            boxShadow: '0 20px 44px rgba(0,0,0,0.6), 0 0 34px rgba(226,62,87,0.15)'
          }}
        >
          <div className="flex items-center gap-2 text-[#ff8296] font-extrabold text-xs uppercase tracking-[2.4px]">
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Direito Penal · Aulas Prontas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
            Ambiente de Aulas Interativas
          </h2>
          <p className="text-xs sm:text-sm text-[#f8edef] leading-relaxed max-w-2xl">
            Aulas com layout original preservado: tipografias Playfair Display e Source Sans 3, paleta vermelho com dourado, player de narração centralizado no rodapé, sem barra de rolagem e responsivo para qualquer tela.
          </p>
        </div>

        {/* Catálogo de Aulas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#c9a7ad] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Matérias e Aulas Disponíveis ({AULAS_CATALOGO.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AULAS_CATALOGO.map((aula) => (
              <div
                key={aula.id}
                className="group rounded-3xl border border-[rgba(226,62,87,0.25)] hover:border-[rgba(226,62,87,0.5)] p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between shadow-xl shadow-black/40 hover:shadow-red-500/10"
                style={{ background: 'linear-gradient(180deg, #2e1219 0%, #250d14 100%)' }}
              >
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
                    <h4 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-[#ff8296] transition-colors font-serif">
                      {aula.titulo}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#c9a7ad]">
                      <span className="inline-flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        <Headphones className="w-3 h-3 text-[#ff8296]" />
                        {aula.audioQtd} áudios
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                        <Layers className="w-3 h-3 text-[#e9cd6d]" />
                        {aula.imagensQtd} ilustrações
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[rgba(226,62,87,0.2)] flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pronta no R2
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setAulaAtiva(aula);
                      toast.success(`Iniciando ${aula.titulo}`);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition active:scale-95 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #ff7a8a 0%, #c8102e 100%)',
                      boxShadow: '0 4px 14px rgba(226,62,87,0.4)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
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
