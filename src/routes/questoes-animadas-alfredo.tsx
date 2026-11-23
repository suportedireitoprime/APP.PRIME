import { createFileRoute } from '@tanstack/react-router';
import QuestoesAnimadasAlfredoPlayer from '@/pages/laboratorio/QuestoesAnimadasAlfredoPlayer';

export const Route = createFileRoute('/questoes-animadas-alfredo')({
  component: () => <QuestoesAnimadasAlfredoPlayer onVoltar={() => window.history.back()} />,
});
