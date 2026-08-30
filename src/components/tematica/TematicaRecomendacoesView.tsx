import { useMemo, useState } from "react";
import { motion } from 'framer-motion';
import { CalendarDays, Film, MapPin, Sparkles, Star, UtensilsCrossed, ExternalLink, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Obra } from "./ObraDetailSheet";
import {
  CATEGORIAS_RECOMENDACAO,
  formatarSexta,
  montarAgenda,
  obrasDaCategoria,
} from "@/lib/tematicaRecomendacoes";

interface Props {
  obras: Obra[];
  onAbrirObra: (o: Obra) => void;
}

function ondeAssistir(obra: Obra): string[] {
  const p = obra.providers;
  if (!p) return [];
  const nomes = [...(p.flatrate ?? []), ...(p.free ?? []), ...(p.ads ?? []), ...(p.rent ?? []), ...(p.buy ?? [])]
    .map((x) => x.nome)
    .filter(Boolean);
  return Array.from(new Set(nomes)).slice(0, 4);
}

export default function TematicaRecomendacoesView({ obras, onAbrirObra }: Props) {
  const [categoriaId, setCategoriaId] = useState<string | null>(null);

  const agenda = useMemo(() => (obras.length ? montarAgenda<Obra>(obras, 8) : []), [obras]);
  const destaque = agenda[0] ?? null;

  const categoria = categoriaId
    ? CATEGORIAS_RECOMENDACAO.find((c) => c.id === categoriaId) ?? null
    : null;

  const listaCategoria = useMemo(
    () => (categoria ? obrasDaCategoria<Obra>(categoria, obras) : []),
    [categoria, obras],
  );

  if (!obras.length) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Carregando o acervo...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-4">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold">
          TODA SEXTA-FEIRA
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-1 h-6 rounded-full bg-primary" />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            Recomendações
          </h2>
        </div>
      </div>

      {/* Destaque da próxima sexta */}
      {destaque?.obra && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden border border-primary/25 bg-card"
        >
          {destaque.obra.backdrop_url ? (
            <img
              src={destaque.obra.backdrop_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
          <div className="relative p-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider">
              <CalendarDays className="w-3.5 h-3.5" />
              Sexta, {formatarSexta(destaque.data)}
            </div>

            <div className="flex gap-3 mt-3">
              <button
                onClick={() => onAbrirObra(destaque.obra as Obra)}
                className="shrink-0 w-24 aspect-[2/3] rounded-xl overflow-hidden bg-muted border border-border/50"
              >
                {destaque.obra.poster_url ? (
                  <img src={destaque.obra.poster_url} alt={destaque.obra.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {destaque.categoria.emoji} {destaque.categoria.label}
                </p>
                <h3 className="text-lg font-bold text-foreground leading-tight mt-0.5">
                  {destaque.obra.titulo}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                  {destaque.obra.ano ? <span>{destaque.obra.ano}</span> : null}
                  {destaque.obra.nota ? (
                    <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                      <Star className="w-3 h-3 fill-amber-500" strokeWidth={0} />
                      {destaque.obra.nota.toFixed(1)}
                    </span>
                  ) : null}
                  {destaque.obra.duracao_min ? <span>{destaque.obra.duracao_min} min</span> : null}
                </div>
                <p className="text-[12px] text-muted-foreground mt-2 line-clamp-3">
                  {destaque.obra.porque_assistir || destaque.obra.sinopse || destaque.categoria.descricao}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2.5">
              <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Por que assistir</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{destaque.categoria.descricao} {destaque.categoria.clima}</p>
                </div>
              </div>
              <a
                href={destaque.obra.providers?.link || undefined}
                target={destaque.obra.providers?.link ? "_blank" : undefined}
                rel="noreferrer"
                className={cn(
                  "flex items-start gap-2 rounded-xl bg-muted/60 p-3 transition-colors",
                  destaque.obra.providers?.link ? "hover:bg-muted/80 cursor-pointer" : "cursor-default"
                )}
                onClick={(e) => { if (!destaque.obra.providers?.link) e.preventDefault(); }}
              >
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Onde assistir</p>
                    {destaque.obra.providers?.link && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {ondeAssistir(destaque.obra).join(" · ") || "Confira disponibilidade nas plataformas."}
                  </p>
                </div>
              </a>

              {destaque.obra.trailer_youtube_id && (
                <a
                  href={`https://www.youtube.com/watch?v=${destaque.obra.trailer_youtube_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 transition-colors hover:bg-muted/80 cursor-pointer"
                >
                  <Play className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Trailer</p>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Assista ao trailer oficial.</p>
                  </div>
                </a>
              )}
              <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3">
                <UtensilsCrossed className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">Para acompanhar</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {destaque.categoria.comidas.join(" · ")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Calendário das próximas sextas */}
      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold mb-2">
          PRÓXIMAS SEXTAS
        </p>
        <div className="flex flex-col gap-2.5">
          {agenda.slice(1).map(({ data, categoria: cat, obra }) =>
            obra ? (
              <button
                key={data.toISOString()}
                onClick={() => onAbrirObra(obra as Obra)}
                className="flex items-center gap-3 rounded-xl bg-card border border-border/50 p-2.5 text-left hover:border-primary/40 transition-colors"
              >
                <div className="shrink-0 w-12 text-center">
                  <p className="text-lg font-black text-primary leading-none tabular-nums">
                    {String(data.getDate()).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] uppercase text-muted-foreground mt-0.5">
                    {data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                  </p>
                </div>
                <div className="shrink-0 w-10 aspect-[2/3] rounded-md overflow-hidden bg-muted">
                  {obra.poster_url ? (
                    <img src={obra.poster_url} alt={obra.titulo} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-muted-foreground">{cat.emoji} {cat.label}</p>
                  <p className="text-sm font-semibold text-foreground leading-tight line-clamp-1">
                    {obra.titulo}
                  </p>
                </div>
              </button>
            ) : null,
          )}
        </div>
      </div>

      {/* Categorias por contexto */}
      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold mb-2">
          COM QUEM VOCÊ VAI ASSISTIR
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {CATEGORIAS_RECOMENDACAO.map((c) => {
            const active = categoriaId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoriaId(active ? null : c.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {categoria && (
          <div className="mt-3">
            <p className="text-[12px] text-muted-foreground">{categoria.descricao}</p>
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3 pb-4">
              {listaCategoria.map((o) => (
                <button key={o.id} onClick={() => onAbrirObra(o as Obra)} className="text-left">
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted border border-border/50">
                    {o.poster_url ? (
                      <img src={o.poster_url} alt={o.titulo} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-[12px] font-semibold text-foreground leading-tight line-clamp-2">
                    {o.titulo}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

