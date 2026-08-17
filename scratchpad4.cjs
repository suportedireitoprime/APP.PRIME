const fs = require('fs');
const path = 'src/pages/AdminApresentacaoEditar.tsx';
let content = fs.readFileSync(path, 'utf8');

const handleBackLogic = `  const handleBack = () => {
    if (step === 'geracao') {
      setStep('referencia');
    } else if (step === 'referencia') {
      if (modo === 'livro' && categoriaLivro) {
        setCategoriaLivro('');
        setLivroSel(null);
      } else {
        setStep('categoria');
      }
    } else {
      navigate('/admin-funcoes');
    }
  };

  return (`;

content = content.replace('  return (', handleBackLogic);

content = content.replace(
  "onBack={() => navigate('/admin-funcoes')}",
  "onBack={handleBack}"
);

// Remove "<- Voltar" button from step === 'referencia'
const btnVoltar = `              <button
                onClick={() => setStep('categoria')}
                className="px-3 py-1.5 rounded-xl border border-border hover:bg-accent transition text-xs font-semibold text-muted-foreground"
              >
                ← Voltar
              </button>`;
content = content.replace(btnVoltar, '');

// Remove "<- Categorias" button
const btnCategorias = `                      <button
                        onClick={() => { setCategoriaLivro(''); setLivroSel(null); }}
                        className="px-3 py-2 rounded-xl border border-border hover:bg-accent transition text-xs font-semibold text-muted-foreground shrink-0"
                      >
                        ← Categorias
                      </button>`;
content = content.replace(btnCategorias, '');

// Remove "<- Mudar Referência" button
const btnMudarRef = `              <button
                onClick={() => setStep('referencia')}
                className="px-3 py-1.5 rounded-xl border border-border hover:bg-accent transition text-xs font-semibold text-muted-foreground"
              >
                ← Mudar Referência
              </button>`;
content = content.replace(btnMudarRef, '');

fs.writeFileSync(path, content, 'utf8');
console.log('Script finalizado com sucesso!');
