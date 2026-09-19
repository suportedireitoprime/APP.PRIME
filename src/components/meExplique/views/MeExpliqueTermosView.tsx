import React, { useState, useMemo } from 'react';
import { Search, Sparkles, BookA, Loader2 } from 'lucide-react';
import { MeExpliqueHubHeader } from '../MeExpliqueHubHeader';
import { MeExpliqueCardResultado } from '../MeExpliqueCardResultado';
import { useMeExpliqueTutor } from '@/hooks/useMeExpliqueTutor';
import { useDicionarioJuridico } from '@/hooks/useDicionarioJuridico';
import { haptic } from '@/lib/nativo';

const TERMOS_POPULARES = [
  { termo: 'Dolo Eventual', resumo: 'Assumiu o risco de acontecer' },
  { termo: 'Culpa Consciente', resumo: 'Acreditava sinceramente que não ia acontecer' },
  { termo: 'Habeas Corpus', resumo: 'Proteção imediata da liberdade de ir e vir' },
  { termo: 'Usucapião', resumo: 'Ganhar a propriedade de um imóvel pelo tempo de uso' },
  { termo: 'Litispendência', resumo: 'Duas ações iguais correndo ao mesmo tempo' },
  { termo: 'Presunção de Inocência', resumo: 'Todos são inocentes até sentença final' },
  { termo: 'Súmula Vinculante', resumo: 'Decisão do STF que todos os juízes devem seguir' },
  { termo: 'Legítima Defesa', resumo: 'Proteger a si ou a outro de agressão injusta' },
  { termo: 'Decadência', resumo: 'Perda do próprio direito pelo tempo' },
  { termo: 'Prescrição', resumo: 'Perda do direito de cobrar ou punir na justiça' },
];

interface Props {
  onVoltar: () => void;
}

export const MeExpliqueTermosView: React.FC<Props> = ({ onVoltar }) => {
  const [busca, setBusca] = useState('');
  const [termoAtivo, setTermoAtivo] = useState<string | null>(null);

  const { termos: todosTermos, loading: carregandoDicionario } = useDicionarioJuridico();
  const tutor = useMeExpliqueTutor();

  const resultadosBusca = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return [];
    if (todosTermos && todosTermos.length > 0) {
      return todosTermos
        .filter((t: any) =>
          String(t.termo || '').toLowerCase().includes(q) ||
          String(t.significado || '').toLowerCase().includes(q)
        )
        .slice(0, 15);
    }
    return TERMOS_POPULARES.filter((t) => t.termo.toLowerCase().includes(q));
  }, [busca, todosTermos]);

  const handleSelecionarTermo = (nome: string, definicaoBase?: string) => {
    void haptic.medium();
    setTermoAtivo(nome);
    void tutor.explicarTermo({
      nome,
      definicaoBase,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-16">
      <MeExpliqueHubHeader
        titulo="Me Explique — Termos Jurídicos"
        subtitulo="Entenda qualquer palavra difícil do Direito como para 6 anos"
        onVoltar={onVoltar}
      />

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 space-y-6">
        {/* Barra de Busca Instantânea */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Qual termo jurídico você quer entender? (ex: Dolo, Habeas Corpus...)"
            className="w-full h-12 rounded-2xl bg-zinc-900 border border-white/10 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Resultados da Busca em Tempo Real */}
        {busca.trim().length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/90 p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 block mb-1">
              Resultados no Dicionário ({resultadosBusca.length})
            </span>
            {resultadosBusca.length === 0 ? (
              <p className="text-xs text-zinc-400 p-3 text-center">
                Nenhum termo encontrado. Toque em Enter para pedir à IA explicar "{busca}".
              </p>
            ) : (
              resultadosBusca.map((item: any, idx: number) => {
                const nome = item.termo || item.nome;
                const def = item.significado || item.resumo;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelecionarTermo(nome, def)}
                    className="w-full flex items-center justify-between rounded-xl p-2.5 text-left hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div>
                      <span className="font-sans text-xs font-bold text-white block">{nome}</span>
                      {def && <span className="text-[11px] text-zinc-400 line-clamp-1">{def}</span>}
                    </div>
                    <span className="text-xs text-amber-400 shrink-0 ml-2">Explicar →</span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Loading */}
        {tutor.loading && (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto" />
            <p className="font-sans text-sm font-bold text-white">
              Traduzindo "{termoAtivo}" para português claro...
            </p>
            <p className="text-xs text-zinc-400">
              Criando analogia do dia a dia e eliminando todo o juridiquês
            </p>
          </div>
        )}

        {/* Erro */}
        {tutor.erro && !tutor.loading && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-xs text-red-300">{tutor.erro}</p>
          </div>
        )}

        {/* Resultado Explicado */}
        {tutor.resultado && !tutor.loading && (
          <MeExpliqueCardResultado
            resultado={tutor.resultado}
            falando={tutor.falando}
            onToggleAudio={() => void tutor.tocarAudio()}
            onSelecionarPergunta={(pergunta) => {
              void haptic.light();
              void tutor.explicarLivre(`Pergunta sobre o termo "${termoAtivo}": ${pergunta}`);
            }}
          />
        )}

        {/* Termos Frequentes para Explicação em 1 Toque */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <BookA className="h-4 w-4 text-amber-400" />
            <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-zinc-400">
              Termos mais perguntados pelos alunos:
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {TERMOS_POPULARES.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelecionarTermo(item.termo, item.resumo)}
                className="flex items-start justify-between gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-3 text-left transition-all hover:bg-zinc-800 hover:border-amber-500/30 active:scale-[0.99] cursor-pointer"
              >
                <div>
                  <span className="font-sans text-xs font-bold text-white block">
                    {item.termo}
                  </span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5 line-clamp-1">
                    {item.resumo}
                  </span>
                </div>
                <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
