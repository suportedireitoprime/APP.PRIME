import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2, Headphones, UploadCloud, CheckCircle2, AlertCircle, Copy, Link, AlignLeft, Network } from 'lucide-react';
import { toast } from 'sonner';
import { copiar } from '@/lib/nativo/copiar';
import { CustomAudioPlayer } from '@/components/vademecum/media/CustomAudioPlayer';
import GrafoOverlay from '@/components/vademecum/overlays/GrafoOverlay';
import { SelectedItemType } from './pilulasConstants';

interface PilulaUploadSheetProps {
  selectedItem: SelectedItemType | null;
  onClose: () => void;
  uploadingId: number | string | null;
  transcribingId: number | string | null;
  onUploadAudio: (item: SelectedItemType, file: File) => void;
  onTranscribeAudio: (item: SelectedItemType) => void;
}

export const PilulaUploadSheet: React.FC<PilulaUploadSheetProps> = ({
  selectedItem,
  onClose,
  uploadingId,
  transcribingId,
  onUploadAudio,
  onTranscribeAudio,
}) => {
  const [grafoPreviewOpen, setGrafoPreviewOpen] = useState(false);

  const copyToClipboard = (text: string, successMsg: string) => {
    void copiar(text, successMsg);
  };

  if (!selectedItem) return null;

  const currentId = selectedItem.type === 'livro' 
    ? selectedItem.data.livro.id 
    : selectedItem.data.id;

  const audioUrl = selectedItem.type === 'livro' 
    ? selectedItem.data.livro.audioResumoUrl 
    : selectedItem.type === 'artigo' 
      ? selectedItem.data.audio_pilula_url 
      : selectedItem.data.diversos?.audio_pilula_url;

  return (
    <>
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="rounded-t-[32px] p-6 max-h-[95vh] overflow-y-auto">
          <div className="space-y-6 pt-2 pb-6 max-w-lg mx-auto">
            <SheetHeader className="text-left space-y-0">
              <SheetTitle className="text-2xl font-bold">Pílula em Áudio</SheetTitle>
              <p className="text-muted-foreground text-sm">
                {selectedItem.type === 'livro' 
                  ? 'Gerencie o áudio da pílula para este clássico.' 
                  : selectedItem.type === 'artigo'
                    ? 'Gerencie o áudio da pílula para este artigo.'
                    : 'Gerencie o áudio da pílula para este ministro.'}
              </p>
            </SheetHeader>

            {/* Informações Visuais (Livro vs Artigo vs Ministro) */}
            {selectedItem.type === 'livro' ? (
              <div className="flex gap-5 bg-muted/30 p-4 rounded-2xl border border-border">
                <div className="w-20 h-28 rounded-lg bg-muted overflow-hidden shrink-0 shadow-sm">
                  {selectedItem.data.livro.capa ? (
                    <img src={selectedItem.data.livro.capa} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2 leading-tight">
                      Sem Capa
                    </div>
                  )}
                </div>
                <div className="flex-1 py-1 flex flex-col justify-center min-w-0">
                  <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-2">
                    {selectedItem.data.livro.titulo}
                  </h3>
                  {selectedItem.data.livro.autor && (
                    <p className="text-muted-foreground mt-1 text-sm truncate">{selectedItem.data.livro.autor}</p>
                  )}
                </div>
              </div>
            ) : selectedItem.type === 'artigo' ? (
              <div className="bg-muted/30 p-5 rounded-2xl border border-border text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground text-2xl leading-tight">
                  {selectedItem.data.numero}
                </h3>
                <p className="text-muted-foreground mt-1 text-sm font-semibold">{selectedItem.data.lei_nome || 'Código Penal'}</p>
              </div>
            ) : (
              <div className="bg-muted/30 p-5 rounded-2xl border border-border flex items-center gap-4">
                <div className="w-16 h-20 rounded-lg bg-muted overflow-hidden shrink-0 shadow-sm border border-border">
                  {selectedItem.data.foto_url ? (
                    <img src={selectedItem.data.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-1">
                      Sem Foto
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-lg leading-tight line-clamp-1">
                    {selectedItem.data.nome}
                  </h3>
                  {selectedItem.data.nome_completo && (
                    <p className="text-muted-foreground text-sm truncate">{selectedItem.data.nome_completo}</p>
                  )}
                </div>
              </div>
            )}

            {/* Botões de Ação para Livros */}
            {selectedItem.type === 'livro' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-center rounded-xl text-xs h-10 px-2"
                  onClick={() => copyToClipboard(selectedItem.data.livro.titulo, 'Título copiado!')}
                >
                  <Copy className="w-3.5 h-3.5 mr-2 shrink-0" /> <span className="truncate">Copiar Título</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-center rounded-xl text-xs h-10 px-2"
                  onClick={() => {
                    const linkPdf = selectedItem.data.livro.link || selectedItem.data.livro.download || '';
                    if (linkPdf) {
                      copyToClipboard(linkPdf, 'Link do Drive/PDF copiado!');
                    } else {
                      toast.error('Nenhum link encontrado para esta obra.');
                    }
                  }}
                >
                  <Link className="w-3.5 h-3.5 mr-2 shrink-0" /> <span className="truncate">Copiar Link</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-center rounded-xl text-xs h-10 px-2"
                  onClick={() => {
                    const promptText = `Você deve explicar o livro todo capítulo por capítulo passando a importância para o estudante de direito ler, explicando o que o autor quis dizer, qual a obra... bem detalhado explicando os conceitos. Livro: ${selectedItem.data.livro.titulo} - ${selectedItem.data.livro.autor || 'Autor Desconhecido'}`;
                    copyToClipboard(promptText, 'Prompt copiado!');
                  }}
                >
                  <Copy className="w-3.5 h-3.5 mr-2 shrink-0" /> <span className="truncate">Copiar Prompt</span>
                </Button>
              </div>
            )}

            {/* Status do Áudio */}
            <div className="space-y-2">
              <h4 className="font-semibold text-[13px] uppercase tracking-wider text-muted-foreground">Status Atual</h4>
              {audioUrl ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2 text-green-500 shrink-0 mb-2 sm:mb-0">
                    <CheckCircle2 className="w-5 h-5" />
                    <p className="font-bold text-sm">Pílula Concluída (OK!)</p>
                  </div>
                  <div className="w-full flex-1">
                    <CustomAudioPlayer src={audioUrl} title="Ouvir Pílula" />
                  </div>
                </div>
              ) : (
                <div className="bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-xl p-3 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-semibold text-sm">Nenhuma pílula enviada ainda</p>
                </div>
              )}
            </div>

            {/* Instruções da Intro */}
            <div className="space-y-3 pt-2">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Headphones className="w-4 h-4" /> Instruções de Edição (Intro)
              </h4>
              <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3 shadow-sm">
                <div className="text-sm text-foreground space-y-1.5">
                  <p><strong>1.</strong> Toque a música abaixo até os <strong>7 segundos</strong>.</p>
                  <p><strong>2.</strong> A partir do <strong>segundo 8</strong> a voz já entra e o volume da música começa a diminuir.</p>
                  <p><strong>3.</strong> Aos <strong>10 segundos</strong> a música para completamente.</p>
                </div>
                <div className="pt-2">
                  <CustomAudioPlayer src="https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/audios/intros/secret-agent-groove.mp3" title="Música de Intro" />
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="pt-2 space-y-3">
              <div className="relative">
                <input
                  type="file"
                  accept="audio/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  disabled={uploadingId === currentId}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      onUploadAudio(selectedItem, e.target.files[0]);
                      e.target.value = ''; // Reset
                    }
                  }}
                />
                <Button
                  size="lg"
                  className="w-full text-base h-14 rounded-xl"
                  disabled={uploadingId === currentId}
                >
                  {uploadingId === currentId ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <UploadCloud className="w-5 h-5 mr-2" />
                  )}
                  {audioUrl 
                    ? 'Substituir Pílula Atual' 
                    : 'Selecionar e Enviar Pílula'}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Formatos suportados: MP3, M4A, WAV
              </p>

              {/* Transcrição de Áudio apenas para Livros */}
              {selectedItem.type === 'livro' && selectedItem.data.livro.audioResumoUrl && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-base h-14 rounded-xl mt-4 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  disabled={transcribingId === selectedItem.data.livro.id}
                  onClick={() => onTranscribeAudio(selectedItem)}
                >
                  {transcribingId === selectedItem.data.livro.id ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Headphones className="w-5 h-5 mr-2" />
                  )}
                  {selectedItem.data.livro.transcricaoAudio ? 'Regerar Transcrição com IA' : 'Transcrever Pílula com IA'}
                </Button>
              )}

              {/* Transcrição e Grafo para Artigos do CP */}
              {selectedItem.type === 'artigo' && selectedItem.data.audio_pilula_url && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full text-base h-14 rounded-xl mt-4 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                  disabled={transcribingId === selectedItem.data.id}
                  onClick={() => onTranscribeAudio(selectedItem)}
                >
                  {transcribingId === selectedItem.data.id ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Headphones className="w-5 h-5 mr-2" />
                  )}
                  {selectedItem.data.audio_grafo ? 'Regerar Transcrição e Grafo' : 'Transcrever Pílula e Gerar Grafo'}
                </Button>
              )}
              
              {/* Visualização de Transcrição e Grafo */}
              {selectedItem.type === 'artigo' && selectedItem.data.audio_transcricao && (
                <div className="pt-6 space-y-4">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-emerald-500" /> Transcrição Gerada
                  </h4>
                  <div className="p-4 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedItem.data.audio_transcricao}
                  </div>
                  
                  {selectedItem.data.audio_grafo && (
                    <>
                      <div className="flex items-center justify-between mt-4">
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                          <Network className="w-4 h-4 text-emerald-500" /> Grafo de Conexões
                        </h4>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => setGrafoPreviewOpen(true)}
                        >
                          Ver Grafo Interativo
                        </Button>
                      </div>
                      <div className="p-4 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-48 overflow-y-auto overflow-x-auto custom-scrollbar">
                        {JSON.stringify(selectedItem.data.audio_grafo, null, 2)}
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedItem.type === 'livro' && selectedItem.data.livro.transcricaoAudio && (
                <div className="pt-6 space-y-4">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-emerald-500" /> Transcrição Gerada
                  </h4>
                  <div className="p-4 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedItem.data.livro.transcricaoAudio}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Visualizador de Grafo Modal */}
      {selectedItem?.type === 'artigo' && (
        <GrafoOverlay
          open={grafoPreviewOpen}
          onClose={() => setGrafoPreviewOpen(false)}
          tabelaNome="vade_mecum_artigos"
          artigoNumero={selectedItem.data.numero}
          leiNome={selectedItem.data.lei_nome || "Código Penal"}
          preloadedGraphData={selectedItem.data.audio_grafo}
        />
      )}
    </>
  );
};
