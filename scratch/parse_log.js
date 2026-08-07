import fs from 'fs';

const lines = fs.readFileSync('scratch/found_lines.txt', 'utf-8').split('\n');
console.log('Total de linhas:', lines.length);

const allPosts = new Map();

for (const line of lines) {
  // Procura por JSON array no result de execute_sql
  const matchResult = line.match(/\[\{\"id\":[\s\S]*?\}\]/);
  if (matchResult) {
    try {
      const arr = JSON.parse(matchResult[0]);
      if (Array.isArray(arr)) {
        arr.forEach(p => {
          if (p.id && p.titulo) allPosts.set(p.id, p);
        });
      }
    } catch (e) {}
  }
}

console.log('Posts distintos recuperados:', allPosts.size);
const postsArray = Array.from(allPosts.values());
fs.writeFileSync('scratch/recovered_old_posts.json', JSON.stringify(postsArray, null, 2));

postsArray.forEach(p => console.log(p.id, '->', p.titulo));
