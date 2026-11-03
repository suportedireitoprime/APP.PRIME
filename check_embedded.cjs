const https = require('https');
const fs = require('fs');

https.get('https://drive.google.com/embeddedfolderview?id=1y-uJSUw_MMP29rQjsFXKlNqVv5EVNXwl#list', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    fs.writeFileSync('embedded_folderview.html', d, 'utf-8');
    console.log('Saved embedded_folderview.html, size:', d.length);
  });
});

