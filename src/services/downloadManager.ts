import { get, set, del, keys } from 'idb-keyval';

/**
 * Prefixo para isolar chaves de downloads no IndexedDB
 */
const PREFIX = 'offline_pkg_';

export interface OfflinePackageMetadata {
  id: string;
  name: string;
  sizeBytes: number;
  downloadedAt: string;
}

/**
 * Salva um pacote (array de objetos ou blob) no armazenamento local persistente.
 */
export async function saveOfflinePackage(id: string, name: string, data: any[]): Promise<void> {
  const sizeBytes = new Blob([JSON.stringify(data)]).size;
  const metadata: OfflinePackageMetadata = {
    id,
    name,
    sizeBytes,
    downloadedAt: new Date().toISOString(),
  };

  // Salva os dados brutos e os metadados
  await set(`${PREFIX}${id}`, data);
  await set(`${PREFIX}meta_${id}`, metadata);
}

/**
 * Recupera um pacote offline salvo. Retorna null se não existir.
 */
export async function getOfflinePackage<T>(id: string): Promise<T[] | null> {
  const data = await get<T[]>(`${PREFIX}${id}`);
  return data ?? null;
}

/**
 * Remove um pacote do armazenamento local para liberar espaço.
 */
export async function removeOfflinePackage(id: string): Promise<void> {
  await del(`${PREFIX}${id}`);
  await del(`${PREFIX}meta_${id}`);
}

/**
 * Retorna os metadados de todos os pacotes atualmente baixados.
 */
export async function listDownloadedPackages(): Promise<OfflinePackageMetadata[]> {
  const allKeys = await keys();
  const metaKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(`${PREFIX}meta_`)) as string[];
  
  const results: OfflinePackageMetadata[] = [];
  for (const k of metaKeys) {
    const meta = await get<OfflinePackageMetadata>(k);
    if (meta) results.push(meta);
  }
  
  return results;
}

/**
 * Calcula o espaço total utilizado pelos pacotes baixados (em bytes).
 */
export async function getTotalOfflineStorageBytes(): Promise<number> {
  const pkgs = await listDownloadedPackages();
  return pkgs.reduce((acc, pkg) => acc + pkg.sizeBytes, 0);
}
