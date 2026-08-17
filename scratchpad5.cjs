const fs = require('fs');
const path = 'src/pages/AdminApresentacaoEditar.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update Apres type to include created_at
content = content.replace(
  "subtema: string | null; total_slides: number; publicada: boolean; status: string;",
  "subtema: string | null; total_slides: number; publicada: boolean; status: string; created_at: string;"
);

// 2. Add History import if it doesn't exist. Wait, History from lucide-react might not be imported.
// We have Presentation, let's just replace Presentation with History.
content = content.replace(
  "Presentation,",
  "Presentation, History,"
);

// 3. Update select to include created_at
content = content.replace(
  ".select('id, titulo, origem, area, tema, subtema, total_slides, publicada, status')",
  ".select('id, titulo, origem, area, tema, subtema, total_slides, publicada, status, created_at')"
);

// 4. Update the layout of the 3 Category cards
const oldCards = `            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  </button>`;

const newCards = `            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {([
                { id: 'materia' as Modo, label: 'Matérias', desc: 'Resumos por área e tema', icon: BookOpen },
                { id: 'lei' as Modo, label: 'Leis', desc: 'Constituição e Códigos', icon: Scale },
                { id: 'livro' as Modo, label: 'Livros', desc: 'Biblioteca Jurídica', icon: BookMarked },
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
                    className="bg-card border border-border/50 hover:border-primary/50 hover:bg-muted/30 transition-all rounded-2xl p-3 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 text-center group h-32 sm:h-40 disabled:opacity-50"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[11px] sm:text-lg font-heading leading-tight">{m.label}</h3>
                      <p className="text-[9px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2 hidden sm:block">{m.desc}</p>
                    </div>
                  </button>`;

content = content.replace(oldCards, newCards);


// 5. Update the History section
const oldHistory = `        {/* Lista de Apresentações Criadas */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="font-heading font-bold text-sm flex items-center gap-2">
            <Presentation className="w-4 h-4 text-primary" /> Apresentações criadas
          </h2>
          {!lista.length && <p className="text-xs text-muted-foreground font-body">Nenhuma apresentação criada ainda.</p>}
          {lista.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-3 flex items-center gap-3 bg-background/40 hover:bg-background/80 transition">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-body font-semibold truncate">{a.titulo}</span>
                <span className="block text-[11px] text-muted-foreground truncate">
                  {[a.origem?.toUpperCase(), a.area, a.tema].filter(Boolean).join(' · ')} · {a.total_slides} slides · {a.status}
                </span>
              </span>`;

const newHistory = `        {/* Lista de Apresentações Criadas */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 mt-8">
          <h2 className="font-heading font-bold text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Histórico
          </h2>
          {!lista.length && <p className="text-xs text-muted-foreground font-body">Nenhuma apresentação criada ainda.</p>}
          {lista.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-3 flex items-center gap-3 bg-background/40 hover:bg-background/80 transition">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-body font-semibold truncate">{a.titulo}</span>
                <span className="block text-[11px] text-muted-foreground truncate">
                  {new Date(a.created_at).toLocaleDateString('pt-BR')} · {[a.origem?.toUpperCase(), a.area, a.tema].filter(Boolean).join(' · ')} · {a.total_slides} slides · {a.status}
                </span>
              </span>`;

content = content.replace(oldHistory, newHistory);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
