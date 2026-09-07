import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { BasePdfLayout } from './BasePdfLayout';

export type ArtigoPdfModo = 'lei-seca' | 'completo';

export interface ArtigoPdfInput {
  leiLabel: string;          // "CP — Código Penal"
  numero: string;            // "1º"
  caput: string;
  incisos?: string[];
  paragrafos?: string[];
  modo: ArtigoPdfModo;
  explicacao?: string;
  exemplo?: string;
  historico?: { ano: number; texto: string }[];
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
  yellowLine: {
    width: 28,
    height: 1.2,
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
  sectionLine: {
    height: 0.4,
    width: '100%',
    backgroundColor: '#EBECF0',
  },
});

function stripMd(text: string): string {
  if (!text) return '';
  return text
    .replace(/---SECAO---|---EXEMPLO---/g, '\n\n')
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface ArtigoPdfDocProps {
  data: ArtigoPdfInput;
  logoSrc?: string;
  watermarkSrc?: string;
}

export const ArtigoPdfDoc: React.FC<ArtigoPdfDocProps> = ({ data, logoSrc, watermarkSrc }) => {
  const docType = data.modo === 'lei-seca' ? 'Artigo (lei seca)' : 'Artigo comentado';

  const renderSection = (title: string, text: string) => {
    if (!text) return null;
    const paragraphs = stripMd(text).split(/\n\s*\n/);
    return (
      <View wrap={false}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
          <View style={styles.sectionLine} />
        </View>
        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>{p}</Text>
        ))}
      </View>
    );
  };

  return (
    <BasePdfLayout
      title={`Art. ${data.numero}`}
      subTitle={data.leiLabel}
      docType={docType}
      logoSrc={logoSrc}
      watermarkSrc={watermarkSrc}
    >
      <Text style={styles.title}>Art. {data.numero}</Text>
      <Text style={styles.subtitle}>{data.leiLabel}</Text>
      <View style={styles.yellowLine} />

      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>TEXTO DO ARTIGO</Text>
        <View style={styles.sectionLine} />
      </View>
      <Text style={styles.paragraph}>{data.caput}</Text>
      {data.incisos?.map((t, i) => (
        <Text key={`inciso-${i}`} style={styles.paragraph}>{t}</Text>
      ))}
      {data.paragrafos?.map((t, i) => (
        <Text key={`paragrafo-${i}`} style={styles.paragraph}>{t}</Text>
      ))}

      {data.modo === 'completo' && (
        <>
          {renderSection('Explicação', data.explicacao || '')}
          {renderSection('Exemplo prático', data.exemplo || '')}
          
          {data.historico && data.historico.length > 0 && (
            <View wrap={false}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>HISTÓRICO DE ALTERAÇÕES</Text>
                <View style={styles.sectionLine} />
              </View>
              {data.historico.map((h, i) => {
                const prefix = h.ano > 0 ? `${h.ano} — ` : '';
                return <Text key={`hist-${i}`} style={styles.paragraph}>{`${prefix}${h.texto}`}</Text>;
              })}
            </View>
          )}
        </>
      )}
    </BasePdfLayout>
  );
};
