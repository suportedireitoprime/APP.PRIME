import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
const files = fs.readdirSync(migrationsDir).sort();

const tables = new Map();

files.forEach(file => {
    if (!file.endsWith('.sql')) return;
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    // Extract CREATE TABLE
    const createTableRegex = /CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?["']?([a-zA-Z0-9_]+)["']?/gi;
    let match;
    while ((match = createTableRegex.exec(content)) !== null) {
        const tableName = match[1];
        if (!tables.has(tableName)) {
            tables.set(tableName, { rlsEnabled: false, policies: [], hasFkIndexes: true }); // simplified
        }
    }

    // Extract ALTER TABLE ... ENABLE ROW LEVEL SECURITY
    const enableRlsRegex = /ALTER TABLE (?:IF EXISTS )?(?:public\.)?["']?([a-zA-Z0-9_]+)["']? ENABLE ROW LEVEL SECURITY/gi;
    while ((match = enableRlsRegex.exec(content)) !== null) {
        const tableName = match[1];
        if (tables.has(tableName)) {
            tables.get(tableName).rlsEnabled = true;
        }
    }

    // Extract CREATE POLICY
    const createPolicyRegex = /CREATE POLICY ["']?([^"']+)["']? ON (?:public\.)?["']?([a-zA-Z0-9_]+)["']? FOR (SELECT|INSERT|UPDATE|DELETE|ALL) TO (.*?) USING \((.*?)\)(?: WITH CHECK \((.*?)\))?/gi;
    while ((match = createPolicyRegex.exec(content)) !== null) {
        const policyName = match[1];
        const tableName = match[2];
        const action = match[3];
        const toRole = match[4];
        const usingClause = match[5];
        const withCheckClause = match[6] || null;

        if (tables.has(tableName)) {
            tables.get(tableName).policies.push({
                name: policyName,
                action,
                toRole,
                usingClause,
                withCheckClause,
                file
            });
        }
    }
});

console.log("=== TABLES WITHOUT RLS ===");
for (const [tableName, tableData] of tables.entries()) {
    if (!tableData.rlsEnabled && !tableName.startsWith('pg_') && !tableName.startsWith('sql_')) {
        console.log(`- ${tableName}`);
    }
}

console.log("\n=== POLICIES WITH DEPRECATED auth.role() ===");
for (const [tableName, tableData] of tables.entries()) {
    for (const policy of tableData.policies) {
        if (policy.usingClause && policy.usingClause.includes('auth.role()')) {
            console.log(`- Table ${tableName}: Policy '${policy.name}' uses auth.role()`);
        }
    }
}

console.log("\n=== UPDATE POLICIES WITHOUT 'WITH CHECK' ===");
for (const [tableName, tableData] of tables.entries()) {
    for (const policy of tableData.policies) {
        if (policy.action.toUpperCase() === 'UPDATE' && !policy.withCheckClause) {
            console.log(`- Table ${tableName}: UPDATE Policy '${policy.name}' missing WITH CHECK`);
        }
    }
}
