// @ts-nocheck
import React, { memo, useState, useMemo, useCallback } from 'react';
import { Play, Pause, Bookmark, Volume2, Search, Clock, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { type PilulasHeroTab } from './hero/PilulasActionShortcuts';

export interface PilulaAudioItem {
  id: string;
  titulo: string;
  area: string;
  duracao: string;
  emAlta?: boolean;
  recente?: boolean;
  playlist?: string;
  audioUrl?: string;
}

export const AREAS_DO_DIREITO = [
  { id: 'const', nome: 'Direito Constitucional', cor: '#EF4444', icone: '⚖️' },
  { id: 'penal', nome: 'Direito Penal', cor: '#E11D48', icone: '⚔️' },
  { id: 'proc_penal', nome: 'Direito Processual Penal', cor: '#F43F5E', icone: '🛡️' },
  { id: 'civil', nome: 'Direito Civil', cor: '#3B82F6', icone: '📜' },
  { id: 'proc_civil', nome: 'Direito Processual Civil', cor: '#0EA5E9', icone: '🏛️' },
  { id: 'adm', nome: 'Direito Administrativo', cor: '#8B5CF6', icone: '🏢' },
  { id: 'trab', nome: 'Direito do Trabalho', cor: '#10B981', icone: '💼' },
  { id: 'proc_trab', nome: 'Direito Processual do Trabalho', cor: '#14B8A6', icone: '⚖️' },
  { id: 'trib', nome: 'Direito Tributário', cor: '#F59E0B', icone: '💰' },
  { id: 'emp', nome: 'Direito Empresarial', cor: '#A855F7', icone: '📈' },
  { id: 'prev', nome: 'Direito Previdenciário', cor: '#06B6D4', icone: '👵' },
  { id: 'amb', nome: 'Direito Ambiental', cor: '#22C55E', icone: '🌿' },
  { id: 'humanos', nome: 'Direitos Humanos & Ética', cor: '#6366F1', icone: '🕊️' },
  { id: 'cons', nome: 'Direito do Consumidor', cor: '#F97316', icone: '🛒' },
  { id: 'dig', nome: 'Direito Digital & LGPD', cor: '#EC4899', icone: '🔐' },
];

export const PILULAS_MOCK_CATALOG: PilulaAudioItem[] = [
  // Constitucional
  { id: 'c1', titulo: 'Controle de Constitucionalidade Difuso e Concentrado', area: 'Direito Constitucional', duracao: '4:15', emAlta: true, playlist: 'Essenciais OAB' },
  { id: 'c2', titulo: 'Remédios Constitucionais: HC, MS, MI e HD', area: 'Direito Constitucional', duracao: '5:20', recente: true, playlist: 'Essenciais OAB' },
  { id: 'c3', titulo: 'Separação dos Poderes e Freios e Contrapesos', area: 'Direito Constitucional', duracao: '3:50', playlist: 'Fundamentos' },
  
  // Penal
  { id: 'p1', titulo: 'Teoria Tripartida do Crime: Fato Típico e Ilicitude', area: 'Direito Penal', duracao: '4:40', emAlta: true, playlist: 'Trilha Penalista' },
  { id: 'p2', titulo: 'Princípio da Insignificância e Seus 4 Requisitos no STF', area: 'Direito Penal', duracao: '3:30', recente: true, playlist: 'Trilha Penalista' },
  { id: 'p3', titulo: 'Tentativa, Consumação e Crime Impossível', area: 'Direito Penal', duracao: '4:10', playlist: 'Trilha Penalista' },

  // Processo Penal
  { id: 'pp1', titulo: 'Inquérito Policial: Características e Incomunicabilidade', area: 'Direito Processual Penal', duracao: '4:55', emAlta: true },
  { id: 'pp2', titulo: 'Prisão Preventiva vs Prisão em Flagrante', area: 'Direito Processual Penal', duracao: '5:10', recente: true },

  // Civil
  { id: 'civ1', titulo: 'Prescrição vs Decadência: Diferenças Fundamentais', area: 'Direito Civil', duracao: '4:05', emAlta: true, playlist: 'Essenciais OAB' },
  { id: 'civ2', titulo: 'Responsabilidade Civil Objetiva e Subjetiva', area: 'Direito Civil', duracao: '5:00', playlist: 'Fundamentos' },
  { id: 'civ3', titulo: 'Teoria Geral dos Contratos e Função Social', area: 'Direito Civil', duracao: '4:35', recente: true },

  // Processo Civil
  { id: 'pc1', titulo: 'Tutelas Provisórias de Urgência e Evidência', area: 'Direito Processual Civil', duracao: '5:15', emAlta: true },
  { id: 'pc2', titulo: 'Recurso de Apelação e Agravo de Instrumento', area: 'Direito Processual Civil', duracao: '4:50', playlist: 'Essenciais OAB' },

  // Administrativo
  { id: 'adm1', titulo: 'Princípios do LIMPE no Artigo 37 da Constituição', area: 'Direito Administrativo', duracao: '3:45', emAlta: true, playlist: 'Fundamentos' },
  { id: 'adm2', titulo: 'Atos Administrativos: Requisitos e Atributos', area: 'Direito Administrativo', duracao: '4:25', recente: true },

  // Trabalho
  { id: 'tr1', titulo: 'Elementos Fáticos-Jurídicos da Relação de Emprego', area: 'Direito do Trabalho', duracao: '4:10', emAlta: true },
  { id: 'tr2', titulo: 'Rescisão Contratual e Verbas Rescisórias', area: 'Direito do Trabalho', duracao: '5:05', playlist: 'Essenciais OAB' },

  // Processo do Trabalho
  { id: 'ptr1', titulo: 'Rito Sumaríssimo vs Rito Ordinário na CLT', area: 'Direito Processual do Trabalho', duracao: '4:20' },

  // Tributário
  { id: 'tb1', titulo: 'Princípios da Anterioridade Anual e Nonagesimal', area: 'Direito Tributário', duracao: '4:45', emAlta: true },
  { id: 'tb2', titulo: 'Imunidades Tributárias vs Isenções', area: 'Direito Tributário', duracao: '4:30', recente: true },

  // Empresarial
  { id: 'emp1', titulo: 'Teoria da Empresa e Empresário Individual', area: 'Direito Empresarial', duracao: '3:55' },
  { id: 'emp2', titulo: 'Sociedades Limitadas (LTDA) e Desconsideração da Personalidade', area: 'Direito Empresarial', duracao: '5:10' },

  // Previdenciário
  { id: 'prev1', titulo: 'Segurados Obrigatórios e Facultativos do RGPS', area: 'Direito Previdenciário', duracao: '4:15' },

  // Ambiental
  { id: 'amb1', titulo: 'Princípios da Prevenção e da Precaução no Direito Ambiental', area: 'Direito Ambiental', duracao: '3:50' },

  // Direitos Humanos
  { id: 'dh1', titulo: 'Eficácia Horizontal dos Direitos Fundamentais', area: 'Direitos Humanos & Ética', duracao: '4:30' },

  // Consumidor
  { id: 'cons1', titulo: 'Inversão do Ônus da Prova e Vulnerabilidade do Consumidor', area: 'Direito do Consumidor', duracao: '4:00', emAlta: true },

  // Digital
  { id: 'dig1', titulo: 'Bases Legais para Tratamento de Dados na LGPD', area: 'Direito Digital & LGPD', duracao: '4:40', recente: true },
];

interface Props {
  activeTab: PilulasHeroTab;
  onSelectTab: (tab: PilulasHeroTab) => void;
  favoritosIds: Set<string>;
  onToggleFavorito: (id: string) => void;
}

export const PilulasAreasCatalog: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  favoritosIds,
  onToggleFavorito,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlayToggle = useCallback((id: string) => {
    haptic.selection();
    setPlayingId((prev) => (prev === id ? null : id));
  }, []);

  // Filtragem dos itens de acordo com a busca ou filtro especial do painel (favoritos, emalta, etc)
  const filteredCatalog = useMemo(() => {
    let items = PILULAS_MOCK_CATALOG;

    if (activeTab === 'favoritos') {
      items = items.filter((item) => favoritosIds.has(item.id));
    } else if (activeTab === 'emalta') {
      items = items.filter((item) => item.emAlta);
    } else if (activeTab === 'recentes') {
      items = items.filter((item) => item.recente);
    } else if (activeTab === 'playlist') {
      items = items.filter((item) => Boolean(item.playlist));
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      items = items.filter(
        (item) =>
          item.titulo.toLowerCase().includes(term) ||
          item.area.toLowerCase().includes(term) ||
          (item.playlist && item.playlist.toLowerCase().includes(term))
      );
    }

    return items;
  }, [activeTab, searchTerm, favoritosIds]);

  // Agrupamento estrito por Área do Direito (Sem menu de alternância horizontal)
  const areasWithItems = useMemo(() => {
    return AREAS_DO_DIREITO.map((area) => {
      const items = filteredCatalog.filter((item) => item.area === area.nome);
      return {
        ...area,
        items,
      };
    }).filter((area) => area.items.length > 0);
  }, [filteredCatalog]);

  return (
    <div className="space-y-8 pt-4 pb-24 max-w-[1400px] mx-auto px-3 sm:px-6">
      {/* Barra de Busca de Resumos */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar tema, assunto ou artigo em áudio..."
          className="w-full h-12 pl-11 pr-4 rounded-2xl bg-zinc-900/90 border border-white/10 text-white placeholder-zinc-500 text-[14px] focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/50 transition-all shadow-lg"
        />
        <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-3.5" />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3.5 top-3.5 text-xs text-zinc-400 hover:text-white"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Indicador de Filtro Ativo do Painel (se não for todos) */}
      {activeTab !== 'todos' && (
        <div className="flex items-center justify-between px-1 bg-amber-500/10 border border-amber-500/20 rounded-2xl py-2.5 px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              {activeTab === 'favoritos' && 'Exibindo: Meus Favoritos'}
              {activeTab === 'emalta' && 'Exibindo: Em Alta na Semana'}
              {activeTab === 'recentes' && 'Exibindo: Áudios Recentes'}
              {activeTab === 'playlist' && 'Exibindo: Playlists & Trilhas'}
            </span>
          </div>
          <button
            onClick={() => onSelectTab('todos')}
            className="text-xs text-zinc-400 hover:text-white font-medium underline"
          >
            Ver todas as áreas
          </button>
        </div>
      )}

      {/* Conteúdo: Organizado Estritamente Dentro de Cada Área do Direito */}
      {areasWithItems.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-zinc-900/40 border border-white/5 px-4">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            {activeTab === 'favoritos' ? <Bookmark className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </div>
          <h4 className="text-white font-semibold text-base mb-1">
            {activeTab === 'favoritos' ? 'Nenhum resumo favoritado ainda' : 'Nenhuma pílula encontrada'}
          </h4>
          <p className="text-zinc-400 text-xs max-w-sm mx-auto">
            {activeTab === 'favoritos'
              ? 'Toque no ícone de marcador para salvar seus resumos preferidos e acessá-los rapidamente aqui.'
              : 'Tente ajustar os termos de pesquisa.'}
          </p>
        </div>
      ) : (
        areasWithItems.map((area) => (
          <section key={area.id} className="space-y-3">
            {/* Cabeçalho da Área do Direito */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-1.5 h-5 rounded-full"
                  style={{ backgroundColor: area.cor }}
                />
                <h3 className="font-display text-white text-[16px] sm:text-[17px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>{area.icone}</span>
                  <span>{area.nome}</span>
                </h3>
              </div>
              <span className="text-xs text-zinc-400 font-medium">
                {area.items.length} {area.items.length === 1 ? 'áudio' : 'áudios'}
              </span>
            </div>

            {/* Grade de Pílulas da Área */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {area.items.map((item) => {
                const isPlaying = playingId === item.id;
                const isFav = favoritosIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handlePlayToggle(item.id)}
                    className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 shadow-lg shadow-black/40 overflow-hidden ${
                      isPlaying
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-amber-950/20'
                        : 'bg-[#18181B]/80 hover:bg-[#202024] border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Topo do Card: Badge da Matéria + Duração + Favoritar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border leading-none flex items-center gap-1"
                          style={{
                            color: area.cor,
                            backgroundColor: `${area.cor}15`,
                            borderColor: `${area.cor}30`,
                          }}
                        >
                          <span>{area.icone}</span>
                          <span>{area.nome.replace('Direito ', '')}</span>
                        </span>

                        {item.playlist && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-purple-300 bg-purple-950/40 border border-purple-800/40 leading-none">
                            {item.playlist}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          haptic.selection();
                          onToggleFavorito(item.id);
                        }}
                        aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isFav
                            ? 'text-amber-400 bg-amber-500/20'
                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>

                    {/* Título do Resumo */}
                    <h4 className="font-sans text-[14px] sm:text-[14.5px] font-semibold text-white/95 leading-snug group-hover:text-amber-300 transition-colors">
                      {item.titulo}
                    </h4>

                    {/* Rodapé do Card: Equalizador Waveform + Botão de Play */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        {isPlaying ? (
                          <div className="flex items-center gap-1 h-3.5">
                            <span className="w-1 bg-amber-400 rounded-full animate-[equalize_0.8s_ease-in-out_infinite] h-full" />
                            <span className="w-1 bg-amber-400 rounded-full animate-[equalize_0.6s_ease-in-out_infinite_0.2s] h-full" />
                            <span className="w-1 bg-amber-400 rounded-full animate-[equalize_1s_ease-in-out_infinite_0.4s] h-full" />
                            <span className="w-1 bg-amber-400 rounded-full animate-[equalize_0.7s_ease-in-out_infinite_0.1s] h-full" />
                          </div>
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
                        )}
                        <span className="text-[11.5px] text-zinc-400 font-mono">
                          {item.duracao}
                        </span>
                      </div>

                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isPlaying
                            ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                            : 'bg-white/10 text-white group-hover:bg-amber-500 group-hover:text-black'
                        }`}
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      {/* Animação do Equalizador */}
      <style>{`
        @keyframes equalize {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
      `}</style>
    </div>
  );
};

export default memo(PilulasAreasCatalog);
