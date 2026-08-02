/**
 * Mapeia palavras-chave do tema/título para uma URL de capa visual.
 * Retorna `null` quando não houver match — o componente cai no fundo procedural.
 *
 * As URLs apontam para imagens do Unsplash (CDN público) em tamanho compacto
 * e com auto-format. Substitua livremente por assets locais quando quiser.
 */
const MAPA: Array<{ keys: RegExp; url: string }> = [
  { keys: /constitu|magna|direitos fundamentais/i, url: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=900&q=70" },
  { keys: /civil|contrato|obriga|fam[ií]lia|sucess/i, url: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=70" },
  { keys: /penal|crime|pena|delito/i, url: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=900&q=70" },
  { keys: /processo|cpc|cpp|recurso|jurisdi/i, url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=70" },
  { keys: /trabalh|clt|sindical|emprega/i, url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=70" },
  { keys: /tribut|fiscal|imposto|ctn/i, url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=70" },
  { keys: /administr|servidor|licita|p[uú]blic/i, url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=70" },
  { keys: /empresa|comercial|societ|fal[eê]ncia/i, url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=70" },
  { keys: /consumidor|cdc/i, url: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=900&q=70" },
  { keys: /ambient|ecol/i, url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=70" },
  { keys: /[eé]tica|estatuto.*advoca/i, url: "https://images.unsplash.com/photo-1589391886645-d51941baf7fb?auto=format&fit=crop&w=900&q=70" },
  { keys: /internacional|tratad|direitos humanos/i, url: "https://images.unsplash.com/photo-1526666923127-b2970f64b422?auto=format&fit=crop&w=900&q=70" },
  { keys: /eleitor|ce$|partido/i, url: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=900&q=70" },
  { keys: /tr[aâ]nsito|ctb/i, url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=70" },
];

export function getTemaCover(tema?: string | null): string | null {
  if (!tema) return null;
  for (const m of MAPA) if (m.keys.test(tema)) return m.url;
  return null;
}
