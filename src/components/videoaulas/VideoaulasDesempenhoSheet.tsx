import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, CalendarDays } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  open: boolean;
  onClose: () => void;
  horasTotais: number;
}

const mockData = [
  { name: 'Seg', horas: 1.5 },
  { name: 'Ter', horas: 2.0 },
  { name: 'Qua', horas: 0.5 },
  { name: 'Qui', horas: 3.0 },
  { name: 'Sex', horas: 1.0 },
  { name: 'Sáb', horas: 0 },
  { name: 'Dom', horas: 2.5 },
];

export default function VideoaulasDesempenhoSheet({ open, onClose, horasTotais }: Props) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
        onClick={() => {
          haptic.selection();
          onClose();
        }}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[10001] bg-card rounded-t-[20px] pb-safe md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:w-[min(30rem,92vw)] md:rounded-none md:rounded-l-3xl shadow-2xl overflow-hidden"
      >
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted-foreground/20 rounded-full md:hidden" />
        
        <div className="flex items-center justify-between p-5 pt-8 md:pt-5 border-b border-border">
          <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Seu Desempenho
          </h2>
          <button
            onClick={() => { haptic.selection(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto h-full pb-32">
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-black text-primary">{horasTotais}h</span>
              <span className="text-xs font-bold uppercase tracking-wider text-primary/70 mt-1">Total Assistido</span>
            </div>
            
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-black text-foreground">10.5h</span>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">Esta Semana</span>
            </div>
          </div>

          <h3 className="font-display font-bold text-base mb-4">Horas por dia (Semana)</h3>
          
          <div className="h-[200px] w-full bg-card rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="horas" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorHoras)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-8 space-y-3">
             <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Neste Mês</p>
                  <p className="text-xs text-muted-foreground">32.5h assistidas</p>
                </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Mês Passado</p>
                  <p className="text-xs text-muted-foreground">28.0h assistidas</p>
                </div>
             </div>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
