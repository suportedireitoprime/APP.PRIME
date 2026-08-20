import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Sparkles, CheckCircle2, XCircle, BrainCircuit, Activity, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const AREAS = [
  'Direito Penal', 'Direito Civil', 'Direito Constitucional',
  'Direito Administrativo', 'Direito do Trabalho', 'Direito Processual Penal'
];

interface Questao {
  enunciado: string;
  alternativas: string[];
  indiceCorreto: number;
  justificativa: string;
}

export default function AvaliacaoInteligente() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [areaSelecionada, setAreaSelecionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [questao, setQuestao] = useState<Questao | null>(null);
  const [respostaUsuario, setRespostaUsuario] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [questoesRespondidas, setQuestoesRespondidas] = useState(0);
  
  const MAX_QUESTOES = 3; // Sessão curta

  const gerarQuestao = async (area: string) => {
    setLoading(true);
    setRespostaUsuario(null);
    setQuestao(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('gerar-avaliacao-inteligente', {
        body: { area }
      });
      
      if (error) throw error;
      if (data && data.enunciado) {
        setQuestao(data);
      } else {
        throw new Error("Formato de resposta inválido da IA.");
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Erro ao gerar questão",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
      setAreaSelecionada(null); // Voltar para seleção
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarArea = (area: string) => {
    setAreaSelecionada(area);
    gerarQuestao(area);
  };

  const handleResponder = (index: number) => {
    if (respostaUsuario !== null || !questao) return; // Já respondeu
    
    setRespostaUsuario(index);
    if (index === questao.indiceCorreto) {
      setAcertos(prev => prev + 1);
      // Aqui poderíamos disparar haptic feedback
    }
  };

  const proximaQuestao = () => {
    const totalRespondidas = questoesRespondidas + 1;
    setQuestoesRespondidas(totalRespondidas);
    
    if (totalRespondidas >= MAX_QUESTOES) {
      // Fim da sessão
    } else {
      gerarQuestao(areaSelecionada!);
    }
  };

  const finalizar = () => {
    toast({
      title: "Avaliação Concluída!",
      description: `Você acertou ${acertos} de ${MAX_QUESTOES} em ${areaSelecionada}.`,
    });
    // Opcional: Atualizar a tabela de domínio do usuário aqui
    navigate(-1);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-0 z-10 pt-[max(env(safe-area-inset-top),16px)]">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <h1 className="font-display font-bold text-lg">Avaliação Inteligente</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24 relative">
        <AnimatePresence mode="wait">
          {!areaSelecionada ? (
            <motion.div 
              key="selecao"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">Descubra seu Domínio</h2>
                <p className="text-muted-foreground">
                  A Inteligência Artificial irá testar seus conhecimentos e calibrar seu Gráfico Radar.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2">Selecione uma área para avaliar:</h3>
                {AREAS.map(area => (
                  <button
                    key={area}
                    onClick={() => handleSelecionarArea(area)}
                    className="w-full bg-card border border-border/60 rounded-2xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors active:scale-[0.98]"
                  >
                    <span className="font-display font-bold">{area}</span>
                    <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh] space-y-6 text-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Activity className="w-16 h-16 text-primary animate-bounce relative z-10" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold mb-2 text-primary">A IA está formulando...</h3>
                <p className="text-muted-foreground max-w-[250px] mx-auto">
                  Analisando a doutrina e jurisprudência de {areaSelecionada}.
                </p>
              </div>
            </motion.div>
          ) : questao && questoesRespondidas < MAX_QUESTOES ? (
            <motion.div 
              key="questao"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between text-sm font-bold text-muted-foreground">
                <span className="bg-card px-3 py-1 rounded-full border border-border/40">{areaSelecionada}</span>
                <span>Questão {questoesRespondidas + 1} de {MAX_QUESTOES}</span>
              </div>

              <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm">
                <p className="text-foreground leading-relaxed text-[15px] font-medium">
                  {questao.enunciado}
                </p>
              </div>

              <div className="space-y-3">
                {questao.alternativas.map((alt, idx) => {
                  const isSelecionada = respostaUsuario === idx;
                  const isCorreta = idx === questao.indiceCorreto;
                  const mostrarResultado = respostaUsuario !== null;
                  
                  let btnClass = "w-full text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ";
                  
                  if (!mostrarResultado) {
                    btnClass += "bg-card border-border/60 hover:border-primary/50 active:scale-[0.98]";
                  } else {
                    if (isCorreta) {
                      btnClass += "bg-emerald-500/10 border-emerald-500/50 text-emerald-100";
                    } else if (isSelecionada && !isCorreta) {
                      btnClass += "bg-rose-500/10 border-rose-500/50 text-rose-100";
                    } else {
                      btnClass += "bg-card/50 border-border/20 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleResponder(idx)}
                      disabled={mostrarResultado}
                      className={btnClass}
                    >
                      <div className="flex items-start gap-3 relative z-10">
                        <div className={`mt-0.5 w-6 h-6 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                          mostrarResultado && isCorreta ? 'bg-emerald-500 border-emerald-500 text-white' : 
                          mostrarResultado && isSelecionada && !isCorreta ? 'bg-rose-500 border-rose-500 text-white' : 
                          'border-muted-foreground/30'
                        }`}>
                          {mostrarResultado && isCorreta ? <CheckCircle2 className="w-4 h-4" /> : 
                           mostrarResultado && isSelecionada && !isCorreta ? <XCircle className="w-4 h-4" /> : 
                           <span className="text-xs font-bold text-muted-foreground">{String.fromCharCode(65 + idx)}</span>}
                        </div>
                        <span className="text-[14px] leading-snug">{alt}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {respostaUsuario !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                    className="overflow-hidden"
                  >
                    <div className={`p-5 rounded-2xl border ${respostaUsuario === questao.indiceCorreto ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                      <h4 className={`font-bold flex items-center gap-2 mb-2 ${respostaUsuario === questao.indiceCorreto ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {respostaUsuario === questao.indiceCorreto ? (
                          <><CheckCircle2 className="w-5 h-5" /> Resposta Correta!</>
                        ) : (
                          <><XCircle className="w-5 h-5" /> Resposta Incorreta</>
                        )}
                      </h4>
                      <p className="text-sm text-foreground/90 leading-relaxed">
                        <strong className="text-primary mr-1">Justificativa:</strong> 
                        {questao.justificativa}
                      </p>
                      <Button onClick={proximaQuestao} className="w-full mt-4 rounded-xl font-bold h-12 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                        {questoesRespondidas + 1 >= MAX_QUESTOES ? 'Finalizar Avaliação' : 'Próxima Questão'}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : questoesRespondidas >= MAX_QUESTOES ? (
            <motion.div 
              key="fim"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-[70vh] text-center space-y-6"
            >
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center relative mb-4">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
                <Award className="w-12 h-12 text-primary relative z-10" />
              </div>
              <div>
                <h2 className="font-display text-3xl font-bold text-primary mb-2">Sessão Concluída!</h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Você acertou <span className="font-bold text-foreground">{acertos}</span> de {MAX_QUESTOES} questões em {areaSelecionada}.
                </p>
                <div className="bg-card border border-border/60 p-4 rounded-2xl mb-8">
                  <p className="text-sm text-muted-foreground">
                    Seu Gráfico Radar de Domínio foi atualizado (simulação). Continue praticando para masterizar todas as áreas!
                  </p>
                </div>
                <Button onClick={finalizar} className="w-full h-14 rounded-2xl font-bold text-[16px]">
                  Voltar para Gráficos
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
