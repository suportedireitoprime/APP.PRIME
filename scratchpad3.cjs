const fs = require('fs');
const path = 'src/pages/AdminApresentacaoEditar.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update State type
content = content.replace(
  "const [step, setStep] = useState<'categoria' | 'referencia'>('categoria');",
  "const [step, setStep] = useState<'categoria' | 'referencia' | 'geracao'>('categoria');"
);

// 2. Add setStep('geracao') to onClick handlers
content = content.replace(
  /onClick=\{\(\) \=\> setResumoSel\(r\)\}/g,
  "onClick={() => { setResumoSel(r); setStep('geracao'); }}"
);
content = content.replace(
  /onClick=\{\(\) \=\> setArtigoSel\(a\)\}/g,
  "onClick={() => { setArtigoSel(a); setStep('geracao'); }}"
);
content = content.replace(
  /onClick=\{\(\) \=\> setLivroSel\(l\)\}/g,
  "onClick={() => { setLivroSel(l); setStep('geracao'); }}"
);

// 3. Fix the "excluir" function to also update livros state
const excluirTarget = `      setLista((prev) => prev.filter((x) => x.id !== a.id));
      toast.success('Apresentação removida');`;
const excluirReplacement = `      setLista((prev) => prev.filter((x) => x.id !== a.id));
      setLivros((prev) => prev.map((l) => l.apresentacao_id === a.id ? { ...l, apresentacao_id: null } : l));
      toast.success('Apresentação removida');`;
content = content.replace(excluirTarget, excluirReplacement);

// 4. Update the Select class to prevent overflow
content = content.replace(
  `className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary"`,
  `className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:ring-1 focus:ring-primary text-ellipsis"`
);

// 5. Structure the steps
content = content.replace(
  "{step === 'referencia' && (",
  "{step === 'geracao' && ("
);

// Update step 1 (removing the "Referência ativa" box from it, moving it to geracao)
const refAtivaBox = `
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
        )}

        {step === 'geracao' && (
          <>`;

const newRefAtivaBox = `          </div>
        )}

        {step === 'geracao' && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Passo n={1} titulo="Geração de Conteúdo" ok={!!referencia} ativo={true} />
              <button
                onClick={() => setStep('referencia')}
                className="px-3 py-1.5 rounded-xl border border-border hover:bg-accent transition text-xs font-semibold text-muted-foreground"
              >
                ← Mudar Referência
              </button>
            </div>
            
            {referencia && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
                <span className="text-xs font-body text-muted-foreground truncate">
                  Referência ativa: <strong className="text-primary">{referencia.titulo}</strong>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary text-primary-foreground shrink-0 uppercase">
                  {modo}
                </span>
              </div>
            )}`;

content = content.replace(refAtivaBox, newRefAtivaBox);

// Finally, we replace the closing `</>` for step geracao with `</div>`
content = content.replace(
  `          </>
        )}

        {/* Lista de Apresentações Criadas */}`,
  `          </div>
        )}

        {/* Lista de Apresentações Criadas */}`
);

// Change the background color of step 2 and 3 cards because they are inside a card now
content = content.replace(
  `<div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <Passo n={2}`,
  `<div className="rounded-2xl border border-border bg-background p-4 space-y-3">
              <Passo n={2}`
);

content = content.replace(
  `<div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <Passo n={3}`,
  `<div className="rounded-2xl border border-border bg-background p-4 space-y-3">
          <Passo n={3}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Script finalizado com sucesso!');
