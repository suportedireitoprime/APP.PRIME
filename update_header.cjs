const fs = require('fs');
let code = fs.readFileSync('src/components/vademecum/home/HomeHeaderHero.tsx', 'utf8');

const regex = /<div[\s\S]*?className="bg-hero-panel[\s\S]*?<HomeActionShortcuts \/>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const replacement = `      {/* Shell principal com design premium e gradientes suaves */}
      <div
        className="relative overflow-hidden pt-[var(--sai-top,env(safe-area-inset-top,0px))] flex flex-col z-20"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Imagem de Fundo (Hero) */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroEstudanteImg}
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="w-full h-[120%] object-cover object-[center_top] md:object-center opacity-40 mix-blend-luminosity"
          />
          {/* Overlay gradiente escurecendo a imagem suavemente de cima para baixo */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D0D0D]/60 via-[#0D0D0D]/80 to-[#0D0D0D] z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/40 to-transparent mix-blend-overlay z-10" />
          <div className="absolute inset-0 opacity-10 z-10" style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />
        </div>

        {/* Botoes Superiores */}
        <header className={\`relative z-20 pointer-events-none transition-all duration-300 \${
          hasTopBanner 
            ? 'pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] sm:pt-[calc(1rem+var(--sai-top,env(safe-area-inset-top,0px)))]'
            : 'pt-[calc(1.35rem+var(--sai-top,env(safe-area-inset-top,0px)))] md:pt-[calc(1.5rem+var(--sai-top,env(safe-area-inset-top,0px)))]'
        }\`}>
          <div className="pointer-events-auto px-4 pb-2 pt-2 flex items-center justify-end gap-2 sm:gap-3">
            <button
              onClick={() => { haptic.light(); setNotifOpen(true); }}
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70 relative"
            >
              <Bell className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none flex items-center justify-center border border-neutral-900 shadow">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button
              onPointerDown={() => { import('@/components/vademecum/navigation/SideMenu').catch(() => {}); }}
              onClick={() => { haptic.light(); (onOpenMenu || (() => setMenuOpen(true)))(); }}
              className="grid w-12 h-12 sm:w-[52px] sm:h-[52px] shrink-0 place-items-center rounded-full bg-black/40 border border-white/10 text-white backdrop-blur-md transition-colors hover:bg-black/60 active:opacity-70"
            >
              <MenuIcon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
            </button>
          </div>
        </header>

        {/* Marca / Logo Centralizada */}
        <div className={\`relative z-20 flex-1 flex flex-col items-center justify-center text-center pb-6 \${
          hasTopBanner ? 'pt-2 sm:pt-4' : 'pt-6 sm:pt-8'
        }\`}>
          <HomeBrandBanner />
        </div>

        {/* Atalhos */}
        <div className="relative z-30 px-4 sm:px-6 pb-6 w-full max-w-[500px] mx-auto">
          <HomeActionShortcuts />
        </div>

      </div>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/vademecum/home/HomeHeaderHero.tsx', code);
