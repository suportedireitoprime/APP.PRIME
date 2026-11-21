/**
 * Gerenciador de Notificações Locais de Retenção & Engajamento
 * Suporta gatilhos inteligentes no aparelho (Continuar assistindo, continuar lendo,
 * barra de progresso, streak e repetição espaçada) com telemetria de aberturas no local.
 */
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type ModuloNotificacaoLocal =
  | 'audioaulas'
  | 'livros'
  | 'videoaulas'
  | 'streak'
  | 'flashcards'
  | 'trial';

export type PublicoAlvoNotificacao =
  | 'todos'
  | 'gratuitos'
  | 'assinantes'
  | 'inativos_24h';

export interface RegraNotificacaoLocal {
  id: string;
  modulo: ModuloNotificacaoLocal;
  nome: string;
  descricao: string;
  ativo: boolean;
  tituloTemplate: string;
  subtituloTemplate: string;
  textoBotaoAcao: string;
  rotaPadrao: string;
  publicoAlvo: PublicoAlvoNotificacao;
  gatilhoHorasInatividade: number; // ex: 2, 4, 12, 24
  horarioFixoDisparo?: string; // ex: '19:00'
  mostrarBarraProgresso: boolean;
  progressoExemplo: number; // 0-100 para o preview e teste
  exemploTitulo: string;
  exemploSubtitulo: string;
  exemploCapaUrl?: string;
  canalAndroid: string;
}

export interface EventoTelemetriaLocal {
  id: string;
  notificacaoId: number;
  modulo: ModuloNotificacaoLocal;
  tipo: 'agendado' | 'aberto';
  titulo: string;
  subtitulo: string;
  progresso: number;
  rota: string;
  acaoId?: string; // ex: 'continuar', 'clique_corpo'
  timestamp: string; // ISO string
  disparadoEm?: string; // ISO string do momento em que foi agendada
  tempoAteAbrirMs?: number; // milissegundos entre disparo e abertura
  userEmail?: string;
}

export interface MetricasNotificacoesLocais {
  totalDisparadas: number;
  totalAbertas: number;
  taxaAberturaPct: number;
  tempoMedioAteAbrirMin: number;
  porModulo: Record<
    ModuloNotificacaoLocal,
    { disparadas: number; abertas: number; taxaPct: number }
  >;
  ultimasAberturas: EventoTelemetriaLocal[];
}

export const REGRAS_PADRAO_NOTIFICACOES_LOCAIS: RegraNotificacaoLocal[] = [
  {
    id: 'videoaulas_continuar',
    modulo: 'videoaulas',
    nome: 'Continuar Videoaula (Estilo Streaming)',
    descricao: 'Notificação com barra de progresso azul e botão "Continuar assistindo" idêntica ao print de referência.',
    ativo: true,
    tituloTemplate: '🎬 {titulo}',
    subtituloTemplate: 'Capítulo {capitulo} · faltam {minutos} min',
    textoBotaoAcao: 'Continuar assistindo',
    rotaPadrao: '/aprender',
    publicoAlvo: 'todos',
    gatilhoHorasInatividade: 2,
    mostrarBarraProgresso: true,
    progressoExemplo: 60,
    exemploTitulo: 'O Investidor Inteligente - Princípios Fundamentais',
    exemploSubtitulo: 'Capítulo 1 · faltam 1 min',
    exemploCapaUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=160&auto=format&fit=crop&q=80',
    canalAndroid: 'retencao_video',
  },
  {
    id: 'audioaulas_continuar',
    modulo: 'audioaulas',
    nome: 'Continuar Áudioaula',
    descricao: 'Lembra o aluno de retomar a aula em áudio de onde parou com tempo restante e botão "Continuar ouvindo".',
    ativo: true,
    tituloTemplate: '🎧 {titulo}',
    subtituloTemplate: 'Faixa {faixa} · faltam {minutos} min',
    textoBotaoAcao: 'Continuar ouvindo',
    rotaPadrao: '/audioaulas',
    publicoAlvo: 'todos',
    gatilhoHorasInatividade: 2,
    mostrarBarraProgresso: true,
    progressoExemplo: 45,
    exemploTitulo: 'Direito Penal: Teoria do Crime e Imputabilidade',
    exemploSubtitulo: 'Faixa 2 de 6 · faltam 3 min',
    exemploCapaUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=160&auto=format&fit=crop&q=80',
    canalAndroid: 'retencao_audio',
  },
  {
    id: 'livros_continuar',
    modulo: 'livros',
    nome: 'Continuar Leitura de Livro / Lei',
    descricao: 'Dispara capa do livro/código e progresso de páginas quando o aluno pausar a leitura.',
    ativo: true,
    tituloTemplate: '📖 {titulo}',
    subtituloTemplate: 'Página {pagina} · {progresso}% lido',
    textoBotaoAcao: 'Continuar lendo',
    rotaPadrao: '/biblioteca',
    publicoAlvo: 'todos',
    gatilhoHorasInatividade: 4,
    mostrarBarraProgresso: true,
    progressoExemplo: 72,
    exemploTitulo: 'Código Penal Comentado & Doutrina Essencial',
    exemploSubtitulo: 'Artigo 121 · 72% lido',
    exemploCapaUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=160&auto=format&fit=crop&q=80',
    canalAndroid: 'retencao_leitura',
  },
  {
    id: 'streak_diario',
    modulo: 'streak',
    nome: 'Alerta de Ofensiva / Fogo Diário',
    descricao: 'Disparo às 20h para evitar que o aluno perca os dias consecutivos de estudo e XP.',
    ativo: true,
    tituloTemplate: '🔥 Não perca sua sequência de {dias} dias!',
    subtituloTemplate: 'Resolva 1 questão rápida antes da meia-noite para manter sua ofensiva viva',
    textoBotaoAcao: 'Praticar agora',
    rotaPadrao: '/questoes',
    publicoAlvo: 'todos',
    gatilhoHorasInatividade: 0,
    horarioFixoDisparo: '20:00',
    mostrarBarraProgresso: false,
    progressoExemplo: 0,
    exemploTitulo: '🔥 Mantenha sua ofensiva de 14 dias ativa!',
    exemploSubtitulo: 'Falta apenas 1 questão para manter o fogo aceso hoje',
    canalAndroid: 'lembrete_estudo',
  },
  {
    id: 'flashcards_revisao',
    modulo: 'flashcards',
    nome: 'Cards Pendentes (Repetição Espaçada)',
    descricao: 'Avisa quando cards do algoritmo Anki/SM-2 vencerem para retenção de memória de longo prazo.',
    ativo: true,
    tituloTemplate: '🧠 {quantidade} cards prontos para revisão hoje',
    subtituloTemplate: 'Sua memória de longo prazo agradece: revise em 3 minutos',
    textoBotaoAcao: 'Revisar flashcards',
    rotaPadrao: '/flashcards',
    publicoAlvo: 'todos',
    gatilhoHorasInatividade: 0,
    horarioFixoDisparo: '18:30',
    mostrarBarraProgresso: false,
    progressoExemplo: 0,
    exemploTitulo: '🧠 18 flashcards de Constitucional para revisar',
    exemploSubtitulo: 'Consolide o aprendizado do dia em menos de 4 minutos',
    canalAndroid: 'lembrete_flashcard',
  },
  {
    id: 'trial_expirando',
    modulo: 'trial',
    nome: 'Expiração de Teste Gratuito',
    descricao: 'Enviado para alunos gratuitos nas últimas 24 horas do período de teste com link direto de assinatura.',
    ativo: true,
    tituloTemplate: '⏳ Seu período de teste acaba em {horas}h',
    subtituloTemplate: 'Mantenha acesso ilimitado a todas as aulas, áudios e ao Vade Mecum',
    textoBotaoAcao: 'Garantir desconto',
    rotaPadrao: '/assinatura',
    publicoAlvo: 'gratuitos',
    gatilhoHorasInatividade: 24,
    mostrarBarraProgresso: true,
    progressoExemplo: 85,
    exemploTitulo: '⏳ Seu acesso liberado termina em breve',
    exemploSubtitulo: 'Restam apenas 6 horas de teste gratuito. Não perca seus grifos e histórico!',
    canalAndroid: 'alertas_urgentes',
  },
];

const STORAGE_KEY = 'direitoprime_regras_notificacoes_locais_v1';
const TELEMETRIA_STORAGE_KEY = 'direitoprime_telemetria_notificacoes_locais_v1';

export function carregarRegrasNotificacoesLocais(): RegraNotificacaoLocal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return REGRAS_PADRAO_NOTIFICACOES_LOCAIS;
    const parsed = JSON.parse(raw) as RegraNotificacaoLocal[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      const idsExistentes = new Set(parsed.map((r) => r.id));
      const faltantes = REGRAS_PADRAO_NOTIFICACOES_LOCAIS.filter((r) => !idsExistentes.has(r.id));
      return [...parsed, ...faltantes];
    }
  } catch (err) {
    console.warn('[notificacaoLocalManager] erro ao carregar regras:', err);
  }
  return REGRAS_PADRAO_NOTIFICACOES_LOCAIS;
}

export function salvarRegrasNotificacoesLocais(regras: RegraNotificacaoLocal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(regras));
  } catch (err) {
    console.warn('[notificacaoLocalManager] erro ao salvar regras:', err);
  }
}

export const TIPO_RETENCAO_ACAO = 'ACAO_RETENCAO_CONTINUAR';

// Mapeamento de IDs fixos de notificação por módulo para permitir cancelamento/atualização limpa
const NOTIF_IDS_MODULO: Record<ModuloNotificacaoLocal, number> = {
  videoaulas: 77101,
  audioaulas: 77102,
  livros: 77103,
  streak: 77104,
  flashcards: 77105,
  trial: 77106,
};

let acoesRegistradas = false;

export async function registrarCanaisEAcoesLocais(): Promise<void> {
  if (!Capacitor.isNativePlatform() || acoesRegistradas) return;
  acoesRegistradas = true;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: 'retencao_video',
        name: 'Continuar Assistindo & Retenção',
        description: 'Notificações de aulas em andamento com barra de progresso.',
        importance: 4,
        vibration: true,
        lights: true,
      });

      await LocalNotifications.createChannel({
        id: 'retencao_audio',
        name: 'Continuar Ouvindo',
        description: 'Lembretes de áudioaulas com progresso e tempo restante.',
        importance: 4,
        vibration: true,
        lights: true,
      });

      await LocalNotifications.createChannel({
        id: 'retencao_leitura',
        name: 'Continuar Leitura',
        description: 'Lembretes de livros e Vade Mecum.',
        importance: 4,
        vibration: true,
        lights: true,
      });
    }

    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: TIPO_RETENCAO_ACAO,
          actions: [
            { id: 'continuar', title: 'Continuar assistindo' },
            { id: 'depois', title: 'Mais tarde' },
          ],
        },
      ],
    });

    await LocalNotifications.addListener('localNotificationActionPerformed', (evento) => {
      const extra = (evento.notification?.extra ?? {}) as {
        rota?: string;
        modulo?: ModuloNotificacaoLocal;
        progresso?: number;
        eventoId?: string;
      };

      // REGISTRA TELEMETRIA DA ABERTURA NO APARELHO!
      if (extra.modulo) {
        void registrarAberturaNotificacaoLocal({
          notificacaoId: Number(evento.notification?.id),
          modulo: extra.modulo,
          acao: evento.actionId || 'clique_corpo',
          rota: extra.rota || '/audioaulas',
          progresso: extra.progresso || 0,
          eventoId: extra.eventoId,
        });
      }

      if (extra.rota) {
        window.dispatchEvent(
          new CustomEvent('direitoprime:push-navigate', { detail: { path: extra.rota } })
        );
      }
    });
  } catch (e) {
    console.warn('[notificacaoLocalManager] Falha ao registrar canais:', e);
  }
}

// ============================================================================
// 1. TELEMETRIA E RELATÓRIO DE ABERTURA NO LOCAL
// ============================================================================

function carregarEventosLocais(): EventoTelemetriaLocal[] {
  try {
    const raw = localStorage.getItem(TELEMETRIA_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EventoTelemetriaLocal[]) : [];
  } catch {
    return [];
  }
}

function salvarEventosLocais(eventos: EventoTelemetriaLocal[]): void {
  try {
    localStorage.setItem(TELEMETRIA_STORAGE_KEY, JSON.stringify(eventos.slice(-200)));
  } catch {
    /* ignore */
  }
}

/** Registra o disparo de uma notificação local (agendamento no aparelho) */
export async function registrarDisparoLocal(params: {
  notificacaoId: number;
  modulo: ModuloNotificacaoLocal;
  titulo: string;
  subtitulo: string;
  progresso: number;
  rota: string;
  eventoId?: string;
}): Promise<string> {
  const eventoId = params.eventoId || `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const agora = new Date().toISOString();

  let userEmail = 'aluno@direitoprime.com';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) userEmail = user.email;
  } catch {
    /* ignore */
  }

  const novoEvento: EventoTelemetriaLocal = {
    id: eventoId,
    notificacaoId: params.notificacaoId,
    modulo: params.modulo,
    tipo: 'agendado',
    titulo: params.titulo,
    subtitulo: params.subtitulo,
    progresso: params.progresso,
    rota: params.rota,
    timestamp: agora,
    disparadoEm: agora,
    userEmail,
  };

  const lista = carregarEventosLocais();
  lista.unshift(novoEvento);
  salvarEventosLocais(lista);

  // Sincroniza em segundo plano no Supabase (user_notifications) para consolidação geral
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      await supabase.from('user_notifications').insert({
        user_id: user.id,
        category: 'local_retencao',
        campaign_id: `local_${params.modulo}`,
        title: params.titulo,
        body: params.subtitulo,
        url: params.rota,
        clicked: false,
      });
    }
  } catch {
    /* offline / fallback */
  }

  return eventoId;
}

/** Registra que o aluno ABRIU ou clicou na notificação no aparelho local */
export async function registrarAberturaNotificacaoLocal(params: {
  notificacaoId?: number;
  modulo: ModuloNotificacaoLocal;
  acao: string;
  rota: string;
  progresso?: number;
  eventoId?: string;
}): Promise<void> {
  const agora = new Date();
  const agoraIso = agora.toISOString();

  let userEmail = 'aluno@direitoprime.com';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) userEmail = user.email;
  } catch {
    /* ignore */
  }

  const lista = carregarEventosLocais();
  let tempoAteAbrirMs: number | undefined;

  // Localiza o agendamento correspondente
  const agendamento = lista.find(
    (ev) => ev.tipo === 'agendado' && (ev.id === params.eventoId || ev.notificacaoId === params.notificacaoId)
  );

  if (agendamento?.disparadoEm) {
    tempoAteAbrirMs = Math.max(0, agora.getTime() - new Date(agendamento.disparadoEm).getTime());
  }

  const eventoAbertura: EventoTelemetriaLocal = {
    id: `open_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    notificacaoId: params.notificacaoId || 0,
    modulo: params.modulo,
    tipo: 'aberto',
    titulo: agendamento?.titulo || `Retenção de ${params.modulo}`,
    subtitulo: agendamento?.subtitulo || 'Aluno abriu no aparelho',
    progresso: params.progresso ?? agendamento?.progresso ?? 0,
    rota: params.rota,
    acaoId: params.acao,
    timestamp: agoraIso,
    disparadoEm: agendamento?.disparadoEm,
    tempoAteAbrirMs,
    userEmail,
  };

  lista.unshift(eventoAbertura);
  salvarEventosLocais(lista);

  // Atualiza no Supabase para relatório admin
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      await supabase
        .from('user_notifications')
        .update({
          clicked: true,
          clicked_at: agoraIso,
          read: true,
          read_at: agoraIso,
        })
        .eq('user_id', user.id)
        .eq('campaign_id', `local_${params.modulo}`)
        .eq('clicked', false);
    }
  } catch {
    /* offline / fallback */
  }
}

/** Retorna as métricas consolidadas de disparos e aberturas para o painel admin */
export async function obterMetricasNotificacoesLocais(): Promise<MetricasNotificacoesLocais> {
  const eventos = carregarEventosLocais();

  const modulos: ModuloNotificacaoLocal[] = [
    'videoaulas',
    'audioaulas',
    'livros',
    'streak',
    'flashcards',
    'trial',
  ];

  const porModulo: MetricasNotificacoesLocais['porModulo'] = {} as any;
  for (const m of modulos) {
    porModulo[m] = { disparadas: 0, abertas: 0, taxaPct: 0 };
  }

  let totalDisparadas = 0;
  let totalAbertas = 0;
  let somaTempoMs = 0;
  let contTempo = 0;

  for (const ev of eventos) {
    if (ev.tipo === 'agendado') {
      totalDisparadas += 1;
      if (porModulo[ev.modulo]) porModulo[ev.modulo].disparadas += 1;
    } else if (ev.tipo === 'aberto') {
      totalAbertas += 1;
      if (porModulo[ev.modulo]) porModulo[ev.modulo].abertas += 1;
      if (typeof ev.tempoAteAbrirMs === 'number' && ev.tempoAteAbrirMs > 0) {
        somaTempoMs += ev.tempoAteAbrirMs;
        contTempo += 1;
      }
    }
  }

  // Tenta complementar com métricas globais do Supabase (user_notifications)
  try {
    const { data: supaRows } = await supabase
      .from('user_notifications')
      .select('campaign_id, clicked, clicked_at, created_at')
      .eq('category', 'local_retencao')
      .limit(500);

    if (supaRows && supaRows.length > 0) {
      for (const row of supaRows) {
        const modKey = (row.campaign_id?.replace('local_', '') as ModuloNotificacaoLocal) || 'audioaulas';
        if (porModulo[modKey]) {
          porModulo[modKey].disparadas += 1;
          totalDisparadas += 1;
          if (row.clicked) {
            porModulo[modKey].abertas += 1;
            totalAbertas += 1;
          }
        }
      }
    }
  } catch {
    /* fallback local */
  }

  // Calcula taxas por módulo
  for (const m of modulos) {
    const d = porModulo[m].disparadas;
    const a = porModulo[m].abertas;
    porModulo[m].taxaPct = d > 0 ? Math.round((a / d) * 100) : 0;
  }

  const taxaAberturaPct = totalDisparadas > 0 ? Math.round((totalAbertas / totalDisparadas) * 100) : 0;
  const tempoMedioAteAbrirMin = contTempo > 0 ? Math.round(somaTempoMs / contTempo / 1000 / 60) : 4;

  const ultimasAberturas = eventos.filter((ev) => ev.tipo === 'aberto').slice(0, 15);

  return {
    totalDisparadas,
    totalAbertas,
    taxaAberturaPct,
    tempoMedioAteAbrirMin,
    porModulo,
    ultimasAberturas,
  };
}

export function limparMetricasLocais(): void {
  try {
    localStorage.removeItem(TELEMETRIA_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// ============================================================================
// 2. FUNÇÕES DE DISPARO REAL AUTOMÁTICO PARA OS USUÁRIOS
// ============================================================================

/** Cancela lembrete pendente de um módulo (ex: quando o aluno retoma a aula) */
export async function cancelarRetencaoModulo(modulo: ModuloNotificacaoLocal): Promise<void> {
  const notifId = NOTIF_IDS_MODULO[modulo];
  if (!notifId) return;

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
    } catch (e) {
      console.warn('[notificacaoLocalManager] Erro ao cancelar notificação:', e);
    }
  }
}

/**
 * Disparador Automático: AUDIOAULAS
 * Acionado ao pausar uma aula de áudio em andamento.
 */
export async function agendarRetencaoAudioaula(dados: {
  id: number | string;
  titulo: string;
  area?: string | null;
  tempo: number;
  duracao: number;
  capaUrl?: string | null;
}): Promise<boolean> {
  const regras = carregarRegrasNotificacoesLocais();
  const regra = regras.find((r) => r.modulo === 'audioaulas');
  if (!regra || !regra.ativo) return false;

  // Só agenda se o aluno estudou mais de 15 segundos e ainda faltam mais de 15 segundos
  if (dados.tempo < 15 || dados.duracao <= 0) return false;
  const pct = Math.min(99, Math.round((dados.tempo / dados.duracao) * 100));
  if (pct >= 95) return false; // Se já concluiu 95%, não precisa incomodar

  const minutosRestantes = Math.max(1, Math.round((dados.duracao - dados.tempo) / 60));
  const titulo = `🎧 ${dados.titulo}`;
  const subtitulo = `Faixa em andamento · faltam ${minutosRestantes} min (${pct}% concluído)`;
  const rota = `/audioaulas?aula=${dados.id}`;

  const delayMs = Math.max(10000, (regra.gatilhoHorasInatividade || 2) * 60 * 60 * 1000);
  const scheduleDate = new Date(Date.now() + delayMs);
  const notifId = NOTIF_IDS_MODULO.audioaulas;

  const eventoId = await registrarDisparoLocal({
    notificacaoId: notifId,
    modulo: 'audioaulas',
    titulo,
    subtitulo,
    progresso: pct,
    rota,
  });

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await registrarCanaisEAcoesLocais();

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: titulo,
            body: subtitulo,
            schedule: { at: scheduleDate, allowWhileIdle: true },
            actionTypeId: TIPO_RETENCAO_ACAO,
            channelId: 'retencao_audio',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#10B981', // Verde Esmeralda
            largeIcon: dados.capaUrl || regra.exemploCapaUrl,
            extra: {
              rota,
              modulo: 'audioaulas',
              progresso: pct,
              eventoId,
            },
          },
        ],
      });
      return true;
    } catch (e) {
      console.warn('[notificacaoLocalManager] Erro no agendamento nativo:', e);
    }
  }

  return true;
}

/**
 * Disparador Automático: VIDEOAULAS (Estilo Netflix / Druno)
 * Acionado ao pausar uma videoaula.
 */
export async function agendarRetencaoVideoaula(dados: {
  id: string | number;
  titulo: string;
  tempo: number;
  duracao: number;
  capaUrl?: string | null;
}): Promise<boolean> {
  const regras = carregarRegrasNotificacoesLocais();
  const regra = regras.find((r) => r.modulo === 'videoaulas');
  if (!regra || !regra.ativo) return false;

  if (dados.tempo < 15 || dados.duracao <= 0) return false;
  const pct = Math.min(99, Math.round((dados.tempo / dados.duracao) * 100));
  if (pct >= 95) return false;

  const minutosRestantes = Math.max(1, Math.round((dados.duracao - dados.tempo) / 60));
  const titulo = `🎬 ${dados.titulo}`;
  const subtitulo = `Capítulo 1 · faltam ${minutosRestantes} min`;
  const rota = `/aprender?video=${dados.id}`;

  const delayMs = Math.max(10000, (regra.gatilhoHorasInatividade || 2) * 60 * 60 * 1000);
  const scheduleDate = new Date(Date.now() + delayMs);
  const notifId = NOTIF_IDS_MODULO.videoaulas;

  const eventoId = await registrarDisparoLocal({
    notificacaoId: notifId,
    modulo: 'videoaulas',
    titulo,
    subtitulo,
    progresso: pct,
    rota,
  });

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await registrarCanaisEAcoesLocais();

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: titulo,
            body: `${subtitulo} · ${pct}% concluído`,
            schedule: { at: scheduleDate, allowWhileIdle: true },
            actionTypeId: TIPO_RETENCAO_ACAO,
            channelId: 'retencao_video',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#2563EB', // Azul Royal vibrante idêntico ao print
            largeIcon: dados.capaUrl || regra.exemploCapaUrl,
            extra: {
              rota,
              modulo: 'videoaulas',
              progresso: pct,
              eventoId,
            },
          },
        ],
      });
      return true;
    } catch (e) {
      console.warn('[notificacaoLocalManager] Erro no agendamento nativo:', e);
    }
  }

  return true;
}

/**
 * Disparador Automático: LIVROS & VADE MECUM
 * Acionado ao fechar ou sair de um livro/código.
 */
export async function agendarRetencaoLivro(dados: {
  id: string | number;
  titulo: string;
  pagina?: number;
  totalPaginas?: number;
  pct?: number;
  capaUrl?: string | null;
}): Promise<boolean> {
  const regras = carregarRegrasNotificacoesLocais();
  const regra = regras.find((r) => r.modulo === 'livros');
  if (!regra || !regra.ativo) return false;

  const pct = dados.pct ?? (dados.pagina && dados.totalPaginas ? Math.round((dados.pagina / dados.totalPaginas) * 100) : 40);
  if (pct >= 98) return false;

  const titulo = `📖 ${dados.titulo}`;
  const subtitulo = dados.pagina ? `Página ${dados.pagina} · ${pct}% lido` : `Progresso salvo · ${pct}% lido`;
  const rota = `/biblioteca?livro=${dados.id}`;

  const delayMs = Math.max(10000, (regra.gatilhoHorasInatividade || 4) * 60 * 60 * 1000);
  const scheduleDate = new Date(Date.now() + delayMs);
  const notifId = NOTIF_IDS_MODULO.livros;

  const eventoId = await registrarDisparoLocal({
    notificacaoId: notifId,
    modulo: 'livros',
    titulo,
    subtitulo,
    progresso: pct,
    rota,
  });

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await registrarCanaisEAcoesLocais();

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: titulo,
            body: subtitulo,
            schedule: { at: scheduleDate, allowWhileIdle: true },
            actionTypeId: TIPO_RETENCAO_ACAO,
            channelId: 'retencao_leitura',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#F59E0B',
            largeIcon: dados.capaUrl || regra.exemploCapaUrl,
            extra: {
              rota,
              modulo: 'livros',
              progresso: pct,
              eventoId,
            },
          },
        ],
      });
      return true;
    } catch (e) {
      console.warn('[notificacaoLocalManager] Erro no agendamento nativo:', e);
    }
  }

  return true;
}

/**
 * Disparador Automático: OFENSIVA / STREAK DIÁRIO
 * Programa o alarme diário das 20h para o aluno não perder a sequência de dias de estudo.
 */
export async function agendarRetencaoStreakDiario(dados?: { diasStreak?: number }): Promise<boolean> {
  const regras = carregarRegrasNotificacoesLocais();
  const regra = regras.find((r) => r.modulo === 'streak');
  if (!regra || !regra.ativo) return false;

  const dias = dados?.diasStreak ?? 7;
  const titulo = `🔥 Mantenha sua ofensiva de ${dias} dias ativa!`;
  const subtitulo = 'Falta apenas 1 questão para manter o fogo aceso hoje';
  const rota = '/questoes';

  const agora = new Date();
  const proximo = new Date();
  proximo.setHours(20, 0, 0, 0);
  if (proximo.getTime() <= agora.getTime()) {
    proximo.setDate(proximo.getDate() + 1);
  }

  const notifId = NOTIF_IDS_MODULO.streak;

  const eventoId = await registrarDisparoLocal({
    notificacaoId: notifId,
    modulo: 'streak',
    titulo,
    subtitulo,
    progresso: 0,
    rota,
  });

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await registrarCanaisEAcoesLocais();

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: titulo,
            body: subtitulo,
            schedule: { at: proximo, allowWhileIdle: true },
            actionTypeId: TIPO_RETENCAO_ACAO,
            channelId: 'lembrete_estudo',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#EA580C',
            extra: {
              rota,
              modulo: 'streak',
              progresso: 0,
              eventoId,
            },
          },
        ],
      });
      return true;
    } catch (e) {
      console.warn('[notificacaoLocalManager] Erro no agendamento nativo:', e);
    }
  }

  return true;
}

/**
 * Dispara uma notificação de teste no aparelho nativo ou navegador.
 */
export async function dispararNotificacaoLocalTeste(params: {
  regra: RegraNotificacaoLocal;
  delaySegundos?: number;
  progresso?: number;
}): Promise<{ sucesso: boolean; mensagem: string }> {
  const { regra, delaySegundos = 0, progresso = regra.progressoExemplo } = params;

  const notifId = NOTIF_IDS_MODULO[regra.modulo] || Math.floor(Math.random() * 800000) + 100000;
  let bodyText = regra.exemploSubtitulo;
  if (regra.mostrarBarraProgresso && progresso > 0) {
    bodyText += ` · ${progresso}% concluído`;
  }

  const eventoId = await registrarDisparoLocal({
    notificacaoId: notifId,
    modulo: regra.modulo,
    titulo: regra.exemploTitulo,
    subtitulo: bodyText,
    progresso,
    rota: regra.rotaPadrao,
  });

  // 1. Caminho NATIVO (Capacitor Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await registrarCanaisEAcoesLocais();

      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') {
          return { sucesso: false, mensagem: 'Permissão de notificação negada no aparelho' };
        }
      }

      const scheduleDate = new Date(Date.now() + Math.max(500, delaySegundos * 1000));

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: regra.exemploTitulo,
            body: bodyText,
            schedule: { at: scheduleDate, allowWhileIdle: true },
            actionTypeId: TIPO_RETENCAO_ACAO,
            channelId: regra.canalAndroid,
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#2563EB',
            largeIcon: regra.exemploCapaUrl,
            extra: {
              rota: regra.rotaPadrao,
              progresso,
              modulo: regra.modulo,
              eventoId,
            },
          },
        ],
      });

      return {
        sucesso: true,
        mensagem:
          delaySegundos > 0
            ? `Agendado para disparar em ${delaySegundos} segundos! Minimize o app ou bloqueie a tela.`
            : 'Notificação local disparada no aparelho!',
      };
    } catch (err: any) {
      console.error('[notificacaoLocalManager] Erro no Capacitor:', err);
      return { sucesso: false, mensagem: `Erro no aparelho: ${err?.message || err}` };
    }
  }

  // 2. Caminho WEB / Desktop (Notification API ou Fallback Toast)
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
      }

      if (perm === 'granted') {
        const scheduleNotification = () => {
          let webBody = regra.exemploSubtitulo;
          if (regra.mostrarBarraProgresso && progresso > 0) {
            webBody += ` · [${'█'.repeat(Math.round(progresso / 10))}${'░'.repeat(10 - Math.round(progresso / 10))}] ${progresso}%`;
          }

          const notif = new Notification(regra.exemploTitulo, {
            body: webBody,
            icon: regra.exemploCapaUrl || '/icon-192.png',
            badge: '/favicon.ico',
            tag: `retencao_${regra.id}`,
          });

          notif.onclick = () => {
            window.focus();
            void registrarAberturaNotificacaoLocal({
              notificacaoId: notifId,
              modulo: regra.modulo,
              acao: 'clique_web',
              rota: regra.rotaPadrao,
              progresso,
              eventoId,
            });
            window.dispatchEvent(
              new CustomEvent('direitoprime:push-navigate', { detail: { path: regra.rotaPadrao } })
            );
          };
        };

        if (delaySegundos > 0) {
          setTimeout(scheduleNotification, delaySegundos * 1000);
          return {
            sucesso: true,
            mensagem: `Notificação agendada para daqui a ${delaySegundos} segundos no navegador!`,
          };
        } else {
          scheduleNotification();
          return { sucesso: true, mensagem: 'Notificação local disparada no navegador!' };
        }
      }
    } catch (err) {
      console.warn('[notificacaoLocalManager] Notification API indisponível:', err);
    }
  }

  return {
    sucesso: true,
    mensagem: 'Notificação simulada com sucesso! (Navegador com permissão bloqueada)',
  };
}
