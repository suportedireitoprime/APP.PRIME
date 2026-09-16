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

type LegendaEvento = { descricao: string; exemplo: string };

const TIPO_EVENTO_LEGENDA: Record<string, LegendaEvento> = {
  'REUNIÃO TÉCNICA': {
    descricao: 'Encontro focado em debater aspectos técnicos e específicos de um tema ou projeto em andamento.',
    exemplo: 'Exemplo: Especialistas e deputados discutindo os impactos técnicos de uma nova rodovia antes da votação.'
  },
  'SESSÃO DELIBERATIVA': {
    descricao: 'Momento em que os deputados votam e decidem sobre projetos de lei e outras proposições.',
    exemplo: 'Exemplo: Votação final da Reforma Tributária no Plenário.'
  },
  'SESSÃO SOLENE': {
    descricao: 'Reunião especial para homenagens, comemorações e eventos cívicos, sem votações.',
    exemplo: 'Exemplo: Sessão no plenário em homenagem ao Dia do Ortopedista ou ao centenário de uma cidade.'
  },
  'SESSÃO NÃO DELIBERATIVA': {
    descricao: 'Sessão destinada apenas a discursos, debates e comunicações parlamentares, sem votação.',
    exemplo: 'Exemplo: Deputados usando o microfone para relatar problemas recentes em seus estados.'
  },
  'REUNIÃO DELIBERATIVA': {
    descricao: 'Reunião de uma comissão específica focada em votar relatórios e projetos.',
    exemplo: 'Exemplo: A Comissão de Educação votando o relatório sobre o piso salarial dos professores.'
  },
  'AUDIÊNCIA PÚBLICA': {
    descricao: 'Evento aberto para ouvir especialistas e a sociedade sobre um tema relevante.',
    exemplo: 'Exemplo: Debate com médicos, pacientes e indústria sobre a regulamentação de um novo medicamento.'
  },
  'SEMINÁRIO': {
    descricao: 'Evento amplo para discussão e palestras sobre assuntos de interesse público.',
    exemplo: 'Exemplo: Ciclo de palestras sobre os desafios da Inteligência Artificial no Brasil.'
  },
  'COMISSÃO PARLAMENTAR DE INQUÉRITO': {
    descricao: 'Reunião destinada a investigar denúncias de irregularidades e fatos determinados.',
    exemplo: 'Exemplo: Depoimento oficial de uma testemunha convocada pela CPI.'
  }
};

const getLegenda = (titulo: string): LegendaEvento | null => {
  if (!titulo) return null;
  const t = titulo.toUpperCase();
  for (const [key, value] of Object.entries(TIPO_EVENTO_LEGENDA)) {
    if (t.includes(key)) return value;
  }
  return null;
};

const getCorSituacao = (situacao: string) => {
  if (!situacao) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
  const s = situacao.toUpperCase();
  if (s.includes('CONVOCADA')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (s.includes('AGENDADA')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (s.includes('CANCELADA')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  if (s.includes('ENCERRADA') || s.includes('REALIZADA')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
};

const formatarDescricao = (texto: string) => {
  if (!texto) return null;
  // Apenas quebra a linha antes de horários (ex: 14h30) se houver espaço antes.
  // Isso evita quebrar palavras ao meio que tenham letras maiúsculas.
  const formatted = texto.replace(/(\s+)(\d{1,2}h(?:\d{2})?\b)/g, '\n\n$2');
  
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

  // Centralizar o scroll na data selecionada ao montar ou mudar
  useEffect(() => {
    if (diasTimeline.length > 0) {
      setTimeout(() => {
        const selectedEl = document.getElementById(`date-btn-${dataSelecionada}`);
        if (selectedEl) {
          selectedEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 100); // pequeno delay para garantir a renderização
    }
  }, [diasTimeline, dataSelecionada]);

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
            <div className="flex items-center w-max space-x-2 px-4 py-2">
              {diasTimeline.map((d, idx) => {
                const isSelected = d.toISOString().split('T')[0] === dataSelecionada;
                const isToday = d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                return (
                  <button
                    key={idx}
                    id={`date-btn-${d.toISOString().split('T')[0]}`}
                    onClick={() => {
                      if (!isSelected) {
                        haptic.selection();
                        setDataSelecionada(d.toISOString().split('T')[0]);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${
                      isSelected 
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400 scale-[1.15] shadow-lg shadow-rose-500/20 z-10 mx-2 min-w-[65px] h-[70px]' 
                        : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10 min-w-[60px] h-[60px]'
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
                    <span className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded whitespace-nowrap flex-shrink-0 border ${getCorSituacao(evento.situacao)}`}>
                      {evento.situacao}
                    </span>
                  )}
                </div>
                
                {/* Info básica sempre visível */}
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
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

                {/* Explicação Curta sempre visível no card */}
                {getLegenda(evento.titulo) && (
                  <div className="mt-2 flex items-start gap-1.5 bg-white/5 border border-white/10 rounded-md p-2">
                    <Info className="w-3.5 h-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] sm:text-[12px] text-white/70 leading-tight font-medium">
                      <span className="font-bold text-sky-400/90 mr-1.5 uppercase tracking-wider">O que é isso?</span>
                      {getLegenda(evento.titulo)?.descricao}
                    </p>
                  </div>
                )}

                {/* Área Expansível */}
                <div className={`grid transition-all duration-300 ease-in-out mt-2 ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden flex flex-col gap-3">
                    
                    {/* Exemplo Prático (Visível ao expandir) */}
                    {isExpanded && getLegenda(evento.titulo) && (
                      <div className="pt-1">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 block">
                            Exemplo Prático
                          </span>
                          <p className="text-[12px] text-emerald-100/80 leading-relaxed font-medium">
                            {getLegenda(evento.titulo)?.exemplo}
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
