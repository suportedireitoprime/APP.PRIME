import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, Key, HelpCircle, StickyNote, FileText, ChevronDown, BookOpen, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { baixarBlob } from '@/lib/nativo';

interface CornellPergunta {
  pergunta: string;
  resposta: string;
}

interface CornellData {
  titulo: string;
  palavras_chave: string[];
  perguntas: (string | CornellPergunta)[];
  anotacoes: { topico: string; conteudo: string }[];
  resumo_geral: string;
}

function normalizePergunta(p: string | CornellPergunta): CornellPergunta {
  if (typeof p === 'string') return { pergunta: p, resposta: '' };
  return p;
}

const pdfStyles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 10 },
  header: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 4, fontFamily: 'Helvetica-Bold', color: '#1a1a2e' },
  subtitle: { fontSize: 8, textAlign: 'center', color: '#888', marginBottom: 16 },
  row: { flexDirection: 'row', minHeight: 200 },
  leftCol: { width: '35%', borderRight: '1 solid #ddd', paddingRight: 10 },
  rightCol: { width: '65%', paddingLeft: 10 },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: '#6366f1', marginBottom: 6, fontFamily: 'Helvetica-Bold' },
  keyword: { fontSize: 9, color: '#333', marginBottom: 3, paddingLeft: 6 },
  question: { fontSize: 9, color: '#444', marginBottom: 2, paddingLeft: 6, fontFamily: 'Helvetica-Bold' },
  answer: { fontSize: 8, color: '#666', marginBottom: 6, paddingLeft: 12 },
  noteTopico: { fontSize: 9, fontWeight: 'bold', color: '#1a1a2e', marginTop: 6, fontFamily: 'Helvetica-Bold' },
  noteContent: { fontSize: 9, color: '#444', lineHeight: 1.5, marginTop: 2 },
  separator: { borderBottom: '2 solid #6366f1', marginVertical: 10 },
  resumoBox: { backgroundColor: '#f3f4f6', padding: 10, borderRadius: 4, marginTop: 8 },
  resumoTitle: { fontSize: 10, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  resumoText: { fontSize: 9, color: '#333', lineHeight: 1.6 },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, fontSize: 7, color: '#999', textAlign: 'center' },
});

const CornellPdfDoc = ({ data }: { data: CornellData }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <Text style={pdfStyles.header}>{data.titulo}</Text>
      <Text style={pdfStyles.subtitle}>Resumo Cornell — Direito Prime 2026</Text>
      <View style={pdfStyles.row}>
        <View style={pdfStyles.leftCol}>
          <Text style={pdfStyles.sectionTitle}>PALAVRAS-CHAVE</Text>
          {data.palavras_chave.map((k, i) => (
            <Text key={i} style={pdfStyles.keyword}>• {k}</Text>
          ))}
          <Text style={{ ...pdfStyles.sectionTitle, marginTop: 14 }}>PERGUNTAS</Text>
          {data.perguntas.map((p, i) => {
            const item = normalizePergunta(p);
            return (
              <View key={i}>
                <Text style={pdfStyles.question}>{i + 1}. {item.pergunta}</Text>
                {item.resposta ? <Text style={pdfStyles.answer}>R: {item.resposta}</Text> : null}
              </View>
            );
          })}
        </View>
        <View style={pdfStyles.rightCol}>
          <Text style={pdfStyles.sectionTitle}>ANOTAÇÕES</Text>
          {data.anotacoes.map((a, i) => (
            <View key={i}>
              <Text style={pdfStyles.noteTopico}>{a.topico}</Text>
              <Text style={pdfStyles.noteContent}>{a.conteudo}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={pdfStyles.separator} />
      <View style={pdfStyles.resumoBox}>
        <Text style={pdfStyles.resumoTitle}>RESUMO GERAL</Text>
        <Text style={pdfStyles.resumoText}>{data.resumo_geral}</Text>
      </View>
      <Text style={pdfStyles.footer} render={({ pageNumber, totalPages }) => `Direito Prime — Resumo Cornell — Página ${pageNumber} de ${totalPages}`} fixed />
    </Page>
  </Document>
);

interface Props {
  data: CornellData;
  leiNome: string;
  artigoNumero: string;
}

const ResumoCornellView = ({ data, leiNome, artigoNumero }: Props) => {
  const [exporting, setExporting] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const handleDownload = async () => {
    setExporting(true);
    try {
      const blob = await pdf(<CornellPdfDoc data={data} />).toBlob();
      await baixarBlob(blob, `cornell-${artigoNumero.replace(/\s+/g, '-')}.pdf`, {
        titulo: `Resumo Cornell — Art. ${artigoNumero}`,
        toastSucesso: true,
        menu: false,
        acaoFixa: 'salvar'
      });
    } catch (e) {
      toast.error('Erro ao baixar PDF');
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = async () => {
    setExporting(true);
    try {
      const blob = await pdf(<CornellPdfDoc data={data} />).toBlob();
      await baixarBlob(blob, `cornell-${artigoNumero.replace(/\s+/g, '-')}.pdf`, {
        titulo: `Resumo Cornell — Art. ${artigoNumero}`,
        toastSucesso: false,
        menu: false,
        acaoFixa: 'compartilhar',
        textoCompartilhamento: `Ó, esse aqui é o resumo Cornell de ${leiNome} - Art. ${artigoNumero}. Bons estudos! 🚀`
      });
    } catch (e) {
      toast.error('Erro ao enviar PDF');
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5 bg-white p-4 md:p-6 rounded-2xl border border-slate-200">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-xl font-bold text-zinc-900">{data.titulo}</h2>
        <p className="text-sm text-slate-500 mt-1">{leiNome} — Método Cornell</p>
      </motion.div>

      {/* Two columns layout */}
      <div className="grid grid-cols-1 md:grid-cols-[35%_1fr] gap-4">
        {/* Left: Keywords + Questions */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Palavras-chave</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.palavras_chave.map((k, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">{k}</span>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="rounded-xl border border-sky-200 bg-sky-50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-sky-600" />
              <span className="text-sm font-bold text-sky-600 uppercase tracking-wider">Perguntas</span>
            </div>
            <div className="space-y-2">
              {data.perguntas.map((p, i) => {
                const item = normalizePergunta(p);
                const isOpen = expandedQ === i;
                return (
                  <div key={i} className="rounded-lg border border-sky-200 bg-white overflow-hidden">
                    <button
                      onClick={() => setExpandedQ(isOpen ? null : i)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-left"
                    >
                      <span className="font-bold text-sky-600 text-sm shrink-0">{i + 1}.</span>
                      <span className="text-base font-semibold text-zinc-800 flex-1">{item.pergunta}</span>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-sky-600 shrink-0" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {isOpen && item.resposta && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="px-4 pb-4 pt-0">
                            <div className="p-3 rounded-lg bg-sky-50 border border-sky-100">
                              <p className="text-base text-zinc-700 leading-[1.8]">
                                <span className="font-bold text-sky-700">R:</span> {item.resposta}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Right: Notes */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:p-5">
          <div className="flex items-center gap-2 mb-5">
            <StickyNote className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Anotações</span>
          </div>
          <div className="space-y-4">
            {data.anotacoes.map((a, i) => (
              <div key={i} className="rounded-xl bg-white border border-slate-200 p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <h4 className="font-bold text-base text-zinc-900">{a.topico}</h4>
                </div>
                <div className="text-base leading-[1.8] text-zinc-700 ml-8 prose prose-sm prose-zinc max-w-none prose-p:my-1 prose-headings:my-2">
                  <ReactMarkdown>{a.conteudo}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Summary footer */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-xl bg-slate-100 border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-indigo-600" />
          <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Resumo Geral</span>
        </div>
        <div className="text-base text-zinc-700 leading-[1.8] prose prose-sm prose-zinc max-w-none prose-p:my-1">
          <ReactMarkdown>{data.resumo_geral}</ReactMarkdown>
        </div>
      </motion.div>

      {/* Export buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="grid grid-cols-2 gap-3"
      >
        <button
          onClick={handleDownload} disabled={exporting}
          className="w-full py-3.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Baixar
        </button>
        <button
          onClick={handleShare} disabled={exporting}
          className="w-full py-3.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
        >
          {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 -mt-0.5" />}
          Enviar
        </button>
      </motion.div>
    </div>
  );
};

export default ResumoCornellView;
