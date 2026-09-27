// Mapeamento oficial das 14 ilustrações de profissões e padrões visuais para concursos
const SUPABASE_STORAGE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/imagens/profissoes';

export interface ProfissaoInfo {
  id: string;
  tag: string;
  subtitulo: string;
  imagemUrl: string;
  localPath: string;
}

export const PROFISSOES_MAP: Record<string, ProfissaoInfo> = {
  educacao_professor: {
    id: '01_educacao_professor',
    tag: 'Educação',
    subtitulo: 'Carreiras da Educação & Docência',
    imagemUrl: `${SUPABASE_STORAGE_URL}/01_educacao_professor.webp`,
    localPath: '/profissoes/01_educacao_professor.webp',
  },
  enfermagem_saude_geral: {
    id: '02_enfermagem_saude_geral',
    tag: 'Saúde',
    subtitulo: 'Área da Saúde & Enfermagem',
    imagemUrl: `${SUPABASE_STORAGE_URL}/02_enfermagem_saude_geral.webp`,
    localPath: '/profissoes/02_enfermagem_saude_geral.webp',
  },
  odontologia: {
    id: '03_odontologia',
    tag: 'Odontologia',
    subtitulo: 'Saúde Bucal & Odontologia',
    imagemUrl: `${SUPABASE_STORAGE_URL}/03_odontologia.webp`,
    localPath: '/profissoes/03_odontologia.webp',
  },
  delegado_de_policia: {
    id: '04_delegado_de_policia',
    tag: 'Segurança',
    subtitulo: 'Carreiras Policiais & Segurança Pública',
    imagemUrl: `${SUPABASE_STORAGE_URL}/04_delegado_de_policia.webp`,
    localPath: '/profissoes/04_delegado_de_policia.webp',
  },
  juiz_magistratura: {
    id: '05_juiz_magistratura',
    tag: 'Magistratura',
    subtitulo: 'Poder Judiciário & Magistratura',
    imagemUrl: `${SUPABASE_STORAGE_URL}/05_juiz_magistratura.webp`,
    localPath: '/profissoes/05_juiz_magistratura.webp',
  },
  advocacia_publica: {
    id: '06_advocacia_publica',
    tag: 'Advocacia Pública',
    subtitulo: 'Procuradoria & Defensoria Pública',
    imagemUrl: `${SUPABASE_STORAGE_URL}/06_advocacia_publica.webp`,
    localPath: '/profissoes/06_advocacia_publica.webp',
  },
  tribunais_judiciario_analistas: {
    id: '07_tribunais_judiciario_analistas',
    tag: 'Tribunais',
    subtitulo: 'Analistas & Técnicos Judiciários',
    imagemUrl: `${SUPABASE_STORAGE_URL}/07_tribunais_judiciario_analistas.webp`,
    localPath: '/profissoes/07_tribunais_judiciario_analistas.webp',
  },
  fiscal_controle_auditores: {
    id: '08_fiscal_controle_auditores',
    tag: 'Fiscal & Controle',
    subtitulo: 'Auditoria, Tributação & Controle Externo',
    imagemUrl: `${SUPABASE_STORAGE_URL}/08_fiscal_controle_auditores.webp`,
    localPath: '/profissoes/08_fiscal_controle_auditores.webp',
  },
  administrativo: {
    id: '09_administrativo',
    tag: 'Administrativo',
    subtitulo: 'Gestão & Apoio Administrativo',
    imagemUrl: `${SUPABASE_STORAGE_URL}/09_administrativo.webp`,
    localPath: '/profissoes/09_administrativo.webp',
  },
  engenharia_arquitetura: {
    id: '10_engenharia_arquitetura',
    tag: 'Engenharia',
    subtitulo: 'Engenharia, Arquitetura & Obras',
    imagemUrl: `${SUPABASE_STORAGE_URL}/10_engenharia_arquitetura.webp`,
    localPath: '/profissoes/10_engenharia_arquitetura.webp',
  },
  tecnologia_da_informacao: {
    id: '11_tecnologia_da_informacao',
    tag: 'Tecnologia',
    subtitulo: 'TI, Sistemas & Computação',
    imagemUrl: `${SUPABASE_STORAGE_URL}/11_tecnologia_da_informacao.webp`,
    localPath: '/profissoes/11_tecnologia_da_informacao.webp',
  },
  contabilidade_e_financas: {
    id: '12_contabilidade_e_financas',
    tag: 'Contabilidade',
    subtitulo: 'Finanças, Orçamento & Contabilidade',
    imagemUrl: `${SUPABASE_STORAGE_URL}/12_contabilidade_e_financas.webp`,
    localPath: '/profissoes/12_contabilidade_e_financas.webp',
  },
  operacional_servicos_gerais: {
    id: '13_operacional_servicos_gerais',
    tag: 'Operacional',
    subtitulo: 'Serviços Gerais, Logística & Operação',
    imagemUrl: `${SUPABASE_STORAGE_URL}/13_operacional_servicos_gerais.webp`,
    localPath: '/profissoes/13_operacional_servicos_gerais.webp',
  },
  curinga_cargo_generico: {
    id: '14_curinga_cargo_generico',
    tag: 'Vários Cargos',
    subtitulo: 'Concurso Público',
    imagemUrl: `${SUPABASE_STORAGE_URL}/14_curinga_cargo_generico.webp`,
    localPath: '/profissoes/14_curinga_cargo_generico.webp',
  },
};

export interface ConcursoVisualInfo {
  tag: string;
  subtitulo: string;
  imagemUrl: string;
  profissaoKey: string;
}

/**
 * Classifica um concurso com base em seu título e cargos para selecionar
 * uma das 14 ilustrações oficiais de profissões.
 */
export function getConcursoVisual(
  titulo: string,
  _imagemOriginal?: string | null,
  cargosContext?: string[] | string | null
): ConcursoVisualInfo {
  const cargosStr = Array.isArray(cargosContext) ? cargosContext.join(' ') : (cargosContext || '');
  const t = `${titulo || ''} ${cargosStr}`.toLowerCase();

  // 1. Odontologia (específico antes de saúde geral)
  if (/\b(dentista|dentistas|odont[oó]log[oa]s?|odontologia|sa[uú]de bucal|asb|tsb)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.odontologia, profissaoKey: 'odontologia' };
  }

  // 2. Juiz / Magistratura
  if (/\b(juiz|ju[ií]za|ju[ií]zes|magistratura|magistrado|magistrada)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.juiz_magistratura, profissaoKey: 'juiz_magistratura' };
  }

  // 3. Advocacia Pública / Procurador / Defensor
  if (/\b(procurador[oa]?s?|defensor[oa]?s?|advogad[oa]s?|pgm|pge|agu|defensoria|procuradoria)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.advocacia_publica, profissaoKey: 'advocacia_publica' };
  }

  // 4. Delegado & Carreiras Policiais / Segurança / Militar
  if (/\b(delegad[oa]s?|pol[ií]cia|policial|policiais|pm[a-z]{0,2}|bombeir[oa]s?|perito criminal|papiloscopista|investigador[oa]?s?|guarda municipal|guarda civil|gcm|guarda vidas|salva vidas|tr[aâ]nsito|agente penitenci[aá]ri[oa]s?|pol[ií]cia penal|cadete|militar|militares|for[cç]as armadas)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.delegado_de_policia, profissaoKey: 'delegado_de_policia' };
  }

  // 5. Tribunais / Judiciário / Analistas / Técnicos
  if (/\b(analista judici[aá]ri[oa]s?|t[eé]cnico judici[aá]ri[oa]s?|oficial de justi[cç]a|escrevente|tribunal de justi[cç]a|tribunal regional|\btj[a-z]{0,2}\b|\btrt\b|\btrf\b|\btre\b|\bstj\b|\bstf\b|\btst\b|cart[oó]rio|tabeli[aã]o|t[eé]cnico legislativo|analista legislativo)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.tribunais_judiciario_analistas, profissaoKey: 'tribunais_judiciario_analistas' };
  }

  // 6. Fiscal / Auditor / Controle
  if (/\b(auditor[oa]?s?|fiscal|fiscaliza[cç][aã]o|tribut[aá]ri[oa]s?|sefaz|\biss\b|\btce[a-z]{0,2}\b|\btcu\b|\bcge\b|\bcgu\b|controlador[oa]?s?|controle interno|receita federal|arrecada[cç][aã]o)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.fiscal_controle_auditores, profissaoKey: 'fiscal_controle_auditores' };
  }

  // 7. Tecnologia da Informação / TI
  if (/\b(tecnologia da informa[cç][aã]o|inform[aá]tica|programador[oa]?s?|desenvolvedor[oa]?s?|analista de sistemas|banco de dados|suporte t[eé]cnico|software|redes de computadores|devops|computa[cç][aã]o|\bti\b)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.tecnologia_da_informacao, profissaoKey: 'tecnologia_da_informacao' };
  }

  // 8. Contabilidade e Finanças
  if (/\b(contador[oa]?s?|contabilidade|t[eé]cnico em contabilidade|finan[cç]as|financeir[oa]s?|tesoureir[oa]s?|economista|economia|or[cç]amento|banc[aá]ri[oa]s?|banco do brasil|caixa econ[oô]mica)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.contabilidade_e_financas, profissaoKey: 'contabilidade_e_financas' };
  }

  // 9. Engenharia e Arquitetura
  if (/\b(engenheir[oa]s?|engenharia|arquiteto|arquiteta|arquitetura|urbanismo|edifica[cç][oõ]es|obras|agrimensor|top[oó]grafo)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.engenharia_arquitetura, profissaoKey: 'engenharia_arquitetura' };
  }

  // 10. Educação e Professores
  if (/\b(professor[oa]?s?|docente|doc[eê]ncia|pedagog[oa]s?|pedagogia|educador[oa]?s?|educa[cç][aã]o|magist[eé]rio|seduc|creche|escola|col[eé]gio|universidade|ifsp|ifrj|ifmg|ifba)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.educacao_professor, profissaoKey: 'educacao_professor' };
  }

  // 11. Enfermagem e Saúde Geral
  if (/\b(enferm|m[eé]dic[oa]s?|medicina|sa[uú]de|samu|hospital|farmac[eê]utic[oa]s?|fisioterapeut[oa]s?|nutricionist[oa]s?|psic[oó]log[oa]s?|fonoaudi[oó]log[oa]s?|biom[eé]dic[oa]s?|radiolog|veterin[aá]ri[oa]s?|agente comunit[aá]rio de sa[uú]de|combate [aà]s endemias|ubs|upa|sms|terapeuta ocupacional)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.enfermagem_saude_geral, profissaoKey: 'enfermagem_saude_geral' };
  }

  // 12. Operacional e Serviços Gerais
  if (/\b(servi[cç]os gerais|operacional|motorista|operador de m[aá]quinas|merendeir[oa]s?|cozinheir[oa]s?|gari|limpeza|zelador[oa]?s?|vigilante|porteiro|eletricista|mec[aâ]nico|pedreiro|tratorista|jardineiro|coveiro|servente)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.operacional_servicos_gerais, profissaoKey: 'operacional_servicos_gerais' };
  }

  // 13. Administrativo
  if (/\b(administrativ[oa]s?|assistente|auxiliar|escritur[aá]ri[oa]s?|atendente|recepcionista|recursos humanos|\brh\b|secret[aá]ri[oa]s?|almoxarife|gest[aã]o p[uú]blica|apoio administrativo)\b/i.test(t)) {
    return { ...PROFISSOES_MAP.administrativo, profissaoKey: 'administrativo' };
  }

  // 14. Curinga / Genérico (fallback oficial e padrão do app)
  return { ...PROFISSOES_MAP.curinga_cargo_generico, profissaoKey: 'curinga_cargo_generico' };
}
