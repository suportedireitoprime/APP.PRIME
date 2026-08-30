import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { motion, AnimatePresence } from "framer-motion";
import { Film, Search, Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Obra } from "./ObraDetailSheet";

interface Props {
  open: boolean;
  titulo: string;
  eyebrow?: string;
  obras: Obra[];
  onAbrir: (o: Obra) => void;
  onClose: () => void;
}

export default function VerTodosSheet({ open, titulo, eyebrow, obras, onAbrir, onClose }: Props) {
  const [busca, setBusca] = useState("");

  useEffect(() => {
    if (!open) return;
    setBusca("");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return obras;
    return obras.filter((o) =>
      `${o.titulo} ${o.titulo_original ?? ""}`.toLowerCase().includes(termo),
    );
  }, [obras, busca]);

  const conteudo = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[180] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-[181] h-[90vh] bg-background rounded-t-3xl overflow-hidden flex flex-col shadow-2xl mx-auto max-w-3xl"
          >
            <div className="shrink-0 px-4 pt-3 pb-3 border-b border-border/60">
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {eyebrow ? (
                    <p className="text-[10px] uppercase tracking-[0.22em] text-primary/90 font-bold">
                      {eyebrow}
                    </p>
                  ) : null}
                  <h2 className="text-xl font-bold text-foreground leading-tight mt-0.5">
                    {titulo}
                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                      {obras.length}
                    </span>
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="w-9 h-9 shrink-0 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center text-foreground/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative mt-3">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar nesta lista..."
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {lista.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Film className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nada encontrado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pb-8">
                  {lista.map((obra) => (
                    <button
                      key={obra.id}
                      onClick={() => onAbrir(obra)}
                      className="group text-left"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-muted border border-border/50 group-hover:border-primary/40 transition-colors">
                        {obra.poster_url ? (
                          <img
                            src={obra.poster_url}
                            alt={obra.titulo}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg, hsl(0 55% 22%), hsl(05 65% 14%))" }}
                          >
                            <Film className="w-6 h-6 text-red-200/60" strokeWidth={1.5} />
                          </div>
                        )}
                        {obra.nota ? (
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur text-amber-300 text-[10px] font-bold">
                            <Star className="w-2.5 h-2.5 fill-amber-400" strokeWidth={0} />
                            {obra.nota.toFixed(1)}
                          </div>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[12px] font-semibold text-foreground leading-tight line-clamp-2">
                        {obra.titulo}
                      </p>
                      {obra.ano ? (
                        <p className="text-[10px] text-muted-foreground">{obra.ano}</p>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === "undefined") return null;
  return createPortal(conteudo, document.body);
}


