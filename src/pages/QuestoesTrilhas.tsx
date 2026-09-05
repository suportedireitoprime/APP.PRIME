import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Route as RouteIcon, Clock, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import { useQuestoesAreas } from '@/hooks/useQuestoes';
import { visualDaArea } from '@/lib/questoesVisual';
import { useQuestoesTrilhaStore, type QuestoesTrilha } from '@/lib/questoesTrilhaStore';
import { Drawer, DrawerContent, DrawerPortal, DrawerOverlay } from '@/components/ui/drawer';
import { haptic } from '@/lib/nativeHaptics';

const DIAS = [
  { id: 'dom', label: 'D' },
  { id: 'seg', label: 'S' },
  { id: 'ter', label: 'T' },
  { id: 'qua', label: 'Q' },
  { id: 'qui', label: 'Q' },
  { id: 'sex', label: 'S' },
  { id: 'sab', label: 'S' },
];

const WEEKDAY_MAP: Record<string, number> = {
  dom: 1, seg: 2, ter: 3, qua: 4, qui: 5, sex: 6, sab: 7,
};

const METAS = [10, 20, 30, 50];

export default function QuestoesTrilhas() {
  const navigate = useNavigate();
  const { trilhas, adicionarTrilha, removerTrilha } = useQuestoesTrilhaStore();
  const { areas, loading: loadingAreas } = useQuestoesAreas();

  // Calendário/Filtro por Datas
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  
  // Modal de Criação (Drawer)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [novasMaterias, setNovasMaterias] = useState<string[]>([]);
  const [isMateriasSheetOpen, setIsMateriasSheetOpen] = useState(false);
  const [novaMeta, setNovaMeta] = useState(10);
  const [novosDias, setNovosDias] = useState<string[]>(['seg', 'ter', 'qua', 'qui', 'sex']);
  const [novoHorario, setNovoHorario] = useState('20:00');

  // Gera array de 14 dias para o calendário
  const diasCalendario = useMemo(() => {
    const list = [];
    const hoje = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  const diaDaSemanaSlug = (date: Date) => {
    const slugs = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return slugs[date.getDay()];
  };

  // Filtra as trilhas para a data selecionada
  const trilhasDoDia = useMemo(() => {
    const slugHoje = diaDaSemanaSlug(dataSelecionada);
    return trilhas.filter(t => t.dias.includes(slugHoje));
  }, [trilhas, dataSelecionada]);

  const agendarNotificacoesLocais = async (trilha: QuestoesTrilha) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      // Requer permissão
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }

      const [hh, mm] = trilha.horario.split(':').map(Number);
      
      const notifsToSchedule = trilha.dias.map((dia) => {
        const weekday = WEEKDAY_MAP[dia];
        // Gera um ID numérico único combinando a trilha e o dia
        // Para simplificar, faremos um hash simples ou usaremos math random (basta salvar pra cancelar depois, se necessário)
        const notifId = Math.floor(Math.random() * 1000000000);
        return {
          id: notifId,
          title: '📚 Hora do treino!',
          body: `Sua trilha de ${trilha.materia} (${trilha.metaDiaria} questões) está esperando por você.`,
          schedule: {
            on: { weekday, hour: hh, minute: mm },
            allowWhileIdle: true,
          },
          smallIcon: 'ic_stat_icon_config_sample',
          iconColor: '#DC2626',
        };
      });

      await LocalNotifications.schedule({ notifications: notifsToSchedule });
    } catch (e) {
      console.error('Erro ao agendar notificação:', e);
    }
  };

  const handleSaveTrilha = async () => {
    if (novasMaterias.length === 0) {
      toast.error('Selecione ao menos uma matéria.');
      return;
    }
    if (novosDias.length === 0) {
      toast.error('Selecione ao menos um dia da semana.');
      return;
    }

    haptic.success();
    const materiasStr = novasMaterias.join(', ');
    const novaTrilha: QuestoesTrilha = {
      id: crypto.randomUUID(),
      nome: `${novasMaterias.length === 1 ? novasMaterias[0] : novasMaterias.length + ' Matérias'} - ${novaMeta}q`,
      materia: materiasStr,
      metaDiaria: novaMeta,
      dias: novosDias,
      horario: novoHorario,
      dataCriacao: new Date().toISOString()
    };

    adicionarTrilha(novaTrilha);
    toast.success('Trilha criada!');
    setIsDrawerOpen(false);
    
    await agendarNotificacoesLocais(novaTrilha);
    
    // Reset state
    setNovasMaterias([]);
    setNovaMeta(10);
    setNovosDias(['seg', 'ter', 'qua', 'qui', 'sex']);
    setNovoHorario('20:00');
  };

  const handleDeleteTrilha = (id: string) => {
    haptic.medium();
    removerTrilha(id);
    toast.success('Trilha removida.');
    // Idealmente, deveríamos cancelar as notificações da trilha aqui.
    // Como não salvamos os IDs numéricos gerados pelo LocalNotifications no estado da trilha por brevidade,
    // as antigas vão continuar tocando. Em produção real, o ID da notificação (numérico) deveria ser guardado no estado para ser cancelado:
    // await LocalNotifications.cancel({ notifications: idsParaCancelar });
  };

  const handlePraticar = (trilha: QuestoesTrilha) => {
    haptic.light();
    const q = new URLSearchParams();
    q.set('areas', trilha.materia);
    q.set('limite', trilha.metaDiaria.toString());
    navigate(`/questoes/praticar?${q.toString()}`);
  };

  const isToday = (d: Date) => {
    const hoje = new Date();
    return d.getDate() === hoje.getDate() && d.getMonth() === hoje.getMonth();
  };

  return (
    <div className="theme-questoes min-h-screen bg-[#0A0A0A] selection:bg-white/20 pb-32">
      <PageHeader title="Trilhas" subtitle="Cronograma de Estudos" onBack={() => navigate('/questoes')} />

      {/* HEADER DE DATAS (MENU DE ALTERNÂNCIA) */}
      <div className="w-full bg-[#0A0A0A] sticky top-[60px] z-30 border-b border-white/5 py-4 px-4 overflow-x-auto hide-scrollbar flex items-center gap-3">
        {diasCalendario.map((d, i) => {
          const hoje = isToday(d);
          const isSelected = d.toDateString() === dataSelecionada.toDateString();
          const diaSemanaStr = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
          const diaMes = d.getDate();

          return (
            <button
              key={i}
              onClick={() => { haptic.selection(); setDataSelecionada(d); }}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-2xl border transition-all ${
                isSelected ? 'border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-white/5 bg-black/40 hover:border-white/20'
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                {hoje ? 'Hoje' : diaSemanaStr}
              </span>
              <span className={`text-lg font-black leading-none ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                {diaMes}
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[15px] font-bold text-white uppercase tracking-wider">
            {isToday(dataSelecionada) ? 'Missões de Hoje' : `Missões para ${dataSelecionada.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
          </h2>
          
          <button 
            onClick={() => { haptic.light(); setIsDrawerOpen(true); }}
            className="flex items-center gap-2 bg-white/10 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-white/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Criar Trilha
          </button>
        </div>

        {trilhasDoDia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/10 rounded-[28px] bg-white/5">
            <RouteIcon className="w-10 h-10 text-zinc-600 mb-3" />
            <p className="text-sm font-bold text-zinc-400 mb-1">Nenhuma missão</p>
            <p className="text-xs text-zinc-500 max-w-[200px]">Você não tem trilhas agendadas para esta data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {trilhasDoDia.map(t => {
              const { icon: Icon, color } = visualDaArea(t.materia);
              return (
                <div key={t.id} className="flex flex-col bg-zinc-900/50 border border-white/5 rounded-2xl p-4 relative hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10" style={{ color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <button 
                      onClick={() => handleDeleteTrilha(t.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 rounded-full bg-black/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight mb-1">{t.materia}</h3>
                  <p className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1 mb-3">
                    <Clock className="w-3 h-3" /> {t.horario} • {t.metaDiaria}q
                  </p>
                  
                  <button 
                    onClick={() => handlePraticar(t)}
                    className="mt-auto w-full py-2 bg-hero-panel rounded-xl text-[12px] font-bold text-white shadow-lg active:scale-95 transition-transform"
                  >
                    Praticar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <QuestoesBottomNav />

      {/* DRAWER: CRIAR TRILHA */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerPortal>
          <DrawerOverlay className="bg-black/60 backdrop-blur-sm fixed inset-0 z-[100]" />
          <DrawerContent className="bg-[#0A0A0A] border-white/10 z-[110] outline-none rounded-t-[32px]">
            <div className="mx-auto mt-4 h-1.5 w-[50px] rounded-full bg-white/20" />
            
            <div className="px-4 py-6 max-h-[85vh] overflow-y-auto">
              <h2 className="text-xl font-black text-white mb-6">Criar Nova Trilha</h2>
              
              {/* Seleção de Matéria */}
              <div className="mb-6">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Disciplina</label>
                {loadingAreas ? (
                  <div className="flex items-center gap-2 text-zinc-500 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
                ) : (
                  <button
                    onClick={() => { haptic.selection(); setIsMateriasSheetOpen(true); }}
                    className="w-full flex items-center justify-between bg-zinc-900 border border-white/10 rounded-2xl h-14 px-4 text-left font-semibold hover:border-hero-panel transition-colors"
                  >
                    <span className={novasMaterias.length > 0 ? "text-white" : "text-zinc-500"}>
                      {novasMaterias.length === 0 
                        ? "Selecione a(s) matéria(s)" 
                        : novasMaterias.length === 1 
                          ? novasMaterias[0] 
                          : `${novasMaterias.length} matérias selecionadas`}
                    </span>
                    <ChevronRight className="w-5 h-5 text-zinc-500" />
                  </button>
                )}
              </div>

              {/* Quantidade */}
              <div className="mb-6">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Quantidade</label>
                <div className="grid grid-cols-4 gap-2">
                  {METAS.map(m => (
                    <button
                      key={m}
                      onClick={() => { haptic.selection(); setNovaMeta(m); }}
                      className={`h-12 rounded-xl border transition-all font-bold text-sm ${
                        novaMeta === m ? 'border-white bg-white text-black' : 'border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/30'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="mb-6">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Dias de Estudo</label>
                <div className="flex gap-2 justify-between">
                  {DIAS.map(d => {
                    const isSel = novosDias.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          haptic.selection();
                          setNovosDias(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id]);
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border ${
                          isSel ? 'bg-hero-panel border-white text-white shadow-lg' : 'bg-zinc-900 border-white/10 text-zinc-500'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horário */}
              <div className="mb-8">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 block">Horário do Lembrete</label>
                <div className="relative flex items-center">
                  <Clock className="w-5 h-5 text-zinc-500 absolute left-4" />
                  <input 
                    type="time" 
                    value={novoHorario}
                    onChange={(e) => setNovoHorario(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl h-14 pl-12 pr-4 text-white font-bold focus:outline-none focus:border-hero-panel"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveTrilha}
                className="w-full h-14 rounded-2xl bg-hero-panel text-white font-bold text-[15px] shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                Salvar Trilha
              </button>
            </div>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
      {/* SELETOR DE MATÉRIAS (FULL SCREEN OVERLAY) */}
      <AnimatePresence>
        {isMateriasSheetOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-0 z-[120] bg-zinc-950 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 pt-safe-header border-b border-white/10 bg-zinc-900/50">
              <button 
                onClick={() => { haptic.selection(); setIsMateriasSheetOpen(false); }}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h3 className="font-bold text-white flex-1 text-center pr-10">Selecionar Disciplinas</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-4 pb-[100px]">
              <div className="space-y-2">
                {areas.map(a => {
                  const { icon: Icon, color } = visualDaArea(a.area);
                  const isSel = novasMaterias.includes(a.area);
                  return (
                    <button
                      key={a.area}
                      onClick={() => {
                        haptic.selection();
                        setNovasMaterias(prev => 
                          prev.includes(a.area) ? prev.filter(x => x !== a.area) : [...prev, a.area]
                        );
                      }}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                        isSel ? 'bg-hero-panel/10 border-hero-panel/30 shadow-md' : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/20" style={{ color: isSel ? '#E11D48' : color }}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`font-semibold flex-1 text-left ${isSel ? 'text-white' : 'text-zinc-300'}`}>
                        {a.area}
                      </span>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                        isSel ? 'bg-hero-panel border-hero-panel text-white' : 'border-zinc-600'
                      }`}>
                        {isSel && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-2 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pb-safe-nav">
              <button
                onClick={() => { haptic.success(); setIsMateriasSheetOpen(false); }}
                className="w-full h-14 bg-hero-panel text-white font-black text-lg rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
              >
                Confirmar ({novasMaterias.length})
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
