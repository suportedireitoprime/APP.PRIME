/**
 * Utilitário central de aliases de tabelas e variantes de numeração de artigos
 * para compatibilidade e sincronia perfeita entre Admin e Vade Mecum.
 */

import { LEIS_CATALOG } from '@/data/leisCatalog';

/**
 * Retorna todos os aliases possíveis de uma tabela de lei.
 * Ex: 'CP_CODIGO_PENAL' -> ['CP_CODIGO_PENAL', 'codigo_penal', 'cp', 'CODIGO_PENAL', ...]
 */
export function obterAliasesTabela(tabelaNome: string): string[] {
  if (!tabelaNome) return [];
  const limpo = tabelaNome.trim();
  const lower = limpo.toLowerCase();
  const upper = limpo.toUpperCase();
  const semPrefixoLower = lower.replace(/^[a-z0-9]+_/, '');
  const semPrefixoUpper = upper.replace(/^[A-Z0-9]+_/, '');

  const aliases = new Set<string>([
    limpo,
    lower,
    upper,
    semPrefixoLower,
    semPrefixoUpper,
  ]);

  // Busca correspondência no LEIS_CATALOG
  for (const item of LEIS_CATALOG) {
    const itemTabLower = item.tabela_nome.toLowerCase();
    const itemIdLower = item.id.toLowerCase();
    const itemSiglaLower = item.sigla.toLowerCase();

    if (
      lower === itemTabLower ||
      lower === itemIdLower ||
      lower === itemSiglaLower ||
      semPrefixoLower === itemTabLower.replace(/^[a-z0-9]+_/, '')
    ) {
      aliases.add(item.tabela_nome);
      aliases.add(item.tabela_nome.toLowerCase());
      aliases.add(item.tabela_nome.toUpperCase());
      aliases.add(item.id);
      aliases.add(item.id.toLowerCase());
      aliases.add(item.id.toUpperCase());
    }
  }

  // Mapeamentos manuais frequentes para garantia absoluta
  if (lower.includes('penal') && !lower.includes('processo')) {
    aliases.add('CP_CODIGO_PENAL');
    aliases.add('codigo_penal');
    aliases.add('cp');
  } else if (lower.includes('constituicao') || lower === 'cf' || lower === 'cf88') {
    aliases.add('CF88_CONSTITUICAO_FEDERAL');
    aliases.add('cf88_constituicao_federal');
    aliases.add('constituicao');
    aliases.add('cf88');
    aliases.add('cf');
  } else if (lower.includes('processo') && lower.includes('penal')) {
    aliases.add('CPP_CODIGO_PROCESSO_PENAL');
    aliases.add('codigo_processo_penal');
    aliases.add('cpp');
  } else if (lower.includes('processo') && lower.includes('civil')) {
    aliases.add('CPC_CODIGO_PROCESSO_CIVIL');
    aliases.add('codigo_processo_civil');
    aliases.add('cpc');
  } else if (lower.includes('civil') && !lower.includes('processo')) {
    aliases.add('CC_CODIGO_CIVIL');
    aliases.add('codigo_civil');
    aliases.add('cc');
  } else if (lower.includes('clt') || lower.includes('trabalho')) {
    aliases.add('CLT_CONSOLIDACAO_LEIS_TRABALHO');
    aliases.add('clt');
  }

  return Array.from(aliases).filter(Boolean);
}

/**
 * Retorna todas as variações conhecidas de numeração de um artigo.
 * Ex: 'Art. 1º' -> ['Art. 1º', '1º', '1', 'Artigo 1º', 'Art. 1', 'Artigo 1']
 */
export function obterVariantesArtigoNumero(numero: string | number): string[] {
  if (numero === undefined || numero === null) return [];
  const raw = String(numero).trim();
  const numLimpo = raw.replace(/^[Aa]rt\.?\s*|^[Aa]rtigo\s*/i, '').trim();
  const digitos = numLimpo.replace(/\D/g, '');
  const matchLetra = numLimpo.match(/-([A-Za-z])/);
  const sufixoLetra = matchLetra ? matchLetra[1].toUpperCase() : null;

  const variantes = new Set<string>([
    raw,
    numLimpo,
    `Art. ${numLimpo}`,
    `Artigo ${numLimpo}`,
  ]);

  if (digitos) {
    variantes.add(digitos);
    variantes.add(`Art. ${digitos}`);
    variantes.add(`Artigo ${digitos}`);
    variantes.add(`${digitos}º`);
    variantes.add(`${digitos}°`);
    variantes.add(`${digitos}o`);
    variantes.add(`Art. ${digitos}º`);
    variantes.add(`Artigo ${digitos}º`);

    if (sufixoLetra) {
      variantes.add(`${digitos}-${sufixoLetra}`);
      variantes.add(`${digitos}º-${sufixoLetra}`);
      variantes.add(`Art. ${digitos}-${sufixoLetra}`);
      variantes.add(`Art. ${digitos}º-${sufixoLetra}`);
    }
  }

  return Array.from(variantes).filter(Boolean);
}
