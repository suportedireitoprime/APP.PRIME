export type Tema = {
  id: string;
  ordem: number;
  titulo_sugerido: string;
  categoria: string;
  resumo_briefing?: string | null;
  status: 'pendente' | 'agendado' | 'gerando' | 'concluido' | 'falhou' | 'cancelado';
  agendado_para?: string | null;
  post_id?: string | null;
  erro?: string | null;
  concluido_em?: string | null;
  audio_url?: string | null;
  audio_voice?: string | null;
  audio_duration_seconds?: number | null;
  audio_cost_credits?: number | null;
  imagem_url?: string | null;
  horario?: string;
};

export type BancoPost = {
  id: string;
  titulo: string;
  categoria: string;
  conteudo_md: string;
  imagem_url: string;
  imagem_path?: string | null;
  publicado: boolean;
  created_at: string;
  audio_url?: string | null;
  tema_id?: string | null;
};

export type Config = {
  id: string;
  posts_por_dia: number;
  horarios: string[];
  intervalo_minutos: number | null;
  modo_publicacao: 'auto' | 'rascunho';
  tom: string;
  tamanho_alvo: number;
  estilo_capa_prompt: string;
  push_ativo: boolean;
  push_titulo_template: string;
  push_corpo_template: string;
  push_audiencia: Record<string, unknown>;
  push_quiet_start: string | null;
  push_quiet_end: string | null;
  narracao_voz: string;
  narracao_modelo: string;
  narracao_estilo: string;
};

export type Voz = { id: string; genero: 'F' | 'M'; descricao: string };

export const PREVIEW_TEXTO_PADRAO =
  'Você sabia que o STF já reconheceu, em decisão inédita, que até um simples emoji pode ter valor jurídico em processos digitais? A cada nova tecnologia, o direito precisa se reinventar — e é justamente aí que mora a curiosidade.';

export const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-secondary text-muted-foreground',
  agendado: 'bg-blue-500/20 text-blue-300',
  gerando: 'bg-amber-500/20 text-amber-300 animate-pulse',
  concluido: 'bg-emerald-500/20 text-emerald-300',
  falhou: 'bg-red-500/20 text-red-300',
  cancelado: 'bg-muted text-muted-foreground',
};

export const hojeStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const mesmoDia = (isoOrDate: string | Date | null | undefined) => {
  if (!isoOrDate) return false;
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === hojeStr();
};
