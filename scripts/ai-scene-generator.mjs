import fs from 'fs/promises';
import path from 'path';

// Pega o número do artigo vindo dos argumentos (ex: node ai-scene-generator.mjs 5)
const articleNumber = process.argv[2];
if (!articleNumber) {
  console.error("Erro: Número do artigo não fornecido.");
  process.exit(1);
}

const geminiKey = process.env.GEMINI_API_KEY;
if (!geminiKey) {
  console.error("Erro: GEMINI_API_KEY não está definida nas variáveis de ambiente.");
  process.exit(1);
}

async function run() {
  console.log(`🚀 Iniciando Autocodificação da Cena 3D para o Artigo ${articleNumber}...`);

  // Lendo os templates/regras para o contexto (o one-shot prompt)
  const templatePath = path.resolve('src/components/laboratorio/cenas/CenaArtigo37.tsx');
  const rulesPath = path.resolve('.agents/skills/skill-cena-artigo/SKILL.md');
  
  let templateCode = '';
  let rulesText = '';

  try {
    templateCode = await fs.readFile(templatePath, 'utf8');
    rulesText = await fs.readFile(rulesPath, 'utf8');
  } catch (err) {
    console.warn("Aviso: Falha ao ler um dos arquivos de template/regras.", err.message);
  }

  console.log("🧠 Passo 1: Pensando no Roteiro e Enredo (Brainstorming)...");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
  
  const promptRoteiro = `Você é um diretor de arte 3D. Crie um resumo e roteiro para a Cena 3D do Código Penal Brasileiro, Artigo ${articleNumber}.
Baseie-se na DIRETIVA SUPREMA:
${rulesText}
Descreva:
1. Cenário
2. Atores e posições iniciais
3. Os passos exatos da animação (quem fala o que, para onde andam, efeitos de câmera).
Responda de forma concisa em texto.`;

  const roteiroRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: promptRoteiro }] }],
      generationConfig: { temperature: 0.3 }
    })
  });

  if (!roteiroRes.ok) {
    console.error(`Erro ao gerar roteiro (${roteiroRes.status})`);
    process.exit(1);
  }

  const roteiroData = await roteiroRes.json();
  const roteiroFinal = roteiroData.candidates?.[0]?.content?.parts?.[0]?.text || "Sem roteiro gerado";
  console.log("📜 Roteiro gerado com sucesso. Indo para o Passo 2 (Codificação)...");

  const promptCodigo = `Você é uma IA Programadora Elite Especialista em Three.js e React.
O objetivo é gerar o código-fonte COMPLETO em TypeScript/React para o componente da Cena 3D do Código Penal Brasileiro.

Artigo alvo: Art. ${articleNumber}.

ROTEIRO E ENREDO PLANEJADO (Siga os passos definidos aqui):
${roteiroFinal}

TEMPLATE DE REFERÊNCIA (Para estilo, imports, shaders e arquitetura exata):
\`\`\`tsx
${templateCode}
\`\`\`

SUA MISSÃO:
Crie o arquivo CenaArtigo${articleNumber}.tsx do zero.
- O nome do componente DEVE SER "CenaArtigo${articleNumber}".
- Certifique-se de importar tudo que usar e não cortar o código.
- Coloque os passos do enredo na constante 'sceneSteps'.
- Responda APENAS com o código-fonte válido dentro de um bloco \`\`\`tsx. Nenhuma palavra a mais antes ou depois do bloco.
`;

  console.log("💻 Passo 2: Escrevendo o Código React/Three.js...");

  const codigoRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: promptCodigo }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
    })
  });

  if (!codigoRes.ok) {
    const errText = await codigoRes.text();
    console.error(`Erro da API do Gemini no Código (${codigoRes.status}):`, errText);
    process.exit(1);
  }

  const data = await codigoRes.json();
  const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textOutput) {
    console.error("Erro: Resposta vazia da IA.");
    process.exit(1);
  }

  // Extrair o bloco de código
  const codeMatch = textOutput.match(/```tsx([\s\S]*?)```/) || textOutput.match(/```typescript([\s\S]*?)```/) || textOutput.match(/```([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : textOutput.trim();

  const fileName = `CenaArtigo${articleNumber}.tsx`;
  const filePath = path.resolve(`src/components/laboratorio/cenas/${fileName}`);

  console.log(`💾 Salvando o código gerado em ${filePath}...`);
  await fs.writeFile(filePath, code, 'utf8');

  // AGORA, VAMOS FAZER O AUTO-REGISTRO EM Cena3dFullscreen.tsx!
  await registerSceneInRouter(articleNumber, fileName);
  
  console.log(`✅ CenaArtigo${articleNumber} autocodificada e importada com sucesso!`);
}

async function registerSceneInRouter(artigoNumber, fileName) {
  const routerPath = path.resolve('src/components/vademecum/Cena3dFullscreen.tsx');
  let routerCode = await fs.readFile(routerPath, 'utf8');

  const componentName = `CenaArtigo${artigoNumber}`;

  if (routerCode.includes(componentName)) {
    console.log(`⚠️ ${componentName} já está registrado no router.`);
    return;
  }

  console.log(`🔗 Injetando ${componentName} no roteador Cena3dFullscreen...`);

  const importStatement = `import ${componentName} from "../laboratorio/cenas/${componentName}";\n`;
  const importMatch = routerCode.lastIndexOf('import CenaArtigo');
  
  if (importMatch !== -1) {
    const nextLineEnd = routerCode.indexOf('\n', importMatch) + 1;
    routerCode = routerCode.slice(0, nextLineEnd) + importStatement + routerCode.slice(nextLineEnd);
  } else {
    routerCode = importStatement + routerCode;
  }
  
  // Vamos buscar por `<CenaArtigo3 ` e adicionar na mesma sintaxe ou perto do switch
  const searchPattern = /case\s+["']?3["']?\s*:\s*return\s*<CenaArtigo3\s*[^>]*\/>/g;
  const match = searchPattern.exec(routerCode);
  
  if (match) {
    const insertionPoint = match.index + match[0].length;
    const injection = `\n      case ${artigoNumber}:\n      case "${artigoNumber}":\n        return <${componentName} />;\n`;
    routerCode = routerCode.slice(0, insertionPoint) + injection + routerCode.slice(insertionPoint);
  } else {
    // Procura por qualquer 'return <CenaArtigo' dentro de um switch pra injetar perto
    const searchAnyCase = /case\s+["']?\d+["']?\s*:\s*return\s*<CenaArtigo\d+\s*[^>]*\/>/g;
    const matchAny = searchAnyCase.exec(routerCode);
    if (matchAny) {
       const ins = matchAny.index + matchAny[0].length;
       const injection = `\n      case ${artigoNumber}:\n      case "${artigoNumber}":\n        return <${componentName} />;\n`;
       routerCode = routerCode.slice(0, ins) + injection + routerCode.slice(ins);
    } else {
       console.warn("⚠️ Não foi possível achar a âncora do switch-case no roteador para fazer a injeção do componente.");
    }
  }

  await fs.writeFile(routerPath, routerCode, 'utf8');
  console.log("✅ Roteador atualizado.");
}

run().catch(e => {
  console.error("Erro inesperado:", e);
  process.exit(1);
});
