import { useEffect, useState } from "react";
import { Check, X, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSetRespondido } from "./respondidoContext";

interface Props {
  open: boolean;
  certo: boolean;
  artigo: string;
  artigoTexto: string;
  explicacao?: string;
  grifos?: string[];
  onContinuar: () => void;
}

const GREEN = "#22c55e";
const GREEN_SOFT = "#86efac";
const RED = "#f43f5e";
const RED_SOFT = "#fda4af";

/** Painel que sobe de baixo após responder, mostrando o artigo na íntegra
 *  com trechos grifados e o comentário/explicação. */
export function ArtigoComentarioSlide({
  open,
  certo,
  artigo,
  artigoTexto,
  explicacao,
  grifos = [],
  onContinuar,
}: Props) {
  const setRespondido = useSetRespondido();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setRespondido?.(open);
    return () => setRespondido?.(false);
  }, [open, setRespondido]);
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }
    setMounted(false);
  }, [open]);

  if (!open) return null;

  const cor = certo ? GREEN : RED;
  const corSuave = certo ? GREEN_SOFT : RED_SOFT;
  const blocos = formatarArtigo(artigoTexto);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto mx-auto max-w-2xl rounded-t-3xl border-t-2 shadow-2xl transition-transform duration-500 ease-out",
          mounted ? "translate-y-0" : "translate-y-full",
        )}
        style={{
          borderTopColor: cor,
          background: `linear-gradient(135deg, ${cor}1f, #180512 45%, ${cor}1f)`,
          boxShadow: "0 -20px 60px -10px rgba(0,0,0,0.6)",
        }}
      >
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-3">
          <div
            className="h-11 w-11 rounded-full grid place-items-center shrink-0"
            style={{ backgroundColor: cor, boxShadow: `0 8px 24px -6px ${cor}` }}
          >
            {certo ? <Check className="h-6 w-6 text-white" /> : <X className="h-6 w-6 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-extrabold" style={{ color: corSuave }}>
              {certo ? "Perfeito!" : "Resposta errada"}
            </div>
            <div className="text-xs text-white/60 flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> Art. {artigo}
            </div>
          </div>
        </div>

        {/* Conteúdo rolável */}
        <div className="px-5 pb-3 max-h-[46vh] overflow-y-auto">
          {artigoTexto && (
            <div
              className="rounded-2xl border p-4 space-y-3"
              style={{ borderColor: `${cor}4d`, backgroundColor: `${cor}12` }}
            >
              {blocos.map((b, i) => (
                <p
                  key={i}
                  className="text-[15px] sm:text-base leading-[1.75] text-white/90"
                  style={{ paddingLeft: b.recuo ? 14 : 0 }}
                >
                  {highlight(b.texto, grifos, cor)}
                </p>
              ))}
            </div>
          )}
          {explicacao && (
            <div className="mt-3 text-[15px] leading-[1.7] text-white/85">
              <span className="font-bold mr-1" style={{ color: corSuave }}>
                Comentário:
              </span>
              {explicacao}
            </div>
          )}
        </div>

        {/* Rodapé com Safe Area Inset para Android/iOS */}
        <div className="px-5 pt-2 pb-[calc(1.25rem+var(--sai-bottom))] border-t border-white/5">
          <Button
            onClick={onContinuar}
            className="w-full h-12 font-bold text-base rounded-xl text-white hover:opacity-90 touch-manipulation active:scale-[0.99] transition-transform"
            style={{ backgroundColor: cor, boxShadow: `0 10px 30px -10px ${cor}` }}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Quebra o artigo em parágrafos, incisos e §, como na leitura normal da lei. */
function formatarArtigo(texto: string): { texto: string; recuo: boolean }[] {
  const base = (texto ?? "").replace(/\s+/g, " ").trim();
  if (!base) return [];
  const marcado = base
    .replace(/\s(§\s?\d+[ºo°]?|§\s?único|Parágrafo único)/gi, "\n$1")
    .replace(/\s((?:[IVXLC]+)\s?[-–]\s)/g, "\n$1")
    .replace(/\s((?:[a-z])\)\s)/g, "\n$1");
  return marcado
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => ({ texto: l, recuo: /^([IVXLC]+\s?[-–]|[a-z]\))/.test(l) }));
}

function highlight(texto: string, grifos: string[], cor: string) {
  if (!texto) return null;
  const limpos = grifos
    .map((g) => (g ?? "").trim())
    .filter((g) => g.length > 2)
    .sort((a, b) => b.length - a.length);
  if (!limpos.length) return texto;
  const safe = limpos.map((g) => g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${safe.join("|")})`, "gi");
  const partes = texto.split(regex);
  const matcher = new RegExp(`^(?:${safe.join("|")})$`, "i");
  return partes.map((p, i) =>
    matcher.test(p) ? (
      <mark
        key={i}
        className="px-1 rounded font-semibold"
        style={{ backgroundColor: `${cor}3d`, color: cor }}
      >
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
