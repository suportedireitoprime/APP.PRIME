import React from 'react';
import { Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { BasePdfLayout } from './BasePdfLayout';

export interface JurisPdfInput {
  tribunal: string;
  categoria: string;
  situacao?: string | null;
  titulo: string;
  descricao?: string;
  numeroProcesso?: string;
  tese?: string;
  ementa?: string;
  urlOrigem?: string;
  leiLabel?: string;
  modo?: 'tese' | 'ementa' | 'ambos';
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E1E22',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#5A5C62',
    marginBottom: 6,
  },
  processo: {
    fontSize: 9.5,
    fontFamily: 'Courier',
    color: '#5A5C62',
    marginBottom: 6,
  },
  yellowLine: {
    width: 30,
    height: 1.4,
    backgroundColor: '#EFE039',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 11,
    color: '#1E1E22',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  sectionTitleContainer: {
    marginTop: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2D2D30',
    marginBottom: 4,
  },
  sectionLineOuter: {
    flexDirection: 'row',
  },
  sectionLineYellow: {
    height: 0.6,
    width: 22,
    backgroundColor: '#EFE039',
  },
  sectionLineGray: {
    height: 0.3,
    flex: 1,
    backgroundColor: '#EBECF0',
    marginTop: 0.15,
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 4,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  chipText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  linkSection: {
    marginTop: 14,
  },
  linkTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2D2D30',
    marginBottom: 4,
  },
  linkText: {
    fontSize: 9.5,
    color: '#2563EB', // blue-600
    textDecoration: 'none',
  },
});

interface JurisPdfDocProps {
  data: JurisPdfInput;
  coverArtSrc?: string;
  watermarkSrc?: string;
}

export const JurisPdfDoc: React.FC<JurisPdfDocProps> = ({ data, coverArtSrc, watermarkSrc }) => {
  const tribColorBg = data.tribunal === 'STF' ? '#2563EB' : data.tribunal === 'STJ' ? '#16A34A' : '#2A2A30';
  const tribColorFg = '#FFFFFF';

  const renderSection = (title: string, text: string) => {
    if (!text) return null;
    const paragraphs = text.split(/\n\s*\n|\r\n\r\n/);
    return (
      <View wrap={false}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
          <View style={styles.sectionLineOuter}>
            <View style={styles.sectionLineYellow} />
            <View style={styles.sectionLineGray} />
          </View>
        </View>
        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>{p.trim()}</Text>
        ))}
      </View>
    );
  };

  const modo = data.modo || 'ambos';

  return (
    <BasePdfLayout
      title={data.titulo || 'Jurisprudência'}
      subTitle={[data.tribunal, data.categoria, data.leiLabel].filter(Boolean).join(' • ')}
      docType="Jurisprudência"
      watermarkSrc={watermarkSrc}
      logoSrc={coverArtSrc} // reusing logo slot for cover art
    >
      <View style={styles.chipContainer}>
        <View style={[styles.chip, { backgroundColor: tribColorBg }]}>
          <Text style={[styles.chipText, { color: tribColorFg }]}>{data.tribunal}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[styles.chipText, { color: '#1F2937' }]}>{data.categoria}</Text>
        </View>
        {data.situacao && (
          <View style={[styles.chip, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.chipText, { color: '#166534' }]}>{data.situacao}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{data.titulo || 'Jurisprudência'}</Text>
      
      {data.leiLabel && <Text style={styles.subtitle}>{data.leiLabel}</Text>}
      {data.numeroProcesso && <Text style={styles.processo}>{data.numeroProcesso}</Text>}
      
      <View style={styles.yellowLine} />

      {data.descricao && (
        <Text style={styles.paragraph}>{data.descricao}</Text>
      )}

      {(modo === 'tese' || modo === 'ambos') && data.tese && (
        renderSection('Tese', data.tese)
      )}
      
      {(modo === 'ementa' || modo === 'ambos') && data.ementa && data.ementa !== data.tese && (
        renderSection('Ementa', data.ementa)
      )}

      {data.urlOrigem && (
        <View style={styles.linkSection} wrap={false}>
          <Text style={styles.linkTitle}>Fonte oficial</Text>
          <Link src={data.urlOrigem} style={styles.linkText}>
            {data.urlOrigem}
          </Link>
        </View>
      )}
    </BasePdfLayout>
  );
};
