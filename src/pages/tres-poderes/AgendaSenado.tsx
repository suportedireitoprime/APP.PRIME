import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, Info, X, RotateCw, FileText, ExternalLink, Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import ShapeGrid from '@/components/ui/ShapeGrid';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatHora = (str?: string) => {
  if (!str) return '--:--';
  if (str.includes('T')) {
    const timePart = str.split('T')[1];
    const match = timePart.match(/^(\d{2}:\d{2})/);
    if (match) return match[1];
  }
  const match = str.match(/(\d{2}:\d{2})/);
  if (match) return match[1];
  return str;
};

interface EventoSenado {
  id: string | number;
  titulo: string;
  descricao: string;
  horaInicio: string;
  horaFim: string;
  local: string;
  orgaos: string;
  situacao: string;
  urlRegistro?: string;
}

type LegendaEvento = { descricao: string; exemplo: string };

const TIPO_EVENTO_LEGENDA: Record<string, LegendaEvento> = {
  'MISTA EXTRAORDINÁRIA': {
    descricao: 'Reunião de uma comissão formada por senadores e deputados, convocada fora do horário habitual.',
    exemplo: 'Exemplo: Comissão Mista votando medidas urgentes do Governo.'
  },
  'SESSÃO DELIBERATIVA': {
    descricao: 'Momento em que os senadores votam e decidem sobre projetos de lei e outras proposições.',
    exemplo: 'Exemplo: Votação final da Reforma Tributária no Plenário do Senado.'
  },
  'SESSÃO SOLENE': {
    descricao: 'Reunião especial para homenagens, comemorações e eventos cívicos, sem votações.',
    exemplo: 'Exemplo: Sessão no plenário em homenagem a uma data histórica.'
  },
  'SESSÃO NÃO DELIBERATIVA': {
    descricao: 'Sessão destinada apenas a discursos, debates e comunicações parlamentares, sem votação.',
    exemplo: 'Exemplo: Senadores usando o microfone para relatar problemas recentes em seus estados.'
  },
  'AUDIÊNCIA PÚBLICA': {
    descricao: 'Evento aberto para ouvir especialistas e a sociedade sobre um tema relevante.',
    exemplo: 'Exemplo: Debate com especialistas sobre regulamentação ambiental.'
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
  if (s.includes('CONVOCADA') || s.includes('AGUARDANDO')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  if (s.includes('AGENDADA')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (s.includes('CANCELADA')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  if (s.includes('ENCERRADA') || s.includes('REALIZADA')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
};

const formatarDescricao = (texto: string) => {
  if (!texto) return null;

  // Se o texto possui seções estruturadas geradas pelo sincronizador (**Finalidade:**, etc)
  if (texto.includes('**Finalidade:**') || texto.includes('**Requerimento(s):**') || texto.includes('**Ordem do Dia') || texto.includes('**Pauta')) {
    const secoes = texto.split(/\n\n(?=\*\*)/);
    return (
      <div className="flex flex-col gap-3">
        {secoes.map((secao, idx) => {
          if (secao.startsWith('**Finalidade:**')) {
            const conteudo = secao.replace('**Finalidade:**', '').trim();
            return (
              <div key={idx} className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3.5">
                <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Finalidade da Sessão
                </span>
                <p className="text-[13px] text-white/90 leading-relaxed font-medium">
                  {conteudo}
                </p>
              </div>
            );
          }
          if (secao.startsWith('**Requerimento(s):**')) {
            const conteudo = secao.replace('**Requerimento(s):**', '').trim();
            return (
              <div key={idx} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5">
                <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Requerimento Oficial
                </span>
                <p className="text-[13px] text-emerald-100/90 leading-relaxed font-semibold">
                  {conteudo}
                </p>
              </div>
            );
          }
          if (secao.startsWith('**Ordem do Dia') || secao.startsWith('**Pauta')) {
            const linhas = secao.split('\n');
            const titulo = linhas[0].replace(/\*\*/g, '').trim();
            const conteudo = linhas.slice(1).join('\n').trim();
            return (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3.5">
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" /> {titulo}
                </span>
                <div className="text-[12px] text-white/80 leading-relaxed whitespace-pre-line">
                  {conteudo}
                </div>
              </div>
            );
          }

          return (
            <p key={idx} className="text-[13px] text-white/70 leading-relaxed text-justify mb-2">
              {secao.replace(/\*\*/g, '')}
            </p>
          );
        })}
      </div>
    );
  }
  
  // Captura horários sozinhos (ex: 18h20) ou intervalos (ex: 17h30 - 18h20) 
  const regexHorarios = /(\s+)(\d{1,2}h(?:\d{2})?(?:\s*-\s*\d{1,2}h(?:\d{2})?)?)\s+/g;
  const formatted = texto.replace(regexHorarios, '\n\n**$2** ');
  
  const linhasRaw = formatted.split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
  const linhas = linhasRaw.filter((linha, index) => {
    return linhasRaw.indexOf(linha) === index;
  });

  return (
    <>
      {linhas.map((linha, idx) => {
        if (linha.includes('**')) {
          const partes = linha.split('**');
          return (
            <p key={idx} className="text-[13px] text-white/70 leading-relaxed text-justify mb-2 last:mb-0">
              {partes.map((parte, i) => (
                i % 2 === 1 ? <strong key={i} className="font-black text-white">{parte}</strong> : parte
              ))}
            </p>
          );
        }

        return (
          <p key={idx} className="text-[13px] text-white/70 leading-relaxed text-justify mb-2 last:mb-0">
            {linha}
          </p>
        );
      })}
    </>
  );
};

const AgendaSenado = () => {
  const navigate = useNavigate();
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    return getLocalDateString();
  });
  const [diasTimeline, setDiasTimeline] = useState<Date[]>([]);
  const [eventos, setEventos] = useState<EventoSenado[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoSenado | null>(null);

  // Ref para rolar a linha do tempo até o dia selecionado (hoje) ao montar
  const timelineRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(!!eventoSelecionado);

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
      }, 100);
    }
  }, [diasTimeline, dataSelecionada]);

  const fetchAgenda = async (data: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      setErro(null);

      const { data: result, error } = await supabase
        .from('senado_pautas')
        .select('*')
        .ilike('hora_inicio', `${data}%`)
        .order('hora_inicio', { ascending: true });

      if (error) throw error;
      
      if (result && result.length > 0) {
        setEventos(result.map(r => ({
          id: r.id,
          titulo: r.titulo || 'Sessão do Senado',
          descricao: r.descricao || '',
          horaInicio: r.hora_inicio || '',
          horaFim: r.hora_fim || '',
          local: r.local || '',
          orgaos: r.orgaos || '',
          situacao: r.situacao || '',
          urlRegistro: r.url_registro || '',
        })));
      } else {
        setEventos([]);
      }
    } catch (err: unknown) {
      console.error("Erro ao buscar agenda do Senado:", err);
      setErro("Não foi possível carregar a pauta. Tente novamente mais tarde.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const syncAndRefresh = async () => {
    try {
      setSyncing(true);
      await supabase.functions.invoke('sync-senado-pautas');
      await fetchAgenda(dataSelecionada, true);
    } catch (err) {
      console.error("Erro ao sincronizar pautas:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAgenda(dataSelecionada);
  }, [dataSelecionada]);

  // Suporte para fechar modal com tecla Esc no desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && eventoSelecionado) {
        setEventoSelecionado(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [eventoSelecionado]);

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
              Senado Federal
            </h1>
          </div>
          
          <button 
            onClick={() => {
              haptic.selection();
              syncAndRefresh();
            }}
            disabled={syncing}
            className="w-12 h-12 flex items-center justify-center -mr-3 text-white/70 hover:text-white transition-colors"
            title="Sincronizar Pautas"
          >
            <RotateCw className={`w-5 h-5 ${syncing ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>

        {/* Timeline Horizontal */}
        <div className="pb-3 w-full border-t border-white/5 pt-3 bg-black/20">
          <ScrollArea className="w-full whitespace-nowrap" ref={timelineRef}>
            <div className="flex items-center w-max space-x-2 px-4 py-2">
              {diasTimeline.map((d, idx) => {
                const dateKey = getLocalDateString(d);
                const isSelected = dateKey === dataSelecionada;
                const isToday = dateKey === getLocalDateString();
                return (
                  <button
                    key={idx}
                    id={`date-btn-${dateKey}`}
                    onClick={() => {
                      if (!isSelected) {
                        haptic.selection();
                        setDataSelecionada(dateKey);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ${
                      isSelected 
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400 scale-[1.15] shadow-lg shadow-sky-500/20 z-10 mx-2 min-w-[65px] h-[70px]' 
                        : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10 min-w-[60px] h-[60px]'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider mb-1">
                      {isToday ? 'HOJE' : getDiaDaSemana(d)}
                    </span>
                    <span className={`text-sm font-black ${isSelected ? 'text-sky-400' : 'text-white/80'}`}>
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

      {/* Lista de Eventos (Scrollável) */}
      <div className="flex-1 overflow-y-auto pb-24 z-10">
        <div className="p-4 space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <Skeleton className="h-5 w-3/4 bg-white/10 mb-3" />
                <Skeleton className="h-4 w-1/2 bg-white/10 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 bg-white/10 rounded-md" />
                  <Skeleton className="h-6 w-32 bg-white/10 rounded-md" />
                </div>
              </div>
            ))
          ) : erro ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <p className="text-red-400 text-sm mb-4">{erro}</p>
              <button 
                onClick={() => fetchAgenda(dataSelecionada)}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : eventos.length === 0 ? (
            <div className="text-center text-white/50 py-12 px-6 flex flex-col items-center">
              <CalendarIcon className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm max-w-xs mb-4">Nenhuma sessão ou reunião agendada para este dia no Senado Federal.</p>
              <button
                onClick={() => syncAndRefresh()}
                disabled={syncing}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
              >
                <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-sky-400' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Atualizar com dados oficiais'}
              </button>
            </div>
          ) : (
            eventos.map((evento) => (
              <div 
                key={evento.id} 
                onClick={() => {
                  haptic.selection();
                  setEventoSelecionado(evento);
                }}
                className="bg-[#111111]/80 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 relative group active:scale-[0.98] cursor-pointer hover:border-white/10"
              >
                {/* Linha colorida lateral (opcional) */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${evento.situacao?.toUpperCase().includes('CONVOCADA') ? 'bg-amber-500' : 'bg-white/20'}`} />

                <div className="p-4 pl-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-black text-[13px] sm:text-[14px] text-white uppercase tracking-wide leading-tight">
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
                        {evento.horaInicio ? formatHora(evento.horaInicio) : '--:--'}
                        {evento.horaFim ? ` às ${formatHora(evento.horaFim)}` : ''}
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

                  {/* Resumo da Pauta/Finalidade sempre visível no card */}
                  {evento.descricao && evento.descricao !== 'Sem pauta cadastrada' && (
                    <p className="text-[12px] text-white/60 line-clamp-2 mt-2 leading-relaxed">
                      {evento.descricao.replace(/\*\*.*?\*\*/g, '').trim()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Bottom Sheet / Dialog Responsivo: Detalhes do Evento */}
      <div className={`fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-6 transition-all duration-300 ${eventoSelecionado ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={() => setEventoSelecionado(null)} />
        
        <div 
          className={`relative bg-[#0d0f12] border-t sm:border border-white/10 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl flex flex-col transition-all duration-300 shadow-2xl z-10 ${eventoSelecionado ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:scale-95'}`}
          style={{ height: '90vh', maxHeight: '90vh' }}
        >
          {/* Header area com botão de fechar responsivo */}
          <div className="flex-none p-4 pb-2 w-full pt-4 relative flex items-center justify-between">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto sm:hidden cursor-pointer" onClick={() => setEventoSelecionado(null)} />
            <button 
              type="button"
              aria-label="Fechar detalhes da sessão"
              className="absolute right-4 top-3 w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-white transition-all cursor-pointer z-30 shadow-md shadow-black/50"
              onClick={(e) => {
                e.stopPropagation();
                haptic.selection();
                setEventoSelecionado(null);
              }}
            >
              <X className="w-6 h-6 stroke-[2.4]" />
            </button>
          </div>

          <ScrollArea className="flex-1 w-full px-5 pb-8">
            {eventoSelecionado && (
              <div className="flex flex-col gap-5 pt-2">
                <div>
                  <span className={`text-[10px] sm:text-[11px] uppercase tracking-widest font-bold px-2 py-1 rounded inline-block mb-3 border ${getCorSituacao(eventoSelecionado.situacao)}`}>
                    {eventoSelecionado.situacao || 'SITUAÇÃO DESCONHECIDA'}
                  </span>
                  <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-widest text-white leading-tight uppercase">
                    {eventoSelecionado.titulo}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-md">
                    <Clock className="w-4 h-4" />
                    <span className="text-[13px] font-bold">
                      {eventoSelecionado.horaInicio ? formatHora(eventoSelecionado.horaInicio) : '--:--'}
                      {eventoSelecionado.horaFim ? ` às ${formatHora(eventoSelecionado.horaFim)}` : ''}
                    </span>
                  </div>
                  
                  {eventoSelecionado.local && (
                    <div className="flex items-center gap-1.5 text-white/60">
                      <MapPin className="w-4 h-4" />
                      <span className="text-[13px]">{eventoSelecionado.local}</span>
                    </div>
                  )}
                </div>

                {/* Exemplo Prático (Visível no Bottom Sheet) */}
                {getLegenda(eventoSelecionado.titulo) && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1.5 block">
                      Exemplo Prático
                    </span>
                    <p className="text-[13px] text-emerald-100/80 leading-relaxed font-medium">
                      {getLegenda(eventoSelecionado.titulo)?.exemplo}
                    </p>
                  </div>
                )}

                {/* Descrição Completa e Formatada */}
                {eventoSelecionado.descricao && eventoSelecionado.descricao !== eventoSelecionado.titulo && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-2 block">Pauta Oficial</span>
                    <div className="flex flex-col gap-2">
                      {formatarDescricao(eventoSelecionado.descricao)}
                    </div>
                  </div>
                )}
                
                {/* Órgãos */}
                {eventoSelecionado.orgaos && (
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest block mb-1">Órgãos Envolvidos</span>
                    <span className="text-[13px] text-white/70 font-medium">{eventoSelecionado.orgaos}</span>
                  </div>
                )}

                {/* Ações / Documentos Oficiais */}
                <div className="pt-5 flex flex-col gap-3">
                  {eventoSelecionado.urlRegistro ? (
                    eventoSelecionado.urlRegistro.includes('youtube') || eventoSelecionado.urlRegistro.includes('video') ? (
                      <>
                        <a 
                          href={eventoSelecionado.urlRegistro}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-red-600/20"
                        >
                          Assistir Transmissão (TV Senado)
                        </a>
                        <a 
                          href="https://www25.senado.leg.br/web/atividade/sessao-plenaria"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors border border-sky-500/20"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Acessar Pauta e Documentos (PDF)
                        </a>
                      </>
                    ) : (
                      <a 
                        href={eventoSelecionado.urlRegistro}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white py-3.5 px-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-sky-600/20 active:scale-[0.99]"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Acessar Pauta Oficial, Ordem do Dia e Documentos (PDF)
                      </a>
                    )
                  ) : (
                    <a 
                      href="https://www25.senado.leg.br/web/atividade/sessao-plenaria"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl font-bold text-sm transition-colors border border-white/10"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Acessar Pauta no Portal do Senado
                    </a>
                  )}
                </div>

                {/* Spacer final */}
                <div className="h-6" />
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default AgendaSenado;
