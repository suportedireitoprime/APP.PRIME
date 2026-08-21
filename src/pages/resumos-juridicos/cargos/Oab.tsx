import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { Construction } from 'lucide-react';
import ResumosBottomNav from '@/components/resumos/ResumosBottomNav';

export default function Oab() {
  const navigate = useNavigate();
  return (
    <div className="min-h-dvh bg-background pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
      <PageHeader title="OAB" onBack={() => navigate(-1)} />
      <div className="flex flex-col items-center justify-center pt-32 px-6 text-center">
        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
          <Construction className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Página em Construção</h2>
        <p className="text-muted-foreground text-sm">O acervo específico para OAB está sendo preparado pela nossa equipe editorial.</p>
      </div>
      <ResumosBottomNav />
    </div>
  );
}
