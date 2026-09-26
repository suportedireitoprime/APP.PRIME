const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'ext_wpereira', 'OneDrive - Vitamina Work Life S.A', 'Documentos', 'APP.PRIME', 'src', 'pages', 'Atualizacoes.tsx');
let c = fs.readFileSync(filePath, 'utf8');

// Fix Noticia onClick
c = c.replace(/onClick=\{\(\) => \{ haptic\.selection\(\);\s*\/\* Se tiver rota de noticia especifica \*\/\s*\}\}/g, 
  'onClick={() => { haptic.selection(); Browser.open({ url: noticia.link }); }}');

// Fix "Ver todos" for Noticias Juridicas
c = c.replace(/<div className="flex items-center gap-2">\s*<span className="w-1 h-5 rounded-full bg-\[\#FACC15\]" \/>\s*<h2 className="font-display text-foreground text-\[18px\] font-bold uppercase tracking-widest">\s*Notícias Jurídicas\s*<\/h2>\s*<\/div>\s*<\/div>/g,
  `<div className="flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-[#FACC15]" />
                  <h2 className="font-display text-foreground text-[18px] font-bold uppercase tracking-widest">
                    Notícias Jurídicas
                  </h2>
                </div>
                <button onClick={() => { haptic.light(); Browser.open({ url: 'https://www.migalhas.com.br' }); }} className="flex items-center gap-1 text-[12px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-white font-medium transition-colors active:scale-95 cursor-pointer">Ver todos <ChevronRight className="w-4 h-4" /></button>
              </div>`
);

// Fix "Ver todos" for Concursos Publicos
c = c.replace(/<div className="flex items-center gap-2">\s*<span className="w-1 h-5 rounded-full bg-\[\#10B981\]" \/>\s*<h2 className="font-display text-foreground text-\[18px\] font-bold uppercase tracking-widest">\s*Concursos Públicos\s*<\/h2>\s*<\/div>\s*<\/div>/g,
  `<div className="flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-[#10B981]" />
                  <h2 className="font-display text-foreground text-[18px] font-bold uppercase tracking-widest">
                    Concursos Públicos
                  </h2>
                </div>
                <button onClick={() => { haptic.light(); Browser.open({ url: 'https://www.pciconcursos.com.br/noticias/' }); }} className="flex items-center gap-1 text-[12px] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full text-white font-medium transition-colors active:scale-95 cursor-pointer">Ver todos <ChevronRight className="w-4 h-4" /></button>
              </div>`
);

// Fix the a tag to div for concursos
c = c.replace(/<a\s+key=\{conc.id\}\s+href=\{conc.link\}\s+target="_blank"\s+rel="noopener noreferrer"\s+onClick=\{\(\) => haptic\.selection\(\)\}\s+className="w-\[240px\] h-\[220px\] sm:w-\[280px\] sm:h-\[230px\] shrink-0 snap-start relative overflow-hidden rounded-2xl cursor-pointer active:scale-\[0\.98\] transition-transform block bg-card\/50"\s*>\s*<div className="absolute inset-0 flex items-center justify-center">\s*<GraduationCap className="w-12 h-12 text-white\/10" \/>\s*<\/div>/g,
  `<div
                    key={conc.id} 
                    onClick={() => {
                      haptic.selection();
                      Browser.open({ url: conc.link });
                    }}
                    className="w-[240px] h-[220px] sm:w-[280px] sm:h-[230px] shrink-0 snap-start relative overflow-hidden rounded-2xl cursor-pointer active:scale-[0.98] transition-transform block bg-card/50"
                  >
                    <div className="absolute inset-0 flex items-center justify-center bg-[#10B981]/5 p-8">
                      {conc.imagem_url ? (
                        <img src={conc.imagem_url} alt="" className="w-full h-full object-contain opacity-70 mix-blend-plus-lighter" />
                      ) : (
                        <GraduationCap className="w-12 h-12 text-[#10B981]/20" />
                      )}
                    </div>`
);

// close the a tag
c = c.replace(/<\/div>\s*<\/a>\s*\)\) : \(/g, '</div></div>)) : (');

fs.writeFileSync(filePath, c, 'utf8');
console.log('Done');
