import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { BellRing, Plus, Clock, MapPin, Save, Map, Building2, Home, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ReminderType = 'time' | 'location' | null;
type LocationType = 'faculdade' | 'casa' | 'trabalho' | null;

export default function FaculdadeLembretes() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderType>(null);
  
  // States for Time
  const [timeValue, setTimeValue] = useState('');
  const [dateValue, setDateValue] = useState('');

  // States for Location
  const [locationValue, setLocationValue] = useState<LocationType>(null);

  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = () => {
    if (!title || !type) return;
    if (type === 'time' && (!timeValue || !dateValue)) return;
    if (type === 'location' && !locationValue) return;

    // Mock save flow with success animation
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsCreating(false);
      setTitle('');
      setType(null);
      setTimeValue('');
      setDateValue('');
      setLocationValue(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      <PageHeader 
        title="Lembretes" 
        subtitle="Agende estudos e revisões" 
        onBack={() => {
          if (isCreating) setIsCreating(false);
          else navigate('/');
        }} 
      />

      <AnimatePresence mode="wait">
        {!isCreating && !isSuccess ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex-1 p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-primary/20">
              <BellRing className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
            <h2 className="font-display font-bold text-xl text-foreground mb-3">
              Nenhum lembrete ativo
            </h2>
            <p className="font-body text-[14px] text-muted-foreground leading-relaxed mb-10">
              Crie lembretes inteligentes baseados em horários específicos ou na sua localização (ex: quando chegar na faculdade).
            </p>
            
            <motion.button
              onClick={() => setIsCreating(true)}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-display font-bold shadow-lg shadow-primary/25"
            >
              <Plus className="w-5 h-5" />
              Criar Novo Lembrete
            </motion.button>
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 p-6 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 100 }}
              className="w-20 h-20 bg-[#22c55e]/10 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-[#22c55e]" strokeWidth={2} />
            </motion.div>
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">Lembrete Ativo!</h2>
            <p className="text-muted-foreground font-body text-sm">Nós avisaremos você no momento certo.</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="flex-1 p-6 flex flex-col max-w-md mx-auto w-full"
          >
            <div className="space-y-6 flex-1">
              {/* O que lembrar */}
              <div>
                <label className="block font-display font-bold text-foreground text-[15px] mb-2">
                  O que você precisa estudar ou lembrar?
                </label>
                <input
                  type="text"
                  placeholder="Ex: Estudar Processo Civil..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-card border border-border/60 rounded-xl px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
              </div>

              {/* Gatilho: Tipo */}
              <div>
                <label className="block font-display font-bold text-foreground text-[15px] mb-2">
                  Quando devemos avisar?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setType('time')}
                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
                      type === 'time' 
                        ? 'bg-primary/10 border-primary shadow-sm shadow-primary/10' 
                        : 'bg-card border-border/60 hover:bg-muted/50'
                    }`}
                  >
                    <Clock className={`w-6 h-6 ${type === 'time' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-display font-bold text-[13px] ${type === 'time' ? 'text-primary' : 'text-foreground'}`}>
                      Por Horário
                    </span>
                  </button>
                  <button
                    onClick={() => setType('location')}
                    className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
                      type === 'location' 
                        ? 'bg-primary/10 border-primary shadow-sm shadow-primary/10' 
                        : 'bg-card border-border/60 hover:bg-muted/50'
                    }`}
                  >
                    <MapPin className={`w-6 h-6 ${type === 'location' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-display font-bold text-[13px] ${type === 'location' ? 'text-primary' : 'text-foreground'}`}>
                      Por Localização
                    </span>
                  </button>
                </div>
              </div>

              {/* Detalhes do Gatilho */}
              <AnimatePresence mode="popLayout">
                {type === 'time' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-body text-muted-foreground text-[12px] mb-1.5 ml-1">Data</label>
                        <input
                          type="date"
                          value={dateValue}
                          onChange={e => setDateValue(e.target.value)}
                          className="w-full bg-card border border-border/60 rounded-xl px-4 py-3 text-[14px] text-foreground focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block font-body text-muted-foreground text-[12px] mb-1.5 ml-1">Horário</label>
                        <input
                          type="time"
                          value={timeValue}
                          onChange={e => setTimeValue(e.target.value)}
                          className="w-full bg-card border border-border/60 rounded-xl px-4 py-3 text-[14px] text-foreground focus:outline-none focus:border-primary/50"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {type === 'location' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="block font-body text-muted-foreground text-[12px] mb-1.5 ml-1">
                      Avisar quando eu chegar em:
                    </label>
                    <div className="space-y-2">
                      {[
                        { id: 'faculdade', label: 'Faculdade', icon: Building2 },
                        { id: 'casa', label: 'Casa', icon: Home },
                        { id: 'trabalho', label: 'Trabalho', icon: Map },
                      ].map(loc => (
                        <button
                          key={loc.id}
                          onClick={() => setLocationValue(loc.id as LocationType)}
                          className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                            locationValue === loc.id
                              ? 'bg-primary/5 border-primary shadow-sm'
                              : 'bg-card border-border/60 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${locationValue === loc.id ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                              <loc.icon className="w-5 h-5" />
                            </div>
                            <span className={`font-display font-bold text-[14px] ${locationValue === loc.id ? 'text-primary' : 'text-foreground'}`}>
                              {loc.label}
                            </span>
                          </div>
                          {locationValue === loc.id && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              onClick={handleSave}
              disabled={!title || !type || (type === 'time' && (!dateValue || !timeValue)) || (type === 'location' && !locationValue)}
              whileTap={{ scale: 0.97 }}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-display font-bold shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <Save className="w-5 h-5" />
              Salvar Lembrete
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
