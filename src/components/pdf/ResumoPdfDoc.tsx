import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

export type ResumoPdfInput = {
  area: string;
  tema: string;
  subtema: string | null;
  markdown: string | null;
  exemplos?: string | null;
  termos?: string | null;
};

// Cores baseadas na paleta wine (Resumos)
const COLORS = {
  paper: '#FDFCFB',
  paperAlt: '#F5F3F0',
  ink: '#1A1817',
  inkSoft: '#4A4644',
  wine: '#82132D',
  wineDeep: '#4A0B1A',
  wineSoft: '#FAF5F6',
  gold: '#B69A5C',
  line: '#EAE6E1',
  white: '#FFFFFF',
  graphite: '#16161A',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.paper,
    fontFamily: 'Helvetica',
  },
  coverPage: {
    backgroundColor: COLORS.graphite,
    position: 'relative',
    height: '100%',
  },
  coverWineLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 6,
    backgroundColor: COLORS.wine,
  },
  coverHeader: {
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  coverLabel: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.4,
    marginBottom: 40,
  },
  coverTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    lineHeight: 1.2,
  },
  coverSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
  },
  contentPage: {
    padding: 30,
    paddingBottom: 50,
  },
  h1: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.wine,
    marginBottom: 8,
    marginTop: 14,
  },
  h2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.wine,
    marginBottom: 6,
    marginTop: 12,
  },
  h3: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.wine,
    marginBottom: 4,
    marginTop: 10,
  },
  paragraph: {
    fontSize: 10.5,
    color: COLORS.ink,
    lineHeight: 1.5,
    marginBottom: 6,
    textAlign: 'justify',
  },
  quoteBox: {
    backgroundColor: COLORS.wineSoft,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.wine,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: COLORS.wineDeep,
    lineHeight: 1.5,
  },
  liContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  liBullet: {
    width: 10,
    fontSize: 10.5,
    color: COLORS.gold,
  },
  liText: {
    flex: 1,
    fontSize: 10.5,
    color: COLORS.ink,
    lineHeight: 1.5,
  },
  sectionBanner: {
    backgroundColor: COLORS.wine,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionBannerText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: COLORS.paperAlt,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 16,
    paddingHorizontal: 30,
  },
  footerApp: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.wine,
    textAlign: 'right',
  },
  footerDesc: {
    fontSize: 7.5,
    fontStyle: 'italic',
    color: COLORS.inkSoft,
    textAlign: 'right',
    marginTop: 2,
  },
  footerLeftGroup: {
    position: 'absolute',
    left: 30,
    top: 16,
  },
  footerDocTitle: {
    fontSize: 8,
    color: COLORS.inkSoft,
  },
  footerPageNum: {
    fontSize: 8,
    color: COLORS.inkSoft,
    marginTop: 4,
  },
});

type Bloco = { tipo: 'h1' | 'h2' | 'h3' | 'p' | 'li' | 'quote'; texto: string };

function limpar(t: string) {
  if (!t) return '';
  return t
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function parseMarkdown(md: string): Bloco[] {
  const linhas = md.replace(/\r/g, "").split("\n");
  const blocos: Bloco[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length) {
      blocos.push({ tipo: "p", texto: limpar(buffer.join(" ")) });
      buffer = [];
    }
  };

  for (const raw of linhas) {
    const linha = raw.trim();
    if (!linha) {
      flush();
      continue;
    }
    if (/^###\s+/.test(linha)) {
      flush();
      blocos.push({ tipo: "h3", texto: limpar(linha.replace(/^###\s+/, "")) });
    } else if (/^##\s+/.test(linha)) {
      flush();
      blocos.push({ tipo: "h2", texto: limpar(linha.replace(/^##\s+/, "")) });
    } else if (/^#\s+/.test(linha)) {
      flush();
      blocos.push({ tipo: "h1", texto: limpar(linha.replace(/^#\s+/, "")) });
    } else if (/^>\s?/.test(linha)) {
      flush();
      blocos.push({ tipo: "quote", texto: limpar(linha.replace(/^>\s?/, "")) });
    } else if (/^([-*+]|\d+\.)\s+/.test(linha)) {
      flush();
      blocos.push({ tipo: "li", texto: limpar(linha.replace(/^([-*+]|\d+\.)\s+/, "")) });
    } else if (/^\|/.test(linha)) {
      flush();
      const celulas = linha
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (celulas.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      blocos.push({ tipo: "p", texto: limpar(celulas.join("  •  ")) });
    } else {
      buffer.push(linha);
    }
  }
  flush();
  return blocos;
}

interface ResumoPdfDocProps {
  data: ResumoPdfInput;
}

export const ResumoPdfDoc: React.FC<ResumoPdfDocProps> = ({ data }) => {
  const titulo = data.subtema || data.tema || "Resumo";
  const subtitulo = [data.area, data.tema].filter(Boolean).join(" — ");

  const renderSection = (label: string, content?: string | null) => {
    if (!content?.trim()) return null;
    const blocos = parseMarkdown(content);
    return (
      <View>
        <View style={styles.sectionBanner} wrap={false}>
          <Text style={styles.sectionBannerText}>{label.toUpperCase()}</Text>
        </View>
        
        {blocos.map((b, i) => {
          if (b.tipo === 'h1') return <Text key={i} style={styles.h1}>{b.texto}</Text>;
          if (b.tipo === 'h2') return <Text key={i} style={styles.h2}>{b.texto}</Text>;
          if (b.tipo === 'h3') return <Text key={i} style={styles.h3}>{b.texto}</Text>;
          if (b.tipo === 'quote') {
            return (
              <View key={i} style={styles.quoteBox} wrap={false}>
                <Text style={styles.quoteText}>{b.texto}</Text>
              </View>
            );
          }
          if (b.tipo === 'li') {
            return (
              <View key={i} style={styles.liContainer}>
                <Text style={styles.liBullet}>•</Text>
                <Text style={styles.liText}>{b.texto}</Text>
              </View>
            );
          }
          return <Text key={i} style={styles.paragraph}>{b.texto}</Text>;
        })}
      </View>
    );
  };

  const Footer = () => (
    <View style={styles.footer} fixed>
      <View style={styles.footerLeftGroup}>
        <Text style={styles.footerDocTitle}>{titulo.toUpperCase().slice(0, 60)}</Text>
        <Text style={styles.footerPageNum} render={({ pageNumber }) => (
          String(pageNumber - 1).padStart(2, '0')
        )} />
      </View>
      <Text style={styles.footerApp}>DIREITO PRIME</Text>
      <Text style={styles.footerDesc}>— Estudos Jurídicos</Text>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <View style={styles.coverHeader}>
          <Text style={styles.coverLabel}>RESUMO JURÍDICO</Text>
          <Text style={styles.coverTitle}>{titulo}</Text>
          <Text style={styles.coverSubtitle}>{subtitulo}</Text>
        </View>
        <View style={styles.coverWineLine} />
      </Page>

      <Page size="A4" style={[styles.page, styles.contentPage]}>
        {renderSection("Resumo", data.markdown)}
        {renderSection("Exemplos", data.exemplos)}
        {renderSection("Termos", data.termos)}
        <Footer />
      </Page>
    </Document>
  );
};
