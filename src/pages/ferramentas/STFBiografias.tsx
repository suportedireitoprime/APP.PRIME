import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, BookOpen, User, CheckCircle2, AlertCircle, Download, Loader2, FileText, ExternalLink, Clock, Search, Mic, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/lib/nativeHaptics';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { jsPDF } from 'jspdf';

type Ministro = {
  id: string;
  nome: string;
  nome_completo: string;
  foto_url: string;
  status: 'vigente' | 'aposentado' | 'falecido';
  genero: 'M' | 'F';
  data_nascimento?: string;
  data_indicacao?: string;
  data_fim?: string;
  biografia?: string;
  curriculo?: string;
  artigos_revistas?: string;
  livros?: string;
  datas_historicas?: string;
  diversos?: string;
  dados_e_datas?: { etapa: string; pdf_url: string | null; ocr_text: string | null }[];
};

type FilterType = 'todos' | 'vigentes' | 'mulheres' | 'homens';

export default function STFBiografias() {
  const navigate = useNavigate();
  const [ministros, setMinistros] = useState<Ministro[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');
  const [selectedMinistro, setSelectedMinistro] = useState<Ministro | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'Sobre' | 'Linha do Tempo' | 'Currículo' | 'Obras' | 'Discursos'>('Sobre');
  const [expandedTimeline, setExpandedTimeline] = useState<Record<number, boolean>>({});
  const [loadingDetails, setLoadingDetails] = useState(false);

  const downloadPDF = () => {
    if (!selectedMinistro || !selectedMinistro.curriculo) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Currículo - ${selectedMinistro.nome_completo}`, 14, 20);
      doc.setFontSize(11);
      
      const splitText = doc.splitTextToSize(selectedMinistro.curriculo, 180);
      let y = 30;
      for (let i = 0; i < splitText.length; i++) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(splitText[i], 14, y);
        y += 6;
      }
      
      doc.save(`curriculo_${selectedMinistro.nome.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error("Erro ao gerar PDF", e);
    }
  };

  useEffect(() => {
    const fetchBiografias = async () => {
      const { data, error } = await supabase
        .from('stf_ministros')
        .select('id, nome, nome_completo, foto_url, status, genero, data_nascimento, data_indicacao, data_fim')
        .order('status', { ascending: false })
        .order('nome', { ascending: true });

      if (data) {
        const sorted = data.sort((a, b) => {
          if (a.status === 'vigente' && b.status !== 'vigente') return -1;
          if (a.status !== 'vigente' && b.status === 'vigente') return 1;
          return a.nome.localeCompare(b.nome);
        });
        setMinistros(sorted);
      }
      setLoading(false);
    };

    fetchBiografias();
  }, []);

  const handleMinistroClick = async (ministro: Ministro) => {
    haptic.selection();
    setSelectedMinistro(ministro);
    setLoadingDetails(true);

    const { data } = await supabase
      .from('stf_ministros')
      .select('biografia, curriculo, artigos_revistas, livros, datas_historicas, diversos, dados_e_datas')
      .eq('id', ministro.id)
      .single();

    if (data) {
      setSelectedMinistro(prev => prev ? { ...prev, ...data } : null);
      setExpandedTimeline({});
    }
    setLoadingDetails(false);
  };

  const handleBack = () => {
    haptic.selection();
    navigate(-1);
  };

  const filteredMinistros = ministros.filter((m) => {
    const matchesSearch = m.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.nome_completo.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeFilter === 'todos') return true;
    if (activeFilter === 'vigentes') return m.status?.toLowerCase().includes('vigente') || m.status?.toLowerCase().includes('ativo');
    if (activeFilter === 'mulheres') return m.genero === 'F';
    if (activeFilter === 'homens') return m.genero !== 'F';
    return true;
  });

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('vigente') || s.includes('ativo')) {
      return 'bg-green-500/15 text-green-400 border-green-500/30';
    }
    if (s.includes('aposentad')) {
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    }
    if (s.includes('falecid')) {
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    }
    return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  };

  const getStatusLabel = (status: string, genero: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('vigente') || s.includes('ativo')) return 'Vigente';
    if (s.includes('aposentad')) return genero === 'F' ? 'Aposentada' : 'Aposentado';
    if (s.includes('falecid')) return genero === 'F' ? 'Falecida' : 'Falecido';
    return status;
  };

  const calculateAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const getMandatoText = (m: Ministro) => {
    if (!m.data_indicacao) return '';
    const startYear = m.data_indicacao.substring(0, 4);
    if (m.status === 'vigente') {
      return `${startYear} — Atual`;
    }
    const endYear = m.data_fim ? m.data_fim.substring(0, 4) : '?';
    return `${startYear} — ${endYear}`;
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta pesquisa por voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setSearchQuery(speechResult);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="min-h-dvh bg-zinc-950 pb-20 relative overflow-hidden flex flex-col">
      {/* Botão de Voltar Premium */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-50 flex items-center justify-center w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors focus-visible:outline-none"
      >
        <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
      </button>

      <div className="absolute inset-0 z-0 opacity-40">
        <ShapeGrid 
          speed={0.5} 
          squareSize={40}
          direction='diagonal'
          borderColor='rgba(168, 85, 247, 0.15)'
          hoverFillColor='rgba(168, 85, 247, 0.2)'
          shape='square'
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10 pt-24 px-4 md:px-12 mx-auto w-full max-w-[800px] flex-1 flex flex-col">
        <div className="mb-8">
          <h2 className="font-serif italic text-4xl font-bold text-white leading-[1.05] tracking-tight drop-shadow-lg mb-3">
            Biografias do STF
          </h2>
          <p className="text-purple-200 text-base font-body leading-relaxed max-w-xl">
            Conheça o histórico, as indicações e a trajetória de todos os Ministros que já passaram pelo Supremo.
          </p>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl py-3.5 pl-11 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all shadow-inner"
            placeholder="Pesquisar ministro por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            onClick={handleVoiceSearch}
            className={`absolute inset-y-0 right-2 flex items-center justify-center w-10 h-10 my-auto rounded-xl transition-all ${
              isListening ? 'bg-purple-500 text-white animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
            title="Pesquisa por voz"
          >
            <Mic className="h-5 w-5" />
          </button>
        </div>

        {/* Menu de Alternância (Filtros) */}
        <div className="flex flex-nowrap items-center gap-2 mb-8 overflow-x-auto custom-scrollbar pb-2 w-full max-w-full pr-4 md:pr-0 after:content-[''] after:w-2 after:flex-shrink-0">
          {[
            { id: 'todos', label: 'Todos', count: ministros.length },
            { id: 'vigentes', label: 'Vigentes', count: ministros.filter(m => m.status?.toLowerCase().includes('vigente') || m.status?.toLowerCase().includes('ativo')).length },
            { id: 'mulheres', label: 'Mulheres', count: ministros.filter(m => m.genero === 'F').length },
            { id: 'homens', label: 'Homens', count: ministros.filter(m => m.genero !== 'F').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                haptic.selection();
                setActiveFilter(tab.id as FilterType);
              }}
              className={`whitespace-nowrap flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${
                activeFilter === tab.id
                  ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/40'
                  : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {tab.label} <span className="opacity-60 ml-1 font-normal text-xs">({tab.count})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMinistros.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-zinc-900/50 rounded-3xl border border-white/5">
            <User className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">Nenhum ministro encontrado para este filtro.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-12">
            <AnimatePresence mode="popLayout">
              {filteredMinistros.map((ministro, index) => (
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                key={ministro.id}
                onClick={() => handleMinistroClick(ministro)}
                className="group relative bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden hover:border-purple-500/50 transition-all duration-300 cursor-pointer flex hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] h-32 sm:h-40"
              >
                  {/* Foto 3x4 */}
                  <div className="relative w-24 sm:w-28 flex-shrink-0 overflow-hidden bg-zinc-900/50 border-r border-white/5">
                    {ministro.foto_url ? (
                      <img 
                        src={ministro.foto_url}
                        alt={ministro.nome}
                        loading="lazy"
                        className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          const parent = (e.target as HTMLImageElement).parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-icon w-full h-full flex flex-col items-center justify-center p-4 text-center';
                            fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-zinc-700 mb-2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><span class="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">Sem<br/>Foto</span>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        <User className="w-6 h-6 text-zinc-700 mb-2" />
                        <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">Sem<br/>Foto</span>
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 flex flex-col min-w-0 py-3 px-4 sm:py-4 sm:px-5 justify-center">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(ministro.status)}`}>
                        {getStatusLabel(ministro.status, ministro.genero)}
                      </div>
                    </div>
                    <h2 className="font-display font-bold text-lg sm:text-xl text-white mb-0.5 truncate uppercase tracking-widest">
                      {ministro.nome}
                    </h2>
                    
                    <div className="flex flex-col text-zinc-500 text-xs sm:text-sm mt-1.5 space-y-0.5">
                      {ministro.data_nascimento && (
                        <span>Idade: <strong className="text-zinc-300 font-medium">{calculateAge(ministro.data_nascimento)} anos</strong></span>
                      )}
                      {ministro.data_indicacao && (
                        <span className="truncate">Mandato: <strong className="text-zinc-300 font-medium">{getMandatoText(ministro)}</strong></span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Ministro */}
      <AnimatePresence>
        {selectedMinistro && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 pt-[env(safe-area-inset-top)] sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMinistro(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-3xl h-[calc(100dvh-env(safe-area-inset-top))] sm:h-auto sm:max-h-[90dvh] bg-zinc-950/95 backdrop-blur-xl border-t border-x sm:border-b sm:rounded-3xl border-white/10 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              
              <button
                onClick={() => {
                  setSelectedMinistro(null);
                  setTimeout(() => setActiveModalTab('Sobre'), 300);
                }}
                className="absolute top-4 right-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:text-white hover:bg-black/60 transition-all shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative pb-[calc(2rem+env(safe-area-inset-bottom))]">
                
                {/* Header (Left photo, right content) */}
                <div className="flex-shrink-0 flex flex-row items-stretch border-b border-white/5 relative bg-zinc-900/50">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 z-10" />
                  
                  {/* Foto 3x4 Modal - Always left */}
                  <div className="relative w-32 sm:w-40 flex-shrink-0 bg-zinc-900 border-r border-white/5">
                    {selectedMinistro.foto_url ? (
                      <img 
                        src={selectedMinistro.foto_url}
                        alt={selectedMinistro.nome}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <User className="w-12 h-12 text-zinc-700 mb-2" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 p-4 sm:p-8 justify-center flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className={`px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider border ${getStatusColor(selectedMinistro.status)}`}>
                        {getStatusLabel(selectedMinistro.status, selectedMinistro.genero)}
                      </div>
                    </div>
                    <h2 className="font-display font-bold text-xl sm:text-3xl text-white mb-1 uppercase tracking-widest leading-tight pr-10">
                      {selectedMinistro.nome}
                    </h2>
                    <p className="text-zinc-400 text-xs sm:text-base font-body mb-4 line-clamp-2 sm:line-clamp-none">
                      {selectedMinistro.nome_completo}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row sm:flex-wrap text-zinc-500 text-xs sm:text-sm gap-1 sm:gap-x-6">
                      {selectedMinistro.data_nascimento && (
                        <span>Nascimento: <strong className="text-zinc-300">{new Date(selectedMinistro.data_nascimento).toLocaleDateString('pt-BR')}</strong></span>
                      )}
                      {selectedMinistro.data_indicacao && (
                        <span>Mandato: <strong className="text-zinc-300">{getMandatoText(selectedMinistro)}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs Menu */}
                <div className="flex flex-shrink-0 w-full min-h-[50px] overflow-x-auto custom-scrollbar border-b border-white/10 bg-zinc-900/30 sticky top-0 z-20">
                  {(['Sobre', 'Linha do Tempo', 'Currículo', 'Obras', 'Discursos'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveModalTab(tab)}
                      className={`px-6 py-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
                        activeModalTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8">
                  {loadingDetails ? (
                    <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-4" />
                      <p>Carregando informações do acervo histórico...</p>
                    </div>
                  ) : (
                    <>
                      {activeModalTab === 'Sobre' && (
                        <div className="prose prose-invert prose-purple max-w-none">
                          {selectedMinistro.biografia ? (
                            <div className="text-zinc-300 text-base sm:text-lg leading-relaxed font-body whitespace-pre-wrap">
                              {selectedMinistro.biografia}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-center">
                              <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                              <p>Biografia detalhada ainda não disponível ou em processamento.</p>
                            </div>
                          )}
                        </div>
                      )}

                  {activeModalTab === 'Linha do Tempo' && (
                    <div className="space-y-0">
                      {!selectedMinistro.dados_e_datas || selectedMinistro.dados_e_datas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-center">
                          <Clock className="w-12 h-12 mb-4 opacity-50" />
                          <p>Linha do tempo não disponível para este ministro.</p>
                          <p className="text-xs mt-1 text-zinc-600">Os dados são extraídos do acervo da Biblioteca do STF.</p>
                        </div>
                      ) : (
                        <div className="relative pl-8 sm:pl-10">
                          {/* Linha vertical */}
                          <div className="absolute left-3 sm:left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-500/60 via-purple-500/30 to-transparent" />

                          {selectedMinistro.dados_e_datas.map((ev, idx) => (
                            <div key={idx} className="relative mb-8 last:mb-0">
                              {/* Bolinha */}
                              <div className="absolute -left-8 sm:-left-10 top-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-purple-500 bg-zinc-900 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-400" />
                              </div>

                              {/* Conteúdo do evento */}
                              <div className="bg-zinc-800/50 border border-white/5 rounded-xl p-4 sm:p-5 hover:border-purple-500/20 transition-colors">
                                <h4 className="text-sm sm:text-base font-sans font-semibold text-purple-100 uppercase tracking-wide leading-snug mb-1">
                                  {ev.etapa}
                                </h4>

                                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-body mb-3">
                                  <Calendar className="w-3.5 h-3.5 opacity-70" />
                                  <span>
                                    {(ev.etapa.includes('INDICAÇÃO') || ev.etapa.includes('NOMEAÇÃO') || ev.etapa.includes('POSSE')) && selectedMinistro.data_indicacao 
                                      ? new Date(selectedMinistro.data_indicacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                                      : (ev.etapa.includes('APOSENTADORIA') || ev.etapa.includes('FALECIMENTO')) && selectedMinistro.data_fim 
                                        ? new Date(selectedMinistro.data_fim).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
                                        : 'Data detalhada no documento original'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {ev.pdf_url && (
                                    <a
                                      href={ev.pdf_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium transition-colors border border-purple-500/20"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      Ver documento original (PDF)
                                      <ExternalLink className="w-3 h-3 opacity-60" />
                                    </a>
                                  )}

                                  {ev.ocr_text && (
                                    <button
                                      onClick={() => setExpandedTimeline(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors border border-white/5"
                                    >
                                      <BookOpen className="w-3.5 h-3.5" />
                                      {expandedTimeline[idx] ? 'Ocultar texto' : 'Ver texto extraído'}
                                    </button>
                                  )}
                                </div>

                                {ev.ocr_text && expandedTimeline[idx] && (
                                  <div className="mt-4 p-4 bg-zinc-900/80 rounded-lg border border-white/5">
                                    <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-body">
                                      {ev.ocr_text.replace(/\n{3,}/g, '\n\n')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {activeModalTab === 'Currículo' && (
                    <div className="prose prose-invert prose-purple max-w-none">
                      {selectedMinistro.curriculo ? (
                        <div className="flex flex-col gap-6">
                          <div className="flex justify-end">
                            <button
                              onClick={downloadPDF}
                              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              <Download className="w-4 h-4" />
                              Baixar Currículo PDF
                            </button>
                          </div>
                          <div className="text-zinc-300 text-base sm:text-lg leading-relaxed font-body whitespace-pre-wrap">
                            {selectedMinistro.curriculo}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-center">
                          <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                          <p>Currículo não disponível para este ministro.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeModalTab === 'Obras' && (
                    <div className="prose prose-invert prose-purple max-w-none space-y-8">
                      {!selectedMinistro.livros && !selectedMinistro.artigos_revistas ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-center">
                          <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                          <p>Informações sobre obras não disponíveis.</p>
                        </div>
                      ) : (
                        <>
                          {selectedMinistro.livros && (
                            <div>
                              <h3 className="text-xl font-display font-bold text-white mb-4 uppercase tracking-widest border-b border-white/10 pb-2">Livros</h3>
                              <div className="text-zinc-300 text-base leading-relaxed whitespace-pre-wrap">{selectedMinistro.livros.replace(/\n{3,}/g, '\n\n')}</div>
                            </div>
                          )}
                          {selectedMinistro.artigos_revistas && (
                            <div>
                              <h3 className="text-xl font-display font-bold text-white mb-4 uppercase tracking-widest border-b border-white/10 pb-2">Artigos de Revistas</h3>
                              <div className="text-zinc-300 text-base leading-relaxed whitespace-pre-wrap">{selectedMinistro.artigos_revistas.replace(/\n{3,}/g, '\n\n')}</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activeModalTab === 'Discursos' && (
                    <div className="prose prose-invert prose-purple max-w-none space-y-8">
                      {!selectedMinistro.datas_historicas && !selectedMinistro.diversos ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-center">
                          <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                          <p>Discursos e datas históricas não disponíveis.</p>
                        </div>
                      ) : (
                        <>
                          {selectedMinistro.datas_historicas && (
                            <div>
                              <h3 className="text-xl font-display font-bold text-white mb-4 uppercase tracking-widest border-b border-white/10 pb-2">Datas Históricas (Discursos)</h3>
                              <div className="text-zinc-300 text-base leading-relaxed whitespace-pre-wrap">{selectedMinistro.datas_historicas.replace(/\n{3,}/g, '\n\n')}</div>
                            </div>
                          )}
                          {selectedMinistro.diversos && (
                            <div>
                              <h3 className="text-xl font-display font-bold text-white mb-4 uppercase tracking-widest border-b border-white/10 pb-2">Diversos</h3>
                              <div className="text-zinc-300 text-base leading-relaxed whitespace-pre-wrap">{selectedMinistro.diversos.replace(/\n{3,}/g, '\n\n')}</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
                
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
