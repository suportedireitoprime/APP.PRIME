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

          {/* Ações da direita: Badge R2 e Abrir em Nova Aba */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> Servido via R2
            </span>
            <a
              href={`${aulaAtiva.urlHtmlR2}?t=${Date.now()}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 sm:p-2.5 rounded-xl border border-[rgba(226,62,87,0.35)] bg-[rgba(46,15,24,0.7)] text-[#ff8296] hover:text-white transition hover:bg-[rgba(66,20,34,0.9)] active:scale-95"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </a>
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
      {/* Cabeçalho Temático de Direito Penal para o Catálogo */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[rgba(226,62,87,0.3)] shadow-lg shadow-black/50 backdrop-blur-md"
        style={{
          background: 'linear-gradient(180deg, rgba(38,6,15,0.96) 0%, rgba(20,4,9,0.96) 100%)',
          paddingTop: 'calc(1rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
        }}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/admin-funcoes')}
            className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-[rgba(46,15,24,0.85)] border border-[rgba(226,62,87,0.4)] flex items-center justify-center shrink-0 text-[#ff8296] hover:bg-[rgba(66,20,34,1)] hover:text-white transition active:scale-95"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff8296]">
              PAINEL ADMINISTRATIVO
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-wide text-white uppercase font-sans">
              Aulas Interativas
            </h1>
          </div>
        </div>

        <span className="text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-500/15 text-[#ff8296] border border-red-500/30">
          Direito Penal
        </span>
      </header>

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
