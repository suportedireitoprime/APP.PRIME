const rawContent = `
# Enunciado da Atividade:
A simulação é classificada como vício social que gera a [ LACUNA 1 ] do negócio jurídico, não convalidando pelo decurso do tempo. Já o erro, o dolo e a coação geram [ LACUNA 2 ] no prazo decadencial de 4 anos.

# Opções do Menu Suspenso:
Para a Lacuna 1:
- [Nulidade absoluta]
- [Anulabilidade]
- [Inexistência]

Para a Lacuna 2:
- [Decadência]
- [Anulabilidade]
- [Nenhuma das anteriores]

# Gabarito Comentado:
Teste
`;

const data = { enunciado: '', opcoes: {}, gabarito: '' };

const enunciadoMatch = rawContent.match(/(?:#*\s*Enunciado da Atividade:?)([\s\S]*?)(?:#*\s*Opções do Menu Suspenso:?)/i);
if (enunciadoMatch) {
  data.enunciado = enunciadoMatch[1].trim().replace(/\[\s*LACUNA\s*(\d+)\s*\]/gi, '`[ LACUNA $1 ]`');
}
console.log('EnunciadoMatch:', enunciadoMatch);

const opcoesMatch = rawContent.match(/(?:#*\s*Opções do Menu Suspenso:?)([\s\S]*?)(?:#*\s*Gabarito Comentado:?)/i);
if (opcoesMatch) {
  const opcoesText = opcoesMatch[1].trim();
  const blocos = opcoesText.split(/(?:Para a )?Lacuna\s+(\d+)\s*[:-]?/i);
  console.log('Blocos:', blocos);
  
  for (let i = 1; i < blocos.length; i += 2) {
    const lacunaId = parseInt(blocos[i], 10);
    const optionsText = blocos[i + 1];
    if (!optionsText) continue;
    
    const ops = [];
    const optionRegex = /\[\s*([^\]]+?)\s*\]/g;
    let optMatch;
    while ((optMatch = optionRegex.exec(optionsText)) !== null) {
      if (!optMatch[1].toLowerCase().includes('lacuna')) {
         ops.push(optMatch[1].trim());
      }
    }
    if (ops.length > 0) {
      data.opcoes[lacunaId] = ops;
    }
  }
}
console.log('Opcoes:', data.opcoes);
