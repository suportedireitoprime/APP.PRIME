const fs = require('fs');

let code = fs.readFileSync('src/lib/leiSeca.ts', 'utf8');

const regex = /export async function listarTrilhas\(\): Promise<LeiSecaTrilha\[\]> \{[\s\S]*?return withBundleFallback.*?;\n\}/m;

const replacement = `export async function listarTrilhas(): Promise<LeiSecaTrilha[]> {
  const fetchOnline = (async () => {
    // Busca trilhas customizadas
    const { data: trilhas, error: trilhasError } = await supabase
      .from("lei_seca_trilhas")
      .select("*")
      .eq("ativa", true)
      .order("ordem", { ascending: true });
      
    if (trilhasError) throw trilhasError;

    // Busca todas as leis do Vade Mecum
    const { data: leisVadeMecum, error: leisError } = await supabase
      .from("vade_mecum_leis")
      .select("id, slug, nome, nome_curto, ordem, categoria");

    if (leisError) throw leisError;

    const mapeadas = new Map<string, LeiSecaTrilha>();

    // Primeiro mapeia do Vade Mecum como padrao
    (leisVadeMecum || []).forEach(lei => {
      mapeadas.set(lei.slug, {
        id: lei.id,
        slug: lei.slug,
        nome: lei.nome_curto || lei.nome,
        sigla: lei.nome_curto,
        lei_slug: lei.slug,
        ordem: lei.ordem || 99,
        cor: "from-purple-600 to-fuchsia-700",
        icone: "Scale",
        partes: [{ slug: "completa", nome: lei.nome_curto || lei.nome, filtro: null }],
        ativa: true
      } as LeiSecaTrilha);
    });

    // Sobrescreve com as customizadas da tabela lei_seca_trilhas
    (trilhas || []).forEach(trilha => {
      mapeadas.set(trilha.slug, trilha as any);
    });

    // Converte pra array e ordena por ordem
    return Array.from(mapeadas.values()).sort((a, b) => a.ordem - b.ordem);
  })();

  return withBundleFallback<LeiSecaTrilha>(fetchOnline, () => bundle.leiSecaTrilhas<LeiSecaTrilha>());
}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/lib/leiSeca.ts', code);
