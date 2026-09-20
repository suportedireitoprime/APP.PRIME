const fs = require('fs');
const path = 'src/pages/FlashcardsArea.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes('<div key={item.key} className="w-full flex flex-col">'));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.trim() === '</div>' && lines[i+1].includes('})}'));

if (startIndex === -1 || endIndex === -1) {
  console.log('Indices not found!');
  process.exit(1);
}

const componentLines = lines.slice(startIndex, endIndex + 1);
const body = componentLines.join('\n').replace(/key={item\.key}/, '');

const componentStr = `import React, { memo } from 'react';
import { Layers, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export const FlashcardDeckItem = memo(({ item, i, palette, isLast, coverUrl }: any) => {
  const isLeft = i % 2 === 0;
  return (
` + body + `
  );
});
`;

fs.writeFileSync('src/components/flashcards/FlashcardDeckItem.tsx', componentStr);

const replacement = `                      <FlashcardDeckItem
                        key={item.key}
                        item={item}
                        i={i}
                        palette={palette}
                        isLast={i === itemsToRender.length - 1}
                        coverUrl={coverUrl}
                      />`;

const newLines = [
  ...lines.slice(0, startIndex),
  replacement,
  ...lines.slice(endIndex + 1)
];

const finalContent = "import { FlashcardDeckItem } from '@/components/flashcards/FlashcardDeckItem';\n" + newLines.join('\n');

fs.writeFileSync(path, finalContent);
console.log('Success!');
