import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { CalendarDays, Download, ChevronRight, CheckCircle2, Loader2, Target, Clock, BookOpen, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const AREAS = [
  'Direito Penal',
  'Direito Civil',
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito do Trabalho',
  'Direito Tributário',
  'Direito Processual Penal',
  'Direito Processual Civil',
  'Geral'
];

const TEMPOS = [
  '1 hora por dia',
  '2 horas por dia',
  '4 horas por dia',
  '8 horas por dia',
  'Apenas finais de semana'
];

const DURACAO = [
  '1 Semana (Revisão Rápida)',
  '1 Mês (Estudo Contínuo)',
  '3 Meses (Preparação Longa)'
];

const FORMATOS = [
  { id: 'simples', label: 'Cronograma Básico', desc: 'Apenas os tópicos e a distribuição de tempo' },
  { id: 'integrado', label: 'Focado no App', desc: 'Indica artigos e súmulas para ler no app' }
];

export default function PlanoEstudos() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState('');
  
  const [area, setArea] = useState('');
  const [tema, setTema] = useState('');
  const [tempo, setTempo] = useState('');
  const [duracao, setDuracao] = useState('');
  const [formato, setFormato] = useState('');

  const gerarPlano = async () => {
    if (!area || !tema || !tempo || !duracao || !formato) {
      toast.error('Preencha todos os campos para gerar o plano.');
      return;
    }
    
    setLoading(true);
    setStep(5); // Loading/Result step
    try {
      const { data, error } = await supabase.functions.invoke('plano-estudos-gerar', {
        body: {
          area,
          tema,
          tempoDiario: tempo,
          duracao,
          formato
        }
      });
      
      if (error) throw error;
      if (data?.markdown) {
        setPlano(data.markdown);
      } else {
        throw new Error('Não foi possível gerar o plano.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Ocorreu um erro ao gerar o plano. Tente novamente.');
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const mobileHeader = (
    <PageHeader
      title="Plano de Estudos"
      subtitle="Cronogramas gerados por IA"
      onBack={() => navigate('/ferramentas')}
    />
  );

  return (
    <DesktopPageLayout mobileHeader={mobileHeader} hideDesktopSidebar={false}>
      <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24 md:pb-8 min-h-screen">
        
        {/* Print Styles */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #plano-print-area, #plano-print-area * { visibility: visible; }
            #plano-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
            .no-print { display: none !important; }
          }
        `}</style>

        {step < 5 && (
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-bold text-foreground font-display flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              Novo Plano de Estudos
            </h1>
            <p className="text-muted-foreground text-sm">
              Siga os passos para criar um cronograma personalizado.
            </p>
          </div>
        )}

        {/* --- PASSO 1: Área do Direito --- */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Passo 1: Qual a Área do Direito?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AREAS.map(a => (
                <button
                  key={a}
                  onClick={() => { setArea(a); setStep(2); }}
                  className={`p-4 rounded-xl border text-left transition-all ${area === a ? 'border-primary bg-primary/10 shadow-sm' : 'border-border/50 bg-card hover:border-primary/50'}`}
                >
                  <span className={`font-medium ${area === a ? 'text-primary' : 'text-foreground'}`}>{a}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- PASSO 2: Tema Específico --- */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Passo 2: Qual o tema ou objetivo?
              </h2>
              <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-primary">Voltar</button>
            </div>
            
            <div className="bg-card border border-border/50 rounded-xl p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground/80 mb-1.5 block">Descreva o que você quer estudar (ex: Princípios Penais, Lei de Licitações, etc)</label>
                <input
                  type="text"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Ex: Tudo sobre Recursos no Processo Civil"
                  className="w-full bg-background border border-border/50 rounded-lg p-3 text-foreground focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              
              <button
                disabled={!tema}
                onClick={() => setStep(3)}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Próximo Passo <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- PASSO 3: Tempo e Duração --- */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Passo 3: Disponibilidade
              </h2>
              <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-primary">Voltar</button>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground/80 block">Tempo diário disponível</label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPOS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTempo(t)}
                    className={`p-3 rounded-lg border text-sm text-left transition-all ${tempo === t ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border/50 bg-card hover:border-primary/50'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground/80 block">Duração do plano</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DURACAO.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuracao(d)}
                    className={`p-3 rounded-lg border text-sm text-center transition-all ${duracao === d ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border/50 bg-card hover:border-primary/50'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!tempo || !duracao}
              onClick={() => setStep(4)}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Próximo Passo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- PASSO 4: Tipo de Plano --- */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Passo 4: Tipo de Plano
              </h2>
              <button onClick={() => setStep(3)} className="text-sm text-muted-foreground hover:text-primary">Voltar</button>
            </div>
            
            <div className="space-y-3">
              {FORMATOS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFormato(f.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${formato === f.id ? 'border-primary bg-primary/10' : 'border-border/50 bg-card hover:border-primary/50'}`}
                >
                  <div className={`mt-0.5 rounded-full p-0.5 ${formato === f.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-medium ${formato === f.id ? 'text-primary' : 'text-foreground'}`}>{f.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              disabled={!formato}
              onClick={gerarPlano}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              Gerar Plano Mágico <SparklesIcon />
            </button>
          </div>
        )}

        {/* --- PASSO 5: Resultado --- */}
        {step === 5 && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div>
                  <h3 className="font-semibold text-lg">Criando seu plano...</h3>
                  <p className="text-sm text-muted-foreground">O Gemini está analisando o tema para montar o cronograma perfeito.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print border-b border-border/50 pb-4">
                  <div>
                    <h2 className="text-xl font-bold font-display text-primary">Seu Plano de Estudos</h2>
                    <p className="text-sm text-muted-foreground">{area} • {tema}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 text-sm font-medium border border-border/50 bg-card hover:bg-secondary rounded-lg"
                    >
                      Novo Plano
                    </button>
                    <button
                      onClick={handlePrint}
                      className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Baixar PDF
                    </button>
                  </div>
                </div>

                <div id="plano-print-area" className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-primary prose-a:text-primary bg-card border border-border/50 p-6 md:p-8 rounded-2xl shadow-sm">
                  <ReactMarkdown>{plano}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DesktopPageLayout>
  );
}

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20L12 12L20 10L12 8L10 0L8 8L0 10L8 12L10 20Z" fill="currentColor"/>
    <path d="M19 23L20 19L24 18L20 17L19 13L18 17L14 18L18 19L19 23Z" fill="currentColor"/>
  </svg>
);
