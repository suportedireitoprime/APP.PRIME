import { ArrowLeft, BookOpen, ChevronRight, CloudDownload, CloudOff, Headphones, Library, Music, PenLine, Presentation, WifiOff, Wifi, Download, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DesktopPageLayout from '@/components/layout/DesktopPageLayout';
import BlocoRecursos from '@/components/offline/BlocoRecursos';
import { useDownloadsOffline } from '@/hooks/useDownloadsOffline';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { formatarBytes } from '@/lib/nativo/audioOffline';
import { RECURSOS_ONLINE, RECURSOS_OFFLINE_SEMPRE, RECURSOS_OFFLINE_APOS_DOWNLOAD } from '@/lib/offlineFeatures';

export default function ModoOffline() {
  const navigate = useNavigate();
  const voltar = () => navigate('/');
  const online = useOnlineStatus();
  const d = useDownloadsOffline();

  const meta = (c: { count: number; bytes: number }, vazio: string) =>
    c.count > 0 ? `${c.count} baixado${c.count !== 1 ? 's' : ''} · ${formatarBytes(c.bytes)}` : vazio;

  const categorias = [
    {
      id: 'leis',
      icon: Library,
      color: '#22c55e',
      title: 'Leis e narrações',
      desc: 'Texto das leis já funciona offline · baixe as narrações em áudio',
      meta: `${LEIS_CATALOG.length} leis · ${d.narracoes.count} áudio${d.narracoes.count !== 1 ? 's' : ''} baixado${d.narracoes.count !== 1 ? 's' : ''}`,
      to: '/modo-offline/leis-e-narracoes',
    },
    {
      id: 'audioaulas',
      icon: Headphones,
      color: '#f59e0b',
      title: 'Audioaulas',
      desc: 'Baixe as aulas em áudio para ouvir sem conexão',
      meta: meta(d.audioaulas, 'Nenhuma aula baixada ainda'),
      to: '/modo-offline/audioaulas',
    },
    {
      id: 'leis-cantadas',
      icon: Music,
      color: '#d946ef',
      title: 'Leis cantadas',
      desc: 'Baixe as faixas e ouça offline no player nativo',
      meta: meta(d.leisCantadas, 'Nenhuma faixa baixada ainda'),
      to: '/modo-offline/leis-cantadas',
    },
    {
      id: 'apresentacoes',
      icon: Presentation,
      color: '#06b6d4',
      title: 'Apresentações narradas',
      desc: 'Baixe o áudio dos slides antes de assistir',
      meta: meta(d.apresentacoes, 'Nenhuma apresentação baixada'),
      to: '/modo-offline/apresentacoes',
    },
    {
      id: 'livros',
      icon: BookOpen,
      color: '#3b82f6',
      title: 'Livros e PDFs',
      desc: 'Escolha os livros da biblioteca para ler sem internet',
      meta: meta(d.livros, 'Nenhum livro baixado ainda'),
      to: '/modo-offline/livros',
    },
    {
      id: 'anotacoes',
      icon: PenLine,
      color: '#94a3b8',
      title: 'Anotações e grifos',
      desc: 'Suas anotações, grifos e favoritos já ficam no aparelho',
      meta: 'Sempre disponível offline',
      to: '/meu-espaco',
    },
    {
      id: 'banco-dados',
      icon: Database,
      color: '#ef4444',
      title: 'Banco de Dados Base',
      desc: 'Baixe Flashcards, Resumos e Questões para o aparelho',
      meta: 'Bancos pesados via download sob demanda',
      to: '/modo-offline/pacotes',
    },
  ];

  /** Cabeçalho colado no topo, sem margens laterais nem borda superior. */
  const mobileHeader = (
    <div
      className="relative overflow-hidden rounded-b-[28px] px-4 pb-5"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%)',
        paddingTop: 'calc(var(--sai-top, env(safe-area-inset-top, 0px)) + 0.75rem)',
        boxShadow: '0 12px 28px -14px hsl(var(--primary) / 0.6)',
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={voltar}
          aria-label="Voltar"
          className="h-12 w-12 sm:h-[52px] sm:w-[52px] shrink-0 rounded-full bg-white/15 border border-white/25 flex items-center justify-center active:scale-95 transition touch-manipulation"
        >
          <ArrowLeft className="h-6 w-6 sm:h-7 sm:w-7 text-white" strokeWidth={2.4} />
        </button>
        <CloudDownload className="h-7 w-7 text-white shrink-0" />
      </div>

      <h1 className="mt-4 font-display text-[24px] font-black leading-tight text-white">
        Estude mesmo sem internet
      </h1>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-white">
        Baixe antes o que você vai usar depois: narrações, audioaulas, leis cantadas, apresentações, livros e PDFs.
        Tudo o que estiver baixado abre na hora, sem conexão e sem gastar dados.
      </p>
    </div>
  );

  return (
    <DesktopPageLayout
      wide
      activeId="ferramentas"
      title="Modo Offline"
      subtitle="Escolha o que baixar"
      mobileHeader={mobileHeader}
    >
      <div className="w-full max-w-full overflow-x-hidden px-4 sm:px-6 py-4 lg:px-0 lg:py-0 space-y-4">

        {!online && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-amber-500/35 bg-amber-500/[0.08] p-3">
            <WifiOff className="h-5 w-5 shrink-0 text-amber-400" />
            <p className="text-[12px] text-foreground/85">
              Você está offline — só o que já foi baixado está disponível agora.
            </p>
          </div>
        )}

        {/* Categorias */}
        <section className="space-y-2.5">
          {categorias.map((c, i) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(c.to)}
              className="w-full min-h-[96px] flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:bg-muted/40 active:scale-[0.99] transition-all text-left"
            >
              <c.icon className="w-7 h-7 shrink-0" style={{ color: c.color }} />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-[15px] text-foreground">{c.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{c.desc}</p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: c.color }}>{c.meta}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </motion.button>
          ))}
        </section>

        {/* O que funciona / não funciona */}
        <div className="space-y-2.5 pt-1">
          <div className="px-1">
            <h2 className="font-display text-[17px] font-black leading-tight text-foreground">
              O que funciona sem internet
            </h2>
            <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
              Toque em cada bloco para ver a lista completa de funções.
            </p>
          </div>
          <BlocoRecursos
            tom="verde"
            icon={Wifi}
            itemIcon={Wifi}
            titulo="Funciona sem internet"
            itens={RECURSOS_OFFLINE_SEMPRE}
          />
          <BlocoRecursos
            tom="amarelo"
            icon={Download}
            itemIcon={Download}
            titulo="Funciona offline depois de baixar"
            itens={RECURSOS_OFFLINE_APOS_DOWNLOAD}
            rodape="Esses conteúdos não vêm dentro do app para não ocupar espaço à toa. Você baixa o que quiser e o arquivo fica salvo no seu aparelho — pode remover quando precisar de espaço."
          />
          <BlocoRecursos
            tom="vermelho"
            icon={CloudOff}
            itemIcon={WifiOff}
            titulo="Não funciona sem internet"
            itens={RECURSOS_ONLINE}
            rodape="Ao tentar abrir uma dessas funções sem conexão, o app avisa na hora — nada trava nem fica carregando à toa."
          />
        </div>
      </div>
    </DesktopPageLayout>
  );
}
