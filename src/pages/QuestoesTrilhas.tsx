import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, PlayCircle, Target, Route as RouteIcon, Bell, Clock, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/vademecum/PageHeader';
import QuestoesBottomNav from '@/components/questoes/QuestoesBottomNav';
import { useQuestoesAreas } from '@/hooks/useQuestoes';
import { visualDaArea } from '@/lib/questoesVisual';
import { useQuestoesTrilhaStore } from '@/lib/questoesTrilhaStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

// Configurações
const METAS_DISPONIVEIS = [10, 20, 30, 50];
const DIAS_META = 30; // Trilha/Desafio de 30 dias

const QuestoesTrilhas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trilhaAtiva, setTrilhaAtiva, limparTrilha, marcarDiaConcluido } = useQuestoesTrilhaStore();
  const { areas, loading: loadingAreas } = useQuestoesAreas();
  
  // Wizard State
  const [fase, setFase] = useState(0);
  const [metaSelecionada, setMetaSelecionada] = useState<number>(10);
  const [materiasSelecionadas, setMateriasSelecionadas] = useState<string[]>([]);
  const [horario, setHorario] = useState('09:00');
  const [salvando, setSalvando] = useState(false);

  const toggleMateria = (area: string) => {
    haptic.selection();
    setMateriasSelecionadas(prev => 
      prev.includes(area) ? prev.filter(m => m !== area) : [...prev, area]
    );
  };

  const handleCreateTrilha = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para criar uma trilha.');
      return;
    }
    setSalvando(true);
    haptic.medium();

    try {
      // 1. Salvar Lembrete no Supabase para Push
      const payload = {
        user_id: user.id,
        ativo: true,
        dias: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'],
        horario,
        meta: metaSelecionada
      };

      // Tenta achar um lembrete existente de trilha de questões para atualizar, ou cria um novo
      const { data: existente } = await supabase.from('questoes_lembretes').select('id').eq('user_id', user.id).maybeSingle();
      
      if (existente) {
        await supabase.from('questoes_lembretes').update(payload).eq('id', existente.id);
      } else {
        await supabase.from('questoes_lembretes').insert(payload);
      }

      // 2. Salvar Trilha no Zustand
      setTrilhaAtiva({
        metaDiaria: metaSelecionada,
        materias: materiasSelecionadas,
        assuntos: [],
        diasConcluidos: [],
        dataInicio: new Date().toISOString()
      });

      toast.success('Trilha criada com sucesso!');
      setFase(0); // reset state

    } catch (e: any) {
      toast.error('Erro ao configurar trilha: ' + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const abortarTrilha = () => {
    haptic.medium();
    limparTrilha();
    toast.success('Trilha abortada. Comece de novo!');
  };

  // ----------------------------------------------------
  // WIZARD RENDERERS
  // ----------------------------------------------------
  const renderSetupFase1 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center pt-8 px-4 pb-32">
      <div className="w-20 h-20 bg-hero-panel rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/40">
        <Target className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2 text-center">Missão Diária</h2>
      <p className="text-sm text-zinc-400 mb-8 text-center max-w-[280px]">Quantas questões você quer resolver todos os dias?</p>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12">
        {METAS_DISPONIVEIS.map(m => (
          <button
            key={m}
            onClick={() => { haptic.selection(); setMetaSelecionada(m); }}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
              metaSelecionada === m ? 'border-white bg-white/10 scale-105 shadow-[0_0_15px_rgba(255,255,255,0.15)]' : 'border-white/10 bg-zinc-900/50 hover:border-white/30'
            }`}
          >
            <span className="text-3xl font-black text-white">{m}</span>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Questões</span>
          </button>
        ))}
      </div>
      
      <button
        onClick={() => { haptic.light(); setFase(1); }}
        className="w-full max-w-sm h-14 rounded-full bg-hero-panel text-white font-bold text-[15px] shadow-lg shadow-black/40 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        Continuar <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );

  const renderSetupFase2 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center pt-4 px-4 pb-32">
      <button onClick={() => setFase(0)} className="self-start p-2 mb-2 text-zinc-400 hover:text-white">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h2 className="text-2xl font-black text-white mb-2 text-center">Selecione as Matérias</h2>
      <p className="text-sm text-zinc-400 mb-6 text-center max-w-[280px]">Quais disciplinas vão compor o seu treino diário?</p>
      
      <div className="w-full max-w-md space-y-3 mb-10">
        {loadingAreas ? (
          <div className="text-center text-zinc-500 py-10">Carregando disciplinas...</div>
        ) : (
          areas.slice(0, 15).map(a => {
            const isSelected = materiasSelecionadas.includes(a.area);
            const { icon: Icon, color } = visualDaArea(a.area);
            return (
              <button
                key={a.area}
                onClick={() => toggleMateria(a.area)}
                className={`w-full flex items-center gap-4 text-left p-4 rounded-2xl border transition-all ${
                  isSelected ? 'border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-white/10 bg-zinc-900/50 hover:border-white/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-white text-black' : 'bg-white/5 text-zinc-400'}`}>
                  <Icon className="w-5 h-5" style={isSelected ? {} : { color }} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-white leading-tight">{a.area}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-white bg-white' : 'border-zinc-600'}`}>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                </div>
              </button>
            );
          })
        )}
      </div>
      
      <button
        disabled={materiasSelecionadas.length === 0}
        onClick={() => { haptic.light(); setFase(2); }}
        className="w-full max-w-sm h-14 rounded-full bg-hero-panel text-white font-bold text-[15px] shadow-lg shadow-black/40 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
      >
        Avançar <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );

  const renderSetupFase3 = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center pt-4 px-4 pb-32">
      <button onClick={() => setFase(1)} className="self-start p-2 mb-2 text-zinc-400 hover:text-white">
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <div className="w-20 h-20 bg-hero-panel rounded-full flex items-center justify-center mb-6 shadow-lg shadow-black/40">
        <Bell className="w-10 h-10 text-white animate-pulse" />
      </div>
      
      <h2 className="text-2xl font-black text-white mb-2 text-center">Configurar Alarme</h2>
      <p className="text-sm text-zinc-400 mb-8 text-center max-w-[280px]">Que horas você quer ser lembrado para bater a meta?</p>
      
      <div className="w-full max-w-sm mb-12 flex justify-center">
        <div className="relative flex items-center gap-3">
          <Clock className="w-6 h-6 text-zinc-400 absolute left-4" />
          <input
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            className="w-48 bg-zinc-900/80 border border-white/20 rounded-2xl h-16 pl-14 pr-4 text-xl font-bold text-white text-center focus:outline-none focus:border-white focus:ring-1 focus:ring-white/50"
          />
        </div>
      </div>
      
      <button
        onClick={handleCreateTrilha}
        disabled={salvando}
        className="w-full max-w-sm h-14 rounded-full bg-hero-panel text-white font-bold text-[15px] shadow-lg shadow-black/40 active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {salvando ? 'Salvando...' : 'Ativar Trilha'}
      </button>
    </motion.div>
  );

  // ----------------------------------------------------
  // TRILHA ATIVA VIEW (DASHBOARD)
  // ----------------------------------------------------
  const renderTrilhaAtiva = () => {
    if (!trilhaAtiva) return null;
    
    // Calculando progresso
    const totalDias = DIAS_META;
    const concluidos = trilhaAtiva.diasConcluidos.length;
    const hojeIndex = Math.min(concluidos, totalDias - 1); // Próximo dia a fazer
    
    // Preparando o link para Praticar
    let praticarUrl = '/questoes/praticar';
    if (trilhaAtiva.materias.length > 0) {
      const q = new URLSearchParams();
      q.set('areas', trilhaAtiva.materias.join(','));
      q.set('limite', trilhaAtiva.metaDiaria.toString());
      praticarUrl += `?${q.toString()}`;
    }

    return (
      <div className="w-full flex flex-col pt-6 px-4 pb-32">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Missão Diária</h2>
            <p className="text-sm text-zinc-400">Desafio de {totalDias} dias</p>
          </div>
          <button 
            onClick={abortarTrilha}
            className="bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors p-3 rounded-full"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Card Principal */}
        <div className="w-full rounded-[28px] bg-hero-panel border-2 border-white/10 p-6 mb-8 shadow-lg shadow-black/40 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
            <Target className="w-40 h-40 text-white" />
          </div>
          
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-white/70 uppercase tracking-widest">Sua Meta</p>
                <p className="text-lg font-black text-white">{trilhaAtiva.metaDiaria} Questões/dia</p>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-zinc-300">
                  Dia {concluidos} de {totalDias}
                </p>
                <p className="text-xs font-black text-white">
                  {Math.round((concluidos / totalDias) * 100)}%
                </p>
              </div>
              <div className="h-2 w-full rounded-full bg-black/40 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-white transition-all duration-1000"
                  style={{ width: `${Math.round((concluidos / totalDias) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => {
            haptic.light();
            navigate(praticarUrl);
          }}
          className="w-full h-16 rounded-full bg-white text-black font-black text-[16px] shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-10 hover:bg-zinc-200"
        >
          <PlayCircle className="w-6 h-6" /> Começar Treino de Hoje
        </button>

        {/* Linha do Tempo */}
        <h3 className="text-[15px] font-bold text-white mb-4 px-2">Sua Jornada</h3>
        <div className="relative border-l-2 border-white/10 ml-6 pb-4 space-y-6">
          {Array.from({ length: totalDias }).map((_, index) => {
            const isFeito = trilhaAtiva.diasConcluidos.includes(index);
            const isHoje = index === hojeIndex;
            const isFuturo = index > hojeIndex;
            
            return (
              <div key={index} className="relative flex items-center gap-4 pl-6">
                {/* Marcador na linha */}
                <div className={`absolute -left-[11px] w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${isFeito ? 'bg-hero-panel border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 
                    isHoje ? 'bg-black border-white animate-pulse' : 'bg-black border-zinc-700'}`}
                >
                  {isFeito && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                
                {/* Card do Dia */}
                <div className={`flex-1 p-4 rounded-2xl border transition-all ${
                  isHoje ? 'border-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]' :
                  isFeito ? 'border-white/20 bg-hero-panel/30 opacity-70' :
                  'border-white/5 bg-black/40 opacity-50'
                }`}>
                  <p className={`text-sm font-black ${isHoje || isFeito ? 'text-white' : 'text-zinc-500'}`}>
                    Dia {index + 1}
                  </p>
                  <p className={`text-[11px] font-semibold mt-1 ${isHoje || isFeito ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {isFeito ? 'Meta Concluída!' : isHoje ? 'Pronto para treinar' : 'Aguardando...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    );
  };

  return (
    <div className="theme-questoes min-h-screen bg-[#0A0A0A] selection:bg-white/20">
      <PageHeader title="Trilhas" subtitle={trilhaAtiva ? "Sua missão diária" : "Criar meta diária"} onBack={() => navigate('/questoes')} />

      <div className="mx-auto w-full max-w-3xl">
        <AnimatePresence mode="wait">
          {trilhaAtiva ? (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {renderTrilhaAtiva()}
            </motion.div>
          ) : (
            <motion.div key={`fase-${fase}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {fase === 0 && renderSetupFase1()}
              {fase === 1 && renderSetupFase2()}
              {fase === 2 && renderSetupFase3()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <QuestoesBottomNav />
    </div>
  );
};

export default QuestoesTrilhas;
