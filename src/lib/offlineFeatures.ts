import { toast } from 'sonner';

/** Recursos que dependem de internet — usados no Modo Offline e nos guards. */
export const RECURSOS_ONLINE: { label: string; desc: string }[] = [
  { label: 'Videoaulas', desc: 'Busca e reprodução dos vídeos do YouTube' },
  { label: 'IA Jurídica', desc: 'Explicar, perguntar, resumir, grifo mágico e termos' },
  { label: 'Novas narrações', desc: 'Gerar áudio novo (os já baixados tocam offline)' },
  { label: 'Jurisprudência ao vivo', desc: 'Súmulas, teses e informativos ainda não abertos' },
  { label: 'Radar e notícias', desc: 'Projetos, boletins e conteúdo novo em tempo real' },
  { label: 'Conta e assinatura', desc: 'Login, cadastro, compra e restauração de plano' },
];

/** Funciona sem internet, sem precisar baixar nada. */
export const RECURSOS_OFFLINE_SEMPRE: { label: string; desc: string }[] = [
  { label: 'Leis e artigos', desc: 'Texto integral dos códigos, estatutos e leis já embutidos no app' },
  { label: 'Anotações e grifos', desc: 'Tudo que você escreve e marca fica salvo no aparelho' },
  { label: 'Favoritos e histórico', desc: 'Seus artigos salvos e o que você já abriu' },
  { label: 'Busca por artigo', desc: 'Pesquisa dentro das leis disponíveis no aparelho' },
  { label: 'Lembretes de estudo', desc: 'Avisos agendados disparam mesmo sem conexão' },
  { label: 'Downloads', desc: 'Áudios, livros e PDFs que você já baixou tocam e abrem na hora' },
];

/** Funciona offline, mas só depois que o usuário baixa o conteúdo. */
export const RECURSOS_OFFLINE_APOS_DOWNLOAD: { label: string; desc: string }[] = [
  { label: 'Audioaulas', desc: 'Baixe as aulas que quiser ouvir sem conexão' },
  { label: 'Leis cantadas', desc: 'Baixe as faixas para ouvir sem internet' },
  { label: 'Narrações de leis', desc: 'Baixe o áudio dos artigos narrados' },
  { label: 'Apresentações narradas', desc: 'Baixe o áudio dos slides antes de assistir' },
  { label: 'Livros e PDFs', desc: 'Baixe os livros da biblioteca para ler offline' },
  { label: 'Resumos em PDF', desc: 'Gere e baixe o PDF enquanto tem conexão' },
];

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * Retorna false e avisa o usuário quando não há internet.
 * Uso: `if (!requireOnline('Videoaulas')) return;`
 */
export function requireOnline(feature: string): boolean {
  if (!isOffline()) return true;
  toast.error('Você está sem internet', {
    description: `${feature} só funciona com conexão. Reconecte e tente de novo.`,
  });
  return false;
}
