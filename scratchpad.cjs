const fs = require('fs');

const path = 'src/pages/AdminApresentacaoEditar.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Injetar state step
content = content.replace(
  "const [modo, setModo] = useState<Modo>('materia');",
  "const [modo, setModo] = useState<Modo>('materia');\n  const [step, setStep] = useState<'categoria' | 'referencia'>('categoria');"
);

// 2. Substituir bloco
const targetBlock = `        {/* 1 — Categorias Responsivas (3 Opções) */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
          <Passo n={1} titulo="Escolha a categoria" ok={!!referencia} ativo={!referencia} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {([
              { id: 'materia' as Modo, label: 'Matérias', desc: 'Resumos por área e tema', icon: BookOpen },
              { id: 'lei' as Modo, label: 'Leis', desc: 'Constituição e Códigos', icon: Scale },
              { id: 'livro' as Modo, label: 'Livros (Clássicos)', desc: 'Biblioteca Jurídica', icon: BookMarked },
            ]).map((m) => {
              const Icon = m.icon;
              const ativo = modo === m.id;
              return (
                <button
                  key={m.id}
                  disabled={ocupado}
                  onClick={() => {
                    setModo(m.id);
                    setResumoSel(null);
                    setArtigoSel(null);
                    setLivroSel(null);
                  }}
                  className={\`rounded-xl border p-3.5 text-left flex flex-col justify-between transition-all \${
                    ativo
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }\`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5" />
                    {ativo && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <div>
                    <span className="block text-sm font-bold font-heading">{m.label}</span>
                    <span className="block text-[11px] opacity-80 font-body">{m.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Painel da Categoria 1: Matérias */}
          {modo === 'materia' && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <select
                value={area}
                onChange={(e) => { setArea(e.target.value); setTema(''); setResumoSel(null); }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
              >
                <option value="">{carregando ? 'Carregando áreas…' : 'Escolha a área'}</option>
                {areas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>

              {!!area && (
                <select
                  value={tema}
                  onChange={(e) => { setTema(e.target.value); setResumoSel(null); }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                >
                  <option value="">Escolha o tema</option>
                  {temas.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              )}

              {!!tema && (
                <div className="rounded-xl border border-border divide-y divide-border max-h-72 overflow-y-auto bg-background/50">
                  {subtemas.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setResumoSel(r)}
                      className={\`w-full text-left p-3 flex items-center gap-2 transition \${resumoSel?.id === r.id ? 'bg-primary/10' : 'hover:bg-accent/40'}\`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-body font-semibold truncate">{r.subtema || r.tema}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {(r.markdown?.length ?? 0) > 0 ? \`\${Math.round((r.markdown!.length) / 100) / 10}k caracteres\` : 'sem resumo salvo'}
                        </span>
                      </span>
                      {resumoSel?.id === r.id ? <Check className="w-4 h-4 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Painel da Categoria 2: Leis */}
          {modo === 'lei' && (
            <div className="space-y-3 pt-2 border-t border-border/60">
              <select
                value={leiId}
                onChange={(e) => setLeiId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
              >
                <option value="">Escolha a lei</option>
                {LEIS_CATALOG.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>

              {!!lei && (
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={buscaArtigo}
                      onChange={(e) => setBuscaArtigo(e.target.value)}
                      placeholder="Buscar artigo (ex.: 1 ou 121)"
                      className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="rounded-xl border border-border divide-y divide-border max-h-72 overflow-y-auto bg-background/50">
                    {carregando && <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
                    {artigosFiltrados.map((a) => (
                      <button
                        key={a.numero}
                        onClick={() => setArtigoSel(a)}
                        className={\`w-full text-left p-3 flex items-center gap-2 transition \${artigoSel?.numero === a.numero ? 'bg-primary/10' : 'hover:bg-accent/40'}\`}
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-body font-semibold">Art. {a.numero}</span>
                          <span className="block text-[11px] text-muted-foreground truncate">{a.rotulo || a.caput}</span>
                        </span>
                        {artigoSel?.numero === a.numero ? <Check className="w-4 h-4 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Painel da Categoria 3: Livros (Clássicos da Literatura Jurídica) */}
          {modo === 'livro' && (
            <div className="space-y-3 pt-2 border-t border-border/60">
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
          )}

          {referencia && (
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
              <span className="text-xs font-body text-muted-foreground truncate">
                Referência ativa: <strong className="text-primary">{referencia.titulo}</strong>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary text-primary-foreground shrink-0 uppercase">
                {modo}
              </span>
            </div>
          )}
        </div>`;

const newBlock = `        {/* 1 — Categorias Responsivas (3 Opções) ou Referência */}
        {step === 'categoria' ? (
          <div className="space-y-6 pt-4">
            <div className="text-center space-y-2">
              <Passo n={1} titulo="Escolha a categoria" ativo />
              <p className="text-muted-foreground text-sm">Qual o tipo de apresentação você deseja gerar ou editar?</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([
                { id: 'materia' as Modo, label: 'Matérias', desc: 'Resumos por área e tema', icon: BookOpen },
                { id: 'lei' as Modo, label: 'Leis', desc: 'Constituição e Códigos', icon: Scale },
                { id: 'livro' as Modo, label: 'Livros (Clássicos)', desc: 'Biblioteca Jurídica', icon: BookMarked },
              ]).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    disabled={ocupado}
                    onClick={() => {
                      setModo(m.id);
                      setResumoSel(null);
                      setArtigoSel(null);
                      setLivroSel(null);
                      setStep('referencia');
                    }}
                    className="bg-card border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-4 text-center group h-40 disabled:opacity-50"
                  >
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                      <Icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-medium text-lg font-heading">{m.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Passo n={1} titulo="Escolha a Referência" ok={!!referencia} ativo={!referencia} />
              <button
                onClick={() => setStep('categoria')}
                className="px-3 py-1.5 rounded-xl border border-border hover:bg-accent transition text-xs font-semibold text-muted-foreground"
              >
                ← Voltar
              </button>
            </div>

            {/* Painel da Categoria 1: Matérias */}
            {modo === 'materia' && (
              <div className="space-y-3 pt-2">
                <select
                  value={area}
                  onChange={(e) => { setArea(e.target.value); setTema(''); setResumoSel(null); }}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                >
                  <option value="">{carregando ? 'Carregando áreas…' : 'Escolha a área'}</option>
                  {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>

                {!!area && (
                  <select
                    value={tema}
                    onChange={(e) => { setTema(e.target.value); setResumoSel(null); }}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Escolha o tema</option>
                    {temas.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                )}

                {!!tema && (
                  <div className="rounded-xl border border-border divide-y divide-border max-h-72 overflow-y-auto bg-background/50">
                    {subtemas.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setResumoSel(r)}
                        className={\`w-full text-left p-3 flex items-center gap-2 transition \${resumoSel?.id === r.id ? 'bg-primary/10' : 'hover:bg-accent/40'}\`}
                      >
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-body font-semibold truncate">{r.subtema || r.tema}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {(r.markdown?.length ?? 0) > 0 ? \`\${Math.round((r.markdown!.length) / 100) / 10}k caracteres\` : 'sem resumo salvo'}
                          </span>
                        </span>
                        {resumoSel?.id === r.id ? <Check className="w-4 h-4 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Painel da Categoria 2: Leis */}
            {modo === 'lei' && (
              <div className="space-y-3 pt-2">
                <select
                  value={leiId}
                  onChange={(e) => setLeiId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                >
                  <option value="">Escolha a lei</option>
                  {LEIS_CATALOG.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>

                {!!lei && (
                  <>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={buscaArtigo}
                        onChange={(e) => setBuscaArtigo(e.target.value)}
                        placeholder="Buscar artigo (ex.: 1 ou 121)"
                        className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="rounded-xl border border-border divide-y divide-border max-h-72 overflow-y-auto bg-background/50">
                      {carregando && <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>}
                      {artigosFiltrados.map((a) => (
                        <button
                          key={a.numero}
                          onClick={() => setArtigoSel(a)}
                          className={\`w-full text-left p-3 flex items-center gap-2 transition \${artigoSel?.numero === a.numero ? 'bg-primary/10' : 'hover:bg-accent/40'}\`}
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-body font-semibold">Art. {a.numero}</span>
                            <span className="block text-[11px] text-muted-foreground truncate">{a.rotulo || a.caput}</span>
                          </span>
                          {artigoSel?.numero === a.numero ? <Check className="w-4 h-4 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Painel da Categoria 3: Livros (Clássicos da Literatura Jurídica) */}
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
            )}

            {referencia && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
                <span className="text-xs font-body text-muted-foreground truncate">
                  Referência ativa: <strong className="text-primary">{referencia.titulo}</strong>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary text-primary-foreground shrink-0 uppercase">
                  {modo}
                </span>
              </div>
            )}
          </div>
        )}`

if (content.indexOf(targetBlock) === -1) {
  console.log("Target block not found");
  // Let's print out the first 50 chars of targetBlock and content block to find the mismatch
  console.log("Expected start:", targetBlock.substring(0, 100));
} else {
  content = content.replace(targetBlock, newBlock);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Refactoring complete");
}
