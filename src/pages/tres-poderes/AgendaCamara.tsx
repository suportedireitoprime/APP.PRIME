import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

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

const AgendaCamara = () => {
  const navigate = useNavigate();
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [eventos, setEventos] = useState<EventoCamara[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Travar o scroll do body para evitar double-scroll no mobile
  useBodyScrollLock(true);

  const fetchAgenda = async (data: string) => {
    try {
      setLoading(true);
      setErro(null);
      
      const { data: result, error } = await supabase.functions.invoke('agenda-camara', {
        body: { dataInicio: data, dataFim: data }
      });

      if (error) throw error;
      
      // A API retorna os eventos ordenados, mas podemos garantir
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

  return (
    <div className="fixed inset-0 bg-[#0A0A0A] z-50 flex flex-col w-full h-full safe-area-pt">
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
          
          <div className="w-12 h-12" /> {/* Espaçador */}
        </div>

        {/* Date Picker Bar */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <CalendarIcon className="w-4 h-4 text-white/50" />
            </div>
            <input 
              type="date"
              value={dataSelecionada}
              onChange={(e) => {
                haptic.selection();
                setDataSelecionada(e.target.value);
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500 appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo Scrollável */}
      <ScrollArea className="flex-1 w-full bg-[#050505]">
        <div className="p-4 pb-safe space-y-4">
          
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
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
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <CalendarIcon className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-base font-bold text-white/90 mb-1">Sem eventos programados</h3>
              <p className="text-sm text-white/50">Não há sessões ou comissões agendadas para esta data na Câmara dos Deputados.</p>
            </div>
          )}

          {!loading && !erro && eventos.map((evento) => (
            <div 
              key={evento.id} 
              className="p-4 rounded-2xl bg-[#0D0D0D] border border-white/5 flex flex-col gap-2 relative overflow-hidden"
            >
              {/* Barra lateral de cor para dar destaque */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500/50" />
              
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="text-[15px] font-bold text-white/90 leading-snug">
                  {evento.titulo}
                </h3>
                {evento.situacao && (
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-white/10 text-white/70 whitespace-nowrap">
                    {evento.situacao}
                  </span>
                )}
              </div>
              
              {evento.descricao && evento.descricao !== evento.titulo && (
                <p className="text-[13px] text-white/60 leading-relaxed mb-2">
                  {evento.descricao}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 text-sky-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[12px] font-medium">
                    {evento.horaInicio ? new Date(evento.horaInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    {evento.horaFim ? ` às ${new Date(evento.horaFim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
                  </span>
                </div>
                
                {evento.local && (
                  <div className="flex items-center gap-1.5 text-white/50">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[12px]">{evento.local}</span>
                  </div>
                )}
              </div>
              
              {evento.orgaos && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <span className="text-[11px] text-white/40 uppercase tracking-wider">Órgãos: </span>
                  <span className="text-[12px] text-white/70">{evento.orgaos}</span>
                </div>
              )}
            </div>
          ))}
          
        </div>
      </ScrollArea>
    </div>
  );
};

export default AgendaCamara;
