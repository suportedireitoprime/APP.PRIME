const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const functionsDir = path.join(__dirname, 'supabase', 'functions');
const dirs = fs.readdirSync(functionsDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== '_shared')
  .map(d => d.name);

const results = {};
console.log(`Analyzing ${dirs.length} functions...`);

for (let i = 0; i < dirs.length; i++) {
  const func = dirs[i];
  if (i % 20 === 0) console.log(`Progress: ${i}/${dirs.length}`);
  try {
    const cmd = `git grep -l "${func}" src/ supabase/migrations/ supabase/functions/`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim().split('\n').filter(Boolean);
    const externalReferences = output.filter(f => !f.startsWith(`supabase/functions/${func}/`));
    results[func] = externalReferences;
  } catch (e) {
    // git grep returns exit code 1 if no matches found
    results[func] = [];
  }
}

fs.writeFileSync('functions_analysis.json', JSON.stringify(results, null, 2));
console.log('Analysis complete. Wrote to functions_analysis.json');
