import { Capacitor } from '@capacitor/core';

/**
 * Lovable CDN assets are served at `/__l5e/assets-v1/...` — a relative path
 * that resolves against the current origin. On the web this is the Lovable
 * domain and works fine. Inside the native app (Capacitor) the origin is
 * `http://localhost`, and that path doesn't exist inside the APK bundle,
 * so <img src> requests 404 and the images disappear.
 *
 * This helper prefixes those relative paths with the published Lovable host
 * when running natively, keeping everything unchanged on the web.
 */
const CDN_HOST =
  (import.meta.env.VITE_LOVABLE_ASSETS_HOST as string | undefined)?.replace(/\/+$/, '') ||
  'https://direitoprime.com.br';

const isNative = (() => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
})();

/**
 * Mapa de todos os assets binários presentes em `src/assets/` — indexados
 * pelo nome do arquivo original. Vite avalia o glob em build time, empacota
 * cada arquivo dentro do APK/dist, e devolve a URL final já processada.
 * Isso permite que qualquer `.asset.json` seja resolvido para o binário
 * embutido quando o app roda nativo — funciona 100% offline.
 */
const bundledMap: Record<string, string> = (() => {
  const modules = import.meta.glob(
    '/src/assets/**/*.{png,jpg,jpeg,webp,svg,gif,avif,mp3,wav,ogg}',
    { eager: true, query: '?url', import: 'default' },
  ) as Record<string, string>;
  const byName: Record<string, string> = {};
  for (const [path, url] of Object.entries(modules)) {
    const name = path.split('/').pop();
    if (name) byName[name] = url;
  }
  return byName;
})();

const LOCAL_MANUAL_CAPAS = new Set([
  '1984_manual.jpg',
  'acesso_a_justica_manual.jpg',
  'a_arte_da_guerra_manual.jpg',
  'a_era_dos_direitos_manual.jpg',
  'a_luta_pelo_direito_manual.jpg',
  'a_meta_um_processo_de_melhoria_continua_manual.jpg',
  'a_republica_manual.jpg',
  'a_riqueza_das_nacoes.jpg',
  'a_teoria_das_formas_de_governo_manual.jpg',
  'como_as_democracias_morrem_manual.jpg',
  'dos_delitos_e_das_penas_manual.jpg',
  'eles_os_juizes_vistos_por_nos_os_advogados_manual.jpg',
  'etica_a_nicomaco_manual.jpg',
  'filosofia_do_direito.jpg',
  'introducao_ao_estudo_do_direito.jpg',
  'justica_o_que_e_fazer_a_coisa_certa_manual.jpg',
  'licoes_preliminares_de_direito.jpg',
  'o_advogado_do_diabo.jpg',
  'o_caso_dos_exploradores_de_cavernas_manual.jpg',
  'o_contrato_social_manual.jpg',
  'o_espirito_das_leis_manual.jpg',
  'o_futuro_da_democracia_manual.jpg',
  'o_leviata_manual.jpg',
  'o_monge_e_o_executivo_manual.jpg',
  'o_mundo_assombrado_pelos_demonios_manual.jpg',
  'o_mundo_de_sofia_manual.jpg',
  'o_principe_manual.jpg',
  'o_processo_manual.jpg',
  'o_que_e_direito_primeiros_passos_manual.jpg',
  'o_ultimo_dia_de_um_condenado_manual.jpg',
  'sobre_a_liberdade_manual.jpg',
  'teoria_pura_do_direito_manual.jpg',
  'vigiar_e_punir_nascimento_da_prisao_manual.jpg',
  'virando_a_propria_mesa_manual.jpg',
]);

type AssetJson = { url?: string; original_filename?: string };

/** Devolve a versão nativa (bundled) quando disponível; senão, cai no CDN. */
function resolveBundled(nameOrUrl: string | undefined | null): string | undefined {
  if (!nameOrUrl) return undefined;
  const normalized = nameOrUrl.replace(/\\/g, '/');
  const name = normalized.split('/').pop()?.split('?')[0]?.split('#')[0];
  if (name && bundledMap[name]) return bundledMap[name];
  if (normalized.includes('biblioteca-obras/capas/')) {
    const filename = normalized.split('biblioteca-obras/capas/')[1]?.split('?')[0]?.split('#')[0];
    if (filename && !filename.includes('/')) {
      if (bundledMap[filename]) return bundledMap[filename];
      if (LOCAL_MANUAL_CAPAS.has(filename)) {
        return `/biblioteca-obras/capas/${filename}`;
      }
    }
  }
  return undefined;
}

export function assetUrl(url: string | undefined | null): string {
  if (!url) return '';
  const normalized = url.replace(/\\/g, '/');

  // Prioriza sempre o binário embutido no bundle (src/assets) se existir pelo nome do arquivo
  const bundled = resolveBundled(normalized);
  if (bundled) return bundled;

  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith('/__l5e/')) {
    return `${CDN_HOST}${normalized}`;
  }
  return normalized;
}

/**
 * Resolve um `.asset.json` para a URL correta em cada ambiente.
 * - Se o binário estiver empacotado em `src/assets/`, usa a versão local.
 * - Caso contrário, cai para o CDN (com host absoluto no native).
 */
export function srcOf(asset: AssetJson | string | undefined | null): string {
  if (!asset) return '';
  if (typeof asset === 'string') return assetUrl(asset);
  const bundled = resolveBundled(asset.original_filename || asset.url || '');
  if (bundled) return bundled;
  return assetUrl(asset.url);
}

/**
 * Compat: recebe um caminho bundled explícito + URL do CDN e devolve o
 * melhor dos dois — bundled sempre que existir, CDN como fallback.
 */
export function pickAsset(bundled: string, cdnUrl: string): string {
  return bundled || cdnUrl;
}
