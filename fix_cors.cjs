const fs = require('fs');
const path = require('path');

const targetStr = 'npm:@supabase/supabase-js@2/cors';
const replacementStr = 'https://esm.sh/@supabase/supabase-js@2.100.0/cors'; // Actually, there is no cors module in supabase-js. We should replace the whole import and define corsHeaders inline.

// A better way is to replace `import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";` (and single quotes too)
// with `const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };`

const regex = /import\s*\{\s*corsHeaders\s*\}\s*from\s*['"]npm:@supabase\/supabase-js@2\/cors['"];?/g;
const replacement = `const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};`;

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (regex.test(content)) {
        console.log('Fixing:', fullPath);
        const newContent = content.replace(regex, replacement);
        fs.writeFileSync(fullPath, newContent, 'utf8');
      }
    }
  }
}

walkDir(path.join(__dirname, 'supabase', 'functions'));
console.log('Done!');
