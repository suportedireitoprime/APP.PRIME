import React, { useState } from 'react';
import { Scale, Search, Sparkles, Volume2 } from 'lucide-react';
import { MeExpliqueHubHeader } from '../MeExpliqueHubHeader';
import { MeExpliqueLiveChatView } from './MeExpliqueLiveChatView';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { haptic } from '@/lib/nativo';
import ShapeGrid from '@/components/ui/ShapeGrid';

interface ArtigoDestaque {
  numero: string;
  nome: string;
}

const ARTIGOS_SUGERIDOS: Record<string, ArtigoDestaque[]> = {
  cp: [
    { numero: '121', nome: 'Homicídio e qualificadoras' },
    { numero: '155', nome: 'Furto e repouso noturno' },
    { numero: '157', nome: 'Roubo e emprego de arma' },
    { numero: '171', nome: 'Estelionato e fraude eletrônica' },
    { numero: '23', nome: 'Legítima Defesa e excludentes' },
    { numero: '1', nome: 'Princípio da Legalidade estrita' },
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
    { numero: '927', nome: 'Dever de Indenizar e culpa' },
    { numero: '422', nome: 'Boa-fé objetiva nos Contratos' },
    { numero: '1228', nome: 'Direito de Propriedade' },
    { numero: '1238', nome: 'Usucapião Extraordinária' },
  ],
  cdc: [
    { numero: '49', nome: 'Direito de Arrependimento (7 dias)' },
    { numero: '14', nome: 'Responsabilidade por Vício e Fato' },
    { numero: '39', nome: 'Práticas Abusivas nas vendas' },
    { numero: '6', nome: 'Direitos Básicos do Consumidor' },
  ],
  clt: [
    { numero: '482', nome: 'Demissão por Justa Causa' },
    { numero: '477', nome: 'Rescisão e Prazos de Acerto' },
    { numero: '58', nome: 'Jornada de Trabalho e Horas Extras' },
    { numero: '129', nome: 'Direito e Período de Férias' },
  ],
};

interface Props {
  onVoltar: () => void;
}

export const MeExpliqueLeisView: React.FC<Props> = ({ onVoltar }) => {
  const [leiId, setLeiId] = useState('cp');
  const [inputCustomArtigo, setInputCustomArtigo] = useState('');
  const [artigoAoVivo, setArtigoAoVivo] = useState<{ lei: string; artigo: string; nome?: string } | null>(null);

  const leiAtual = LEIS_CATALOG.find((l) => l.id === leiId) || LEIS_CATALOG[1];
  const artigosSugeridos = ARTIGOS_SUGERIDOS[leiId] || [
    { numero: '1', nome: 'Artigo 1º' },
    { numero: '2', nome: 'Artigo 2º' },
    { numero: '5', nome: 'Artigo 5º' },
  ];

  const handleExplicarArtigo = (num: string, nome?: string) => {
    void haptic.medium();
    setArtigoAoVivo({
      lei: `${leiAtual.nome} (${leiAtual.sigla})`,
      artigo: num,
      nome,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limpo = inputCustomArtigo.replace(/\D/g, '');
    if (!limpo) return;
    setInputCustomArtigo('');
    handleExplicarArtigo(limpo);
  };

  // Quando seleciona um artigo, abre direto a conversa ao vivo Gemini Live com a Bolinha Animada
  if (artigoAoVivo) {
    return (
      <MeExpliqueLiveChatView
        modo="lei"
        contexto={`${artigoAoVivo.lei} — Art. ${artigoAoVivo.artigo}${artigoAoVivo.nome ? ` (${artigoAoVivo.nome})` : ''}`}
        subtitulo="Vade Mecum em tempo real"
        onVoltar={() => setArtigoAoVivo(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col pb-20 relative overflow-x-hidden">
      {/* Fundo Animado ShapeGrid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <ShapeGrid
          borderColor="rgba(255, 255, 255, 0.04)"
          squareSize={40}
          speed={0.8}
          direction="diagonal"
          className="w-full h-full"
        />
      </div>

      <div className="relative z-10">
        <MeExpliqueHubHeader
          titulo="Me Explique — Leis & Artigos"
          subtitulo="Destrinche qualquer artigo do Vade Mecum ao vivo em tempo real"
          onVoltar={onVoltar}
        />
      </div>

      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Seletor Rápido de Leis */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
            Escolha o Código ou Lei:
          </label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
            {LEIS_CATALOG.slice(0, 10).map((l) => {
              const ativo = l.id === leiId;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    void haptic.selection();
                    setLeiId(l.id);
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
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
        <div className="space-y-3 rounded-3xl border border-white/10 bg-zinc-900/80 p-4 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Lei em Destaque
              </span>
              <h3 className="font-sans text-sm font-bold text-white truncate">
                {leiAtual.nome} ({leiAtual.sigla})
              </h3>
            </div>
            <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" /> Gemini Live
            </span>
          </div>

          {/* Atalhos para Artigos Populares */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-zinc-400 block">
              Artigos mais cobrados na OAB (toque para ouvir a explicação):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {artigosSugeridos.map((art) => (
                <button
                  key={art.numero}
                  type="button"
                  onClick={() => handleExplicarArtigo(art.numero, art.nome)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/10 hover:border-amber-500/40 p-3 text-left transition-all active:scale-[0.98] cursor-pointer flex items-center justify-between gap-2 group"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs font-bold text-amber-400 block group-hover:text-amber-300">
                      Art. {art.numero}
                    </span>
                    <span className="text-xs text-zinc-300 block truncate leading-snug">
                      {art.nome}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[11px] font-bold shrink-0 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Ouvir
                  </span>
                </button>
              ))}
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
                placeholder="Ou digite outro artigo (ex: 33, 157, 186, 121)..."
                className="w-full h-11 rounded-xl bg-black/50 border border-white/10 pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={!inputCustomArtigo.trim()}
              className="h-11 px-4 rounded-xl bg-amber-500 disabled:opacity-40 text-black font-bold text-xs shadow flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Volume2 className="w-4 h-4" /> Explicar ao Vivo
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};
