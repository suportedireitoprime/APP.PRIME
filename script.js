const fs = require('fs');
const file = 'c:/Users/ext_wpereira/OneDrive - Vitamina Work Life S.A/Documentos/APP.PRIME/src/pages/VideoaulasCategorias.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<PageHeader\n        title="Categorias"',
  '<PageHeader\n        onBack={() => navigate(-1)}\n        title="Categorias"'
);

const shineDiv = 
                <motion.div variants={{ hidden: { x: '-100%' }, show: { x: '200%', transition: { duration: 1.5, ease: 'easeInOut' } } }} className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 z-30 pointer-events-none" />;

content = content.replace(/<ThumbImg/g, shineDiv.trim() + '\n                <ThumbImg');

const searchStr =                       <div className="mt-2 flex items-center justify-between text-white/80 group-hover:text-white transition-colors">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                          <Video className="h-3.5 w-3.5" />
                          {info?.total ? \\ aulas\ : '—'}
                        </span>
                        {info?.concluidas ? <span className="text-[10px] text-white/60 font-medium">{info.pct}% assistido</span> : null}
                      </div>;

const replaceStr =                       <div className="mt-2 flex items-center justify-between text-white/80 group-hover:text-white transition-colors">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white">
                          <Video className="h-3.5 w-3.5" />
                          {info?.total ? \\ aulas\ : '—'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {info?.concluidas ? <span className="text-[10px] text-white/60 font-medium">{info.pct}% assistido</span> : null}
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>;

content = content.split(searchStr).join(replaceStr);

fs.writeFileSync(file, content, 'utf8');
console.log('Categorias updated');
