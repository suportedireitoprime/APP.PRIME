import { useEffect, useMemo, useState } from "react";
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Film,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Obra } from "./ObraDetailSheet";
import { MARATONA_TEMPLATES, resolverTemplate } from "@/lib/tematicaMaratonaTemplates";
import {
  atualizarMaratona,
  criarMaratona,
  excluirMaratona,
  getCachedMaratonas,
  loadMaratonas,
  subscribeMaratonas,
  type Maratona,
  type MaratonaItem,
} from "@/lib/tematicaMaratonasStore";

interface Props {
  obras: Obra[];
  onAbrirObra: (o: Obra) => void;
}

export default function TematicaMaratonaView({ obras, onAbrirObra }: Props) {
  const [maratonas, setMaratonas] = useState<Maratona[]>(getCachedMaratonas() ?? []);
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [busca, setBusca] = useState("");

  const obrasMap = useMemo(() => new Map(obras.map((o) => [o.id, o])), [obras]);

  useEffect(() => subscribeMaratonas(() => setMaratonas(getCachedMaratonas() ?? [])), []);

  useEffect(() => {
    loadMaratonas().then(setMaratonas).catch(() => {/* sem sessão */});
  }, []);

  const aberta = maratonas.find((m) => m.id === abertaId) ?? null;

  const salvarItens = async (m: Maratona, itens: MaratonaItem[]) => {
    setMaratonas((prev) => prev.map((x) => (x.id === m.id ? { ...x, itens } : x)));
    try {
      await atualizarMaratona(m.id, { itens });
    } catch {
      toast.error("Não foi possível salvar a maratona.");
    }
  };

  const novaDoTemplate = async (slug: string | null) => {
    const tpl = MARATONA_TEMPLATES.find((t) => t.slug === slug) ?? null;
    const itens: MaratonaItem[] = tpl
      ? resolverTemplate(tpl, obras as any).map((o) => ({ obra_id: o.id, assistido: false }))
      : [];
    try {
      const nova = await criarMaratona(tpl ? tpl.nome : "Minha maratona", itens, tpl?.slug ?? null);
      if (!nova) {
        toast.error("Entre na sua conta para criar maratonas.");
        return;
      }
      setCriando(false);
      setAbertaId(nova.id);
    } catch {
      toast.error("Não foi possível criar a maratona.");
    }
  };

  /* ------------------------------------------------ detalhe de uma maratona */
  if (aberta) {
    const itens = aberta.itens ?? [];
    const assistidos = itens.filter((i) => i.assistido).length;
    const duracao = itens.reduce((acc, i) => acc + (obrasMap.get(i.obra_id)?.duracao_min ?? 0), 0);

    const candidatas = obras
      .filter((o) => !itens.some((i) => i.obra_id === o.id))
      .filter((o) =>
        busca.trim()
          ? `${o.titulo} ${o.titulo_original ?? ""}`.toLowerCase().includes(busca.trim().toLowerCase())
          : true,
      )
      .slice(0, 30);

    return (
      <div className="px-4 pt-3">
        <button
          onClick={() => { setAbertaId(null); setAdicionando(false); setBusca(""); }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Minhas maratonas
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <input
              value={aberta.nome}
              onChange={(e) => {
                const nome = e.target.value;
                setMaratonas((prev) => prev.map((x) => (x.id === aberta.id ? { ...x, nome } : x)));
              }}
              onBlur={(e) => atualizarMaratona(aberta.id, { nome: e.target.value.trim() || "Minha maratona" }).catch(() => {})}
              className="w-full bg-transparent text-2xl font-bold text-foreground outline-none border-b border-transparent focus:border-primary/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {assistidos} de {itens.length} assistidos
              {duracao ? ` · ${Math.round(duracao / 60)}h no total` : ""}
            </p>
          </div>
          <button
            onClick={async () => {
              await excluirMaratona(aberta.id).catch(() => {});
              setAbertaId(null);
            }}
            aria-label="Excluir maratona"
            className="w-9 h-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${itens.length ? (assistidos / itens.length) * 100 : 0}%` }}
          />
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {itens.map((item, i) => {
            const obra = obrasMap.get(item.obra_id);
            if (!obra) return null;
            return (
              <div
                key={item.obra_id}
                className="flex items-stretch gap-3 rounded-xl overflow-hidden bg-card border border-border/50"
              >
                <button
                  onClick={() => onAbrirObra(obra)}
                  className="shrink-0 w-14 aspect-[2/3] overflow-hidden bg-muted"
                >
                  {obra.poster_url ? (
                    <img src={obra.poster_url} alt={obra.titulo} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Film className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </button>
                <div className="flex-1 min-w-0 py-2 pr-2 flex flex-col justify-center">
                  <p className={cn(
                    "text-sm font-semibold leading-tight line-clamp-2",
                    item.assistido ? "text-muted-foreground line-through" : "text-foreground",
                  )}>
                    {i + 1}. {obra.titulo}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {obra.ano ?? ""}{obra.duracao_min ? ` · ${obra.duracao_min} min` : ""}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      onClick={() =>
                        salvarItens(aberta, itens.map((x, idx) => (idx === i ? { ...x, assistido: !x.assistido } : x)))
                      }
                      className={cn(
                        "flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-semibold transition-colors",
                        item.assistido
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Check className="w-3 h-3" /> Assistido
                    </button>
                    <button
                      disabled={i === 0}
                      onClick={() => {
                        const arr = [...itens];
                        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                        salvarItens(aberta, arr);
                      }}
                      aria-label="Subir"
                      className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={i === itens.length - 1}
                      onClick={() => {
                        const arr = [...itens];
                        [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                        salvarItens(aberta, arr);
                      }}
                      aria-label="Descer"
                      className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => salvarItens(aberta, itens.filter((_, idx) => idx !== i))}
                      aria-label="Remover"
                      className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setAdicionando((v) => !v)}
          className="mt-4 w-full h-11 rounded-xl border border-dashed border-border text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Adicionar obra
        </button>

        {adicionando && (
          <div className="mt-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar no acervo..."
                className="pl-9 h-11 rounded-xl"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 pb-4">
              {candidatas.map((o) => (
                <button
                  key={o.id}
                  onClick={() => salvarItens(aberta, [...itens, { obra_id: o.id, assistido: false }])}
                  className="text-left"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted border border-border/50">
                    {o.poster_url ? (
                      <img src={o.poster_url} alt={o.titulo} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-foreground leading-tight line-clamp-2">{o.titulo}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* --------------------------------------------------------- lista + novos */
  return (
    <div className="px-4 pt-4">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold">SUA SEQUÊNCIA</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-1 h-6 rounded-full bg-primary" />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">Maratona</h2>
        </div>
      </div>

      {maratonas.length > 0 && (
        <div className="flex flex-col gap-2.5 mb-6">
          {maratonas.map((m) => {
            const capas = (m.itens ?? []).slice(0, 4).map((i) => obrasMap.get(i.obra_id)?.poster_url).filter(Boolean) as string[];
            const assistidos = (m.itens ?? []).filter((i) => i.assistido).length;
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setAbertaId(m.id)}
                className="flex items-center gap-3 rounded-xl bg-card border border-border/50 p-3 text-left hover:border-primary/40 transition-colors"
              >
                <div className="flex -space-x-4 shrink-0">
                  {capas.length ? capas.map((c, i) => (
                    <img key={i} src={c} alt="" loading="lazy" className="w-9 h-14 rounded-md object-cover border border-background" />
                  )) : (
                    <div className="w-9 h-14 rounded-md bg-muted flex items-center justify-center">
                      <Film className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{m.nome}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {(m.itens ?? []).length} obras · {assistidos} assistidos
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setCriando((v) => !v)}
        className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> Nova maratona
      </button>

      {criando && (
        <div className="mt-4">
          <button
            onClick={() => novaDoTemplate(null)}
            className="w-full h-11 rounded-xl border border-dashed border-border text-sm font-semibold text-muted-foreground hover:text-foreground mb-3"
          >
            Começar do zero
          </button>
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold mb-2">TEMPLATES PRONTOS</p>
          <div className="flex flex-col gap-2.5 pb-6">
            {MARATONA_TEMPLATES.map((t) => {
              const previa = resolverTemplate(t, obras as any);
              return (
                <button
                  key={t.slug}
                  onClick={() => novaDoTemplate(t.slug)}
                  className="flex items-center gap-3 rounded-xl bg-card border border-border/50 p-3 text-left hover:border-primary/40 transition-colors"
                >
                  <span className="text-2xl shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">{t.nome}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.descricao}</p>
                    <p className="text-[10px] text-primary/90 font-semibold mt-1">{previa.length} obras</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

