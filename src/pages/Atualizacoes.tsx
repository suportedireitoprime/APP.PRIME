import React, { memo, useEffect, useState, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scale, MicVocal, FileText, Smartphone, ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { supabase } from '@/integrations/supabase/client';
import { fetchProposicoes } from '@/services/radarService';
import { resenhaSelect, RESENHA_LIST_SELECT } from '@/lib/resenhaBackend';
import { AuthorAvatar } from '@/components/radar/AuthorAvatar';
import type { ResenhaItem } from '@/services/atualizacaoService';

const Atualizacoes = () => {
  const navigate = useNavigate();

  const [leis, setLeis] = useState<ResenhaItem[]>([]);
  const [boletins, setBoletins] = useState<any[]>([]);
  const [pls, setPls] = useState<any[]>([]);

  useEffect(() => {
    // 1. Novas Leis
    resenhaSelect<ResenhaItem>({ select: RESENHA_LIST_SELECT, order: 'data_dou.desc', limit: '10' })
      .then(res => {
        if (res) setLeis(res);
      })
      .catch(() => {});
    
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
                className="w-[240px] h-[180px] sm:w-[280px] sm:h-[190px] shrink-0 snap-start bg-card/80 backdrop-blur-md rounded-2xl border border-border/40 p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:bg-card transition-colors active:scale-95"
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
              <div className="w-[240px] h-[180px] shrink-0 snap-start bg-card/30 rounded-2xl animate-pulse" />
            )}
          </div>
        </section>

        {/* Carrossel 2: Boletins */}
        <section>
          <div className="flex items-center justify-between mb-1 px-1">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#FACC15]" />
              <h2 className="font-display text-foreground text-[18px] font-bold uppercase tracking-widest">
                Boletins Diários
              </h2>
            </div>
            <button 
              onClick={() => { haptic.light(); startTransition(() => navigate('/boletins')); }}
              className="flex items-center gap-1 text-[12px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-white font-medium transition-colors active:scale-95 cursor-pointer"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-muted-foreground text-[13px] px-1 mb-4 truncate">
            Resumos em áudio e texto das principais decisões do dia
          </p>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar px-1 -mr-4 pr-4">
            {boletins.length > 0 ? boletins.map((bol) => (
              <div 
                key={bol.id} 
                onClick={() => { haptic.selection(); startTransition(() => navigate(bol.tipo === 'noticias' ? `/boletins-noticias/${bol.id}` : `/boletins/${bol.id}`)); }}
                className="w-[240px] h-[180px] sm:w-[280px] sm:h-[190px] shrink-0 snap-start bg-card/80 backdrop-blur-md rounded-2xl border border-border/40 p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:bg-card transition-colors active:scale-95"
              >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <MicVocal className="w-16 h-16 sm:w-20 sm:h-20" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#FACC15]/20 text-[#FACC15] flex items-center justify-center mb-1">
                  <MicVocal className="w-5 h-5" />
                </div>
                <h3 className="font-sans font-semibold text-[15px] sm:text-[16px] leading-tight line-clamp-2">{bol.titulo}</h3>
                <p className="text-muted-foreground text-[13px] sm:text-[14px] line-clamp-2">{bol.subtitulo || 'Resumo do boletim jurídico e notícias diárias.'}</p>
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-[11px] sm:text-[12px] text-muted-foreground/70 font-medium">{formatDate(bol.data_ref)}</span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-[#FACC15]/10 text-[#FACC15] px-2.5 py-1 rounded-full flex items-center gap-1">
                    Escutar <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            )) : (
              <div className="w-[240px] h-[180px] shrink-0 snap-start bg-card/30 rounded-2xl animate-pulse" />
            )}
          </div>
        </section>

        {/* Carrossel 3: Propostas */}
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
              <div className="w-[240px] h-[180px] shrink-0 snap-start bg-card/30 rounded-2xl animate-pulse" />
            )}
          </div>
        </section>

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
              <div key={i} className="w-[240px] h-[180px] sm:w-[280px] sm:h-[190px] shrink-0 snap-start bg-card rounded-2xl border border-border/40 p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden">
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

      </main>
    </div>
  );
};

export default memo(Atualizacoes);
