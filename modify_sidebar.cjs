const fs = require('fs');
const path = require('path');
const p = path.resolve('src/components/vademecum/desktop/DesktopSidebar.tsx');
let content = fs.readFileSync(p, 'utf-8');

// The multi_replace_file_content already replaced chunk 0.
// Let's check if the oldAside is still there. If not, maybe it partially updated.
const oldAside = '<aside \n        onMouseEnter={() => setIsHovered(true)}\n        onMouseLeave={() => setIsHovered(false)}\n        className={`fixed top-0 left-0 h-screen ${collapsed ? \'w-[72px]\' : \'w-[268px]\'} bg-background border-r border-border/50 flex flex-col overflow-hidden shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-50`} \n        style={{ transitionProperty: \'width\', transitionDuration: \'320ms\', transitionTimingFunction: \'cubic-bezier(0.22, 0.61, 0.36, 1)\' }}>';
// Wait, the previous replace worked partially for the aside part!

// Let's just fix the buttons in the Header – user profile block.
const headerBlockOld = `        {/* Header – user profile */}
        <div className="p-3 border-b border-border">
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => setCollapsed(false)}
              className="w-10 h-10 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors shrink-0"
              title="Expandir menu"
              aria-label="Expandir menu lateral"
            >
              <Menu className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </button>
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-primary/15 flex items-center justify-center border-2 border-primary/40 mx-auto">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} onError={() => setAvatarBroken(true)} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-lg font-bold text-primary">{initial}</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden bg-primary/15 flex items-center justify-center border-2 border-primary/40 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} onError={() => setAvatarBroken(true)} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-lg font-bold text-primary" aria-hidden="true">{initial}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-base text-foreground leading-tight truncate">{displayName}</h1>
              <p className="text-[11px] font-body text-muted-foreground truncate">{profissao}</p>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors shrink-0"
              title="Recolher menu"
              aria-label="Recolher menu lateral"
              aria-expanded={true}
            >
              <PanelLeftClose className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            </button>
          </div>
        )}`;

const headerBlockNew = `        {/* Header – user profile */}
        <div className="h-[104px] flex items-center px-4 shrink-0 border-b border-border/50">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary/15 flex items-center justify-center border-2 border-transparent hover:border-primary/50 transition-colors shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} onError={() => setAvatarBroken(true)} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-lg font-bold text-primary" aria-hidden="true">{initial}</span>
              )}
            </div>
            {!collapsed && (
              <div className="ml-4 flex flex-col truncate">
                <h1 className="font-display text-base font-bold text-foreground leading-tight truncate">{displayName}</h1>
                <p className="text-[11px] font-body text-muted-foreground truncate">{profissao}</p>
              </div>
            )}
        </div>`;

content = content.replace(headerBlockOld, headerBlockNew);

// Add closing div for the new wrapper
const lastAsideIndex = content.lastIndexOf('</aside>');
if (lastAsideIndex !== -1 && !content.includes('</div>\\n    {catSheet')) {
    content = content.slice(0, lastAsideIndex + 8) + '\\n    </div>' + content.slice(lastAsideIndex + 8);
}

fs.writeFileSync(p, content, 'utf-8');
