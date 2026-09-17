import { useState } from 'react';
import { PlayCircle, Radio, ExternalLink, Tv, Info, CheckCircle2 } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

interface CanalTv {
  id: string;
  nome: string;
  descricao: string;
  youtubeId?: string;
  liveChannelId?: string;
  urlOficial: string;
  ativo: boolean;
}

const CANAIS_SENADO: CanalTv[] = [
  {
    id: 'tv-senado-1',
    nome: 'TV Senado - Canal Principal (Ao Vivo)',
    descricao: 'Transmissão oficial contínua do Plenário, comissões mais importantes e noticiário.',
    liveChannelId: 'UCyH_oGZzM9VdJ6WkEw6r47w', // Canal Oficial TV Senado
    urlOficial: 'https://www.youtube.com/@TVSenadoOficial/live',
    ativo: true,
  },
  {
    id: 'plenario-senado',
    nome: 'Sessões do Plenário',
    descricao: 'Sessões deliberativas, especiais e temáticas no Plenário do Senado Federal.',
    urlOficial: 'https://www12.senado.leg.br/tv',
    ativo: false,
  },
  {
    id: 'comissoes-senado',
    nome: 'Comissões e Audiências',
    descricao: 'Transmissões das reuniões da CCJ, CAE, CAS e comissões especiais.',
    urlOficial: 'https://legis.senado.leg.br/comissoes/',
    ativo: false,
  },
];

export const SenadoAoVivo = () => {
  const [canalSelecionado, setCanalSelecionado] = useState<CanalTv>(CANAIS_SENADO[0]);

  return (
    <div className="flex flex-col gap-5 px-4 pb-12 w-full max-w-4xl mx-auto">
      {/* Player Principal */}
      <div className="w-full bg-[#111111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative group">
        <div className="relative aspect-video w-full bg-black">
          {canalSelecionado.liveChannelId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/live_stream?channel=${canalSelecionado.liveChannelId}&autoplay=1&mute=0`}
              title={canalSelecionado.nome}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-900 to-black">
              <Tv className="w-12 h-12 text-sky-400 mb-3 opacity-80" />
              <h3 className="text-white font-bold text-base mb-1">{canalSelecionado.nome}</h3>
              <p className="text-white/60 text-xs max-w-sm mb-4">{canalSelecionado.descricao}</p>
              <a
                href={canalSelecionado.urlOficial}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Assistir no Portal Oficial
              </a>
            </div>
          )}
        </div>

        {/* Barra de Status do Player */}
        <div className="p-4 bg-[#0d0f12] border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Transmissão Oficial
            </span>
            <span className="text-[12px] font-bold text-white/90">TV Senado Federal</span>
          </div>

          <a
            href={canalSelecionado.urlOficial}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir no YouTube / Site
          </a>
        </div>
      </div>

      {/* Seletor de Canais */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1 flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-sky-400" />
          Canais de Transmissão Legislativa
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CANAIS_SENADO.map((canal) => {
            const isSelected = canal.id === canalSelecionado.id;
            return (
              <button
                key={canal.id}
                onClick={() => {
                  haptic.selection();
                  setCanalSelecionado(canal);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-500 text-white shadow-lg shadow-sky-500/10'
                    : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-bold text-[13px] leading-tight text-white line-clamp-1">
                    {canal.nome}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                  {canal.descricao}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cartão Informativo */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-white/70 leading-relaxed">
          As sessões deliberativas ocorrem habitualmente de <strong>terça a quinta-feira a partir das 14h</strong>. Em segundas e sextas-feiras são realizadas sessões especiais e de debates temáticos.
        </p>
      </div>
    </div>
  );
};
export default SenadoAoVivo;
