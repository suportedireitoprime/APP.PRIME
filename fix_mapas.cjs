const fs = require('fs');

const pathHeader = 'C:/Users/ext_wpereira/OneDrive - Vitamina Work Life S.A/Documentos/APP.PRIME/src/components/mapas-mentais/MapasMentaisHeader.tsx';
let headerContent = fs.readFileSync(pathHeader, 'utf8');
headerContent = headerContent.replace(/backgroundColor: '#050505'/g, "backgroundColor: '#0D0D0D'");
fs.writeFileSync(pathHeader, headerContent);

const pathDetalhes = 'C:/Users/ext_wpereira/OneDrive - Vitamina Work Life S.A/Documentos/APP.PRIME/src/components/mapas-mentais/MapasMentaisDetalhes.tsx';
let detalhesContent = fs.readFileSync(pathDetalhes, 'utf8');
detalhesContent = detalhesContent.replace(/text-sm/g, "text-[13px]");
detalhesContent = detalhesContent.replace(/p-4/g, "p-3 sm:p-3.5");
detalhesContent = detalhesContent.replace(/p-3\.5 sm:p-4/g, "p-3 sm:p-3.5");
detalhesContent = detalhesContent.replace(/min-h-\[76px\]/g, "min-h-[64px]");
fs.writeFileSync(pathDetalhes, detalhesContent);

console.log('Fixed MapasMentais');
