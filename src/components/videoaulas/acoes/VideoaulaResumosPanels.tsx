import { Lightbulb } from "lucide-react";

export function FeynmanPanel({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      {data.titulo && <h3 className="font-display text-lg font-bold">{data.titulo}</h3>}
      {data.explicacao_simples && (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold mb-2 inline-flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3" /> Explicação simples
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{data.explicacao_simples}</p>
        </div>
      )}
      {data.analogia && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold mb-1.5">Analogia</p>
          <p className="text-sm italic leading-relaxed text-foreground/90">{data.analogia}</p>
        </div>
      )}
      {Array.isArray(data.pontos_dificeis) && data.pontos_dificeis.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pontos difíceis</p>
          {data.pontos_dificeis.map((p: any, i: number) => (
            <div key={i} className="rounded-xl border border-border bg-background p-3">
              <p className="text-sm font-semibold mb-1">{p.conceito}</p>
              <p className="text-sm text-foreground/85 leading-relaxed">{p.explicacao_facil}</p>
            </div>
          ))}
        </div>
      )}
      {data.resumo_uma_frase && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1.5">Em uma frase</p>
          <p className="text-sm font-medium leading-relaxed">{data.resumo_uma_frase}</p>
        </div>
      )}
    </div>
  );
}

export function TopicosPanel({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      {data.titulo && <h3 className="font-display text-lg font-bold">{data.titulo}</h3>}
      {(data.topicos ?? []).map((t: any, i: number) => (
        <div key={i} className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="bg-primary/10 px-3 py-2 border-b border-border">
            <p className="text-sm font-bold inline-flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] grid place-items-center font-bold">{i + 1}</span>
              {t.titulo}
            </p>
          </div>
          <div className="p-3 space-y-2">
            {(t.subtopicos ?? []).map((s: any, j: number) => (
              <div key={j} className="border-l-2 border-primary/40 pl-3">
                <p className="text-sm font-semibold">{s.titulo}</p>
                <p className="text-sm text-foreground/85 leading-relaxed mt-0.5">{s.conteudo}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TradicionalPanel({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      {data.titulo && <h3 className="font-display text-lg font-bold">{data.titulo}</h3>}
      {data.introducao && (
        <p className="text-sm leading-relaxed text-foreground/90 italic whitespace-pre-line">{data.introducao}</p>
      )}
      {data.desenvolvimento && (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">{data.desenvolvimento}</p>
        </div>
      )}
      {data.conclusao && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1.5">Conclusão</p>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{data.conclusao}</p>
        </div>
      )}
    </div>
  );
}

export function FichamentoPanel({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      {data.titulo && <h3 className="font-display text-lg font-bold">{data.titulo}</h3>}
      {data.referencia_principal && (
        <p className="text-xs text-muted-foreground italic">Referência: {data.referencia_principal}</p>
      )}
      {Array.isArray(data.citacoes) && data.citacoes.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Citações</p>
          {data.citacoes.map((c: any, i: number) => (
            <div key={i} className="rounded-xl border-l-4 border-primary bg-muted/30 p-3">
              <p className="text-sm italic leading-relaxed text-foreground/90">"{c.trecho}"</p>
              {c.fonte && <p className="text-[11px] text-muted-foreground mt-1.5">— {c.fonte}</p>}
            </div>
          ))}
        </div>
      )}
      {data.analise && (
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Análise</p>
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{data.analise}</p>
        </div>
      )}
      {Array.isArray(data.conceitos_chave) && data.conceitos_chave.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.conceitos_chave.map((k: string, i: number) => (
            <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{k}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ComparativaPanel({ data }: { data: any }) {
  const criterios: string[] = data.criterios ?? [];
  const itens: Array<{ nome: string; valores: string[] }> = data.itens ?? [];
  return (
    <div className="space-y-3">
      {data.titulo && <h3 className="font-display text-lg font-bold">{data.titulo}</h3>}
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2.5 font-semibold border-b border-border">Critério</th>
              {itens.map((it, i) => (
                <th key={i} className="text-left p-2.5 font-semibold border-b border-border min-w-[120px]">{it.nome}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criterios.map((c, ci) => (
              <tr key={ci} className="border-b border-border last:border-0">
                <td className="p-2.5 font-medium text-foreground/90 bg-muted/20">{c}</td>
                {itens.map((it, ii) => (
                  <td key={ii} className="p-2.5 align-top text-foreground/85">{it.valores?.[ci] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CornellPanel({ data }: { data: { palavras_chave?: string[]; notas?: string; sintese?: string } }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Palavras-chave</p>
          <ul className="space-y-1.5">
            {(data.palavras_chave ?? []).map((p, i) => (
              <li key={i} className="text-xs font-medium text-foreground/90">{p}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Notas</p>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{data.notas}</p>
        </div>
      </div>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-2">Síntese</p>
        <p className="text-sm leading-relaxed text-foreground">{data.sintese}</p>
      </div>
    </div>
  );
}
