const fs = require('fs');

let content = fs.readFileSync('src/components/vademecum/roteiros.ts', 'utf-8');

function extractTexts(content, name, version) {
  const regex = new RegExp(name + '_ROTEIROS.*?\\s*'+version+': \\[([\\s\\S]*?)\\]', 'g');
  const match = regex.exec(content);
  if (!match) return [];
  const items = match[1].match(/text: "(.*?)"/g) || [];
  return items.map(i => i.replace('text: "', '').replace('"', ''));
}

let newFileContent = `export interface RoteiroItem {
  frame: number;
  text: string;
  duration: number;
}

export function buildDynamicRoteiro(texts: string[]): RoteiroItem[] {
  let currentFrame = 5;
  return texts.map(text => {
    const wordCount = text.split(/\\s+/).length;
    // 14 frames per word, plus 60 frames (2s) pause. Max reading speed matching.
    const duration = Math.max(180, wordCount * 14 + 60);
    const item = { frame: currentFrame, text, duration };
    currentFrame += duration;
    return item;
  });
}

`;

const names = ['SOCRATES', 'PLATAO', 'ARISTOTELES'];
names.forEach(name => {
  newFileContent += `export const ${name}_ROTEIROS: Record<number, RoteiroItem[]> = {\n`;
  for(let v=1; v<=3; v++) {
    const texts = extractTexts(content, name, v);
    newFileContent += `  ${v}: buildDynamicRoteiro([\n`;
    texts.forEach(t => {
      newFileContent += `    "${t}",\n`;
    });
    newFileContent += `  ]),\n`;
  }
  newFileContent += `};\n\n`;
});

fs.writeFileSync('src/components/vademecum/roteiros.ts', newFileContent);
console.log('Done');
