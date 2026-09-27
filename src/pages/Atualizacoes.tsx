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

  type TabId = 'novidades' | 'noticias' | 'leis' | 'legislacao' | 'aplicativo' | 'boletins';
  const [activeTab, setActiveTab] = useState<TabId>('novidades');
  
  const [leis, setLeis] = useState<ResenhaItem[]>([]);
  const [noticias, setNoticias] = useState<NoticiaJuridica[]>([]);
  const [boletins, setBoletins] = useState<BoletimJuridico[]>([]);
  const [pls, setPls] = useState<RadarPL[]>([]);
  const [concursos, setConcursos] = useState<ConcursoNoticia[]>([]);

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
            className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/50 border border-white/15 text-white backdrop-blur-md transition-colors hover:bg-black/70 active:opacity-70 shadow-xl cursor-pointer"
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
        <div className="flex overflow-x-auto no-scrollbar -mt-2 mb-4 px-4 -mx-4 pb-2">
          <div className="flex items-center gap-2 px-1">
            {[
              { id: 'novidades', label: 'Novidades' },
              { id: 'noticias', label: 'Notícias' },
              { id: 'leis', label: 'Leis' },
              { id: 'legislacao', label: 'Legislação' },
              { id: 'aplicativo', label: 'Aplicativo' },
              { id: 'boletins', label: 'Boletins' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { haptic.selection(); setActiveTab(tab.id as TabId); }}
                className={cn("px-5 py-2 rounded-full text-[13.5px] font-medium transition-all duration-300 cursor-pointer whitespace-nowrap border", 
                  activeTab === tab.id 
                    ? 'bg-white/15 border-white/20 text-white shadow-sm' 
                    : 'bg-white/5 border-transparent text-muted-foreground hover:text-white hover:bg-white/10'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {() && ( <>


</> )}

        {() && ( <>


</> )}

        {() && ( <>


</> )}

        {() && ( <>


</> )}

        {() && ( <>


</> )}

        {() && ( <>


</> )}

      </main>
    </div>
  );
};

export default memo(Atualizacoes);