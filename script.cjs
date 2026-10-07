const fs = require('fs');
let content = fs.readFileSync('features.js', 'utf-8');
content = content.replace(/icon:\s*([a-zA-Z0-9_]+)/g, "icon: '$1'");
const features = eval(content.replace('module.exports = ', ''));

const cores = [
  'from-rose-600 to-amber-600',
  'from-amber-500 to-orange-500',
  'from-primary to-rose-600',
  'from-blue-500 to-indigo-600',
  'from-cyan-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-teal-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-pink-600',
  'from-orange-500 to-red-500',
  'from-indigo-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-rose-500 to-primary',
  'from-yellow-500 to-orange-500',
  'from-green-500 to-emerald-500',
  'from-cyan-400 to-blue-500',
  'from-violet-500 to-purple-600',
  'from-red-500 to-orange-500'
];

let out = 'const BENEFICIOS: BeneficioTimelineItem[] = [\n';
features.forEach((f, i) => {
  out += `  {
    id: 'feat_${i}',
    numero: '${String(i+1).padStart(2, '0')}',
    titulo: '${f.category}',
    categoria: 'RECURSO INCLUSO',
    badge: '${f.badge}',
    cor: '${cores[i % cores.length]}',
    icon: ${f.icon},
    funcoes: [\n      ${f.features.map(feat => `'${feat}'`).join(',\n      ')}\n    ],
    descricaoPersuasiva: '',
    impacto: 'Acesso Imediato'
  },\n`;
});
out += '];\n';
fs.writeFileSync('new_beneficios.ts', out);
