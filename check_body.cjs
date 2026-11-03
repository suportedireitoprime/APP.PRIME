const fs = require('fs');

const html = fs.readFileSync('embedded_folderview.html', 'utf-8');
console.log('HTML slice around body:');
const bodyIdx = html.indexOf('<body');
console.log(html.slice(bodyIdx, bodyIdx + 1500));

