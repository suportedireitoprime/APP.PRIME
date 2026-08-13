import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LaboratorioEngine, { SceneJSON } from './LaboratorioEngine';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DynamicSceneLoader({ codigo_nome, artigo_numero }: { codigo_nome: string, artigo_numero: number }) {
  const [config, setConfig] = useState<SceneJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadScene() {
      setLoading(true);
      setError(null);
      setConfig(null);
      
      try {
        // Verifica cache localmente ou tenta chamar a function
        const { data, error: fnError } = await supabase.functions.invoke('laboratorio-gerar-cena', {
          body: { codigo_nome, artigo_numero, artigo_texto: '' } // o texto não é estritamente necessário no MVP
        });

        if (fnError) {
          throw new Error('Falha ao conectar com o gerador Gemini: ' + fnError.message);
        }

        if (data?.cena_json) {
          setConfig(data.cena_json);
          toast({
            title: data.from_cache ? "Cena Carregada do Cache" : "Nova Cena Gerada pela IA",
            description: "A renderização Vanilla 3D iniciou com sucesso.",
          });
        } else {
          throw new Error('Nenhum JSON retornado pela IA.');
        }

      } catch (err: any) {
        console.error("Erro no carregamento dinâmico:", err);
        setError(err.message || 'Erro desconhecido');
        // Fallback mock
        setConfig({
          environment: 'generic',
          timeline: [
            {
              step: 0, duration: 4000, text: `Erro de rede ou limite da API. Cena fallback mock para o ${codigo_nome} Art. ${artigo_numero}`, 
              cam: { x: 0, y: 3, z: 10, lookX: 0, lookY: 1.5, fov: 50 },
              agent_pos: { x: -2, z: 2, rotY: 0 }
            }
          ]
        });
      } finally {
        setLoading(false);
      }
    }

    loadScene();
  }, [codigo_nome, artigo_numero, toast]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white bg-black/50 backdrop-blur-sm rounded-xl">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
        <h3 className="text-xl font-bold font-display">Conectando ao Gemini 3.1 Flash Lite</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm text-center">
          O Agente de IA está desenhando a linha do tempo, a cinematografia e o posicionamento dos Voxel Actors em tempo real para o Art. {artigo_numero}...
        </p>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-500">
        Erro crítico: {error}
      </div>
    );
  }

  if (!config) return null;

  return <LaboratorioEngine config={config} />;
}
