const fs = require('fs');

const html = fs.readFileSync('C:/Users/ext_wpereira/.gemini/antigravity-ide/brain/7d3135ba-0f9c-4d35-9cd0-40b52a747717/.system_generated/steps/1531/content.md', 'utf8');
const items = html.split('<li><a href="');
for (let i = 1; i < 6; i++) {
  const item = items[i];
  const imgSrcMatch = item.match(/data-src="([^"]+)"/);
  console.log('Item', i, 'Image:', imgSrcMatch ? imgSrcMatch[1] : null);
}
