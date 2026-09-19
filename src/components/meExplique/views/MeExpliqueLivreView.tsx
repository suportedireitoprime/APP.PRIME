import React from 'react';
import { MeExpliqueLiveChatView } from './MeExpliqueLiveChatView';

interface Props {
  onVoltar: () => void;
}

export const MeExpliqueLivreView: React.FC<Props> = ({ onVoltar }) => {
  return (
    <MeExpliqueLiveChatView
      modo="livre"
      contexto="Conversa Aberta & Dúvidas"
      subtitulo="Pergunte qualquer dúvida de Direito ao vivo para o professor"
      onVoltar={onVoltar}
    />
  );
};
