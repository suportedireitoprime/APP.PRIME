import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if needed, or rely on defaults.
// @react-pdf/renderer uses Helvetica by default.

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  coverPage: {
    backgroundColor: '#EBECF0', // GRAY_SOFT
    position: 'relative',
    height: '100%',
  },
  coverYellowTop: {
    backgroundColor: '#EFE039', // YELLOW
    height: '55%',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  coverDarkLine: {
    backgroundColor: '#2D2D30', // GRAY_DARK
    height: 4,
    width: '100%',
    position: 'absolute',
    top: '55%',
    left: 0,
  },
  coverContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 120,
    height: '100%',
    zIndex: 10,
  },
  appName: {
    color: '#2D2D30',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 20,
  },
  subCapa: {
    color: '#5A5C62', // GRAY_MID
    fontSize: 11,
    marginTop: 8,
  },
  titleContainer: {
    marginTop: 180,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    color: '#1E1E22', // TEXT
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  leiLabel: {
    color: '#5A5C62',
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  contentPage: {
    padding: 30,
    paddingBottom: 50,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerYellow: {
    height: 18,
    backgroundColor: '#EFE039',
  },
  headerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EBECF0',
  },
  headerAppName: {
    color: '#2D2D30',
    fontSize: 9,
    fontWeight: 'bold',
  },
  headerDocType: {
    color: '#5A5C62',
    fontSize: 9,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EBECF0',
  },
  footerText: {
    color: '#5A5C62',
    fontSize: 8.5,
  },
  watermark: {
    position: 'absolute',
    top: '30%',
    left: '25%',
    width: '50%',
    opacity: 0.06,
  },
  contentBody: {
    marginTop: 30,
  },
});

interface BasePdfLayoutProps {
  title: string;
  subTitle: string;
  docType: string;
  watermarkSrc?: string;
  logoSrc?: string;
  children: React.ReactNode;
}

export const BasePdfLayout: React.FC<BasePdfLayoutProps> = ({
  title,
  subTitle,
  docType,
  watermarkSrc,
  logoSrc,
  children,
}) => {
  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverYellowTop} />
        <View style={styles.coverDarkLine} />
        
        <View style={styles.coverContent}>
          {logoSrc && <Image src={logoSrc} style={{ width: 48, height: 48 }} />}
          <Text style={styles.appName}>Direito Prime — Vade Mecum</Text>
          <Text style={styles.subCapa}>{docType} • Documento gerado pelo app</Text>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.leiLabel}>{subTitle}</Text>
          </View>
        </View>
      </Page>

      {/* Content Pages */}
      <Page size="A4" style={styles.contentPage}>
        {/* Fixed Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerYellow} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerAppName}>Direito Prime — Vade Mecum</Text>
            <Text style={styles.headerDocType}>{subTitle}</Text>
          </View>
        </View>

        {/* Watermark */}
        {watermarkSrc && (
          <Image src={watermarkSrc} style={styles.watermark} fixed />
        )}

        {/* Content */}
        <View style={styles.contentBody}>
          {children}
        </View>

        {/* Fixed Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>https://direitoprime.com.br</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber - 1} de ${totalPages - 1}`
          )} />
        </View>
      </Page>
    </Document>
  );
};
