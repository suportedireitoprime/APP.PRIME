import React, { useState } from 'react';
import { Scale, Search, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { MeExpliqueHubHeader } from '../MeExpliqueHubHeader';
import { MeExpliqueCardResultado } from '../MeExpliqueCardResultado';
import { useMeExpliqueTutor } from '@/hooks/useMeExpliqueTutor';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { haptic } from '@/lib/nativo';

interface ArtigoDestaque {
  numero: string;
  nome: string;
}

const ARTIGOS_SUGERIDOS: Record<string, ArtigoDestaque[]> = {
  cp: [
    { numero: '121', nome: 'Homicídio' },
    { numero: '155', nome: 'Furto' },
    { numero: '157', nome: 'Roubo' },
    { numero: '171', nome: 'Estelionato' },
    { numero: '23', nome: 'Legítima Defesa e Excludentes' },
    { numero: '1', nome: 'Princípio da Legalidade' },
  ],
  cf88: [
    { numero: '5', nome: 'Direitos e Deveres Individuais' },
    { numero: '1', nome: 'Fundamentos da República' },
    { numero: '6', nome: 'Direitos Sociais' },
    { numero: '37', nome: 'Princípios da Administração Pública' },
    { numero: '144', nome: 'Segurança Pública' },
  ],
  cc: [
    { numero: '186', nome: 'Ato Ilícito e Dano' },
    { numero: '927', nome: 'Dever de Indenizar' },
    { numero: '422', nome: 'Boa-fé nos Contratos' },
    { numero: '1228', nome: 'Direito de Propriedade' },
    { numero: '1238', nome: 'Usucapião de Imóveis' },
  ],
  cdc: [
    { numero: '49', nome: 'Direito de Arrependimento (7 dias)' },
    { numero: '14', nome: 'Responsabilidade por Defeito' },
    { numero: '39', nome: 'Práticas Abusivas' },
    { numero: '6', nome: 'Direitos Básicos do Consumidor' },
  ],
  clt: [
    { numero: '482', nome: 'Demissão por Justa Causa' },
    { numero: '477', nome: 'Rescisão e Prazos' },
    { numero: '58', nome: 'Jornada de Trabalho e Horas Extras' },
    { numero: '129', nome: 'Direito a Férias' },
  ],
};

interface Props {
  onVoltar: () => void;
}

export const MeExpliqueLeisView: React.FC<Props> = ({ onVoltar }) => {
  const [leiId, setLeiId] = useState('cp');
  const [numeroArtigo, setNumeroArtigo] = useState('121');
  const [inputCustomArtigo, setInputCustomArtigo] = useState('');

  const tutor = useMeExpliqueTutor();

  const leiAtual = LEIS_CATALOG.find((l) => l.id === leiId) || LEIS_CATALOG[1];
  const artigosSugeridos = ARTIGOS_SUGERIDOS[leiId] || [
    { numero: '1', nome: 'Artigo 1º' },
    { numero: '2', nome: 'Artigo 2º' },
    { numero: '5', nome: 'Artigo 5º' },
  ];

  const handleExplicarArtigo = (num: string) => {
    void haptic.medium();
    setNumeroArtigo(num);
    void tutor.explicarLei({
      leiNome: leiAtual.nome,
      artigoNumero: num,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limpo = inputCustomArtigo.replace(/\D/g, '');
    if (!limpo) return;
    setInputCustomArtigo('');
    handleExplicarArtigo(limpo);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-16">
      <MeExpliqueHubHeader
        titulo="Me Explique — Leis & Artigos"
        subtitulo="Destrinche artigos de lei com didática de 6 anos"
        onVoltar={onVoltar}
      />

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-5 space-y-6">
        {/* Seletor Rápido de Leis */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            1. Escolha a Lei:
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LEIS_CATALOG.slice(0, 10).map((l) => {
              const ativo = l.id === leiId;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    void haptic.selection();
                    setLeiId(l.id);
                    const primeiro = ARTIGOS_SUGERIDOS[l.id]?.[0]?.numero || '1';
                    setNumeroArtigo(primeiro);
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                    ativo
                      ? 'border-amber-400 bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                      : 'border-white/10 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <Scale className="h-3.5 w-3.5" />
                  <span>{l.sigla}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Escolha do Artigo da Lei */}
        <div className="space-y-3 rounded-3xl border border-white/10 bg-zinc-900/80 p-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Lei Selecionada
              </span>
              <h3 className="font-sans text-sm font-bold text-white truncate">
                {leiAtual.nome} ({leiAtual.sigla})
              </h3>
            </div>
          </div>

          {/* Atalhos para Artigos Populares */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-bold text-zinc-400 block">
              Artigos mais estudados (toque para explicar):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {artigosSugeridos.map((art) => {
                const ativo = numeroArtigo === art.numero && !tutor.loading;
                return (
                  <button
                    key={art.numero}
                    type="button"
                    onClick={() => handleExplicarArtigo(art.numero)}
                    className={`rounded-2xl border p-2.5 text-left transition-all active:scale-[0.98] cursor-pointer ${
                      ativo
                        ? 'border-amber-400 bg-amber-500/20 text-white'
                        : 'border-white/10 bg-white/[0.03] hover:bg-white/10 text-zinc-300'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-amber-400 block">
                      Art. {art.numero}
                    </span>
                    <span className="font-sans text-[11px] text-zinc-300 block truncate leading-snug">
                      {art.nome}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Digitar outro número de artigo */}
          <form onSubmit={handleCustomSubmit} className="pt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={inputCustomArtigo}
                onChange={(e) => setInputCustomArtigo(e.target.value)}
                placeholder="Ou digite o número de outro artigo (ex: 33, 157, 186)..."
                className="w-full h-11 rounded-xl bg-black/50 border border-white/10 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={!inputCustomArtigo.trim()}
              className="h-11 px-4 rounded-xl bg-amber-500 text-black font-bold text-xs disabled:opacity-40 hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
            >
              Explicar
            </button>
          </form>
        </div>

        {/* Loading */}
        {tutor.loading && (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto" />
            <p className="font-sans text-sm font-bold text-white">
              Destrinchando o Art. {numeroArtigo} do {leiAtual.sigla}...
            </p>
            <p className="text-xs text-zinc-400">
              Traduzindo para linguagem de 6 anos com exemplos práticos
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
              void tutor.explicarLivre(
                `Dúvida sobre o Art. ${numeroArtigo} do ${leiAtual.sigla}: ${pergunta}`
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
