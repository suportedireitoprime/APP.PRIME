const fs = require('fs');

const path = 'src/pages/AdminApresentacaoEditar.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add carregandoLivros state
content = content.replace(
  "  const [livros, setLivros] = useState<LivroRow[]>([]);\n",
  "  const [livros, setLivros] = useState<LivroRow[]>([]);\n  const [carregandoLivros, setCarregandoLivros] = useState(false);\n"
);

// 2. Change useEffect for livros
const targetUseEffect = `  // ---------- livros (clássicos) ----------
  useEffect(() => {
    if (modo !== 'livro' || livros.length) return;
    (async () => {
      setCarregando(true);
      try {
        const res = await call({ acao: 'apres-livros' });
        setLivros((res?.livros ?? []) as LivroRow[]);
      } catch (e) {
        toast.error('Erro ao carregar lista de livros');
      } finally {
        setCarregando(false);
      }
    })();
  }, [modo, livros.length]);`;

const newUseEffect = `  // ---------- livros (clássicos) ----------
  useEffect(() => {
    if (livros.length) return;
    (async () => {
      setCarregandoLivros(true);
      try {
        const res = await call({ acao: 'apres-livros' });
        setLivros((res?.livros ?? []) as LivroRow[]);
      } catch (e) {
        toast.error('Erro ao carregar lista de livros');
      } finally {
        setCarregandoLivros(false);
      }
    })();
  }, [livros.length]);`;

content = content.replace(targetUseEffect, newUseEffect);

// 3. Change JSX for modo === 'livro'
const targetJSX = `            {/* Painel da Categoria 3: Livros (Clássicos da Literatura Jurídica) */}
            {modo === 'livro' && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={buscaLivro}
                      onChange={(e) => setBuscaLivro(e.target.value)}
                      placeholder="Buscar livro clássico (ex.: Dos Delitos e das Penas)"
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {!!categoriasLivros.length && (
                    <select
                      value={categoriaLivro}
                      onChange={(e) => setCategoriaLivro(e.target.value)}
                      className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-body"
                    >
                      <option value="">Todas as categorias</option>
                      {categoriasLivros.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="rounded-xl border border-border divide-y divide-border max-h-80 overflow-y-auto bg-background/50">
                  {carregando && (
                    <div className="p-6 flex justify-center items-center gap-2 text-sm font-body text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" /> Carregando biblioteca de clássicos…
                    </div>
                  )}
                  {!carregando && !livrosFiltrados.length && (
                    <div className="p-4 text-center text-xs text-muted-foreground font-body">
                      Nenhum livro clássico encontrado.
                    </div>
                  )}
                  {!carregando && livrosFiltrados.map((l) => {
                    const sel = livroSel?.livro_id === l.livro_id && livroSel?.livro_tabela === l.livro_tabela;
                    return (
                      <button
                        key={\`\${l.livro_tabela}:\${l.livro_id}\`}
                        onClick={() => setLivroSel(l)}
                        className={\`w-full text-left p-3.5 flex items-center justify-between gap-3 transition \${
                          sel ? 'bg-primary/10' : 'hover:bg-accent/40'
                        }\`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="block text-sm font-bold font-heading truncate text-foreground">
                              {l.titulo}
                            </span>
                            {l.apresentacao_id && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-semibold shrink-0">
                                Já possui apresentação
                              </span>
                            )}
                          </div>
                          <span className="block text-xs text-muted-foreground font-body truncate mt-0.5">
                            {l.autor ? \`Autor: \${l.autor}\` : 'Clássico Jurídico'} · {l.categoria}
                          </span>
                        </div>
                        {sel ? <Check className="w-5 h-5 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}`;

const newJSX = `            {/* Painel da Categoria 3: Livros (Clássicos da Literatura Jurídica) */}
            {modo === 'livro' && (
              <div className="space-y-3 pt-2">
                {carregandoLivros ? (
                  <div className="p-6 flex justify-center items-center gap-2 text-sm font-body text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" /> Carregando biblioteca de clássicos…
                  </div>
                ) : !categoriaLivro ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categoriasLivros.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setCategoriaLivro(cat); setBuscaLivro(''); }}
                        className="rounded-xl border border-border bg-background p-4 text-left flex items-center gap-3 transition hover:border-primary/50 hover:bg-accent/40"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <BookMarked className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-heading font-medium text-sm text-foreground">{cat}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 items-center mb-3">
                      <button
                        onClick={() => { setCategoriaLivro(''); setLivroSel(null); }}
                        className="px-3 py-2 rounded-xl border border-border hover:bg-accent transition text-xs font-semibold text-muted-foreground shrink-0"
                      >
                        ← Categorias
                      </button>
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={buscaLivro}
                          onChange={(e) => setBuscaLivro(e.target.value)}
                          placeholder={\`Buscar em "\${categoriaLivro}"...\`}
                          className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-sm font-body focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border divide-y divide-border max-h-80 overflow-y-auto bg-background/50">
                      {!livrosFiltrados.length && (
                        <div className="p-4 text-center text-xs text-muted-foreground font-body">
                          Nenhum livro encontrado nesta categoria.
                        </div>
                      )}
                      {livrosFiltrados.map((l) => {
                        const sel = livroSel?.livro_id === l.livro_id && livroSel?.livro_tabela === l.livro_tabela;
                        return (
                          <button
                            key={\`\${l.livro_tabela}:\${l.livro_id}\`}
                            onClick={() => setLivroSel(l)}
                            className={\`w-full text-left p-3.5 flex items-center justify-between gap-3 transition \${
                              sel ? 'bg-primary/10' : 'hover:bg-accent/40'
                            }\`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="block text-sm font-bold font-heading truncate text-foreground">
                                  {l.titulo}
                                </span>
                                {l.apresentacao_id && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-semibold shrink-0">
                                    Já possui apresentação
                                  </span>
                                )}
                              </div>
                              <span className="block text-xs text-muted-foreground font-body truncate mt-0.5">
                                {l.autor ? \`Autor: \${l.autor}\` : 'Clássico Jurídico'}
                              </span>
                            </div>
                            {sel ? <Check className="w-5 h-5 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}`;

if (content.indexOf(targetJSX) === -1) {
  console.error("Could not find targetJSX!");
} else if (content.indexOf(targetUseEffect) === -1) {
  console.error("Could not find targetUseEffect!");
} else {
  content = content.replace(targetJSX, newJSX);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Success");
}
