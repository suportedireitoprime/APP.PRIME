const fs = require('fs');
const file = 'C:/Users/ext_wpereira/OneDrive - Vitamina Work Life S.A/Documentos/APP.PRIME/src/components/resumos/ResumosHero.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace HeroCoverCarousel with full image
content = content.replace(
  '<HeroCoverCarousel covers={PHILOSOPHER_COVER} forcePosition="right" />',
  `<div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img 
          src="/resumos-philosopher.jpg" 
          alt=""
          className="w-full h-full object-cover opacity-90 object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      </div>`
);

// Add top margin to the title
content = content.replace(
  'pt-8 sm:pt-10 flex-1 flex flex-col justify-start min-h-[100px]',
  'pt-24 sm:pt-28 flex-1 flex flex-col justify-start min-h-[100px]'
);

fs.writeFileSync(file, content);
console.log('Done!');
