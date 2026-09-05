import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Eye, Image as ImageIcon, Info, Trash2, Bell, BookOpen, AlertTriangle, CheckCircle2, CircleDashed, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/navigation/PageHeader';
import horusBellAsset from '@/assets/horus/horus-bell.webp';
import { useAuth } from '@/hooks/useAuth';

type TemplateScenario = {
  id: string;
  category: 'avisos' | 'introdutorio';
  tag: string;
  name: string;
  guide_poses: string[];
  guide_texts: string[];
  guide_trigger: string;
};

const SCENARIOS: TemplateScenario[] = [
  // Introdutório
  {
    id: 'intro_tematica',
    category: 'introdutorio',
    tag: 'Temática Jurídica',
    name: 'Primeiro Acesso - Temática',
    guide_poses: [
      'Mascote coruja 3D estilo Pixar, usando terno preto elegante, gravata vermelha e óculos de leitura na ponta do bico. Segurando uma pequena prancheta de madeira. Expressão sábia e acolhedora. Fundo escuro neutro, iluminação de estúdio cinematográfica, renderização 3D de alta qualidade, 8k, octane render.',
      'Mascote coruja 3D estilo Pixar, usando terno preto elegante e gravata vermelha. Apontando uma das asas para a direita, como se estivesse mostrando os botões de áreas do direito na tela. Expressão prestativa e amigável. Fundo escuro neutro, iluminação de estúdio cinematográfica, renderização 3D, 8k, octane render.',
      'Mascote coruja 3D estilo Pixar, usando terno preto elegante e gravata vermelha. Piscando um olho com expressão super animada e confiante, segurando um marcador de texto amarelo neon. Fundo escuro neutro, iluminação volumétrica, renderização 3D, 8k, octane render.'
    ],
    guide_texts: [
      'Ei [Nome]! Que bom que você chegou na Temática Jurídica.',
      'Aqui você encontra todo o material separadinho por áreas do direito.',
      'Basta escolher um assunto e mergulhar nos estudos. Se precisar de algo, estarei por aqui!'
    ],
    guide_trigger: 'Quando a pessoa acessa a aba de Temática Jurídica pela primeira vez.'
  },
  // Avisos
  {
    id: 'notifications',
    category: 'avisos',
    tag: 'Push Notifications',
    name: 'Ativar Notificações',
    guide_poses: ['Mascote coruja 3D estilo Pixar, usando terno preto elegante. Apontando para um sino de notificação dourado brilhante ao lado dela, ou com a mão no ouvido prestando atenção. Expressão alerta e simpática. Iluminação dramática, renderização 3D, 8k, octane render.'],
    guide_texts: ['Ei [Nome]! Ativa as notificações aí pra eu te avisar rapidão quando sair lei nova ou tiver novidade importante. Bora?'],
    guide_trigger: 'Quando o app pede permissão de push notifications.'
  },
  {
    id: 'study_reminder',
    category: 'avisos',
    tag: 'Cronograma',
    name: 'Lembrete de Estudo',
    guide_poses: ['Mascote coruja 3D estilo Pixar, usando terno preto. Segurando um relógio de bolso clássico aberto, olhando para ele com cara de apressada e super focada. Iluminação de estúdio, render 3D hiper-realista, 8k.'],
    guide_texts: ['Epa! Hora do foco. Seus 30 minutinhos diários de estudo estão te chamando. Bora revisar?'],
    guide_trigger: 'Quando dispara o alarme do cronograma diário do usuário.'
  },
  {
    id: 'streak',
    category: 'avisos',
    tag: 'Gamificação',
    name: 'Ofensiva de Dias (Streak)',
    guide_poses: ['Mascote coruja 3D estilo Pixar. Vestindo uma faixa preta de karatê por cima do terno e erguendo uma medalhinha de ouro ou troféu comemorando intensamente. Fundo escuro, luzes de vitória (douradas), render 3D de alta qualidade, 8k.'],
    guide_texts: ['Mandou muito! Você acabou de atingir 7 dias seguidos de ofensiva. O cérebro tá voando!'],
    guide_trigger: 'Quando o usuário cumpre metas ou entra no app por vários dias consecutivos.'
  },
  {
    id: 'proactive',
    category: 'avisos',
    tag: 'Radar 360',
    name: 'Sugestão Inteligente (Proativo)',
    guide_poses: ['Mascote coruja 3D estilo Pixar. Vestido de detetive clássico (chapéu e sobretudo por cima do terno), segurando uma lupa apontada para frente de forma curiosa. Iluminação misteriosa e acolhedora, renderização 3D, 8k.'],
    guide_texts: ['Dei uma espiada nos seus estudos e vi que você focou em Tributário hoje. Achei uma lei fresquinha sobre o assunto. Quer dar uma lida?'],
    guide_trigger: 'Quando a IA analisar as tags lidas pelo usuário e encontrar uma intersecção com o Radar 360.'
  },
  {
    id: 'new_material',
    category: 'avisos',
    tag: 'Biblioteca',
    name: 'Novo Material Disponível',
    guide_poses: ['Mascote coruja 3D estilo Pixar. Usando óculos de leitura na ponta do bico, abraçando uma pilha enorme de livros grossos de direito ou segurando um livro aberto que emana uma luz mágica brilhante. Render 3D, 8k, octane render.'],
    guide_texts: ['Acabamos de colocar conteúdo novo na prateleira. Tem um Vade Mecum quentinho te esperando na biblioteca!'],
    guide_trigger: 'Quando houver atualização de curadoria na "Temática Jurídica".'
  },
  {
    id: 'offline',
    category: 'avisos',
    tag: 'Sistema',
    name: 'Erro de Conexão (Offline)',
    guide_poses: ['Mascote coruja 3D estilo Pixar. Com cara de confuso e levemente assustado, segurando um cabo de rede partido soltando pequenas faíscas azuis, ou lendo um mapa de papel de cabeça para baixo. Iluminação azulada, render 3D, 8k.'],
    guide_texts: ['Ops, a internet caiu por aqui. Mas relaxa, você ainda pode ler os resumos que já estavam salvos no seu aparelho!'],
    guide_trigger: 'Quando o app perder a conexão e a pessoa tentar usar um recurso dependente da rede.'
  }
];

function useTypewriter(text: string, enabled: boolean, speed = 28, startDelay = 650) {
  const [out, setOut] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!enabled) { 
      setOut(''); 
      setIsComplete(false);
      return; 
    }
    
    setOut('');
    setIsComplete(false);
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    
    const audio = new Audio('/sounds/teclado.mp3');
    audio.loop = true;
    audio.volume = 0.35;
    
    const start = setTimeout(() => {
      audio.play().catch(() => {});
      
      const tick = () => {
        i++;
        setOut(text.slice(0, i));
        if (i < text.length) {
          timer = setTimeout(tick, speed);
        } else {
          audio.pause();
          setIsComplete(true);
        }
      };
      tick();
    }, startDelay);
    
    return () => { 
      clearTimeout(start); 
      clearTimeout(timer!); 
      audio.pause();
    };
  }, [text, enabled, speed, startDelay]);
  
  return { out, isComplete };
}

export default function AdminHorusTemplate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [view, setView] = useState<'categories' | 'list' | 'edit'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<'avisos' | 'introdutorio' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [images, setImages] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [landed, setLanded] = useState(false);
  const [bubbleIndex, setBubbleIndex] = useState(0);
  const [selectedBalloonTab, setSelectedBalloonTab] = useState(0);
  const [expandedPrompt, setExpandedPrompt] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('horus_templates_images');
      if (saved) setImages(JSON.parse(saved));
    } catch {}
  }, []);

  const currentScenario = selectedId ? SCENARIOS.find(s => s.id === selectedId) : null;
  
  // No modo "edição", usamos o bubbleIndex para exibir a imagem respectiva na preview
  // Se ele não subiu a imagem para aquele bubble, faz fallback para a imagem [0], ou o default.
  const getImageKey = (id: string, index: number) => `${id}_${index}`;
  const getPreviewImage = (id: string, index: number) => {
    if (images[getImageKey(id, index)]) return images[getImageKey(id, index)];
    if (images[getImageKey(id, 0)]) return images[getImageKey(id, 0)]; // Fallback para a primeira imagem do mesmo cenário
    return horusBellAsset; // Fallback global para todos os cenários caso não haja imagem
  };
  
  const currentPreviewImage = currentScenario ? getPreviewImage(currentScenario.id, bubbleIndex) : undefined;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!selectedId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const key = getImageKey(selectedId, index);
        const newImages = { ...images, [key]: ev.target.result as string };
        setImages(newImages);
        try { localStorage.setItem('horus_templates_images', JSON.stringify(newImages)); } catch {}
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteImage = (index: number) => {
    if (!selectedId) return;
    const key = getImageKey(selectedId, index);
    const newImages = { ...images };
    delete newImages[key];
    setImages(newImages);
    try { localStorage.setItem('horus_templates_images', JSON.stringify(newImages)); } catch {}
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || '';
  const rawText = currentScenario?.guide_texts[bubbleIndex] || '';
  const personalizedGuideText = rawText.replace('[Nome]!', firstName ? `${firstName}!` : '!');

  const typed = useTypewriter(personalizedGuideText, previewOpen && landed);

  // Reset states when closing preview or changing scenario
  useEffect(() => {
    if (!previewOpen) {
      setLanded(false);
      setBubbleIndex(0);
    }
  }, [previewOpen]);

  useEffect(() => {
    setSelectedBalloonTab(0);
    setExpandedPrompt(false);
  }, [selectedId]);

  const handleBack = () => {
    if (view === 'edit') {
      setView('list');
      setSelectedId(null);
    } else if (view === 'list') {
      setView('categories');
      setSelectedCategory(null);
    } else {
      navigate('/admin-funcoes');
    }
  };

  const renderCategories = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto px-4 mt-8">
      <button
        onClick={() => {
          setSelectedCategory('introdutorio');
          setView('list');
        }}
        className="group relative overflow-hidden rounded-3xl bg-card border-2 border-border p-8 hover:border-primary transition-all text-left flex flex-col items-center justify-center text-center gap-4 shadow-sm hover:shadow-xl"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-bold mb-2">Introdutório</h3>
          <p className="text-muted-foreground text-sm">
            Telas de primeiro acesso para apresentar funcionalidades do app.
          </p>
        </div>
      </button>

      <button
        onClick={() => {
          setSelectedCategory('avisos');
          setView('list');
        }}
        className="group relative overflow-hidden rounded-3xl bg-card border-2 border-border p-8 hover:border-primary transition-all text-left flex flex-col items-center justify-center text-center gap-4 shadow-sm hover:shadow-xl"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <AlertTriangle className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-bold mb-2">Avisos</h3>
          <p className="text-muted-foreground text-sm">
            Notificações pontuais, lembretes de estudo, conquistas e alertas.
          </p>
        </div>
      </button>
    </div>
  );

  const renderList = () => {
    const list = SCENARIOS.filter(s => s.category === selectedCategory);
    
    return (
      <div className="max-w-3xl mx-auto px-4 mt-8 space-y-4">
        <h2 className="text-2xl font-display font-bold mb-6">
          {selectedCategory === 'introdutorio' ? 'Cenários Introdutórios' : 'Cenários de Avisos'}
        </h2>
        
        {list.map(s => {
          // Checa se tem alguma imagem personalizada para não marcar como pendente
          const hasImage = !!images[getImageKey(s.id, 0)];
          return (
            <button
              key={s.id}
              onClick={() => {
                setSelectedId(s.id);
                setView('edit');
              }}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-card border border-border hover:border-primary transition-colors text-left group"
            >
              <div className="flex flex-col gap-1">
                <span className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{s.name}</span>
                <span className="text-sm text-muted-foreground line-clamp-1">{s.guide_trigger}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {hasImage ? (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                    OK
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full">
                    <CircleDashed className="w-4 h-4" />
                    Pendente
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderEdit = () => {
    if (!currentScenario) return null;
    return (
      <div className="max-w-3xl mx-auto px-4 mt-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex flex-col gap-2 mb-6">
            <span className="self-start text-[10px] uppercase tracking-widest font-black bg-primary/10 text-primary px-2.5 py-1 rounded-md">
              {currentScenario.tag}
            </span>
            <h2 className="text-xl font-bold">{currentScenario.name}</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Quando aparece</h4>
              <p className="text-sm">{currentScenario.guide_trigger}</p>
            </div>
            
            <div className="border-t border-border pt-6">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                Balões de Fala e Poses (Prompts)
              </h4>
              
              {currentScenario.guide_texts.length > 1 && (
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                  {currentScenario.guide_texts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedBalloonTab(idx)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                        selectedBalloonTab === idx 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      Balão {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-8">
                {(() => {
                  const idx = selectedBalloonTab;
                  const txt = currentScenario.guide_texts[idx];
                  if (!txt) return null;
                  const replaced = txt.replace('[Nome]!', firstName ? `${firstName}!` : '!');
                  const pose = currentScenario.guide_poses[idx] || currentScenario.guide_poses[0];
                  const imgKey = getImageKey(currentScenario.id, idx);
                  const uploadedImg = images[imgKey]; // Fallback happens in preview, here we just show what's uploaded or nothing
                  
                  return (
                    <div key={idx} className="bg-secondary/50 rounded-2xl p-5 border border-border/50">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">
                          {idx + 1}
                        </span>
                        <p className="text-sm italic font-medium text-foreground flex-1">"{replaced}"</p>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-5">
                        <div className="flex items-start gap-3 mb-2">
                          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-bold text-blue-700 dark:text-blue-400 text-sm mb-1">Como deve ser a cena (Prompt)</h4>
                            <p className={`text-sm text-blue-900/80 dark:text-blue-300 transition-all ${expandedPrompt ? '' : 'line-clamp-3'}`}>
                              {pose}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pl-8 mt-3">
                          <button
                            onClick={() => setExpandedPrompt(!expandedPrompt)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {expandedPrompt ? 'Ver menos' : 'Ver mais'}
                          </button>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(pose);
                              alert('Prompt copiado para a área de transferência!');
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-1 rounded-md hover:bg-blue-500/20 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copiar prompt
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer group">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx)} />
                          <div className="h-28 border-2 border-dashed border-border group-hover:border-primary/50 group-hover:bg-primary/5 transition-colors rounded-xl flex flex-col items-center justify-center gap-2">
                            <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
                              {uploadedImg ? 'Trocar imagem' : 'Subir imagem'}
                            </span>
                          </div>
                        </label>
                        
                        {uploadedImg ? (
                          <div className="relative w-28 h-28 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-border group/img shrink-0">
                            <img src={uploadedImg} alt={`Preview ${idx + 1}`} className="w-full h-full object-contain" />
                            {images[imgKey] && (
                              <button
                                onClick={() => deleteImage(idx)}
                                className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-28 h-28 rounded-xl bg-secondary flex items-center justify-center border border-border shrink-0">
                            <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Sticky footer for preview button */}
        <div className="sticky bottom-6 mt-6 pb-6">
          <button
            onClick={() => setPreviewOpen(true)}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-xl"
          >
            <Eye className="w-5 h-5" />
            Ver Prévia Completa do Banner
          </button>
          {!images[getImageKey(currentScenario.id, 0)] && (
            <p className="text-center text-xs text-muted-foreground mt-2 bg-background/80 backdrop-blur-sm p-1 rounded-md">
              Nenhuma imagem salva. O mascote padrão (coruja com sino) será exibido na prévia.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <PageHeader 
        title="Horus Templates" 
        subtitle={
          view === 'categories' ? 'Selecione uma categoria' : 
          view === 'list' ? 'Selecione um template' : 
          'Pré-visualização do modal'
        } 
        onBack={handleBack} 
      />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'categories' && renderCategories()}
          {view === 'list' && renderList()}
          {view === 'edit' && renderEdit()}
        </motion.div>
      </AnimatePresence>

      {/* Preview Overlay */}
      <AnimatePresence>
        {previewOpen && currentPreviewImage && currentScenario && (
          <motion.div
            key="preview-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-neutral-900/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewOpen(false)}
          >
            <div className="absolute top-6 right-6 text-white text-sm bg-black/50 px-4 py-2 rounded-full pointer-events-none">
              Toque em qualquer lugar para fechar
            </div>

            {/* Horus stomp shockwave */}
            <motion.div
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.2, 2.4, 3] }}
              transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
              className="pointer-events-none absolute w-56 h-56 rounded-full border-2 border-primary/60"
              style={{ top: '38%' }}
            />

            <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              {/* Horus mascote (Animated dynamically per bubble) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`horus-img-${bubbleIndex}`}
                  initial={landed ? { opacity: 0, scale: 0.9, x: 10 } : { y: -260, rotate: -8, scale: 0.9 }}
                  animate={landed ? { opacity: 1, scale: 1, x: 0 } : {
                    y: [ -260, 0, -14, 0 ],
                    rotate: [ -8, 2, -1, 0 ],
                    scale: [ 0.9, 1.08, 0.98, 1 ],
                  }}
                  exit={landed ? { opacity: 0, scale: 0.9, x: -10 } : {}}
                  transition={landed ? { duration: 0.2 } : { duration: 0.7, times: [0, 0.55, 0.8, 1], ease: ['easeIn','easeOut','easeOut','easeOut'] }}
                  onAnimationComplete={() => { if (!landed) setLanded(true); }}
                  className="absolute -top-28 -left-4 z-20 w-40 h-40 drop-shadow-[0_18px_20px_rgba(0,0,0,0.55)] pointer-events-none"
                >
                  <img src={currentPreviewImage} alt="Horus" className="w-full h-full object-contain" />
                </motion.div>
              </AnimatePresence>

              {/* Balão de fala */}
              <AnimatePresence mode="wait">
                {landed && (
                  <motion.div
                    key={`bubble-${bubbleIndex}`}
                    initial={{ opacity: 0, scale: 0.6, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    className="absolute -top-32 left-32 z-20 max-w-[240px] bg-white text-neutral-900 rounded-2xl px-4 py-3 shadow-xl border-2 border-neutral-900"
                    style={{ transformOrigin: 'bottom left' }}
                  >
                    <p className="text-[15px] font-semibold leading-snug">
                      {typed.out}
                      {!typed.isComplete && <span className="inline-block w-[2px] h-4 align-[-2px] ml-0.5 bg-neutral-900 animate-pulse" />}
                    </p>
                    
                    {/* Botões de Ação para Introdutório */}
                    {currentScenario.category === 'introdutorio' && typed.isComplete && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mt-3 flex items-center justify-end gap-3 border-t border-neutral-200 pt-2"
                      >
                        <button
                          onClick={() => setPreviewOpen(false)}
                          className="text-xs font-bold text-neutral-500 hover:text-neutral-700 py-1 px-1 transition-colors"
                        >
                          Pular
                        </button>
                        {bubbleIndex < currentScenario.guide_texts.length - 1 ? (
                          <button
                            onClick={() => setBubbleIndex(prev => prev + 1)}
                            className="bg-neutral-900 text-white rounded-lg text-xs font-bold py-1.5 px-3 hover:bg-neutral-800 transition-colors"
                          >
                            Próximo
                          </button>
                        ) : (
                          <button
                            onClick={() => setPreviewOpen(false)}
                            className="bg-neutral-900 text-white rounded-lg text-xs font-bold py-1.5 px-3 hover:bg-neutral-800 transition-colors"
                          >
                            Entendi!
                          </button>
                        )}
                      </motion.div>
                    )}

                    <span
                      className="absolute -bottom-2 left-6 w-0 h-0 pointer-events-none"
                      style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '12px solid #171717' }}
                    />
                    <span
                      className="absolute -bottom-[6px] left-[21px] w-0 h-0 pointer-events-none"
                      style={{ borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '9px solid #ffffff' }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Card Base */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative z-10 w-full mt-24 bg-card border-2 border-border rounded-3xl p-6 shadow-2xl pointer-events-none"
              >
                {selectedId === 'notifications' ? (
                  <>
                    <h3 className="font-display text-xl font-bold text-foreground mb-3">Ativar notificações</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground font-body mb-6">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Novas leis e alterações nas legislações que você acompanha.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Novidades do aplicativo e novas aulas liberadas.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Lembretes e acompanhamento do seu plano de estudos.</span>
                      </li>
                    </ul>
                    
                    <div className="flex flex-col gap-3 pointer-events-auto">
                      <button className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-body font-bold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                        <Bell className="w-5 h-5" />
                        Ativar agora
                      </button>
                      <button className="w-full py-3.5 rounded-xl bg-secondary text-foreground font-body font-medium text-sm hover:bg-secondary/70 transition-colors">
                        Deixar para depois
                      </button>
                    </div>
                  </>
                ) : selectedId === 'intro_tematica' ? (
                  <>
                    <h3 className="font-display text-xl font-bold text-foreground mb-3 uppercase tracking-wide">Temática Jurídica</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground font-body mb-6">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Acesse leis organizadas por áreas e disciplinas específicas.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Consulte Vade Mecuns completos e sempre atualizados.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span>Leia resumos e anotações gerados pela Inteligência Artificial.</span>
                      </li>
                    </ul>
                    <div className="flex flex-col gap-3 pointer-events-auto">
                      <button className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-body font-bold text-base hover:opacity-90 transition-opacity">
                        Começar a explorar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-display text-xl font-bold text-foreground mb-3">{currentScenario.name}</h3>
                    <p className="font-body text-base text-muted-foreground leading-relaxed mb-6">
                      Este é o espaço onde o conteúdo do banner real será renderizado (ex: pedir permissão, mostrar resumo, etc).
                    </p>
                    <div className="w-full h-12 rounded-xl bg-secondary animate-pulse" />
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
