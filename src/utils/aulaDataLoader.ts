import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { SlideItem, AulaData } from '@/types/aulaInterativa';
import { AULAS_CONTEUDO_REAL } from '@/data/aulasConteudoRealData';

const aulaCache: Record<string, AulaData> = {};

export function parseAulaHtml(html: string, aulaId: string, disciplinaId: string): AulaData {
  let imagens: Record<string, string> = {};
  const imgMatch = html.match(/var\s+IMG\s*=\s*(\{[\s\S]*?\});/);
  if (imgMatch) {
    try {
      imagens = (new Function(`return ${imgMatch[1]}`))();
    } catch (e) {
      console.warn('Erro ao avaliar IMG:', e);
    }
  }

  let audioBaseUrl = '';
  const audioMatch = html.match(/function\s+audioSrc\s*\(\s*i\s*\)\s*\{\s*return\s*["']([^"']+)["']/);
  if (audioMatch) {
    audioBaseUrl = audioMatch[1];
  }

  let slides: SlideItem[] = [];
  const startMarker = 'var SLIDES = [';
  const startIdx = html.indexOf(startMarker);
  if (startIdx !== -1) {
    const fromStart = html.substring(startIdx + 'var SLIDES = '.length);
    const endMatch = fromStart.match(/\];\s*(?:\/\*[\s\S]*?\*\/|\s)*var\s+total/);
    if (endMatch) {
      let slidesCode = fromStart.substring(0, endMatch.index + 1);
      // Sanitizar aspas duplas soltas em atributos HTML dentro de strings
      slidesCode = slidesCode.replace(/src="([^"]+)"/g, 'src=\\"$1\\"');
      try {
        slides = (new Function(`return ${slidesCode}`))();
      } catch (e) {
        console.warn('Erro ao avaliar SLIDES via Function:', e);
      }
    }
  }

  // Resolver URLs de imagem diretamente dentro de cada slide
  slides = slides.map((s, idx) => {
    let resolvedImg = s.imgUrl;
    if (!resolvedImg && s.img && imagens[s.img]) {
      resolvedImg = imagens[s.img];
    }
    return {
      ...s,
      imgUrl: resolvedImg
    };
  });

  return {
    aulaId,
    titulo: slides[0]?.titulo || 'Aula Interativa',
    disciplinaId,
    totalEtapas: slides.length,
    slides,
    imagens,
    audioBaseUrl
  };
}

export function buildFallbackAulaData(aula: AulaItem): AulaData {
  const safeTitulo = aula.titulo;
  const safeCapa = aula.capaUrl || '';

  const slides: SlideItem[] = [
    {
      tipo: 'Capa',
      kicker: `${aula.disciplinaId.toUpperCase()} · ${aula.numeroAula}`,
      titulo: safeTitulo,
      imgUrl: safeCapa,
      corpo: `<p class="lead">Bem-vindo à aula interativa sobre <b>${safeTitulo}</b>. Esta lição foi estruturada com fixação ativa e conteúdo doutrinário e jurisprudencial completo para o seu aprendizado.</p>`,
      narr: `Bem-vindo à aula interativa sobre ${safeTitulo}. Esta lição foi estruturada com fixação ativa e conteúdo doutrinário e jurisprudencial completo para o seu aprendizado.`
    },
    {
      tipo: 'Conteúdo',
      kicker: 'Fundamentos Dogmáticos',
      titulo: `Origens e Conceito de ${safeTitulo}`,
      imgUrl: safeCapa,
      corpo: `<p>A disciplina e os princípios fundamentais que regem este tema demandam rigor técnico e observância às normas constitucionais e infraconstitucionais pertinentes.</p><p>Compreender os pressupostos dogmáticos é o ponto de partida para resolver qualquer controvérsia prática.</p>`,
      narr: `A disciplina e os princípios fundamentais que regem este tema demandam rigor técnico e observância às normas constitucionais e infraconstitucionais pertinentes. Compreender os pressupostos dogmáticos é o ponto de partida para resolver qualquer controvérsia prática.`
    },
    {
      tipo: 'Conteúdo',
      kicker: 'Doutrina e Aplicação',
      titulo: 'Estrutura e Requisitos Legais',
      imgUrl: safeCapa,
      corpo: `<p>Os requisitos intrínsecos e extrínsecos do instituto devem ser analisados de forma cumulativa, vinculando a atuação do operador do Direito às balizas do ordenamento jurídico pátrio.</p>`,
      narr: `Os requisitos intrínsecos e extrínsecos do instituto devem ser analisados de forma cumulativa, vinculando a atuação do operador do Direito às balizas do ordenamento jurídico pátrio.`
    },
    {
      tipo: 'Questão',
      kicker: 'Treinamento Ativo',
      titulo: 'Desafio Prático de Fixação',
      intro: 'Avalie o caso e assinale a alternativa correta:',
      questao: `Em relação às diretrizes fundamentais de ${safeTitulo}, qual é a interpretação pacificada na doutrina contemporânea?`,
      opcoes: [
        'A aplicação independe de previsão legal prévia.',
        'Exige observância cumulativa aos postulados da legalidade e segurança jurídica.',
        'A jurisprudência veda qualquer aplicação deste instituto.',
        'Trata-se de hipótese exclusiva do direito comparado.'
      ],
      correta: 1,
      narr: `Hora de testar seus conhecimentos. Em relação às diretrizes fundamentais de ${safeTitulo}, qual é a interpretação pacificada na doutrina contemporânea? Escolha a melhor opção.`
    },
    {
      tipo: 'Encerramento',
      kicker: 'Síntese Final',
      titulo: 'Parabéns! Aula Concluída',
      imgUrl: safeCapa,
      corpo: `<p>Você concluiu com sucesso a primeira fase desta aula interativa sobre <b>${safeTitulo}</b>. Agora, avance para a revisão ativa com Flashcards e pratique com questões objetivas.</p>`,
      narr: `Parabéns! Você concluiu a etapa teórica sobre ${safeTitulo}. Agora pratique com as questões e revise com os flashcards.`
    }
  ];

  return {
    aulaId: aula.id,
    titulo: safeTitulo,
    disciplinaId: aula.disciplinaId,
    totalEtapas: slides.length,
    slides,
    imagens: { capa: safeCapa }
  };
}

export async function loadAulaData(aula: AulaItem): Promise<AulaData> {
  // 1. Conteúdo Real Pré-Estruturado (0ms, 100% Offline, Zero CORS)
  if (AULAS_CONTEUDO_REAL[aula.id]) {
    return AULAS_CONTEUDO_REAL[aula.id];
  }

  // 2. Cache em memória da sessão
  if (aulaCache[aula.id]) {
    return aulaCache[aula.id];
  }

  // 3. Carregar JSON estruturado do R2 (0ms parsing, entrega ultra-rápida)
  if (aula.urlJsonR2 && aula.urlJsonR2.startsWith('http')) {
    try {
      const res = await fetch(aula.urlJsonR2);
      if (res.ok) {
        const json = await res.json();
        const rawEtapas = json.etapas || json.slides || [];
        if (Array.isArray(rawEtapas) && rawEtapas.length > 0) {
          const slides: SlideItem[] = rawEtapas.map((e: any) => ({
            tipo: e.tipo || 'Conteúdo',
            titulo: e.titulo || '',
            kicker: e.kicker || e.tipo || '',
            corpo: e.corpo || (e.texto ? `<p>${e.texto}</p>` : ''),
            narr: e.narr || e.narracao || '',
            imgUrl: e.imgUrl || e.imagem || '',
            questao: e.questao,
            opcoes: e.opcoes,
            correta: e.certa !== undefined ? e.certa : e.correta,
            frente: e.frente,
            verso: e.verso,
            feedback: e.feedback,
            intro: e.intro,
            pares: e.pares
          }));

          const data: AulaData = {
            aulaId: aula.id,
            titulo: json.aula || json.titulo || aula.titulo,
            disciplinaId: aula.disciplinaId,
            totalEtapas: slides.length,
            slides,
            imagens: { capa: aula.capaUrl || '' },
            urlJsonR2: aula.urlJsonR2,
            urlHtmlR2: aula.urlHtmlR2
          };
          aulaCache[aula.id] = data;
          return data;
        }
      }
    } catch (e) {
      console.warn(`Falha ao baixar JSON do R2 para ${aula.id}:`, e);
    }
  }

  // 4. Carregar via HTML no R2 (Fallback robusto)
  if (aula.urlHtmlR2 && aula.urlHtmlR2.startsWith('http')) {
    try {
      const res = await fetch(aula.urlHtmlR2);
      if (res.ok) {
        const html = await res.text();
        const data = parseAulaHtml(html, aula.id, aula.disciplinaId);
        if (data.slides && data.slides.length > 0) {
          aulaCache[aula.id] = data;
          return data;
        }
      }
    } catch (e) {
      console.warn(`Falha ao baixar HTML do R2 para ${aula.id}, usando fallback:`, e);
    }
  }

  const fallback = buildFallbackAulaData(aula);
  aulaCache[aula.id] = fallback;
  return fallback;
}
