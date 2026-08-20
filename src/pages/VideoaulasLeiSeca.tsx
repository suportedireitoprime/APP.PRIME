import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Book, Scale, Users, HeartHandshake, Briefcase, Calculator, Vote, Car, TreePine, Radio, ShieldAlert } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export const LEI_SECA_CATEGORIAS = [
  { id: 'constitucional', label: 'Constitucional', icon: Book, color: 'text-amber-500', bg: 'bg-amber-500/10', leis: ['cf88'] },
  { id: 'penal', label: 'Penal', icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-500/10', leis: ['cp', 'cpp', 'cpm', 'cppm', 'lep', 'lmp', 'ld', 'loc', 'laa', 'lit'] },
  { id: 'civil', label: 'Civil', icon: Scale, color: 'text-blue-500', bg: 'bg-blue-500/10', leis: ['cc', 'cpc', 'ccom'] },
  { id: 'trabalhista', label: 'Trabalhista', icon: Briefcase, color: 'text-violet-500', bg: 'bg-violet-500/10', leis: ['clt'] },
  { id: 'tributario', label: 'Tributário', icon: Calculator, color: 'text-emerald-500', bg: 'bg-emerald-500/10', leis: ['ctn'] },
  { id: 'consumidor', label: 'Consumidor', icon: HeartHandshake, color: 'text-orange-500', bg: 'bg-orange-500/10', leis: ['cdc'] },
  { id: 'eleitoral', label: 'Eleitoral', icon: Vote, color: 'text-indigo-500', bg: 'bg-indigo-500/10', leis: ['ce'] },
  { id: 'transito', label: 'Trânsito e Transportes', icon: Car, color: 'text-sky-500', bg: 'bg-sky-500/10', leis: ['ctb', 'cba'] },
  { id: 'ambiental', label: 'Ambiental e Recursos', icon: TreePine, color: 'text-green-600', bg: 'bg-green-600/10', leis: ['cflor', 'cagua', 'cmin'] },
  { id: 'estatutos', label: 'Estatutos Sociais', icon: Users, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', leis: ['eca', 'ei', 'epd'] },
  { id: 'comunicacao', label: 'Comunicações', icon: Radio, color: 'text-purple-500', bg: 'bg-purple-500/10', leis: ['ctel'] },
];

const VideoaulasLeiSeca = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader
        title="Lei Seca em Vídeo"
        description="Escolha a área do direito para buscar aulas em vídeo"
        onBack={() => navigate('/videoaulas')}
        theme="red"
      />
      <div className="px-5 mt-8">
        <div className="grid grid-cols-2 gap-4">
          {LEI_SECA_CATEGORIAS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                haptic.selection();
                navigate(`/videoaulas/lei-seca/categoria/${cat.id}`);
              }}
              className="flex flex-col items-center justify-center p-6 rounded-3xl bg-card border border-border/80 hover:border-primary/50 transition-all active:scale-95 gap-3 text-center shadow-sm"
            >
              <div className="w-14 h-14 flex items-center justify-center">
                <cat.icon className="w-8 h-8 text-zinc-400" strokeWidth={1.25} />
              </div>
              <p className="font-display font-bold text-sm text-foreground leading-tight">
                {cat.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoaulasLeiSeca;
