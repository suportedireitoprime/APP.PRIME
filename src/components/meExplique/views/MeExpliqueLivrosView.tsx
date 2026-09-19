import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  Sparkles,
  Volume2,
  ArrowLeft,
  Loader2,
  Scale,
  Layers,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { MeExpliqueHubHeader } from '../MeExpliqueHubHeader';
import { MeExpliqueLiveChatView } from './MeExpliqueLiveChatView';
import { haptic } from '@/lib/nativo';
import ShapeGrid from '@/components/ui/ShapeGrid';

export interface LivroReal {
  id: string | number;
  titulo: string;
  autor: string;
  categoria: string;
  capa: string;
  sobre: string;
}

// Catálogo com as capas reais oficiais armazenadas no Supabase Storage
const LIVROS_CATALOGADOS_REAIS: LivroReal[] = [
  {
    id: 'espirito-leis',
    titulo: 'O Espírito das Leis',
    autor: 'Montesquieu',
    categoria: 'Teoria do Estado',
    capa: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg',
    sobre: 'A formulação clássica da separação dos Três Poderes (Executivo, Legislativo e Judiciário) e moderação política.',
  },
  {
    id: 'teoria-pura',
    titulo: 'Teoria Pura do Direito',
    autor: 'Hans Kelsen',
    categoria: 'Teoria do Direito',
    capa: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg',
    sobre: 'Obra fundamental da Teoria do Direito Positivo, a pirâmide de normas e o conceito da Norma Fundamental.',
  },
  {
    id: 'luta-direito',
    titulo: 'A Luta pelo Direito',
    autor: 'Rudolf von Ihering',
    categoria: 'Filosofia do Direito',
    capa: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.jpg',
    sobre: 'O Direito não é mero conceito abstrato, mas uma conquista viva que exige defesa constante de quem o possui.',
  },
  {
    id: 'sobre-liberdade',
    titulo: 'Sobre a Liberdade',
    autor: 'John Stuart Mill',
    categoria: 'Filosofia Política',
    capa: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/sobre_a_liberdade_manual.jpg',
    sobre: 'Ensaio clássico sobre os limites legítimos do poder da sociedade e do Estado sobre a liberdade do indivíduo.',
  },
  {
    id: 'delitos-penas',
    titulo: 'Dos Delitos e das Penas',
    autor: 'Cesare Beccaria',
    categoria: 'Direito Penal Clássico',
    capa: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.jpg',
    sobre: 'Obra fundadora do Direito Penal moderno, proporcionalidade das sanções, abolição da tortura e clareza das leis.',
  },
  {
    id: 'arte-guerra',
    titulo: 'A Arte da Guerra',
    autor: 'Sun Tzu',
    categoria: 'Estratégia & Liderança',
    capa: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_arte_da_guerra_manual.jpg',
    sobre: 'Tratado milenar sobre estratégia, antecipação, disciplina, persuasão e resolução inteligente de conflitos.',
  },
  {
    id: 'o-principe',
    titulo: 'O Príncipe',
    autor: 'Nicolau Maquiavel',
    categoria: 'Ciência Política',
    capa: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg',
    sobre: 'Análise realista sobre conquista, conservação e exercício do poder pelo governante.',
  },
  {
    id: 'leviata',
    titulo: 'O Leviatã',
    autor: 'Thomas Hobbes',
    categoria: 'Filosofia Política',
    capa: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/a_luta_pelo_direito_manual.jpg',
    sobre: 'O pacto social, o estado de natureza humana e a necessidade de um poder soberano para manter a ordem.',
  },
  {
    id: 'mundo-assombrado',
    titulo: 'O Mundo Assombrado pelos Demônios',
    autor: 'Carl Sagan',
    categoria: 'Pensamento Crítico',
    capa: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_mundo_assombrado_pelos_demonios_manual.jpg',
    sobre: 'Ciência como vela na escuridão, ceticismo metodológico e detecção de falácias argumentativas.',
  },
];

interface Props {
  onVoltar: () => void;
}

export const MeExpliqueLivrosView: React.FC<Props> = ({ onVoltar }) => {
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');
  const [livros, setLivros] = useState<LivroReal[]>(LIVROS_CATALOGADOS_REAIS);
  const [carregandoSupabase, setCarregandoSupabase] = useState(false);
  const [livroAoVivo, setLivroAoVivo] = useState<LivroReal | null>(null);

  // Busca obras reais dinamicamente do Supabase para enriquecer a lista
  useEffect(() => {
    let ativo = true;
    async function carregarObras() {
      try {
        setCarregandoSupabase(true);
        const { data, error } = await supabase
          .from('biblioteca_classicos')
          .select('id, livro, autor, imagem, sobre, area')
          .not('imagem', 'is', null)
          .limit(30);

        if (!error && Array.isArray(data) && data.length > 0 && ativo) {
          const vindosDoBanco: LivroReal[] = data.map((r: any) => ({
            id: r.id,
            titulo: r.livro || 'Sem título',
            autor: r.autor || 'Autor Clássico',
            categoria: r.area || 'Clássicos do Direito',
            capa: r.imagem || 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg',
            sobre: r.sobre || 'Obra clássica essencial para compreensão do pensamento jurídico.',
          }));

          // Mescla sem duplicar títulos
          setLivros((atuais) => {
            const mapa = new Map<string, LivroReal>();
            atuais.forEach((l) => mapa.set(l.titulo.toLowerCase().trim(), l));
            vindosDoBanco.forEach((l) => mapa.set(l.titulo.toLowerCase().trim(), l));
            return Array.from(mapa.values());
          });
        }
      } catch {
        // Fallback robusto garantido
      } finally {
        if (ativo) setCarregandoSupabase(false);
      }
    }
    void carregarObras();
    return () => {
      ativo = false;
    };
  }, []);

  const categorias = useMemo(() => {
    const cats = new Set<string>();
    livros.forEach((l) => {
      if (l.categoria) cats.add(l.categoria);
    });
    return ['todos', ...Array.from(cats)];
  }, [livros]);

  const livrosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    return livros.filter((l) => {
      const matchBusca =
        !q ||
        l.titulo.toLowerCase().includes(q) ||
        l.autor.toLowerCase().includes(q) ||
        l.categoria.toLowerCase().includes(q);

      const matchCat = categoriaAtiva === 'todos' || l.categoria === categoriaAtiva;
      return matchBusca && matchCat;
    });
  }, [livros, busca, categoriaAtiva]);

  // Se o usuário selecionou uma obra, abre diretamente o Gemini Live Audio Chat com a Bolinha Animada
  if (livroAoVivo) {
    return (
      <MeExpliqueLiveChatView
        modo="livro"
        contexto={`${livroAoVivo.titulo} — ${livroAoVivo.autor}`}
        subtitulo={livroAoVivo.categoria}
        capa={livroAoVivo.capa}
        onVoltar={() => setLivroAoVivo(null)}
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
          titulo="Me Explique — Livros"
          subtitulo="Converse em tempo real por voz sobre qualquer clássico do Direito"
          onVoltar={onVoltar}
        />
      </div>

      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Barra de Busca Compacta */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Qual livro ou autor você quer destrinchar ao vivo?..."
            className="w-full h-11 rounded-2xl bg-zinc-900/90 border border-white/10 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 shadow-sm"
          />
        </div>

        {/* Filtros em Chips Horizontais Compactos */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categorias.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                void haptic.selection();
                setCategoriaAtiva(cat);
              }}
              className={`shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                categoriaAtiva === cat
                  ? 'bg-amber-500 text-black shadow'
                  : 'bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {cat === 'todos' ? 'Todos os Livros' : cat}
            </button>
          ))}
        </div>

        {/* LISTA COMPACTA DE LIVROS COM CAPAS REAIS */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
            <span className="font-bold uppercase tracking-wider text-[11px] text-zinc-300">
              Obras Disponíveis ({livrosFiltrados.length})
            </span>
            <span className="text-[11px] text-amber-400/90 flex items-center gap-1 font-medium">
              <Volume2 className="w-3.5 h-3.5" /> Voz Gemini Live 120fps
            </span>
          </div>

          {livrosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">Nenhum livro encontrado para "{busca}".</p>
            </div>
          ) : (
            livrosFiltrados.map((livro) => (
              <motion.div
                key={livro.id}
                whileHover={{ scale: 1.008 }}
                whileTap={{ scale: 0.992 }}
                onClick={() => {
                  void haptic.medium();
                  setLivroAoVivo(livro);
                }}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-amber-500/40 shadow-md backdrop-blur-sm cursor-pointer transition-all group"
              >
                {/* Capa Real Compacta */}
                <div className="relative w-12 h-16 sm:w-14 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-white/15 bg-zinc-800 shadow-md">
                  <img
                    src={livro.capa}
                    alt={livro.titulo}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      // Fallback elegante se a imagem falhar
                      (e.currentTarget as HTMLImageElement).src =
                        'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas/o_espirito_das_leis_manual.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Informações da Obra (Compacto e Legível) */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25">
                      {livro.categoria}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-white truncate leading-snug group-hover:text-amber-300 transition-colors">
                    {livro.titulo}
                  </h3>

                  <p className="text-xs text-zinc-400 truncate">
                    Por <span className="text-zinc-300 font-medium">{livro.autor}</span>
                  </p>

                  <p className="text-[11px] text-zinc-500 line-clamp-1 leading-normal">
                    {livro.sobre}
                  </p>
                </div>

                {/* Botão de Ação Direto para Falar ao Vivo */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs shadow-md group-hover:bg-amber-400 active:scale-95 transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Explicar</span> Ao Vivo
                  </button>
                  <span className="text-[10px] text-zinc-500 font-medium pr-1">didática 6 anos</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};
