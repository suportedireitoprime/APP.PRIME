import { TIPOS_CONTEUDO, TIPOS_JURISPRUDENCIA, type ConteudoTipo, type ConteudoGrupo } from '@/hooks/useBuscaConteudo';

export type CategoriaKey = 'tudo' | ConteudoTipo;

const LABELS: Record<ConteudoTipo, string> = {
  videoaula: 'Videoaulas',
  livro: 'Livros',
  blog: 'Blog',
  resumo: 'Resumos',
  noticia: 'Notícias',
  obra: 'Filmes',
  dicionario: 'Dicionário',
  artigo: 'Artigos de lei',
  sumula: 'Súmulas',
  tese: 'Teses',
  informativo: 'Informativos',
  pesquisa: 'Pesquisas prontas',
};

export default function CategoriaFiltroBar({
  ativo, counts, onChange, grupo = 'conteudo',
}: {
  ativo: CategoriaKey;
  counts: Record<string, number>;
  onChange: (k: CategoriaKey) => void;
  grupo?: ConteudoGrupo;
}) {
  const tipos = grupo === 'jurisprudencia' ? TIPOS_JURISPRUDENCIA : TIPOS_CONTEUDO;
  const order: { key: CategoriaKey; label: string }[] = [
    { key: 'tudo', label: 'Tudo' },
    ...tipos.map((t) => ({ key: t as CategoriaKey, label: LABELS[t] })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none px-4 pb-2 -mx-1">
      {order.map((c) => {
        const total = c.key === 'tudo'
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : counts[c.key] || 0;
        const active = ativo === c.key;
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all border ${
              active
                ? 'bg-primary text-primary-foreground border-primary shadow'
                : 'bg-muted text-muted-foreground border-transparent'
            }`}
          >
            {c.label}
            {total > 0 && (
              <span className={`ml-1.5 text-[10px] ${active ? 'opacity-80' : 'opacity-60'}`}>
                {total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
