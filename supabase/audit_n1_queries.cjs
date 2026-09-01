const fs = require('fs');
const path = require('path');

function walk(dir, results = []) {
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      if (['node_modules', '.git', 'dist', 'supabase', '.agents', 'public'].includes(item)) continue;
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full, results);
      else if (/\.(tsx?|jsx?)$/.test(item)) results.push(full);
    }
  } catch(e) {}
  return results;
}

const srcDir = path.join(__dirname, '..', 'src');
const files = walk(srcDir);
const results = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relFile = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
  
  // Pattern 1: supabase.from() inside for/forEach/map loops
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect loop starts
    if (/\b(for\s*\(|\.forEach\s*\(|for\s+await)/.test(line)) {
      // Check next 20 lines for supabase calls
      for (let j = i + 1; j < Math.min(i + 30, lines.length); j++) {
        if (/supabase.*\.from\s*\(/.test(lines[j]) || /\.from\s*\(.*\).*\.select/.test(lines[j])) {
          results.push({
            file: relFile,
            line: j + 1,
            type: 'QUERY_IN_LOOP',
            severity: 'CRITICAL',
            loopLine: i + 1,
            snippet: lines[j].trim().substring(0, 120)
          });
          break;
        }
        // Stop at closing brace at same level
        if (lines[j].trim() === '}' || lines[j].trim() === '});') break;
      }
    }
  }

  // Pattern 2: Multiple supabase.from() in same function/useEffect
  const fromCallLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (/supabase.*\.from\s*\(/.test(lines[i])) {
      fromCallLines.push(i + 1);
    }
  }
  
  if (fromCallLines.length >= 4) {
    results.push({
      file: relFile,
      line: fromCallLines[0],
      type: 'HIGH_QUERY_COUNT',
      severity: 'WARNING',
      count: fromCallLines.length,
      queryLines: fromCallLines.slice(0, 10)
    });
  }

  // Pattern 3: Queries without caching (useQuery/React Query)
  const hasReactQuery = /useQuery|useSuspenseQuery|useInfiniteQuery/.test(content);
  const hasSupabaseFrom = /supabase.*\.from\s*\(/.test(content);
  const hasUseEffect = /useEffect/.test(content);
  
  if (hasSupabaseFrom && hasUseEffect && !hasReactQuery && fromCallLines.length >= 2) {
    results.push({
      file: relFile,
      line: fromCallLines[0],
      type: 'NO_CACHE_LAYER',
      severity: 'INFO',
      count: fromCallLines.length,
      note: 'Uses useEffect + supabase directly without React Query cache'
    });
  }

  // Pattern 4: Sequential awaits that could be parallel
  for (let i = 0; i < lines.length - 1; i++) {
    if (/await\s+supabase.*\.from/.test(lines[i]) && 
        /await\s+supabase.*\.from/.test(lines[i+1])) {
      results.push({
        file: relFile,
        line: i + 1,
        type: 'SEQUENTIAL_QUERIES',
        severity: 'WARNING',
        snippet: lines[i].trim().substring(0, 80) + ' → ' + lines[i+1].trim().substring(0, 80)
      });
    }
  }

  // Pattern 5: .select('*') - fetching all columns
  for (let i = 0; i < lines.length; i++) {
    const selectStarMatch = lines[i].match(/\.select\s*\(\s*(['"`]\s*\*\s*['"`])\s*\)/);
    if (selectStarMatch) {
      const fromMatch = lines[i].match(/\.from\s*\(\s*['"`](\w+)['"`]\s*\)/);
      results.push({
        file: relFile,
        line: i + 1,
        type: 'SELECT_STAR',
        severity: 'INFO',
        table: fromMatch ? fromMatch[1] : 'unknown',
        snippet: lines[i].trim().substring(0, 120)
      });
    }
  }

  // Pattern 6: Supabase calls inside .map() that returns JSX (query per rendered item)
  for (let i = 0; i < lines.length; i++) {
    if (/\.map\s*\(\s*(?:async\s*)?\(/.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        if (/supabase.*\.from/.test(lines[j])) {
          results.push({
            file: relFile,
            line: j + 1,
            type: 'QUERY_PER_RENDER_ITEM',
            severity: 'CRITICAL',
            mapLine: i + 1,
            snippet: lines[j].trim().substring(0, 120)
          });
          break;
        }
      }
    }
  }
}

// Sort by severity
const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
results.sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));

// Print summary
const critical = results.filter(r => r.severity === 'CRITICAL');
const warnings = results.filter(r => r.severity === 'WARNING');
const infos = results.filter(r => r.severity === 'INFO');

console.log('=============================================');
console.log('   SUPABASE N+1 QUERY AUDIT REPORT');
console.log('=============================================');
console.log('');
console.log(`🔴 CRITICAL: ${critical.length}`);
console.log(`🟡 WARNING:  ${warnings.length}`);
console.log(`🔵 INFO:     ${infos.length}`);
console.log(`   TOTAL:    ${results.length}`);
console.log('');

if (critical.length > 0) {
  console.log('--- 🔴 CRITICAL (N+1 / Query in Loop) ---');
  for (const r of critical) {
    console.log(`  ${r.file}:${r.line} [${r.type}]`);
    if (r.snippet) console.log(`    └─ ${r.snippet}`);
    console.log('');
  }
}

if (warnings.length > 0) {
  console.log('--- 🟡 WARNING (Performance) ---');
  for (const r of warnings) {
    console.log(`  ${r.file}:${r.line} [${r.type}]${r.count ? ` (${r.count} queries)` : ''}`);
    if (r.snippet) console.log(`    └─ ${r.snippet}`);
    if (r.queryLines) console.log(`    └─ Query lines: ${r.queryLines.join(', ')}`);
    console.log('');
  }
}

if (infos.length > 0) {
  console.log('--- 🔵 INFO (Optimization opportunities) ---');
  for (const r of infos) {
    console.log(`  ${r.file}:${r.line} [${r.type}]${r.count ? ` (${r.count} queries)` : ''}${r.table ? ` table:${r.table}` : ''}`);
    if (r.note) console.log(`    └─ ${r.note}`);
    if (r.snippet) console.log(`    └─ ${r.snippet}`);
    console.log('');
  }
}

// Save full JSON report
fs.writeFileSync(path.join(__dirname, 'n1_audit_report.json'), JSON.stringify(results, null, 2));
console.log('Full JSON report saved to supabase/n1_audit_report.json');
