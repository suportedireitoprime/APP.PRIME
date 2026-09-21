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

// Cores oficiais do app (paleta Direito Prime)
const COLORS = {
  pageBg: '#ffffff',
  headerText: '#1a1a2e',
  subText: '#888888',
  redPrimary: '#E11D48',
  ink: '#333333',
  inkSoft: '#666666',
  boxBg: '#f9fafb',
  border: '#e5e7eb',
  gold: '#B69A5C',
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 45,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: COLORS.pageBg,
  },
  header: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.headerText,
  },
  subtitle: {
    fontSize: 8,
    textAlign: 'center',
    color: COLORS.subText,
    marginBottom: 16,
  },
  sectionBanner: {
    backgroundColor: COLORS.redPrimary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginTop: 14,
    marginBottom: 8,
  },
  sectionBannerText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.8,
  },
  h1: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: COLORS.redPrimary,
    marginBottom: 6,
    marginTop: 12,
  },
  h2: {
    fontSize: 10.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: COLORS.headerText,
    marginBottom: 4,
    marginTop: 10,
  },
  h3: {
    fontSize: 9.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: COLORS.headerText,
    marginBottom: 3,
    marginTop: 8,
  },
  paragraph: {
    fontSize: 9.5,
    color: COLORS.ink,
    lineHeight: 1.5,
    marginBottom: 6,
    textAlign: 'justify',
  },
  quoteBox: {
    backgroundColor: COLORS.boxBg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.redPrimary,
    padding: 8,
    marginTop: 6,
    marginBottom: 6,
    borderRadius: 2,
  },
  quoteText: {
    fontSize: 9,
    fontStyle: 'italic',
    color: COLORS.inkSoft,
    lineHeight: 1.4,
  },
  liContainer: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 4,
  },
  liBullet: {
    width: 10,
    fontSize: 9.5,
    color: COLORS.redPrimary,
  },
  liText: {
    flex: 1,
    fontSize: 9.5,
    color: COLORS.ink,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 7.5,
    color: '#999999',
    textAlign: 'center',
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

  const renderSection = (label: string, content?: string | null, showBanner = true) => {
    if (!content?.trim()) return null;
    const blocos = parseMarkdown(content);
    return (
      <View wrap>
        {showBanner && (
          <View style={styles.sectionBanner} wrap={false}>
            <Text style={styles.sectionBannerText}>{label.toUpperCase()}</Text>
          </View>
        )}
        
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{titulo}</Text>
        <Text style={styles.subtitle}>
          {subtitulo ? `${subtitulo} — ` : ''}Resumo Jurídico — Direito Prime 2026
        </Text>

        {renderSection("Resumo", data.markdown, false)}
        {renderSection("Exemplos Práticos", data.exemplos, true)}
        {renderSection("Termos e Conceitos", data.termos, true)}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Direito Prime — Resumo Jurídico — Página ${pageNumber} de ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};
