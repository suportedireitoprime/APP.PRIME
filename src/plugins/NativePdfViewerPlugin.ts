import { Capacitor, registerPlugin } from '@capacitor/core';

export interface OpenPdfOptions {
  url: string;
  title?: string;
  initialPage?: number;
  isDarkMode?: boolean;
}

export interface NativePdfViewerPluginInterface {
  openPdf(options: OpenPdfOptions): Promise<{ success: boolean; lastPage?: number }>;
}

const RawNativePdfViewer = registerPlugin<NativePdfViewerPluginInterface>('NativePdfViewer');

export const NativePdfViewer = {
  isAvailable: () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('NativePdfViewer'),

  async openPdf(options: OpenPdfOptions): Promise<{ success: boolean; lastPage?: number }> {
    if (!this.isAvailable()) {
      return { success: false };
    }
    return RawNativePdfViewer.openPdf(options);
  },
};

export default NativePdfViewer;
