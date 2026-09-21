import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  BookA,
  Volume2,
  ArrowLeft,
  Scale,
  Send,
} from 'lucide-react';

import { MeExpliqueHubHeader } from '../MeExpliqueHubHeader';
import { MeExpliqueLiveChatView } from './MeExpliqueLiveChatView';
import { useDicionarioJuridico } from '@/hooks/useDicionarioJuridico';
import { haptic } from '@/lib/nativo';
import ShapeGrid from '@/components/ui/ShapeGrid';

interface TermoItem {
  termo: string;
  resumo: string;
  area?: string;
}

const TERMOS_POPULARES: TermoItem[] = [
  { termo: 'Dolo Eventual', resumo: 'Quando a pessoa não queria diretamente o resultado, mas assumiu o risco de acontecer.', area: 'Penal' },
  { termo: 'Culpa Consciente', resumo: 'A pessoa prevê o perigo, mas acredita sinceramente que suas habilidades evitarão o mal.', area: 'Penal' },
  { termo: 'Habeas Corpus', resumo: 'Ordem judicial urgente para proteger a liberdade de ir e vir de quem sofre coação ilegal.', area: 'Constitucional' },
  { termo: 'Usucapião', resumo: 'Modo de adquirir a propriedade de um imóvel pela posse contínua e sem oposição durante certo tempo.', area: 'Civil' },
  { termo: 'Litispendência', resumo: 'Situação em que duas ações judiciais exatamente iguais estão tramitando ao mesmo tempo.', area: 'Processual' },
  { termo: 'Presunção de Inocência', resumo: 'Ninguém será considerado culpado até o trânsito em julgado de sentença penal condenatória.', area: 'Constitucional' },
  { termo: 'Súmula Vinculante', resumo: 'Entendimento pacificado do STF que obriga todos os demais juízes e a administração pública.', area: 'Constitucional' },
  { termo: 'Legítima Defesa', resumo: 'Uso moderado dos meios necessários para repelir injusta agressão, atual ou iminente.', area: 'Penal' },
  { termo: 'Decadência', resumo: 'Perda do próprio direito material pelo não exercício no prazo determinado pela lei.', area: 'Civil' },
  { termo: 'Prescrição', resumo: 'Perda da pretensão de exigir o cumprimento do direito na justiça em razão do tempo.', area: 'Civil' },
  { termo: 'Coisa Julgada', resumo: 'Decisão judicial contra a qual não cabe mais recurso, tornando-se imutável.', area: 'Processual' },
  { termo: 'Juiz Natural', resumo: 'Garantia de que ninguém será processado ou julgado senão pela autoridade competente prévia.', area: 'Constitucional' },
  { termo: 'Contraditório e Ampla Defesa', resumo: 'Direito de ser informado de todos os atos e produzir todas as provas permitidas.', area: 'Processual' },
  { termo: 'In dubio pro reo', resumo: 'Princípio de que na dúvida sobre provas e autoria, a decisão deve sempre favorecer o acusado.', area: 'Penal' },
];

interface Props {
  onVoltar: () => void;
}

export const MeExpliqueTermosView: React.FC<Props> = ({ onVoltar }) => {
  const [busca, setBusca] = useState('');
  const [areaAtiva, setAreaAtiva] = useState<string>('todas');
  const [termoAoVivo, setTermoAoVivo] = useState<string | null>(null);

  const { data: todosTermosDicionario, isLoading: carregandoDicionario } = useDicionarioJuridico();

  const areas = ['todas', 'Penal', 'Civil', 'Constitucional', 'Processual'];

  const listaFiltrada = useMemo(() => {
    const q = busca.toLowerCase().trim();

    // Mescla termos do dicionário se carregados
    let pool: TermoItem[] = TERMOS_POPULARES;
    if (todosTermosDicionario && todosTermosDicionario.length > 0) {
      const doDicionario: TermoItem[] = todosTermosDicionario.map((t: any) => ({
        termo: t.termo || t.nome || 'Termo',
        resumo: t.significado || t.definicao || t.resumo || 'Conceito jurídico.',
        area: t.area || 'Geral',
      }));
      const mapa = new Map<string, TermoItem>();
      TERMOS_POPULARES.forEach((item) => mapa.set(item.termo.toLowerCase(), item));
      doDicionario.forEach((item) => {
        if (!mapa.has(item.termo.toLowerCase())) {
          mapa.set(item.termo.toLowerCase(), item);
        }
      });
      pool = Array.from(mapa.values());
    }

    return pool.filter((item) => {
      const matchBusca =
        !q ||
        item.termo.toLowerCase().includes(q) ||
        item.resumo.toLowerCase().includes(q);

      const matchArea = areaAtiva === 'todas' || item.area?.toLowerCase() === areaAtiva.toLowerCase();
      return matchBusca && matchArea;
    });
  }, [busca, areaAtiva, todosTermosDicionario]);

  // Se o usuário tocou em um termo, entra direto no Gemini Live Audio Chat com a Bolinha Animada
  if (termoAoVivo) {
    return (
      <MeExpliqueLiveChatView
        modo="termo"
        contexto={termoAoVivo}
        onVoltar={() => setTermoAoVivo(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col pb-20 relative overflow-x-hidden">
      {/* Fundo Animado Oficial ShapeGrid */}
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
          titulo="Me Explique — Termos Jurídicos"
          subtitulo="Dicionário em tempo real: ouça qualquer termo explicado como para 6 anos"
          onVoltar={onVoltar}
        />
      </div>

      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Barra de Busca Compacta e Rápida */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && busca.trim()) {
                void haptic.medium();
                setTermoAoVivo(busca.trim());
              }
            }}
            placeholder="Digite qualquer palavra difícil (ex: Dolo, Habeas Corpus, Litisconsórcio)..."
            className="w-full h-11 rounded-2xl bg-zinc-900/90 border border-white/10 pl-10 pr-24 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 shadow-sm"
          />
          {busca.trim() && (
            <button
              type="button"
              onClick={() => {
                void haptic.medium();
                setTermoAoVivo(busca.trim());
              }}
              className="absolute right-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs shadow flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" /> Explicar
            </button>
          )}
        </div>

        {/* Filtros de Área em Chips Compactos */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {areas.map((ar) => (
            <button
              key={ar}
              type="button"
              onClick={() => {
                void haptic.selection();
                setAreaAtiva(ar);
              }}
              className={`shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                areaAtiva === ar
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {ar === 'todas' ? 'Todos os Termos' : ar}
            </button>
          ))}
        </div>

        {/* LISTA COMPACTA DE TERMOS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[11px] text-zinc-300">
              Termos Jurídicos ({listaFiltrada.length})
            </span>
            <span className="text-[11px] text-amber-400/90 flex items-center gap-1 font-medium">
              <Volume2 className="w-3.5 h-3.5" /> Voz ao vivo em tempo real
            </span>
          </div>

          {/* Banner de Busca Personalizada se digitou termo inexistente */}
          {busca.trim() && !listaFiltrada.some((i) => i.termo.toLowerCase() === busca.toLowerCase().trim()) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => {
                void haptic.medium();
                setTermoAoVivo(busca.trim());
              }}
              className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 cursor-pointer transition-all shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white">
                    Explicar "{busca}" agora ao vivo?
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    O Gemini Live explicará esse termo em tempo real como para 6 anos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs shrink-0 shadow"
              >
                Ouvir
              </button>
            </motion.div>
          )}

          {listaFiltrada.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.006 }}
              whileTap={{ scale: 0.994 }}
              onClick={() => {
                void haptic.medium();
                setTermoAoVivo(item.termo);
              }}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-amber-500/40 shadow-sm backdrop-blur-sm cursor-pointer transition-all group"
            >
              {/* Informação do Termo em 1 linha compacta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <h3 className="font-display font-black tracking-wider text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors">
                    {item.termo}
                  </h3>
                  {item.area && (
                    <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10 shrink-0 mt-0.5">
                      {item.area}
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {item.resumo}
                </p>
              </div>

              {/* Botão de Explicar ao Vivo */}
              <div className="shrink-0">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs shadow group-hover:bg-amber-400 active:scale-95 transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Ouvir</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};
