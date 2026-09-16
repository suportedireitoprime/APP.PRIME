import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Info, X } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { stfPautaService, STFPautaItem } from '@/services/stfPautaService';

const getLegenda = (titulo: string) => {
  if (!titulo) return null;
  const t = titulo.toUpperCase();
  if (t.includes('ADI') || t.includes('AÇÃO DIRETA DE INCONSTITUCIONALIDADE')) {
    return { descricao: 'Ação que pede ao STF para declarar uma lei inconstitucional.', exemplo: 'Exemplo: Questionamento sobre a validade de uma nova lei tributária estadual.' };
  }
  if (t.includes('RE') || t.includes('RECURSO EXTRAORDINÁRIO')) {
    return { descricao: 'Recurso que chega ao STF quando há ofensa direta à Constituição.', exemplo: 'Exemplo: Recurso sobre liberdade de expressão nas redes sociais.' };
  }
  if (t.includes('HC') || t.includes('HABEAS CORPUS')) {
    return { descricao: 'Medida para proteger a liberdade de locomoção de alguém que se sinta ameaçado.', exemplo: 'Exemplo: Pedido de soltura de um réu preso preventivamente.' };
  }
  if (t.includes('ADPF')) {
    return { descricao: 'Arguição de Descumprimento de Preceito Fundamental. Usada quando a ADI não cabe.', exemplo: 'Exemplo: Ação questionando políticas públicas estruturais.' };
  }
  return null;
};

const AgendaSTF = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<STFPautaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [eventoSelecionado, setEventoSelecionado] = useState<STFPautaItem | null>(null);

  useBodyScrollLock(!!eventoSelecionado);

  const fetchAgenda = async () => {
    try {
      setLoading(true);
      setErro(null);
      const data = await stfPautaService.getPautaDoDia();
      setEventos(data);
    } catch (err: any) {
      console.error("Erro ao buscar agenda do STF:", err);
      setErro("Não foi possível carregar a pauta. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgenda();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] w-full safe-area-pt relative">
      <ShapeGrid 
         active={true} 
         className="absolute inset-0 z-0 opacity-40 pointer-events-none" 
         hoverFillColor="#E11D48" 
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
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest leading-none mb-1">
              Pauta do Dia
            </span>
            <h1 className="text-base font-bold text-white leading-none">
              Supremo Tribunal Federal
            </h1>
          </div>
          
          <div className="w-12 h-12" />
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="flex-1 overflow-y-auto pb-24 z-10">
        <div className="p-4 space-y-4 pt-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <Skeleton className="h-5 w-3/4 bg-white/10 mb-3" />
                <Skeleton className="h-4 w-1/2 bg-white/10 mb-4" />
                <Skeleton className="h-12 w-full bg-white/10 rounded-md" />
              </div>
            ))
          ) : erro ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <p className="text-red-400 text-sm mb-4">{erro}</p>
              <button 
                onClick={() => fetchAgenda()}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
              >
                Tentar Novamente
              </button>
            </div>
          ) : eventos.length === 0 ? (
            <div className="text-center text-white/50 py-12 px-6 flex flex-col items-center">
              <CalendarIcon className="w-12 h-12 opacity-20 mb-3" />
              <p>Nenhum processo listado para a pauta atual do STF.</p>
            </div>
          ) : (
            eventos.map((evento) => (
              <div 
                key={evento.id} 
                onClick={() => {
                  haptic.selection();
                  setEventoSelecionado(evento);
                }}
                className="bg-[#111111]/80 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 relative group active:scale-[0.98] cursor-pointer hover:border-white/10 p-4"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="font-black text-[13px] sm:text-[14px] text-white uppercase tracking-wide leading-tight">
                    {evento.titulo}
                  </h3>
                  <span className="text-[12px] font-bold text-rose-400 uppercase tracking-widest block">
                    {evento.relator}
                  </span>
                  
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Bottom Sheet: Detalhes do Evento */}
      <div className={`fixed inset-0 z-50 flex flex-col justify-end transition-all duration-300 ${eventoSelecionado ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEventoSelecionado(null)} />
        
        <div 
          className={`relative bg-[#0d0f12] border-t border-white/10 w-full rounded-t-3xl flex flex-col transition-transform duration-300 ${eventoSelecionado ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ height: '85vh', maxHeight: '85vh' }}
        >
          {/* Header Draggable area */}
          <div className="flex-none p-4 pb-2 w-full pt-3 relative" onClick={() => setEventoSelecionado(null)}>
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto flex-shrink-0" />
            <button 
              className="absolute right-4 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                haptic.selection();
                setEventoSelecionado(null);
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ScrollArea className="flex-1 w-full px-5 pb-8">
            {eventoSelecionado && (
              <div className="flex flex-col gap-5 pt-2">
                <div>
                  <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-widest text-white leading-tight uppercase">
                    {eventoSelecionado.titulo}
                  </h2>
                  <span className="text-[13px] font-bold text-rose-400 mt-2 block">
                    {eventoSelecionado.relator}
                  </span>
                </div>

                {/* Exemplo Prático (Visível no Bottom Sheet) */}
                {getLegenda(eventoSelecionado.titulo) && (
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4">
                    <span className="text-[11px] font-bold text-sky-400 uppercase tracking-widest mb-1.5 block">
                      Exemplo Prático
                    </span>
                    <p className="text-[13px] text-sky-100/80 leading-relaxed font-medium">
                      {getLegenda(eventoSelecionado.titulo)?.exemplo}
                    </p>
                  </div>
                )}

                {/* Descrição Completa e Formatada */}
                {eventoSelecionado.resumo && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-2 block">Resumo do Processo</span>
                    <p className="text-[13px] text-white/70 leading-relaxed text-justify mb-2">
                      {eventoSelecionado.resumo}
                    </p>
                  </div>
                )}
                
                {/* Ações / API Extra */}
                <div className="pt-5 flex flex-col gap-3">
                  <a 
                    href={`https://portal.stf.jus.br/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl font-bold text-sm transition-colors border border-white/10"
                  >
                    Abrir no Portal do STF
                  </a>
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

export default AgendaSTF;
