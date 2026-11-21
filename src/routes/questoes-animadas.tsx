import { createFileRoute } from '@tanstack/react-router';
import QuestoesAnimadasPlayer from '@/pages/laboratorio/QuestoesAnimadasPlayer';

export const Route = createFileRoute('/questoes-animadas')({
  component: () => <QuestoesAnimadasPlayer onVoltar={() => window.history.back()} />,
});
