import { CornellContent, normalizePergunta } from "./metodologias";

/** Azul oficial do Método Cornell */
const BLUE = "#38bdf8";

export default function CornellView({ conteudo }: { conteudo: CornellContent }) {
  if (!conteudo) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-950/40 backdrop-blur-sm overflow-hidden shadow-lg">
      <div className="flex flex-col md:flex-row">
        {/* Coluna Esquerda: Palavras-chave e Perguntas */}
        <div className="w-full md:w-[38%] p-4 sm:p-5 border-b md:border-b-0 md:border-r border-white/10 bg-white/[0.02]">
          <div className="mb-6">
            <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: BLUE }}>
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] inline-block shadow-[0_0_8px_#38bdf8]" />
              Palavras-chave
            </h3>
            <ul className="space-y-2.5">
              {(conteudo.palavras_chave || []).map((k, i) => (
                <li key={i} className="text-[15px] sm:text-base text-zinc-200 leading-snug flex items-start">
                  <span className="text-[#38bdf8] font-bold mr-2 select-none">•</span>
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: BLUE }}>
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] inline-block shadow-[0_0_8px_#38bdf8]" />
              Perguntas de revisão
            </h3>
            <ul className="space-y-4">
              {(conteudo.perguntas || []).map((p, i) => {
                const q = normalizePergunta(p);
                return (
                  <li key={i} className="rounded-xl p-3 bg-white/[0.02] border border-white/5">
                    <p className="text-[15px] sm:text-base font-bold text-white leading-snug">{q.pergunta}</p>
                    {q.resposta && (
                      <p className="text-[14px] sm:text-[15px] text-zinc-300 mt-1.5 leading-relaxed">{q.resposta}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Coluna Direita: Anotações Detalhadas */}
        <div className="w-full md:w-[62%] p-4 sm:p-5">
          <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: BLUE }}>
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] inline-block shadow-[0_0_8px_#38bdf8]" />
            Anotações
          </h3>
          <div className="space-y-5">
            {(conteudo.anotacoes || []).map((a, i) => (
              <div key={i} className="rounded-xl p-3.5 sm:p-4 bg-white/[0.015] border border-white/5">
                <p className="text-[15px] sm:text-base font-bold text-sky-200">{a.topico}</p>
                <p className="text-[14.5px] sm:text-[15px] text-zinc-200 leading-[1.7] mt-1.5 whitespace-pre-line">
                  {a.conteudo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {conteudo.resumo_geral && (
        <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02]">
          <h3 className="text-xs sm:text-[13px] font-black uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: BLUE }}>
            <span className="w-2 h-2 rounded-full bg-[#38bdf8] inline-block shadow-[0_0_8px_#38bdf8]" />
            Resumo-síntese
          </h3>
          <p className="text-[15px] sm:text-base text-zinc-200 leading-[1.7] whitespace-pre-line">
            {conteudo.resumo_geral}
          </p>
        </div>
      )}
    </div>
  );
}
