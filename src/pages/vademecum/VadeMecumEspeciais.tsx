import { PocketKnife } from 'lucide-react';
import { VadeMecumCategoriaLista } from '@/components/vademecum/outros/VadeMecumCategoriaLista';

const GRUPOS = [{ id: 'lei-especial' }];

const VadeMecumEspeciais = () => (
  <VadeMecumCategoriaLista
    titulo="Legislação Especial"
    descricao="Leis penais especiais, extravagantes e normas regulatórias federais"
    placeholder="Buscar lei especial (ex: Maria da Penha, Drogas, LEP)…"
    grupos={GRUPOS}
    emptyText="Nenhuma lei especial encontrada para a busca."
    layout="grid"
    badgeClassName="bg-orange-500/10 border-orange-500/20 text-orange-400"
    fallbackIcon={<PocketKnife className="w-5 h-5" />}
    emptyIcon={<PocketKnife className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />}
  />
);

export default VadeMecumEspeciais;
