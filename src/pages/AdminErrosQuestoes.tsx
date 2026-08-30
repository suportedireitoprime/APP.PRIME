import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

type ErroQuestao = {
  id: string;
  questao_texto: string;
  motivo: string;
  detalhes: string | null;
  status: "pendente" | "resolvido" | "descartado";
  created_at: string;
  user_id: string | null;
};

export default function AdminErrosQuestoes() {
  const [erros, setErros] = useState<ErroQuestao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchErros();
  }, []);

  const fetchErros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("erros_questoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar reportes.");
      console.error(error);
    } else {
      setErros(data as ErroQuestao[]);
    }
    setLoading(false);
  };

  const atualizarStatus = async (id: string, novoStatus: "resolvido" | "descartado") => {
    const supabaseClient = supabase as any;
    const { error } = await supabaseClient
      .from("erros_questoes")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status.");
    } else {
      toast.success(`Status atualizado para ${novoStatus}`);
      setErros((prev) => prev.map((e) => e.id === id ? { ...e, status: novoStatus } : e));
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Painel
            </Link>
            <h1 className="text-3xl font-bold">Erros em Questões</h1>
            <p className="text-zinc-400 mt-2">Gerencie os reportes de erros enviados pelos alunos.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-zinc-500 py-12 animate-pulse">Carregando...</div>
        ) : erros.length === 0 ? (
          <div className="text-center text-zinc-500 py-12 border border-zinc-800 rounded-xl bg-zinc-900/50">
            Nenhum erro reportado ainda.
          </div>
        ) : (
          <div className="grid gap-4">
            {erros.map((erro) => (
              <div key={erro.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={erro.status === "pendente" ? "destructive" : erro.status === "resolvido" ? "default" : "secondary"}>
                      {erro.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      {format(new Date(erro.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Motivo:</span>
                    <p className="font-medium text-lg text-zinc-200 mt-1">{erro.motivo}</p>
                  </div>

                  {erro.detalhes && (
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Detalhes do Aluno:</span>
                      <p className="text-sm text-zinc-300 mt-1">{erro.detalhes}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Enunciado da Questão:</span>
                    <p className="text-sm text-zinc-400 line-clamp-3 hover:line-clamp-none transition-all">{erro.questao_texto}</p>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end md:justify-start">
                  {erro.status === "pendente" && (
                    <>
                      <button
                        onClick={() => atualizarStatus(erro.id, "resolvido")}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-colors text-sm font-medium"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Marcar Resolvido
                      </button>
                      <button
                        onClick={() => atualizarStatus(erro.id, "descartado")}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg transition-colors text-sm font-medium"
                      >
                        <Trash2 className="h-4 w-4" /> Descartar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
