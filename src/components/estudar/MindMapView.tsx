import MapasMentaisView from '@/components/mapas-mentais/MapasMentaisView';

interface MindMapViewProps {
  tabelaNome?: string;
  artigoNumero?: string;
  leiNome?: string;
  onBack?: () => void;
}

const MindMapView = ({ onBack }: MindMapViewProps) => {
  return <MapasMentaisView onClose={onBack ?? (() => window.history.back())} />;
};

export default MindMapView;
