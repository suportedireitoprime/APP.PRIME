import { pdf } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#030712',
    padding: 10,
    paddingTop: 28,
    paddingBottom: 20,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: '#030712',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#EAB308',
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#B4B4B4',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 4,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: '#787878',
  },
  image: {
    width: '100%',
  },
});

interface MindMapDocProps {
  leiNome: string;
  artigo: string;
  slices: string[];
  destH: number;
}

const MindMapDoc: React.FC<MindMapDocProps> = ({ leiNome, artigo, slices, destH }) => (
  <Document>
    {slices.map((sliceData, i) => (
      <Page key={i} size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.headerTitle}>{leiNome}</Text>
          <Text style={styles.headerSubtitle}>{artigo} — Mapa Mental</Text>
        </View>

        <Image src={sliceData} style={[styles.image, { height: destH }]} />

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Direito Prime — Mapa Mental</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
            `${pageNumber}/${totalPages}`
          )} />
        </View>
      </Page>
    ))}
  </Document>
);

export async function exportMindMapPdf(
  element: HTMLElement,
  leiNome: string,
  artigo: string
) {
  const toastId = toast.loading('Gerando PDF...');

  try {
    const imgData = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: '#030712',
    });

    const imgW = element.offsetWidth * 2;
    const imgH = element.offsetHeight * 2;

    // A4 dimensions at 72 DPI are ~595x842. In mm: 210x297
    // react-pdf uses points (1 pt = 1/72 inch). 
    // A4: 595.28 x 841.89 points
    const pageW = 595.28;
    const pageH = 841.89;
    const margin = 28.34; // 10mm ~ 28.34pt
    const headerH = 51; // 18mm ~ 51pt
    const footerH = 28; // 10mm ~ 28pt
    const contentW = pageW - margin * 2;
    const contentH = pageH - headerH - footerH - margin;

    const ratio = contentW / (imgW / 2); // scale:2 so divide
    const scaledH = (imgH / 2) * ratio;

    const slices: string[] = [];
    let destH = scaledH;

    if (scaledH <= contentH) {
      slices.push(imgData);
    } else {
      const sliceHeightPx = (contentH / ratio) * 2; 
      const totalPages = Math.ceil(imgH / sliceHeightPx);

      const img = new window.Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });

      for (let i = 0; i < totalPages; i++) {
        const srcY = i * sliceHeightPx;
        const srcH = Math.min(sliceHeightPx, imgH - srcY);
        if (i === 0) {
          destH = (srcH / 2) * ratio;
        }

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = imgW;
        sliceCanvas.height = srcH;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.drawImage(img, 0, srcY, imgW, srcH, 0, 0, imgW, srcH);
        slices.push(sliceCanvas.toDataURL('image/png'));
      }
    }

    const doc = React.createElement(MindMapDoc, {
      leiNome,
      artigo,
      slices,
      destH
    });

    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();

    const fileName = `mapa-mental-${artigo.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    toast.success('PDF exportado!', { id: toastId });
  } catch (err) {
    console.error(err);
    toast.error('Erro ao gerar PDF', { id: toastId });
  }
}
