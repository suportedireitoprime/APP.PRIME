import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Sparkles, Send, Loader2, ArrowLeft, HelpCircle } from 'lucide-react';
import { MeExpliqueHubHeader } from '../MeExpliqueHubHeader';
import { MeExpliqueCardResultado } from '../MeExpliqueCardResultado';
import { useMeExpliqueTutor } from '@/hooks/useMeExpliqueTutor';
import { haptic } from '@/lib/nativo';

interface LivroCatalogado {
  id: string;
  titulo: string;
  autor: string;
  categoria: string;
  capa: string;
  sobre: string;
  capitulos: Array<{ numero: number; titulo: string; tema: string }>;
}

const LIVROS_BIBLIOTECA: LivroCatalogado[] = [
  {
    id: 'delitos-penas',
    titulo: 'Dos Delitos e das Penas',
    autor: 'Cesare Beccaria',
    categoria: 'Clássicos do Direito',
    capa: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=640&auto=format&fit=crop&q=80',
    sobre: 'Obra fundadora do Direito Penal moderno, defendendo a proporcionalidade das penas e o fim da tortura.',
    capitulos: [
      { numero: 1, titulo: 'Origem das Penas e Direito de Punir', tema: 'Por que o Estado pode punir alguém' },
      { numero: 2, titulo: 'Da Proporção entre Delitos e Penas', tema: 'Por que uma pena pesada demais é injusta' },
      { numero: 3, titulo: 'Da Tortura e dos Interrogatórios', tema: 'Por que a tortura não serve para achar a verdade' },
      { numero: 4, titulo: 'Da Pena de Morte e Prisão', tema: 'A inutilidade da morte frente à certeza da punição' },
      { numero: 5, titulo: 'Como Prevenir os Crimes', tema: 'Educação, clareza das leis e respeito' },
    ],
  },
  {
    id: 'espirito-leis',
    titulo: 'O Espírito das Leis',
    autor: 'Montesquieu',
    categoria: 'Filosofia do Direito',
    capa: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=640&auto=format&fit=crop&q=80',
    sobre: 'Tratado clássico que instituiu a divisão dos Três Poderes (Executivo, Legislativo e Judiciário).',
    capitulos: [
      { numero: 1, titulo: 'Das Leis em Geral e a Natureza Humana', tema: 'O que são leis e por que elas existem' },
      { numero: 2, titulo: 'Das Três Espécies de Governos', tema: 'República, Monarquia e Despotismo' },
      { numero: 3, titulo: 'Da Separação dos Três Poderes', tema: 'Por que o poder precisa frear o poder' },
      { numero: 4, titulo: 'Da Liberdade Política do Cidadão', tema: 'Fazer o que as leis permitem' },
      { numero: 5, titulo: 'Da Influência do Clima e dos Costumes', tema: 'Como o ambiente molda as leis de um povo' },
    ],
  },
  {
    id: 'teoria-pura',
    titulo: 'Teoria Pura do Direito',
    autor: 'Hans Kelsen',
    categoria: 'Teoria Geral do Direito',
    capa: 'https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?w=640&auto=format&fit=crop&q=80',
    sobre: 'Propõe a ciência do Direito livre de julgamentos morais, sociológicos ou ideológicos.',
    capitulos: [
      { numero: 1, titulo: 'Direito e Natureza: O Ser e o Dever-Ser', tema: 'A diferença entre a lei da física e a regra jurídica' },
      { numero: 2, titulo: 'Direito e Moral: A Validade da Norma', tema: 'Uma lei pode ser injusta e continuar válida?' },
      { numero: 3, titulo: 'A Pirâmide e a Hierarquia das Normas', tema: 'Por que uma lei inferior obedece à Constituição' },
      { numero: 4, titulo: 'A Norma Fundamental (Grundnorm)', tema: 'A regra imaginária que dá força a tudo' },
      { numero: 5, titulo: 'Interpretação e a Moldura do Juiz', tema: 'Como o juiz escolhe a decisão dentro da lei' },
    ],
  },
  {
    id: 'oratoria-juridica',
    titulo: 'Oratória Forense e Persuasão',
    autor: 'Manual de Prática',
    categoria: 'Oratória & Prática',
    capa: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=640&auto=format&fit=crop&q=80',
    sobre: 'Técnicas de sustentação oral, audiências, Júri e postura da advocacia nos tribunais.',
    capitulos: [
      { numero: 1, titulo: 'Vencendo o Medo de Falar em Público', tema: 'Controle de ansiedade e respiração diafragmática' },
      { numero: 2, titulo: 'Estrutura de uma Sustentação Oral Épica', tema: 'Exórdio, narrativa, tese e pedido nos 15 minutos' },
      { numero: 3, titulo: 'A Arte do Tribunal do Júri', tema: 'Conexão com os jurados e linguagem simples' },
      { numero: 4, titulo: 'Como Desarmar Pegadinhas em Audiências', tema: 'Segurança diante de testemunhas e magistrados' },
    ],
  },
  {
    id: 'constituicao-descomplicada',
    titulo: 'Direito Constitucional Essencial',
    autor: 'Doutrina Prime',
    categoria: 'Preparatório & Concursos',
    capa: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=640&auto=format&fit=crop&q=80',
    sobre: 'Os pilares da Carta de 1988, direitos fundamentais e remédios constitucionais.',
    capitulos: [
      { numero: 1, titulo: 'Princípios Fundamentais (Art. 1º ao 4º)', tema: 'Soberania, cidadania, dignidade humana' },
      { numero: 2, titulo: 'Direitos e Garantias Individuais (Art. 5º)', tema: 'Vida, liberdade, igualdade, propriedade' },
      { numero: 3, titulo: 'Remédios Constitucionais', tema: 'Habeas Corpus, Mandado de Segurança e Ação Popular' },
      { numero: 4, titulo: 'Organização do Estado e Federação', tema: 'União, Estados, Municípios e DF' },
    ],
  },
];

interface Props {
  onVoltar: () => void;
}

export const MeExpliqueLivrosView: React.FC<Props> = ({ onVoltar }) => {
  const [busca, setBusca] = useState('');
  const [livroSelecionado, setLivroSelecionado] = useState<LivroCatalogado | null>(null);
  const [capituloAtivo, setCapituloAtivo] = useState<{ numero?: number; titulo: string } | null>(null);
  const [perguntaCustom, setPerguntaCustom] = useState('');

  const tutor = useMeExpliqueTutor();

  const livrosFiltrados = useMemo(() => {
    const q = busca.toLowerCase().trim();
    if (!q) return LIVROS_BIBLIOTECA;
    return LIVROS_BIBLIOTECA.filter(
      (l) =>
        l.titulo.toLowerCase().includes(q) ||
        l.autor.toLowerCase().includes(q) ||
        l.categoria.toLowerCase().includes(q)
    );
  }, [busca]);

  const handleExplicarBasico = () => {
    if (!livroSelecionado) return;
    void haptic.selection();
    setCapituloAtivo({ titulo: 'Visão Geral do Livro' });
    void tutor.explicarLivro({
      titulo: livroSelecionado.titulo,
      autor: livroSelecionado.autor,
      sobre: livroSelecionado.sobre,
    });
  };

  const handleExplicarCapitulo = (cap: { numero: number; titulo: string; tema: string }) => {
    if (!livroSelecionado) return;
    void haptic.selection();
    setCapituloAtivo({ numero: cap.numero, titulo: cap.titulo });
    void tutor.explicarLivro({
      titulo: livroSelecionado.titulo,
      autor: livroSelecionado.autor,
      capituloTitulo: cap.titulo,
      capituloNumero: cap.numero,
      sobre: `${cap.tema}. Livro geral: ${livroSelecionado.sobre}`,
    });
  };

  const handleEnviarPergunta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perguntaCustom.trim() || !livroSelecionado) return;
    void haptic.medium();
    const p = perguntaCustom.trim();
    setPerguntaCustom('');
    void tutor.explicarLivre(
      `Sobre o livro "${livroSelecionado.titulo}" de ${livroSelecionado.autor} (em foco: ${capituloAtivo?.titulo || 'Livro completo'}): ${p}`
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-16">
      <MeExpliqueHubHeader
        titulo={livroSelecionado ? livroSelecionado.titulo : 'Me Explique — Livros'}
        subtitulo={livroSelecionado ? `Autor: ${livroSelecionado.autor}` : 'Escolha um livro da biblioteca para aprender'}
        onVoltar={() => {
          if (livroSelecionado) {
            setLivroSelecionado(null);
            setCapituloAtivo(null);
            tutor.setResultado(null);
          } else {
            onVoltar();
          }
        }}
      />

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-5 space-y-6">
        {/* Caso 1: Nenhum livro selecionado -> Lista de Livros da Biblioteca */}
        {!livroSelecionado && (
          <div className="space-y-4">
            {/* Campo de Busca */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar livro, autor ou área da biblioteca..."
                className="w-full h-12 rounded-2xl bg-zinc-900 border border-white/10 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Grid de Livros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {livrosFiltrados.map((livro) => (
                <button
                  key={livro.id}
                  type="button"
                  onClick={() => {
                    void haptic.medium();
                    setLivroSelecionado(livro);
                  }}
                  className="group flex flex-col rounded-3xl border border-white/10 bg-zinc-900/90 p-3.5 text-left transition-all hover:bg-zinc-800 hover:border-amber-500/30 active:scale-[0.98] cursor-pointer"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-zinc-950 mb-3">
                    <img
                      src={livro.capa}
                      alt={livro.titulo}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-amber-500/80 px-2 py-0.5 text-[9px] font-bold text-black uppercase tracking-wider backdrop-blur-sm">
                      {livro.categoria}
                    </span>
                  </div>

                  <h3 className="font-sans text-sm font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {livro.titulo}
                  </h3>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{livro.autor}</p>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 mt-1 leading-snug">
                    {livro.sobre}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-amber-400">
                    <span>{livro.capitulos.length} capítulos com IA</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Caso 2: Livro selecionado -> Navegação Básica + Capítulo por Capítulo + Perguntas */}
        {livroSelecionado && (
          <div className="space-y-6">
            {/* Header do Livro Escolhido */}
            <div className="rounded-3xl border border-white/10 bg-zinc-900/90 p-4 flex items-center gap-4">
              <img
                src={livroSelecionado.capa}
                alt={livroSelecionado.titulo}
                className="w-16 h-20 rounded-xl object-cover shrink-0 border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  {livroSelecionado.categoria}
                </span>
                <h2 className="font-sans text-lg font-black text-white truncate">
                  {livroSelecionado.titulo}
                </h2>
                <p className="text-xs text-zinc-400">{livroSelecionado.autor}</p>
              </div>

              <button
                type="button"
                onClick={() => setLivroSelecionado(null)}
                className="rounded-2xl border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/10"
              >
                Trocar
              </button>
            </div>

            {/* Ações Rápidas: O Básico vs Capítulos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Como quer que a IA explique?
                </h3>
              </div>

              {/* Botão de Visão Geral */}
              <button
                type="button"
                onClick={handleExplicarBasico}
                className="w-full flex items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 p-4 text-left transition-all hover:border-amber-400 active:scale-[0.99] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black font-black shadow-md">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-sans text-sm font-bold text-amber-300">
                      Explicar o básico deste livro
                    </h4>
                    <p className="text-xs text-zinc-300 leading-snug">
                      Entenda a ideia central da obra explicada para uma criança de 6 anos
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400 shrink-0">Ouvir →</span>
              </button>

              {/* Lista de Capítulos */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold text-zinc-400">Ou escolha um capítulo específico:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {livroSelecionado.capitulos.map((cap) => {
                    const ativo = capituloAtivo?.numero === cap.numero;
                    return (
                      <button
                        key={cap.numero}
                        type="button"
                        onClick={() => handleExplicarCapitulo(cap)}
                        className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition-all active:scale-[0.99] cursor-pointer ${
                          ativo
                            ? 'border-amber-400 bg-amber-500/20 text-white'
                            : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[11px] font-bold text-amber-400">
                          {cap.numero}
                        </span>
                        <div className="min-w-0">
                          <p className="font-sans text-xs font-bold text-white leading-snug truncate">
                            {cap.titulo}
                          </p>
                          <p className="text-[10.5px] text-zinc-400 line-clamp-1 mt-0.5">
                            {cap.tema}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Loading */}
            {tutor.loading && (
              <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-8 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto" />
                <p className="font-sans text-sm font-bold text-white">
                  O professor IA está preparando a explicação para 6 anos...
                </p>
                <p className="text-xs text-zinc-400">
                  Desmistificando o juridiquês e criando exemplos práticos
                </p>
              </div>
            )}

            {/* Erro */}
            {tutor.erro && !tutor.loading && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
                <p className="text-xs text-red-300">{tutor.erro}</p>
                <button
                  type="button"
                  onClick={handleExplicarBasico}
                  className="mt-2 text-xs font-bold text-white underline"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Resultado da Explicação */}
            {tutor.resultado && !tutor.loading && (
              <MeExpliqueCardResultado
                resultado={tutor.resultado}
                falando={tutor.falando}
                onToggleAudio={() => void tutor.tocarAudio()}
                onSelecionarPergunta={(pergunta) => {
                  void haptic.light();
                  void tutor.explicarLivre(
                    `Pergunta sobre o livro "${livroSelecionado.titulo}": ${pergunta}`
                  );
                }}
              />
            )}

            {/* Fazer Pergunta Livre sobre o Livro */}
            <form
              onSubmit={handleEnviarPergunta}
              className="sticky bottom-4 z-20 rounded-2xl border border-white/15 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-md flex items-center gap-2"
            >
              <input
                type="text"
                value={perguntaCustom}
                onChange={(e) => setPerguntaCustom(e.target.value)}
                placeholder={`Tire qualquer dúvida sobre ${livroSelecionado.titulo}...`}
                className="flex-1 bg-transparent px-3 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!perguntaCustom.trim() || tutor.loading}
                aria-label="Enviar pergunta"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 active:scale-95 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
