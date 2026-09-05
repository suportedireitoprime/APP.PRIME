import React from "react";
import { NotebookText } from "lucide-react";

export const ResumosDesktopEmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0D0D0D]/60 backdrop-blur-sm z-0 relative p-8 text-center">
      <NotebookText className="w-24 h-24 text-white/5 mb-6" strokeWidth={1} />
      <h3 className="font-display text-[28px] font-bold text-white mb-2">Resumos Jurídicos</h3>
      <p className="text-zinc-500 max-w-md">
        Selecione uma área à esquerda para explorar os temas, e aprofunde seus estudos de forma
        estruturada e eficiente.
      </p>
    </div>
  );
};
