import { baixarBlob } from '@/lib/nativo';
import { pdfStyles, stripMd, type Message } from './assistenteTypes';

/**
 * Gera e baixa o PDF de uma resposta do Chat Jurídico sob demanda,
 * carregando `@react-pdf/renderer` apenas quando o usuário solicita exportação.
 */
export async function exportMessageToPdf(msg: Message): Promise<void> {
  const { pdf, Document, Page, Text: PdfText } = await import('@react-pdf/renderer');

  const doc = (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfText style={pdfStyles.h}>Resposta do Chat</PdfText>
        {stripMd(msg.content)
          .split('\n')
          .map((p, i) => (
            <PdfText key={i} style={pdfStyles.p}>
              {p}
            </PdfText>
          ))}
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  await baixarBlob(blob, 'chat-juridico.pdf', {
    titulo: 'Chat jurídico',
    toastSucesso: false,
  });
}
