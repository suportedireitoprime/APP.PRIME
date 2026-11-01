import { AulaItem } from '@/data/aulasInterativasCatalogoCompleto';
import { SlideItem, AulaData } from '@/types/aulaInterativa';
import { AULAS_CONTEUDO_REAL } from '@/data/aulasConteudoRealData';

const aulaCache: Record<string, AulaData> = {};

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Converte narração bruta em parágrafos HTML elegantes com destaque visual de termos-chave,
 * garantindo que nenhuma etapa fique com texto em branco mesmo se a fonte R2 omitir a propriedade `corpo`.
 */
export function formatNarracaoParaHtml(narracao?: string, titulo?: string): string {
  if (!narracao || !narracao.trim()) return '';

  let texto = narracao.trim();

  // Se o texto já contém tags HTML completas, retornar direto
  if (/<[a-z][\s\S]*>/i.test(texto)) {
    return texto;
  }

  // Remover repetição exata do título no início da narração para evitar redundância
  if (titulo && titulo.trim()) {
    const t = titulo.trim();
    const regexTitulo = new RegExp('^' + escapeRegExp(t) + '[.:\\s-]+', 'i');
    texto = texto.replace(regexTitulo, '').trim();
  }

  // Destacar termos jurídicos, leis, princípios e marcos temporais
  let enriched = texto
    .replace(/\b(olho por olho, dente por dente)\b/gi, '<b>$1</b>')
    .replace(/\b(lei de talião|talião)\b/gi, '<b class="term">$1</b>')
    .replace(/\b(código de hamurabi|código penal|código civil|constituição federal)\b/gi, '<b class="term">$1</b>')
    .replace(/\b(artigo\s+\d+[\w-]*|art\.\s*\d+[\w-]*)\b/gi, '<b>$1</b>')
    .replace(/\b(\d{1,4}\s*(?:a\.C\.|d\.C\.))\b/gi, '<b>$1</b>');

  // Separar em sentenças
  const sentencas = enriched.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [enriched];

  const paragrafos: string[] = [];
  let buffer: string[] = [];

  for (let i = 0; i < sentencas.length; i++) {
    const s = sentencas[i].trim();
    if (!s) continue;

    // Detectar marcadores naturais de quebra de parágrafo
    const isNewSection = /^(Exemplo prático|Mas não|Por outro lado|Nesse sentido|Em suma|Hoje isso|A base do|O castigo)/i.test(s);
    if (isNewSection && buffer.length > 0) {
      paragrafos.push(buffer.join(' '));
      buffer = [s];
    } else {
      buffer.push(s);
      if (buffer.length >= 3) {
        paragrafos.push(buffer.join(' '));
        buffer = [];
      }
    }
  }

  if (buffer.length > 0) {
    paragrafos.push(buffer.join(' '));
  }

  if (paragrafos.length === 0) {
    return `<p>${enriched}</p>`;
  }

  return paragrafos
    .map((p, idx) => idx === 0 && paragrafos.length > 1 ? `<p class="lead">${p}</p>` : `<p>${p}</p>`)
    .join('\n');
}

export function parseAulaHtml(html: string, aulaId: string, disciplinaId: string, baseFolder?: string): AulaData {
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
    if (audioBaseUrl.startsWith('assets/') && baseFolder) {
      audioBaseUrl = `${baseFolder}/${audioBaseUrl}`;
    }
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

  // Resolver URLs de imagem e garantir preenchimento de texto/kicker diretamente dentro de cada slide
  slides = slides.map((s, idx) => {
    let resolvedImg = s.imgUrl;
    if (!resolvedImg && s.img && imagens[s.img]) {
      resolvedImg = imagens[s.img];
    }
    if (resolvedImg && resolvedImg.startsWith('assets/') && baseFolder) {
      resolvedImg = `${baseFolder}/${resolvedImg}`;
    }

    let corpo = s.corpo || '';
    if (!corpo.trim() && (s.narr || s.intro)) {
      corpo = formatNarracaoParaHtml(s.narr || s.intro || '', s.titulo);
    }

    let kicker = s.kicker || '';
    if (!kicker || kicker.toLowerCase() === 'conteúdo' || kicker.toLowerCase() === 'conteudo') {
      if (s.tipo === 'Questão' || s.tipo === 'Questão de banca' || s.opcoes) {
        kicker = 'Fixação Ativa';
      } else if (s.tipo === 'Flashcard' || s.frente) {
        kicker = 'Memorização Ativa';
      } else if (s.bloco) {
        kicker = `Bloco ${s.bloco}`;
      } else if (idx === 0) {
        kicker = `${disciplinaId.toUpperCase()} · Aula`;
      } else {
        kicker = `Etapa ${idx + 1} de ${slides.length}`;
      }
    }

    return {
      ...s,
      kicker,
      corpo,
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
  // 1. Cache em memória da sessão (ignora cache se for fallback antigo ou slides sem texto)
  if (
    aulaCache[aula.id] && 
    aulaCache[aula.id].totalEtapas > 5 && 
    aulaCache[aula.id].slides.some(s => s.corpo && s.corpo.length > 20)
  ) {
    return aulaCache[aula.id];
  }

  // Base URL da pasta desta aula no Cloudflare R2
  const baseFolder = (aula.urlJsonR2 || aula.urlHtmlR2 || '')
    .replace(/\/(?:aula\.json|aula\.html).*$/, '');

  // 2. Fonte de Altíssima Fidelidade: Conteúdo Curado Pré-Estruturado (0ms, zero latência, rico em HTML e interatividade)
  if (AULAS_CONTEUDO_REAL[aula.id]) {
    const rawData = AULAS_CONTEUDO_REAL[aula.id];
    if (rawData.slides && rawData.slides.length > 0 && rawData.slides.some(s => s.corpo && s.corpo.length > 0)) {
      const normalizedSlides = rawData.slides.map((s, idx) => {
        let img = s.imgUrl || '';
        if (!img && s.img && baseFolder) {
          if (s.img === 'capa') {
            img = aula.capaUrl || `${baseFolder}/assets/img/capa.webp`;
          } else {
            const cleanImg = s.img.replace(/\.(?:webp|jpg|png)$/, '');
            img = `${baseFolder}/assets/img/${cleanImg}.webp`;
          }
        } else if (img && img.startsWith('assets/') && baseFolder) {
          img = `${baseFolder}/${img}`;
        } else if (!img && idx === 0) {
          img = aula.capaUrl || '';
        }

        let corpo = s.corpo || '';
        if (!corpo.trim() && (s.narr || s.intro)) {
          corpo = formatNarracaoParaHtml(s.narr || s.intro || '', s.titulo);
        }

        let kicker = s.kicker || '';
        if (!kicker || kicker.toLowerCase() === 'conteúdo' || kicker.toLowerCase() === 'conteudo') {
          if (s.tipo === 'Questão' || s.tipo === 'Questão de banca' || s.opcoes) {
            kicker = 'Fixação Ativa';
          } else if (s.tipo === 'Flashcard' || s.frente) {
            kicker = 'Memorização Ativa';
          } else if (s.bloco) {
            kicker = `Bloco ${s.bloco}`;
          } else if (idx === 0) {
            kicker = `${aula.disciplinaId.toUpperCase()} · ${aula.numeroAula}`;
          } else {
            kicker = `Etapa ${idx + 1} de ${rawData.slides.length}`;
          }
        }

        return {
          ...s,
          kicker,
          corpo,
          imgUrl: img
        };
      });

      const data: AulaData = {
        ...rawData,
        slides: normalizedSlides,
        audioBaseUrl: rawData.audioBaseUrl || (baseFolder ? `${baseFolder}/assets/audio/s` : undefined),
        urlJsonR2: aula.urlJsonR2,
        urlHtmlR2: aula.urlHtmlR2
      };
      aulaCache[aula.id] = data;
      return data;
    }
  }

  // 3. Carregar via HTML no R2 (contém SLIDES compilados com corpo completo e kickers autênticos)
  if (aula.urlHtmlR2 && aula.urlHtmlR2.startsWith('http')) {
    try {
      const res = await fetch(aula.urlHtmlR2);
      if (res.ok) {
        const html = await res.text();
        const data = parseAulaHtml(html, aula.id, aula.disciplinaId, baseFolder);
        if (data.slides && data.slides.length > 5 && data.slides.some(s => s.corpo && s.corpo.length > 20)) {
          data.urlJsonR2 = aula.urlJsonR2;
          data.urlHtmlR2 = aula.urlHtmlR2;
          aulaCache[aula.id] = data;
          return data;
        }
      }
    } catch (e) {
      console.warn(`Tentativa de carregar HTML do R2 para ${aula.id} falhou, tentando JSON:`, e);
    }
  }

  // 4. Carregar via JSON no R2 (com conversão inteligente de narração para parágrafos ricos se corpo ausente)
  if (aula.urlJsonR2 && aula.urlJsonR2.startsWith('http')) {
    try {
      const res = await fetch(aula.urlJsonR2);
      if (res.ok) {
        const json = await res.json();
        const rawEtapas = json.etapas || json.slides || [];
        if (Array.isArray(rawEtapas) && rawEtapas.length > 0) {
          const slides: SlideItem[] = rawEtapas.map((e: any, idx: number) => {
            let img = e.imgUrl || e.imagem || '';
            if (!img && e.img) {
              if (e.img === 'capa') {
                img = aula.capaUrl || (baseFolder ? `${baseFolder}/assets/img/capa.webp` : '');
              } else if (baseFolder) {
                const cleanImg = e.img.replace(/\.(?:webp|jpg|png)$/, '');
                img = `${baseFolder}/assets/img/${cleanImg}.webp`;
              }
            } else if (!img && idx === 0) {
              img = aula.capaUrl || '';
            } else if (img && img.startsWith('assets/') && baseFolder) {
              img = `${baseFolder}/${img}`;
            }

            let corpo = e.corpo || (e.texto ? `<p>${e.texto}</p>` : '');
            if (!corpo.trim() && (e.narr || e.narracao || e.intro)) {
              corpo = formatNarracaoParaHtml(e.narr || e.narracao || e.intro || '', e.titulo);
            }

            let kicker = e.kicker || '';
            if (!kicker || kicker.toLowerCase() === 'conteúdo' || kicker.toLowerCase() === 'conteudo') {
              if (e.tipo === 'Questão' || e.tipo === 'Questão de banca' || e.opcoes) {
                kicker = 'Fixação Ativa';
              } else if (e.tipo === 'Flashcard' || e.frente) {
                kicker = 'Memorização Ativa';
              } else if (e.bloco) {
                kicker = `Bloco ${e.bloco}`;
              } else if (idx === 0) {
                kicker = `${aula.disciplinaId.toUpperCase()} · ${aula.numeroAula}`;
              } else {
                kicker = `Etapa ${idx + 1} de ${rawEtapas.length}`;
              }
            }

            return {
              tipo: e.tipo || 'Conteúdo',
              titulo: e.titulo || '',
              kicker,
              corpo,
              narr: e.narr || e.narracao || '',
              imgUrl: img,
              img: e.img,
              alt: e.alt,
              questao: e.questao,
              opcoes: e.opcoes,
              correta: e.certa !== undefined ? e.certa : e.correta,
              frente: e.frente,
              verso: e.verso,
              feedback: e.feedback,
              intro: e.intro,
              pares: e.pares
            };
          });

          const data: AulaData = {
            aulaId: aula.id,
            titulo: json.aula || json.titulo || aula.titulo,
            disciplinaId: aula.disciplinaId,
            totalEtapas: slides.length,
            slides,
            imagens: { capa: aula.capaUrl || '' },
            audioBaseUrl: baseFolder ? `${baseFolder}/assets/audio/s` : undefined,
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

  // 5. Fallback estruturado de contingência
  const fallback = buildFallbackAulaData(aula);
  return fallback;
}
