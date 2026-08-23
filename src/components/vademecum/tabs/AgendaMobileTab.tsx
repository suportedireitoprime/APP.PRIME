import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Inbox, ChevronLeft, ChevronRight, FileCheck, Library, Map, BookOpen } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import ContinueLendoCard from '../ContinueLendoCard';

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function generateCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const days = [];
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    days.push({ day: prevMonthLastDay - i, currentMonth: false, date: new Date(year, month - 1, prevMonthLastDay - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
  }
  return days;
}

export default function AgendaMobileTab() {
  const navigate = useNavigate();
  const [agendaOffset, setAgendaOffset] = useState(0);
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const todayStr = useMemo(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.getTime();
  }, []);

  const calendarDate = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + calendarMonthOffset, 1);
  }, [calendarMonthOffset]);

  const calendarDays = useMemo(() => {
    return generateCalendar(calendarDate.getFullYear(), calendarDate.getMonth());
  }, [calendarDate]);

  const daysWithTasks = useMemo(() => {
    const set = new Set<number>();
    set.add(todayStr);
    set.add(todayStr + 86400000); // amanhã
    set.add(todayStr + 86400000 * 3);
    set.add(todayStr - 86400000 * 2);
    return set;
  }, [todayStr]);

  const agendaTasks = useMemo(() => {
    if (agendaOffset === 0) {
      return [
        { id: 1, type: 'questoes', title: 'Resolver 15 questões', subtitle: 'Direito Penal Geral', icon: FileCheck, color: 'text-[#F87171]', route: '/aprender' },
        { id: 2, type: 'flashcards', title: 'Revisar Flashcards', subtitle: 'Constitucional (12 pendentes)', icon: Library, color: 'text-[#22c55e]', route: '/flashcards' },
        { id: 3, type: 'trilha', title: 'Avançar na Trilha', subtitle: 'Licitações e Contratos', icon: Map, color: 'text-[#3b82f6]', route: '/aprender' },
        { id: 4, type: 'resumo', title: 'Leitura de Resumo', subtitle: 'Dolo e Culpa', icon: BookOpen, color: 'text-[#d97706]', route: '/resumos-juridicos' }
      ];
    }
    if (agendaOffset === 1) {
      return [
        { id: 5, type: 'questoes', title: 'Resolver 15 questões', subtitle: 'Direito Penal Geral', icon: FileCheck, color: 'text-[#F87171]', route: '/aprender' },
        { id: 6, type: 'flashcards', title: 'Revisar Flashcards', subtitle: 'Constitucional (12 pendentes)', icon: Library, color: 'text-[#22c55e]', route: '/flashcards' },
        { id: 7, type: 'trilha', title: 'Avançar na Trilha', subtitle: 'Licitações e Contratos', icon: Map, color: 'text-[#3b82f6]', route: '/aprender' },
        { id: 8, type: 'resumo', title: 'Leitura de Resumo', subtitle: 'Dolo e Culpa', icon: BookOpen, color: 'text-[#d97706]', route: '/resumos-juridicos' }
      ];
    }
    return [];
  }, [agendaOffset]);

  return (
    <motion.div
      key="agenda"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: [0.22, 0.61, 0.36, 1] }}
      className="space-y-6 px-1"
    >
      <div className="-mx-1">
        <ContinueLendoCard />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-primary" />
              <h2 className="font-body text-foreground text-2xl sm:text-3xl font-bold tracking-tight">
                Agenda
              </h2>
            </div>
          </div>
          <button 
            onClick={() => setIsCalendarOpen(true)}
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <CalendarDays className="w-5 h-5" />
          </button>
        </div>
        <p className="font-body text-muted-foreground text-[13px] leading-snug mt-1 ml-3">
          Suas tarefas e metas diárias de estudo.
        </p>
      </div>
      
      <div className="mt-4 rounded-2xl bg-card border border-border/60 overflow-hidden pb-4">
        <div className="bg-muted/30 px-3 py-2 border-b border-border/50 flex justify-between items-center">
          <button onClick={() => setAgendaOffset(prev => prev - 1)} className="p-1.5 active:scale-95 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <h3 className="font-display font-bold text-foreground text-[15px]">
              {agendaOffset === 0 ? 'Hoje' : agendaOffset === 1 ? 'Amanhã' : agendaOffset === -1 ? 'Ontem' : ''}
              {agendaOffset === 0 || agendaOffset === 1 || agendaOffset === -1 ? ', ' : ''}
              {new Date(Date.now() + agendaOffset * 86400000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </h3>
            <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-wider">{agendaTasks.length > 0 ? `${agendaTasks.length} pendentes` : 'livre'}</span>
          </div>
          <button onClick={() => setAgendaOffset(prev => prev + 1)} className="p-1.5 active:scale-95 text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={agendaOffset}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="divide-y divide-border/40 min-h-[200px]"
            >
              {agendaTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                    <Inbox className="w-6 h-6 text-muted-foreground opacity-60" />
                  </div>
                  <h4 className="text-[15px] font-bold text-foreground">Nada pendente para hoje</h4>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    Você não tem tarefas, trilhas ou flashcards agendados para esta data.
                  </p>
                </div>
              ) : (
                agendaTasks.map(task => (
                  <button key={task.id} onClick={() => navigate(task.route)} className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors active:bg-muted">
                    <task.icon className={`w-7 h-7 ${task.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground truncate">{task.title}</p>
                      <p className="text-[13px] text-muted-foreground truncate mt-0.5">{task.subtitle}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 shrink-0" />
                  </button>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      <Sheet open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl p-0 flex flex-col bg-background border-t-0">
          <div className="p-6">
            <h2 className="text-xl font-display font-bold text-foreground">Visão Geral</h2>
            <p className="text-[13px] text-muted-foreground mt-1">Acompanhe seu progresso ao longo do mês.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-12">
            <div className="rounded-2xl bg-card border border-border/60 p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCalendarMonthOffset(p => p - 1)} className="p-1.5 active:scale-95 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-display font-bold text-foreground text-[16px] capitalize">
                  {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => setCalendarMonthOffset(p => p + 1)} className="p-1.5 active:scale-95 text-muted-foreground hover:text-foreground">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-2 gap-x-2">
                {calendarDays.map((d, i) => {
                  const ts = d.date.getTime();
                  const isToday = ts === todayStr;
                  const targetOffset = Math.round((ts - todayStr) / 86400000);
                  const isSelected = targetOffset === agendaOffset;
                  const hasTasks = daysWithTasks.has(ts);

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setAgendaOffset(targetOffset);
                        setIsCalendarOpen(false);
                      }}
                      className={`
                        relative flex items-center justify-center h-10 sm:h-12 rounded-full text-[15px] font-medium transition-all
                        ${!d.currentMonth ? 'text-muted-foreground/30' : 'text-foreground hover:bg-muted'}
                        ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary font-bold shadow-md shadow-primary/20 scale-105' : ''}
                        ${isToday && !isSelected ? 'ring-1 ring-primary text-primary' : ''}
                      `}
                    >
                      {d.day}
                      {hasTasks && (
                        <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
