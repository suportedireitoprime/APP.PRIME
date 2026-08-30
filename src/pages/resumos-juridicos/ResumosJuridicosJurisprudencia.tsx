import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Gavel, Construction } from "lucide-react";

export default function ResumosJuridicosJurisprudencia() {
  const { categoria } = useParams();
  const navigate = useNavigate();

  // Formata o nome para ficar apresentável
  const title = categoria?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Jurisprudência";

  return (
    <div className="min-h-[100dvh] bg-[#0D0D0D] text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-white/10 pt-[var(--sai-top)]">
        <div className="flex items-center h-16 px-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="font-display font-bold text-lg text-white">Resumo de Súmulas</h1>
            <p className="text-xs text-white/60 font-body">{title}</p>
          </div>
        </div>
      </header>

      {/* Conteúdo Placeholder */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center pb-32">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Construction className="w-10 h-10 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-3">Em Desenvolvimento</h2>
        <p className="text-muted-foreground font-body text-sm max-w-sm mx-auto leading-relaxed">
          A seção de Resumos Inteligentes (Conceitos, Cornell e Feynman) para Súmulas e Informativos está sendo construída e estará disponível em breve.
        </p>
        
        <button
          onClick={() => navigate(-1)}
          className="mt-8 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold font-display text-sm active:scale-95 transition-transform"
        >
          Voltar para Matérias
        </button>
      </main>
    </div>
  );
}
