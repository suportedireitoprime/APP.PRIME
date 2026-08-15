function titleCase(str) {
  const prepositions = new Set(['e', 'de', 'da', 'do', 'das', 'dos', 'com', 'por', 'em', 'na', 'no', 'nas', 'nos', 'para', 'a', 'o', 'as', 'os']);
  
  return str.toLowerCase().split(' ').map((word, index, arr) => {
    // Keep Roman Numerals capitalized? Maybe too complex, but let's check for basic ones.
    // Basic title case is fine:
    if (index === 0 || !prepositions.has(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
}

const tests = [
  "Interpretação de Textos > Redação",
  "interpretação de textos",
  "Improbidade administrativa - Lei nº 8.429 de 1992",
  "Sintaxe > Concordância verbal",
  "Conselho Nacional de Justiça (CNJ)"
];

tests.forEach(t => {
  let a = t.split('>')[0].trim();
  console.log(a, " => ", titleCase(a));
});
