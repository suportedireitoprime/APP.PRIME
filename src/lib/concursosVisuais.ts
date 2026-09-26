// Mapeamento de imagens e padrões visuais institucionais para concursos
import brasaoRepublica from '@/assets/brasao-republica.webp';

export interface ConcursoVisualInfo {
  tag: string;
  subtitulo: string;
  imagemUrl?: string;
  fallbackIcon?: string;
  gradienteFundo?: string;
}

export function getConcursoVisual(titulo: string, imagemOriginal?: string | null): ConcursoVisualInfo {
  const t = titulo.toLowerCase();

  // Se já veio com imagem real da raspagem (ex: logo do órgão da PCI)
  if (imagemOriginal && imagemOriginal.startsWith('http')) {
    return {
      tag: 'Edital Aberto',
      subtitulo: 'Concurso Público',
      imagemUrl: imagemOriginal,
    };
  }

  // Prefeituras
  if (t.includes('prefeitura') || t.includes('municip') || t.includes('pessoal municipal')) {
    return {
      tag: 'Municipal',
      subtitulo: 'Prefeitura Municipal',
      imagemUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80',
    };
  }

  // Câmaras Municipais
  if (t.includes('câmara') || t.includes('camara')) {
    return {
      tag: 'Legislativo',
      subtitulo: 'Câmara Municipal',
      imagemUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
    };
  }

  // Tribunais e Judiciário (TJ, TRF, TRT, TRE, STJ, STF)
  if (t.includes('tribunal') || t.includes(' tj') || t.startsWith('tj') || t.includes('trf') || t.includes('trt') || t.includes('tre') || t.includes('magistratura') || t.includes('judiciário')) {
    return {
      tag: 'Judiciário',
      subtitulo: 'Poder Judiciário',
      imagemUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
    };
  }

  // Fazenda e Fisco (Sefaz, ISS, Receita, Auditor, Fisco)
  if (t.includes('sefaz') || t.includes('fazenda') || t.includes('auditor fiscal') || t.includes('fisco') || t.includes('iss ') || t.includes('receita')) {
    return {
      tag: 'Fiscal',
      subtitulo: 'Área Fiscal & Tributária',
      imagemUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    };
  }

  // Segurança Pública e Polícia (Polícia, PM, PC, PRF, PF, Guarda, Bombeiro)
  if (t.includes('polícia') || t.includes('policia') || t.includes('pm') || t.includes('guarda') || t.includes('bombeiro') || t.includes('segurança pública') || t.includes('perito')) {
    return {
      tag: 'Segurança',
      subtitulo: 'Carreiras Policiais',
      imagemUrl: 'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?auto=format&fit=crop&w=600&q=80',
    };
  }

  // Educação e Professores (Seduc, Educação, Professor, Docente, Universidade, Colégio)
  if (t.includes('seduc') || t.includes('educação') || t.includes('educacao') || t.includes('professor') || t.includes('docente') || t.includes('universidade') || t.includes('escola')) {
    return {
      tag: 'Educação',
      subtitulo: 'Carreiras da Educação',
      imagemUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    };
  }

  // Saúde e Hospitais (Saúde, SMS, Hospital, Médico, Enfermagem, Clínico)
  if (t.includes('saúde') || t.includes('saude') || t.includes('sms') || t.includes('hospital') || t.includes('médic') || t.includes('enferm') || t.includes('veterinário') || t.includes('veterinario')) {
    return {
      tag: 'Saúde',
      subtitulo: 'Área da Saúde',
      imagemUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    };
  }

  // Controle Externo (TCE, TCU, CGE, Controladoria)
  if (t.includes('tce') || t.includes('tcu') || t.includes('cge') || t.includes('controlador')) {
    return {
      tag: 'Controle',
      subtitulo: 'Tribunal de Contas',
      imagemUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    };
  }

  // Default oficial do Governo / República
  return {
    tag: 'Edital Aberto',
    subtitulo: 'Concurso Público',
    imagemUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
  };
}
