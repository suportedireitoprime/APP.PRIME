const text = `
## Enunciado da Atividade:

"O condomínio edilício e a massa falida são classificados no direito civil como entes \`[ LACUNA 1 ]\`. Embora não constem no rol de pessoas jurídicas do art. 44 do Código Civil, o Código de Processo Civil expressamente lhes confere capacidade \`[ LACUNA 2 ]\`. Em juízo, o condomínio atua devidamente representado pelo \`[ LACUNA 3 ]\`."

## Opções do Menu Suspenso:

*   **Para a Lacuna 1:** \`[ despersonalizados ]\` | \`[ soberanos ]\` | \`[ ilícitos ]\`
*   **Para a Lacuna 2:** \`[ processual ]\` | \`[ tributária plena ]\` | \`[ matrimonial ]\`
*   **Para a Lacuna 3:** \`[ síndico ]\` | \`[ juiz de paz ]\` | \`[ porteiro ]\`

## Gabarito Comentado:

1.  **despersonalizados**: Possuem patrimônio ou finalidade coletiva de fato, mas não têm registro como pessoa jurídica autônoma.
2.  **processual**: É a aptidão de figurar como autor ou réu em uma ação judicial.
3.  **síndico**: É o representante legal do condomínio eleito pela assembleia geral (art. 75, XI, CPC).
`;

function parseInteractiveLacunas(content) {
  const sections = {
    enunciado: '',
    opcoes: {},
    gabarito: ''
  };

  // Extract Enunciado
  const enunciadoMatch = content.match(/(?:#*\s*Enunciado da Atividade:?)([\s\S]*?)(?:#*\s*Opções do Menu Suspenso:?)/i);
  if (enunciadoMatch) {
    sections.enunciado = enunciadoMatch[1].trim();
  }

  // Extract Opções
  const opcoesMatch = content.match(/(?:#*\s*Opções do Menu Suspenso:?)([\s\S]*?)(?:#*\s*Gabarito Comentado:?)/i);
  if (opcoesMatch) {
    const opcoesText = opcoesMatch[1].trim();
    const lines = opcoesText.split('\n');
    lines.forEach(line => {
      const match = line.match(/Para a Lacuna (\d+)/i);
      if (match) {
        const lacunaId = parseInt(match[1], 10);
        const ops = [];
        const optionRegex = /\[\s*([^\]]+?)\s*\]/g;
        let optMatch;
        while ((optMatch = optionRegex.exec(line)) !== null) {
          if (!optMatch[1].toLowerCase().includes('lacuna')) {
             ops.push(optMatch[1].trim());
          }
        }
        if (ops.length > 0) {
          sections.opcoes[lacunaId] = ops;
        }
      }
    });
  }

  // Extract Gabarito
  const gabaritoMatch = content.match(/(?:#*\s*Gabarito Comentado:?)([\s\S]*)/i);
  if (gabaritoMatch) {
    sections.gabarito = gabaritoMatch[1].trim();
  }

  return sections;
}

console.log(JSON.stringify(parseInteractiveLacunas(text), null, 2));
