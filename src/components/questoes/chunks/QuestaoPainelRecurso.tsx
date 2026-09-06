import { AlertTriangle, NotebookPen, Workflow } from 'lucide-react';
import { useQuestaoAcao, type AcaoTipo, type QuestaoInline } from '@/hooks/useQuestaoAcao';
import { Md, Carregando, Erro } from './QuestaoAcaoOverlay';
import { Flashcards } from './QuestaoFlashcards';

export type Fonte = string | QuestaoInline;

export const TITULOS: Record<AcaoTipo, string> = {
  aula: 'Mini-aula',
  flashcards: 'Flashcards',
  lei: 'Lei seca',
  'lei-erradas': 'Outras alternativas',
  pegadinhas: 'Pegadinhas',
  mapa: 'Mapa mental',
  cornell: 'Resumo Cornell',
  comentario: 'Comentário',
  termos: 'Termos da questão',
};

export type SeletorTipo = 'resumos' | 'flash' | null;
export type SeletorOpcao = { key: string; tipo: AcaoTipo; label: string; desc: string; icon: any };

export const OPCOES_RESUMOS: SeletorOpcao[] = [
  { key: 'cornell', tipo: 'cornell', label: 'Cornell', desc: 'Notas + perguntas-chave + síntese', icon: NotebookPen },
  { key: 'mapa', tipo: 'mapa', label: 'Mapa mental', desc: 'Hierarquia visual dos conceitos', icon: Workflow },
];

export function PainelAcao({ source, tipo }: { source: Fonte; tipo: AcaoTipo }) {
  const { data, isLoading, error, refetch } = useQuestaoAcao(source, tipo, true);
  if (isLoading) return <Carregando label={`Gerando ${TITULOS[tipo].toLowerCase()}…`} />;
  if (error || !data) return <Erro msg={error?.message} onRetry={() => refetch()} />;

  if (tipo === 'aula') {
    const slides = data.slides ?? [];
    return (
      <div className="space-y-3">
        {slides.map((s: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-background p-4">
            <p className="mb-1.5 text-sm font-bold text-primary">{s.titulo}</p>
            <Md texto={s.conteudo} />
          </div>
        ))}
      </div>
    );
  }

  if (tipo === 'flashcards') return <Flashcards cards={data.cards ?? []} />;

  if (tipo === 'lei') {
    const itens = data.dispositivos ?? [];
    return (
      <div className="space-y-3">
        {itens.map((d: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-background p-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">{d.referencia}</p>
            <p className="text-[15px] italic leading-relaxed text-foreground/85">{d.texto}</p>
            {d.comentario && <p className="mt-2 text-sm text-muted-foreground">{d.comentario}</p>}
          </div>
        ))}
      </div>
    );
  }

  if (tipo === 'pegadinhas') {
    const itens = data.pegadinhas ?? [];
    return (
      <div className="space-y-3">
        {itens.map((p: any, i: number) => (
          <div key={i} className="rounded-xl border border-border bg-background p-4">
            <p className="mb-1 inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
              <AlertTriangle className="h-4 w-4 text-primary" /> {p.titulo}
            </p>
            <p className="text-sm leading-relaxed text-foreground/85">{p.texto}</p>
          </div>
        ))}
      </div>
    );
  }

  if (tipo === 'mapa') return <Md texto={data.markdown} />;

  if (tipo === 'cornell') {
    return (
      <div className="space-y-3">
        {(data.perguntas ?? []).length > 0 && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-primary">Perguntas-chave</p>
            <ul className="list-disc space-y-1 pl-4 text-sm text-foreground/90">
              {(data.perguntas ?? []).map((p: string, i: number) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="rounded-xl border border-border bg-background p-4">
          <Md texto={data.notas} />
        </div>
        {data.sintese && (
          <div className="rounded-xl border-l-2 border-primary bg-muted/50 px-4 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">Síntese</p>
            <p className="text-sm leading-relaxed text-foreground/90">{data.sintese}</p>
          </div>
        )}
      </div>
    );
  }

  const termos = data.termos ?? [];
  return (
    <div className="space-y-3">
      {termos.map((t: any, i: number) => (
        <div key={i} className="rounded-xl border border-border bg-background p-4">
          <p className="mb-1.5 text-base font-bold text-primary">{t.termo}</p>
          <p className="text-sm leading-relaxed text-foreground/90">{t.definicao}</p>
          {t.exemplo && (
            <div className="mt-2.5 rounded-lg border-l-2 border-primary bg-muted/50 px-3 py-2">
              <p className="text-sm italic leading-relaxed text-foreground/80">{t.exemplo}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
