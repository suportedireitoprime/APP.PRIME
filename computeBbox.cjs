const fs = require('fs');
const content = fs.readFileSync('src/lib/brazilStatesMap.ts', 'utf8');
const data = JSON.parse(content.replace('export default ', ''));

data.locations.forEach(loc => {
  let x = 0, y = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const matches = loc.path.match(/[a-zA-Z]+|[+-]?\d*\.?\d+(?:[eE][+-]?\d+)?/g);
  for(let i=0; i<matches.length; ) {
    let m = matches[i++];
    if (m.toLowerCase() === 'm') {
      x = parseFloat(matches[i++]);
      y = parseFloat(matches[i++]);
    } else if (m.toLowerCase() === 'z') {
      continue;
    } else {
      let dx = parseFloat(m);
      let dy = parseFloat(matches[i++]);
      x += dx;
      y += dy;
    }
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  // Add some padding to viewBox
  const padding = 5;
  loc.viewBox = `${minX - padding} ${minY - padding} ${(maxX - minX) + padding*2} ${(maxY - minY) + padding*2}`;
});

fs.writeFileSync('src/lib/brazilStatesMap.ts', 'export default ' + JSON.stringify(data, null, 2) + ';');
console.log('Done');
