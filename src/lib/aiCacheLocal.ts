// Espelho local do `artigo_ai_cache` (Supabase) em localStorage.
// Faz o conteúdo IA já gerado (explicação, exemplo, termos, grifo mágico)
// ficar disponível offline sem depender de rede.

type Tipo = 'explicacao' | 'exemplo' | 'termos' | 'grifo_magico' | 'sugerir_perguntas' | string;

const PREFIX = 'ai_cache:v1:';

function keyOf(tabela: string, numero: string | number, tipo: Tipo): string {
  return `${PREFIX}${tabela}|${numero}|${tipo}`;
}

function isErrorContent(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return true;
  const lower = text.toLowerCase();
  return (
    lower.includes('consegui gerar uma resposta') ||
    lower.includes('prepayment credits') ||
    lower.includes('resource_exhausted') ||
    lower.includes('"code": 429') ||
    lower.includes('"code":429') ||
    lower.includes('api_key_invalid') ||
    lower.includes('tempo limite excedido') ||
    lower.includes('não foi possível gerar o conteúdo') ||
    lower.includes('não foi possível gerar a anotação') ||
    (lower.startsWith('{ "error":') || lower.startsWith('{"error":'))
  );
}

export function getLocalAiCache(
  tabela: string | null | undefined,
  numero: string | number | null | undefined,
  tipo: Tipo,
): string | null {
  if (!tabela || numero === null || numero === undefined) return null;
  try {
    const k = keyOf(tabela, numero, tipo);
    const val = localStorage.getItem(k);
    if (val && isErrorContent(val)) {
      localStorage.removeItem(k);
      return null;
    }
    return val;
  } catch {
    return null;
  }
}

export function setLocalAiCache(
  tabela: string | null | undefined,
  numero: string | number | null | undefined,
  tipo: Tipo,
  conteudo: string | null | undefined,
): void {
  if (!tabela || numero === null || numero === undefined || !conteudo) return;
  if (isErrorContent(conteudo)) return;
  try {
    localStorage.setItem(keyOf(tabela, numero, tipo), conteudo);
  } catch {
    // quota — ignore
  }
}

export function deleteLocalAiCache(
  tabela: string | null | undefined,
  numero: string | number | null | undefined,
  tipo: Tipo,
): void {
  if (!tabela || numero === null || numero === undefined) return;
  try {
    localStorage.removeItem(keyOf(tabela, numero, tipo));
  } catch {
    /* ignore */
  }
}

/**
 * Purga seletiva ou total de explicações de IA armazenadas no localStorage.
 * Por padrão, apaga erros e registros das tabelas especificadas (ex: Código Penal e Código Civil).
 */
export function purgeAiExplanationCache(tabelas?: string[], tipos: Tipo[] = ['explicacao']): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  let count = 0;
  try {
    const keysToRemove: string[] = [];
    const normalizedTargets = tabelas?.map((t) => t.toLowerCase()) || [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;

      const rawVal = localStorage.getItem(key);
      if (rawVal && isErrorContent(rawVal)) {
        keysToRemove.push(key);
        continue;
      }

      // Se for alvo de tabela específica
      if (normalizedTargets.length > 0) {
        const withoutPrefix = key.slice(PREFIX.length);
        const [keyTab, , keyTipo] = withoutPrefix.split('|');
        const matchesTab = normalizedTargets.some(
          (target) => keyTab.toLowerCase() === target || keyTab.toLowerCase().includes(target)
        );
        const matchesTipo = tipos.includes(keyTipo);
        if (matchesTab && matchesTipo) {
          keysToRemove.push(key);
        }
      }
    }

    for (const k of keysToRemove) {
      localStorage.removeItem(k);
      count++;
    }
  } catch (e) {
    console.warn('Erro ao purgar cache de IA:', e);
  }
  return count;
}