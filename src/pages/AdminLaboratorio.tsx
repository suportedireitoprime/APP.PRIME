import React from 'react';
import { PageHeader } from '@/components/vademecum/PageHeader';
import { useNavigate } from 'react-router-dom';
import AnimacaoExemplo from '@/components/laboratorio/AnimacaoExemplo';

const AdminLaboratorio = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-background pb-8">
      <PageHeader title="Laboratório" onBack={() => navigate('/')} />
      
      <div className="p-4 space-y-6">
        <div className="bg-secondary/30 border border-border/50 rounded-xl p-4">
          <h2 className="text-lg font-display font-semibold mb-2">Art. 157 - Roubo (POC)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Exemplo de animação CSS Sprite (levíssima) com explicação sincronizada.
          </p>
          
          <div className="bg-background rounded-lg border border-border/50 p-4">
            <AnimacaoExemplo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLaboratorio;
