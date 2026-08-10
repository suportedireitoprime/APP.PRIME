import * as fs from "fs";

const filePath = "src/pages/MeuEspaco.tsx";
let code = fs.readFileSync(filePath, "utf8");

// 1. Add new states inside MeuEspaco
const stateInject = `
  const [activeTab, setActiveTab] = useState<'meus' | 'metas'>('meus');
  const [metas, setMetas] = useState([
    { id: 'm1', type: 'Trilha', title: 'Direito Constitucional', done: false, icon: FileText },
    { id: 'm2', type: 'Leitura', title: 'Crime e Castigo: Cap. 1', done: false, icon: BookOpen },
    { id: 'm3', type: 'Videoaula', title: 'Processo Penal: Inquérito', done: true, icon: Video },
  ]);

  const toggleMeta = (id: string) => {
    import('@/lib/nativeHaptics').then(({ haptic }) => haptic.selection());
    setMetas(prev => prev.map(m => m.id === id ? { ...m, done: !m.done } : m));
  };
`;
code = code.replace(/const \[selectedDate, setSelectedDate\] = useState<string>\(\(\) => toYMD\(new Date\(\)\)\);/, `const [selectedDate, setSelectedDate] = useState<string>(() => toYMD(new Date()));${stateInject}`);

// 2. Replace QUICK array
const newQuick = `
  const QUICK = [
    { label: 'Minhas Leituras', icon: BookOpen, path: '/minhas-leituras', color: '#FFD400' },
    { label: 'Meus Resumos', icon: NotebookPen, path: '/meus-resumos', color: '#22D3EE' },
    { label: 'Videoaulas', icon: Video, path: '/minhas-videoaulas', color: '#FF2D78' },
    { label: 'Minhas anotações', icon: StickyNote, path: '/pessoal/anotacoes' },
    { label: 'Meus grifos', icon: Highlighter, path: '/pessoal/grifos' },
    { label: 'Livros Salvos', icon: BookMarked, path: '/pessoal/livros' },
    { label: 'Filmes', icon: Film, path: '/pessoal/filmes' },
    { label: 'Jurisprudências', icon: Gavel, path: '/pessoal/jurisprudencias' },
    { label: 'Temáticas', icon: Star, path: '/pessoal/tematicas' },
  ];
`;
code = code.replace(/const QUICK = \[\s*\{[\s\S]*?\];/m, newQuick);

// 3. Replace the JSX body
const jsxStartRegex = /<div className="lg:mx-auto lg:w-full lg:max-w-\[1200px\] lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:px-8">[\s\S]*?\{COVER_PICKER_MARKER/m;

// We need to inject a marker to easily replace the JSX body
code = code.replace(/\{\/\* Cover picker \*\/\}/, '{COVER_PICKER_MARKER\n      {/* Cover picker */}');

const newJsxBody = `
      <div className="lg:mx-auto lg:w-full lg:max-w-[1200px] lg:px-8">
        
        {/* Carrossel de Datas */}
        <div className="mt-6 px-5 lg:px-0">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {formatFullDate(new Date(selectedDate + 'T00:00:00'))}
            </span>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 snap-x">
            {dayList.map((d) => {
              const key = toYMD(d);
              const isSelected = selectedDate === key;
              const hasData = (feedByDay.get(key)?.length ?? 0) > 0;
              return (
                <button
                  key={key}
                  onClick={() => { haptic.selection(); setSelectedDate(key); }}
                  className={\`snap-start shrink-0 relative flex flex-col items-center justify-center gap-1 w-[4.5rem] h-[4.5rem] rounded-2xl transition-all shadow-sm border \${
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground shadow-primary/30'
                      : 'bg-secondary/40 border-border/60 text-foreground hover:bg-secondary/60'
                  }\`}
                >
                  <span className={\`text-[10px] font-body font-semibold uppercase tracking-wide \${isSelected ? '' : 'text-foreground/70'}\`}>
                    {dayShortLabel(d)}
                  </span>
                  <span className="text-xl font-display font-bold leading-none">{d.getDate()}</span>
                  {hasData && !isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary absolute bottom-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu de Alternância (Tabs) */}
        <div className="px-5 mt-4 lg:px-0">
          <div className="flex bg-secondary/40 border border-border/60 p-1 rounded-[14px]">
            <button
              onClick={() => { haptic.selection(); setActiveTab('meus'); }}
              className={\`flex-1 py-2 text-sm font-semibold rounded-xl transition-all \${activeTab === 'meus' ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground'}\`}
            >
              Meus
            </button>
            <button
              onClick={() => { haptic.selection(); setActiveTab('metas'); }}
              className={\`flex-1 py-2 text-sm font-semibold rounded-xl transition-all \${activeTab === 'metas' ? 'bg-background text-foreground shadow-sm border border-border/50' : 'text-muted-foreground'}\`}
            >
              Metas do Dia
            </button>
          </div>
        </div>

        {activeTab === 'meus' && (
          <div className="mt-5 space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 pb-[calc(4rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
            
            <div className="space-y-6">
              {/* Bio */}
              <div className="px-5 lg:px-0">
                <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Sobre mim</span>
                    {editingBio ? (
                      <button onClick={saveBio} className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Salvar
                      </button>
                    ) : (
                      <button onClick={() => { setBioDraft(bio); setEditingBio(true); }} className="h-8 px-3 rounded-full bg-background border border-border text-xs font-semibold inline-flex items-center gap-1">
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>
                    )}
                  </div>
                  {editingBio ? (
                    <textarea
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      maxLength={240}
                      placeholder="Diga algo sobre você, sua área do Direito, o que estuda..."
                      className="w-full min-h-[96px] bg-background border border-border rounded-xl p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  ) : (
                    <p className="text-sm text-foreground/90 leading-relaxed min-h-[48px]">
                      {bio || <span className="text-muted-foreground italic">Diga algo sobre você, sua área do Direito, o que estuda...</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Quick access Quadradinhos */}
              <div className="px-5 lg:px-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Acesso rápido</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK.map((q) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={q.label}
                        onClick={() => go(q.path)}
                        onPointerEnter={() => { prefetchRoute(q.path); if (user?.id) prefetchPessoalByPath(qc, user.id, q.path); }}
                        onPointerDown={() => { prefetchRoute(q.path); if (user?.id) prefetchPessoalByPath(qc, user.id, q.path); }}
                        onTouchStart={() => { prefetchRoute(q.path); if (user?.id) prefetchPessoalByPath(qc, user.id, q.path); }}
                        className="aspect-[4/3] rounded-2xl border border-border/60 bg-secondary/30 hover:bg-secondary/60 active:scale-[0.97] transition p-3 flex flex-col items-start justify-between text-left"
                      >
                        <Icon className="w-5 h-5" style={{ color: (q as any).color ?? 'var(--primary)' }} />
                        <span className="text-[12px] font-semibold text-foreground leading-tight">{q.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Minha atividade (feed) */}
            <div className="px-5 lg:px-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 px-1">Histórico em {formatFullDate(new Date(selectedDate + 'T00:00:00'))}</p>
              {eventsOfDay.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma atividade registrada neste dia.
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-secondary/30 divide-y divide-border/50 overflow-hidden">
                  {eventsOfDay.map((it) => {
                    const Icon = KIND_ICON[it.kind] ?? Scale;
                    return (
                      <button
                        key={it.id}
                        onClick={() => it.path && go(it.path)}
                        className="w-full flex items-center gap-3 px-4 py-3 min-h-[64px] text-left hover:bg-secondary/60 active:bg-secondary transition"
                      >
                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                            {KIND_LABEL[it.kind]} · {formatEventLabel(it.ts)}
                          </div>
                          <div className="font-body text-sm font-semibold text-foreground truncate">{it.title}</div>
                          {it.subtitle && <div className="text-xs text-muted-foreground truncate">{it.subtitle}</div>}
                        </div>
                        {it.path && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'metas' && (
          <div className="mt-5 px-5 lg:px-0 pb-[calc(4rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold px-1">Lista de tarefas</p>
            {metas.sort((a,b) => Number(a.done) - Number(b.done)).map(m => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => toggleMeta(m.id)}
                  className={\`w-full flex items-center gap-3 px-4 py-3 min-h-[64px] rounded-2xl border transition-all text-left active:scale-[0.99] \${m.done ? 'bg-secondary/20 border-border/30 opacity-75' : 'bg-secondary/40 border-border/60 shadow-sm'}\`}
                >
                  <div className={\`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 \${m.done ? 'bg-green-500/10 text-green-500' : 'bg-background text-primary'}\`}>
                    {m.done ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                      {m.type}
                    </div>
                    <div className={\`font-body text-sm font-semibold truncate \${m.done ? 'text-muted-foreground line-through' : 'text-foreground'}\`}>
                      {m.title}
                    </div>
                  </div>
                  <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center \${m.done ? 'border-green-500 bg-green-500 text-white' : 'border-muted-foreground/30'}\`}>
                    {m.done && <Check className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {COVER_PICKER_MARKER`;

const startIdx = code.indexOf('<div className="lg:mx-auto lg:w-full lg:max-w-[1200px]');
const endIdx = code.indexOf('{COVER_PICKER_MARKER');

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find replacement markers!");
  console.log({ startIdx, endIdx });
} else {
  code = code.substring(0, startIdx) + newJsxBody + code.substring(endIdx + '{COVER_PICKER_MARKER'.length);
  fs.writeFileSync(filePath, code);
  console.log("File updated successfully.");
}
