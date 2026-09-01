const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'migrations');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

// Track tables and their user_id-like columns
const tablesWithUserId = new Map(); // tableName -> Set of column names
const existingIndexes = new Map(); // tableName -> Set of column names that have indexes
const rlsTables = new Set(); // tables with RLS enabled

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  
  // Find CREATE TABLE with user_id columns
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?["']?(\w+)["']?\s*\(([\s\S]*?)\);/gi;
  let match;
  while ((match = createTableRegex.exec(content)) !== null) {
    const tableName = match[1];
    const body = match[2];
    
    const userIdCols = ['user_id', 'owner_id', 'created_by', 'author_id', 'updated_by', 'sender_id', 'receiver_id', 'assigned_to'];
    for (const col of userIdCols) {
      if (new RegExp(`\\b${col}\\b`, 'i').test(body)) {
        if (!tablesWithUserId.has(tableName)) tablesWithUserId.set(tableName, new Set());
        tablesWithUserId.get(tableName).add(col);
      }
    }
  }

  // Also find ALTER TABLE ... ADD COLUMN user_id
  const alterRegex = /ALTER\s+TABLE\s+(?:public\.)?["']?(\w+)["']?\s+ADD\s+(?:COLUMN\s+)?(\w+)/gi;
  while ((match = alterRegex.exec(content)) !== null) {
    const tableName = match[1];
    const colName = match[2].toLowerCase();
    if (['user_id', 'owner_id', 'created_by', 'author_id', 'updated_by', 'sender_id', 'receiver_id', 'assigned_to'].includes(colName)) {
      if (!tablesWithUserId.has(tableName)) tablesWithUserId.set(tableName, new Set());
      tablesWithUserId.get(tableName).add(colName);
    }
  }

  // Find RLS policies that reference user_id, auth.uid() etc (these tables use user_id in RLS)
  const policyRegex = /CREATE\s+POLICY\s+.*?\s+ON\s+(?:public\.)?["']?(\w+)["']?/gi;
  while ((match = policyRegex.exec(content)) !== null) {
    rlsTables.add(match[1]);
  }
  
  // Also detect ENABLE ROW LEVEL SECURITY
  const rlsRegex = /ALTER\s+TABLE\s+(?:public\.)?["']?(\w+)["']?\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/gi;
  while ((match = rlsRegex.exec(content)) !== null) {
    rlsTables.add(match[1]);
  }

  // Find existing indexes
  const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?\w+["']?\s+ON\s+(?:public\.)?["']?(\w+)["']?\s*(?:USING\s+\w+\s*)?\(([^)]+)\)/gi;
  while ((match = indexRegex.exec(content)) !== null) {
    const tableName = match[1];
    const cols = match[2].toLowerCase();
    
    if (!existingIndexes.has(tableName)) existingIndexes.set(tableName, new Set());
    
    // Parse individual column names from the index definition
    const colNames = cols.split(',').map(c => c.trim().replace(/["']/g, '').split(/\s+/)[0]);
    for (const c of colNames) {
      existingIndexes.get(tableName).add(c);
    }
  }
  
  // Also check for DROP TABLE to remove from tracking
  const dropRegex = /DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?["']?(\w+)["']?/gi;
  while ((match = dropRegex.exec(content)) !== null) {
    tablesWithUserId.delete(match[1]);
    existingIndexes.delete(match[1]);
    rlsTables.delete(match[1]);
  }
}

// Also find tables that are referenced in RLS policies with user_id even if we didn't detect CREATE TABLE
// by looking at all policies
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const policyWithUserIdRegex = /CREATE\s+POLICY\s+.*?\s+ON\s+(?:public\.)?["']?(\w+)["']?.*?(?:user_id|owner_id|created_by|author_id)/gis;
  let match;
  while ((match = policyWithUserIdRegex.exec(content)) !== null) {
    const tableName = match[1];
    if (!tablesWithUserId.has(tableName)) tablesWithUserId.set(tableName, new Set());
    // Try to detect which column from the policy text
    const policyText = match[0].toLowerCase();
    for (const col of ['user_id', 'owner_id', 'created_by', 'author_id']) {
      if (policyText.includes(col)) {
        tablesWithUserId.get(tableName).add(col);
      }
    }
  }
}

console.log('=== SUPABASE INDEX AUDIT ===');
console.log(`Tables with user_id-like columns: ${tablesWithUserId.size}`);
console.log(`Tables with RLS enabled: ${rlsTables.size}`);
console.log(`Tables with existing indexes: ${existingIndexes.size}`);
console.log('');

// Find missing indexes
const missingIndexes = [];
const existingOnes = [];

for (const [table, cols] of tablesWithUserId) {
  // Only care about tables with RLS
  if (!rlsTables.has(table)) continue;
  
  for (const col of cols) {
    const tableIndexes = existingIndexes.get(table);
    if (!tableIndexes || !tableIndexes.has(col)) {
      missingIndexes.push({ table, col });
    } else {
      existingOnes.push({ table, col });
    }
  }
}

console.log(`✅ Tables WITH index on user_id column: ${existingOnes.length}`);
for (const { table, col } of existingOnes) {
  console.log(`   ✅ ${table}.${col}`);
}

console.log('');
console.log(`❌ Tables WITHOUT index on user_id column: ${missingIndexes.length}`);
for (const { table, col } of missingIndexes) {
  console.log(`   ❌ ${table}.${col}`);
}

// Generate migration SQL
if (missingIndexes.length > 0) {
  console.log('');
  console.log('=== GENERATED MIGRATION SQL ===');
  console.log('');
  
  const sqlLines = [];
  sqlLines.push('-- Migration: Add missing indexes on user_id columns for RLS performance');
  sqlLines.push('-- Generated automatically by audit_indexes.cjs');
  sqlLines.push('');
  
  for (const { table, col } of missingIndexes) {
    const indexName = `idx_${table}_${col}`;
    sqlLines.push(`CREATE INDEX IF NOT EXISTS ${indexName} ON public.${table} (${col});`);
  }
  
  const sqlContent = sqlLines.join('\n');
  console.log(sqlContent);
  
  // Save to file
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
  const migrationFile = path.join(dir, `${timestamp}_add_missing_user_id_indexes.sql`);
  fs.writeFileSync(migrationFile, sqlContent, 'utf8');
  console.log('');
  console.log(`Migration saved to: ${migrationFile}`);
}
