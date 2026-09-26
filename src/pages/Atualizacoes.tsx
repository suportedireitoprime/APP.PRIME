import React, { memo, useEffect, useState, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, MicVocal, FileText, Smartphone, ChevronRight, GraduationCap, Clock, ArrowUpRight, Newspaper, X, ExternalLink } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { fetchProposicoes } from '@/services/radarService';
import { resenhaSelect, RESENHA_LIST_SELECT } from '@/lib/resenhaBackend';
import { AuthorAvatar } from '@/components/radar/AuthorAvatar';
import { getConcursoVisual } from '@/lib/concursosVisuais';
import type { ResenhaItem } from '@/services/atualizacaoService';
import type { Database } from '@/integrations/supabase/types';

type NoticiaJuridica = Database['public']['Tables']['noticias_juridicas']['Row'];
type ConcursoNoticia = Database['public']['Tables']['concursos_noticias']['Row'];
type BoletimJuridico = Pick<Database['public']['Tables']['boletins_juridicos']['Row'], 'id' | 'data_ref' | 'titulo' | 'subtitulo' | 'tipo'>;

interface RadarPL {
  id: string;
  id_externo: string;
  sigla_tipo?: string;
  numero: string;
  ano: string;
  ementa?: string;
  dados_json?: Record<string, any>;
  created_at?: string;
}

const Atualizacoes = () => {
  const getAvatarUrl = (title: string) => {
    const cleanTitle = title.split('-')[0].trim().substring(0, 20);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanTitle)}&background=10B981&color=fff&size=128&bold=true&font-size=0.4`;
  };
  const openExternalLink = (url: string) => {
    if (Capacitor.isNativePlatform()) {
      void Browser.open({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'novidades' | 'noticias'>('noticias');
  
  const [leis, setLeis] = useState<ResenhaItem[]>([]);
  const [noticias, setNoticias] = useState<NoticiaJuridica[]>([]);
  const [boletins, setBoletins] = useState<BoletimJuridico[]>([]);
  const [pls, setPls] = useState<RadarPL[]>([]);
  const [concursos, setConcursos] = useState<ConcursoNoticia[]>([]);
  const [modalConcursosOpen, setModalConcursosOpen] = useState(false);

  useEffect(() => {
    // 1. Novas Leis
    resenhaSelect<ResenhaItem>({ select: RESENHA_LIST_SELECT, order: 'data_dou.desc', limit: '10' })
      .then(res => {
        if (res) setLeis(res);
      })
      .catch(() => {});
    
    // 2. Notícias
    supabase.from('noticias_juridicas')
      .select('*')
      .order('data_publicacao', { ascending: false })
      .limit(10)
      .then(res => {
        if (res.data) setNoticias(res.data);
      });
    
    // 2. Boletins
    supabase.from('boletins_juridicos')
      .select('id, data_ref, titulo, subtitulo, tipo')
      .in('status', ['pronto', 'sem_leis'])
      .order('data_ref', { ascending: false })
      .limit(10)
      .then(res => {
        if (res.data) setBoletins(res.data);
      });
      
    // 3. Proposições (Câmara)
    fetchProposicoes().then(res => {
       if (res) setPls(res.slice(0, 10));
    });

    // 4. Concursos
    supabase.from('concursos_noticias')
      .select('*')
      .order('data_publicacao', { ascending: false })
      .limit(50)
      .then(res => {
        if (res.data) setConcursos(res.data);
      });
  }, []);

  const handleBack = () => {
    haptic.light();
    navigate(-1);
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const diff = new Date().getTime() - date.getTime();
    if (diff < 86400000) return 'Hoje';
    if (diff < 86400000 * 2) return 'Ontem';
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <ShapeGrid />
      </div>

      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 pt-[var(--sai-top,env(safe-area-inset-top,0px))]">
        <div className="flex items-center justify-between px-4 h-16 sm:h-20">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Voltar"
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/15 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:scale-95 shadow-xl cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
          </button>
          <h1 className="text-[17px] sm:text-[19px] font-display font-bold uppercase tracking-widest text-foreground">
            GIRO JURÍDICO
          </h1>
          <div className="w-12 h-12 sm:w-[52px] sm:h-[52px]" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-10 pb-32">
        
        {/* Menu de Alternância */}
        <div className="flex justify-center -mt-2 mb-2">
          <div className="bg-white/5 border border-white/10 p-1 rounded-full flex items-center backdrop-blur-md">
            <button 
              onClick={() => { haptic.selection(); setActiveTab('novidades'); }}
              className={cn("px-6 py-2 rounded-full text-[14px] font-medium transition-all duration-300 cursor-pointer", 
                activeTab === 'novidades' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'
              )}
            >
              Novidades
            </button>
            <button 
              onClick={() => { haptic.selection(); setActiveTab('noticias'); }}
              className={cn("px-6 py-2 rounded-full text-[14px] font-medium transition-all duration-300 cursor-pointer", 
                activeTab === 'noticias' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'
              )}
            >
              Notícias
            </button>
          </div>
        </div>

        {activeTab === 'novidades' && (
          <>
            {/* Carrossel 1: Leis */}
        <section>
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#34D399]" />
              <h2 className="font-display text-foreground text-[18px] font-bold uppercase tracking-widest">
                Novas Leis
              </h2>
            </div>
            <button 
              onClick={() => { haptic.light(); startTransition(() => navigate('/radar-360')); }}
              className="flex items-center gap-1 text-[12px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-white font-medium transition-colors active:scale-95 cursor-pointer"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-muted-foreground text-[13px] px-1 mb-4 truncate">
            Fique por dentro das últimas leis e alterações publicadas
          </p>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar px-1 -mr-4 pr-4">
            {leis.length > 0 ? leis.map((lei) => (
              <div 
                key={lei.id} 
                onClick={() => { haptic.selection(); startTransition(() => navigate(`/radar-360?lei=${lei.id}`)); }}
                className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start bg-card/80 backdrop-blur-md rounded-2xl border border-border/40 p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:bg-card transition-colors active:scale-95"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Scale className="w-16 h-16 sm:w-20 sm:h-20" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#34D399]/20 text-[#34D399] flex items-center justify-center mb-1">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-semibold text-[15px] sm:text-[16px] leading-tight line-clamp-2">{lei.tipo_ato} {lei.numero_ato}</h3>
                <p className="text-muted-foreground text-[13px] sm:text-[14px] line-clamp-2">{lei.ementa}</p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-[11px] sm:text-[12px] text-muted-foreground/70 font-medium">{formatDate(lei.data_dou || lei.data_publicacao)}</span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-[#34D399]/10 text-[#34D399] px-2.5 py-1 rounded-full flex items-center gap-1">
                    Ler <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )) : (
              <div className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start bg-card/30 rounded-2xl animate-pulse" />
            )}
          </div>
        </section>

        {/* Carrossel 3: Propostas */}
        {/* Carrossel 4: Atualizações do App */}
        <section>
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#C084FC]" />
              <h2 className="font-display text-foreground text-[18px] font-bold uppercase tracking-widest">
                Novidades do App
              </h2>
            </div>
          </div>
          <p className="text-muted-foreground text-[13px] px-1 mb-4 truncate">
            Fique sabendo dos últimos recursos adicionados
          </p>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar px-1 -mr-4 pr-4">
            {[1, 2].map((i) => (
              <div key={i} className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start bg-card/80 backdrop-blur-md rounded-2xl border border-border/40 p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Smartphone className="w-16 h-16 sm:w-20 sm:h-20" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#C084FC]/20 text-[#C084FC] flex items-center justify-center mb-1">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-semibold text-[15px] sm:text-[16px] leading-tight line-clamp-2">Versão 2.4 Liberada</h3>
                <p className="text-muted-foreground text-[13px] sm:text-[14px] line-clamp-2">Novo painel de explicações ao vivo e melhorias no Vade Mecum.</p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-[11px] sm:text-[12px] text-muted-foreground/70 font-medium">Versão atual</span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-[#C084FC]/10 text-[#C084FC] px-2.5 py-1 rounded-full flex items-center gap-1">
                    Ver <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
          </>
        )}

        {activeTab === 'noticias' && (
          <>
            {/* Carrossel 2: Notícias Jurídicas */}
            <section>
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-[#FACC15]" />
                  <h2 className="font-display text-foreground text-[18px] font-bold uppercase tracking-widest">
                    Notícias Jurídicas
                  </h2>
                </div>
                <button onClick={() => { haptic.light(); startTransition(() => navigate('/noticias')); }} className="flex items-center gap-1 text-[12px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-white font-medium transition-colors active:scale-95 cursor-pointer">Ver todos <ChevronRight className="w-4 h-4" /></button>
              </div>
              <p className="text-muted-foreground text-[13px] px-1 mb-4 truncate">
                Principais destaques do mundo jurídico
              </p>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar px-1 -mr-4 pr-4">
                {noticias.length > 0 ? noticias.map((noticia) => (
                  <div 
                    key={noticia.id} 
                    onClick={() => { haptic.selection(); openExternalLink(noticia.link); }}
                    className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start relative overflow-hidden rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-card">
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(noticia.fonte || 'Noticia')}&background=FACC15&color=000&size=128&bold=true`} alt="" className="w-16 h-16 rounded-full object-contain drop-shadow-md border border-white/10 opacity-80" />
                    </div>
                    
                    {noticia.imagem_url && (
                      <img
                        src={noticia.imagem_url.includes('http') ? noticia.imagem_url : `https://m.migalhas.com.br${noticia.imagem_url}`}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover brightness-105 contrast-[1.02]"
                      />
                    )}
                    
                    <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/95 via-black/50 via-60% to-transparent pointer-events-none" />
                    
                    <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
                      <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                    </div>

                    <span className="absolute top-2.5 left-2.5 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[10.5px] font-bold tracking-wide text-white bg-black/60 backdrop-blur-md border border-white/20 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FACC15] animate-pulse shrink-0" />
                      <span>{formatDate(noticia.data_publicacao)}</span>
                    </span>

                    <div className="absolute inset-0 flex flex-col justify-end px-4 pb-3 pt-4">
                      <div className="flex items-center gap-2 mb-1 text-[11.5px] text-white/90">
                        <Clock className="w-3 h-3" />
                        <span className="truncate">{noticia.fonte || 'Notícia'}</span>
                      </div>
                      <p className="font-display text-white text-[15px] font-normal leading-snug line-clamp-3 drop-shadow-sm">
                        {noticia.titulo}
                      </p>
                    </div>
                  </div>
                )) : (
                  <>
                    <div className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start bg-card/30 rounded-2xl animate-pulse" />
                    <div className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start bg-card/30 rounded-2xl animate-pulse" />
                  </>
                )}
              </div>
            </section>

            {/* Carrossel 5: Concursos Públicos */}
            <section>
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-[#10B981]" />
                  <h2 className="font-display text-foreground text-[18px] font-bold uppercase tracking-widest">
                    Concursos Públicos
                  </h2>
                </div>
                <button onClick={() => { haptic.light(); setModalConcursosOpen(true); }} className="flex items-center gap-1 text-[12px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-white font-medium transition-colors active:scale-95 cursor-pointer">Ver todos <ChevronRight className="w-4 h-4" /></button>
              </div>
              <p className="text-muted-foreground text-[13px] px-1 mb-4 truncate">
                Últimas oportunidades e editais abertos
              </p>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar px-1 -mr-4 pr-4">
                {concursos.length > 0 ? concursos.map((conc) => {
                  const visual = getConcursoVisual(conc.titulo, conc.imagem_url);
                  return (
                    <div
                      key={conc.id} 
                      onClick={() => {
                        haptic.selection();
                        openExternalLink(conc.link);
                      }}
                      className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start relative overflow-hidden rounded-2xl cursor-pointer active:scale-[0.98] transition-transform block bg-card/60 border border-white/10 group shadow-lg"
                    >
                      <img 
                        src={visual.imagemUrl} 
                        alt="" 
                        className="absolute inset-0 w-full h-full object-cover brightness-75 contrast-105 group-hover:scale-105 transition-transform duration-500" 
                        loading="lazy"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 via-50% to-black/30 pointer-events-none" />
                      
                      <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
                        <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                      </div>

                      <span className="absolute top-2.5 left-2.5 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[10.5px] font-bold tracking-wide text-white bg-emerald-500/80 backdrop-blur-md border border-white/20 shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                        <span>{visual.tag}</span>
                      </span>

                      <div className="absolute inset-0 flex flex-col justify-end px-4 pb-3.5 pt-4 z-10">
                        <div className="flex items-center gap-2 mb-1.5 text-[11px] text-white/80 font-medium">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span className="truncate">{formatDate(conc.data_publicacao)} · {visual.subtitulo}</span>
                        </div>
                        <p className="font-display text-white text-[14.5px] sm:text-[15px] font-semibold leading-snug line-clamp-3 drop-shadow-md">
                          {conc.titulo}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <>
                    <div className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start bg-card/30 rounded-2xl animate-pulse" />
                    <div className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start bg-card/30 rounded-2xl animate-pulse" />
                  </>
                )}
              </div>
            </section>
          </>
        )}
        <section>
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#60A5FA]" />
              <h2 className="font-display text-foreground text-[18px] font-bold uppercase tracking-widest">
                Câmara dos Deputados
              </h2>
            </div>
            <button 
              onClick={() => { haptic.light(); startTransition(() => navigate('/radar/proposicoes')); }}
              className="flex items-center gap-1 text-[12px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-white font-medium transition-colors active:scale-95 cursor-pointer"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-muted-foreground text-[13px] px-1 mb-4 truncate">
            Acompanhe projetos de lei e pautas em votação
          </p>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar px-1 -mr-4 pr-4">
            {pls.length > 0 ? pls.map((pl) => (
              <div 
                key={pl.id_externo || pl.dados_json?.id || pl.numero} 
                onClick={() => { haptic.selection(); startTransition(() => navigate(`/radar/pl/${pl.id_externo || pl.dados_json?.id}`)); }}
                className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start bg-card/80 backdrop-blur-md rounded-2xl border border-border/40 p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:bg-card transition-colors active:scale-95"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <FileText className="w-16 h-16 sm:w-20 sm:h-20" />
                </div>
                
                <div className="flex items-start justify-between mb-1">
                  <div className="w-10 h-10 rounded-xl bg-[#60A5FA]/20 text-[#60A5FA] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="-mt-1 -mr-2">
                    <AuthorAvatar proposicaoId={pl.id_externo || pl.dados_json?.id} />
                  </div>
                </div>
                
                <h3 className="font-sans font-semibold text-[15px] sm:text-[16px] leading-tight line-clamp-2">
                  {pl.sigla_tipo ?? pl.dados_json?.siglaTipo ?? 'PL'} {pl.numero ?? pl.dados_json?.numero ?? ''}/{pl.ano ?? pl.dados_json?.ano ?? ''}
                </h3>
                <p className="text-muted-foreground text-[13px] sm:text-[14px] line-clamp-2">{pl.ementa ?? pl.dados_json?.ementa ?? 'Sem ementa disponível.'}</p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-[11px] sm:text-[12px] text-muted-foreground/70 font-medium line-clamp-1 max-w-[120px]">
                    {pl.dados_json?.statusProposicao?.descricaoTramitacao || 'Em tramitação'}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-[#60A5FA]/10 text-[#60A5FA] px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                    Ver <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )) : (
              <div className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start bg-card/30 rounded-2xl animate-pulse" />
            )}
          </div>
        </section>

        {/* Modal / Dialog: Todos os Concursos Públicos */}
        {modalConcursosOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0F1115] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              {/* Header do Modal */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-6 rounded-full bg-[#10B981]" />
                  <div>
                    <h3 className="font-display text-white text-[17px] sm:text-[19px] font-bold uppercase tracking-wider">
                      Todos os Concursos Públicos
                    </h3>
                    <p className="text-muted-foreground text-[12px] sm:text-[13px]">
                      {concursos.length} editais e oportunidades abertas no país
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { haptic.light(); setModalConcursosOpen(false); }}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista dos Concursos */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 hide-scrollbar">
                {concursos.map((conc) => {
                  const visual = getConcursoVisual(conc.titulo, conc.imagem_url);
                  return (
                    <div
                      key={conc.id}
                      onClick={() => {
                        haptic.selection();
                        openExternalLink(conc.link);
                      }}
                      className="group flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer active:scale-[0.99]"
                    >
                      {/* Miniatura / Capa */}
                      <div className="relative w-full sm:w-28 h-32 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10">
                        <img
                          src={visual.imagemUrl}
                          alt=""
                          className="w-full h-full object-cover brightness-90 group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/90 text-white shadow-sm">
                          {visual.tag}
                        </span>
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          <span>{formatDate(conc.data_publicacao)}</span>
                          <span>•</span>
                          <span className="text-emerald-400/90 font-medium">{visual.subtitulo}</span>
                        </div>
                        <h4 className="font-display text-white text-[14px] sm:text-[15px] font-medium leading-snug line-clamp-2 group-hover:text-emerald-300 transition-colors">
                          {conc.titulo}
                        </h4>
                        {conc.resumo && (
                          <p className="text-muted-foreground text-[12px] line-clamp-1 mt-1">
                            {conc.resumo}
                          </p>
                        )}
                      </div>

                      {/* Botão Acessar */}
                      <div className="shrink-0 self-end sm:self-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                          Acessar <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rodapé do Modal */}
              <div className="p-3.5 sm:p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-muted-foreground">
                <span>Fonte: PCI Concursos / Diários Oficiais</span>
                <button
                  type="button"
                  onClick={() => { haptic.light(); openExternalLink('https://www.pciconcursos.com.br/noticias/'); }}
                  className="text-emerald-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  Abrir portal externo <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}



      </main>
    </div>
  );
};

export default memo(Atualizacoes);