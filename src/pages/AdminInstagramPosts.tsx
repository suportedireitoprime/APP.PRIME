import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import InstagramSlide from '@/components/admin/InstagramSlide';
import InstagramFlashcardSlide from '@/components/admin/InstagramFlashcardSlide';

// Imagens padrão de filósofos
import cicero from '@/assets/filosofos/cicero.webp';
import aquino from '@/assets/filosofos/aquino.webp';
import montesquieu from '@/assets/filosofos/montesquieu.webp';
import kant from '@/assets/filosofos/kant.webp';
import platao from '@/assets/filosofos/platao.webp';
import aristoteles from '@/assets/filosofos/aristoteles.webp';

const FALLBACK_IMAGES = [platao, aristoteles, cicero, aquino, kant, montesquieu];

type Slide = {
  type: 'cover' | 'content' | 'flashcard';
  title: string;
  content?: string;
  practice?: string;
};

export default function AdminInstagramPosts() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('Princípios Penais da Anterioridade');
  const [username, setUsername] = useState('@app.prime');
  const [mode, setMode] = useState<'carrossel' | 'flashcard'>('carrossel');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [coverImage, setCoverImage] = useState(FALLBACK_IMAGES[0]);

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error('Digite o tema para gerar os posts.');
    
    setLoading(true);
    setSlides([]);
    
    // Pick random cover
    setCoverImage(FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)]);

    try {
      const systemPrompt = mode === 'carrossel' 
      ? `Você é um copywriter especialista no mundo jurídico. Crie um carrossel para Instagram sobre o tema: "${prompt}".
Retorne estritamente um JSON no seguinte formato (um array de objetos):
[
  { "type": "cover", "title": "TÍTULO CHAMATIVO" },
  { "type": "content", "title": "1. Título do slide", "content": "Texto explicativo..." },
  { "type": "content", "title": "Conclusão", "content": "Resumo final..." }
]
Use de 4 a 6 slides no total. NÃO retorne blocos de código markdown (como \`\`\`json), apenas o texto JSON puro para que eu possa executar JSON.parse diretamente. Sem textos antes ou depois.`
      : `Você é um professor de direito criando um flashcard para Instagram sobre o tema: "${prompt}".
Retorne estritamente um JSON no seguinte formato (um array com apenas UM objeto):
[
  { 
    "type": "flashcard", 
    "title": "TÍTULO DO CONCEITO (ex: Erro de tipo)", 
    "content": "Definição direta e fácil de entender.", 
    "practice": "Um exemplo prático claro e rápido."
  }
]
NÃO retorne blocos de código markdown (como \`\`\`json), apenas o texto JSON puro. Sem textos antes ou depois.`;

      const { data, error } = await supabase.functions.invoke('assistente-juridica', {
        body: { mode: 'chat', prompt: systemPrompt }
      });

      if (error) throw error;
      
      let resText = data?.text || data?.response || data;
      if (typeof resText === 'object') {
        resText = JSON.stringify(resText);
      }
      
      // Cleanup json ticks
      resText = resText.replace(/```json/gi, '').replace(/```/g, '').trim();

      const parsed: Slide[] = JSON.parse(resText);
      if (!Array.isArray(parsed)) throw new Error('A resposta da IA não é um array válido.');
      
      setSlides(parsed);
      toast.success('Carrossel gerado com sucesso!');
    } catch (err: any) {
      console.error('Erro na geração IA:', err);
      toast.error('A IA falhou. Usando conteúdo de exemplo para demonstração.');
      
      if (mode === 'carrossel') {
        setSlides([
          { type: 'cover', title: 'O Princípio da Anterioridade Penal' },
          { type: 'content', title: 'O que é?', content: 'Não há crime sem lei anterior que o defina, nem pena sem prévia cominação legal. (Art. 1º do CP)' },
          { type: 'content', title: 'Segurança Jurídica', content: 'Garante que ninguém será surpreendido com uma punição por um ato que, na época, não era considerado crime.' },
          { type: 'content', title: 'Atenção às Medidas', content: 'Este princípio se aplica rigorosamente a infrações penais. Leis penais mais graves nunca retroagem.' },
          { type: 'content', title: 'Salvo para beneficiar', content: 'A única exceção de retroatividade ocorre quando a nova lei beneficia o réu (Lex mitior).' },
        ]);
      } else {
        setSlides([
          { 
            type: 'flashcard', 
            title: 'Erro de tipo', 
            content: 'Falsa percepção da realidade sobre um elemento do crime. Sempre exclui o dolo; sendo evitável, ainda pode sobrar a punição por culpa, quando essa forma existir.',
            practice: 'No fim da caçada, o homem sai levando a espingarda que julgava sua — idêntica à do vizinho. Ele não sabia que estava levando coisa alheia.'
          }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (slides.length === 0) return;
    setExporting(true);
    toast.info('Iniciando exportação das imagens...');
    
    try {
      for (let i = 0; i < slides.length; i++) {
        const node = slideRefs.current[i];
        if (!node) continue;
        
        // Passando scale(1) para forçar o html-to-image a renderizar o tamanho original (1080x1080)
        // ignorando o scale(0.3) da UI.
        const dataUrl = await toPng(node, { 
          quality: 1, 
          pixelRatio: 1, 
          width: 1080, 
          height: 1080,
          style: { transform: 'scale(1)', transformOrigin: 'top left' }
        });
        
        const link = document.createElement('a');
        link.download = `slide_${i + 1}_${prompt.replace(/\W+/g, '_').substring(0, 20)}.png`;
        link.href = dataUrl;
        link.click();
        
        // Pequena pausa para garantir que o browser processe o download
        await new Promise(r => setTimeout(r, 400));
      }
      toast.success('Imagens exportadas com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao exportar as imagens.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Geração de Posts para Instagram" onBack={() => navigate('/admin-funcoes')} />
      
      <div className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-8">
        <div className="bg-secondary/20 border border-border/50 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full space-y-4">
            <div>
              <Label className="text-white text-base">Tema</Label>
              <Input 
                value={prompt} 
                onChange={e => setPrompt(e.target.value)} 
                placeholder="Ex: Erro de Tipo (Flashcard) ou Princípios (Carrossel)" 
                className="mt-2 h-12 text-lg bg-black/40 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-white text-base">Tipo de Post</Label>
                <div className="flex bg-black/40 border border-white/10 rounded-lg overflow-hidden mt-2 p-1">
                  <button 
                    onClick={() => setMode('carrossel')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'carrossel' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    Carrossel
                  </button>
                  <button 
                    onClick={() => setMode('flashcard')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'flashcard' ? 'bg-indigo-600 text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    Flashcard
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <Label className="text-white text-base">Assinatura no Rodapé (Opcional)</Label>
                <Input 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  placeholder="@seuperfil" 
                  className="mt-2 h-12 text-lg bg-black/40 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3 w-full md:w-[220px]">
            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl text-md"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
              Gerar com IA
            </Button>
            {slides.length > 0 && (
              <Button 
                onClick={handleExport}
                disabled={exporting}
                variant="outline"
                className="w-full h-12 rounded-xl text-md bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                {exporting ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2" />}
                Exportar PNGs
              </Button>
            )}
          </div>
        </div>

        {slides.length > 0 && (
          <div className="bg-secondary/10 border border-border/30 rounded-3xl p-6 overflow-hidden shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Pré-visualização (1080x1080)</h2>
            <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x snap-mandatory px-2">
              {slides.map((slide, idx) => (
                <div key={idx} className="shrink-0 snap-center flex flex-col items-center">
                  <div className="mb-3 text-sm font-bold text-white/50 flex justify-between w-full px-1 uppercase tracking-wider">
                    <span>Slide {idx + 1}</span>
                    <span className="text-indigo-400">{slide.type === 'cover' ? 'Capa' : slide.type === 'flashcard' ? 'Flashcard' : 'Conteúdo'}</span>
                  </div>
                  
                  {/* Container virtual para preview. Ele exibe em ~324px mas a imagem tem 1080px. */}
                  <div className="w-[324px] h-[324px] bg-black relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <div 
                      ref={el => slideRefs.current[idx] = el}
                      className="origin-top-left absolute left-0 top-0"
                      style={{ 
                        transform: 'scale(0.3)',
                        width: '1080px', 
                        height: '1080px' 
                      }}
                    >
                      {slide.type === 'flashcard' ? (
                        <InstagramFlashcardSlide
                          title={slide.title}
                          concept={slide.content || ''}
                          practice={slide.practice || ''}
                          username={username}
                        />
                      ) : (
                        <InstagramSlide 
                          type={slide.type as any} 
                          title={slide.title} 
                          content={slide.content} 
                          image={slide.type === 'cover' ? coverImage : undefined}
                          username={username}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
