import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import ShapeGrid from '@/components/ui/ShapeGrid';

interface EventoCamara {
  id: number;
  titulo: string;
  descricao: string;
  horaInicio: string;
  horaFim: string;
  local: string;
  orgaos: string;
  situacao: string;
}

const TIPO_EVENTO_LEGENDA: Record<string, string> = {
  'REUNIÃO TÉCNICA': 'Encontro focado em debater aspectos técnicos e específicos de um tema ou projeto em andamento.',
  'SESSÃO DELIBERATIVA': 'Onde os deputados votam e decidem sobre projetos de lei, medidas provisórias e outras proposições.',
  'SESSÃO SOLENE': 'Reunião especial destinada a homenagens, comemorações e eventos cívicos, sem votação de projetos.',
  'SESSÃO NÃO DELIBERATIVA': 'Sessão destinada apenas a discursos, debates e comunicações parlamentares, sem votação.',
  'REUNIÃO DELIBERATIVA': 'Reunião de comissão focada em votar relatórios e projetos de lei em tramitação.',
  'AUDIÊNCIA PÚBLICA': 'Evento aberto para ouvir especialistas, representantes da sociedade e cidadãos sobre um tema relevante.',
  'SEMINÁRIO': 'Evento amplo para discussão e palestras sobre assuntos de interesse público.',
  'COMISSÃO PARLAMENTAR DE INQUÉRITO': 'Reunião destinada a investigar denúncias de irregularidades e fatos determinados.'
};

const getLegenda = (titulo: string) => {
  if (!titulo) return null;
  const t = titulo.toUpperCase();
  for (const [key, value] of Object.entries(TIPO_EVENTO_LEGENDA)) {
    if (t.includes(key)) return value;
  }
  return null;
};

const formatarDescricao = (texto: string) => {
  if (!texto) return null;
  // Expressão regular avançada: encontra letras minúsculas/números encostados 
  // em letras maiúsculas que deveriam estar separados (API envia tudo colado)
  // Ex: "cultural: Coral", "18h20 Abertura"
  const formatted = texto.replace(/([a-zçãõáéíóú0-9:;,)])\s+([A-ZÀ-Ú])/g, '$1\n\n$2');
  
  const linhas = formatted.split(/\n+/);
  return (
    <>
      {linhas.map((linha, idx) => {
        if (!linha.trim()) return null;
        return (
          <p key={idx} className="text-[13px] text-white/70 leading-relaxed text-justify mb-2 last:mb-0">
            {linha.trim()}
          </p>
        );
      })}
    </>
  );
};

const AgendaCamara = () => {
  const navigate = useNavigate();
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [diasTimeline, setDiasTimeline] = useState<Date[]>([]);
  const [eventos, setEventos] = useState<EventoCamara[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Ref para rolar a linha do tempo até o dia selecionado (hoje) ao montar
  const timelineRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(true);

  // Gerar array de datas (-15 a +15 dias)
  useEffect(() => {
    const hoje = new Date();
    const arrayDias = [];
    for (let i = -15; i <= 15; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      arrayDias.push(d);
    }
    setDiasTimeline(arrayDias);
  }, []);

  // Centralizar o scroll no dia atual ao montar
  useEffect(() => {
    if (diasTimeline.length > 0 && timelineRef.current) {
      const todayIndex = diasTimeline.findIndex(
        d => d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
      );
      if (todayIndex !== -1) {
        const viewport = timelineRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollLeft = Math.max(0, (todayIndex * 64) - (window.innerWidth / 2) + 32);
        }
      }
    }
  }, [diasTimeline]);

  const fetchAgenda = async (data: string) => {
    try {
      setLoading(true);
      setErro(null);
      
      const { data: result, error } = await supabase.functions.invoke('agenda-camara', {
        body: { dataInicio: data, dataFim: data }
      });

      if (error) throw error;
      
      const evts = result.eventos || [];
      setEventos(evts);
    } catch (err: any) {
      console.error("Erro ao buscar agenda da Câmara:", err);
      setErro("Não foi possível carregar a pauta. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda(dataSelecionada);
  }, [dataSelecionada]);

  const formataDataTimeline = (d: Date) => {
    const dia = d.getDate().toString().padStart(2, '0');
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
  };

  const getDiaDaSemana = (d: Date) => {
    const dias = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    return dias[d.getDay()];
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] w-full safe-area-pt relative">
      
      <ShapeGrid 
         active={true} 
         className="absolute inset-0 z-0 opacity-40 pointer-events-none" 
         hoverFillColor="#0EA5E9" 
      />

      {/* Header Fixo */}
      <div className="flex-none bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/5 z-20">
        <div className="flex items-center justify-between px-4 h-14 sm:h-16">
          <button 
            onClick={() => {
              haptic.selection();
              navigate(-1);
            }}
            className="w-12 h-12 flex items-center justify-center -ml-3 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6 stroke-[2.4]" />
          </button>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest leading-none mb-1">
              Pauta do Dia
            </span>
            <h1 className="text-base font-bold text-white leading-none">
              Câmara dos Deputados
            </h1>
          </div>
          
          <div className="w-12 h-12" />
        </div>

        {/* Timeline Horizontal */}
        <div className="pb-3 w-full border-t border-white/5 pt-3 bg-black/20">
          <ScrollArea className="w-full whitespace-nowrap" ref={timelineRef}>
            <div className="flex w-max space-x-2 px-4">
              {diasTimeline.map((d, idx) => {
                const isSelected = d.toISOString().split('T')[0] === dataSelecionada;
                const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      haptic.selection();
                      setDataSelecionada(d.toISOString().split('T')[0]);
                      
                      // Centralizar no clique
                      if (timelineRef.current) {
                        const viewport = timelineRef.current.querySelector('[data-radix-scroll-area-viewport]');
                        if (viewport) {
                          viewport.scrollTo({
                            left: Math.max(0, (idx * 64) - (window.innerWidth / 2) + 32),
                            behavior: 'smooth'
                          });
                        }
                      }
                    }}
                    className={`flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl border transition-all duration-300 ${
                      isSelected 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 scale-110 shadow-lg shadow-rose-500/20 z-10 mx-1' 
                        : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider mb-1">
                      {isToday ? 'HOJE' : getDiaDaSemana(d)}
                    </span>
                    <span className={`text-sm font-black ${isSelected ? 'text-rose-400' : 'text-white/80'}`}>
                      {formataDataTimeline(d)}
                    </span>
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>
      </div>

      {/* Conteúdo Scrollável */}
      <ScrollArea className="flex-1 w-full relative z-10">
        <div className="p-4 pb-safe space-y-4">
          
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3 backdrop-blur-sm">
                  <Skeleton className="h-5 w-3/4 bg-white/10" />
                  <Skeleton className="h-4 w-1/2 bg-white/10" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-20 bg-white/10" />
                    <Skeleton className="h-4 w-24 bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && erro && (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Info className="w-10 h-10 text-rose-500 mb-3 opacity-80" />
              <p className="text-sm text-white/70">{erro}</p>
              <button 
                onClick={() => fetchAgenda(dataSelecionada)}
                className="mt-4 px-6 py-2 bg-white/10 rounded-full text-sm text-white hover:bg-white/20 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {!loading && !erro && eventos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-black/20 rounded-2xl border border-white/5 mt-4 backdrop-blur-sm">
              <CalendarIcon className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-base font-bold text-white/90 mb-1">Sem eventos programados</h3>
              <p className="text-sm text-white/50">Não há sessões ou comissões agendadas para esta data.</p>
            </div>
          )}

          {!loading && !erro && eventos.map((evento) => {
            const isExpanded = expandedId === evento.id;
            return (
              <div 
                key={evento.id} 
                onClick={() => {
                  haptic.selection();
                  setExpandedId(isExpanded ? null : evento.id);
                }}
                className="p-4 rounded-2xl bg-[#121214]/90 backdrop-blur-md border border-white/5 flex flex-col gap-2 relative overflow-hidden cursor-pointer transition-all hover:bg-[#1A1A1D]/90"
              >
                {/* Barra lateral */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500" />
                
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="text-[13px] sm:text-[14px] font-black uppercase tracking-widest text-white/95 leading-snug break-words flex-1">
                    {evento.titulo}
                  </h3>
                  {evento.situacao && (
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded bg-sky-500/10 text-sky-400 whitespace-nowrap flex-shrink-0 border border-sky-500/20">
                      {evento.situacao}
                    </span>
                  )}
                </div>
                
                {/* Info básica sempre visível */}
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 text-sky-400 bg-sky-500/10 px-2 py-1 rounded-md">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[12px] font-bold">
                      {evento.horaInicio ? new Date(evento.horaInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      {evento.horaFim ? ` às ${new Date(evento.horaFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </span>
                  </div>
                  
                  {evento.local && (
                    <div className="flex items-center gap-1.5 text-white/60">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-[12px] line-clamp-1">{evento.local}</span>
                    </div>
                  )}
                </div>

                {/* Área Expansível */}
                <div className={`grid transition-all duration-300 ease-in-out mt-2 ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden flex flex-col gap-3">
                    
                    {/* Legenda Explicativa do Tipo de Evento */}
                    {isExpanded && getLegenda(evento.titulo) && (
                      <div className="pt-2 border-t border-white/5 mt-1">
                        <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3">
                          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            O que é isso?
                          </span>
                          <p className="text-[12px] text-sky-100/80 leading-relaxed font-medium">
                            {getLegenda(evento.titulo)}
                          </p>
                        </div>
                      </div>
                    )}

                    {evento.descricao && evento.descricao !== evento.titulo && (
                      <div className="pt-2 border-t border-white/5">
                        <div className="flex flex-col gap-2">
                          {formatarDescricao(evento.descricao)}
                        </div>
                      </div>
                    )}
                    {evento.orgaos && (
                      <div className="pt-2 border-t border-white/5">
                        <span className="text-[10px] font-bold text-sky-500/80 uppercase tracking-widest block mb-1">Órgãos Envolvidos</span>
                        <span className="text-[12px] text-white/70 font-medium">{evento.orgaos}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ícone de expansão */}
                <div className="w-full flex justify-center mt-1 text-white/20">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
          
        </div>
      </ScrollArea>
    </div>
  );
};

export default AgendaCamara;
