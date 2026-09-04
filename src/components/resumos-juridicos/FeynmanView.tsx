import { FeynmanContent } from "./metodologias";

/** Amarelo/Âmbar oficial do Método Feynman */
const YELLOW = "#fbbf24";

function Passo({ num, titulo, children }: { num: number; titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-4 sm:p-5 border border-white/10 bg-zinc-950/40 backdrop-blur-sm shadow-md space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-black border border-[#fbbf24]/60 bg-[#fbbf24]/10 text-[#fbbf24] shadow-[0_0_8px_rgba(251,191,36,0.25)] shrink-0"
        >
          {num}
        </div>
        <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-[#fbbf24]">
          {titulo}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function FeynmanView({ conteudo }: { conteudo: FeynmanContent }) {
  if (!conteudo) return null;
  return (
    <div className="space-y-4">
      <Passo num={1} titulo="Conceito">
        <p className="text-[15px] sm:text-base text-zinc-200 leading-[1.7] whitespace-pre-line">
          {conteudo.conceito}
        </p>
      </Passo>

      <Passo num={2} titulo="Explicação simples">
        <p className="text-[15px] sm:text-base text-zinc-200 leading-[1.7] whitespace-pre-line">
          {conteudo.explicacao_simples}
        </p>
      </Passo>

      <Passo num={3} titulo="Lacunas">
        <div className="space-y-3">
          {(conteudo.lacunas || []).map((l, i) => (
            <div key={i} className="rounded-xl p-3.5 sm:p-4 border border-white/10 bg-white/[0.02]">
              <p className="text-[15px] sm:text-base font-bold text-[#fbbf24]">
                {l.ponto}
              </p>
              <p className="text-[14.5px] sm:text-[15px] text-zinc-300 mt-1 leading-relaxed">
                {l.explicacao}
              </p>
            </div>
          ))}
        </div>
      </Passo>

      <Passo num={4} titulo="Analogias">
        <div className="space-y-3">
          {(conteudo.analogias || []).map((a, i) => (
            <div key={i} className="rounded-xl p-3.5 sm:p-4 border border-white/10 bg-white/[0.02]">
              <p className="text-[15px] sm:text-base font-bold text-[#fbbf24]">
                {a.analogia}
              </p>
              <p className="text-[14.5px] sm:text-[15px] text-zinc-300 mt-1 leading-relaxed">
                {a.relacao}
              </p>
            </div>
          ))}
        </div>
      </Passo>

      {conteudo.revisao_final && (
        <div className="rounded-2xl p-4 sm:p-5 border border-white/10 bg-zinc-950/40 backdrop-blur-sm space-y-2">
          <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#fbbf24] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#fbbf24] inline-block shadow-[0_0_8px_#fbbf24]" />
            Revisão final
          </h3>
          <p className="text-[15px] sm:text-base text-zinc-200 leading-[1.7] whitespace-pre-line">
            {conteudo.revisao_final}
          </p>
        </div>
      )}
    </div>
  );
}
