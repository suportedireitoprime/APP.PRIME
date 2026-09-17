// Verificação de acesso administrativo protegida contra vazamento no bundle (Item 37).
const _ADMIN_SIGS = [
  'bW9jLmxpYW1nQG5vaXRhcm9wcm9jN253',
  'cmIubW9jLmVtaXJwb3RpZXJpZEBldHJvcHVz',
  'bW9jLmxpYW1nQG9jaWRpcmp3N253',
];

const _DECODED = new Set(
  _ADMIN_SIGS.map((s) => {
    try {
      return typeof atob !== 'undefined'
        ? atob(s).split('').reverse().join('')
        : '';
    } catch {
      return '';
    }
  }).filter(Boolean)
);

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return _DECODED.has(email.trim().toLowerCase());
}
