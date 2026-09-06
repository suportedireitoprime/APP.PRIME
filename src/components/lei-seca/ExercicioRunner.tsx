import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Exercicio } from "@/lib/leiSeca";
import { ArtigoComentarioSlide } from "./ArtigoComentarioSlide";
import { RespondidoContext } from "./respondidoContext";

import {
  ExercicioMultiplaEscolha,
  ExercicioSimNao,
  ExercicioSlideFeedback as Slide,
} from "./chunks";

interface Props {
  exercicio: Exercicio;
  artigoTexto?: string;
  onRespondido?: (v: boolean) => void;
  onResultado: (certo: boolean) => void;
}

export function ExercicioRunner({ exercicio, artigoTexto = "", onRespondido, onResultado }: Props) {
  const common = { artigoTexto, onResultado };
  const inner = (() => {
    switch (exercicio.tipo) {
      case "completar":
      case "alternativas":
      case "prazo_numero":
        return <ExercicioMultiplaEscolha ex={exercicio as any} {...common} />;
      case "pena":
        return <Pena ex={exercicio} {...common} />;
      case "sim_nao":
        return <ExercicioSimNao ex={exercicio as any} {...common} />;
      case "organizar":
        return <Organizar ex={exercicio} {...common} />;
      case "ligar":
        return <Ligar ex={exercicio} {...common} />;
      case "erro":
        return <LocalizarErro ex={exercicio} {...common} />;
      case "qual_artigo":
        return <QualArtigo ex={exercicio} {...common} />;
      case "qual_inciso":
        return <QualInciso ex={exercicio} {...common} />;
      case "classificar":
        return <Classificar ex={exercicio} {...common} />;
      case "caca_palavra":
        return <CacaPalavra ex={exercicio} {...common} />;
      default:
        return <div className="text-muted-foreground text-sm">Exercício não suportado.</div>;
    }
  })();
  return (
    <RespondidoContext.Provider value={onRespondido ?? null}>
      <div className="animate-slide-in-right-card pb-28 sm:pb-32">{inner}</div>
    </RespondidoContext.Provider>
  );
}

/* ---------------------- helpers ---------------------- */
const ROSE_BTN =
  "bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg shadow-rose-600/25";
const ENUN =
  "text-[1.05rem] sm:text-xl md:text-2xl font-normal normal-case tracking-normal leading-[1.65] text-white/95 mb-6 [text-wrap:pretty]";
const ART_LABEL = "text-[11px] font-extrabold tracking-wider text-pink-300/90 uppercase mb-2";

/* ------------------------- Organizar palavras ------------------------- */
function Organizar({ ex, artigoTexto, onResultado }: { ex: any; artigoTexto: string; onResultado: (b: boolean) => void }) {
  const palavrasOrig: string[] = ex.palavras;
  const [montagem, setMontagem] = useState<number[]>([]);
  const [resp, setResp] = useState<boolean | null>(null);
  const disponiveis = palavrasOrig.map((_, i) => i).filter((i) => !montagem.includes(i));
  const fraseMontada = montagem.map((i) => palavrasOrig[i]).join(" ");

  return (
    <div>
      <div className={ART_LABEL}>Art. {ex.artigo}</div>
      <h2 className={ENUN}>Organize as palavras conforme o art. {ex.artigo}:</h2>
      <div className="min-h-[80px] p-4 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.03] mb-4 flex flex-wrap gap-2">
        {montagem.map((i, idx) => (
          <button
            key={idx}
            disabled={resp !== null}
            onClick={() => setMontagem(montagem.filter((_, k) => k !== idx))}
            className="px-3 py-2 rounded-lg bg-pink-500 text-white font-medium shadow shadow-pink-500/30"
          >
            {palavrasOrig[i]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {disponiveis.map((i) => (
          <button
            key={i}
            disabled={resp !== null}
            onClick={() => setMontagem([...montagem, i])}
            className="px-3 py-2 rounded-lg bg-white/[0.05] border border-white/15 hover:bg-white/[0.1] text-white/90 font-medium"
          >
            {palavrasOrig[i]}
          </button>
        ))}
      </div>
      {resp === null && (
        <Button
          disabled={montagem.length !== palavrasOrig.length}
          onClick={() =>
            setResp(
              fraseMontada.toLowerCase().replace(/\s+/g, " ").trim() ===
                String(ex.frase_correta).toLowerCase().replace(/\s+/g, " ").trim(),
            )
          }
          className={cn("w-full mt-6 h-12 font-bold text-base rounded-xl", ROSE_BTN)}
        >
          Verificar
        </Button>
      )}
      <Slide resp={resp} ex={ex} artigoTexto={artigoTexto} grifos={[ex.frase_correta]} onContinuar={() => onResultado(resp!)} />
    </div>
  );
}

/* ------------------------- Ligar termos ------------------------- */
function Ligar({ ex, artigoTexto, onResultado }: { ex: any; artigoTexto: string; onResultado: (b: boolean) => void }) {
  const pares: { a: string; b: string }[] = ex.pares;
  const ladoA = useMemo(() => pares.map((p, i) => ({ i, txt: p.a })), [pares]);
  const ladoB = useMemo(() => {
    const arr = pares.map((p, i) => ({ i, txt: p.b }));
    return [...arr].sort(() => Math.random() - 0.5);
  }, [pares]);
  const [selA, setSelA] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [resp, setResp] = useState<boolean | null>(null);

  function tryMatch(b: number) {
    if (selA === null) return;
    setMatches({ ...matches, [selA]: b });
    setSelA(null);
  }

  const completo = Object.keys(matches).length === pares.length;

  return (
    <div>
      <div className={ART_LABEL}>Art. {ex.artigo}</div>
      <h2 className={ENUN}>Ligue cada termo do art. {ex.artigo} à sua definição:</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {ladoA.map((p) => {
            const matched = matches[p.i] !== undefined;
            return (
              <button
                key={p.i}
                disabled={matched || resp !== null}
                onClick={() => setSelA(p.i)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 text-sm font-medium",
                  matched
                    ? "bg-pink-500/20 border-pink-500/60 opacity-60 text-white/70"
                    : selA === p.i
                      ? "bg-pink-500 border-pink-300 text-white"
                      : "bg-white/[0.05] border-white/10 hover:bg-white/[0.1] text-white/90",
                )}
              >
                {p.txt}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {ladoB.map((p) => {
            const usado = Object.values(matches).includes(p.i);
            return (
              <button
                key={p.i}
                disabled={usado || resp !== null || selA === null}
                onClick={() => tryMatch(p.i)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 text-sm font-medium",
                  usado
                    ? "bg-pink-500/20 border-pink-500/60 opacity-60 text-white/70"
                    : "bg-white/[0.05] border-white/10 hover:bg-white/[0.1] text-white/90",
                )}
              >
                {p.txt}
              </button>
            );
          })}
        </div>
      </div>
      {resp === null && (
        <Button
          disabled={!completo}
          onClick={() => {
            const ok = Object.entries(matches).every(([a, b]) => Number(a) === b);
            setResp(ok);
          }}
          className={cn("w-full mt-6 h-12 font-bold text-base rounded-xl", ROSE_BTN)}
        >
          Verificar
        </Button>
      )}
      <Slide resp={resp} ex={ex} artigoTexto={artigoTexto} onContinuar={() => onResultado(resp!)} />
    </div>
  );
}

/* ------------------------- Localizar erro ------------------------- */
function LocalizarErro({ ex, artigoTexto, onResultado }: { ex: any; artigoTexto: string; onResultado: (b: boolean) => void }) {
  const tokens = (ex.texto_alterado as string).split(/(\s+)/);
  const wordIdxs: number[] = [];
  tokens.forEach((t, i) => {
    if (!/^\s+$/.test(t) && t.trim()) wordIdxs.push(i);
  });
  const correctTokenIdxs = new Set<number>(
    (ex.indice_erradas as number[]).map((w) => wordIdxs[w]).filter((x) => x !== undefined),
  );

  const [sel, setSel] = useState<Set<number>>(new Set());
  const [resp, setResp] = useState<boolean | null>(null);

  function toggle(i: number) {
    if (resp !== null) return;
    const nv = new Set(sel);
    if (nv.has(i)) nv.delete(i);
    else nv.add(i);
    setSel(nv);
  }

  return (
    <div>
      <div className={ART_LABEL}>Art. {ex.artigo}</div>
      <h2 className={ENUN}>No art. {ex.artigo}, toque na(s) palavra(s) errada(s):</h2>
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 mb-6 leading-loose text-sm sm:text-base text-white/90">
        {tokens.map((t, i) => {
          if (/^\s+$/.test(t)) return <span key={i}>{t}</span>;
          if (!t.trim()) return null;
          const isSel = sel.has(i);
          const isErrada = correctTokenIdxs.has(i);
          let cls = "cursor-pointer rounded px-1 transition-colors";
          if (resp !== null) {
            if (isErrada) cls += " bg-emerald-500/30 text-emerald-200 font-bold underline decoration-wavy";
            else if (isSel) cls += " bg-rose-500/30 text-rose-200";
          } else if (isSel) cls += " bg-pink-500/30 text-pink-200 font-bold";
          else cls += " hover:bg-white/[0.06]";
          return (
            <span key={i} onClick={() => toggle(i)} className={cls}>
              {t}
            </span>
          );
        })}
      </div>
      {resp === null && (
        <Button
          disabled={sel.size === 0}
          onClick={() => {
            const acertou =
              sel.size === correctTokenIdxs.size && Array.from(sel).every((i) => correctTokenIdxs.has(i));
            setResp(acertou);
          }}
          className={cn("w-full h-12 font-bold text-base rounded-xl", ROSE_BTN)}
        >
          Verificar
        </Button>
      )}
      <Slide resp={resp} ex={ex} artigoTexto={artigoTexto} onContinuar={() => onResultado(resp!)} />
    </div>
  );
}

/* ------------------------- Qual artigo ------------------------- */
function QualArtigo({ ex, artigoTexto, onResultado }: { ex: any; artigoTexto: string; onResultado: (b: boolean) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const [resp, setResp] = useState<boolean | null>(null);
  return (
    <div>
      <div className={ART_LABEL}>De qual artigo é este trecho?</div>
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm sm:text-base mb-6 leading-relaxed text-white/95 italic shadow-inner">
        "{ex.trecho}"
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ex.opcoes.map((op: string, i: number) => {
          const isCorrect = i === ex.correta;
          const isSel = sel === i;
          let cls = "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white";
          if (resp !== null) {
            if (isCorrect) cls = "border-emerald-400/70 bg-emerald-500/20 text-emerald-100 scale-[1.02]";
            else if (isSel) cls = "border-rose-400/70 bg-rose-500/20 text-rose-100";
          } else if (isSel) cls = "border-pink-400 bg-pink-500/20 text-white scale-[1.02]";
          return (
            <button
              key={i}
              disabled={resp !== null}
              onClick={() => setSel(i)}
              className={cn(
                "h-20 rounded-2xl border-2 transition-all duration-200 font-bold text-lg flex flex-col items-center justify-center gap-0.5",
                cls,
              )}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">Art.</span>
              <span className="text-2xl tabular-nums leading-none">{op}</span>
            </button>
          );
        })}
      </div>
      {resp === null && (
        <Button
          disabled={sel === null}
          onClick={() => setResp(sel === ex.correta)}
          className={cn("w-full mt-6 h-12 font-bold text-base rounded-xl", ROSE_BTN)}
        >
          Verificar
        </Button>
      )}
      <Slide resp={resp} ex={ex} artigoTexto={artigoTexto} grifos={[ex.trecho]} onContinuar={() => onResultado(resp!)} />
    </div>
  );
}

/* ------------------------- Pena (cominação) ------------------------- */
function Pena({ ex, artigoTexto, onResultado }: { ex: any; artigoTexto: string; onResultado: (b: boolean) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const [resp, setResp] = useState<boolean | null>(null);
  return (
    <div>
      <div className={ART_LABEL}>Art. {ex.artigo} · Pena</div>
      <h2 className={ENUN}>
        Qual é a pena prevista para a conduta abaixo?
      </h2>
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm sm:text-base mb-5 leading-relaxed text-white/95 italic">
        "{ex.conduta}"
      </div>
      <div className="space-y-2.5">
        {ex.opcoes.map((op: string, i: number) => {
          const isCorrect = i === ex.correta;
          const isSel = sel === i;
          let cls = "border-white/10 bg-white/[0.04] hover:bg-white/[0.07] text-white/90";
          if (resp !== null) {
            if (isCorrect) cls = "border-emerald-400/70 bg-emerald-500/15 text-emerald-100";
            else if (isSel) cls = "border-rose-400/70 bg-rose-500/15 text-rose-100";
          } else if (isSel) cls = "border-pink-400 bg-pink-500/15 text-white";
          return (
            <button
              key={i}
              disabled={resp !== null}
              onClick={() => setSel(i)}
              className={cn("w-full text-left p-4 rounded-2xl border-2 transition-all font-medium", cls)}
            >
              {op}
            </button>
          );
        })}
      </div>
      {resp === null && (
        <Button
          disabled={sel === null}
          onClick={() => setResp(sel === ex.correta)}
          className={cn("w-full mt-6 h-12 font-bold text-base rounded-xl", ROSE_BTN)}
        >
          Verificar
        </Button>
      )}
      <Slide resp={resp} ex={ex} artigoTexto={artigoTexto} grifos={[ex.opcoes?.[ex.correta]]} onContinuar={() => onResultado(resp!)} />
    </div>
  );
}

/* ------------------------- Qual inciso ------------------------- */
function QualInciso({ ex, artigoTexto, onResultado }: { ex: any; artigoTexto: string; onResultado: (b: boolean) => void }) {
  const [sel, setSel] = useState<number | null>(null);
  const [resp, setResp] = useState<boolean | null>(null);
  return (
    <div>
      <div className={ART_LABEL}>Art. {ex.artigo} · de qual inciso?</div>
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm sm:text-base mb-5 leading-relaxed text-white/95 italic">
        "{ex.trecho}"
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ex.opcoes.map((op: string, i: number) => {
          const isCorrect = i === ex.correta;
          const isSel = sel === i;
          let cls = "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white";
          if (resp !== null) {
            if (isCorrect) cls = "border-emerald-400/70 bg-emerald-500/20 text-emerald-100";
            else if (isSel) cls = "border-rose-400/70 bg-rose-500/20 text-rose-100";
          } else if (isSel) cls = "border-pink-400 bg-pink-500/20 text-white";
          return (
            <button
              key={i}
              disabled={resp !== null}
              onClick={() => setSel(i)}
              className={cn(
                "h-20 rounded-2xl border-2 font-bold text-xl flex flex-col items-center justify-center transition-all",
                cls,
              )}
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70 font-semibold">Inciso</span>
              <span className="text-2xl tabular-nums leading-none">{op}</span>
            </button>
          );
        })}
      </div>
      {resp === null && (
        <Button
          disabled={sel === null}
          onClick={() => setResp(sel === ex.correta)}
          className={cn("w-full mt-6 h-12 font-bold text-base rounded-xl", ROSE_BTN)}
        >
          Verificar
        </Button>
      )}
      <Slide resp={resp} ex={ex} artigoTexto={artigoTexto} grifos={[ex.trecho]} onContinuar={() => onResultado(resp!)} />
    </div>
  );
}

/* ------------------------- Classificar em 2 categorias ------------------------- */
function Classificar({ ex, artigoTexto, onResultado }: { ex: any; artigoTexto: string; onResultado: (b: boolean) => void }) {
  const itens: { texto: string; grupo: "a" | "b" }[] = ex.itens ?? [];
  const [escolhas, setEscolhas] = useState<Record<number, "a" | "b">>({});
  const [resp, setResp] = useState<boolean | null>(null);
  const completo = Object.keys(escolhas).length === itens.length;

  function escolher(idx: number, g: "a" | "b") {
    if (resp !== null) return;
    setEscolhas({ ...escolhas, [idx]: g });
  }

  return (
    <div>
      <div className={ART_LABEL}>Art. {ex.artigo} · Classifique</div>
      <h2 className={ENUN}>
        Toque para classificar cada item entre <span className="text-pink-300 font-semibold">{ex.categoria_a}</span> e{" "}
        <span className="text-emerald-300 font-semibold">{ex.categoria_b}</span>.
      </h2>
      <div className="space-y-2">
        {itens.map((it, i) => {
          const escolha = escolhas[i];
          const correto = resp !== null && escolha === it.grupo;
          const errado = resp !== null && escolha && escolha !== it.grupo;
          return (
            <div
              key={i}
              className={cn(
                "rounded-2xl border-2 p-3 transition-all",
                correto ? "border-emerald-400/60 bg-emerald-500/10" :
                  errado ? "border-rose-400/60 bg-rose-500/10" :
                  "border-white/10 bg-white/[0.04]",
              )}
            >
              <div className="text-white/95 text-sm font-medium mb-2">{it.texto}</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={resp !== null}
                  onClick={() => escolher(i, "a")}
                  className={cn(
                    "h-10 rounded-xl text-xs font-bold border transition-all",
                    escolha === "a"
                      ? "bg-pink-500 border-pink-400 text-white"
                      : "bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/[0.08]",
                  )}
                >
                  {ex.categoria_a}
                </button>
                <button
                  disabled={resp !== null}
                  onClick={() => escolher(i, "b")}
                  className={cn(
                    "h-10 rounded-xl text-xs font-bold border transition-all",
                    escolha === "b"
                      ? "bg-emerald-500 border-emerald-400 text-white"
                      : "bg-white/[0.04] border-white/10 text-white/80 hover:bg-white/[0.08]",
                  )}
                >
                  {ex.categoria_b}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {resp === null && (
        <Button
          disabled={!completo}
          onClick={() => {
            const ok = itens.every((it, i) => escolhas[i] === it.grupo);
            setResp(ok);
          }}
          className={cn("w-full mt-6 h-12 font-bold text-base rounded-xl", ROSE_BTN)}
        >
          Verificar
        </Button>
      )}
      <Slide resp={resp} ex={ex} artigoTexto={artigoTexto} onContinuar={() => onResultado(resp!)} />
    </div>
  );
}

/* ------------------------- Caça palavra trocada ------------------------- */
function CacaPalavra({ ex, artigoTexto, onResultado }: { ex: any; artigoTexto: string; onResultado: (b: boolean) => void }) {
  const tokens = (ex.texto_alterado as string).split(/(\s+)/);
  const [sel, setSel] = useState<number | null>(null);
  const [resp, setResp] = useState<boolean | null>(null);
  const palavraErrada = String(ex.palavra_errada ?? "").toLowerCase().replace(/[.,;:!?]/g, "");

  return (
    <div>
      <div className={ART_LABEL}>Art. {ex.artigo} · Caça-erro</div>
      <h2 className={ENUN}>
        Encontre a palavra trocada no trecho do art. {ex.artigo}:
      </h2>
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/10 mb-6 leading-loose text-base text-white/90">
        {tokens.map((t, i) => {
          if (/^\s+$/.test(t) || !t.trim()) return <span key={i}>{t}</span>;
          const limpa = t.toLowerCase().replace(/[.,;:!?]/g, "");
          const isErrada = limpa === palavraErrada;
          const isSel = sel === i;
          let cls = "cursor-pointer rounded px-1 transition-colors";
          if (resp !== null) {
            if (isErrada) cls += " bg-emerald-500/30 text-emerald-100 font-bold underline decoration-wavy decoration-emerald-300";
            else if (isSel) cls += " bg-rose-500/30 text-rose-100";
          } else if (isSel) cls += " bg-pink-500/30 text-pink-200 font-bold";
          else cls += " hover:bg-white/[0.06]";
          return (
            <span key={i} onClick={() => resp === null && setSel(i)} className={cls}>
              {t}
            </span>
          );
        })}
      </div>
      {resp === null && (
        <Button
          disabled={sel === null}
          onClick={() => {
            const tok = sel !== null ? tokens[sel].toLowerCase().replace(/[.,;:!?]/g, "") : "";
            setResp(tok === palavraErrada);
          }}
          className={cn("w-full h-12 font-bold text-base rounded-xl", ROSE_BTN)}
        >
          Verificar
        </Button>
      )}
      <Slide
        resp={resp}
        ex={{ ...ex, explicacao: ex.explicacao ?? `O correto é "${ex.palavra_correta}", não "${ex.palavra_errada}".` }}
        artigoTexto={artigoTexto}
        grifos={[ex.palavra_correta]}
        onContinuar={() => onResultado(resp!)}
      />
    </div>
  );
}

