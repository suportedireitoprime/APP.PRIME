import React, { useState } from 'react';
import { Cpu, Github, Loader2, Sparkles, Wand2, Plus, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AIGeneratorPanel() {
  const [status, setStatus] = useState<'idle' | 'dispatching' | 'actions_working' | 'done'>('idle');
  const [improveMode, setImproveMode] = useState<false | 'auto' | 'manual'>(false);
  
  const [formData, setFormData] = useState({
    model: '3.1 Flash Light',
    artigo: '',
    coreAction: '',
    background: '',
    secondary: '',
    lighting: '',
    camera: ''
  });

  const [improveText, setImproveText] = useState('');

  const handleGenerate = () => {
    setStatus('dispatching');
    
    // Simula disparo pro GitHub (dispatch event)
    setTimeout(() => {
      setStatus('actions_working');
      
      // Simula tempo do Agente trabalhando no GitHub Actions
      setTimeout(() => {
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
    <div className="w-full h-full flex flex-col bg-[#0f172a] rounded-xl overflow-hidden border border-border/50 text-slate-200">
      <div className="bg-[#1e293b] p-4 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white">
            <Cpu className="text-indigo-400" />
            Laboratório de Agentes (Geração Automática)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Orquestre agentes autônomos via GitHub Actions para construir cenas em Cel-Shading.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400">Modelo IA:</span>
          <Select 
            value={formData.model} 
            onValueChange={(v) => setFormData({...formData, model: v})}
          >
            <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-indigo-300 font-bold">
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

      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {status === 'idle' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-indigo-300">Artigo / Título da Cena</label>
                <Input 
                  placeholder="Ex: Art. 121 - Homicídio" 
                  className="bg-slate-900/50 border-slate-700"
                  value={formData.artigo}
                  onChange={(e) => setFormData({...formData, artigo: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-indigo-300">Ação Principal (Core)</label>
                <Input 
                  placeholder="Ex: O infrator atira e a vítima cai" 
                  className="bg-slate-900/50 border-slate-700"
                  value={formData.coreAction}
                  onChange={(e) => setFormData({...formData, coreAction: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-indigo-300">Elementos de Fundo (Cenário / Props)</label>
              <Textarea 
                placeholder="Detalhe o cenário. Ex: Rua escura e chuvosa, parede de tijolos, poste de luz piscando..." 
                className="bg-slate-900/50 border-slate-700 min-h-[80px]"
                value={formData.background}
                onChange={(e) => setFormData({...formData, background: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-indigo-300">Elementos Secundários</label>
                <Textarea 
                  placeholder="Ex: Carro de polícia, viaturas, lixo no chão" 
                  className="bg-slate-900/50 border-slate-700 min-h-[100px]"
                  value={formData.secondary}
                  onChange={(e) => setFormData({...formData, secondary: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-indigo-300">Iluminação (Lighting)</label>
                <Textarea 
                  placeholder="Ex: Luz de neon vermelha forte, spotLight azul, sombras duras" 
                  className="bg-slate-900/50 border-slate-700 min-h-[100px]"
                  value={formData.lighting}
                  onChange={(e) => setFormData({...formData, lighting: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-indigo-300">Câmera e Ângulos</label>
                <Textarea 
                  placeholder="Ex: Câmera em y=10 (plongeé), fov=65, aproximando-se lentamente" 
                  className="bg-slate-900/50 border-slate-700 min-h-[100px]"
                  value={formData.camera}
                  onChange={(e) => setFormData({...formData, camera: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleGenerate}
                disabled={!formData.artigo || !formData.coreAction}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 px-8 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all scale-100 hover:scale-105 w-full sm:w-auto"
              >
                <Github className="mr-2 h-5 w-5" />
                Disparar Agente via GitHub Actions
              </Button>
            </div>
          </div>
        )}

        {(status === 'dispatching' || status === 'actions_working') && (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <Cpu className={`w-20 h-20 text-indigo-400 ${status === 'actions_working' ? 'animate-bounce' : 'animate-pulse'}`} />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white">
                {status === 'dispatching' ? 'Disparando Payload...' : 'Trabalho bruto no GitHub Actions...'}
              </h3>
              <p className="text-slate-400 max-w-md">
                {status === 'dispatching' 
                  ? 'Compilando seu prompt detalhado e enviando webhook para o repositório.' 
                  : `O modelo ${formData.model} está codando os elementos 3D, luzes e câmera.`}
              </p>
            </div>

            <div className="flex items-center gap-3 text-sm text-indigo-300 bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
              <Loader2 className="w-4 h-4 animate-spin" />
              Aguardando retorno (CI/CD Pipeline)...
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300">
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full w-24 h-24 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <Wand2 className="w-12 h-12 text-emerald-400" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-white">Cena Gerada com Sucesso!</h3>
              <p className="text-slate-400">O código React/Three.js foi injetado pelo Agente via Actions.</p>
            </div>

            {/* Loop de Melhoria */}
            <div className="w-full max-w-xl bg-slate-800/50 border border-slate-700 p-6 rounded-2xl flex flex-col items-center gap-6">
              <h4 className="font-bold text-indigo-300 text-lg">A cena não ficou perfeita?</h4>
              
              {!improveMode ? (
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:text-indigo-200"
                    onClick={() => setImproveMode('auto')}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Auto Melhorar (Agente decide)
                  </Button>
                  <Button 
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white"
                    onClick={() => setImproveMode('manual')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Melhorar com Descrição
                  </Button>
                </div>
              ) : improveMode === 'auto' ? (
                <div className="w-full text-center space-y-4 animate-in fade-in">
                  <p className="text-sm text-slate-300">O Agente irá reavaliar a cena, otimizar materiais Toon, câmera e timing.</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="ghost" onClick={() => setImproveMode(false)}>Cancelar</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => handleImprove('auto')}>
                      Disparar Auto-Improve
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4 animate-in slide-in-from-bottom-2">
                  <Textarea 
                    autoFocus
                    placeholder="O que você quer mudar? (Ex: 'A iluminação está muito clara, escureça e coloque chuva')" 
                    className="bg-slate-900/80 border-slate-700 text-white resize-none"
                    value={improveText}
                    onChange={e => setImproveText(e.target.value)}
                  />
                  <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={() => setImproveMode(false)}>Cancelar</Button>
                    <Button 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white"
                      disabled={!improveText}
                      onClick={() => handleImprove('manual')}
                    >
                      <Send className="w-4 h-4 mr-2" /> Enviar para o Agente
                    </Button>
                  </div>
                </div>
              )}

            </div>

            <Button variant="ghost" className="text-slate-400" onClick={() => setStatus('idle')}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Cena
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
