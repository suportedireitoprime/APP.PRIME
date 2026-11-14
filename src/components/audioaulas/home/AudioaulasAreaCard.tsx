import React from "react";
import { ChevronRight } from "lucide-react";
import { areaIconFor } from "@/lib/areasDireitoIcons";
import { haptic } from "@/lib/nativeHaptics";

interface AudioaulasAreaCardProps {
  nome: string;
  totalAulas: number;
  concluidas?: number;
  pct?: number;
  onClick: () => void;
}

function extrairSiglaArea(nome: string): string {
  const limpo = nome.replace(/^Direitos?\s+(do\s+|da\s+|de\s+)?/i, "").trim();
  const mapaSiglas: Record<string, string> = {
    "constitucional": "CF",
    "penal": "CP",
    "processual penal": "CPP",
    "processo penal": "CPP",
    "civil": "CC",
    "processual civil": "CPC",
    "processo civil": "CPC",
    "trabalho": "CLT",
    "do trabalho": "CLT",
    "processo do trabalho": "CPT",
    "processual do trabalho": "CPT",
    "tributário": "CTN",
    "tributario": "CTN",
    "administrativo": "ADM",
    "empresarial": "EMP",
    "comercial": "COM",
    "consumidor": "CDC",
    "do consumidor": "CDC",
    "ambiental": "AMB",
    "eleitoral": "CE",
    "previdenciário": "PREV",
    "previdenciario": "PREV",
    "internacional": "INT",
    "humanos": "DH",
    "direitos humanos": "DH",
    "criança e adolescente": "ECA",
    "estatuto da criança e do adolescente": "ECA",
  };

  const chave = limpo.toLowerCase();
  if (mapaSiglas[chave]) return mapaSiglas[chave];

  const partes = limpo.split(/\s+/).filter(Boolean);
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return limpo.slice(0, 3).toUpperCase();
}

export const AudioaulasAreaCard: React.FC<AudioaulasAreaCardProps> = ({
  nome,
  totalAulas,
  concluidas = 0,
  pct = 0,
  onClick,
}) => {
  const { Icon, color } = areaIconFor(nome);
  const sigla = extrairSiglaArea(nome);
  const nomeExibicao = nome.startsWith("Direito") ? nome : `Direito ${nome}`;
  const pctReal = Math.min(100, Math.max(0, pct));

  return (
    <div className="min-h-[80px] h-auto py-3.5 rounded-2xl bg-card border border-border/60 hover:border-violet-500/40 hover:bg-card/80 transition-all duration-[80ms] flex items-center gap-3 px-3.5 group animate-stagger-in touch-manipulation">
      <button
        type="button"
        onClick={() => {
          haptic.selection();
          onClick();
        }}
        className="flex-1 flex items-center gap-3 text-left min-w-0 active:scale-[0.99] transition-all duration-[80ms] touch-manipulation focus-visible:outline-none"
      >
        {/* Ícone à esquerda com cor da matéria */}
        <div
          className="h-11 w-11 grid place-items-center shrink-0"
          style={{ color, filter: "saturate(1.3) brightness(1.1)" }}
        >
          <Icon width={28} height={28} strokeWidth={1.9} />
        </div>

        {/* Informações centrais */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-500/90">
              {sigla}
            </span>
            <span className="text-[9.5px] text-muted-foreground/80 font-bold truncate">
              • Áudio Aulas
            </span>
            {pctReal >= 100 && totalAulas > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5">
                Concluído
              </span>
            )}
          </div>

          <div className="font-bold text-[14px] leading-tight truncate text-foreground">
            {nomeExibicao}
          </div>

          {/* Barra de progresso idêntica a de Lições */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-600 transition-[width] duration-700"
                style={{ width: `${Math.max(pctReal === 0 ? 0 : 4, pctReal)}%` }}
              />
            </div>
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground shrink-0">
              {concluidas > 0
                ? `${concluidas}/${totalAulas}`
                : `${totalAulas} ${totalAulas === 1 ? "aula" : "aulas"}`}
            </span>
          </div>
        </div>

        {/* Seta Chevron à direita */}
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-violet-500 transition-all duration-[80ms] shrink-0" />
      </button>
    </div>
  );
};
