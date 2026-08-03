/**
 * Resolução de rotas dos resultados da busca global.
 *
 * O RPC `buscar_conteudo` devolve rotas "cruas" para artigos de lei
 * (`/legislacao/artigo/<slugNoBanco>/<numero>`), porque o banco não conhece
 * o catálogo de leis do app. Aqui traduzimos essa rota para a rota real
 * (`/legislacao/<tipo>/<lei-slug>/<numero>`).
 *
 * Quando a lei do artigo não existe no catálogo do app, não há tela para abrir
 * — nesse caso devolvemos `null` e o resultado é omitido da lista.
 */

import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { leiPath, toSlug } from '@/lib/legislacaoSlugs';
import type { ConteudoResultado } from '@/hooks/useBuscaConteudo';

/** Slugs do banco que não batem com o id do catálogo. */
const ALIAS: Record<string, string> = {
  cf: 'cf88',
  cflorestal: 'cflor',
  cagua: 'cagua',
  'estatuto-eca': 'eca',
  'estatuto-idoso': 'ei',
  'estatuto-pessoa-deficiencia': 'epd',
  'estatuto-igualdade-racial': 'eir',
  'estatuto-cidade': 'ec',
  'estatuto-desarmamento': 'ed',
  'estatuto-oab': 'eoab',
  'estatuto-torcedor': 'et',
  'estatuto-juventude': 'ej',
  'estatuto-militares': 'em',
  'estatuto-indio': 'eind',
  'estatuto-terra': 'eterra',
  'estatuto-migracao': 'emig',
  'estatuto-refugiado': 'eref',
  'estatuto-metropole': 'emet',
  'estatuto-desporto': 'ed',
};

const PREFIXOS = ['estatuto-', 'lei-', 'lc-', 'decreto-', 'codigo-'];

function acharLei(slugBanco: string, nomeLei?: string | null): LeiCatalogItem | undefined {
  const s = (slugBanco || '').toLowerCase();
  const candidatos = [ALIAS[s], s, ...PREFIXOS.map((p) => (s.startsWith(p) ? s.slice(p.length) : ''))]
    .filter(Boolean);

  for (const c of candidatos) {
    const found = LEIS_CATALOG.find((l) => l.id.toLowerCase() === c);
    if (found) return found;
  }

  // Tenta pelo nome completo da lei (subtítulo do resultado).
  if (nomeLei) {
    const alvo = toSlug(nomeLei);
    const porNome =
      LEIS_CATALOG.find((l) => toSlug(l.nome) === alvo) ||
      LEIS_CATALOG.find((l) => toSlug(l.descricao) === alvo);
    if (porNome) return porNome;

    // Casa pelo número da lei (ex.: "Lei nº 9.099/1995" -> descricao do catálogo).
    const digitos = (nomeLei.match(/\d[\d.]{3,}/)?.[0] || '').replace(/\D/g, '');
    if (digitos.length >= 4) {
      const porNumero = LEIS_CATALOG.find(
        (l) => (l.descricao || '').replace(/\D/g, '').includes(digitos),
      );
      if (porNumero) return porNumero;
    }
  }

  return undefined;
}

/** Devolve a rota final de um resultado, ou `null` se não houver tela para ele. */
export function resolveRotaResultado(item: ConteudoResultado): string | null {
  if (item.entity_type !== 'artigo') return item.route || null;

  const m = (item.route || '').match(/^\/legislacao\/artigo\/([^/]+)\/(.+)$/);
  if (!m) return null;
  const [, slugBanco, numero] = m;

  const lei = acharLei(slugBanco, item.subtitle);
  if (!lei) return null;

  return `${leiPath(lei)}/${encodeURIComponent(decodeURIComponent(numero))}`;
}
