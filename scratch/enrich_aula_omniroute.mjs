import fs from 'fs';

const OMNIROUTE_URL = 'https://omniroute-production-fb57.up.railway.app/v1/chat/completions';
const API_KEY = 'sk-38e56915733a82fb-ae2ff9-2d6df645';
const MODEL = 'antigravity/gemini-3.8-flash-tiered';

async function enrichSlideWithAI(titulo, corpoOriginal, focoDidatico) {
  const prompt = `Você é um Designer Instrucional de Alto Padrão (Padrão MasterClass, Brilliant e Harvard Law) e Arquiteto de UI/UX Educacional Jurídico.
Estamos transformando os slides de uma aula interativa de Criminologia ("Evolução Histórica: Período Pré-Científico") em uma experiência visual extraordinária.

TÍTULO DO SLIDE: "${titulo}"
FOCO DIDÁTICO DESEJADO: ${focoDidatico}

CONTEÚDO TEXTUAL ORIGINAL DO SLIDE:
${corpoOriginal}

SUA MISSÃO:
Reescreva/enriqueça o corpo HTML deste slide mantendo a narrativa original envolvente, mas incorporando recursos visuais de alto impacto:
1. Uma TABELA COMPARATIVA JURÍDICA (<table class="tabela-comparativa-juridica"> ou table.cmp) com cabeçalhos elegantes, linhas alternadas e destaques em .col-destaque para sintetizar institutos ou confrontos históricos.
2. Um INFOGRÁFICO DE FLUXO (<div class="infografico-fluxo"><div class="fluxo-etapas">...) com cards (.fluxo-card, .fluxo-card.destaque, .fluxo-badge, .fluxo-seta) OU um GRAFO DE CAUSA E EFEITO (<div class="grafo-causa-efeito"><div class="grafo-titulo">...</div><div class="grafo-pilares"><div class="grafo-pilar">...</div></div></div>).
3. Um CARD DE RAIO-X DE CONCURSO (<div class="alerta-concurso-card"><div class="alerta-header">⚠️ RAIO-X PARA CONCURSOS & OAB</div><p>...</p></div>) explicando como bancas (FGV, CESPE, VUNESP) formulam pegadinhas sobre este tópico.
4. Preservar ou enriquecer os boxes clássicos (.box .exemplo, .frasechave, etc.).
5. Mantenha os termos-chave envoltos em <b class="term"> ou <b>.

IMPORTANTE:
- Responda APENAS com o código HTML limpo resultante, sem introdução, sem explicações extras e sem blocos markdown (\`\`\`html ou \`\`\`). Retorne diretamente o HTML.`;

  console.log(`[OmniRoute] Enviando slide: "${titulo}"...`);
  
  const response = await fetch(OMNIROUTE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.25
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro na API OmniRoute: ${response.status} - ${errText}`);
  }

  const json = await response.json();
  let content = json.choices[0].message.content.trim();
  
  // Limpar possíveis crases markdown
  if (content.startsWith('```html')) {
    content = content.replace(/^```html\s*/i, '').replace(/```$/i, '').trim();
  } else if (content.startsWith('```')) {
    content = content.replace(/^```\s*/, '').replace(/```$/, '').trim();
  }

  console.log(`[OmniRoute] Sucesso no slide: "${titulo}" (tamanho retornado: ${content.length} caracteres)`);
  return content;
}

async function main() {
  const filePath = 'src/data/aulasConteudoRealData.ts';
  console.log('[Main] Lendo arquivo de dados...');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Encontrar onde está a aula penal-02-01
  const aulaMatch = fileContent.match(/"penal-02-01":\s*\{[\s\S]*?"slides":\s*\[/);
  if (!aulaMatch) {
    console.error('Aula penal-02-01 não encontrada!');
    return;
  }

  // Lista dos slides-alvo com foco didático
  const alvos = [
    {
      titulo: "Antes de existir ciência",
      foco: "Infográfico de linha do tempo conceitual com os 4 períodos da explicação do crime antes da ciência (Fé/Religião ➔ Teologia Moral ➔ Crítica Social ➔ Aparência Corporal) + Tabela Comparativa de Período Pré-Científico vs Período Científico + Card de Alerta de Concurso."
    },
    {
      titulo: "O Código de Hamurabi",
      foco: "Infográfico de transição da Vingança Privada Ilimitada para o Talião proporcional + Tabela Comparativa Analítica (Vingança Primitiva vs Hamurabi com critérios de limite, igualdade e base teocrática) + Card Alerta de Concurso desmistificando a igualdade material."
    },
    {
      titulo: "O delito era tabu e pecado",
      foco: "Tabela comparativa tridimensional (Delito como Tabu vs Delito como Pecado vs Delito Moderno Legal) + Grafo de Causa e Efeito da punição física como reparação divina + Alerta de prova."
    },
    {
      titulo: "Thomas Morus e a Utopia",
      foco: "Grafo de Causa e Efeito com os 3 pilares estruturais (Concentração de Riqueza ➔ Desorganização Social e Miséria ➔ Delinquência como sintoma) + Card Raio-X de Banca (Morus como pioneiro da Sociologia Criminal antes do Positivismo)."
    },
    {
      titulo: "A riqueza como raiz dos males",
      foco: "Tabela comparativa direta: Paradigma Individualista Clássico (Livre Arbítrio/Culpa Moral) vs Paradigma Social de Morus (Fatores Estruturais e Econômicos) + Alerta de Prova."
    },
    {
      titulo: "Nasce a fisionomia",
      foco: "Infográfico das premissas fisionômicas de Juan Batista e Kaspar Lavater + Grafo de relação Fenótipo ➔ Caráter Psicológico ➔ Criminoso Nato + Alerta de prova sobre quem são os autores."
    },
    {
      titulo: "Della Porta e os animais selvagens",
      foco: "Tabela Comparativa de Traços Anatômicos e equivalência zoológica na visão de Della Porta + Card sobre o apoio do Imperador Valério e como bancas cobram essa chancela estatal."
    },
    {
      titulo: "Condenado pelo rosto",
      foco: "Destaque formal da sentença pré-científica ('ouvidas as testemunhas e observada a face e cabeça...') + Tabela de Confronto: Valoração Probatória Pré-Científica vs Princípios Constitucionais Modernos (Direito Penal do Fato vs Direito Penal do Autor)."
    },
    {
      titulo: "A cranioscopia de Gall e Spurzheim",
      foco: "Infográfico de fluxo epistemológico da passagem da face (Fisionomia) para a caixa cerebral (Cranioscopia) + Grafo Conceitual das Saliências Cranianas."
    },
    {
      titulo: "O mapa do crânio",
      foco: "Tabela Mnemônica dos Quadrantes do Mapa de Gall (Polo Virtuoso vs Polo Corrupto/Rebelde) + Card de Alerta de Concurso desfazendo a confusão clássica Gall x Lombroso."
    },
    {
      titulo: "A frenologia e o corpo inteiro",
      foco: "Infográfico da Escada Evolutiva Biológica: [Fisionomia (Rosto)] ➔ [Cranioscopia (Crânio)] ➔ [Frenologia (Corpo Todo)] ➔ [Neurofisiologia (Cérebro/Personalidade Psicopática)] + Tabela de Síntese."
    }
  ];

  console.log(`[Main] Alvos definidos: ${alvos.length} slides teóricos prioritários.`);

  // Vamos carregar o objeto da aula fazendo parsing cirúrgico
  // Extrair o bloco de penal-02-01
  const startIdx = fileContent.indexOf('"penal-02-01": {');
  // Encontrar o fechamento da aula penal-02-01
  let depth = 0;
  let endIdx = -1;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < fileContent.length; i++) {
    const char = fileContent[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }
  }

  if (endIdx === -1) {
    throw new Error('Não foi possível delimitar o JSON da aula penal-02-01');
  }

  const rawAulaStr = fileContent.substring(startIdx + '"penal-02-01": '.length, endIdx);
  const aulaObj = JSON.parse(rawAulaStr);
  console.log(`[Main] Aula carregada com sucesso! Total de slides: ${aulaObj.slides.length}`);

  let slidesModificados = 0;

  for (const alvo of alvos) {
    const slide = aulaObj.slides.find(s => s.titulo === alvo.titulo && s.tipo === 'Conteúdo');
    if (slide) {
      console.log(`\n--- Processando: ${slide.titulo} ---`);
      try {
        const enrichedHtml = await enrichSlideWithAI(slide.titulo, slide.corpo, alvo.foco);
        if (enrichedHtml && enrichedHtml.length > 100) {
          slide.corpo = enrichedHtml;
          slidesModificados++;
        }
      } catch (err) {
        console.error(`Erro ao enriquecer slide "${slide.titulo}":`, err.message);
      }
    } else {
      console.warn(`Slide "${alvo.titulo}" não encontrado como tipo Conteúdo!`);
    }
  }

  console.log(`\n[Main] Total de slides enriquecidos: ${slidesModificados}`);

  if (slidesModificados > 0) {
    const newAulaStr = JSON.stringify(aulaObj, null, 2);
    // Indentar para manter a estética do arquivo
    const indentedAulaStr = newAulaStr.split('\n').map((line, idx) => idx === 0 ? line : '  ' + line).join('\n');
    const newFileContent = fileContent.substring(0, startIdx + '"penal-02-01": '.length) + indentedAulaStr + fileContent.substring(endIdx);
    
    fs.writeFileSync(filePath, newFileContent, 'utf8');
    console.log('[Main] Arquivo src/data/aulasConteudoRealData.ts atualizado com sucesso!');
  }
}

main().catch(console.error);

