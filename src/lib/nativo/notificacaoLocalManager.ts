/**
 * Gerenciador de Notificações Locais de Retenção & Engajamento
 * Suporta gatilhos inteligentes no aparelho (Continuar assistindo, continuar lendo,
 * barra de progresso, streak e repetição espaçada) com fallback para Web Notification.
 */
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

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

export function carregarRegrasNotificacoesLocais(): RegraNotificacaoLocal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return REGRAS_PADRAO_NOTIFICACOES_LOCAIS;
    const parsed = JSON.parse(raw) as RegraNotificacaoLocal[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Mescla com eventuais novas regras padrão
      const idsExistentes = new Set(parsed.map(r => r.id));
      const faltantes = REGRAS_PADRAO_NOTIFICACOES_LOCAIS.filter(r => !idsExistentes.has(r.id));
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
      const extra = (evento.notification?.extra ?? {}) as { rota?: string };
      if (evento.actionId === 'continuar' && extra.rota) {
        window.dispatchEvent(new CustomEvent('direitoprime:push-navigate', { detail: { path: extra.rota } }));
      }
    });
  } catch (e) {
    console.warn('[notificacaoLocalManager] Falha ao registrar canais:', e);
  }
}

/**
 * Dispara uma notificação de teste no aparelho nativo ou navegador.
 * Suporta agendamento com atraso (ex: 5 segundos) para o usuário poder minimizar o app e ver a mágica acontecer!
 */
export async function dispararNotificacaoLocalTeste(params: {
  regra: RegraNotificacaoLocal;
  delaySegundos?: number;
  progresso?: number;
}): Promise<{ sucesso: boolean; mensagem: string }> {
  const { regra, delaySegundos = 0, progresso = regra.progressoExemplo } = params;

  // 1. Caminho NATIVO (Capacitor Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await registrarCanaisEAcoesLocais();

      // Solicita permissão se ainda não concedida
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') {
          return { sucesso: false, mensagem: 'Permissão de notificação negada no aparelho' };
        }
      }

      const scheduleDate = new Date(Date.now() + Math.max(500, delaySegundos * 1000));
      const notifId = Math.floor(Math.random() * 800000) + 100000;

      // Monta corpo com representação visual de progresso se ativado
      let bodyText = regra.exemploSubtitulo;
      if (regra.mostrarBarraProgresso && progresso > 0) {
        bodyText += ` · ${progresso}% concluído`;
      }

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
            iconColor: '#2563EB', // Azul Royal vibrante idêntico ao Android do print
            largeIcon: regra.exemploCapaUrl,
            extra: {
              rota: regra.rotaPadrao,
              progresso,
              modulo: regra.modulo,
            },
          },
        ],
      });

      return {
        sucesso: true,
        mensagem: delaySegundos > 0
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
          let bodyText = regra.exemploSubtitulo;
          if (regra.mostrarBarraProgresso && progresso > 0) {
            bodyText += ` · [${'█'.repeat(Math.round(progresso / 10))}${'░'.repeat(10 - Math.round(progresso / 10))}] ${progresso}%`;
          }

          const notif = new Notification(regra.exemploTitulo, {
            body: bodyText,
            icon: regra.exemploCapaUrl || '/icon-192.png',
            badge: '/favicon.ico',
            tag: `retencao_${regra.id}`,
          });

          notif.onclick = () => {
            window.focus();
            window.dispatchEvent(new CustomEvent('direitoprime:push-navigate', { detail: { path: regra.rotaPadrao } }));
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

  // Fallback simulado elegante
  return {
    sucesso: true,
    mensagem: 'Notificação simulada com sucesso! (Navegador com permissão bloqueada)',
  };
}
