import React, { useState, useEffect, useMemo } from "react";
import { Search, X, Play, Pause, Volume2, Heart, Sparkles, BookOpen } from "lucide-react";
import { type AulaAudio, audioIdOf } from "@/contexts/AudioaulasPlayerContext";
import { normalizar } from "@/lib/audioaulasHelper";
import { haptic } from "@/lib/nativeHaptics";
import { Button } from "@/components/ui/button";

interface AudioaulasBuscaGlobalProps {
  aulas: AulaAudio[];
  atualId: number | null;
  tocando: boolean;
  handleTocarAula: (a: AulaAudio) => void;
  favoritos: Set<string>;
  alternarFavorito: (a: AulaAudio) => void;
  busca: string;
  setBusca: (v: string) => void;
  children: React.ReactNode;
}

function destacarTermos(texto: string, termoBusca: string) {
  if (!texto || !termoBusca.trim()) return texto;
  const palavras = termoBusca
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (!palavras.length) return texto;

  try {
    const regex = new RegExp(`(${palavras.join("|")})`, "gi");
    const partes = texto.split(regex);
    return partes.map((parte, i) =>
      regex.test(parte) ? (
        <mark
          key={i}
          className="bg-[#ff6b4a]/30 text-white font-black rounded-sm px-0.5 border-b border-[#ffa285]"
        >
          {parte}
        </mark>
      ) : (
        parte
      ),
    );
  } catch {
    return texto;
  }
}

export const AudioaulasBuscaGlobal: React.FC<AudioaulasBuscaGlobalProps> = ({
  aulas,
  atualId,
  tocando,
  handleTocarAula,
  favoritos,
  alternarFavorito,
  busca,
  setBusca,
  children,
}) => {
  const [termoLocal, setTermoLocal] = useState(busca);
  const [debouncedTermo, setDebouncedTermo] = useState(busca);

  // Sincroniza termo com prop externa se ela mudar
  useEffect(() => {
    setTermoLocal(busca);
  }, [busca]);

  // Debounce de 150ms para fluidez total a 120fps
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTermo(termoLocal);
      setBusca(termoLocal);
    }, 150);
    return () => clearTimeout(timer);
  }, [termoLocal, setBusca]);

  // Busca fuzzy / multi-token instantânea em memória sobre as 3.181 aulas
  const resultados = useMemo(() => {
    const q = normalizar(debouncedTermo);
    if (!q) return [];

    const tokens = q.split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];

    const filtradas: AulaAudio[] = [];

    for (const a of aulas) {
      const tituloNorm = normalizar(a.titulo || "");
      const temaNorm = normalizar(a.tema || "");
      const areaNorm = normalizar(a.area || "");
      const combinada = `${tituloNorm} ${temaNorm} ${areaNorm}`;

      // Todos os tokens digitados precisam casar
      const bateu = tokens.every((tok) => combinada.includes(tok));
      if (bateu) {
        filtradas.push(a);
      }
    }

    return filtradas;
  }, [debouncedTermo, aulas]);

  const temBuscaAtiva = debouncedTermo.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Barra de Pesquisa Fixada/Integrada no Topo do Hub — Laranja Salmão da Onda */}
      <div className="mx-auto w-full max-w-350 px-4 lg:px-10 2xl:max-w-[1600px]">
        <div className="relative group">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#ffa285] group-focus-within:text-[#ffd4c7] transition-colors" />
          <input
            type="text"
            value={termoLocal}
            onChange={(e) => setTermoLocal(e.target.value)}
            placeholder={`Pesquisar entre as ${aulas.length > 0 ? aulas.length.toLocaleString("pt-BR") : "3.181"} aulas (ex: homicídio, 121, legítima defesa, usucapião)...`}
            className="w-full rounded-2xl border border-[#ff6b4a]/35 bg-[#ff6b4a]/10 py-3 pl-11 pr-11 text-sm text-foreground placeholder:text-zinc-400 outline-none transition-all focus:border-[#ffa285] focus:bg-[#ff6b4a]/18 focus:ring-2 focus:ring-[#ff6b4a]/25 shadow-sm"
          />
          {termoLocal && (
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                setTermoLocal("");
                setDebouncedTermo("");
                setBusca("");
              }}
              aria-label="Limpar busca"
              className="absolute right-3.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#ffa285]/80 hover:text-white hover:bg-[#ff6b4a]/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Renderização Condicional: Resultados da Busca Instantânea vs Hub Normal */}
      {temBuscaAtiva ? (
        <div className="mx-auto w-full max-w-350 px-4 space-y-4 lg:px-10 2xl:max-w-[1600px] min-h-[50vh]">
          {/* Header com Quantidade de Resultados */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ffa285]" />
              <span className="text-sm font-semibold text-foreground">
                {resultados.length === 0
                  ? `Nenhum resultado para "${debouncedTermo}"`
                  : `${resultados.length.toLocaleString("pt-BR")} ${
                      resultados.length === 1 ? "aula encontrada" : "aulas encontradas"
                    }`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTermoLocal("");
                setDebouncedTermo("");
                setBusca("");
              }}
              className="text-xs text-[#ffa285] hover:text-[#ffd4c7] hover:bg-[#ff6b4a]/10 h-7 px-2"
            >
              Limpar busca
            </Button>
          </div>

          {resultados.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground space-y-2">
              <BookOpen className="w-10 h-10 text-muted-foreground/60 mx-auto mb-2" />
              <p className="text-sm font-medium">Nenhuma aula corresponde ao termo digitado.</p>
              <p className="text-xs text-muted-foreground/80">
                Tente buscar por um artigo de lei (ex: "121", "art 5"), um tema ou ramo jurídico.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {resultados.slice(0, 100).map((aula) => {
                const isAtual = atualId === aula.id;
                const isPlaying = isAtual && tocando;
                const isFav = favoritos.has(audioIdOf(aula));

                return (
                  <div
                    key={aula.id}
                    onClick={() => {
                      haptic.impact();
                      handleTocarAula(aula);
                    }}
                    className={`group flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isAtual
                        ? "bg-[#ff6b4a]/15 border-[#ff6b4a]/60 shadow-md shadow-black/40 ring-1 ring-[#ff6b4a]/30"
                        : "bg-white/4 border-white/5 hover:border-[#ff6b4a]/35 hover:bg-white/6"
                    }`}
                  >
                    {/* Botão Play / Indicador */}
                    <button
                      type="button"
                      aria-label={isPlaying ? "Pausar" : "Tocar aula"}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
                        isAtual
                          ? "bg-gradient-to-tr from-[#ff6b4a] to-[#ffa285] text-white shadow-sm shadow-[#ff6b4a]/40"
                          : "bg-white/8 text-zinc-300 group-hover:bg-[#ff6b4a] group-hover:text-white"
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : isAtual ? (
                        <Volume2 className="w-4 h-4 animate-pulse text-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    {/* Informações da Aula */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#ff6b4a]/10 text-[#ffa285] border border-[#ff6b4a]/30">
                          {destacarTermos(aula.area || "Geral", debouncedTermo)}
                        </span>
                        {aula.tema && (
                          <span className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                            • {destacarTermos(aula.tema, debouncedTermo)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-white transition-colors">
                        {destacarTermos(aula.titulo, debouncedTermo)}
                      </p>
                    </div>

                    {/* Botão Favoritar */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptic.selection();
                        alternarFavorito(aula);
                      }}
                      aria-label="Favoritar aula"
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 transition-transform active:scale-125 ${
                          isFav ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {resultados.length > 100 && (
            <p className="text-center text-xs text-muted-foreground pt-2">
              Exibindo as primeiras 100 aulas de {resultados.length.toLocaleString("pt-BR")}. Refine
              sua busca para ver resultados mais específicos.
            </p>
          )}
        </div>
      ) : (
        /* Quando não há busca ativa, renderiza o Hub normal (carrosséis, etc) */
        children
      )}
    </div>
  );
};
