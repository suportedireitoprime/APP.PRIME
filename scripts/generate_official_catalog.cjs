const fs = require('fs');

const data = JSON.parse(fs.readFileSync('scripts/4_disciplinas_completo.json', 'utf8'));
const capasManifest = JSON.parse(fs.readFileSync('scripts/capas_manifest.json', 'utf8'));

const DISC_CONFIG = {
  'Direito Penal': {
    id: 'penal',
    capaHero: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/direito-penal-hero.jpg',
    capasKey: 'penal'
  },
  'Direito Administrativo': {
    id: 'administrativo',
    capaHero: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/capas/administrativo/01._origens_e_definicoes_do_direito_administrativo_-_aula_01_-_origens.webp',
    capasKey: 'administrativo'
  },
  'Direito Constitucional': {
    id: 'constitucional',
    capaHero: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/capas/constitucional/01._historia_constitucional_do_brasil_-_aula_01_-_da_independencia_a_constituicao_de_1824.webp',
    capasKey: 'constitucional'
  },
  'Direito do Trabalho': {
    id: 'trabalho',
    capaHero: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/capas/trabalho/02._historico_do_direito_do_trabalho_-_aula_01_-_evolucao_do_direito_do_trabalho_no_mundo.webp',
    capasKey: 'trabalho'
  }
};

const READY_AULAS = {
  'penal-01-01': {
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/capa-3x4.webp',
    etapas: 32, audioQtd: 32, imagensQtd: 30
  },
  'penal-01-02': {
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-02-induzimento-a-erro-essencial/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-02-induzimento-a-erro-essencial/capa-3x4.webp',
    etapas: 32, audioQtd: 32, imagensQtd: 30
  },
  'administrativo-01-01': {
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-01-origens/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/capas/administrativo/01._origens_e_definicoes_do_direito_administrativo_-_aula_01_-_origens.webp',
    etapas: 38, audioQtd: 38, imagensQtd: 38
  },
  'administrativo-01-02': {
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-02-definicoes/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/capas/administrativo/01._origens_e_definicoes_do_direito_administrativo_-_aula_02_-_definicoes.webp',
    etapas: 38, audioQtd: 38, imagensQtd: 38
  },
  'constitucional-01-01': {
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-constitucional/01-historia-constitucional/aula-01-da-independencia/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/capas/constitucional/01._historia_constitucional_do_brasil_-_aula_01_-_da_independencia_a_constituicao_de_1824.webp',
    etapas: 30, audioQtd: 38, imagensQtd: 17
  },
  'constitucional-01-02': {
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-constitucional/01-historia-constitucional/aula-02-constituicao-1824/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/capas/constitucional/01._historia_constitucional_do_brasil_-_aula_02_-_constituicao_de_1824.webp',
    etapas: 30, audioQtd: 39, imagensQtd: 18
  },
  'trabalho-01-01': {
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-do-trabalho/01-introducao/aula-01-fontes-materiais-formais/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/capas/trabalho/02._historico_do_direito_do_trabalho_-_aula_01_-_evolucao_do_direito_do_trabalho_no_mundo.webp',
    etapas: 30, audioQtd: 39, imagensQtd: 12
  },
  'trabalho-01-02': {
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-do-trabalho/01-introducao/aula-02-fontes-autonomas/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/capas/trabalho/02._historico_do_direito_do_trabalho_-_aula_02_-_evolucao_do_direito_do_trabalho_no_brasil.webp',
    etapas: 30, audioQtd: 39, imagensQtd: 12
  }
};

function normalizeName(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findCoverUrl(discKey, materiaName, aulaName, defaultCapa) {
  const capas = capasManifest[discKey] || {};
  const normMat = normalizeName(materiaName);
  const normAula = normalizeName(aulaName);

  // 1. Match específico da aula (se informada)
  if (normAula.length >= 4) {
    for (const [filename, url] of Object.entries(capas)) {
      const normFile = normalizeName(filename);
      if (normFile.includes(normAula)) {
        return url;
      }
    }
  }

  // 2. Match pelo nome da matéria
  if (normMat.length >= 4) {
    for (const [filename, url] of Object.entries(capas)) {
      const normFile = normalizeName(filename);
      if (normFile.includes(normMat)) {
        return url;
      }
    }
  }

  return defaultCapa;
}

const finalMaterias = [];
const finalAulas = [];

for (const [discTitle, conf] of Object.entries(DISC_CONFIG)) {
  const rawMaterias = data[discTitle] || [];

  // Desduplicar matérias por nome normalizado
  const dedupedMap = new Map();
  for (const m of rawMaterias) {
    const cleanName = m.materiaName.replace(/^\d+[\.\-\s]+/, '').trim();
    const key = normalizeName(cleanName);
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, m);
    } else {
      const existing = dedupedMap.get(key);
      if (m.aulasCount > existing.aulasCount) {
        dedupedMap.set(key, m);
      }
    }
  }

  const uniqueMaterias = Array.from(dedupedMap.values());
  console.log(`[${discTitle}] ${rawMaterias.length} originais -> ${uniqueMaterias.length} desduplicadas.`);

  uniqueMaterias.forEach((m, mIdx) => {
    const cleanName = m.materiaName.replace(/^\d+[\.\-\s]+/, '').trim();
    const numStr = String(mIdx + 1).padStart(2, '0');
    const matId = `${conf.id}-mat-${numStr}`;
    const matNumero = `${numStr}. ${cleanName.toUpperCase()}`;

    // Capa da matéria: buscar pelo nome da matéria
    const matCapaUrl = findCoverUrl(conf.capasKey, cleanName, '', conf.capaHero);

    finalMaterias.push({
      id: matId,
      disciplinaId: conf.id,
      numeroMateria: matNumero,
      titulo: cleanName,
      subtitulo: `Módulo ${numStr} · ${m.aulasCount} aula${m.aulasCount > 1 ? 's' : ''}`,
      descricao: `Estudo aprofundado com narrativa interativa, casos reais, fixação ativa e questões práticas sobre ${cleanName}.`,
      capaUrl: matCapaUrl
    });

    // Aulas
    m.aulas.forEach((a, aIdx) => {
      const aulaNumStr = String(aIdx + 1).padStart(2, '0');
      const aulaId = `${conf.id}-${numStr}-${aulaNumStr}`;
      const aulaClean = a.name.replace(/^Aula\s*\d+[\s\-\:]+/i, '').trim();
      const ready = READY_AULAS[aulaId];

      const aulaCapaUrl = ready ? ready.capaUrl : findCoverUrl(conf.capasKey, cleanName, aulaClean, matCapaUrl);

      if (ready) {
        finalAulas.push({
          id: aulaId,
          disciplinaId: conf.id,
          materiaId: matId,
          numeroAula: `AULA ${aulaNumStr}`,
          titulo: aulaClean || a.name,
          descricao: `Conteúdo imersivo e multimídia com narração e ciclo de aprendizagem completo sobre ${aulaClean || a.name}.`,
          slug: aulaId,
          etapas: ready.etapas,
          audioQtd: ready.audioQtd,
          imagensQtd: ready.imagensQtd,
          urlHtmlR2: ready.urlHtmlR2,
          capaUrl: aulaCapaUrl,
          status: 'pronto'
        });
      } else {
        finalAulas.push({
          id: aulaId,
          disciplinaId: conf.id,
          materiaId: matId,
          numeroAula: `AULA ${aulaNumStr}`,
          titulo: aulaClean || a.name,
          descricao: `Conteúdo interativo em estruturação com casos práticos e fixação ativa sobre ${aulaClean || a.name}.`,
          slug: aulaId,
          etapas: 30,
          audioQtd: 30,
          imagensQtd: 20,
          urlHtmlR2: '',
          capaUrl: aulaCapaUrl,
          status: 'pendente'
        });
      }
    });
  });
}

console.log(`\nTOTAL GERAL: ${finalMaterias.length} matérias e ${finalAulas.length} aulas.`);

const tsContent = `// Catálogo Oficial Desduplicado de Aulas e Matérias Interativas (Drive & Cloudflare R2)
// Total: ${finalMaterias.length} Matérias e ${finalAulas.length} Aulas com capas individuais no Cloudflare R2

export interface AulaItem {
  id: string;
  numeroAula: string;
  titulo: string;
  descricao: string;
  slug: string;
  etapas: number;
  audioQtd: number;
  imagensQtd: number;
  urlHtmlR2: string;
  capaUrl: string;
  status: 'pronto' | 'pendente';
  disciplinaId: string;
  materiaId: string;
  htmlConteudoRaw?: string;
}

export interface MateriaItem {
  id: string;
  disciplinaId: string;
  numeroMateria: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  capaUrl: string;
}

export const MATERIAS_CATALOGO_COMPLETO: MateriaItem[] = ${JSON.stringify(finalMaterias, null, 2)};

export const AULAS_CATALOGO_COMPLETO: AulaItem[] = ${JSON.stringify(finalAulas, null, 2)};
`;

fs.writeFileSync('src/data/aulasInterativasCatalogoCompleto.ts', tsContent, 'utf8');
console.log('src/data/aulasInterativasCatalogoCompleto.ts gravado com sucesso!');
