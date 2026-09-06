import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Send } from 'lucide-react';

export type ApresentacaoModaisProps = {
  abrirComentarios: boolean;
  setAbrirComentarios: (v: boolean) => void;
  comentarios: { id: string; texto: string; created_at: string }[];
  novoComentario: string;
  setNovoComentario: (v: string) => void;
  enviarComentario: () => void;
  abrirSumario: boolean;
  setAbrirSumario: (v: boolean) => void;
  slides: any[];
  idx: number;
  irPara: (idx: number) => void;
  abrirRoteiro: boolean;
  setAbrirRoteiro: (v: boolean) => void;
  roteiroAtual: string | null;
};

export const ApresentacaoModais: React.FC<ApresentacaoModaisProps> = ({
  abrirComentarios, setAbrirComentarios, comentarios, novoComentario, setNovoComentario, enviarComentario,
  abrirSumario, setAbrirSumario, slides, idx, irPara,
  abrirRoteiro, setAbrirRoteiro, roteiroAtual
}) => {
  return (
    <>
      <Sheet open={abrirComentarios} onOpenChange={setAbrirComentarios}>
        <SheetContent side="bottom" className="h-[70vh] flex flex-col bg-[#111] border-t-zinc-800">
          <SheetHeader><SheetTitle className="text-white">Comentários</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-3">
            {comentarios.length === 0 && <p className="text-sm text-white/50 font-body">Seja o primeiro a comentar.</p>}
            {comentarios.map((c) => (
              <div key={c.id} className="rounded-xl bg-white/5 p-3">
                <p className="text-sm font-body text-white/90">{c.texto}</p>
                <p className="text-[11px] text-white/40 mt-1">{new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pb-[calc(1rem+var(--sai-bottom))]">
            <input
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              placeholder="Escreva um comentário…"
              className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm font-body text-white outline-none focus:bg-white/15 transition-colors"
            />
            <button onClick={enviarComentario} className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center"><Send className="w-5 h-5" /></button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={abrirSumario} onOpenChange={setAbrirSumario}>
        <SheetContent side="bottom" className="h-[70vh] flex flex-col bg-[#111] border-t-zinc-800">
          <SheetHeader><SheetTitle className="text-white">Todos os Slides</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pb-[calc(1rem+var(--sai-bottom))] grid grid-cols-2 gap-3">
            {slides.map((s, i) => (
              <button 
                key={s.slide_index} 
                onClick={() => { irPara(i); setAbrirSumario(false); }}
                className={`text-left rounded-xl overflow-hidden bg-white/5 border-2 ${i === idx ? 'border-primary' : 'border-transparent'}`}
              >
                {s.imagem_url ? <img src={s.imagem_url} alt="" className="w-full aspect-video object-cover" /> : <div className="w-full aspect-video bg-white/10" />}
                <div className="p-2 text-xs font-medium text-white/80">Slide {i + 1}</div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={abrirRoteiro} onOpenChange={setAbrirRoteiro}>
        <SheetContent side="bottom" className="h-[70vh] flex flex-col bg-[#111] border-t-zinc-800">
          <SheetHeader><SheetTitle className="text-white">Roteiro da Narração</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+var(--sai-bottom))] bg-white/5 rounded-xl text-sm leading-relaxed text-white/90 font-body">
            {roteiroAtual || <span className="text-white/40 italic">Nenhum roteiro disponível para este slide.</span>}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
