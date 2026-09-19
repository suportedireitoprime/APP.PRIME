import React, { useState } from 'react';
import { Send, Mic, MicOff, Sparkles, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { MeExpliqueHubHeader } from '../MeExpliqueHubHeader';
import { MeExpliqueCardResultado } from '../MeExpliqueCardResultado';
import { useMeExpliqueTutor, type MeExpliqueResultado } from '@/hooks/useMeExpliqueTutor';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { haptic } from '@/lib/nativo';

const DUVIDAS_RAPIDAS = [
  'Comprei pela internet e me arrependi, posso devolver?',
  'Meu vizinho construiu no meu terreno, o que faço?',
  'Qual a diferença de verdade entre roubo e furto?',
  'O que é legítima defesa na prática?',
  'Até que idade o filho recebe pensão alimentícia?',
  'Fui xingado em grupo de WhatsApp, dá processo?',
];

interface MensagemConversa {
  id: string;
  pergunta: string;
  resposta: MeExpliqueResultado;
}

interface Props {
  onVoltar: () => void;
}

export const MeExpliqueLivreView: React.FC<Props> = ({ onVoltar }) => {
  const [texto, setTexto] = useState('');
  const [historico, setHistorico] = useState<MensagemConversa[]>([]);
  const tutor = useMeExpliqueTutor();

  const { isListening, startListening, stopListening, hasSupport } = useVoiceInput({
    onResult: (transcricao) => {
      if (transcricao) {
        setTexto((prev) => `${prev} ${transcricao}`.trim());
      }
    },
  });

  const handleEnviar = async (perguntaTexto?: string) => {
    const p = (perguntaTexto || texto).trim();
    if (!p || tutor.loading) return;

    void haptic.medium();
    setTexto('');
    if (isListening) stopListening();

    const res = await tutor.explicarLivre(p, historico.slice(-3).map(h => ({
      pergunta: h.pergunta,
      resposta: h.resposta.oQueSignifica,
    })));

    if (res) {
      setHistorico((prev) => [
        {
          id: String(Date.now()),
          pergunta: p,
          resposta: res,
        },
        ...prev,
      ]);
    }
  };

  const handleToggleMic = () => {
    void haptic.selection();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24">
      <MeExpliqueHubHeader
        titulo="Me Explique — Modo Livre"
        subtitulo="Pergunte qualquer caso ou dúvida jurídica como para 6 anos"
        onVoltar={onVoltar}
      />

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 space-y-6">
        {/* Sugestões de Dúvidas Rápidas (quando histórico está vazio) */}
        {historico.length === 0 && !tutor.loading && (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-zinc-300">
                Exemplos de dúvidas do dia a dia:
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DUVIDAS_RAPIDAS.map((d, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleEnviar(d)}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition-all hover:bg-white/10 hover:border-amber-500/30 active:scale-[0.99] cursor-pointer"
                >
                  <span className="font-sans text-xs text-zinc-300 line-clamp-2 leading-snug">
                    "{d}"
                  </span>
                  <span className="text-xs text-amber-400 shrink-0 ml-2">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {tutor.loading && (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto" />
            <p className="font-sans text-sm font-bold text-white">
              Criando explicação descomplicada com exemplos práticos...
            </p>
            <p className="text-xs text-zinc-400">
              Analogias do dia a dia para fixar na memória
            </p>
          </div>
        )}

        {/* Erro */}
        {tutor.erro && !tutor.loading && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <p className="text-xs text-red-300">{tutor.erro}</p>
          </div>
        )}

        {/* Lista de Respostas da Conversa */}
        <div className="space-y-6">
          {historico.map((item) => (
            <div key={item.id} className="space-y-3">
              {/* Balão da Pergunta do Usuário */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-amber-500/20 border border-amber-500/30 p-3.5 text-right">
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                    Sua Dúvida
                  </span>
                  <p className="font-sans text-sm font-medium text-white leading-snug">
                    {item.pergunta}
                  </p>
                </div>
              </div>

              {/* Card de Resposta da IA */}
              <MeExpliqueCardResultado
                resultado={item.resposta}
                falando={tutor.falando}
                onToggleAudio={() => void tutor.tocarAudio()}
                onSelecionarPergunta={(pergunta) => handleEnviar(pergunta)}
              />
            </div>
          ))}
        </div>

        {historico.length > 0 && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                void haptic.light();
                setHistorico([]);
              }}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar conversa
            </button>
          </div>
        )}
      </div>

      {/* Barra Fixa de Input com Voz e Texto */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-white/10 bg-black/90 p-3 pb-[calc(0.75rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleEnviar();
          }}
          className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl border border-white/15 bg-zinc-900/90 p-1.5 shadow-2xl"
        >
          {hasSupport && (
            <button
              type="button"
              onClick={handleToggleMic}
              aria-label={isListening ? 'Parar gravação de voz' : 'Falar por voz'}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}

          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={
              isListening ? 'Ouvindo sua voz... fale sua dúvida' : 'Pergunte qualquer dúvida de Direito...'
            }
            className="flex-1 bg-transparent px-3 text-sm text-white placeholder-zinc-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!texto.trim() || tutor.loading}
            aria-label="Enviar dúvida"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
