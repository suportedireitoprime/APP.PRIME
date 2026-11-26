import { VadeMecumCategoriaLista } from '@/components/vademecum/outros/VadeMecumCategoriaLista';

const GRUPOS = [
  { id: 'constituicao', label: 'Constituição Federal' },
  { id: 'codigo', label: 'Códigos' },
];

const VadeMecumCodigos = () => (
  <VadeMecumCategoriaLista
    titulo="Códigos"
    descricao="Constituição Federal e Códigos do Brasil na íntegra"
    placeholder="Buscar código ou constituição…"
    grupos={GRUPOS}
    emptyText="Nenhum resultado."
    layout="list"
  />
);

export default VadeMecumCodigos;
