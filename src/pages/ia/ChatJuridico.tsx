import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AssistenteOverlay from '@/components/vademecum/overlays/AssistenteOverlay';
import { useTrackArea } from '@/hooks/useTrackArea';

export default function ChatJuridico() {
  useTrackArea('chat_juridico_desktop');
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Chat | Direito Prime';
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sempre aberto */}
      <AssistenteOverlay open={true} onClose={() => navigate('/')} />
    </div>
  );
}
