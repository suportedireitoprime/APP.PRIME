export const ESTADOS_MAP: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins', BR: 'Nacional',
};

export type ConcursoNoticia = {
  id: string;
  data_publicacao: string;
  created_at?: string;
  conteudo_md?: string | null;
  titulo: string;
  imagem_url?: string;
  link: string;
  uf?: string;
  cargos?: string[];
  cargos_resumo?: string;
  vagas_salario?: string;
  formacao?: string;
  resumo?: string;
  dias_restantes?: number;
};

export const CARGOS_FILTRO_OPTIONS = [
  { value: 'TODOS', label: 'Todos os Cargos' },
  { value: 'delegado_de_policia', label: '👮 Segurança Pública & Policial' },
  { value: 'tribunais_judiciario_analistas', label: '🏛️ Tribunais & Judiciário' },
  { value: 'juiz_magistratura', label: '⚖️ Magistratura' },
  { value: 'advocacia_publica', label: '📜 Advocacia Pública' },
  { value: 'fiscal_controle_auditores', label: '📊 Fiscal & Auditoria' },
  { value: 'enfermagem_saude_geral', label: '🩺 Saúde & Enfermagem' },
  { value: 'educacao_professor', label: '🎓 Educação & Docência' },
  { value: 'administrativo', label: '🏢 Gestão & Administrativo' },
  { value: 'tecnologia_da_informacao', label: '💻 Tecnologia da Informação' },
  { value: 'engenharia_arquitetura', label: '📐 Engenharia & Arquitetura' },
  { value: 'contabilidade_e_financas', label: '💰 Contabilidade & Finanças' },
  { value: 'odontologia', label: '🦷 Odontologia & Saúde Bucal' },
  { value: 'operacional_servicos_gerais', label: '🛠️ Operacional & Serviços Gerais' },
  { value: 'curinga_cargo_generico', label: '📋 Outros / Vários Cargos' },
] as const;

export const PRAZOS_FILTRO_OPTIONS = [
  { value: 'TODOS', label: 'Todos os Prazos' },
  { value: 'urgente_3', label: '🔥 Urgente: Até 3 dias' },
  { value: 'urgente_7', label: '⚡ Esta semana: Até 7 dias' },
  { value: 'mais_7', label: '📅 Mais de 7 dias' },
  { value: 'mais_15', label: '⏳ Mais de 15 dias' },
] as const;

export const SALARIOS_FILTRO_OPTIONS = [
  { value: 'TODOS', label: 'Todos os Salários' },
  { value: '3000', label: '+ R$ 3.000' },
  { value: '5000', label: '+ R$ 5.000' },
  { value: '8000', label: '+ R$ 8.000' },
  { value: '10000', label: '+ R$ 10.000' },
  { value: '15000', label: '+ R$ 15.000' },
] as const;

export function extractSalarioNumber(text: string): number | null {
  if (!text) return null;
  const match = text.match(/R\$\s*([\d.]+)(?:,\d{2})?/i);
  if (match && match[1]) {
    const clean = match[1].replace(/\./g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  }
  return null;
}

export function extractCargo(item: ConcursoNoticia): string {
  if (item.cargos_resumo) return item.cargos_resumo;
  if (item.cargos && item.cargos.length > 0) return item.cargos[0];
  const match = item.titulo.match(/(?:para|cargo(?:s)? de|função de)\s+(.+?)(?:\s*-|\s*$)/i);
  if (match && match[1]) {
    return match[1].split(' e ')[0].trim();
  }
  return 'Vários Cargos';
}
