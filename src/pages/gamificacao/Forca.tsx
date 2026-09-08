import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import { JogoForca } from '@/components/gamificacao/JogoForca';

const ForcaPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Jogo da Forca | Direito Prime";
  }, []);

  const handleBack = () => {
    navigate('/ferramentas');
  };

  return (
    <DesktopPageLayout>
      <div className="pt-8 pb-20">
        <JogoForca onBack={handleBack} />
      </div>
    </DesktopPageLayout>
  );
};

export default ForcaPage;
