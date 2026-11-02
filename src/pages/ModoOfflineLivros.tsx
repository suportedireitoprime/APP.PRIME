import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import {
  BookOpen,
  FileDown,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  HardDrive,
  Wifi,
} from "lucide-react";
import DesktopPageLayout from "@/components/layout/DesktopPageLayout";
import { PageHeader } from "@/components/vademecum/navigation/PageHeader";
import { toast } from "sonner";
import { confirmar } from "@/lib/nativo/dialogos";
import { formatBytes } from "@/data/offlineCatalog";
import { listCachedPdfs, clearAllPdfs } from "@/services/bibliotecaPdfCache";
import {
  subscribeCapasProgress,
  startCapasPrefetch,
  resetCapasCache,
  type CapasPrefetchProgress,
} from "@/services/bibliotecaCapasPrefetch";
import {
  subscribeNativoProgress,
  startLeituraNativaPrefetch,
  resetLeituraNativaCache,
  type NativoPrefetchProgress,
} from "@/services/leituraNativaPrefetch";

export default function ModoOfflineLivros() {
  const navigate = useNavigate();
  const isNative = Capacitor.isNativePlatform();

  const [capas, setCapas] = useState<CapasPrefetchProgress>({ done: 0, total: 0, status: "idle" });
  const [nativo, setNativo] = useState<NativoPrefetchProgress>({
    done: 0,
    total: 0,
    status: "idle",
  });
  const [pdfs, setPdfs] = useState<{ name: string; uri: string; size: number }[]>([]);

  useEffect(() => {
    const u = subscribeCapasProgress(setCapas);
    return () => {
      u();
    };
  }, []);
  useEffect(() => {
    const u = subscribeNativoProgress(setNativo);
    return () => {
      u();
    };
  }, []);

  const refresh = () => {
    listCachedPdfs()
      .then(setPdfs)
      .catch(() => setPdfs([]));
  };
  useEffect(() => {
    refresh();
  }, []);

  const bytes = pdfs.reduce((s, p) => s + (p.size || 0), 0);
  const pctCapas = capas.total > 0 ? Math.round((capas.done / capas.total) * 100) : 0;
  const pctNativo = nativo.total > 0 ? Math.round((nativo.done / nativo.total) * 100) : 0;

  const handleClear = async () => {
    if (!(await confirmar({ mensagem: "Remover todos os livros baixados?" }))) return;
    await clearAllPdfs();
    toast.success("Livros removidos");
    refresh();
  };

  const mobileHeader = (
    <PageHeader
      title="Livros offline"
      subtitle="Biblioteca no aparelho"
      onBack={() => navigate("/modo-offline")}
      leading={
        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-primary" />
        </div>
      }
    />
  );

  return (
    <DesktopPageLayout
      activeId="ferramentas"
      title="Livros offline"
      subtitle="Biblioteca no aparelho"
      mobileHeader={mobileHeader}
    >
      <div className="w-full max-w-3xl overflow-x-hidden px-4 sm:px-6 py-4 lg:px-0 lg:py-0 space-y-5">
        {!isNative && (
          <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4 flex items-start gap-3">
            <Wifi className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <strong className="text-foreground">Suporte Web & PWA ativo:</strong> as capas
              baixadas são salvas com persistência no IndexedDB para carregamento instantâneo a 0ms
              mesmo em modo avião.
            </div>
          </div>
        )}

        <SectionCard
          icon={<ImageIcon className="w-5 h-5" />}
          title="Capas da biblioteca"
          subtitle={
            isNative
              ? "Todos os livros do acervo (disco nativo) — cerca de 80 MB"
              : "Todos os livros do acervo (IndexedDB) — cerca de 80 MB"
          }
          status={capas.status}
          progress={pctCapas}
          done={capas.done}
          total={capas.total}
          onStart={() => startCapasPrefetch({ wifiOnly: false })}
          onReset={async () => {
            await resetCapasCache();
            toast.success("Capas offline removidas");
          }}
          disabled={false}
        />

        <SectionCard
          icon={<BookOpen className="w-5 h-5" />}
          title="Leitura nativa"
          subtitle="Áreas do Direito, Clássicos e Liderança — cerca de 200 MB"
          status={nativo.status}
          progress={pctNativo}
          done={nativo.done}
          total={nativo.total}
          onStart={() => startLeituraNativaPrefetch({ wifiOnly: false })}
          onReset={async () => {
            await resetLeituraNativaCache();
            toast.success("Leitura nativa removida");
          }}
          disabled={!isNative}
        />

        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileDown className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">
                {pdfs.length > 0
                  ? `${pdfs.length} livro${pdfs.length !== 1 ? "s" : ""} salvo${pdfs.length !== 1 ? "s" : ""}`
                  : "Nenhum livro baixado ainda"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {pdfs.length > 0
                  ? formatBytes(bytes)
                  : 'Abra um livro e toque em "Baixar para offline".'}
              </p>
            </div>
            <button
              onClick={refresh}
              className="w-9 h-9 rounded-full bg-secondary/60 hover:bg-secondary flex items-center justify-center"
              aria-label="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/biblioteca")}
              className="flex-1 min-w-[140px] h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Escolher livros
            </button>
          </div>
        </section>

        {pdfs.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-display font-bold text-sm text-foreground px-1">Baixados</h3>
            <div className="grid gap-1.5">
              {pdfs.map((p) => (
                <div
                  key={p.uri}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-semibold leading-tight text-foreground break-words">
                      {p.name.replace(/\.pdf$/i, "")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatBytes(p.size || 0)}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleClear}
              className="text-[11px] text-destructive hover:underline flex items-center gap-1 px-1 pt-1"
            >
              <Trash2 className="w-3 h-3" /> Limpar livros baixados
            </button>
          </section>
        )}

        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 flex items-start gap-3">
          <HardDrive className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-[12px] text-muted-foreground leading-snug">
            <strong className="text-foreground">Como funciona:</strong> capas e leitura nativa
            (texto + imagens do OCR) das 3 coleções principais baixam sob demanda. Os PDFs completos
            você escolhe quais livros quer baixar.
          </div>
        </div>
      </div>
    </DesktopPageLayout>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  status,
  progress,
  done,
  total,
  onStart,
  onReset,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: "idle" | "running" | "done" | "error";
  progress: number;
  done: number;
  total: number;
  onStart: () => void;
  onReset: () => void;
  disabled?: boolean;
}) {
  const isRunning = status === "running";
  const isDone = status === "done";

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
          {total > 0 && (
            <div className="text-[11px] text-muted-foreground mt-1">
              {done} de {total} ({progress}%)
            </div>
          )}
        </div>
      </div>

      {isRunning && (
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onStart}
          disabled={disabled || isRunning}
          className="flex-1 rounded-xl bg-primary text-primary-foreground font-semibold text-xs py-2.5 disabled:opacity-50"
        >
          {isRunning ? "Baixando..." : isDone ? "Atualizar" : "Baixar"}
        </button>
        <button
          onClick={onReset}
          disabled={disabled || isRunning}
          className="rounded-xl border border-border text-muted-foreground hover:text-foreground text-xs px-3 py-2.5 disabled:opacity-50"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}
