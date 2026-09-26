const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'ext_wpereira', 'OneDrive - Vitamina Work Life S.A', 'Documentos', 'APP.PRIME', 'src', 'components', 'vademecum', 'overlays', 'SearchOverlay.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove framer-motion imports
content = content.replace(/import\s+\{[^}]*\}\s+from\s+['"]framer-motion['"];\r?\n/, '');

// 2. Remove useDragControls and useReducedMotion hooks
content = content.replace(/\s*const dragControls = useDragControls\(\);\r?\n/, '');
content = content.replace(/\s*const shouldReduceMotion = useReducedMotion\(\);\r?\n/, '');

// 3. Remove dragControls prop from PrimeBottomSheet
content = content.replace(/dragControls=\{dragControls\}\r?\n\s*/, '');

// 4. Remove onPointerDown from the drag handle
content = content.replace(/onPointerDown=\{[^}]+\}\r?\n\s*/, '');

// 5. Replace <AnimatePresence> and <motion.button> with CSS animated div/button
content = content.replace(/<AnimatePresence[^>]*>\s*([\s\S]*?)\s*<\/AnimatePresence>/g, (match, innerContent) => {
  let newInner = innerContent.replace(/<motion\.button/g, '<button');
  newInner = newInner.replace(/<\/motion\.button>/g, '</button>');
  
  // Remove framer-motion specific props
  newInner = newInner.replace(/\s*layout\r?\n/g, '');
  newInner = newInner.replace(/\s*initial=\{[^}]+\}\r?\n/g, '');
  newInner = newInner.replace(/\s*animate=\{[^}]+\}\r?\n/g, '');
  newInner = newInner.replace(/\s*transition=\{[^}]+\}\r?\n/g, '');
  
  // Add CSS animation classes
  newInner = newInner.replace(/className="w-full flex items-center/g, 
    'className="w-full flex items-center animate-in fade-in slide-in-from-right-4" style={{ animationFillMode: \'both\', animationDelay: `${i * 30}ms` }} className="w-full flex items-center'
  );
  
  // Clean up the double className
  newInner = newInner.replace(/className="[^"]+"\s+className="/g, 'className="');
  
  return `<div className="flex flex-col gap-2">\n${newInner}\n</div>`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('SearchOverlay refactored successfully.');
