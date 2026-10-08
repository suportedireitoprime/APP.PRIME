function groupSentences(text) {
  const blocks = text.split('\n\n');
  return blocks.map(block => {
    // Captura a última palavra antes do ponto
    const marked = block.replace(/(^|\s)([\w\u00C0-\u00FF)'"]+[.?!]['")]?)\s+([A-Z\u00C0-\u00DF])/g, (match, p1, p2, p3) => {
      const m = p2.toLowerCase();
      // Se a última palavra for uma abreviação comum, não quebra
      if (m.includes('art.') || m.includes('inc.') || m.includes('lei') || m.includes('n.') || m.includes('stf.') || m.includes('stj.')) {
        return match;
      }
      return p1 + p2 + '@@@SPLIT@@@' + p3;
    });
    
    const sentences = marked.split('@@@SPLIT@@@');
    if (sentences.length <= 2) return block;
    
    const paragraphs = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const s1 = sentences[i] ? sentences[i].trim() : '';
      const s2 = sentences[i+1] ? sentences[i+1].trim() : '';
      let p = s1;
      if (s2) p += ' ' + s2;
      if (p) paragraphs.push(p);
    }
    return paragraphs.join('\n\n');
  }).join('\n\n');
}

const text = "(D) Correta: Explicando de forma simples e descomplicada: Todo proprietário de imóvel rural no Brasil é obrigado a manter uma porcentagem de vegetação nativa preservada em sua fazenda, conhecida como Reserva Legal (por exemplo, 20% no Estado de São Paulo e até 80% na Amazônia Legal). Mas o fazendeiro pode escolher qualquer pedaço estéril ou isolado da fazenda e dizer 'aqui será minha reserva'? NÃO! O artigo 14, § 1º, do Código Florestal (Lei nº 12.651/2012) estabelece de forma categórica que a localização da área de Reserva Legal deve ser submetida e aprovada pelo órgão ambiental competente do Sistema Nacional do Meio Ambiente (SISNAMA), após a prévia inscrição do imóvel no Cadastro Ambiental Rural (CAR). O órgão ambiental analisará critérios ecológicos cruciais, como a formação de corredores ecológicos com propriedades vizinhas e a proteção de bacias hidrográficas.";
console.log(groupSentences(text));
