import React from 'react';
import { Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { BasePdfLayout } from './BasePdfLayout';

export interface PeticaoPdfInput {
  titulo: string;
  areaDireito?: string;
  peca: string;
  fontes?: Array<{ label: string; url?: string }>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E1E22',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: '#5A5C62',
    marginBottom: 16,
    textAlign: 'center',
  },
  h2Container: {
    marginTop: 14,
    marginBottom: 6,
  },
  h2Text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1B20', // GRAY_900
    marginBottom: 4,
  },
  h2Line: {
    width: 26,
    height: 1,
    backgroundColor: '#EFE039',
  },
  paragraph: {
    marginTop: 6,
    marginBottom: 8,
    marginLeft: 6, // Identação do parágrafo
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  textNormal: {
    fontSize: 11,
    color: '#1E1E22',
  },
  textBold: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E1E22',
  },
  textLink: {
    fontSize: 11,
    color: '#2563EB',
    textDecoration: 'none',
  },
  fontesSection: {
    marginTop: 18,
  },
  fonteItem: {
    marginTop: 6,
  },
  fonteLabel: {
    fontSize: 10,
    color: '#1E1E22',
  },
  fonteUrl: {
    fontSize: 10,
    color: '#2563EB',
    textDecoration: 'none',
    marginLeft: 4,
  },
});

type Segment = { text: string; url?: string; bold?: boolean };

function tokenize(s: string): Segment[] {
  const out: Segment[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    if (m[1] !== undefined) {
      out.push({ text: m[1], url: m[2] });
    } else if (m[3] !== undefined) {
      out.push({ text: m[3], bold: true });
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out.length ? out : [{ text: s }];
}

function parseMarkdown(md: string): Array<{ type: 'h2' | 'p'; segments: Segment[] }> {
  const blocks: Array<{ type: 'h2' | 'p'; segments: Segment[] }> = [];
  const lines = md.split(/\r?\n/);
  let buf: string[] = [];
  const flushPara = () => {
    if (!buf.length) return;
    const raw = buf.join(' ').trim();
    if (raw) blocks.push({ type: 'p', segments: tokenize(raw) });
    buf = [];
  };
  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      flushPara();
      continue;
    }
    if (/^##\s+/.test(t) || /^#\s+/.test(t)) {
      flushPara();
      const text = t.replace(/^##?\s+/, '');
      blocks.push({ type: 'h2', segments: tokenize(text) });
      continue;
    }
    buf.push(t);
  }
  flushPara();
  return blocks;
}

interface PeticaoPdfDocProps {
  data: PeticaoPdfInput;
  coverArtSrc?: string;
  watermarkSrc?: string;
}

export const PeticaoPdfDoc: React.FC<PeticaoPdfDocProps> = ({ data, coverArtSrc, watermarkSrc }) => {
  const blocks = parseMarkdown(data.peca);

  return (
    <BasePdfLayout
      title={data.titulo || 'Petição Inicial'}
      subTitle={data.areaDireito || ''}
      docType="Petição Inicial"
      watermarkSrc={watermarkSrc}
      logoSrc={coverArtSrc}
    >
      <Text style={styles.title}>{data.titulo || 'Petição Inicial'}</Text>
      {data.areaDireito && <Text style={styles.subtitle}>{data.areaDireito}</Text>}

      {blocks.map((block, i) => {
        if (block.type === 'h2') {
          const t = block.segments.map((s) => s.text).join('').toUpperCase();
          return (
            <View key={i} style={styles.h2Container} wrap={false}>
              <Text style={styles.h2Text}>{t}</Text>
              <View style={styles.h2Line} />
            </View>
          );
        }

        // Render paragraph segments inline.
        // NOTE: React PDF <Text> supports nesting for inline formatting!
        return (
          <Text key={i} style={styles.paragraph}>
            {block.segments.map((seg, j) => {
              if (seg.url) {
                return <Link key={j} src={seg.url} style={styles.textLink}>{seg.text}</Link>;
              }
              if (seg.bold) {
                return <Text key={j} style={styles.textBold}>{seg.text}</Text>;
              }
              return <Text key={j} style={styles.textNormal}>{seg.text}</Text>;
            })}
          </Text>
        );
      })}

      {data.fontes && data.fontes.length > 0 && (
        <View style={styles.fontesSection} wrap={false}>
          <View style={styles.h2Container}>
            <Text style={styles.h2Text}>FONTES CITADAS</Text>
            <View style={styles.h2Line} />
          </View>
          {data.fontes.map((f, i) => (
            <View key={i} style={styles.fonteItem}>
              <Text style={styles.fonteLabel}>• {f.label}</Text>
              {f.url && (
                <Link src={f.url} style={styles.fonteUrl}>
                  {f.url}
                </Link>
              )}
            </View>
          ))}
        </View>
      )}
    </BasePdfLayout>
  );
};
