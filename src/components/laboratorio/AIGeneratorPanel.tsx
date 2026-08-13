import React, { useState, useEffect, Suspense, lazy, Component } from 'react';
import { Cpu, Github, Loader2, Sparkles, Wand2, Plus, MessageSquare, Send, X, FileText, CheckCircle2, Circle, PlayCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchArtigosLei } from '@/services/legislacaoService';
import type { ArtigoLei } from '@/data/mockData';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, errorMsg: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMsg: error.message || 'Erro desconhecido' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-red-950/20 text-red-400 p-6 rounded-3xl border border-red-900/50">
          <AlertTriangle className="w-12 h-12 mb-4 text-red-500" />
          <h3 className="font-bold text-lg mb-2">Falha ao Carregar Cena 3D</h3>
          <p className="text-sm opacity-80">{this.state.errorMsg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Lazy load the 3D scene to prevent top-level runtime errors or heavy bundle issues
const AnimacaoExemplo3DScene = lazy(() => import('./AnimacaoExemplo3DScene'));

export default function AIGeneratorPanel() {
  const [status, setStatus] = useState<'idle' | 'dispatching' | 'actions_working' | 'done'>('idle');
  const [improveMode, setImproveMode] = useState<false | 'auto' | 'manual'>(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewArtigo, setPreviewArtigo] = useState<ArtigoLei | null>(null);
  const [playbackStep, setPlaybackStep] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [artigosCP, setArtigosCP] = useState<ArtigoLei[]>([]);
  const [loadingArtigos, setLoadingArtigos] = useState(true);
  const [geradosState, setGeradosState] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({
    model: '3.1 Flash Light',
    artigo: '',
    textoLeiSeca: '',
    coreAction: '',
    background: '',
    secondary: '',
    lighting: '',
    camera: ''
  });

  const [improveText, setImproveText] = useState('');
  const [activeArtigoId, setActiveArtigoId] = useState<string>('');

  useEffect(() => {
    const carregarCP = async () => {
      try {
        setLoadingArtigos(true);
        const artigos = await fetchArtigosLei('CP_CODIGO_PENAL', 'CP_CODIGO_PENAL');
        setArtigosCP(artigos);
        
        const salvos = localStorage.getItem('agentes_cenas_geradas');
        if (salvos) {
          try {
            setGeradosState(JSON.parse(salvos));
          } catch (e) {
            console.error('Erro ao fazer parse das cenas', e);
            setGeradosState({});
          }
        } else {
          const initMock = {
            [artigos.find(a => a.numero.includes('121'))?.id || 'fake-121']: true
          };
          setGeradosState(initMock);
          localStorage.setItem('agentes_cenas_geradas', JSON.stringify(initMock));
        }
      } catch (error) {
        console.error('Erro ao carregar CP', error);
      } finally {
        setLoadingArtigos(false);
      }
    };
    carregarCP();
  }, []);

  // Effect para controlar o Playback Multimídia + Voz do Artigo no Modal
  useEffect(() => {
    if (previewModalOpen && previewArtigo) {
      setPlaybackStep(0);
      setCurrentSubtitle(`🎬 Preparando cena para ${previewArtigo.numero}...`);
      
      const roteiro = [
        { step: 0, text: `${previewArtigo.numero}. ${previewArtigo.caput}`, time: 1000 },
        { step: 1, text: "Ocorreu a infração. O agente avança...", time: 7000 },
        { step: 2, text: previewArtigo.paragrafos ? previewArtigo.paragrafos[0] : "Pena aplicável: reclusão ou multa.", time: 11000 },
      ];

      const synth = window.speechSynthesis;
      synth.cancel(); // Para fala anterior

      const speakText = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        synth.speak(utterance);
      };

      const timers = roteiro.map((cena) => {
        return setTimeout(() => {
          setPlaybackStep(cena.step);
          setCurrentSubtitle(cena.text);
          speakText(cena.text);
        }, cena.time);
      });

      return () => {
        timers.forEach(clearTimeout);
        synth.cancel(); // Cala a boca se fechar o modal
      };
    }
  }, [previewModalOpen, previewArtigo]);

  const handleOpenArtigo = (artigo: ArtigoLei) => {
    setActiveArtigoId(artigo.id);
    setFormData({
      model: '3.1 Flash Light',
      artigo: artigo.numero,
      textoLeiSeca: artigo.caput,
      coreAction: `Descreva a ação core para o artigo: ${artigo.caput.substring(0, 80)}...`,
      background: 'Instrução para a IA: Defina os elementos de fundo, ambiente, texturas e atmosfera do cenário de forma BEM DETALHADA.',
      secondary: 'Instrução para a IA: Defina elementos secundários (ex: viaturas, pedestres, objetos cênicos, fumaça) de forma BEM DETALHADA.',
      lighting: 'Instrução para a IA: Defina a iluminação da cena, tipo de luz, ambient occlusion, cor e sombras de forma BEM DETALHADA.',
      camera: 'Instrução para a IA: Defina o posicionamento, ângulo (ex: plongeé), movimentos e FOV da câmera de forma BEM DETALHADA.'
    });
    setShowFormModal(true);
  };

  const handleAssistir = (artigo: ArtigoLei) => {
    setPreviewArtigo(artigo);
    setPreviewModalOpen(true);
  };

  const handleGenerate = () => {
    setShowFormModal(false);
    setStatus('dispatching');
    
    setTimeout(() => {
      setStatus('actions_working');
      setTimeout(() => {
        if (activeArtigoId) {
          const novoState = { ...geradosState, [activeArtigoId]: true };
          setGeradosState(novoState);
          localStorage.setItem('agentes_cenas_geradas', JSON.stringify(novoState));
        }
        setStatus('done');
      }, 4000);
    }, 1500);
  };

  const handleImprove = (mode: 'auto' | 'manual') => {
    if (mode === 'manual' && !improveText) return;
    setStatus('dispatching');
    setImproveMode(false);
    setImproveText('');
    
    setTimeout(() => {
      setStatus('actions_working');
      setTimeout(() => {
        setStatus('done');
      }, 4000);
    }, 1500);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0f172a] text-slate-200 font-sans">
      <div className="bg-[#1e293b] p-4 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
            <Cpu className="text-indigo-400" />
            Laboratório de Agentes (Cenas)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Gere as animações a partir da Lei Seca do Código Penal.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modelo IA:</span>
          <Select 
            value={formData.model} 
            onValueChange={(v) => setFormData({...formData, model: v})}
          >
            <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-indigo-300 font-bold focus:ring-indigo-500">
              <SelectValue placeholder="Selecione o Modelo" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
              <SelectItem value="3.1 Flash Light">3.1 Flash Light (Rápido)</SelectItem>
              <SelectItem value="2.0 Flash">2.0 Flash (Legado)</SelectItem>
              <SelectItem value="Pro">1.5 Pro (Avançado)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar block">
        {status === 'idle' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Código Penal - Artigos</h3>
              <p className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {artigosCP.length > 0 && `${Object.values(geradosState).filter(Boolean).length} de ${artigosCP.length} cenas geradas`}
              </p>
            </div>

            {loadingArtigos ? (
              <div className="flex flex-col items-center justify-center py-20 text-indigo-400 gap-4">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="font-semibold">Buscando Código Penal no Vade Mecum (Tabela Supabase)...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-8">
                {artigosCP.map((artigo) => {
                  const isGerado = !!geradosState[artigo.id];
                  return (
                    <motion.div
                      key={artigo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group relative border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-all shadow-md ${
                        isGerado 
                          ? 'bg-emerald-950/20 border-emerald-900/50 hover:border-emerald-700/50' 
                          : 'bg-slate-800/40 border-slate-700/50 hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {isGerado ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-500 flex-shrink-0" />
                          )}
                          <h4 className={`text-lg font-bold truncate ${isGerado ? 'text-emerald-400' : 'text-white'}`}>
                            {artigo.numero}
                            {artigo.titulo && <span className="ml-2 text-sm text-slate-400 font-normal">({artigo.titulo})</span>}
                          </h4>
                          {isGerado && (
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full ml-2">
                              Gerado
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                          {artigo.caput}
                        </p>
                      </div>
                      
                      <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 flex flex-col md:flex-row gap-2">
                        {isGerado ? (
                          <>
                            <Button 
                              onClick={() => handleAssistir(artigo)}
                              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-900/20"
                            >
                              Assistir Animação
                              <PlayCircle className="w-4 h-4 ml-2" />
                            </Button>
                            <Button 
                              onClick={() => handleOpenArtigo(artigo)}
                              className="w-full md:w-auto bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                            >
                              Revisar
                              <Wand2 className="w-4 h-4 ml-2" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={() => handleOpenArtigo(artigo)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-900/20"
                          >
                            Gerar Cena (IA)
                            <Wand2 className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {(status === 'dispatching' || status === 'actions_working') && (
          <div className="w-full h-full flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <Cpu className={`relative z-10 w-24 h-24 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] ${status === 'actions_working' ? 'animate-bounce' : 'animate-pulse'}`} />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-display font-bold text-white">
                {status === 'dispatching' ? 'Disparando Payload...' : 'IA codificando a Cena...'}
              </h3>
              <p className="text-slate-400 text-lg max-w-md">
                {status === 'dispatching' 
                  ? 'Compilando seu prompt detalhado e enviando para o Agente.' 
                  : `O modelo ${formData.model} está montando elementos de fundo, secundários, câmera e iluminação.`}
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm text-indigo-300 bg-indigo-500/10 px-5 py-3 rounded-full border border-indigo-500/20">
              <Loader2 className="w-5 h-5 animate-spin" />
              Aguardando retorno do Agente...
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="w-full flex flex-col items-center pb-16 pt-4 space-y-10 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 rounded-full p-4 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <Wand2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-white uppercase tracking-wider">Cena Gerada com Sucesso!</h3>
              <p className="text-slate-400 text-base sm:text-lg px-4">O código da cena foi injetado pelo Agente via Actions.</p>
            </div>

            {/* Visualizador 3D da Cena Gerada */}
            <div className="w-full max-w-4xl h-[300px] sm:h-[450px] rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl relative bg-slate-900 shrink-0">
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Preview Engine 3D</span>
              </div>
              
              <ErrorBoundary>
                <Suspense fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <span>Carregando Cena 3D...</span>
                  </div>
                }>
                  <AnimacaoExemplo3DScene step={1} />
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* Loop de Melhoria */}
            <div className="w-full max-w-4xl bg-slate-800/40 border border-slate-700/50 p-6 sm:p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl backdrop-blur-sm shrink-0">
              <h4 className="font-bold text-indigo-300 text-lg sm:text-xl uppercase tracking-wider text-center">A cena precisa de ajustes?</h4>
              
              {!improveMode ? (
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <Button 
                    variant="outline" 
                    className="flex-1 w-full max-w-xs mx-auto sm:mx-0 py-6 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200 transition-colors"
                    onClick={() => setImproveMode('auto')}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Auto Melhorar (IA)
                  </Button>
                  <Button 
                    className="flex-1 w-full max-w-xs mx-auto sm:mx-0 py-6 bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                    onClick={() => setImproveMode('manual')}
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Instrução Manual
                  </Button>
                </div>
              ) : improveMode === 'auto' ? (
                <div className="w-full text-center space-y-5 animate-in fade-in">
                  <p className="text-slate-300 text-sm sm:text-base">A IA vai reavaliar a cena, melhorar câmera, luzes e fidelidade.</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="ghost" onClick={() => setImproveMode(false)} className="text-slate-400 hover:text-white">Cancelar</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6" onClick={() => handleImprove('auto')}>
                      Disparar Melhoria
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-2xl space-y-5 animate-in slide-in-from-bottom-2">
                  <Textarea 
                    autoFocus
                    placeholder="O que você quer mudar? (Ex: 'A iluminação está muito clara, coloque luzes vermelhas e chovendo')" 
                    className="bg-slate-900/80 border-slate-700 text-white resize-none min-h-[100px] focus:ring-indigo-500 text-base"
                    value={improveText}
                    onChange={e => setImproveText(e.target.value)}
                  />
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Button variant="ghost" onClick={() => setImproveMode(false)} className="text-slate-400 hover:text-white w-full sm:w-auto">Cancelar</Button>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 w-full sm:w-auto"
                      disabled={!improveText}
                      onClick={() => handleImprove('manual')}
                    >
                      <Send className="w-4 h-4 mr-2" /> Refinar Cena
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => setStatus('idle')}>
              <Plus className="w-5 h-5 mr-2" />
              Voltar para a Lista
            </Button>
          </div>
        )}
      </div>

      {/* MODAL FLUTUANTE DE FORMULÁRIO */}
      <AnimatePresence>
        {showFormModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#1e293b] border border-slate-700 shadow-2xl rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-[#0f172a]/50 shrink-0">
                <div className="flex items-center gap-3">
                  <FileText className="text-indigo-400" size={24} />
                  <h3 className="text-xl font-bold text-white">Parâmetros Detalhados para Geração da Cena</h3>
                </div>
                <button 
                  onClick={() => setShowFormModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 relative">
                  <div className="absolute top-0 right-0 p-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-800 px-2 py-1 rounded-bl-xl rounded-tr-lg">Lei Seca do Vade Mecum</span>
                  </div>
                  <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">{formData.artigo}</h4>
                  <p className="text-slate-200 font-serif italic text-base leading-relaxed border-l-4 border-indigo-500 pl-4 py-1">
                    "{formData.textoLeiSeca}"
                  </p>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-4 rounded-xl flex gap-3 text-sm">
                  <Sparkles className="shrink-0 w-5 h-5 text-indigo-400" />
                  <p><b>Instrução para a IA:</b> Especifique os campos abaixo com o máximo de detalhes possível. A IA utilizará isso como prompt direto para montar a cena, os objetos, a iluminação e a câmera.</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-indigo-300">Ação Principal (Core Action)</label>
                    <Input 
                      placeholder="Descreva a ação que deve acontecer na cena animada..." 
                      className="bg-slate-900/50 border-slate-700 focus:ring-indigo-500 text-white font-medium h-12"
                      value={formData.coreAction}
                      onChange={(e) => setFormData({...formData, coreAction: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-indigo-300">Elementos de Fundo (Cenário / Props) - DETALHADO</label>
                  <Textarea 
                    placeholder="Instrução para a IA: Defina os elementos de fundo, ambiente, texturas e atmosfera do cenário de forma BEM DETALHADA." 
                    className="bg-slate-900/50 border-slate-700 focus:ring-indigo-500 text-white min-h-[100px]"
                    value={formData.background}
                    onChange={(e) => setFormData({...formData, background: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-indigo-300">Elementos Secundários</label>
                    <Textarea 
                      placeholder="Instrução para a IA: Defina elementos secundários (ex: viaturas, pedestres, objetos cênicos, fumaça) de forma BEM DETALHADA." 
                      className="bg-slate-900/50 border-slate-700 focus:ring-indigo-500 text-white min-h-[140px]"
                      value={formData.secondary}
                      onChange={(e) => setFormData({...formData, secondary: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-indigo-300">Iluminação (Lighting)</label>
                    <Textarea 
                      placeholder="Instrução para a IA: Defina a iluminação da cena, tipo de luz, ambient occlusion, cor e sombras de forma BEM DETALHADA." 
                      className="bg-slate-900/50 border-slate-700 focus:ring-indigo-500 text-white min-h-[140px]"
                      value={formData.lighting}
                      onChange={(e) => setFormData({...formData, lighting: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-indigo-300">Câmera e Ângulos</label>
                    <Textarea 
                      placeholder="Instrução para a IA: Defina o posicionamento, ângulo (ex: plongeé), movimentos e FOV da câmera de forma BEM DETALHADA." 
                      className="bg-slate-900/50 border-slate-700 focus:ring-indigo-500 text-white min-h-[140px]"
                      value={formData.camera}
                      onChange={(e) => setFormData({...formData, camera: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-700/50 bg-[#0f172a]/50 flex justify-end gap-4 shrink-0">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowFormModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleGenerate}
                  disabled={!formData.coreAction}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6 px-8 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all scale-100 hover:scale-105"
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  Gerar Cena via Agente IA
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE PLAYER DE ANIMAÇÃO */}
      <AnimatePresence>
        {previewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden relative"
            >
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">{previewArtigo?.numero} - Playback Automático</span>
              </div>
              
              <button 
                onClick={() => setPreviewModalOpen(false)}
                className="absolute top-4 right-4 z-20 p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full hover:bg-red-500 text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex-1 w-full h-full relative bg-black">
                {/* OVERLAY DE NARRAÇÃO (SUBTITLES) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-3xl pointer-events-none">
                  <AnimatePresence mode="wait">
                    {currentSubtitle && (
                      <motion.div
                        key={currentSubtitle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-black/70 backdrop-blur-md border border-white/20 p-4 rounded-xl text-center shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                      >
                        <p className="text-white font-serif italic text-lg sm:text-xl drop-shadow-md">
                          "{currentSubtitle}"
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <ErrorBoundary>
                  <Suspense fallback={
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                      <span>Carregando Engine 3D...</span>
                    </div>
                  }>
                    <AnimacaoExemplo3DScene step={playbackStep} />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
