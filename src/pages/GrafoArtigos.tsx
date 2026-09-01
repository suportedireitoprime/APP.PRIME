import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { useGoBack } from '@/hooks/useGoBack';
import dagre from 'dagre';
import { toast } from 'sonner';
import { 
  ShieldAlert, BookOpen, Key, Zap, ListChecks, CheckCircle2, AlertTriangle, Layers,
  Briefcase, FileText, Gavel, Users, User, Banknote, MapPin, Search, Crosshair, 
  ArrowRightCircle, Target, ShieldCheck, Flame, Scale3d, Hand, Eye, Clock, Calendar, 
  Lock, Globe, Car, Building, Home, Plane, Activity, Flag, Scale
} from 'lucide-react';

const availableIcons: Record<string, any> = {
  Scale, ShieldAlert, BookOpen, Key, Zap, ListChecks, CheckCircle2, AlertTriangle, Layers,
  Briefcase, FileText, Gavel, Users, User, Banknote, MapPin, Search, Crosshair, 
  ArrowRightCircle, Target, ShieldCheck, Flame, Scale3d, Hand, Eye, Clock, Calendar, 
  Lock, Globe, Car, Building, Home, Plane, Activity, Flag
};

const iconMap: Record<string, any> = {
  central: BookOpen,
  excecao: AlertTriangle,
  consequencia: Zap,
  requisito: ListChecks,
  conceito: Key,
  procedimento: Layers,
  default: CheckCircle2
};

function CustomNode({ data }: any) {
  // Use dynamically provided icon from LLM, or fallback to type mapping, or default
  const Icon = data.iconName ? (availableIcons[data.iconName] || iconMap.default) : (iconMap[data.type] || iconMap.default);
  
  const isCentral = data.type === 'central';
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={`relative px-5 py-3.5 rounded-2xl border flex items-center gap-3 backdrop-blur-xl shadow-xl transition-all duration-300 ${isCentral ? 'ring-4 ring-primary/20' : 'hover:scale-105'}`}
      style={{
        backgroundColor: isCentral ? data.bgColor : 'hsl(var(--card))',
        borderColor: isCentral ? data.borderColor : 'hsl(var(--border) / 0.5)',
        color: isCentral ? data.textColor : 'hsl(var(--foreground))',
        backgroundImage: isCentral 
          ? `linear-gradient(135deg, ${data.bgColor}, ${data.borderColor})`
          : `linear-gradient(135deg, hsl(var(--card)), hsl(var(--muted) / 0.3))`
      }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 border-none opacity-0" />
      <div 
        className="shrink-0 flex items-center justify-center" 
        style={{ 
          color: isCentral ? '#fff' : data.textColor
        }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div className={`font-bold text-sm leading-tight tracking-tight max-w-[150px] text-center ${isCentral ? 'text-white' : ''}`}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 border-none opacity-0" />
    </motion.div>
  );
}

const nodeTypes = { custom: CustomNode };

interface AIConnectionInfo {
  source: string;
  target: string;
  label: string;
  description: string;
}

function formatLeiNome(name?: string): string {
  if (!name) return '';
  const n = name.toUpperCase();
  if (n.includes('CC_CODIGO_CIVIL') || n === 'LEIS_CC') return 'Código Civil';
  if (n.includes('CF_CONSTITUICAO') || n === 'LEIS_CF') return 'Constituição Federal';
  if (n.includes('CP_CODIGO_PENAL') || n === 'LEIS_CP') return 'Código Penal';
  if (n.includes('CPP_CODIGO_PROCESSO_PENAL') || n === 'LEIS_CPP') return 'Código de Processo Penal';
  if (n.includes('CLT') || n === 'LEIS_CLT') return 'CLT';
  if (n.includes('CDC') || n === 'LEIS_CDC') return 'Código de Defesa do Consumidor';
  if (n.includes('CPC') || n === 'LEIS_CPC') return 'Código de Processo Civil';
  if (n.includes('CTN') || n === 'LEIS_CTN') return 'Código Tributário Nacional';
  
  return name
    .replace(/^leis_/i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

export interface GrafoArtigosProps {
  tabelaNome?: string;
  leiNome?: string;
  artigoNumero?: string;
  artigoTexto?: string;
  onClose?: () => void;
  embedded?: boolean;
  preloadedGraphData?: any;
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction,
    ranksep: 100, // Space between layers
    nodesep: 40   // Space between nodes on the same layer
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 60 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' as any : 'top' as any;
    node.sourcePosition = isHorizontal ? 'right' as any : 'bottom' as any;
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - 180 / 2,
      y: nodeWithPosition.y - 60 / 2,
    };
  });

  return { nodes, edges };
};

const GrafoArtigos = (props: GrafoArtigosProps) => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const location = useLocation();
  const tabelaNome = props.tabelaNome ?? (location.state as any)?.tabelaNome;
  const leiNome = props.leiNome ?? (location.state as any)?.leiNome;
  const artigoNumero = props.artigoNumero ?? (location.state as any)?.artigoNumero;
  const artigoTexto = props.artigoTexto;
  const onClose = props.onClose;
  const embedded = props.embedded ?? false;
  const preloadedGraphData = props.preloadedGraphData;
  
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedEdgeInfo, setSelectedEdgeInfo] = useState<AIConnectionInfo | null>(null);

  useEffect(() => {
    if (preloadedGraphData) {
      setLoading(false);
      try {
        const rfNodes: Node[] = (preloadedGraphData.nodes || []).map((n: any) => {
          let bgColor = 'hsl(var(--card))';
          let textColor = 'hsl(var(--foreground))';
          let borderColor = 'hsl(var(--border))';

          if (n.type === 'central') {
            bgColor = 'hsl(var(--primary))';
            textColor = 'hsl(var(--primary-foreground))';
            borderColor = 'hsl(var(--primary))';
          } else if (n.type === 'excecao') {
            bgColor = '#FEE2E2'; // red-100
            textColor = '#991B1B'; // red-800
            borderColor = '#FCA5A5'; // red-300
          } else if (n.type === 'consequencia') {
            bgColor = '#E0E7FF'; // indigo-100
            textColor = '#3730A3'; // indigo-800
            borderColor = '#A5B4FC'; // indigo-300
          } else if (n.type === 'requisito') {
            bgColor = '#FEF3C7'; // amber-100
            textColor = '#92400E'; // amber-800
            borderColor = '#FCD34D'; // amber-300
          } else if (n.type === 'procedimento') {
            bgColor = '#F3E8FF'; // purple-100
            textColor = '#6B21A8'; // purple-800
            borderColor = '#D8B4FE'; // purple-300
          } else {
            bgColor = 'hsl(var(--secondary))';
          }

          return {
            id: n.id,
            type: 'custom',
            data: { 
              label: n.label,
              type: n.type,
              bgColor,
              textColor,
              borderColor
            },
            position: { x: 0, y: 0 }
          };
        });

        const rfEdges: Edge[] = (preloadedGraphData.edges || []).map((e: any, i: number) => ({
          id: `e${i}-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          label: e.label,
          labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 12 },
          labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: 0.95 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          animated: true,
          data: { description: e.description }
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rfNodes, rfEdges, 'TB');
        
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (err: any) {
        console.error("Erro ao montar grafo pré-carregado:", err);
        toast.error("Não foi possível montar as conexões deste artigo.");
      }
      return;
    }

    if (!tabelaNome || !artigoNumero || !artigoTexto) {
      setLoading(false);
      return;
    }

    const fetchGrafoIA = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('grafo-conexoes-gerar', {
          body: {
            item_key: `${tabelaNome}::${artigoNumero}`,
            artigo_texto: artigoTexto,
            titulo: `Art. ${artigoNumero}`,
          },
        });

        if (error) throw error;
        if (!data || !data.grafo) throw new Error("IA não retornou um grafo válido.");

        const { nodes: aiNodes, edges: aiEdges } = data.grafo;

        const rfNodes: Node[] = (aiNodes || []).map((n: any) => {
          let bgColor = 'hsl(var(--card))';
          let textColor = 'hsl(var(--foreground))';
          let borderColor = 'hsl(var(--border))';

          if (n.type === 'central') {
            bgColor = 'hsl(var(--primary))';
            textColor = 'hsl(var(--primary-foreground))';
            borderColor = 'hsl(var(--primary) / 0.8)';
          } else if (n.type === 'excecao') {
            bgColor = '#FEE2E2'; 
            textColor = '#ef4444'; // red-500
            borderColor = '#FCA5A5'; 
          } else if (n.type === 'consequencia') {
            bgColor = '#E0E7FF'; 
            textColor = '#6366f1'; // indigo-500
            borderColor = '#A5B4FC'; 
          } else if (n.type === 'requisito') {
            bgColor = '#FEF3C7'; 
            textColor = '#f59e0b'; // amber-500
            borderColor = '#FCD34D'; 
          } else if (n.type === 'procedimento') {
            bgColor = '#F3E8FF'; 
            textColor = '#a855f7'; // purple-500
            borderColor = '#D8B4FE'; 
          } else {
            bgColor = 'hsl(var(--secondary))';
            textColor = 'hsl(var(--muted-foreground))';
          }

          return {
            id: n.id,
            type: 'custom',
            data: { 
              label: n.label,
              type: n.type,
              iconName: n.icon,
              bgColor,
              textColor,
              borderColor
            },
            position: { x: 0, y: 0 }
          };
        });

        const rfEdges: Edge[] = (aiEdges || []).map((e: any, i: number) => ({
          id: `e${i}-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          label: e.label,
          labelStyle: { fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 10 },
          labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'hsl(var(--primary))' },
          style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          animated: true,
          data: { description: e.description }
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rfNodes, rfEdges, 'TB');
        
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (err: any) {
        console.error("Erro ao gerar grafo IA:", err);
        toast.error("Não foi possível gerar as conexões deste artigo com Inteligência Artificial.");
      } finally {
        setLoading(false);
      }
    };

    fetchGrafoIA();
  }, [tabelaNome, artigoNumero, artigoTexto, setNodes, setEdges, preloadedGraphData]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    
    // Find the human-readable labels from the nodes array
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    setSelectedEdgeInfo({
      source: String(sourceNode?.data?.label || edge.source),
      target: String(targetNode?.data?.label || edge.target),
      label: edge.label as string,
      description: edge.data?.description as string
    });
  }, [nodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    
    // Find the incoming edge to this node (usually best for trees)
    let edge = edges.find(e => e.target === node.id);
    // If no incoming edge (e.g. root node), try finding an outgoing one
    if (!edge) {
      edge = edges.find(e => e.source === node.id);
    }
    
    if (edge) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      setSelectedEdgeInfo({
        source: String(sourceNode?.data?.label || edge.source),
        target: String(targetNode?.data?.label || edge.target),
        label: edge.label as string,
        description: edge.data?.description as string
      });
    }
  }, [edges, nodes]);

  const onPaneClick = useCallback(() => {
    setSelectedEdgeInfo(null);
  }, []);

  return (
    <div className={`flex flex-col bg-background relative overflow-hidden ${embedded ? 'h-full' : 'min-h-screen pb-[6.5rem]'}`}>
      {!embedded && (
        <PageHeader 
          title="Grafo de Conexões" 
          subtitle={formatLeiNome(leiNome)} 
          onBack={goBack} 
        />
      )}
      {embedded && (
        <div className="flex items-center justify-between px-5 pt-[calc(var(--sai-top,env(safe-area-inset-top,0px))+1rem)] pb-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">Grafo de Conexões</h2>
            <p className="text-xs text-muted-foreground line-clamp-1">{formatLeiNome(leiNome)} — Art. {artigoNumero}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-foreground/80 animate-pulse">A IA está mapeando as conexões...</p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Não foi possível gerar o grafo ou os parâmetros estão incompletos.
            </p>
          </div>
        ) : (
          <>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgeClick={onEdgeClick}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              fitView
              fitViewOptions={{ padding: 0.1, maxZoom: 1.2 }}
              proOptions={{ hideAttribution: true }}
              minZoom={0.4}
              maxZoom={3}
              panOnDrag
              zoomOnPinch
              zoomOnScroll
              zoomOnDoubleClick
              preventScrolling
            >
              <Background gap={20} size={1} />
            </ReactFlow>

            {!selectedEdgeInfo && (
              <div className="absolute bottom-[calc(var(--sai-bottom,env(safe-area-inset-bottom,0px))+2rem)] left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md border border-border/50 rounded-full px-5 py-2 pointer-events-none shadow-lg text-center z-10">
                <p className="text-[13px] font-semibold text-primary">Toque nos nós ou setas para entender a relação</p>
              </div>
            )}
          </>
        )}

        {/* AI Connection Detail Bottom Sheet */}
        <AnimatePresence>
          {selectedEdgeInfo && (
            <motion.div
              key="edge-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-30"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEdgeInfo(null);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            />
          )}
          {selectedEdgeInfo && (
            <motion.div
              key="edge-panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 z-40 bg-card rounded-t-[1.5rem] border-t border-border/50 shadow-[0_-8px_30px_rgba(0,0,0,0.4)] p-6 pb-[calc(var(--sai-bottom,env(safe-area-inset-bottom,0px))+1.5rem)] pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-4 -mt-2" />
              <div className="flex items-start justify-between gap-3 mb-4">
                <h3 className="font-display font-bold text-lg text-primary">
                  Detalhe da Relação
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEdgeInfo(null);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center shrink-0 hover:bg-secondary active:scale-95 transition-all"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 border border-red-400/30 flex flex-col gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[13px] text-red-950 bg-white/95 px-3 py-1.5 rounded-lg shadow-sm">{selectedEdgeInfo.source}</span>
                  <ArrowRight className="w-4 h-4 text-white/90 shrink-0" />
                  <span className="font-bold text-[13px] text-red-950 bg-white/95 px-3 py-1.5 rounded-lg shadow-sm">{selectedEdgeInfo.target}</span>
                </div>
                
                <div className="mt-1">
                  <span className="text-[11px] uppercase font-extrabold text-red-100 tracking-widest opacity-90">Explicação ({selectedEdgeInfo.label})</span>
                  <p className="text-[15px] font-medium text-white mt-1.5 leading-relaxed">
                    {selectedEdgeInfo.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GrafoArtigos;
