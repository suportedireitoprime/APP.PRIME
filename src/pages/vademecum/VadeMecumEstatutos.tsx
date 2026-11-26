import { Shield, BookMarked } from 'lucide-react';
import { VadeMecumCategoriaLista } from '@/components/vademecum/outros/VadeMecumCategoriaLista';

const GRUPOS = [{ id: 'estatuto' }];

const VadeMecumEstatutos = () => (
  <VadeMecumCategoriaLista
    titulo="Estatutos"
    descricao="ECA, OAB, Idoso, Deficiência e legislação temático-estatutária"
    placeholder="Buscar estatuto (ex: ECA, OAB, Idoso)…"
    grupos={GRUPOS}
    emptyText="Nenhum estatuto encontrado para a busca."
    headerColorClass="bg-hero-panel"
    layout="grid"
    fallbackIcon={<BookMarked className="w-5 h-5" />}
    emptyIcon={<Shield className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />}
  />
);

export default VadeMecumEstatutos;
