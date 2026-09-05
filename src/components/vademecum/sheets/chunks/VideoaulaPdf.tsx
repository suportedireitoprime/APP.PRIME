import { Document, Page, Text, View, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import logoAsset from '@/assets/logo-direitoprime-v2.png.asset.json';
import { srcOf } from '@/lib/assetUrl';

const LOGO_URL = srcOf(logoAsset);

const WINE = '#3d0f1f';
const GOLD = '#c94c4c';
const INK = '#1a1a1a';
const MUTED = '#5c5c5c';
export const pdfStyles = StyleSheet.create({
  page: { paddingTop: 85, paddingBottom: 60, paddingLeft: 85, paddingRight: 57, fontFamily: 'Barlow', fontSize: 12, color: INK, lineHeight: 1.5, backgroundColor: '#ffffff' },
  coverPage: { padding: 0, fontFamily: 'Barlow', fontSize: 12, color: INK, backgroundColor: '#ffffff' },
  watermark: { position: 'absolute', top: '32%', left: '22%', width: 300, height: 300, opacity: 0.05, borderRadius: 9999 },
  header: { position: 'absolute', top: 30, left: 85, right: 57, fontSize: 8, color: MUTED, fontFamily: 'Bebas Neue', letterSpacing: 1.5, borderBottomWidth: 0.5, borderBottomColor: '#ddd', paddingBottom: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footer: { position: 'absolute', bottom: 25, left: 85, right: 57, fontSize: 8, color: MUTED, fontFamily: 'Barlow', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  pageTitle: { fontFamily: 'Bebas Neue', fontSize: 24, color: WINE, letterSpacing: 2, marginBottom: 6 },
  pageTitleBar: { width: 46, height: 3, backgroundColor: GOLD, marginBottom: 18 },
  paragraph: { fontFamily: 'Barlow', fontSize: 12, color: INK, lineHeight: 1.5, textIndent: 35, textAlign: 'justify', marginBottom: 6 },
  h2: { fontFamily: 'Bebas Neue', fontSize: 15, color: WINE, letterSpacing: 1.2, marginTop: 14, marginBottom: 6 },
  h3: { fontFamily: 'Barlow', fontSize: 12, color: WINE, fontWeight: 700, marginTop: 10, marginBottom: 4 },
  bulletRow: { flexDirection: 'row', marginBottom: 4, paddingLeft: 8 },
  bulletDot: { width: 12, fontFamily: 'Barlow', fontSize: 12, color: GOLD },
  bulletText: { flex: 1, fontFamily: 'Barlow', fontSize: 12, color: INK, lineHeight: 1.5, textAlign: 'justify' },
  quote: { borderLeftWidth: 3, borderLeftColor: GOLD, paddingLeft: 10, paddingVertical: 4, marginVertical: 8, fontStyle: 'italic', color: MUTED, fontSize: 11 },
  coverContainer: { flex: 1, padding: 50, position: 'relative', backgroundColor: '#fafaf7' },
  coverBand: { position: 'absolute', top: 0, left: 0, right: 0, height: 12, backgroundColor: WINE },
  coverBandBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 12, backgroundColor: GOLD },
  coverLogo: { width: 90, height: 90, marginTop: 40, marginBottom: 30 },
  coverBrand: { fontFamily: 'Bebas Neue', fontSize: 11, color: WINE, letterSpacing: 4, marginBottom: 8 },
  coverKicker: { fontFamily: 'Barlow', fontSize: 10, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 40 },
  coverTitle: { fontFamily: 'Bebas Neue', fontSize: 42, color: INK, letterSpacing: 1.5, lineHeight: 1.05, marginBottom: 22 },
  coverDivider: { width: 70, height: 4, backgroundColor: GOLD, marginBottom: 22 },
  coverSubject: { fontFamily: 'Barlow', fontSize: 14, color: INK, fontWeight: 500, lineHeight: 1.4, marginBottom: 6 },
  coverMeta: { fontFamily: 'Barlow', fontSize: 11, color: MUTED, marginBottom: 4 },
  coverFooter: { position: 'absolute', bottom: 40, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', fontFamily: 'Bebas Neue', fontSize: 9, color: MUTED, letterSpacing: 2 },
  articleBox: { marginTop: 6, padding: 20, borderWidth: 0.8, borderColor: '#d8d1c4', backgroundColor: '#fbf9f4' },
  articleNumber: { fontFamily: 'Bebas Neue', fontSize: 14, color: WINE, letterSpacing: 1.5, marginBottom: 8 },
  articleText: { fontFamily: 'Barlow', fontSize: 12, color: INK, lineHeight: 1.6, textAlign: 'justify' },
  sourceRow: { marginBottom: 12 },
  sourceLabel: { fontFamily: 'Bebas Neue', fontSize: 10, color: WINE, letterSpacing: 1.5, marginBottom: 2 },
  sourceValue: { fontFamily: 'Barlow', fontSize: 11, color: INK },
  link: { color: WINE, textDecoration: 'underline' },
});

type MdBlock = { type: 'h2' | 'h3' | 'p' | 'li' | 'quote' | 'hr'; text?: string };

export const parseMarkdown = (raw: string): MdBlock[] => {
  const blocks: MdBlock[] = [];
  const lines = raw.split(/\r?\n/);
  let paraBuf: string[] = [];
  const flushPara = () => { if (paraBuf.length) { blocks.push({ type: 'p', text: paraBuf.join(' ').trim() }); paraBuf = []; } };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushPara(); continue; }
    if (/^#{3,}\s+/.test(line)) { flushPara(); blocks.push({ type: 'h3', text: line.replace(/^#{3,}\s+/, '') }); continue; }
    if (/^##\s+/.test(line))    { flushPara(); blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '') }); continue; }
    if (/^#\s+/.test(line))     { flushPara(); blocks.push({ type: 'h2', text: line.replace(/^#\s+/, '') }); continue; }
    if (/^[-*]\s+/.test(line))  { flushPara(); blocks.push({ type: 'li', text: line.replace(/^[-*]\s+/, '') }); continue; }
    if (/^\d+\.\s+/.test(line)) { flushPara(); blocks.push({ type: 'li', text: line.replace(/^\d+\.\s+/, '') }); continue; }
    if (/^>\s+/.test(line))     { flushPara(); blocks.push({ type: 'quote', text: line.replace(/^>\s+/, '') }); continue; }
    if (/^-{3,}$/.test(line))   { flushPara(); blocks.push({ type: 'hr' }); continue; }
    paraBuf.push(line);
  }
  flushPara();
  return blocks;
};

export const renderInline = (text: string) => {
  const cleaned = text.replace(/"([^"]+)"/g, '');
  const parts = cleaned.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((seg, i) => {
    if (/^\*\*[^*]+\*\*$/.test(seg)) return <Text key={i} style={{ fontWeight: 700 }}>{seg.slice(2, -2)}</Text>;
    if (/^\*[^*]+\*$/.test(seg)) return <Text key={i} style={{ fontStyle: 'italic' }}>{seg.slice(1, -1)}</Text>;
    return <Text key={i}>{seg}</Text>;
  });
};

interface VideoaulaPdfDocumentProps {
  video: { titulo: string; url: string; canal: string; videoId: string } | null;
  resumo: string;
  artigoNumero: string;
  tabelaNome: string;
  textoArtigoCompleto: string;
}

export const VideoaulaPdfDocument = ({ video, resumo, artigoNumero, tabelaNome, textoArtigoCompleto }: VideoaulaPdfDocumentProps) => {
  const blocks = parseMarkdown(resumo);
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const shortTitle = (video?.titulo || artigoNumero).slice(0, 55);
  const videoUrl = video?.videoId ? "https://youtube.com/watch?v=" : (video?.url || '');

  const Watermark = () => <PdfImage src={LOGO_URL} style={pdfStyles.watermark} fixed />;
  const Header = () => (
    <View style={pdfStyles.header} fixed>
      <Text>OAB NA RISCA · VADE MECUM 2026</Text>
      <Text>{shortTitle}</Text>
    </View>
  );
  const Footer = () => (
    <View style={pdfStyles.footer} fixed>
      <Text>{artigoNumero} — {tabelaNome}</Text>
      <Text render={({ pageNumber, totalPages }) => "Página  de "} />
    </View>
  );

  const renderBlock = (b: MdBlock, i: number) => {
    switch (b.type) {
      case 'h2': return <Text key={i} style={pdfStyles.h2}>{(b.text || '').toUpperCase()}</Text>;
      case 'h3': return <Text key={i} style={pdfStyles.h3}>{renderInline(b.text || '')}</Text>;
      case 'li': return (
        <View key={i} style={pdfStyles.bulletRow} wrap={false}>
          <Text style={pdfStyles.bulletDot}>•</Text>
          <Text style={pdfStyles.bulletText}>{renderInline(b.text || '')}</Text>
        </View>
      );
      case 'quote': return <Text key={i} style={pdfStyles.quote}>{renderInline(b.text || '')}</Text>;
      case 'hr': return <View key={i} style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 10 }} />;
      case 'p':
      default: return <Text key={i} style={pdfStyles.paragraph}>{renderInline(b.text || '')}</Text>;
    }
  };

  return (
    <Document title={"Resumo — "} author="OAB na Risca">
      <Page size="A4" style={pdfStyles.coverPage}>
        <View style={pdfStyles.coverContainer}>
          <View style={pdfStyles.coverBand} fixed />
          <PdfImage src={LOGO_URL} style={pdfStyles.coverLogo} />
          <Text style={pdfStyles.coverBrand}>OAB NA RISCA</Text>
          <Text style={pdfStyles.coverKicker}>Vade Mecum 2026 · Resumo de Videoaula</Text>
          <Text style={pdfStyles.coverTitle}>{video?.titulo || 'Videoaula'}</Text>
          <View style={pdfStyles.coverDivider} />
          <Text style={pdfStyles.coverSubject}>{artigoNumero} — {tabelaNome}</Text>
          <Text style={pdfStyles.coverMeta}>Canal: {video?.canal || '—'}</Text>
          <Text style={pdfStyles.coverMeta}>Data de geração: {dateStr}</Text>
          <View style={pdfStyles.coverFooter} fixed>
            <Text>DOCUMENTO DE ESTUDO</Text>
            <Text>{dateStr.toUpperCase()}</Text>
          </View>
          <View style={pdfStyles.coverBandBottom} fixed />
        </View>
      </Page>
      <Page size="A4" style={pdfStyles.page}>
        <Watermark />
        <Header />
        <Text style={pdfStyles.pageTitle}>TEXTO DO ARTIGO</Text>
        <View style={pdfStyles.pageTitleBar} />
        <View style={pdfStyles.articleBox}>
          <Text style={pdfStyles.articleNumber}>{artigoNumero} — {tabelaNome}</Text>
          <Text style={pdfStyles.articleText}>{textoArtigoCompleto || 'Texto do artigo não disponível.'}</Text>
        </View>
        <Footer />
      </Page>
      <Page size="A4" style={pdfStyles.page}>
        <Watermark />
        <Header />
        <Text style={pdfStyles.pageTitle}>RESUMO DA AULA</Text>
        <View style={pdfStyles.pageTitleBar} />
        {blocks.map((b, i) => renderBlock(b, i))}
        <Footer />
      </Page>
      <Page size="A4" style={pdfStyles.page}>
        <Watermark />
        <Header />
        <Text style={pdfStyles.pageTitle}>FONTES E REFERÊNCIAS</Text>
        <View style={pdfStyles.pageTitleBar} />
        <View style={pdfStyles.sourceRow}>
          <Text style={pdfStyles.sourceLabel}>VIDEOAULA</Text>
          <Text style={pdfStyles.sourceValue}>{video?.titulo || '—'}</Text>
        </View>
        <View style={pdfStyles.sourceRow}>
          <Text style={pdfStyles.sourceLabel}>CANAL</Text>
          <Text style={pdfStyles.sourceValue}>{video?.canal || '—'}</Text>
        </View>
        {videoUrl && (
          <View style={pdfStyles.sourceRow}>
            <Text style={pdfStyles.sourceLabel}>LINK DO VÍDEO</Text>
            <Text style={[pdfStyles.sourceValue, pdfStyles.link]}>{videoUrl}</Text>
          </View>
        )}
        <View style={pdfStyles.sourceRow}>
          <Text style={pdfStyles.sourceLabel}>BASE LEGAL</Text>
          <Text style={pdfStyles.sourceValue}>{artigoNumero} — {tabelaNome}</Text>
        </View>
        <View style={pdfStyles.sourceRow}>
          <Text style={pdfStyles.sourceLabel}>GERADO EM</Text>
          <Text style={pdfStyles.sourceValue}>{dateStr}</Text>
        </View>
        <View style={{ marginTop: 30, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#d8d1c4' }}>
          <Text style={{ fontSize: 9, color: MUTED, fontStyle: 'italic', lineHeight: 1.5 }}>
            Este resumo foi gerado por inteligência artificial com base na transcrição da videoaula acima, apenas para fins de estudo. Consulte sempre a legislação vigente e materiais oficiais.
          </Text>
        </View>
        <Footer />
      </Page>
    </Document>
  );
};

