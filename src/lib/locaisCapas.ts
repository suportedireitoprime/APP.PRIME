// Gerenciador de capas e imagens de fallback de alta definição para Locais Jurídicos
// Garante que Faculdades, Tribunais, Cartórios, etc. NUNCA fiquem sem foto ou com blocos vazios.

import type { CategoriaLocal } from './locaisCategorias';

const CAPAS_CATEGORIA: Record<CategoriaLocal, string[]> = {
  universidades: [
    'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=800&auto=format&fit=crop&q=80', // Campus Universitário clássico
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80', // Universidade fachada
    'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80', // Faculdade de Direito / Biblioteca
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&auto=format&fit=crop&q=80', // Prédio acadêmico
    'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=800&auto=format&fit=crop&q=80', // Auditório universitário
  ],
  tribunais: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80', // Balança e martelo da justiça
    'https://images.unsplash.com/photo-1436450412740-6b988f486c6b?w=800&auto=format&fit=crop&q=80', // Colunas clássicas de Palácio da Justiça
    'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&auto=format&fit=crop&q=80', // Fórum / Tribunal
    'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&auto=format&fit=crop&q=80', // Livros jurídicos e tribuna
  ],
  cartorios: [
    'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80', // Assinatura de contrato e documentos
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80', // Papéis oficiais e carimbos
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&auto=format&fit=crop&q=80', // Escritório notarial
  ],
  delegacias: [
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80', // Segurança pública / Viaturas
    'https://images.unsplash.com/photo-1508847154043-be5407fcaa5a?w=800&auto=format&fit=crop&q=80', // Instalações policiais
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80', // Edifício corporativo/policial
  ],
  presidios: [
    'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&auto=format&fit=crop&q=80', // Arquitetura institucional
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format&fit=crop&q=80', // Instalação pública
  ],
  museus: [
    'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800&auto=format&fit=crop&q=80', // Museu de arte e história
    'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&auto=format&fit=crop&q=80', // Galeria histórica
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&auto=format&fit=crop&q=80', // Exposição cultural
  ],
  oab: [
    'https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?w=800&auto=format&fit=crop&q=80', // Sede da advocacia / biblioteca
    'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=800&auto=format&fit=crop&q=80', // Lupa e leis
  ],
  defensoria: [
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&auto=format&fit=crop&q=80', // Atendimento jurídico e apoio social
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80', // Defensoria pública
  ],
  ministerio_publico: [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80', // Sede de procuradorias
    'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80', // Promotoria e leis
  ],
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Retorna a foto do Google Places se fornecida, ou seleciona uma imagem temática
 * de alta definição determinística para garantir que NENHUM card fique sem imagem.
 */
export function obterCapaLocal(
  local: { id: string; categoria: string; nome?: string },
  photoUrlFromApi?: string | null,
): string {
  if (photoUrlFromApi && photoUrlFromApi.trim()) {
    return photoUrlFromApi.trim();
  }

  const cat = (local.categoria as CategoriaLocal) in CAPAS_CATEGORIA
    ? (local.categoria as CategoriaLocal)
    : 'universidades';
    
  const lista = CAPAS_CATEGORIA[cat] ?? CAPAS_CATEGORIA.universidades;
  const hash = hashString(local.id || local.nome || 'local');
  const index = hash % lista.length;
  
  return lista[index];
}
