const fs = require('fs');
let content = fs.readFileSync('src/components/vademecum/overlays/SearchOverlay.tsx', 'utf8');
content = content.replace(/const debouncedQuery = useDebounce\(query, 100\);/g, 'const debouncedQuery = useDebounce(query, 300);');
fs.writeFileSync('src/components/vademecum/overlays/SearchOverlay.tsx', content);
