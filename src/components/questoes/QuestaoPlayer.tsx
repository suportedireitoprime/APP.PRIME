import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight, Sparkles, Loader2, Trophy, RotateCw, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { comentarioIA, type Questao } from '@/hooks/useQuestoes';
import { letraGabarito } from '@/lib/questoesVisual';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';

const db = supabase as any;

type Props = {
  questoes: Questao[];
  loading: boolean;
  contexto?: string;
  onRegistrar: (questaoId: string, alternativa: string, acertou: boolean, contexto?: string) => void;
  onNovoBloco: () => void;
  vazioTexto?: string;
};

/** Player de questões: enunciado, alternativas, gabarito e comentário da IA. */
const QuestaoPlayer = ({ questoes, loading, contexto = 'pratica', onRegistrar, onNovoBloco, vazioTexto }: Props) => {
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, { escolha: string; acertou: boolean }>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [gerando, setGerando] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());

  useEffect(() => { setIdx(0); setRespostas({}); setComentarios({}); }, [questoes]);

  const atual = questoes[idx];
  const resp = atual ? respostas[atual.id] : undefined;
  const correta = letraGabarito(atual?.gabarito_oficial);

  const alternativas = useMemo(() => {
    if (!atual) return [];
    return ([['A', atual.alt_a], ['B', atual.alt_b], ['C', atual.alt_c], ['D', atual.alt_d], ['E', atual.alt_e]] as const)
      .filter(([, t]) => t && String(t).trim())
      .map(([l, t]) => ({ letra: l, texto: String(t) }));
  }, [atual]);

  const acertos = Object.values(respostas).filter((r) => r.acertou).length;

  const responder = async (letra: string) => {
    if (!atual || resp) return;
    const acertou = letra === correta;
    haptic[acertou ? 'success' : 'warning']?.();
    setRespostas((p) => ({ ...p, [atual.id]: { escolha: letra, acertou } }));
    onRegistrar(atual.id, letra, acertou, contexto);

    setGerando(true);
    const c = await comentarioIA(atual);
    setGerando(false);
    if (c) setComentarios((p) => ({ ...p, [atual.id]: c }));
  };

  const favoritar = async () => {
    if (!atual || !user) { toast.error('Entre na sua conta para salvar'); return; }
    const ja = favoritos.has(atual.id);
    setFavoritos((p) => { const n = new Set(p); ja ? n.delete(atual.id) : n.add(atual.id); return n; });
    if (ja) await db.from('questoes_favoritos').delete().eq('user_id', user.id).eq('questao_id', atual.id);
    else await db.from('questoes_favoritos').insert({ user_id: user.id, questao_id: atual.id });
  };

  if (loading) {
    return <div className="h-[420px] animate-pulse rounded-2xl bg-muted" />;
  }

  if (!questoes.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/40 p-8 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
        <p className="text-[15px] font-semibold text-foreground">Nada por aqui ainda</p>
        <p className="max-w-sm text-[14px] text-muted-foreground">
          {vazioTexto ?? 'Nenhuma questão encontrada com esses filtros.'}
        </p>
      </div>
    );
  }

  const todasRespondidas = questoes.every((q) => respostas[q.id]);
  if (todasRespondidas && idx === questoes.length - 1 && resp) {
    // continua exibindo a última questão; o botão final vira "novo bloco"
  }

  return (
    <div className="flex flex-col gap-4 pb-[calc(7rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
      <div className="flex items-center justify-between px-1">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-primary">
          Questão {idx + 1} / {questoes.length}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[12px] tabular-nums text-muted-foreground">{acertos} acertos</span>
          <button onClick={favoritar} aria-label="Favoritar questão" className="text-muted-foreground hover:text-primary transition-transform active:scale-90">
            <Heart className={`h-5 w-5 ${atual && favoritos.has(atual.id) ? 'fill-primary text-primary' : ''}`} />
          </button>
        </div>
      </div>

      {(atual.banca || atual.ano || atual.orgao) && (
        <p className="text-[12px] text-muted-foreground">
          {[atual.banca, atual.orgao, atual.ano, atual.prova].filter(Boolean).join(' • ')}
        </p>
      )}

      {atual.texto_associado && (
        <div className="max-h-52 overflow-y-auto rounded-xl bg-muted/50 p-3 text-[14px] leading-relaxed text-muted-foreground">
          {atual.texto_associado}
        </div>
      )}

      {atual.imagem_url && (
        <img src={atual.imagem_url} alt="Imagem da questão" loading="lazy" className="w-full rounded-xl border border-border" />
      )}

      <h2 className="text-[17px] font-normal leading-snug text-foreground">{atual.enunciado}</h2>

      <div className="space-y-2">
        {alternativas.map((op) => {
          const escolhida = resp?.escolha === op.letra;
          const acertou = resp?.acertou && escolhida;
          const errou = resp && escolhida && !resp.acertou;
          const revela = resp && op.letra === correta;
          return (
            <button
              key={op.letra}
              disabled={!!resp}
              onClick={() => responder(op.letra)}
              className={`flex min-h-12 w-full items-start gap-3 rounded-xl border p-4 text-left text-[15px] leading-relaxed transition-all active:scale-[0.98] ${
                acertou || revela
                  ? 'border-green-500/60 bg-green-500/10'
                  : errou
                  ? 'border-red-500/60 bg-red-500/10'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-sm font-bold">
                {op.letra}
              </span>
              <span className="flex-1">{op.texto}</span>
              {(acertou || revela) && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
              {errou && <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
            </button>
          );
        })}
      </div>

      {resp && (
        <div className="rounded-xl border border-border bg-card p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wide text-primary">
            <Sparkles className="h-4 w-4" /> Comentário
          </p>
          {gerando && !comentarios[atual.id] ? (
            <p className="flex items-center gap-2 text-[14px] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando o comentário…
            </p>
          ) : (
            <p className="whitespace-pre-line text-[15px] leading-[1.7] text-foreground/90">
              {comentarios[atual.id] ?? atual.comentario_ia ?? atual.gabarito_comentado ?? 'Comentário indisponível.'}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        {idx < questoes.length - 1 ? (
          <button
            onClick={() => setIdx((i) => i + 1)}
            disabled={!resp}
            className="inline-flex h-12 items-center gap-1.5 rounded-xl bg-primary px-5 text-[15px] font-bold text-primary-foreground disabled:opacity-40 active:scale-95 transition-transform"
          >
            Próxima <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={onNovoBloco}
            disabled={!resp}
            className="inline-flex h-12 items-center gap-1.5 rounded-xl bg-primary px-5 text-[15px] font-bold text-primary-foreground disabled:opacity-40 active:scale-95 transition-transform"
          >
            <RotateCw className="h-4 w-4" /> Novo bloco
          </button>
        )}
      </div>

      {todasRespondidas && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Trophy className="h-6 w-6 text-primary" />
          <p className="text-[14px] text-muted-foreground">
            {acertos} de {questoes.length} ({Math.round((acertos / questoes.length) * 100)}% de aproveitamento)
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestaoPlayer;
