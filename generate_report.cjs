const fs = require('fs');

const data = JSON.parse(fs.readFileSync('functions_analysis.json', 'utf8'));

const webhooks = ['asaas-webhook', 'apple-billing-webhook', 'play-billing-webhook', 'onboarding-webhook', 'apply-webhook'];
const tempTest = ['temp-debug', 'temp-secret-extractor', 'temp-send', 'test-audio', 'test-fn'];
const replacedPush = ['push-aleatorio-audio', 'push-aleatorio-blog', 'push-aleatorio-livro', 'push-aleatorio-video', 'push-estudo-madrugada'];

const ok = [];
const doubt = [];
const certain = [];

for (const [func, refs] of Object.entries(data)) {
  if (tempTest.includes(func) || replacedPush.includes(func)) {
    certain.push({ func, reason: 'Temporária, teste ou substituída' });
    continue;
  }
  
  if (refs.length === 0) {
    if (webhooks.includes(func)) {
      ok.push({ func, reason: 'Webhook (chamado externamente)' });
    } else {
      doubt.push({ func, reason: 'Sem referências no código (pode ser webhook, cron não documentado ou lixo)' });
    }
  } else {
    ok.push({ func, reason: `Usada em ${refs.length} arquivo(s)` });
  }
}

let md = `# Análise de Edge Functions\n\n`;

md += `## ✅ OK (Em uso)\n`;
for (const item of ok) {
  md += `- **${item.func}**: ${item.reason}\n`;
}

md += `\n## ⚠️ Em dúvida (Sem referências diretas)\n`;
md += `*Essas funções não são chamadas diretamente pelo frontend ou pelas migrations mapeadas. Precisamos verificar se são chamadas por serviços externos, n8n, Supabase Cron UI, ou se podem ser apagadas.*\n`;
for (const item of doubt) {
  md += `- **${item.func}**\n`;
}

md += `\n## 🗑️ Certeza de inatividade/duplicidade\n`;
for (const item of certain) {
  md += `- **${item.func}**: ${item.reason}\n`;
}

fs.writeFileSync('EdgeFunctionsReport.md', md);
console.log('Report saved to EdgeFunctionsReport.md');
